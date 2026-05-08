// One-shot helper that organizes compendium sources into folders.
//
// Races:
//   - Principales / Autres / Kosmokultor, based on the codex directory.
//
// Clefs:
//   - Generales / Raciales, based on flags.starmarx.racialOnly.
//
// Signes:
//   - Generaux / Lies a un Trait / Raciaux / Groupuscules.
//   - Mandatory racial signs stay category "racial" and go under
//     Raciaux/<Race>.
//   - Player-chosen signs restricted to a race become category "race" and
//     also go under Raciaux/<Race>.
//
// Folder docs are stored as JSON files in the same directory as the items,
// with `_key = "!folders!<id>"`, matching the foundryvtt-cli convention.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(\w):/, "$1:"));
const SRC = join(ROOT, "packs-src");

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

const SIGNE_RACE_FOLDERS = {
  alevin:     { id: "fldsracealevinAA", name: "Alevin" },
  bicyclope:  { id: "fldsracebicyclop", name: "Bicyclope" },
  bourbasky:  { id: "fldsracebourbsky", name: "Bourbasky" },
  dulusk:     { id: "fldsraceduluskAA", name: "Dulusk" },
  gigolbare:  { id: "fldsracegigolbar", name: "Gigolbare" },
  gonklin:    { id: "fldsracegonklinA", name: "Gonklin" },
  gryazny:    { id: "fldsracegryaznyA", name: "Gryazny" },
  gusano:     { id: "fldsracegusanoAA", name: "Gusano" },
  hjort:      { id: "fldsracehjortAAA", name: "Hjort" },
  humain:     { id: "fldsracehumainAA", name: "Humain" },
  klon:       { id: "fldsraceklonAAAA", name: "Klon" },
  krolik:     { id: "fldsracekrolikAA", name: "Krolik" },
  mnogy:      { id: "fldsracemnogyAAA", name: "Mnogy" },
  morskoyzeh: { id: "fldsracemorskoyz", name: "Morskoyzeh" },
  robot:      { id: "fldsracerobotAAA", name: "Robot" },
  simple:     { id: "fldsracesimpleAA", name: "Simple" },
  truizyik:   { id: "fldsracetruizyik", name: "Truizyik" },
  tsvetok:    { id: "fldsracetsvetokA", name: "Tsvetok" },
  xiphomis:   { id: "fldsracexiphomis", name: "Xiphomis" }
};

const CLEF_FOLDERS = {
  general: { id: "fldclefgeneralAA", name: "Générales" },
  racial:  { id: "fldclefracialAAA", name: "Raciales" }
};

const GROUPUSCULE_FILES = new Set([
  "bibliothequeambu.json",
  "tulaslaissetomb.json"
]);

const RACIAL_SIGNE_FILES = new Map(Object.entries({
  "alevin.json": "alevin",
  "bicyclope.json": "bicyclope",
  "bourbasky.json": "bourbasky",
  "dulusk.json": "dulusk",
  "gigolbare.json": "gigolbare",
  "gonklin.json": "gonklin",
  "gryazny.json": "gryazny",
  "hjort.json": "hjort",
  "humain.json": "humain",
  "klon.json": "klon",
  "krolik.json": "krolik",
  "mnogy.json": "mnogy",
  "reflexepavlovien.json": "tsvetok",
  "robot.json": "robot",
  "roidupogo.json": "morskoyzeh",
  "simple.json": "simple",
  "truizyk.json": "truizyik",
  "vynoslivy.json": "gusano",
  "xiphomis.json": "xiphomis"
}));

const RACE_RESTRICTED_SIGNE_FILES = new Map(Object.entries({
  "angora.json": "krolik",
  "attaquebondissan.json": "krolik",
  "autonomie.json": "robot",
  "defragmentaccele.json": "robot",
  "famillenombreuse.json": "klon",
  "laduredelevoluti.json": "klon",
  "lafessee.json": "klon",
  "mamanetaitunpoel.json": "robot",
  "piecesautonomes.json": "robot",
  "pimpmybot.json": "robot",
  "procesetmenaces.json": "hjort",
  "toijtaimepas.json": "gonklin",
  "toijtaimevraimen.json": "gonklin",
  "tousdessus.json": "klon"
}));

function folderDoc({ id, name, parent = null, sort = 0 }, contentType) {
  return {
    _id: id,
    _key: `!folders!${id}`,
    name,
    type: contentType,
    sorting: "a",
    folder: parent,
    sort,
    color: "",
    description: "",
    flags: {}
  };
}

function writeJson(path, doc) {
  writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
}

function normalizeRaceSlug(value) {
  if (typeof value !== "string") return null;
  const slug = value.trim().toLowerCase();
  return slug || null;
}

// ---------- Races ----------
{
  const dir = join(SRC, "races");
  const codexDir = join(ROOT, "memory", "star_marx_codex", "races");

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

  for (const def of Object.values(RACE_FOLDERS)) {
    writeJson(join(dir, `_folder_${def.id}.json`), folderDoc(def, "Item"));
  }

  const counts = { core: 0, other: 0, kosmokultor: 0 };
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

  const counts = { general: 0, racial: 0 };
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    if (name.startsWith("_folder_")) continue;

    const file = join(dir, name);
    const doc = JSON.parse(readFileSync(file, "utf8"));
    const isRacial = !!doc.flags?.starmarx?.racialOnly
      || (typeof doc._id === "string" && doc._id.startsWith("clr"));
    const key = isRacial ? "racial" : "general";

    doc.folder = CLEF_FOLDERS[key].id;
    writeJson(file, doc);
    counts[key]++;
  }
  console.log(`Clefs: ${counts.general} generales, ${counts.racial} raciales`);
}

// ---------- Signes ----------
{
  const dir = join(SRC, "signes");
  for (const def of Object.values(SIGNE_FOLDERS)) {
    writeJson(join(dir, `_folder_${def.id}.json`), folderDoc(def, "Item"));
  }

  Object.values(SIGNE_RACE_FOLDERS).forEach((def, index) => {
    writeJson(join(dir, `_folder_${def.id}.json`), folderDoc({
      ...def,
      parent: SIGNE_FOLDERS.racial.id,
      sort: (index + 1) * 100000
    }, "Item"));
  });

  const counts = { general: 0, trait: 0, racial: 0, race: 0, groupuscule: 0 };
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    if (name.startsWith("_folder_")) continue;

    const file = join(dir, name);
    const doc = JSON.parse(readFileSync(file, "utf8"));
    const racialRace = RACIAL_SIGNE_FILES.get(name);
    const restrictedRace = normalizeRaceSlug(doc.flags?.starmarx?.racialOnly)
      ?? RACE_RESTRICTED_SIGNE_FILES.get(name);

    let category;
    let folder;
    if (doc.system?.category === "racial") {
      category = "racial";
      folder = racialRace ? SIGNE_RACE_FOLDERS[racialRace]?.id : SIGNE_FOLDERS.racial.id;
    } else if (restrictedRace) {
      category = "race";
      folder = SIGNE_RACE_FOLDERS[restrictedRace]?.id ?? SIGNE_FOLDERS.racial.id;
    } else if (GROUPUSCULE_FILES.has(name)) {
      category = "groupuscule";
      folder = SIGNE_FOLDERS.groupuscule.id;
    } else if (doc.system?.traitLink) {
      category = "trait";
      folder = SIGNE_FOLDERS.trait.id;
    } else {
      category = "general";
      folder = SIGNE_FOLDERS.general.id;
    }

    doc.system.category = category;
    doc.folder = folder;
    writeJson(file, doc);
    counts[category]++;
  }

  console.log(
    `Signes: ${counts.general} general, ${counts.trait} trait, ` +
    `${counts.racial} racial, ${counts.race} race-restricted, ` +
    `${counts.groupuscule} groupuscule`
  );
}
