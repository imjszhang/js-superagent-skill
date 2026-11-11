import test from 'node:test';
import assert from 'node:assert/strict';
import { runtimeCompatibility, assertKnowledgeSchema } from '../skills/js-superagent-skill/scripts/compatibility.mjs';

test('knowledge compatibility pins package and schema together without granting material access', () => {
  for (const version of ['0.14.0-alpha.1', '0.14.0-alpha.2', '0.14.0-alpha.3', '0.14.0-alpha.4']) {
    assert.doesNotThrow(() => assertKnowledgeSchema(version, 14));
    assert.throws(() => assertKnowledgeSchema(version, 15), /inspect and upgrade separately/);
    assert.equal(runtimeCompatibility(version).materials, 'not-supported-by-this-adapter');
  }
  for (const schema of [14, 15]) assert.doesNotThrow(() => assertKnowledgeSchema('0.15.0-alpha.0', schema));
  assert.equal(runtimeCompatibility('0.15.0-alpha.0').materials, 'check-public-capabilities');
  for (const [version, schema] of [['0.15.0-alpha.0', 16], ['0.15.0-alpha.1', 15], ['0.14.0-alpha.0', 14], [undefined, 15]]) {
    assert.throws(() => assertKnowledgeSchema(version, schema));
  }
});
