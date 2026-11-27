import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {inspectComponents,resolveComponent,importComponent,bindComponents,componentBindingPath} from '../skills/js-superagent-skill/scripts/components.mjs';
function fixture(t) {
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'skill components ')));
  const project=path.join(base,'project'),global=path.join(base,'prefix/lib/node_modules');
  fs.mkdirSync(project);fs.mkdirSync(global,{recursive:true});
  const options={globalRoots:[global],bindingHome:path.join(base,'bindings'),source:'auto'};
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));return {base,project,global,options};
}
function pkg(directory,name,version='0.15.0-alpha.17',options={}) {
  const root=path.join(directory,name);fs.mkdirSync(root,{recursive:true});
  fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({name,version,type:'module',exports:{'.':{import:'./index.mjs'},'./public/*':'./*.mjs'},bin:{[name]:'./cli.mjs'},...options}));
  fs.writeFileSync(path.join(root,'index.mjs'),`export const location=${JSON.stringify(root)};`);
  fs.writeFileSync(path.join(root,'feature.mjs'),'export const feature=true;');
  fs.writeFileSync(path.join(root,'cli.mjs'),'console.log("fixture");');return root;
}
test('global-only project without package.json resolves imports and wildcard public exports without project writes',async t=>{
  const f=fixture(t);const root=pkg(f.global,'js-superagent');
  assert.equal(inspectComponents(f.project,f.options).components['js-superagent'].source,'global');
  assert.equal((await importComponent(f.project,'js-superagent',f.options)).location,root);
  assert.equal((await importComponent(f.project,'js-superagent/public/feature',f.options)).feature,true);
  assert.throws(()=>resolveComponent(f.project,'js-superagent/private',f.options),/public export/);
  assert.deepEqual(fs.readdirSync(f.project),[]);
});
test('global is default; explicit local remains available and inventory does not evaluate code',t=>{
  const f=fixture(t);pkg(f.global,'js-superagent');const local=pkg(path.join(f.project,'node_modules'),'js-superagent','0.15.0-alpha.15');
  fs.writeFileSync(path.join(local,'index.mjs'),'throw Error("do not import");');
  assert.equal(resolveComponent(f.project,'js-superagent',f.options).source,'global');
  assert.equal(resolveComponent(f.project,'js-superagent',{...f.options,source:'local'}).packageRoot,local);
  assert.equal(inspectComponents(f.project,{...f.options,source:'local'}).components['js-superagent'].version,'0.15.0-alpha.15');
});
test('bound packages work without npm/PATH, remain independent per project and reject manifest/Node drift',t=>{
  const f=fixture(t);const root=pkg(f.global,'js-superagent');bindComponents(f.project,{...f.options,source:'global'});
  const other=path.join(f.base,'other');fs.mkdirSync(other);assert.notEqual(componentBindingPath(other,f.options),componentBindingPath(f.project,f.options));
  const old=process.env.PATH;process.env.PATH='';try{assert.equal(resolveComponent(f.project,'js-superagent',f.options).packageRoot,root);}finally{process.env.PATH=old;}
  const manifest=path.join(root,'package.json'),original=fs.readFileSync(manifest);fs.writeFileSync(manifest,original+'\n');
  assert.throws(()=>resolveComponent(f.project,'js-superagent',f.options),/Bound component changed/);fs.writeFileSync(manifest,original);
  const file=componentBindingPath(f.project,f.options),binding=JSON.parse(fs.readFileSync(file));binding.nodeVersion='0.0.0';fs.writeFileSync(file,JSON.stringify(binding));
  assert.throws(()=>resolveComponent(f.project,'js-superagent',f.options),/Bound Node changed/);
});
test('binding does not silently change selection and explicit stopped replacement can recover drift',t=>{
  const f=fixture(t);const global=pkg(f.global,'js-superagent');bindComponents(f.project,{...f.options,source:'global'});
  pkg(path.join(f.project,'node_modules'),'js-superagent','0.15.0-alpha.15');
  assert.equal(resolveComponent(f.project,'js-superagent',{...f.options,source:'local'}).packageRoot,global);
  assert.throws(()=>bindComponents(f.project,{...f.options,source:'local'}),/already bound/);
  const manifest=path.join(global,'package.json');fs.appendFileSync(manifest,'\n');
  bindComponents(f.project,{...f.options,source:'local',replace:true});assert.equal(resolveComponent(f.project,'js-superagent',f.options).version,'0.15.0-alpha.15');
});
test('unknown global runtime is rejected instead of falling back to compatible local',t=>{
  const f=fixture(t);pkg(f.global,'js-superagent','99.0.0');pkg(path.join(f.project,'node_modules'),'js-superagent');
  assert.match(inspectComponents(f.project,f.options).issues[0],/Unsupported/);
  assert.throws(()=>resolveComponent(f.project,'js-superagent',f.options),/Unsupported/);
});
test('actual longrun peer and runtime SDK must resolve to selected packages, including nested duplicates',t=>{
  const f=fixture(t);const runtime=pkg(f.global,'js-superagent');const longrun=pkg(f.global,'js-longrun','0.2.0-alpha.1',{peerDependencies:{'js-superagent':'^0.15.0-alpha.0'}});
  pkg(f.global,'@larksuiteoapi/node-sdk','1.76.0');assert.equal(inspectComponents(f.project,f.options).issues.length,0);
  pkg(path.join(longrun,'node_modules'),'js-superagent');assert.throws(()=>resolveComponent(f.project,'js-longrun',f.options),/different js-superagent/);
  fs.rmSync(path.join(longrun,'node_modules'),{recursive:true});pkg(path.join(runtime,'node_modules'),'@larksuiteoapi/node-sdk','1.76.0');
  assert.throws(()=>resolveComponent(f.project,'js-superagent',f.options),/different @larksuiteoapi/);
});
test('existing service keeps local selection and blocks rebinding until registration is removed',t=>{
  const f=fixture(t);pkg(f.global,'js-superagent');const local=pkg(path.join(f.project,'node_modules'),'js-superagent','0.15.0-alpha.15');
  const old=process.env.JS_SUPERAGENT_HOME;process.env.JS_SUPERAGENT_HOME=path.join(f.base,'state');
  const directory=path.join(process.env.JS_SUPERAGENT_HOME,'projects','synthetic','service');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify({projectRoot:f.project}));
  try {assert.equal(resolveComponent(f.project,'js-superagent',f.options).packageRoot,local);assert.throws(()=>bindComponents(f.project,{...f.options,source:'global'}),/uninstall/);}
  finally {if(old===undefined)delete process.env.JS_SUPERAGENT_HOME;else process.env.JS_SUPERAGENT_HOME=old;}
});
test('longrun custom runtime binding retains local components and prevents global rebinding',t=>{
  const f=fixture(t);pkg(f.global,'js-superagent');const local=pkg(path.join(f.project,'node_modules'),'js-superagent','0.15.0-alpha.15');
  const runtimeHome=path.join(f.base,'custom-runtime'),runtimeDir=path.join(runtimeHome,'projects','synthetic');fs.mkdirSync(runtimeDir,{recursive:true});
  fs.writeFileSync(path.join(runtimeDir,'service.json'),JSON.stringify({projectRoot:f.project,intent:'running'}));
  fs.mkdirSync(path.join(f.project,'working/longrun'),{recursive:true});fs.writeFileSync(path.join(f.project,'working/longrun/runtime-binding.json'),JSON.stringify({schemaVersion:1,projectRoot:f.project,runtimeHome,runtimeDir}));
  assert.equal(resolveComponent(f.project,'js-superagent',f.options).packageRoot,local);
  assert.throws(()=>bindComponents(f.project,{...f.options,source:'global'}),/uninstall/);
});
test('binding real package roots works across npm links and package directory renames',t=>{
  const f=fixture(t),directory=path.join(f.base,'unpacked');pkg(f.base,'unpacked','0.2.4',{name:'js-agent-runtime'});
  fs.symlinkSync(directory,path.join(f.global,'js-agent-runtime'));
  bindComponents(f.project,{...f.options,source:'global'});
  assert.equal(resolveComponent(f.project,'js-agent-runtime',f.options).packageRoot,directory);
});
test('nested optional SDK is discovered and bound; engines and peer mismatches are rejected',t=>{
  const f=fixture(t),runtime=pkg(f.global,'js-superagent');
  const sdk=pkg(path.join(runtime,'node_modules'),'@larksuiteoapi/node-sdk','1.76.0');
  bindComponents(f.project,{...f.options,source:'global'});fs.appendFileSync(path.join(sdk,'package.json'),'\n');
  assert.throws(()=>resolveComponent(f.project,'js-superagent',f.options),/Bound component changed/);
  fs.rmSync(componentBindingPath(f.project,f.options));
  const longrun=pkg(f.global,'js-longrun','0.2.0-alpha.1',{peerDependencies:{'js-superagent':'^9.0.0'}});
  assert.throws(()=>resolveComponent(f.project,'js-longrun',f.options),/peer range/);
  fs.rmSync(longrun,{recursive:true});pkg(f.global,'js-agent-runtime','0.2.4',{engines:{node:'>=99.0.0'}});
  assert.throws(()=>resolveComponent(f.project,'js-agent-runtime',f.options),/requires Node/);
});
test('unknown public export preserves the native Node error code',t=>{
  const f=fixture(t);pkg(f.global,'js-superagent');assert.throws(()=>resolveComponent(f.project,'js-superagent/missing',f.options),{code:'ERR_PACKAGE_PATH_NOT_EXPORTED'});
});
test('managed installation rejects custom binding homes and exec cannot override project identity',async t=>{
  const f=fixture(t);const old=process.env.JS_SUPERAGENT_SKILL_HOME;process.env.JS_SUPERAGENT_SKILL_HOME=f.options.bindingHome;
  try {
    const {main}=await import('../skills/js-superagent-skill/scripts/project-agent.mjs');
    await assert.rejects(main(['--project',f.project,'service','install']),/default.*binding home/);
    const {main:componentsMain}=await import('../skills/js-superagent-skill/scripts/components.mjs');
    await assert.rejects(componentsMain(['--project',f.project,'exec','js-longrun','service','install']),/default.*binding home/);
    await assert.rejects(componentsMain(['--project',f.project,'exec','js-longrun','--project',f.base,'status']),/cannot override/);
  }finally{if(old===undefined)delete process.env.JS_SUPERAGENT_SKILL_HOME;else process.env.JS_SUPERAGENT_SKILL_HOME=old;}
});
test('concurrent binding operation refuses to overwrite an existing lock or binding',t=>{
  const f=fixture(t);pkg(f.global,'js-superagent');const file=componentBindingPath(f.project,f.options);
  fs.mkdirSync(file+'.lock',{recursive:true});assert.throws(()=>bindComponents(f.project,f.options),/in progress/);assert.equal(fs.existsSync(file),false);
  fs.rmdirSync(file+'.lock');bindComponents(f.project,f.options);const before=fs.readFileSync(file);
  assert.throws(()=>bindComponents(f.project,f.options),/already bound/);assert.deepEqual(fs.readFileSync(file),before);
});
