// One-shot: migrate race JSON sources from the old single-racial-signe model
// to the new array-of-UUIDs model, fix the Klon / Simple special cases
// (Grand / Petit are now true racial signes, not a signesBonus hack), and
// attach mandatory racial-key UUIDs.
//
//   system.signeRacialUuid: "X"  → system.signesRacialUuids: ["X"]
//                     ""         →                          []
//
//   Klon:   signesBonus 1 → 0, add Grand to racial list.
//   Simple: signesBonus 1 → 0, add Petit to racial list.
//   Humain: signesBonus stays at 1 (it's the +1 chosen signe bonus).
//
// Idempotent: skips files already migrated (signesRacialUuids present).

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(\w):/, "$1:"));
const DIR  = join(ROOT, "packs-src", "races");

const GRAND_UUID = "Compendium.star_marx.signes.Item.sgngrandAAAAAAAA";
const PETIT_UUID = "Compendium.star_marx.signes.Item.sgnpetitAAAAAAAA";

const EXTRA_RACIALS = {
  klon:   GRAND_UUID,
  simple: PETIT_UUID
};

const MANDATORY_RACIAL_CLEFS = {
  baboulin: ["Compendium.star_marx.clefs.Item.clrgalanteriebab"],
  gonklin:  ["Compendium.star_marx.clefs.Item.clrgonklinAAAAAA"],
  gusano:   ["Compendium.star_marx.clefs.Item.clrmezcalAAAAAAA"],
  krolik:   ["Compendium.star_marx.clefs.Item.clrrongeurAAAAAA"],
  mnogy:    ["Compendium.star_marx.clefs.Item.clrloidelaudimat"],
  vulgain:  ["Compendium.star_marx.clefs.Item.clrlogorrheevulg"]
};

let migratedSignes = 0;
let migratedClefs = 0;
for (const name of readdirSync(DIR)) {
  if (!name.endsWith(".json")) continue;
  if (name.startsWith("_folder_")) continue;
  const file = join(DIR, name);
  const doc = JSON.parse(readFileSync(file, "utf8"));

  const slug = name.replace(/\.json$/, "");
  let changed = false;

  if (!Array.isArray(doc.system?.signesRacialUuids)) {
    const old = doc.system?.signeRacialUuid ?? "";
    const uuids = old ? [old] : [];

    // Klon + Grand, Simple + Petit. Also zero out signesBonus for these two;
    // the extra slot is now represented as a second racial signe.
    const extra = EXTRA_RACIALS[slug];
    if (extra && !uuids.includes(extra)) uuids.push(extra);
    if (slug === "klon" || slug === "simple") {
      doc.system.signesBonus = 0;
    }

    doc.system.signesRacialUuids = uuids;
    delete doc.system.signeRacialUuid;
    changed = true;
    migratedSignes++;
  }

  const clefs = MANDATORY_RACIAL_CLEFS[slug] ?? [];
  if (JSON.stringify(doc.system.clefsRacialUuids ?? []) !== JSON.stringify(clefs)) {
    doc.system.clefsRacialUuids = clefs;
    changed = true;
    migratedClefs++;
  }

  if (!changed) continue;

  writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
  console.log(`  ${doc.name}: ${doc.system.signesRacialUuids.length} racial signe(s), ${clefs.length} racial clef(s)`);
}

console.log(`Migrated ${migratedSignes} race signe list(s), ${migratedClefs} race clef list(s).`);
