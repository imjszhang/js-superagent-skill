import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { syncKnowledge } from '../skills/js-superagent-skill/scripts/knowledge.mjs';

const example = JSON.parse(fs.readFileSync(new URL('../skills/js-superagent-skill/assets/project-materials.example.json', import.meta.url), 'utf8'));
test('material deployment sample starts with one local read-only source and no preparation or apply grant', () => {
  assert.equal(example.entries.length, 1); assert.equal(example.entries[0].project, 'self');
  assert.deepEqual(example.entries[0].readers, [{ source: 'local', id: 'operator' }]);
  assert.deepEqual(example.entries[0].destinations, example.entries[0].readers);
  assert.deepEqual(example.entries[0].views, ['current']);
  assert.equal(example.defaults.access, 'host-only');
  assert.equal(example.defaults.allowPreparation, false); assert.equal(example.defaults.allowApply, false);
  assert.ok(example.entries[0].include.includes('AGENTS.md')); assert.ok(example.entries[0].include.includes('skills'));
  assert.ok(!example.entries[0].include.includes('.'));
});

test('candidate package configures material grants publicly and preserves coordinator-only knowledge at schema 15', { skip: !process.env.JS_SUPERAGENT_CANDIDATE_PACKAGE }, async t => {
  const candidate = fs.realpathSync(process.env.JS_SUPERAGENT_CANDIDATE_PACKAGE);
  const manifest = JSON.parse(fs.readFileSync(path.join(candidate, 'package.json'), 'utf8'));
  assert.ok(['0.15.0-alpha.0', '0.15.0-alpha.1', '0.15.0-alpha.2'].includes(manifest.version), 'Candidate matrix must exercise an exact supported material package layout');
  const sdk = await import(pathToFileURL(path.resolve(candidate, manifest.exports['.'].import)).href);
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'skill-materials-'))), root = path.join(base, 'project');
  fs.mkdirSync(path.join(root, 'node_modules'), { recursive: true });
  fs.symlinkSync(candidate, path.join(root, 'node_modules/js-superagent'));
  const original = {};
  for (const [key, value] of Object.entries({ JS_SUPERAGENT_HOME: path.join(base, 'state'), JS_SUPERAGENT_MACHINE_DIRECTORY: path.join(base, 'machine') })) {
    original[key] = process.env[key]; process.env[key] = value;
  }
  t.after(() => { for (const [key, value] of Object.entries(original)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } fs.rmSync(base, { recursive: true, force: true }); });
  let app = sdk.createProjectAgent({ projectRoot: root }).init();
  try {
    await app.prepareExecution();
    const caps = app.materialCapabilities();
    assert.equal(caps.version, 1); assert.equal(caps.boundedReadsVersion, 1); assert.equal(caps.schemaVersion, 15);
    const current = app.getMaterialSettings();
    assert.deepEqual(current.entries, []);
    app.configureMaterials(example, { expectedRevision: current.revision });
    const saved = app.getMaterialSettings();
    assert.equal(saved.defaults.access, 'host-only'); assert.equal(saved.entries.length, 1);
    assert.throws(() => app.configureMaterials(example, { expectedRevision: current.revision }), /revision/i);
    const before = app.promptStatus();
    const directory = path.join(sdk.projectStateDirectory(root), 'knowledge'); fs.mkdirSync(directory);
    fs.writeFileSync(path.join(directory, 'project.md'), '# Synthetic project\nCoordinator navigation only.');
    await app.stop(); app.close(); app = null;
    const preview = await syncKnowledge(root); assert.equal(preview.changed, true);
    await syncKnowledge(root, { apply: true });
    app = sdk.createProjectAgent({ projectRoot: root }).init();
    const after = app.promptStatus();
    assert.equal(after.assembled.worker.text, before.assembled.worker.text);
    assert.match(after.assembled.coordinator.text, /Coordinator navigation only/);
    assert.deepEqual(app.getMaterialSettings(), saved, 'Knowledge sync never changes material grants');
  } finally { if (app) { await app.stop(); app.close(); } }
});
