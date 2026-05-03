import assert from "node:assert/strict";

export function assertNumberChanged(before, after, path, expectedDelta) {
  const start = getPath(before, path);
  const end = getPath(after, path);
  assert.equal(typeof start, "number", `Path ${path} is not a number in before state`);
  assert.equal(typeof end, "number", `Path ${path} is not a number in after state`);
  assert.equal(end - start, expectedDelta, `Unexpected delta on ${path}`);
}

export function assertPathEqual(actual, path, expected) {
  assert.deepEqual(getPath(actual, path), expected);
}

function getPath(input, dottedPath) {
  return dottedPath.split(".").reduce((acc, key) => acc?.[key], input);
}
