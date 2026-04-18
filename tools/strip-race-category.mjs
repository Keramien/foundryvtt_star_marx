// One-shot: drop the `system.category` field from every race JSON source.
// The field no longer exists in RaceData — pack-time folder assignment
// derives the category from the codex directory layout instead.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(\w):/, "$1:"));
const DIR  = join(ROOT, "packs-src", "races");

let stripped = 0;
for (const name of readdirSync(DIR)) {
  if (!name.endsWith(".json")) continue;
  if (name.startsWith("_folder_")) continue;
  const file = join(DIR, name);
  const doc = JSON.parse(readFileSync(file, "utf8"));
  if (doc.system && "category" in doc.system) {
    delete doc.system.category;
    writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
    stripped++;
  }
}

console.log(`Stripped system.category from ${stripped} race(s).`);
