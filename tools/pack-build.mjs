// Compile JSON sources under packs-src/<pack>/*.json into a LevelDB
// compendium under packs/<pack>. Run with `npm run pack:build`.
//
// We talk to classic-level directly rather than using the foundryvtt-cli's
// compilePack() helper, because at the time of writing the CLI's cleanup
// step (`await db.keys().all()` on a deferred iterator) crashes under
// Node v25 with "Iterator is not open". We sidestep it by rebuilding each
// pack from a clean directory — no stale keys to prune, no iterator.
//
// Each source JSON must already have `_id` and `_key = "!items!<_id>"`
// (see tools/add-keys.mjs). Fields are written verbatim into the pack.

import { readFileSync, readdirSync, statSync, rmSync, mkdirSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { ClassicLevel } from "classic-level";

const ROOT = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(\w):/, "$1:"));
const SRC_DIR = join(ROOT, "packs-src");
const OUT_DIR = join(ROOT, "packs");

function listPacks(dir) {
  try {
    return readdirSync(dir).filter(name => {
      try { return statSync(join(dir, name)).isDirectory(); }
      catch { return false; }
    });
  } catch { return []; }
}

function listJson(dir) {
  return readdirSync(dir).filter(f => f.endsWith(".json")).map(f => join(dir, f));
}

async function buildOne(packName) {
  const src = join(SRC_DIR, packName);
  const dst = join(OUT_DIR, packName);

  // Fresh build: wipe the target dir file-by-file (whole-dir rmSync can
  // EPERM on Windows when a previous crash left a LOCK held). We keep the
  // directory itself so ClassicLevel can reopen without race on mkdir.
  mkdirSync(dst, { recursive: true });
  for (const name of readdirSync(dst)) {
    try { unlinkSync(join(dst, name)); }
    catch { /* file locked (e.g. LOCK) — ClassicLevel will reuse it */ }
  }

  const db = new ClassicLevel(dst, { keyEncoding: "utf8", valueEncoding: "json" });
  await db.open();

  const files = listJson(src);
  if (files.length === 0) {
    console.warn(`  (no JSON files under ${src})`);
    await db.close();
    return;
  }

  const batch = db.batch();
  const seen = new Set();

  for (const file of files) {
    const raw = readFileSync(file, "utf8");
    const doc = JSON.parse(raw);
    if (!doc._key || !doc._id) {
      console.warn(`  skip ${file}: missing _id or _key`);
      continue;
    }
    if (seen.has(doc._key)) {
      throw new Error(`Duplicate _key '${doc._key}' in ${file}`);
    }
    seen.add(doc._key);

    // The CLI strips _key before writing and stores the rest as the value.
    const value = structuredClone(doc);
    delete value._key;
    batch.put(doc._key, value);
  }

  await batch.write();
  await db.close();

  console.log(`  packed ${seen.size} doc(s) → ${dst}`);
}

const packs = listPacks(SRC_DIR);
if (packs.length === 0) {
  console.log("No packs to build in", SRC_DIR);
  process.exit(0);
}

for (const pack of packs) {
  console.log(`Star Marx | Compiling pack ${pack}`);
  await buildOne(pack);
}

console.log("Star Marx | All packs compiled.");
