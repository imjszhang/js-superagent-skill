#!/usr/bin/env node
// Host CLI entry: synchronize coordinator knowledge before the native runtime starts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveRuntime, syncKnowledge } from './knowledge.mjs';

export function parseInvocation(argv, cwd = process.cwd()) {
  const args = [...argv];
  let project = cwd;
  const index = args.indexOf('--project');
  if (index >= 0) {
    if (!args[index + 1] || args[index + 1].startsWith('-')) throw Error('--project requires a directory');
    project = path.resolve(args[index + 1]); args.splice(index, 2);
  }
  if (args.some(arg => arg.startsWith('--project'))) throw Error('Use one --project <directory>');
  return { project: fs.realpathSync(project), args };
}
function installOptions(args) {
  const result = {};
  const names = { '--mode': 'mode', '--env-file': 'environmentFile', '--port': 'port', '--log-max-bytes': 'logMaxBytes' };
  for (let i = 0; i < args.length; i += 2) {
    const key = names[args[i]], value = args[i + 1];
    if (!key || !value || value.startsWith('--') || Object.hasOwn(result, key)) throw Error('Unsupported or repeated service install option');
    result[key] = key === 'logMaxBytes' || key === 'port' && value !== 'auto' ? Number(value) : value;
  }
  return result;
}
export async function main(argv = process.argv.slice(2)) {
  if (argv.length === 1 && ['--help', '-h'].includes(argv[0])) {
    console.log('project-agent.mjs --project <root> <js-superagent command>\nknowledge check|sync: inspect/sync coordinator-only Markdown knowledge.\nservice install: install this entry as the native service cliPath.\nserve, run, github listen: sync knowledge before starting the native CLI.\nUse service start/restart after editing knowledge files. Native help: --project <root> --help');
    return;
  }
  const { project, args } = parseInvocation(argv);
  const { sdk, cliPath } = await resolveRuntime(project);
  const wrapper = fs.realpathSync(fileURLToPath(import.meta.url));
  if (args[0] === 'knowledge') {
    if (args.length !== 2 || !['check', 'sync'].includes(args[1])) throw Error('Use knowledge check|sync');
    const result = await syncKnowledge(project, { apply: args[1] === 'sync' });
    console.log(JSON.stringify(result, null, 2));
    if (args[1] === 'check' && result.changed) process.exitCode = 1;
    return;
  }
  if (args[0] === 'service' && args[1] === 'install') {
    await syncKnowledge(project); // Validate before changing installation; no prompt mutation.
    const manager = sdk.createServiceManager({ projectRoot: project, cliPath: wrapper, ...installOptions(args.slice(2)) });
    console.log(JSON.stringify(manager.install(), null, 2));
    return;
  }
  if (args[0] === 'service' && ['start', 'restart'].includes(args[1])) {
    const status = sdk.createServiceManager({ projectRoot: project }).status();
    if (!status.installed) throw Error('Install the service using this wrapper first');
    const manifest = JSON.parse(fs.readFileSync(status.manifestPath, 'utf8'));
    if (fs.realpathSync(manifest.cliPath) !== wrapper) throw Error('Existing service bypasses knowledge sync. Stop, uninstall, then reinstall through this wrapper, preserving its original options.');
    await syncKnowledge(project); // Fail before stopping a healthy service if documents are invalid.
  }
  if (args[0] === 'serve' || args[0] === 'run' || args.includes('github') && args.includes('listen')) {
    await syncKnowledge(project, { apply: true });
  }
  // Import in this process: native signal handling, readiness IPC and heartbeat stay intact.
  process.argv = [process.execPath, cliPath, '--project', project, ...args];
  await import(pathToFileURL(cliPath).href);
}
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  try { await main(); }
  catch (error) {
    if (typeof process.send === 'function') process.send({ type: 'js-superagent:startup-error', code: 'KNOWLEDGE_SYNC_FAILED' });
    console.error(`Project Agent: ${error.message}`); process.exitCode = 1;
  }
}
