import test from 'node:test';
import assert from 'node:assert/strict';
import { runtimeCompatibility, assertKnowledgeSchema } from '../skills/js-superagent-skill/scripts/compatibility.mjs';

test('knowledge compatibility pins package and schema together without granting material access', () => {
  for (const version of ['0.14.0-alpha.1', '0.14.0-alpha.2', '0.14.0-alpha.3', '0.14.0-alpha.4']) {
    assert.doesNotThrow(() => assertKnowledgeSchema(version, 14));
    assert.throws(() => assertKnowledgeSchema(version, 15), /inspect and upgrade separately/);
    assert.equal(runtimeCompatibility(version).materials, 'not-supported-by-this-adapter');
  }
  for (const version of ['0.15.0-alpha.0', '0.15.0-alpha.1', '0.15.0-alpha.2', '0.15.0-alpha.3', '0.15.0-alpha.4', '0.15.0-alpha.5', '0.15.0-alpha.6']) {
    for (const schema of [14, 15]) assert.doesNotThrow(() => assertKnowledgeSchema(version, schema));
    assert.equal(runtimeCompatibility(version).materials, 'check-public-capabilities');
    assert.throws(() => assertKnowledgeSchema(version, 13));
    assert.throws(() => assertKnowledgeSchema(version, 16));
  }
  for (const [version, schema] of [['0.15.0-alpha.7', 15], ['0.14.0-alpha.0', 14], [undefined, 15]]) {
    assert.throws(() => assertKnowledgeSchema(version, schema));
  }
});
