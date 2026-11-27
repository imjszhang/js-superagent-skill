#!/usr/bin/env node
// Shared, read-only discovery and explicit per-project machine bindings.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash, randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {supportedRuntimeVersions} from './compatibility.mjs';
export const componentNames = ['js-superagent','js-longrun','js-agent-runtime','@larksuiteoapi/node-sdk'];
const sha = data => createHash('sha256').update(data).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file,'utf8'));
function project(root) {
  if (!path.isAbsolute(root)) throw Error('--project must be an absolute directory');
  root=fs.realpathSync(root); if (!fs.statSync(root).isDirectory()) throw Error('Project is not a directory'); return root;
}
export function componentBindingPath(root, options={}) {
  const home=options.bindingHome??process.env.JS_SUPERAGENT_SKILL_HOME??path.join(os.homedir(),'.js-superagent-skill');
  if (!path.isAbsolute(home)) throw Error('Component binding home must be absolute');
  return path.join(home,'projects',sha(project(root)),'components.json');
}
function loadBinding(root, options) {
  const file=componentBindingPath(root,options);
  if (!fs.existsSync(file)) return null;
  const stat=fs.lstatSync(file);
  if (!stat.isFile()||stat.isSymbolicLink()||(stat.mode&0o077)||(typeof process.getuid==='function'&&stat.uid!==process.getuid())) throw Error('Unsafe component binding');
  const value=read(file);
  if(value.schemaVersion!==1||value.projectRoot!==root||!value.components||!path.isAbsolute(value.nodeExecutable??'')) throw Error('Invalid component binding');
  return value;
}
function installedServices(root) {
  const locations=[path.join(process.env.JS_SUPERAGENT_HOME??path.join(os.homedir(),'.js-superagent'),'projects'),
    path.join(process.env.JS_LONGRUN_HOME??path.join(os.homedir(),'.js-longrun'),'projects')];
  const found=[];
  const anchor=path.join(root,'working/longrun/runtime-binding.json');
  if(fs.existsSync(anchor)) {
    const binding=read(anchor);
    if(binding.projectRoot!==root||!path.isAbsolute(binding.runtimeHome??'')||!path.isAbsolute(binding.runtimeDir??''))throw Error('Invalid existing longrun runtime binding');
    locations.push(path.join(binding.runtimeHome,'projects'));
    const manifest=path.join(binding.runtimeDir,'service.json');
    if(fs.existsSync(manifest)&&read(manifest).projectRoot===root)found.push(manifest);
  }
  for(const directory of locations) {
    if(!fs.existsSync(directory))continue;
    for(const child of fs.readdirSync(directory,{withFileTypes:true})) {
      if(!child.isDirectory())continue;
      for(const relative of ['service/manifest.json','service.json','manifest.json']) {
        const file=path.join(directory,child.name,relative); if(!fs.existsSync(file))continue;
        try {if(read(file).projectRoot===root)found.push(file);}catch {throw Error('Cannot inspect existing service ownership');}
      }
    }
  }
  return found;
}
function globalDirectories(options) {
  if(options.globalRoots)return options.globalRoots.map(p=>path.resolve(p));
  const directories=[];
  const result=spawnSync('npm',['root','-g'],{encoding:'utf8',timeout:5000,maxBuffer:65536,shell:false});
  if(result.status===0&&path.isAbsolute(result.stdout.trim()))directories.push(result.stdout.trim());
  // A PATH executable may belong to another Node prefix. Inspect its real package;
  // do not trust the executable name or run package code to identify it.
  for(const directory of (process.env.PATH??'').split(path.delimiter).filter(path.isAbsolute)) {
    for(const name of ['js-superagent','js-longrun']) {
      const bin=path.join(directory,name); if(!fs.existsSync(bin))continue;
      let at=path.dirname(fs.realpathSync(bin));
      while(path.dirname(at)!==at) {
        const file=path.join(at,'package.json');
        if(fs.existsSync(file)) {try {if(read(file).name===name)directories.push(path.dirname(at));}catch {} break;}
        at=path.dirname(at);
      }
    }
  }
  return [...new Set(directories)];
}
function descriptor(directory,name,source) {
  const file=path.join(directory,name,'package.json'); if(!fs.existsSync(file))return null;
  return descriptorAt(path.dirname(file),name,source);
}
function descriptorAt(directory,name,source) {
  const packageRoot=fs.realpathSync(directory), bytes=fs.readFileSync(path.join(packageRoot,'package.json')), data=JSON.parse(bytes);
  if(data.name!==name||typeof data.version!=='string')throw Error(`Invalid component manifest: ${name}`);
  return {name,source,packageRoot,version:data.version,manifestSha256:sha(bytes),engines:data.engines??{},peerDependencies:data.peerDependencies??{},
    publicSubpaths:data.exports&&typeof data.exports==='object'?Object.keys(data.exports).filter(k=>k.startsWith('./')):[]};
}
function localDirectories(root,name) {return createRequire(path.join(root,'__component_probe__.cjs')).resolve.paths(name)??[];}
function verifyBinding(value) {
  if(fs.realpathSync(value.nodeExecutable)!==value.nodeExecutable||fs.realpathSync(process.execPath)!==value.nodeExecutable||process.versions.node!==value.nodeVersion) throw Error(`Bound Node changed; use ${value.nodeExecutable} or explicitly rebind the stopped deployment`);
  for(const [name,saved] of Object.entries(value.components)) {
    if(!componentNames.includes(name)||saved.name!==name||!path.isAbsolute(saved.packageRoot??''))throw Error('Invalid bound component');
    const actual=descriptorAt(saved.packageRoot,name,saved.source);
    if(!actual||actual.packageRoot!==saved.packageRoot||actual.version!==saved.version||actual.manifestSha256!==saved.manifestSha256)throw Error(`Bound component changed: ${name}; restore it or explicitly rebind the stopped deployment`);
  }
}
export function inspectComponents(projectRoot,options={}) {
  const root=project(projectRoot), binding=options.ignoreBinding?null:loadBinding(root,options);
  if(binding) {verifyBinding(binding);return {project:root,bindingPath:componentBindingPath(root,options),bound:true,nodeExecutable:binding.nodeExecutable,nodeVersion:binding.nodeVersion,components:binding.components,selection:'binding',issues:relationshipIssues(binding.components,binding.nodeExecutable)};}
  const services=installedServices(root), requested=options.source??process.env.JS_SUPERAGENT_COMPONENT_SOURCE??'auto';
  if(!['auto','global','local'].includes(requested))throw Error('Component source must be auto, global or local');
  if(services.length&&requested==='global')throw Error('Existing service must be stopped and uninstalled before switching component source');
  const mode=services.length?'local':requested;
  const global=mode==='local'?[]:globalDirectories(options), components={};
  for(const name of componentNames) {
    const candidates=[...global.map(directory=>({directory,source:'global'})),...(mode==='global'?[]:localDirectories(root,name).map(directory=>({directory,source:'local'})))];
    for(const candidate of candidates) {const item=descriptor(candidate.directory,name,candidate.source);if(item){components[name]=item;break;}}
  }
  const runtime=components['js-superagent'];
  if(runtime&&!components['@larksuiteoapi/node-sdk']) {
    try {
      const actual=containingPackage(resolveFrom(runtime.packageRoot,'@larksuiteoapi/node-sdk',process.execPath),'@larksuiteoapi/node-sdk');
      components['@larksuiteoapi/node-sdk']=descriptorAt(actual,'@larksuiteoapi/node-sdk',runtime.source);
    }catch(error){if(!['ERR_MODULE_NOT_FOUND','MODULE_NOT_FOUND'].includes(error.code))throw error;}
  }
  return {project:root,bindingPath:componentBindingPath(root,options),bound:false,nodeExecutable:fs.realpathSync(process.execPath),nodeVersion:process.versions.node,components,
    selection:services.length?'existing-service-local':mode,issues:relationshipIssues(components,process.execPath)};
}
// Ask Node's ESM resolver for exports, conditional exports and subpath patterns.
// Resolving imports does not evaluate the dependency. NODE_PATH is not used.
function resolveFrom(packageRoot,specifier,nodeExecutable) {
  const result=spawnSync(nodeExecutable,['--experimental-import-meta-resolve','--input-type=module','-e',
    'try {process.stdout.write(JSON.stringify({url:import.meta.resolve(process.argv[1],process.argv[2])}));} catch(error) {process.stdout.write(JSON.stringify({error:error.code}));}',specifier,pathToFileURL(path.join(packageRoot,'__component_resolve__.mjs')).href],
    {encoding:'utf8',timeout:5000,maxBuffer:65536,shell:false,env:{...process.env,NODE_OPTIONS:''}});
  if(result.error||result.status!==0)throw Error(`Cannot resolve public export ${specifier}`);
  const response=JSON.parse(result.stdout);if(response.error)throw Object.assign(Error(`Cannot resolve public export ${specifier}`),{code:response.error});
  const url=response.url; if(!url.startsWith('file:'))throw Error(`Unsupported export for ${specifier}`);
  return fs.realpathSync(fileURLToPath(url));
}
function containingPackage(entry,name) {
  let at=path.dirname(entry);
  while(path.dirname(at)!==at) {const file=path.join(at,'package.json');if(fs.existsSync(file)&&read(file).name===name)return fs.realpathSync(at);at=path.dirname(at);}
  throw Error(`Cannot identify resolved package ${name}`);
}
function versionParts(value) {
  const match=/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?$/.exec(value);
  if(!match)return null;return [Number(match[1]),Number(match[2]??0),Number(match[3]??0),match[4]];
}
function compare(a,b) {
  for(let i=0;i<3;i++)if(a[i]!==b[i])return Math.sign(a[i]-b[i]);
  if(a[3]===b[3])return 0;if(!a[3])return 1;if(!b[3])return -1;
  const aa=a[3].split('.'),bb=b[3].split('.');
  for(let i=0;i<Math.max(aa.length,bb.length);i++) {if(aa[i]===bb[i])continue;if(aa[i]===undefined)return -1;if(bb[i]===undefined)return 1;const an=/^\d+$/.test(aa[i]),bn=/^\d+$/.test(bb[i]);if(an&&bn)return Math.sign(Number(aa[i])-Number(bb[i]));if(an!==bn)return an?-1:1;return aa[i]<bb[i]?-1:1;}return 0;
}
function matchesRange(version,range) {
  const v=versionParts(version);if(!v||typeof range!=='string')return false;
  return range.split('||').some(branch=>{
    const tokens=branch.trim().split(/\s+/),parsed=tokens.map(token=>/^(>=|<=|>|<|\^|~|=)?(\d+(?:\.\d+){0,2}(?:-[0-9A-Za-z.-]+)?)$/.exec(token));
    if(parsed.some(x=>!x))return false;
    if(v[3]&&!parsed.some(m=>{const b=versionParts(m[2]);return b[3]&&b.slice(0,3).every((n,i)=>n===v[i]);}))return false;
    return parsed.every(m=>{const b=versionParts(m[2]),c=compare(v,b);switch(m[1]??'='){case '>=':return c>=0;case '<=':return c<=0;case '>':return c>0;case '<':return c<0;case '=':return c===0;case '~':return c>=0&&v[0]===b[0]&&v[1]===b[1];case '^':return c>=0&&(b[0]>0?v[0]===b[0]:b[1]>0?v[0]===0&&v[1]===b[1]:v[0]===0&&v[1]===0&&v[2]===b[2]);default:return false;}});
  });
}
function relationshipIssues(components,nodeExecutable) {
  const issues=[], runtime=components['js-superagent'], longrun=components['js-longrun'], sdk=components['@larksuiteoapi/node-sdk'];
  for(const c of Object.values(components))if(c.engines?.node&&!matchesRange(process.versions.node,c.engines.node))issues.push(`${c.name} requires Node ${c.engines.node}; selected Node is ${process.versions.node}`);
  if(longrun&&runtime&&(!longrun.peerDependencies?.['js-superagent']||!matchesRange(runtime.version,longrun.peerDependencies['js-superagent'])))issues.push(`js-longrun peer range does not accept selected js-superagent ${runtime.version}`);
  if(runtime&&!supportedRuntimeVersions.includes(runtime.version))issues.push(`Unsupported js-superagent ${runtime.version}; inspect compatibility before upgrading`);
  for(const [name,owner,dependency] of [['js-superagent',longrun,runtime],['@larksuiteoapi/node-sdk',runtime,sdk]]) {
    if(!owner)continue;
    try {
      const resolved=containingPackage(resolveFrom(owner.packageRoot,name,nodeExecutable),name);
      if(!dependency||resolved!==dependency.packageRoot)issues.push(`${owner.name} resolves a different ${name}; install compatible components together`);
    }catch(error) {if(!dependency&&name==='@larksuiteoapi/node-sdk'&&['ERR_MODULE_NOT_FOUND','MODULE_NOT_FOUND'].includes(error.code))continue;issues.push(`${owner.name} cannot resolve selected ${name}`);}
  }
  return issues;
}
function checkedSelection(root,options) {
  const selection=inspectComponents(root,options);
  if(selection.issues.length)throw Error(selection.issues.join('; '));
  return selection;
}
const publicEntries=new Map();
export function resolveComponent(projectRoot,specifier,options={}) {
  const name=specifier.startsWith('@')?specifier.split('/').slice(0,2).join('/'):specifier.split('/')[0];
  if(!componentNames.includes(name))throw Error(`Unsupported component ${name}`);
  const selected=checkedSelection(projectRoot,options), component=selected.components[name];
  if(!component)throw Error(`Component not installed: ${name}; inspect global installation or explicitly bind a local installation`);
  const cacheKey=JSON.stringify([component.packageRoot,component.manifestSha256,specifier,selected.nodeExecutable]);
  const entry=publicEntries.get(cacheKey)??resolveFrom(component.packageRoot,specifier,selected.nodeExecutable);
  publicEntries.set(cacheKey,entry);
  if(!fs.existsSync(entry))throw Error(`Bound export disappeared: ${specifier}`);
  if(!entry.startsWith(component.packageRoot+path.sep))throw Error(`Public export escapes selected component: ${specifier}`);
  return {...component,entry,nodeExecutable:selected.nodeExecutable,nodeVersion:selected.nodeVersion,bound:selected.bound};
}
export async function importComponent(projectRoot,specifier,options={}) {return import(pathToFileURL(resolveComponent(projectRoot,specifier,options).entry).href);}
export function componentBin(component) {
  const manifest=read(path.join(component.packageRoot,'package.json'));
  const bin=typeof manifest.bin==='string'?manifest.bin:manifest.bin?.[component.name];
  if(typeof bin!=='string')throw Error(`${component.name} has no CLI; use importComponent`);
  const entry=fs.realpathSync(path.resolve(component.packageRoot,bin));
  if(!entry.startsWith(component.packageRoot+path.sep))throw Error('Component CLI escapes its package');return entry;
}
export function assertManagedBindingHome() {
  const custom=process.env.JS_SUPERAGENT_SKILL_HOME;
  if(custom&&path.resolve(custom)!==path.join(os.homedir(),'.js-superagent-skill'))throw Error('Managed service installation requires the default ~/.js-superagent-skill binding home; custom JS_SUPERAGENT_SKILL_HOME is supported only for foreground commands and tests');
}
export function bindComponents(projectRoot,options={}) {
  const root=project(projectRoot), file=componentBindingPath(root,options);
  fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
  const lock=file+'.lock';
  try {fs.mkdirSync(lock,{mode:0o700});}catch(error){if(error.code==='EEXIST')throw Error('Another component binding operation is in progress; inspect it before retrying');throw error;}
  try {
  const existing=loadBinding(root,options);
  if(installedServices(root).length)throw Error('Stop and uninstall existing service registrations before binding; keep their options and project state');
  if(existing&&!options.replace)throw Error('Components already bound; use --replace only after stopping dependent work');
  // A replacement deliberately discovers anew; never falls back during ordinary use.
  const candidate=inspectComponents(root,{...options,ignoreBinding:true});
  if(candidate.issues.length)throw Error(candidate.issues.join('; '));
  if(!Object.keys(candidate.components).length)throw Error('No components installed');
  for(const name of Object.keys(candidate.components)) {
    const entry=resolveFrom(candidate.components[name].packageRoot,name,candidate.nodeExecutable);
    if(!entry.startsWith(candidate.components[name].packageRoot+path.sep))throw Error(`Export escapes ${name}`);
  }
  const value={schemaVersion:1,projectRoot:root,nodeExecutable:candidate.nodeExecutable,nodeVersion:candidate.nodeVersion,components:candidate.components,boundAt:new Date().toISOString()};
  fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
  const temporary=file+'.'+randomUUID()+'.tmp';
  fs.writeFileSync(temporary,JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});fs.renameSync(temporary,file);
  return value;
  } finally {fs.rmdirSync(lock);}
}
export async function main(argv=process.argv.slice(2)) {
  if(argv.length===1&&argv[0]==='--help'){console.log('components.mjs --project /absolute/project inspect\ncomponents.mjs --project /absolute/project bind --source global|local [--replace]\ncomponents.mjs --project /absolute/project exec js-superagent|js-longrun [native arguments]\nInspection is read-only. Binding writes only machine state. Existing services must be stopped and uninstalled before rebinding. exec supplies --project and uses the selected Node.');return;}
  if(argv[0]!=='--project'||!argv[1])throw Error('Use --project /absolute/project inspect|bind|exec');
  const root=project(argv[1]),command=argv[2],args=argv.slice(3);
  if(command==='inspect'&&!args.length)console.log(JSON.stringify(inspectComponents(root),null,2));
  else if(command==='bind') {
    if(args[0]!=='--source'||!['global','local'].includes(args[1])||args.length>3||args[2]&&args[2]!=='--replace')throw Error('Use bind --source global|local [--replace]');
    console.log(JSON.stringify(bindComponents(root,{source:args[1],replace:args[2]==='--replace'}),null,2));
  }else if(command==='exec') {
    if(!['js-superagent','js-longrun'].includes(args[0]))throw Error('exec supports js-superagent or js-longrun');
    if(args.slice(1).some(a=>a==='--project'||a.startsWith('--project=')))throw Error('exec cannot override its selected project');
    if(args[1]==='service'&&args[2]==='install')assertManagedBindingHome();
    if(args[1]==='service'&&args[2]==='install'&&!inspectComponents(root).bound)throw Error('Bind components before installing a service: components.mjs --project <root> bind --source global|local');
    const c=resolveComponent(root,args[0]); const result=spawnSync(c.nodeExecutable,[componentBin(c),'--project',root,...args.slice(1)],{stdio:'inherit',shell:false});
    if(result.error)throw result.error;process.exitCode=result.status??1;
  }else throw Error('Use inspect, bind or exec');
}
if(process.argv[1]&&fs.realpathSync(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(`Components: ${error.message}`);process.exitCode=1;});
