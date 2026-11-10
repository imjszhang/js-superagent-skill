import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {inspectProject} from '../scripts/inspect.mjs';
function temporary(t){const p=fs.mkdtempSync(path.join(os.tmpdir(),'skill-inspect-'));t.after(()=>fs.rmSync(p,{recursive:true,force:true}));return p;}
test('inspection of an empty project creates no config, package or state',t=>{
  const root=temporary(t);const result=inspectProject(root);
  assert.deepEqual(fs.readdirSync(root),[]);assert.ok(result.dependencies.every(x=>x.installed===null&&x.declared===null));
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
