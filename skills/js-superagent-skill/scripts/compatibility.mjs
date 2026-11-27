// Exact package layouts checked by this skill. Capabilities still come from the SDK.
const layouts = Object.freeze({
  '0.14.0-alpha.1': [14],
  '0.14.0-alpha.2': [14],
  '0.14.0-alpha.3': [14],
  '0.14.0-alpha.4': [14],
  '0.15.0-alpha.0': [14, 15],
  '0.15.0-alpha.1': [14, 15],
  '0.15.0-alpha.2': [14, 15],
  '0.15.0-alpha.3': [14, 15],
  '0.15.0-alpha.4': [14, 15],
  '0.15.0-alpha.5': [14, 15],
  '0.15.0-alpha.6': [14, 15],
  '0.15.0-alpha.7': [14, 15],
  '0.15.0-alpha.10': [14, 15],
  '0.15.0-alpha.11': [14, 15],
  '0.15.0-alpha.12': [14, 15],
  '0.15.0-alpha.13': [14, 15],
  '0.15.0-alpha.14': [14, 15],
  '0.15.0-alpha.15': [14, 15],
});
export const supportedRuntimeVersions = Object.freeze(Object.keys(layouts));

// Classify an observation supplied by an existing runtime or an isolated test.
// This helper deliberately neither imports a runtime nor infers capability from a version.
export function hostFactsCompatibility(capabilities) {
  if (capabilities === undefined) return { status: 'not-observed', supported: null, requiredVersion: 1 };
  if (capabilities === null) return { status: 'unavailable', supported: false, requiredVersion: 1 };
  const version = typeof capabilities === 'object' && !Array.isArray(capabilities) ? capabilities.version : undefined;
  return { status: version === 1 ? 'supported' : 'unsupported', supported: version === 1,
    requiredVersion: 1, observedVersion: Number.isSafeInteger(version) ? version : null };
}

export function runtimeCompatibility(version) {
  const schemas = Object.hasOwn(layouts, version) ? layouts[version] : undefined;
  return { knowledge: schemas ? { supported: true, schemas: [...schemas] } : { supported: false, schemas: [] },
    materials: schemas?.includes(15) ? 'check-public-capabilities' : 'not-supported-by-this-adapter' };
}
export function assertKnowledgeSchema(version, schema) {
  const compatibility = runtimeCompatibility(version);
  if (!compatibility.knowledge.schemas.includes(schema)) throw Error(`Knowledge sync does not support js-superagent ${version} with state schema ${schema}; inspect and upgrade separately`);
}
