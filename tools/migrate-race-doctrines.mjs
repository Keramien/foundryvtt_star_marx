// One-shot: rewrite packs-src/races/*.json from the legacy
// `system.doctrineImposee: "<doctrine>"` field to the new
// `system.doctrinesAutorisees: { marteau, faucille, etoile }` booleans.
//
// Mapping:
//   doctrineImposee === ""        → all three true  (no constraint)
//   doctrineImposee === "marteau" → only marteau true (others false)
//   doctrineImposee === "faucille"/"etoile" → only that one true
//
// Idempotent: if doctrinesAutorisees is already present, the file is left
// alone.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(\w):/, "$1:"));
const DIR  = join(ROOT, "packs-src", "races");

function flagsFor(imposed) {
  if (!imposed) return { marteau: true, faucille: true, etoile: true };
  return {
    marteau:  imposed === "marteau",
    faucille: imposed === "faucille",
    etoile:   imposed === "etoile"
  };
}

let migrated = 0;
for (const name of readdirSync(DIR)) {
  if (!name.endsWith(".json")) continue;
  if (name.startsWith("_folder_")) continue;
  const file = join(DIR, name);
  const doc = JSON.parse(readFileSync(file, "utf8"));

  if (doc.system?.doctrinesAutorisees) continue; // already migrated
  const imposed = doc.system?.doctrineImposee ?? "";
  doc.system.doctrinesAutorisees = flagsFor(imposed);
  delete doc.system.doctrineImposee;

  writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
  migrated++;
  const allowed = Object.entries(doc.system.doctrinesAutorisees)
    .filter(([, v]) => v).map(([k]) => k).join(",");
  console.log(`  ${doc.name}: ${imposed || "(libre)"} → [${allowed}]`);
}

console.log(`Migrated ${migrated} race file(s).`);
