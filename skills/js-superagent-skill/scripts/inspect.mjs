#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const names=['js-superagent','js-longrun','js-agent-runtime','@larksuiteoapi/node-sdk'];
export function inspectProject(project) {
  if(!path.isAbsolute(project))throw Error('--project must be an absolute directory');
  const root=fs.realpathSync(project);
  if(!fs.statSync(root).isDirectory())throw Error('Project is not a directory');
  const manifest=path.join(root,'package.json');
  const pkg=fs.existsSync(manifest)?JSON.parse(fs.readFileSync(manifest,'utf8')):{};
  const require=createRequire(path.join(root,'__skill_inspect__.cjs'));
  const dependencies=names.map(name=>{
    let installed=null;
    // Read package manifests directly: import-only exports may reject require.resolve.
    for(const directory of require.resolve.paths(name)??[]){
      const file=path.join(directory,name,'package.json');
      if(!fs.existsSync(file))continue;
      const data=JSON.parse(fs.readFileSync(file,'utf8'));
      if(data.name!==name)continue;
      installed={version:data.version,location:fs.realpathSync(path.dirname(file)),engines:data.engines??{},peerDependencies:data.peerDependencies??{}};
      break;
    }
    return {name,declared:pkg.dependencies?.[name]??pkg.devDependencies?.[name]??null,installed};
  });
  return {project:root,node:process.versions.node,packageManager:pkg.packageManager??null,
    lockfiles:['package-lock.json','pnpm-lock.yaml','yarn.lock','bun.lock','bun.lockb'].filter(f=>fs.existsSync(path.join(root,f))),
    dependencies,scope:'Read-only installation inventory; does not establish account, executor or service readiness'};
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
