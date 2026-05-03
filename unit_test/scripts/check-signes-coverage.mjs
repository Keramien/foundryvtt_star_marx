import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PATHS, SIGN_CATEGORIES } from "../test.config.mjs";

export function loadSignsCatalogFromSource() {
  const files = fs.readdirSync(PATHS.signsSourceDir)
    .filter(name => name.endsWith(".json"))
    .map(name => path.join(PATHS.signsSourceDir, name));

  const entries = [];
  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    if (raw.type !== "signe") continue;

    const slug = path.basename(file, ".json");
    const category = normalizeCategory(raw.system?.category);
    entries.push({
      slug,
      name: raw.name,
      category,
      traitLink: raw.system?.traitLink ?? "",
      description: stripHtml(raw.system?.description ?? ""),
      sourcePath: file
    });
  }

  return entries.sort((a, b) => a.slug.localeCompare(b.slug, "fr"));
}

export function getCoverageReport(catalog = loadSignsCatalogFromSource()) {
  const expected = new Set(catalog.map(s => s.slug));
  const actual = new Set(findTestSlugs());

  const missing = [...expected].filter(slug => !actual.has(slug)).sort();
  const orphans = [...actual].filter(slug => !expected.has(slug)).sort();

  return {
    expectedCount: expected.size,
    actualCount: actual.size,
    missing,
    orphans,
    ok: missing.length === 0 && orphans.length === 0
  };
}

function findTestSlugs() {
  const slugs = [];
  for (const category of SIGN_CATEGORIES) {
    const dir = path.join(PATHS.signsTestsDir, category);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".test.mjs")) continue;
      slugs.push(path.basename(file, ".test.mjs"));
    }
  }
  return slugs;
}

function normalizeCategory(value) {
  if (SIGN_CATEGORIES.includes(value)) return value;
  return "general";
}

function stripHtml(value) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  const report = getCoverageReport();
  if (report.ok) {
    console.log(`Coverage OK: ${report.actualCount}/${report.expectedCount} signs have tests.`);
    process.exit(0);
  }

  console.error(`Coverage mismatch: ${report.actualCount}/${report.expectedCount} tests.`);
  if (report.missing.length > 0) {
    console.error(`Missing tests (${report.missing.length}):`);
    for (const slug of report.missing) console.error(`  - ${slug}`);
  }
  if (report.orphans.length > 0) {
    console.error(`Orphan tests (${report.orphans.length}):`);
    for (const slug of report.orphans) console.error(`  - ${slug}`);
  }
  process.exit(1);
}
