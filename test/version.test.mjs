import {test} from 'node:test';import assert from 'node:assert/strict';import {validateVersion} from '../scripts/check-version.mjs';
const fixture={version:'0.1.1',packageVersion:'0.1.1',skillVersion:'0.1.1',changelog:'## 0.1.1 — 2026-11-10',tag:'v0.1.1'};
test('accepts consistent tagged version',()=>assert.equal(validateVersion(fixture),'0.1.1'));
test('rejects inconsistent artifact identity and missing release notes',()=>{
 for(const change of [{packageVersion:'0.1.0'},{skillVersion:'0.1.0'},{tag:'v0.1.0'},{version:'latest'},{changelog:'## 0.1.10 — later'}])assert.throws(()=>validateVersion({...fixture,...change}));
});
