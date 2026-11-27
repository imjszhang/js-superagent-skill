// These fixtures exercise explicit project-local compatibility, independently of host globals.
process.env.JS_SUPERAGENT_COMPONENT_SOURCE='local';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {inspectProject} from '../skills/js-superagent-skill/scripts/inspect.mjs';
function temporary(t){const p=fs.mkdtempSync(path.join(os.tmpdir(),'skill-inspect-'));t.after(()=>fs.rmSync(p,{recursive:true,force:true}));return p;}
test('inspection of an empty project creates no config, package or state',t=>{
  const root=temporary(t);const result=inspectProject(root);
  assert.deepEqual(fs.readdirSync(root),[]);assert.ok(result.dependencies.every(x=>x.installed===null&&x.declared===null));
  assert.deepEqual(result.hostFacts.missingComponents,['js-superagent','js-longrun']);
  assert.equal(result.hostFacts.capability.status,'not-observed');assert.equal(result.hostFacts.capability.supported,null);
});
test('reports installed and declared versions without executing dependency code or reading credentials',t=>{
  const root=temporary(t),dir=path.join(root,'node_modules/js-superagent');fs.mkdirSync(dir,{recursive:true});
  const pkg=JSON.stringify({dependencies:{'js-superagent':'0.14.0-alpha.1'},packageManager:'npm@11'});
  fs.writeFileSync(path.join(root,'package.json'),pkg);fs.writeFileSync(path.join(root,'.env'),'SECRET=must-not-appear');
  fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name:'js-superagent',version:'0.14.0-alpha.1',type:'module',exports:{'.':{import:'./index.js'}}}));
  fs.writeFileSync(path.join(dir,'index.js'),'throw new Error("must not execute")');
  const result=inspectProject(root);assert.equal(result.dependencies[0].installed.version,'0.14.0-alpha.1');assert.equal(result.dependencies[0].declared,'0.14.0-alpha.1');
  assert.equal(fs.readFileSync(path.join(root,'package.json'),'utf8'),pkg);assert.ok(!JSON.stringify(result).includes('must-not-appear'));
});
test('rejects ambiguous relative roots',()=>assert.throws(()=>inspectProject('.'),/absolute/));
test('new material package inventory requires public capability checks and performs no migration',t=>{
  const root=temporary(t),dir=path.join(root,'node_modules/js-superagent');fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name:'js-superagent',version:'0.15.0-alpha.0'}));
  const before=fs.readdirSync(root,{recursive:true});const result=inspectProject(root);
  assert.deepEqual(result.runtimeCompatibility.knowledge.schemas,[14,15]);
  assert.equal(result.runtimeCompatibility.materials,'check-public-capabilities');
  assert.deepEqual(fs.readdirSync(root,{recursive:true}),before);
});
test('longrun inventory reads only manifests and reports configured storage without claiming service health',t=>{
  const root=temporary(t),dir=path.join(root,'node_modules/js-longrun');fs.mkdirSync(dir,{recursive:true});
  const config=JSON.stringify({schemaVersion:1,tasksDir:'automation/tasks',privateNote:'not inventory data'});
  fs.writeFileSync(path.join(root,'longrun.config.json'),config);
  fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name:'js-longrun',version:'9.0.0-fixture',exports:{'.':'./index.mjs','./layout':'./layout.mjs','./service':'./service.mjs'}}));
  for(const file of ['index','layout','service'])fs.writeFileSync(path.join(dir,`${file}.mjs`),'throw new Error("Inventory must not execute runtime code")');
  const before=fs.readdirSync(root,{recursive:true});const result=inspectProject(root);
  assert.equal(result.longrun.managementExport,'js-longrun/service');assert.equal(result.longrun.layoutExport,'js-longrun/layout');
  assert.equal(result.longrun.configuration.tasksDir,'automation/tasks');assert.equal(result.longrun.service,'not-observed');
  assert.equal(result.longrun.configuration.validation,'not-validated; use the installed longrun layout resolver');
  assert.equal(fs.readFileSync(path.join(root,'longrun.config.json'),'utf8'),config);
  assert.deepEqual(fs.readdirSync(root,{recursive:true}),before);assert.ok(!JSON.stringify(result).includes('not inventory data'));
});
test('longrun configuration failure remains visible and never becomes an empty healthy deployment',t=>{
  const root=temporary(t),file=path.join(root,'longrun.config.json');fs.writeFileSync(file,'{broken');
  const result=inspectProject(root);assert.equal(result.longrun.configuration.present,true);assert.ok(result.longrun.configuration.error);
  assert.equal(result.longrun.service,'not-observed');assert.equal(result.longrun.managementExport,null);
  assert.equal(fs.readFileSync(file,'utf8'),'{broken');
});
test('longrun inventory does not follow a configuration symlink or assume service support from a version',t=>{
  const root=temporary(t),external=temporary(t),dir=path.join(root,'node_modules/js-longrun');fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name:'js-longrun',version:'999.0.0'}));
  fs.writeFileSync(path.join(external,'secret.json'),JSON.stringify({tasksDir:'private-location'}));
  fs.symlinkSync(path.join(external,'secret.json'),path.join(root,'longrun.config.json'));
  const result=inspectProject(root);assert.ok(result.longrun.configuration.error);assert.equal(result.longrun.managementExport,null);
  assert.ok(!JSON.stringify(result).includes('private-location'));assert.equal(result.longrun.service,'not-observed');
});
test('host-facts inventory never derives live compatibility or synchronization from package contents',t=>{
  const root=temporary(t);
  for(const name of ['js-superagent','js-longrun']){
    const dir=path.join(root,'node_modules',name);fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name,version:'999.0.0',type:'module',exports:{'.':'./index.mjs','./host-facts':'./index.mjs'}}));
    fs.writeFileSync(path.join(dir,'index.mjs'),'export function hostFactsCapabilities(){return {version:1}}; throw new Error("Inventory must not import runtime code")');
  }
  const before=fs.readdirSync(root,{recursive:true});const result=inspectProject(root);
  assert.deepEqual(result.hostFacts.missingComponents,[]);
  assert.deepEqual(result.hostFacts.capability,{status:'not-observed',supported:null,requiredVersion:1});
  assert.equal(result.hostFacts.synchronization,'not-observed');
  assert.deepEqual(fs.readdirSync(root,{recursive:true}),before);
});
