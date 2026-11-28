import test from 'node:test';
import assert from 'node:assert/strict';
import { runtimeCompatibility, assertKnowledgeSchema, hostFactsCompatibility } from '../skills/js-superagent-skill/scripts/compatibility.mjs';

test('host-facts compatibility distinguishes unobserved, unavailable and supported public observations', () => {
  assert.deepEqual(hostFactsCompatibility(), { status: 'not-observed', supported: null, requiredVersion: 1 });
  assert.deepEqual(hostFactsCompatibility(null), { status: 'unavailable', supported: false, requiredVersion: 1 });
  assert.deepEqual(hostFactsCompatibility({ version: 1 }), { status: 'supported', supported: true, requiredVersion: 1, observedVersion: 1 });
  assert.equal(hostFactsCompatibility({ version: 1, futureOptionalField: true }).supported, true);
  for (const value of [{}, { version: 2 }, { version: '1' }, [{ version: 1 }], true]) {
    assert.equal(hostFactsCompatibility(value).status, 'unsupported');
    assert.equal(hostFactsCompatibility(value).supported, false);
  }
  assert.equal(hostFactsCompatibility({ version: 2 }).observedVersion, 2);
  assert.equal(hostFactsCompatibility({ version: '1' }).observedVersion, null);
  assert.equal(runtimeCompatibility('999.0.0').knowledge.supported, false, 'A public observation never widens the knowledge schema matrix');
});

test('knowledge compatibility pins package and schema together without granting material access', () => {
  for (const version of ['0.14.0-alpha.1', '0.14.0-alpha.2', '0.14.0-alpha.3', '0.14.0-alpha.4']) {
    assert.doesNotThrow(() => assertKnowledgeSchema(version, 14));
    assert.throws(() => assertKnowledgeSchema(version, 15), /inspect and upgrade separately/);
    assert.equal(runtimeCompatibility(version).materials, 'not-supported-by-this-adapter');
  }
  for (const version of ['0.15.0-alpha.0', '0.15.0-alpha.1', '0.15.0-alpha.2', '0.15.0-alpha.3', '0.15.0-alpha.4', '0.15.0-alpha.5', '0.15.0-alpha.6', '0.15.0-alpha.7', '0.15.0-alpha.10', '0.15.0-alpha.11', '0.15.0-alpha.12', '0.15.0-alpha.13', '0.15.0-alpha.14', '0.15.0-alpha.15', '0.15.0-alpha.16', '0.15.0-alpha.17', '0.15.0-alpha.18']) {
    for (const schema of [14, 15]) assert.doesNotThrow(() => assertKnowledgeSchema(version, schema));
    assert.equal(runtimeCompatibility(version).materials, 'check-public-capabilities');
    assert.throws(() => assertKnowledgeSchema(version, 13));
    assert.throws(() => assertKnowledgeSchema(version, 16));
  }
  for (const [version, schema] of [['0.15.0-alpha.19', 15], ['0.15.0-alpha.8', 15], ['0.14.0-alpha.0', 14], [undefined, 15]]) {
    assert.throws(() => assertKnowledgeSchema(version, schema));
  }
});
