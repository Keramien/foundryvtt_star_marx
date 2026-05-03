import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PATHS, SIGN_CATEGORIES } from "../test.config.mjs";
import { loadSignsCatalogFromSource } from "./check-signes-coverage.mjs";
import { isComplexSign } from "../meta/mapping-rules.mjs";

export function generateAll() {
  ensureDirectories();

  const catalog = loadSignsCatalogFromSource();
  fs.writeFileSync(PATHS.signsCatalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

  let created = 0;
  let skipped = 0;
  for (const sign of catalog) {
    const outPath = path.join(PATHS.signsTestsDir, sign.category, `${sign.slug}.test.mjs`);
    if (fs.existsSync(outPath)) {
      skipped += 1;
      continue;
    }
    fs.writeFileSync(outPath, buildTestFile(sign), "utf8");
    created += 1;
  }

  console.log(`Generated catalog with ${catalog.length} signs.`);
  console.log(`Created ${created} new test files. Skipped ${skipped} existing files.`);
}

function ensureDirectories() {
  const roots = [
    PATHS.signsTestsDir,
    path.join(PATHS.unitTestRoot, "fixtures"),
    path.join(PATHS.unitTestRoot, "helpers"),
    path.join(PATHS.unitTestRoot, "meta"),
    path.join(PATHS.unitTestRoot, "scripts")
  ];
  for (const root of roots) fs.mkdirSync(root, { recursive: true });
  for (const category of SIGN_CATEGORIES) {
    fs.mkdirSync(path.join(PATHS.signsTestsDir, category), { recursive: true });
  }
}

function buildTestFile(sign) {
  const complexTests = isComplexSign(sign.slug)
    ? `test.skip("covers conditional branches", () => {\n  // TODO: add branch-based checks for complex mechanics.\n});\n\ntest.skip("covers edge-case limits", () => {\n  // TODO: add caps, clamping, and invalid-input checks.\n});\n\n`
    : "";

  return `import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import { createSigneFixture } from "../../fixtures/signe.factory.mjs";
import { applySigneEffect } from "../../helpers/apply-signe.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };

const SIGN = catalog.find(entry => entry.slug === "${sign.slug}");

describe("Kamarade Sign - ${escapeForJs(sign.name)} (${sign.slug})", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "${sign.category}");
  });

  test.skip("applies the sign effect in nominal conditions", () => {
    const kamarade = createKamaradeFixture();
    const signe = createSigneFixture(SIGN);
    const result = applySigneEffect({ kamarade, signe });
    assert.equal(result.metadata.applied, true);
  });

  test.skip("does not apply outside of required conditions", () => {
    const kamarade = createKamaradeFixture({ system: { details: { doctrine: "marteau" } } });
    const signe = createSigneFixture(SIGN);
    const result = applySigneEffect({ kamarade, signe });
    assert.equal(result.metadata.applied, false);
  });

${complexTests}});
`;
}

function escapeForJs(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  generateAll();
}
