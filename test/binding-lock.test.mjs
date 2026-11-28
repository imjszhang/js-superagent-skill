import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {withBindingLock} from '../skills/js-superagent-skill/scripts/binding-lock.mjs';

const module = new URL('../skills/js-superagent-skill/scripts/binding-lock.mjs', import.meta.url).href;
function fixture(t) {
  const directory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'binding-lock-')));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  return path.join(directory, 'components.json');
}
async function interrupted(t, file, phase) {
  const code = `import fs from 'node:fs';import {withBindingLock} from ${JSON.stringify(module)};
const block=()=>{console.log('ready');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0);};
const link=fs.linkSync;fs.linkSync=(...args)=>{if(${JSON.stringify(phase)}==='before-marker')block();const r=link(...args);if(${JSON.stringify(phase)}==='after-marker')block();return r;};
withBindingLock(${JSON.stringify(file)},block);`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', code], {stdio: ['ignore', 'pipe', 'pipe']});
  t.after(() => { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); });
  let timer;
  try {
    await Promise.race([
      once(child.stdout, 'data').then(([chunk]) => assert.match(String(chunk), /ready/)),
      once(child, 'exit').then(([code]) => { throw Error(`Child exited before holding lock: ${code}`); }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Lock child did not become ready')), 10000); }),
    ]);
  } finally { clearTimeout(timer); }
  return child;
}
async function kill(child) { const exited = once(child, 'exit'); child.kill('SIGKILL'); await exited; }

test('new writers exclude each other and retain a persistent old-writer barrier after success or exception', t => {
  const file = fixture(t);
  assert.equal(withBindingLock(file, () => {
    assert.throws(() => withBindingLock(file, () => assert.fail()), /in progress/);
    assert.throws(() => fs.mkdirSync(file + '.lock'), {code: 'EEXIST'});
    return 'bound';
  }), 'bound');
  const before = fs.readFileSync(file + '.lock');
  assert.throws(() => withBindingLock(file, () => { throw Error('callback failed'); }), /callback failed/);
  assert.deepEqual(fs.readFileSync(file + '.lock'), before);
  assert.throws(() => fs.mkdirSync(file + '.lock'), {code: 'EEXIST'});
  assert.equal(withBindingLock(file, () => 'next'), 'next');
});

test('existing legacy mkdir ownership blocks new writers without deleting or adopting the old directory', t => {
  const file = fixture(t);
  fs.mkdirSync(file + '.lock');
  assert.throws(() => withBindingLock(file, () => assert.fail()), /Legacy.*in progress/);
  assert.equal(fs.lstatSync(file + '.lock').isDirectory(), true);
  assert.equal(fs.existsSync(file + '.lock.sqlite'), false);
  fs.rmdirSync(file + '.lock'); // The old writer releases its own lock normally.
  withBindingLock(file, () => {});
});

test('old mkdir writer racing marker publication wins safely and is never overwritten', t => {
  const file = fixture(t), original = fs.linkSync;
  fs.linkSync = (source, destination) => { fs.mkdirSync(destination); return original(source, destination); };
  try { assert.throws(() => withBindingLock(file, () => assert.fail()), /Legacy.*in progress/); }
  finally { fs.linkSync = original; }
  assert.equal(fs.lstatSync(file + '.lock').isDirectory(), true);
});

for (const phase of ['before-marker', 'after-marker', 'holding']) test(`process death during ${phase} never leaves an unrecoverable new lock`, async t => {
  const file = fixture(t), child = await interrupted(t, file, phase);
  if (phase === 'holding') assert.throws(() => withBindingLock(file, () => assert.fail()), /in progress/);
  await kill(child);
  assert.equal(withBindingLock(file, () => 'recovered'), 'recovered');
  assert.equal(fs.lstatSync(file + '.lock').isFile(), true);
  // Even a separate old binary is rejected by its original mkdir operation.
  const legacy = spawnSync(process.execPath, ['--input-type=module', '-e', `import fs from 'node:fs';try{fs.mkdirSync(${JSON.stringify(file + '.lock')});process.exitCode=2;}catch(e){if(e.code!=='EEXIST')throw e;}`]);
  assert.equal(legacy.status, 0);
});

test('unknown markers and unsafe SQLite control files fail without entering binding work', t => {
  const file = fixture(t);
  fs.writeFileSync(file + '.lock', 'unknown', {mode: 0o600});
  assert.throws(() => withBindingLock(file, () => assert.fail()), /Unknown.*protocol/);
  fs.unlinkSync(file + '.lock');
  withBindingLock(file, () => {});
  fs.chmodSync(file + '.lock', 0o644);
  assert.throws(() => withBindingLock(file, () => assert.fail()), /Unsafe/);
  fs.chmodSync(file + '.lock', 0o600);
  fs.renameSync(file + '.lock.sqlite', file + '.outside');
  fs.symlinkSync(file + '.outside', file + '.lock.sqlite');
  assert.throws(() => withBindingLock(file, () => assert.fail()), /Unsafe/);
});
