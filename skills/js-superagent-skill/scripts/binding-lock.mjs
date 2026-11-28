// A persistent marker excludes legacy mkdir writers; SQLite owns the live lock.
// Neither lock identity nor crash recovery depends on hostnames or PID receipts.
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';

const marker = 'js-superagent-skill component binding lock: sqlite-v1\n';
const busy = () => Error('Another component binding operation is in progress');
function ownedFile(file, {allowLinks = false} = {}) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || (!allowLinks && stat.nlink !== 1) || (stat.mode & 0o077) ||
      (typeof process.getuid === 'function' && stat.uid !== process.getuid())) throw Error('Unsafe component binding lock');
  return stat;
}
function ensureMarker(file) {
  // Publish a fully written marker atomically. A crash before publication leaves
  // an irrelevant temp file; a crash afterwards may leave one extra hard link.
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, marker, {flag: 'wx', mode: 0o600, flush: true});
    try { fs.linkSync(temporary, file); }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
  } finally {
    try { fs.unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const stat = fs.lstatSync(file);
  if (stat.isDirectory()) throw Error('Legacy component binding operation may be in progress; inspect it before retrying');
  ownedFile(file, {allowLinks: true});
  if (stat.size !== Buffer.byteLength(marker) || fs.readFileSync(file, 'utf8') !== marker) throw Error('Unknown component binding lock protocol');
}

export function withBindingLock(bindingFile, fn) {
  const legacyPath = bindingFile + '.lock';
  ensureMarker(legacyPath);
  // Keep the marker permanently: old mkdir writers must remain excluded even
  // between new operations, or they could race after a point-in-time check.
  const lock = bindingFile + '.lock.sqlite';
  try { const fd = fs.openSync(lock, 'wx', 0o600); fs.closeSync(fd); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  ownedFile(lock);
  for (const suffix of ['-journal', '-wal', '-shm']) {
    try { ownedFile(lock + suffix); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const db = new DatabaseSync(lock);
  let acquired = false;
  try {
    db.exec('PRAGMA busy_timeout = 0');
    try { db.exec('BEGIN IMMEDIATE'); acquired = true; }
    catch (error) {
      if ([5, 6].includes(error.errcode & 255)) throw busy();
      throw error;
    }
    return fn();
  } finally {
    try { if (acquired) db.exec('ROLLBACK'); } finally { db.close(); }
  }
}
