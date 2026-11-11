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
});
export const supportedRuntimeVersions = Object.freeze(Object.keys(layouts));
export function runtimeCompatibility(version) {
  const schemas = Object.hasOwn(layouts, version) ? layouts[version] : undefined;
  return { knowledge: schemas ? { supported: true, schemas: [...schemas] } : { supported: false, schemas: [] },
    materials: ['0.15.0-alpha.0', '0.15.0-alpha.1', '0.15.0-alpha.2', '0.15.0-alpha.3'].includes(version) ? 'check-public-capabilities' : 'not-supported-by-this-adapter' };
}
export function assertKnowledgeSchema(version, schema) {
  const compatibility = runtimeCompatibility(version);
  if (!compatibility.knowledge.schemas.includes(schema)) throw Error(`Knowledge sync does not support js-superagent ${version} with state schema ${schema}; inspect and upgrade separately`);
}
