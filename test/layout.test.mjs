import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
test('installable directory runs independently without repository management files',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'skill-payload-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 fs.cpSync(new URL('../skills/js-superagent-skill/',import.meta.url),dir,{recursive:true});
 assert.deepEqual(fs.readdirSync(dir).sort(),['LICENSE','SKILL.md','agents','assets','references','scripts']);
 assert.deepEqual(fs.readdirSync(path.join(dir,'scripts')).sort(),['compatibility.mjs','inspect.mjs','knowledge.mjs','project-agent.mjs']);
 const result=execFileSync(process.execPath,[path.join(dir,'scripts/inspect.mjs'),'--help'],{encoding:'utf8'});assert.match(result,/read only/);
 for(const file of fs.readdirSync(dir,{recursive:true}).filter(file=>file.endsWith('.md'))){
  const text=fs.readFileSync(path.join(dir,file),'utf8');for(const m of text.matchAll(/\]\(([^)]+)\)/g)){if(!/^(https?:|#)/.test(m[1]))assert.ok(fs.existsSync(path.resolve(dir,path.dirname(file),m[1])));}
 }
});
