// Per-sign testing notes used by the generator.
// Keep this file small and explicit as sign mechanics become implemented.

const COMPLEX_SIGNS = new Set([
  // Add slug names here when a sign needs dedicated branch tests.
  // Example: "acolyte"
]);

export function isComplexSign(slug) {
  return COMPLEX_SIGNS.has(slug);
}
