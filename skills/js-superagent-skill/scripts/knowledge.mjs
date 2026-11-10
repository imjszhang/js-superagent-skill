#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {fileURLToPath, pathToFileURL} from 'node:url';

// This compatibility adapter deliberately targets explicitly verified package layouts.
const SUPPORTED_VERSIONS = ['0.14.0-alpha.1', '0.14.0-alpha.2', '0.14.0-alpha.3'];
const MARKER = 'js-superagent-skill:knowledge';
const END = `<!-- /${MARKER} -->`;
const sha = value => createHash('sha256').update(value).digest('hex');
const regularFile = file => {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw Error(`Expected a regular file: ${path.basename(file)}`);
  return stat;
};

export async function resolveRuntime(projectRoot) {
  if (!path.isAbsolute(projectRoot)) throw Error('--project must be an absolute directory');
  const root = fs.realpathSync(projectRoot);
  if (!fs.statSync(root).isDirectory()) throw Error('Project is not a directory');
  // Do not resolve a dependency from the skill's own repository.
  const packageRoot = path.join(root, 'node_modules', 'js-superagent');
  const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  if (manifest.name !== 'js-superagent' || !SUPPORTED_VERSIONS.includes(manifest.version)) {
    throw Error(`Knowledge adapter requires js-superagent ${SUPPORTED_VERSIONS.join(' or ')}; inspect compatibility before upgrading`);
  }
  const exported = manifest.exports?.['.']?.import;
  if (typeof exported !== 'string' || !exported.startsWith('./')) throw Error('Unsupported runtime package entry');
  const entry = path.resolve(packageRoot, exported);
  const realPackage = fs.realpathSync(packageRoot);
  if (!fs.realpathSync(entry).startsWith(realPackage + path.sep)) throw Error('Runtime did not resolve from the target project');
  const sdk = await import(pathToFileURL(entry).href);
  if (typeof sdk.projectStateDirectory !== 'function' || typeof sdk.createProjectAgent !== 'function') throw Error('Required runtime interfaces are unavailable');
  return {sdk, cliPath:path.join(realPackage, 'bin/js-superagent.mjs'), packageRoot:realPackage};
}

export function loadKnowledge(directory) {
  const stat = fs.lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error('Knowledge directory must be a real directory');
  const entries = [];
  for (const name of fs.readdirSync(directory).sort()) {
    if (!/\.md$/i.test(name)) continue;
    const file = path.join(directory, name), info = fs.lstatSync(file);
    if (info.isSymbolicLink()) throw Error(`Linked knowledge file is not allowed: ${name}`);
    if (info.isDirectory()) continue;
    regularFile(file);
    if (info.size > 32_000) throw Error(`Knowledge file exceeds 32000 bytes: ${name}`);
    let text;
    try { text = new TextDecoder('utf-8', {fatal:true}).decode(fs.readFileSync(file)); }
    catch { throw Error(`Knowledge file must be valid UTF-8: ${name}`); }
    if (text.includes('\0') || text.includes(MARKER)) throw Error(`Invalid knowledge text: ${name}`);
    const title = text.match(/^#\s+(.+?)\s*#*\s*$/m)?.[1] ?? name;
    entries.push({id:name, title, text});
  }
  return entries;
}

function withoutManagedBlock(text) {
  if (!text.includes(MARKER)) return text;
  const pattern = /\n\n<!-- js-superagent-skill:knowledge sha256=([a-f0-9]{64}) -->\n([\s\S]*?)\n<!-- \/js-superagent-skill:knowledge -->/;
  const match = text.match(pattern);
  if (!match || sha(match[2]) !== match[1]) throw Error('Managed coordinator knowledge was edited; reconcile the existing block before syncing');
  const remaining = text.replace(pattern, '');
  if (remaining.includes(MARKER)) throw Error('Duplicate or malformed managed knowledge block');
  return remaining;
}

export function planKnowledge(status, entries) {
  const settings = status.settings, key = 'runtime/coordinator';
  const override = settings.overrides[key];
  const current = override?.text ?? settings.defaults[key].text;
  const original = withoutManagedBlock(current);
  const payload = JSON.stringify({kind:'project-knowledge', entries});
  const next = entries.length ? `${original}\n\n<!-- ${MARKER} sha256=${sha(payload)} -->\n${payload}\n${END}` : original;
  const overrides = structuredClone(settings.overrides);
  if (next === settings.defaults[key].text) delete overrides[key];
  else overrides[key] = {...(override ?? {}), text:next};
  return {changed:next !== current, patch:{overrides}};
}

function openExisting(root, sdk) {
  const directory = sdk.projectStateDirectory(root);
  if (!fs.existsSync(path.join(directory, 'config.json')) || !fs.existsSync(path.join(directory, 'state.sqlite'))) {
    throw Error('Initialize and verify this project before syncing knowledge; no state was created');
  }
  regularFile(path.join(directory, 'config.json')); regularFile(path.join(directory, 'state.sqlite'));
  const config = JSON.parse(fs.readFileSync(path.join(directory, 'config.json'), 'utf8'));
  if (config.schemaVersion !== 2 || !config.projectId) throw Error('Project configuration requires separate upgrade inspection');
  const identity = sdk.inspectProjectIdentity(root, config.projectId);
  if (!identity.initialized || identity.matches !== true) throw Error('Project identity does not match this runtime directory');
  const db = new DatabaseSync(path.join(directory, 'state.sqlite'), {readOnly:true});
  try {
    if (Number(db.prepare('PRAGMA user_version').get().user_version) !== 14) throw Error('Knowledge sync requires state schema 14; upgrade separately');
    return {directory, db};
  } catch (error) { db.close(); throw error; }
}

export async function syncKnowledge(projectRoot, {apply=false} = {}) {
  if (!path.isAbsolute(projectRoot)) throw Error('--project must be an absolute directory');
  const root = fs.realpathSync(projectRoot), {sdk,packageRoot} = await resolveRuntime(root);
  const {directory:stateDirectory,db} = openExisting(root, sdk);
  const directory = path.join(stateDirectory, 'knowledge');
  let entries, plan, revision;
  try {
    entries = loadKnowledge(directory);
    // The public runtime init() can recover state. Use its exact-version prompt
    // compiler with a read-only metadata adapter for preview/check instead.
    const {PromptRegistry} = await import(pathToFileURL(path.join(packageRoot,'src/runtime/prompt-registry.mjs')).href);
    const store = {getMeta(key) {const row=db.prepare('SELECT data FROM kv WHERE key = ?').get(key);return row ? JSON.parse(row.data) : undefined;}};
    const registry = new PromptRegistry(store, {initialize:false});
    const settings = registry.current(); revision = settings.revision;
    plan = planKnowledge({settings}, entries);
    const preview = registry.preview(plan.patch, {expectedRevision:revision});
    if (preview.draft.worker.text !== preview.saved.worker.text) throw Error('Knowledge sync would change Worker instructions');
  } finally { db.close(); }
  let applied = false;
  if (apply && plan.changed) {
    if (JSON.stringify(loadKnowledge(directory)) !== JSON.stringify(entries)) throw Error('Knowledge changed during preview; retry from current files');
    const runtime = sdk.createProjectAgent({projectRoot:root}).init();
    try {
      const preview = runtime.previewPrompts(plan.patch,{expectedRevision:revision});
      if (preview.draft.worker.text !== preview.saved.worker.text) throw Error('Knowledge sync would change Worker instructions');
      const result = runtime.configurePrompts(plan.patch,{expectedRevision:revision});
      revision = result.revision; applied = true;
    } finally { runtime.close(); }
  }
  return {directory, entries:entries.map(({id,title,text})=>({id,title,sha256:sha(text),bytes:Buffer.byteLength(text)})), changed:plan.changed, applied, revision};
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args=process.argv.slice(2);
    if(args.length===1&&args[0]==='--help') console.log('node knowledge.mjs --project /absolute/project --check|--apply (check is read-only; apply syncs coordinator knowledge)');
    else {
      if(args.length!==3||args[0]!=='--project'||!['--check','--apply'].includes(args[2]))throw Error('Usage: knowledge.mjs --project /absolute/project --check|--apply');
      const result=await syncKnowledge(args[1],{apply:args[2]==='--apply'});
      console.log(JSON.stringify(result,null,2));if(args[2]==='--check'&&result.changed)process.exitCode=1;
    }
  } catch(error) {console.error(`Knowledge sync: ${error.message}`);process.exitCode=1;}
}
