// One-shot helper: add the `_key` field required by the foundryvtt-cli
// packer to every JSON source under packs-src/**. For an Item, the key is
// `!items!<_id>`. Idempotent — re-runs overwrite with the same value.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(\w):/, "$1:"));
const SRC = join(ROOT, "packs-src");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (entry.endsWith(".json")) out.push(p);
  }
  return out;
}

let patched = 0;
for (const file of walk(SRC)) {
  const raw = readFileSync(file, "utf8");
  const doc = JSON.parse(raw);
  if (!doc._id) {
    console.warn(`Skip (no _id): ${file}`);
    continue;
  }
  const wanted = `!items!${doc._id}`;
  if (doc._key === wanted) continue;
  doc._key = wanted;
  writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
  patched++;
}

console.log(`Patched ${patched} file(s) with _key.`);
