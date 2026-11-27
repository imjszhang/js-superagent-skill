#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {inspectComponents, componentNames} from './components.mjs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hostFactsCompatibility,runtimeCompatibility} from './compatibility.mjs';
const names=componentNames;
export function inspectProject(project) {
  if(!path.isAbsolute(project))throw Error('--project must be an absolute directory');
  const root=fs.realpathSync(project);
  if(!fs.statSync(root).isDirectory())throw Error('Project is not a directory');
  const manifest=path.join(root,'package.json');
  const pkg=fs.existsSync(manifest)?JSON.parse(fs.readFileSync(manifest,'utf8')):{};
  const components=inspectComponents(root);
  const dependencies=names.map(name=>{
    const selected=components.components[name];
    const installed=selected?{...selected,location:selected.packageRoot}:null;
    return {name,declared:pkg.dependencies?.[name]??pkg.devDependencies?.[name]??null,installed};
  });
  return {project:root,node:process.versions.node,packageManager:pkg.packageManager??null,
    lockfiles:['package-lock.json','pnpm-lock.yaml','yarn.lock','bun.lock','bun.lockb'].filter(f=>fs.existsSync(path.join(root,f))),
    components,dependencies,runtimeCompatibility:runtimeCompatibility(dependencies.find(item=>item.name==='js-superagent')?.installed?.version),
    longrun: longrunInventory(root,dependencies.find(item=>item.name==='js-longrun')?.installed),
    hostFacts: hostFactsInventory(dependencies),
    scope:'Read-only installation inventory; does not establish account, executor, material grants or service readiness'};
}
function hostFactsInventory(dependencies) {
  const missingComponents=['js-superagent','js-longrun'].filter(name=>!dependencies.find(item=>item.name===name)?.installed);
  return {capability:hostFactsCompatibility(),missingComponents,synchronization:'not-observed',
    nextCheck:missingComponents.length?'Install the components required by the authorized task before checking host-facts integration':
      'Check hostFactsCapabilities() on the already connected SDK, then observe longrun synchronization; do not initialize a runtime for inventory',
    scope:'Manifest inventory only; package versions, exports and source text do not establish host-facts compatibility or freshness'};
}
function longrunInventory(root,installed) {
  const config=path.join(root,'longrun.config.json');
  let configuration={present:false};
  try {
    const stat=fs.lstatSync(config);
    if(!stat.isFile()||stat.isSymbolicLink()||stat.size>65536)throw Error('Expected a regular project configuration file of at most 64 KiB');
    const data=JSON.parse(fs.readFileSync(config,'utf8'));
    configuration={present:true,schemaVersion:data?.schemaVersion??null,tasksDir:typeof data?.tasksDir==='string'?data.tasksDir:null,
      validation:'not-validated; use the installed longrun layout resolver'};
  } catch(error) {
    if(error.code!=='ENOENT')configuration={present:true,error:'Cannot inspect longrun.config.json; inspect its format and file type before operating'};
  }
  return {configuration,
    managementExport:installed?.publicSubpaths?.includes('./service')?'js-longrun/service':null,
    layoutExport:installed?.publicSubpaths?.includes('./layout')?'js-longrun/layout':null,
    service:'not-observed',scope:'Manifest inventory only; exports do not establish API compatibility or service health'};
}
function version(command){
  const r=spawnSync(command,['--version'],{encoding:'utf8',timeout:5000,maxBuffer:65536,shell:false});
  return {available:!r.error&&r.status===0,version:!r.error&&r.status===0?r.stdout.trim().split('\n')[0]:null};
}
if(process.argv[1]&&fs.realpathSync(process.argv[1])===fs.realpathSync(fileURLToPath(import.meta.url))){
  try{
    const args=process.argv.slice(2);
    if(args.length===1&&args[0]==='--help'){console.log('node inspect.mjs --project /absolute/project (read only)');}
    else{
      if(args.length!==2||args[0]!=='--project')throw Error('Usage: inspect.mjs --project /absolute/project');
      console.log(JSON.stringify({...inspectProject(args[1]),tools:{npm:version('npm'),larkCli:version('lark-cli')}},null,2));
    }
  }catch(error){console.error(error.message);process.exitCode=1;}
}
