import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export function validateVersion({version,packageVersion,lockVersion,skillVersion,changelog,tag}) {
  if(!/^\d+\.\d+\.\d+(?:-(?:alpha|beta|rc)\.\d+)?$/.test(version))throw Error('Invalid skill SemVer');
  if(packageVersion!==version||lockVersion!==version||skillVersion!==version)throw Error('Skill versions disagree');
  if(!changelog.split('\n').some(line=>line.startsWith(`## ${version} — `)))throw Error('Missing changelog entry');
  if(tag&&tag!==`v${version}`)throw Error('Tag does not match skill version');
  return version;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
  const version=validateVersion({version:read('VERSION').trim(),packageVersion:JSON.parse(read('package.json')).version,lockVersion:JSON.parse(read('package-lock.json')).packages[''].version,
    skillVersion:read('skills/js-superagent-skill/SKILL.md').split('---')[1].match(/^  version: "([^"]+)"$/m)?.[1],changelog:read('CHANGELOG.md'),tag:process.env.RELEASE_TAG});
  console.log(`Skill version ${version} verified`);
}
