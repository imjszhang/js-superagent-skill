import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fork } from 'node:child_process';
import { loadKnowledge, syncKnowledge, resolveRuntime } from '../skills/js-superagent-skill/scripts/knowledge.mjs';

const packageDirectory = fs.realpathSync(process.env.JS_SUPERAGENT_CANDIDATE_PACKAGE ?? fileURLToPath(new URL('../node_modules/js-superagent', import.meta.url)));
const runtimeManifest = JSON.parse(fs.readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'));
const { createProjectAgent, projectStateDirectory } = await import(pathToFileURL(path.resolve(packageDirectory, runtimeManifest.exports['.'].import)).href);
function sandbox(t) {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'coordinator-knowledge-')));
  const root = path.join(base, 'project'); fs.mkdirSync(root);
  const old = {};
  for (const [key, value] of Object.entries({ JS_SUPERAGENT_HOME: path.join(base, 'state'), JS_SUPERAGENT_MACHINE_DIRECTORY: path.join(base, 'machine') })) {
    old[key] = process.env[key]; process.env[key] = value;
  }
  t.after(() => {
    for (const [key, value] of Object.entries(old)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    fs.rmSync(base, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(root, 'node_modules'));
  fs.symlinkSync(packageDirectory, path.join(root, 'node_modules/js-superagent'));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ type: 'module', dependencies: { 'js-superagent': runtimeManifest.version } }));
  return { base, root };
}
async function withAgent(root, operation) {
  const app = createProjectAgent({ projectRoot: root }).init();
  try { return await operation(app); } finally { await app.stop(); app.close(); }
}
const status = root => withAgent(root, app => app.promptStatus());
async function initialized(t) {
  const env = sandbox(t);
  await withAgent(env.root, app => app.prepareExecution());
  env.directory = path.join(projectStateDirectory(env.root), 'knowledge');
  fs.mkdirSync(env.directory);
  return env;
}
function write(directory, name, text) { fs.writeFileSync(path.join(directory, name), text); }

test('directory loader produces deterministic separate entries including Chinese filenames and ignores unrelated files', async t => {
  const { directory } = await initialized(t);
  write(directory, '资料.md', '# 资料入口\n\nSynthetic references only.\n');
  write(directory, 'project.md', '# Garden archive\n\nSynthetic project purpose.\n');
  write(directory, 'notes.md', 'A note without a heading.\n');
  write(directory, 'ignore.txt', 'Do not load this.');
  fs.mkdirSync(path.join(directory, 'nested')); write(path.join(directory, 'nested'), 'hidden.md', '# Not loaded');
  const first = await loadKnowledge(directory), again = await loadKnowledge(directory);
  assert.deepEqual(first, again); assert.equal(first.length, 3);
  assert.equal(new Set(first.map(item => item.id)).size, 3);
  assert.ok(first.some(item => item.title === '资料入口'));
  assert.ok(first.some(item => item.title === 'Garden archive'));
  assert.ok(first.some(item => item.title === 'notes.md' || item.title === 'notes'));
  assert.ok(!JSON.stringify(first).includes('Do not load this'));
  assert.ok(!JSON.stringify(first).includes('Not loaded'));
});

test('directory loader rejects linked Markdown and malformed UTF-8 instead of following or silently replacing input', async t => {
  const { base, directory } = await initialized(t);
  const external = path.join(base, 'external.md'); fs.writeFileSync(external, '# Private canary');
  fs.symlinkSync(external, path.join(directory, 'linked.md'));
  await assert.rejects(async () => loadKnowledge(directory));
  fs.unlinkSync(path.join(directory, 'linked.md'));
  write(directory, 'invalid.md', Buffer.from([0xc3, 0x28]));
  await assert.rejects(async () => loadKnowledge(directory));
  fs.unlinkSync(path.join(directory, 'invalid.md'));
  const alias = path.join(base, 'alias'); fs.symlinkSync(directory, alias);
  await assert.rejects(async () => loadKnowledge(alias));
});

test('synchronization preserves shared knowledge, Worker text and custom coordinator guidance; repeated application is idempotent', async t => {
  const { root, directory } = await initialized(t);
  await withAgent(root, app => app.configurePrompts({
    sections: { communication: 'Use concise language.' },
    knowledge: [{ id: 'shared', title: 'Shared fact', text: 'Shared synthetic fact.' }],
    overrides: { 'runtime/coordinator': 'Preserve this custom coordinator role.', 'runtime/worker': 'Preserve this custom Worker role.' },
  }, { expectedRevision: 0 }));
  const before = await status(root);
  write(directory, 'project.md', '# Garden archive\nOnly the coordinator sees this synthetic project fact.\n');
  const database = path.join(projectStateDirectory(root), 'state.sqlite');
  const databaseBefore = fs.readFileSync(database);
  const preview = await syncKnowledge(root, { apply: false });
  assert.equal(preview.changed, true);
  assert.deepEqual(fs.readFileSync(database), databaseBefore);
  assert.equal((await status(root)).settings.revision, before.settings.revision);
  const applied = await syncKnowledge(root, { apply: true }); assert.equal(applied.changed, true);
  const after = await status(root);
  assert.equal(after.assembled.worker.text, before.assembled.worker.text);
  assert.deepEqual(after.settings.knowledge, before.settings.knowledge);
  assert.deepEqual(after.settings.sections, before.settings.sections);
  assert.deepEqual(after.settings.overrides['runtime/worker'], before.settings.overrides['runtime/worker']);
  assert.match(after.assembled.coordinator.text, /Preserve this custom coordinator role/);
  assert.match(after.assembled.coordinator.text, /Only the coordinator sees this synthetic project fact/);
  assert.doesNotMatch(after.assembled.worker.text, /Only the coordinator sees/);
  const repeated = await syncKnowledge(root, { apply: true }); assert.equal(repeated.changed, false);
  assert.equal((await status(root)).settings.revision, after.settings.revision);
});

test('file additions, edits and deletions update only their managed knowledge content', async t => {
  const { root, directory } = await initialized(t);
  write(directory, 'project.md', '# Archive\nOriginal synthetic fact.');
  await syncKnowledge(root, { apply: true });
  write(directory, 'project.md', '# Archive\nUpdated synthetic fact.');
  write(directory, 'terms.md', '# Terms\nA separate synthetic term.');
  await syncKnowledge(root, { apply: true });
  let current = await status(root);
  assert.match(current.assembled.coordinator.text, /Updated synthetic fact/);
  assert.match(current.assembled.coordinator.text, /A separate synthetic term/);
  assert.doesNotMatch(current.assembled.coordinator.text, /Original synthetic fact/);
  fs.unlinkSync(path.join(directory, 'terms.md'));
  await syncKnowledge(root, { apply: true });
  current = await status(root); assert.doesNotMatch(current.assembled.coordinator.text, /A separate synthetic term/);
  fs.unlinkSync(path.join(directory, 'project.md'));
  await syncKnowledge(root, { apply: true });
  current = await status(root); assert.doesNotMatch(current.assembled.coordinator.text, /Updated synthetic fact/);
});

test('manual edits within generated knowledge fail safely without replacing user edits', async t => {
  const { root, directory } = await initialized(t);
  write(directory, 'project.md', '# Archive\nOriginal generated content.');
  await syncKnowledge(root, { apply: true });
  const current = await status(root);
  const overrides = structuredClone(current.settings.overrides);
  overrides['runtime/coordinator'].text = overrides['runtime/coordinator'].text.replace('Original generated content.', 'Manually altered content.');
  await withAgent(root, app => app.configurePrompts({ overrides }, { expectedRevision: current.settings.revision }));
  const altered = await status(root);
  await assert.rejects(syncKnowledge(root, { apply: true }));
  assert.equal((await status(root)).settings.revision, altered.settings.revision);
});

test('assembled coordinator budget rejects both preview and application without saving a revision', async t => {
  const { root, directory } = await initialized(t);
  const before = await status(root);
  write(directory, 'project.md', '# Within file size, above prompt budget\n' + 'x'.repeat(14500));
  assert.equal((await loadKnowledge(directory)).length, 1);
  const database = path.join(projectStateDirectory(root), 'state.sqlite');
  const bytesBefore = fs.readFileSync(database);
  await assert.rejects(syncKnowledge(root, { apply: false }), /budget|14000/i);
  assert.deepEqual(fs.readFileSync(database), bytesBefore);
  await assert.rejects(syncKnowledge(root, { apply: true }), /budget|14000/i);
  assert.equal((await status(root)).settings.revision, before.settings.revision);
});

test('budget rejection and uninitialized-project inspection do not create or alter runtime settings', async t => {
  const { root, directory } = await initialized(t);
  const before = await status(root);
  write(directory, 'project.md', '# Oversized\n' + 'Very large synthetic content. '.repeat(1500));
  await assert.rejects(syncKnowledge(root, { apply: true }));
  assert.equal((await status(root)).settings.revision, before.settings.revision);
  const fresh = path.join(path.dirname(root), 'uninitialized'); fs.mkdirSync(fresh);
  fs.mkdirSync(path.join(fresh, 'node_modules')); fs.symlinkSync(packageDirectory, path.join(fresh, 'node_modules/js-superagent'));
  const absentState = projectStateDirectory(fresh);
  await assert.rejects(syncKnowledge(fresh, { apply: false }));
  assert.equal(fs.existsSync(absentState), false);
  const runtime = await resolveRuntime(root); assert.equal(typeof runtime.sdk.projectStateDirectory, 'function');
  assert.ok(runtime.cliPath.endsWith('bin/js-superagent.mjs'));
});


test('startup wrapper synchronizes before native ready IPC and reloads edits on the next start', { timeout: 20000 }, async t => {
  const { root, directory } = await initialized(t);
  await withAgent(root, app => app.configureExecutor({ driver: 'codex-app-server', executable: process.execPath }, { expectedRevision: 0 }));
  const wrapper = fileURLToPath(new URL('../skills/js-superagent-skill/scripts/project-agent.mjs', import.meta.url));
  const before = await status(root);
  const children = [];
  t.after(() => { for (const child of children) if (child.exitCode === null) child.kill('SIGKILL'); });
  async function start() {
    const child = fork(wrapper, ['--project', root, 'serve'], { env: { ...process.env }, silent: true });
    children.push(child);
    let errors = ''; child.stderr.on('data', chunk => { errors += chunk; });
    child.stdout.resume();
    const exited = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })));
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Wrapper readiness timeout: ' + errors)), 7000);
      const onExit = code => { clearTimeout(timer); reject(new Error('Wrapper exited before ready: ' + code + ' ' + errors)); };
      child.once('exit', onExit);
      child.on('message', message => {
        if (message.type === 'js-superagent:ready') { clearTimeout(timer); child.off('exit', onExit); resolve(); }
        if (message.type === 'js-superagent:startup-error') errors += JSON.stringify(message);
      });
    });
    return { child, exited };
  }
  write(directory, 'project.md', '# Archive\nFirst startup fact.');
  let running = await start();
  let current = await status(root);
  assert.match(current.assembled.coordinator.text, /First startup fact/);
  assert.equal(current.assembled.worker.text, before.assembled.worker.text);
  running.child.kill('SIGTERM'); assert.equal((await running.exited).code, 143);
  write(directory, 'project.md', '# Archive\nSecond startup fact.');
  running = await start(); current = await status(root);
  assert.match(current.assembled.coordinator.text, /Second startup fact/);
  assert.doesNotMatch(current.assembled.coordinator.text, /First startup fact/);
  assert.equal(current.assembled.worker.text, before.assembled.worker.text);
  running.child.kill('SIGTERM'); assert.equal((await running.exited).code, 143);
});
