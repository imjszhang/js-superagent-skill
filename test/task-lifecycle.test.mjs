import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createTask, enableTask, pauseTask, resumeTask, disableTask, loadState, listTasks, readDefinition } from 'js-longrun/definitions';
import { planTask, startRun, collectTask, genericStatus } from 'js-longrun/runtime';
import { trialTask } from 'js-longrun/trial';

const assets = new URL('../skills/js-superagent-skill/assets/', import.meta.url);
const cli = new URL('../node_modules/js-longrun/bin/js-longrun.mjs', import.meta.url);
const now = new Date('2026-01-05T09:00:00Z');
function sandbox(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'project-agent-contract-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'inputs'));
  fs.writeFileSync(path.join(root, 'inputs/notes.md'), 'An explicitly synthetic input.\n');
  return root;
}
const example = name => JSON.parse(fs.readFileSync(new URL(`${name}.task.json`, assets), 'utf8'));
const taskFile = (root,id,name) => path.join(root, 'research/longrun', id, name);
const saved = (root,id) => fs.readFileSync(taskFile(root,id,'state.json'),'utf8');
async function create(root,name) {
  const definition = example(name);
  await createTask({root,id:definition.id,definition,brief:'Maintain only this synthetic local input; preserve previous decisions.',now});
  return definition.id;
}

test('installed examples create draft tasks through public CLI without executing or rewriting on read', t => {
  const root = sandbox(t), home = path.join(root,'uninitialized-agent-home');
  const run = args => JSON.parse(execFileSync(process.execPath,[fileURLToPath(cli),'--project',root,...args],{
    encoding:'utf8', env:{...process.env,JS_SUPERAGENT_HOME:home}, stdio:['ignore','pipe','pipe'],
  }));
  for(const name of ['report-weekly','review-weekly']) {
    const d=example(name);
    run(['create',d.id,'--definition',fileURLToPath(new URL(`${name}.task.json`,assets)),'--goal','Maintain the synthetic local input.']);
    const before=saved(root,d.id);
    assert.equal(loadState(root,d.id).control,'draft');assert.equal(loadState(root,d.id).running,null);
    assert.equal(run(['validate',d.id]).ok,true);
    const plan=run(['plan',d.id]);assert.equal(plan.definition.type,d.type);
    assert.ok(plan.plan.allowedPaths.every(p=>p.startsWith(`research/longrun/${d.id}/runs/`)));
    run(['status',d.id]);assert.equal(saved(root,d.id),before);
    assert.throws(()=>run(['create',d.id,'--goal','Do not overwrite']));assert.equal(saved(root,d.id),before);
  }
  assert.equal(run(['list']).length,2);assert.equal(fs.existsSync(home),false);
});

test('offline trial preserves the source task control and artifacts',async t=>{
  const root=sandbox(t),id=await create(root,'report-weekly'),before=saved(root,id);
  const result=await trialTask({root,id,now,result:{schemaVersion:1,summary:'No changes',report:'# Report\nNo changes',evidence:[],changed:false}});
  assert.equal(result.production,false);assert.equal(result.result.record.status,'settled');
  assert.equal(result.verification.ok,true);assert.equal(saved(root,id),before);
  assert.deepEqual(fs.readdirSync(taskFile(root,id,'artifacts')),[]);
  assert.ok(result.directory.startsWith(path.join(root,'working/longrun/trials/')));
});

test('pause, resume and disable retain the in-flight identity; disabled requires explicit enable',async t=>{
  const root=sandbox(t),id=await create(root,'report-weekly');let submissions=0;
  const client={submit:async()=>{submissions++;return 'synthetic-ticket';}};
  await enableTask({root,id,reason:'Isolated test authorization only',now});
  assert.equal(submissions,0);
  await startRun({root,id,now,client});const active=loadState(root,id).running;
  const frozen=fs.readFileSync(taskFile(root,id,'runs/R0001/draft.json'),'utf8');
  await pauseTask({root,id,now});assert.deepEqual(loadState(root,id).running,active);
  assert.equal((await startRun({root,id,now,client})).action,'hold');
  await resumeTask({root,id,now});assert.deepEqual(loadState(root,id).running,active);
  await disableTask({root,id,now});assert.deepEqual(loadState(root,id).running,active);
  await assert.rejects(resumeTask({root,id,now}));
  assert.equal(fs.readFileSync(taskFile(root,id,'runs/R0001/draft.json'),'utf8'),frozen);
  const result=await collectTask({root,id,now,client:{snapshot:async()=>({status:'cancelled'})}});
  assert.equal(result.record.status,'cancelled');assert.equal(loadState(root,id).control,'disabled');
  assert.equal(loadState(root,id).running,null);assert.equal(submissions,1);
  await enableTask({root,id,reason:'New isolated authorization',now});assert.equal(loadState(root,id).control,'enabled');
});

test('changing future cadence preserves the frozen run and its next-due calculation',async t=>{
  const root=sandbox(t),id=await create(root,'report-weekly');
  await enableTask({root,id,reason:'Isolated test',now});
  await startRun({root,id,now,client:{submit:async()=> 'synthetic-cadence-ticket'}});
  const frozenFile=taskFile(root,id,'runs/R0001/draft.json'),before=fs.readFileSync(frozenFile,'utf8');
  const d=readDefinition(root,id);d.revision++;d.trigger.minIntervalHours=336;
  fs.writeFileSync(taskFile(root,id,'task.json'),JSON.stringify(d));
  const storedDue=loadState(root,id).nextDueAt;
  await pauseTask({root,id,now});await resumeTask({root,id,now});
  assert.equal(loadState(root,id).nextDueAt,storedDue);
  assert.equal(planTask({root,id,now}).definition.trigger.minIntervalHours,336);
  assert.equal(fs.readFileSync(frozenFile,'utf8'),before);
  await collectTask({root,id,now,client:{snapshot:async()=>({status:'cancelled'})}});
  assert.equal(loadState(root,id).nextDueAt,new Date(+now+168*3600000).toISOString());
  assert.ok(genericStatus({root,id,now}).gates.reasons.includes('not-due'));
});

test('one invalid task does not hide another task or share its artifact namespace',async t=>{
  const root=sandbox(t),first=await create(root,'report-weekly'),second=await create(root,'review-weekly');
  const a=planTask({root,id:first,now}),b=planTask({root,id:second,now});
  assert.ok(a.plan.allowedPaths.every(p=>!b.plan.allowedPaths.includes(p)));
  const before=saved(root,second);fs.writeFileSync(taskFile(root,first,'task.json'),'{}');
  const rows=listTasks(root);assert.ok(rows.find(r=>r.id===first).error);
  assert.equal(rows.find(r=>r.id===second).error,undefined);
  assert.equal(planTask({root,id:second,now}).definition.id,second);assert.equal(saved(root,second),before);
});
