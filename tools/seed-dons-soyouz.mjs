// One-off: seed the `dons_soyouz` pack sources from the rule text in
// memory/star_marx_codex/soyouz/dons_soyouz.md.
// Each entry below maps to one JSON file under packs-src/dons_soyouz/.
// Run with `node tools/seed-dons-soyouz.mjs`; safe to re-run (idempotent).

import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(\w):/, "$1:"));
const OUT = join(ROOT, "packs-src", "dons_soyouz");
mkdirSync(OUT, { recursive: true });

const FOLDER_ID = "fldonsoyouzAAAAA";
const FOLDER_NAME = "Soyouz";
const IMG = "icons/svg/explosion.svg";

function padId(slug) {
  const base = "dnz" + slug;
  if (base.length > 16) throw new Error(`slug too long: ${slug}`);
  return base + "A".repeat(16 - base.length);
}

function toHtml(text) {
  return text
    .split(/\n\s*\n/)
    .map(p => `<p>${p.trim().replace(/\n/g, " ")}</p>`)
    .join("");
}

const DONS = [
  {
    slug: "abordage", name: "Abordage",
    text: "Chaque fois que cet ennemi est cense infliger des degats, il peut choisir d'injecter autant de membres d'equipage qu'il ne lui reste de points de vie a l'interieur des coursives du vaisseau des Kamarades, qui devront gerer ces adversaires en plus du combat spatial."
  },
  {
    slug: "munitions", name: "Munitions Specifiques",
    text: "L'armement de ce vaisseau est specialement concu pour causer des dommages precis : surtension electrique endommageant le LEBEDEV, capsules de mousse se repandant dans les coursives et grignotant la DATCHA, liquide corrosif mettant a mal le TUPOLEV, etc. Avec de telles munitions, inutile de tirer au hasard quel score est atteint lors de la repartition des points d'avarie, il s'agit toujours du meme designe par le type de munition."
  },
  {
    slug: "piratage", name: "Piratage",
    text: "Le systeme informatique est oppose a un pirate ennemi. En debut de tour, le hackeur tente de controler les systemes des Kamarades. Pour le contrer, un Kamarade est oblige de lutter contre la difficulte de ce pirate (fixee par le Secretaire General) pour eviter des malus."
  },
  {
    slug: "tireurs", name: "Plusieurs Tireurs",
    text: "La presence de multiples postes de tir exige que l'on reussisse plusieurs jets consecutifs pour se defendre contre ce vaisseau."
  }
];

// Folder document
const folderDoc = {
  _id: FOLDER_ID,
  _key: `!folders!${FOLDER_ID}`,
  name: FOLDER_NAME,
  type: "Item",
  sorting: "a",
  folder: null,
  sort: 0,
  color: "",
  description: "",
  flags: {}
};
writeFileSync(
  join(OUT, `_folder_${FOLDER_ID}.json`),
  JSON.stringify(folderDoc, null, 2) + "\n",
  "utf8"
);

const seenIds = new Set();
let sort = 0;
for (const d of DONS) {
  const id = padId(d.slug);
  if (seenIds.has(id)) throw new Error(`duplicate _id: ${id}`);
  seenIds.add(id);

  const doc = {
    _id: id,
    name: d.name,
    type: "don_soyouz",
    img: IMG,
    system: {
      description: toHtml(d.text)
    },
    effects: [],
    folder: FOLDER_ID,
    sort: sort++,
    ownership: { default: 0 },
    flags: {},
    _key: `!items!${id}`
  };

  writeFileSync(join(OUT, `${d.slug}.json`), JSON.stringify(doc, null, 2) + "\n", "utf8");
}

console.log(`Wrote ${DONS.length} don_soyouz source JSON(s) to ${OUT}`);
