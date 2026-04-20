// One-off: seed the `signes_soyouz` pack sources from the rule text in
// memory/star_marx_codex/soyouz/signes_soyouz.md.
// Each entry below maps to one JSON file under packs-src/signes_soyouz/.
// Run with `node tools/seed-signes-soyouz.mjs`; safe to re-run (idempotent).

import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(\w):/, "$1:"));
const OUT = join(ROOT, "packs-src", "signes_soyouz");
mkdirSync(OUT, { recursive: true });

const FOLDER_ID = "fldsignesoyouzAA";
const FOLDER_NAME = "Soyouz";
const IMG = "icons/svg/statue.svg";

// _id must be exactly 16 chars (convention across existing packs).
function padId(slug) {
  const base = "sgz" + slug;
  if (base.length > 16) throw new Error(`slug too long: ${slug}`);
  return base + "A".repeat(16 - base.length);
}

function toHtml(text) {
  return text
    .split(/\n\s*\n/)
    .map(p => `<p>${p.trim().replace(/\n/g, " ")}</p>`)
    .join("");
}

const SIGNES = [
  {
    slug: "accro", name: "Accro", tag: "narratif",
    text: "A force de faire voler le vaisseau avec un moteur bricole et des substances alternatives, l'equipage en a fait un drogue, et ses tuyeres, devenues dependantes, ne ronronnent jamais aussi bien qu'avec de l'huile de colza transgenique. Le soyouz gagne des Zlotys lorsque ses joueurs jouent sa forte dependance aux carburants de toutes sortes."
  },
  {
    slug: "bruyant", name: "Bruyant", tag: "armement",
    text: "Les Kamarades ont monte un systeme experimental sur leur joujou, un truc de leur fabrication et dont ils sont particulierement fiers. Ils peuvent augmenter un de ses scores d'un point (avec un maximum egal a 3). Mais il y a des problemes de reglage... des qu'ils utilisent ce Signe particulier (qu'ils peuvent activer et desactiver a loisir), cela devient tellement bruyant que les joueurs ne peuvent plus communiquer autour de la table de jeu que par gestes pour simuler le boucan infernal que produit leur invention."
  },
  {
    slug: "cachette", name: "Cachette", tag: "narratif",
    text: "L'equipage a rachete le soyouz a un contrebandier. Il possede une cache secrete introuvable, tres pratique lors des controles de la kosmodouane."
  },
  {
    slug: "cameleon", name: "Cameleon", tag: "narratif",
    text: "Le modele du vaisseau est tellement repandu, tellement decline a travers l'espace sovietique qu'il est difficilement identifiable, pour peu qu'on lui change sa plaque d'immatriculation. Avec un minimum de travaux dans un kosmodock, on peut facilement le faire passer pour un autre modele de la gamme. Les Kamarades pourraient meme le confondre, et ce serait bien embetant, surtout s'ils essayent de quitter le kosmodock en quatrieme vitesse."
  },
  {
    slug: "deuxtourelles", name: "Deux Tourelles", tag: "armement",
    text: "A force de disputes et de jalousies, impropres a l'ideal communiste, l'equipage a decide de faire installer un deuxieme poste de tir pour que tout le monde puisse faire ratata ratata sur les ennemis. Les joueurs peuvent partager l'ORGUE DE STALINE en deux scores."
  },
  {
    slug: "jsqbout", name: "Jusqu'au-Boutiste", tag: "blindage",
    text: "L'engin est un dur, pas du genre a faire sa sucree. Il en a vu des batailles, il en a connu des avaries, mais jamais, jamais il n'a abandonne. Alors la casse, les ferrailleurs, les remorquages, ce n'est pas pour lui ! Peu importe ce qu'il encaisse ! Il ne connait des avaries graves et definitives (explosions, etc.) que lorsqu'un de ses scores atteint -4 au lieu de -3."
  },
  {
    slug: "chasseurmig", name: "Modele Chasseur MIG", tag: "modele",
    text: "Le bijou est carene comme un oiseau fin et race. En revanche, il n'est pas taille pour transporter beaucoup de choses ou de personnes. Son score en TUPOLEV peut monter a 3. Par contre son TETRIS est limite a 0."
  },
  {
    slug: "destroyer", name: "Modele Destroyer Udaloy", tag: "modele",
    text: "L'avantage avec les gros engins poussifs, c'est qu'on peut mettre des gros canons dessus. Le score en ORGUE DE STALINE peut monter a 3. Par contre le TUPOLEV est limite a 1."
  },
  {
    slug: "parechocs", name: "Pare-chocs en Titane", tag: "blindage",
    text: "Quand les Kamarades jouent a rentrer dedans avec les adversaires, les joueurs ajoutent le score en MUR DE FER au score en TETRIS pour calculer les degats."
  },
  {
    slug: "pashumain", name: "Pas Humain", tag: "narratif",
    text: "Ce modele n'a clairement pas ete concu pour des humains : trop grand, trop petit, trop etroit... Les consequences de son etrange conception n'ont de cesse d'influer sur les agissements de ses passagers. Le soyouz gagne des Zlotys lorsque les joueurs ou le Secretaire General jouent sur les affres de la vie a son bord liees a sa conception nemtsy."
  },
  {
    slug: "pitoyable", name: "Pitoyable", tag: "narratif",
    text: "Le vehicule fait pitie. Il ressemble plus a un assemblage de pieces disparates qu'a un vrai vaisseau. Rouille par endroits, semant des debris inidentifiables dans son sillage, il ne paye vraiment pas de mine. Quel que soit votre ennemi, celui-ci ne donnera jamais le coup de grace a votre engin. En revanche, il ne fait pas pitie pour rien. Les degats qu'il encaisse lorsqu'il connait des avaries sont doubles."
  },
  {
    slug: "surprises", name: "Des Surprises sous le Capot", tag: "modele",
    text: "L'engin ne paye pas de mine, c'est un vieux modele, ou bien il a un aspect ridicule, ou encore on se souvient toujours dans les kosmodocks du retour a l'usine de ces modeles pour un \"reglage anecdotique du systeme de mise a feu des reacteurs\". Mais, meme si a cause de ces incidents on continue d'appeler ces vaisseaux des \"KFP\" (Kolkhozian Fried Passagers), l'equipage l'a tellement customise qu'il n'a plus beaucoup de pieces d'origine, et sous son capot, c'est le meme moteur qu'un VeidelGrov. Lorsque les joueurs decident de se reveler, tous les scores impliquant l'engin se font avec un bonus de +1 durant un tour. Par contre, sa mauvaise reputation le limite a 0 dans son score en PARADE."
  },
  {
    slug: "striptease", name: "Striptease Fatal", tag: "manoeuvre",
    text: "Le vaisseau peut se delester de certains de ses elements pour gagner en vitesse et en manoeuvrabilite. En termes de regles, les joueurs peuvent faire passer des points de n'importe quel Trait du soyouz vers son TUPOLEV (toujours avec la limite de +2). Ce transfert est a sens unique."
  },
  {
    slug: "violent", name: "Violent", tag: "armement",
    text: "Le vaisseau est surarme, les Kamarades bichonnent ses silos et connaissent meme un artificier bigouden qui booste ses torpilles avec un produit a base de lisier de proto-porc et de kouign-amann. Bref, ils sont prets a la guerre, peu importe contre qui. L'engin inflige 1 point de degats supplementaire. Mais un vaisseau trop bien arme, ca se remarque. Dans chaque kosmodock, l'equipage doit graisser des pattes pour ne pas qu'on le signale aux autorites. Difficile aussi d'etre discret. Bref, ca complique souvent la vie."
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
for (const s of SIGNES) {
  const id = padId(s.slug);
  if (seenIds.has(id)) throw new Error(`duplicate _id: ${id}`);
  seenIds.add(id);

  const doc = {
    _id: id,
    name: s.name,
    type: "signe_soyouz",
    img: IMG,
    system: {
      description: toHtml(s.text),
      tag: s.tag
    },
    effects: [],
    folder: FOLDER_ID,
    sort: sort++,
    ownership: { default: 0 },
    flags: {},
    _key: `!items!${id}`
  };

  writeFileSync(join(OUT, `${s.slug}.json`), JSON.stringify(doc, null, 2) + "\n", "utf8");
}

console.log(`Wrote ${SIGNES.length} signe_soyouz source JSON(s) to ${OUT}`);
