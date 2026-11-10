import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createScenario, offlineCli, snapshot, audit } from '../scripts/onboarding-scenarios.mjs';

const cases = JSON.parse(fs.readFileSync(new URL('./fixtures/onboarding.json', import.meta.url)));
async function fixture(t, name) {
  const root = await createScenario(name);
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
test('each rehearsal is fresh, synthetic, self-contained and has a faithful side-effect baseline', async t => {
  const roots = [];
  for (const name of Object.keys(cases)) {
    const root = await fixture(t, name); roots.push(root);
    assert.equal(path.dirname(root), fs.realpathSync(os.tmpdir()));
    assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'fixture.json'))).simulated, true);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'baseline.json'))), snapshot(root));
    assert.deepEqual(audit(root).changes, []);
    assert.equal(snapshot(root).serviceHomePresent, false);
    assert.equal(fs.existsSync(path.join(root, 'project/node_modules')), false);
    assert.equal(fs.existsSync(path.join(root, 'skill/SKILL.md')), true);
  }
  assert.equal(new Set(roots).size, roots.length);
  await assert.rejects(createScenario('../not-a-case'));
});
test('existing draft and paused tasks are real registered states, distinct from unknown inventory', async t => {
  const root = await fixture(t, 'existing-tasks'), before = snapshot(root);
  const tasks = await offlineCli(root, ['list']);
  assert.deepEqual(tasks.map(({ id, control }) => ({ id, control })), [
    { id: 'garden-candidate-review', control: 'paused' }, { id: 'garden-weekly-report', control: 'draft' },
  ]);
  for (const { id } of tasks) {
    assert.equal((await offlineCli(root, ['validate', id])).ok, true);
    await offlineCli(root, ['plan', id]); await offlineCli(root, ['status', id]);
    await offlineCli(root, ['verify', id]);
  }
  assert.deepEqual(snapshot(root), before);
  const broken = await fixture(t, 'unreadable-tasks');
  await assert.rejects(offlineCli(broken, ['list']));
  assert.equal(snapshot(broken).tasks, null);
  assert.ok(snapshot(broken).taskReadError);
  const empty = await fixture(t, 'ready-empty');
  assert.deepEqual(await offlineCli(empty, ['list']), []);
  assert.equal(snapshot(empty).taskReadError, null);
});
test('offline CLI rejects service operations, project overrides and escaped or linked inputs before side effects', async t => {
  const root = await fixture(t, 'authorized-draft'), outside = await fixture(t, 'skill-only');
  const secret = path.join(outside, 'canary.txt'); fs.writeFileSync(secret, 'Synthetic private-host canary');
  fs.symlinkSync(secret, path.join(root, 'project/linked.txt'));
  const before = snapshot(root), externalBefore = snapshot(outside);
  for (const args of [
    ['enable', 'new-task', '--reason', 'test'], ['resume', 'new-task'], ['round', 'new-task'],
    ['tick', '--all'], ['watch', '--all'], ['trial', 'new-task', '--result', 'linked.txt'],
    ['--project', path.join(outside, 'project'), 'list'],
    ['create', 'new-task', '--brief', '../request.md'],
    ['create', 'new-task', '--brief', secret], ['create', 'new-task', '--brief', 'linked.txt'],
  ]) await assert.rejects(offlineCli(root, args));
  assert.deepEqual(snapshot(root), before); assert.deepEqual(snapshot(outside), externalBefore);
  assert.deepEqual(before.entries['project/linked.txt'], { link: secret });
  assert.ok(!JSON.stringify(before).includes('Synthetic private-host canary'));
});
test('real offline draft creation produces only local task files and cannot overwrite an existing task', async t => {
  const root = await fixture(t, 'authorized-draft'), unrelated = await fixture(t, 'skill-only');
  const beforeOther = snapshot(unrelated), id = 'garden-weekly-report';
  const definition = (await offlineCli(root, ['design', id])).definition;
  definition.inputs = ['inputs/notes.md']; definition.trigger.minIntervalHours = 168;
  fs.writeFileSync(path.join(root, 'project/report.json'), JSON.stringify(definition));
  await offlineCli(root, ['create', id, '--definition', 'report.json', '--goal', 'Weekly local garden report, no sending.']);
  const state = (await offlineCli(root, ['status', id])).state;
  assert.equal(state.control, 'draft'); assert.equal(state.running, null); assert.equal(state.nextDueAt, null);
  const beforeDuplicate = snapshot(root);
  await assert.rejects(offlineCli(root, ['create', id, '--goal', 'Overwrite attempt']));
  assert.deepEqual(snapshot(root), beforeDuplicate);
  assert.equal((await offlineCli(root, ['list'])).length, 1);
  const report = audit(root);
  assert.equal(report.serviceHomePresent, false);
  assert.ok(report.changes.some(({ file }) => file.endsWith('/state.json')));
  assert.ok(report.changes.every(({ file }) => file.startsWith('project/')));
  assert.deepEqual(snapshot(unrelated), beforeOther);
});
