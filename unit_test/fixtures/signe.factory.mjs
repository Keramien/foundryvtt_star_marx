export function createSigneFixture(catalogEntry, overrides = {}) {
  const base = {
    slug: catalogEntry.slug,
    name: catalogEntry.name,
    category: catalogEntry.category,
    traitLink: catalogEntry.traitLink ?? "",
    description: catalogEntry.description ?? "",
    sourcePath: catalogEntry.sourcePath
  };

  return {
    ...base,
    ...overrides
  };
}
