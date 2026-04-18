// One-shot helper that organizes the races and signes compendium sources
// into folders.
//
// Races  → 3 folders (Principales / Autres / Kosmokultor) based on
//          system.category ("core" | "other" | "kosmokultor").
// Signes → 4 folders (Généraux / Liés à un Trait / Raciaux / Groupuscules)
//          based on:
//            - category === "racial"       → Raciaux (unchanged)
//            - traitLink non-empty         → Trait  (and category set to "trait")
//            - name in GROUPUSCULE_NAMES   → Groupuscule (and category set to "groupuscule")
//            - default                     → Général
//
// Folder docs are stored as regular JSON files in the same directory as the
// items, with `_key = "!folders!<id>"` — the foundryvtt-cli convention.
// Each item then carries a `folder` field pointing to its folder id.
//
// Idempotent: running this again overwrites with the same assignments.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(\w):/, "$1:"));
const SRC  = join(ROOT, "packs-src");

// 16-char alphanumeric folder IDs, prefixed so we never collide with item ids.
const RACE_FOLDERS = {
  core:        { id: "fldracecoreAAAAA", name: "Principales" },
  other:       { id: "fldraceotherAAAA", name: "Autres" },
  kosmokultor: { id: "fldracekosmoAAAA", name: "Kosmokultor" }
};

const SIGNE_FOLDERS = {
  general:     { id: "fldsignegeneralA", name: "Généraux" },
  trait:       { id: "fldsignetraitAAA", name: "Liés à un Trait" },
  racial:      { id: "fldsigneracialAA", name: "Raciaux" },
  groupuscule: { id: "fldsignegroupusc", name: "Groupuscules" }
};

const CLEF_FOLDERS = {
  general: { id: "fldclefgeneralAA", name: "Générales" },
  racial:  { id: "fldclefracialAAA", name: "Raciales" }
};

// Signe files that belong to the Groupuscules folder. Identified from the
// codex (signes_groupuscules.md). We match by filename instead of flags
// because the seeding step didn't tag them.
const GROUPUSCULE_FILES = new Set([
  "bibliothequeambu.json",
  "tulaslaissetomb.json"
]);

function folderDoc({ id, name }, contentType) {
  return {
    _id: id,
    _key: `!folders!${id}`,
    name,
    type: contentType,
    sorting: "a",
    folder: null,
    sort: 0,
    color: "",
    description: "",
    flags: {}
  };
}

function writeJson(path, doc) {
  writeFileSync(path, JSON.stringify(doc, null, 2) + "\n");
}

// ---------- Races ----------
//
// The race category is NOT stored on the race item itself — it only matters
// at pack-build time to decide which folder a race goes into. We derive it
// from the codex directory layout:
//   memory/star_marx_codex/races/<category>/<slug>.md
{
  const dir = join(SRC, "races");
  const codexDir = join(ROOT, "memory", "star_marx_codex", "races");

  // slug → category, built once from the codex tree.
  const slugToCategory = {};
  for (const cat of Object.keys(RACE_FOLDERS)) {
    let entries;
    try { entries = readdirSync(join(codexDir, cat)); }
    catch { entries = []; }
    for (const md of entries) {
      if (!md.endsWith(".md")) continue;
      slugToCategory[md.replace(/\.md$/, "")] = cat;
    }
  }

  // Write the 3 folder docs
  for (const def of Object.values(RACE_FOLDERS)) {
    writeJson(join(dir, `_folder_${def.id}.json`), folderDoc(def, "Item"));
  }
  // Assign each race to its folder
  let counts = { core: 0, other: 0, kosmokultor: 0 };
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    if (name.startsWith("_folder_")) continue;
    const file = join(dir, name);
    const doc = JSON.parse(readFileSync(file, "utf8"));
    const slug = name.replace(/\.json$/, "");
    const category = slugToCategory[slug];
    const folder = category && RACE_FOLDERS[category];
    if (!folder) {
      console.warn(`  race ${name}: no codex category for slug '${slug}', leaving folder empty`);
      continue;
    }
    doc.folder = folder.id;
    writeJson(file, doc);
    counts[category]++;
  }
  console.log(`Races: ${counts.core} core, ${counts.other} other, ${counts.kosmokultor} kosmokultor`);
}

// ---------- Clefs ----------
{
  const dir = join(SRC, "clefs");
  for (const def of Object.values(CLEF_FOLDERS)) {
    writeJson(join(dir, `_folder_${def.id}.json`), folderDoc(def, "Item"));
  }
  let counts = { general: 0, racial: 0 };
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    if (name.startsWith("_folder_")) continue;
    const file = join(dir, name);
    const doc = JSON.parse(readFileSync(file, "utf8"));

    // Racial clefs were seeded with flags.starmarx.racialOnly = "<race-slug>".
    // Fallback to the id prefix for robustness.
    const isRacial = !!doc.flags?.starmarx?.racialOnly
      || (typeof doc._id === "string" && doc._id.startsWith("clr"));
    const key = isRacial ? "racial" : "general";

    doc.folder = CLEF_FOLDERS[key].id;
    writeJson(file, doc);
    counts[key]++;
  }
  console.log(`Clefs: ${counts.general} générales, ${counts.racial} raciales`);
}

// ---------- Signes ----------
{
  const dir = join(SRC, "signes");
  for (const def of Object.values(SIGNE_FOLDERS)) {
    writeJson(join(dir, `_folder_${def.id}.json`), folderDoc(def, "Item"));
  }
  let counts = { general: 0, trait: 0, racial: 0, groupuscule: 0 };
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    if (name.startsWith("_folder_")) continue;
    const file = join(dir, name);
    const doc = JSON.parse(readFileSync(file, "utf8"));

    let category;
    if (doc.system?.category === "racial") category = "racial";
    else if (GROUPUSCULE_FILES.has(name))  category = "groupuscule";
    else if (doc.system?.traitLink)        category = "trait";
    else                                   category = "general";

    doc.system.category = category;
    doc.folder = SIGNE_FOLDERS[category].id;
    writeJson(file, doc);
    counts[category]++;
  }
  console.log(
    `Signes: ${counts.general} général, ${counts.trait} trait, ` +
    `${counts.racial} racial, ${counts.groupuscule} groupuscule`
  );
}
