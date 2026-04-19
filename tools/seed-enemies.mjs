// One-off: seed the `enemies` pack sources from the stat blocks extracted
// in memory/star_marx_codex/enemies/*.md.
//
// Produces, under packs-src/enemies/:
//   - one folder doc per scenario (`_key: !folders!<id>`)
//   - one actor doc per enemy  (`_key: !actors!<id>`)
//   - one item doc per embedded don (`_key: !actors.items!<actorId>.<itemId>`)
//
// The actor's `items` field stores only the embedded item IDs (matches
// Foundry's split-document LevelDB layout). Embedded don data is cloned
// from packs-src/dons/<slug>.json so the two packs stay in sync.

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(\w):/, "$1:"));
const DONS_SRC = join(ROOT, "packs-src", "dons");
const OUT = join(ROOT, "packs-src", "enemies");
mkdirSync(OUT, { recursive: true });

// -------------------------------------------------------------------------
// Load the don source JSONs. Key = filename without .json, value = full doc.
// -------------------------------------------------------------------------
const DONS = {};
for (const file of readdirSync(DONS_SRC)) {
  if (!file.endsWith(".json") || file.startsWith("_")) continue;
  const doc = JSON.parse(readFileSync(join(DONS_SRC, file), "utf8"));
  DONS[file.replace(/\.json$/, "")] = doc;
}

// -------------------------------------------------------------------------
// ID helpers. Foundry convention is 16-char alphanumeric IDs. We follow the
// existing pack style: 3-char type prefix + slug + "A" padding.
// -------------------------------------------------------------------------
function padId(prefix, slug) {
  const base = prefix + slug;
  if (base.length > 16) throw new Error(`id too long: ${base}`);
  return base + "A".repeat(16 - base.length);
}

// -------------------------------------------------------------------------
// Folders (one per source markdown file under memory/star_marx_codex/enemies).
// -------------------------------------------------------------------------
const FOLDERS = {
  scenario_1_the_voice:          { id: padId("fld", "envoice"),      name: "Scénario 1 — The Voice" },
  scenario_2_visite_guidee:      { id: padId("fld", "enmusee"),      name: "Scénario 2 — Visite guidée" },
  scenario_3_symphonie_petrograd:{ id: padId("fld", "enpetrograd"),  name: "Scénario 3 — Symphonie pour Petrograd 7" },
  campagne_kosmokultor:          { id: padId("fld", "enkosmokult"),  name: "Campagne KOSMOKULTOR" }
};

// -------------------------------------------------------------------------
// Enemies. Each entry produces one Actor doc. `dons` references don source
// slugs (filenames under packs-src/dons/). `note` is optional flavour text
// appended to the HTML description of the actor.
// -------------------------------------------------------------------------
const ENEMIES = [
  // ---- Scénario 1 : The Voice -------------------------------------------
  { folder: "scenario_1_the_voice", slug: "kosmoroutier", name: "Kosmoroutier ivre",
    dangerosite: 2, degats: 1, pv: 8, dons: ["inflation"],
    desc: "Gros kosmoroutier vindicatif, ivre, lance-projectile à clous rouillés en main." },
  { folder: "scenario_1_the_voice", slug: "troglobanq", name: "Troglobanquier",
    dangerosite: 5, degats: 4, pv: 10, dons: ["creditpref"],
    desc: "Silhouette décharnée aux yeux cousus de billets, adorateur de Croissance Non Jugulée. Si un Kamarade rate son jet, le Troglobanquier lui coince la tête dans son attaché-case." },
  { folder: "scenario_1_the_voice", slug: "troglanon", name: "Troglobanquier anonyme",
    dangerosite: 0, degats: 1, pv: 1, dons: [],
    desc: "Piétaille isolée de la tribu des Troglobanquiers." },
  { folder: "scenario_1_the_voice", slug: "troglmeute", name: "Troglobanquiers en meute",
    dangerosite: 0, degats: 1, pv: 1, dons: ["massesalarial"],
    desc: "Plusieurs anonymes qui attaquent simultanément. Leur avantage vient du nombre." },
  { folder: "scenario_1_the_voice", slug: "shamancroiss", name: "Shaman de Croissance Non Jugulée",
    dangerosite: 4, degats: 3, pv: 7, dons: ["drh1"],
    desc: "Meneur des Troglobanquiers. Conduit la meute lors de la chasse finale dans l'épave." },
  { folder: "scenario_1_the_voice", slug: "vaisbicyclope", name: "Vaisseau bicyclope",
    dangerosite: 3, degats: 3, pv: 8, dons: [],
    desc: "Soyouz ennemi tenu par des Nemtsyi roulants psychorigides. Combat spatial sur la route de Cimetière." },

  // ---- Scénario 2 : Visite guidée ---------------------------------------
  { folder: "scenario_2_visite_guidee", slug: "fansfurie", name: "Fans en furie",
    dangerosite: 0, degats: 1, pv: 1, dons: ["massesalarial"],
    desc: "Foule d'ouvriers klonenbourg déchaînés par la bière à 63°. Quatre fois plus nombreux que les PJ." },
  { folder: "scenario_2_visite_guidee", slug: "mouche", name: "La mouche",
    dangerosite: -2, degats: 0, pv: 1, dons: [],
    desc: "L'insecte qui tourmente les statues. PV=1 si attaquée en AK 47 / Lutte, sinon PV=15 sur d'autres terrains (Prisonnier Politique, Social Traître...). Dégâts variables — amenuisent la patience de la victime." },
  { folder: "scenario_2_visite_guidee", slug: "zverskiy", name: "Zverskiy",
    dangerosite: 7, degats: 3, pv: 15, dons: ["darwinisme", "drh2", "management", "miseconc2", "recession", "ventedecouv"],
    desc: "Chef des gardiens du musée, chauve et brutal. Némésis d'un Kamarade désigné par le destin. Confrontation modulable en Zlotys (1/2/3 dés selon le coût)." },
  { folder: "scenario_2_visite_guidee", slug: "gardiens", name: "Gardiens du musée",
    dangerosite: 2, degats: 2, pv: 8, dons: [],
    desc: "Un gardien par Kamarade. Armés de sarbacanes à fléchettes au curare de Rigel (paralysie). Mithridatisés contre leur propre poison. Sous l'effet de D.R.H. et Management de Zverskiy tant qu'il est présent." },
  { folder: "scenario_2_visite_guidee", slug: "baudrueprof", name: "Grande Baudrue des profondeurs",
    dangerosite: 5, degats: 2, pv: 12, dons: [],
    desc: "Dernière représentante de son espèce, enfermée dans l'aquarium géant du musée. Don spécifique non-listé « Polaroïd » : tous les 3 tours, elle déclenche son appendice lumineux ; les Kamarades qui ratent un jet de KARKASS sont aveuglés et ne peuvent pas agir le prochain tour." },

  // ---- Scénario 3 : Symphonie pour Petrograd 7 --------------------------
  { folder: "scenario_3_symphonie_petrograd", slug: "troisanon", name: "Trois anonymes",
    dangerosite: 0, degats: 1, pv: 1, dons: [],
    desc: "Piétaille des amis de l'Ortholoir (pirates et contrebandiers). Rencontrés si le retard de la poursuite sur les toits est de 10 points ou moins." },
  { folder: "scenario_3_symphonie_petrograd", slug: "kosmosaoul", name: "Kosmoshniarf saoul",
    dangerosite: -2, degats: 2, pv: 6, dons: ["actiftoxique"],
    desc: "Kosmoshniarf ivre. Rencontré si le retard de la poursuite sur les toits est entre 11 et 20 points." },
  { folder: "scenario_3_symphonie_petrograd", slug: "mandaloutres", name: "Deux brutes Mandaloutres",
    dangerosite: -2, degats: 3, pv: 8, dons: ["ventedecouv"],
    desc: "Paire de Mandaloutres reliés par leur fil d'acier (faucilles-hameçons). Rencontrés si le retard de la poursuite sur les toits est entre 21 et 30 points." },
  { folder: "scenario_3_symphonie_petrograd", slug: "chienssark", name: "Chiens de Sark",
    dangerosite: -2, degats: 2, pv: 4, dons: [],
    desc: "Meute de chiens à demi robotisés contrôlés par les I.A. Assiègent la machine de projection du planétarium où sont perchés les survivants de la milice anti-I.A." },
  { folder: "scenario_3_symphonie_petrograd", slug: "molosse", name: "Molosse",
    dangerosite: -4, degats: 3, pv: 7, dons: ["drh1"],
    desc: "Meneur optionnel de la meute de chiens de Sark." },

  // ---- Campagne KOSMOKULTOR ---------------------------------------------
  // S1 — On est une bande de jeunes
  { folder: "campagne_kosmokultor", slug: "valentinochk", name: "Valentinochk",
    dangerosite: 5, degats: 4, pv: 1, dons: [],
    desc: "Nemtsy gominé libidineux en stase au fond de l'épave. Ne s'affronte qu'avec des jets en BOLCHOÏ ; tout autre jet échoue automatiquement. Son attaque est un baiser long qui féconde la cible." },

  // S2 Acte 1 — Concert des Porkishead
  { folder: "campagne_kosmokultor", slug: "klonaffame1", name: "Klon affamé (Acte 1)",
    dangerosite: 5, degats: 1, pv: 8, dons: ["creditpref"],
    desc: "Klon décidé à se tailler un jambon dans Andouilletz Porcelet, le claviériste des Porkishead." },
  { folder: "campagne_kosmokultor", slug: "fansa1emeches", name: "Fans anonymes émêchés",
    dangerosite: 0, degats: 1, pv: 1, dons: ["massesalarial"],
    desc: "1D6 fans passablement émêchés et emplis de l'envie de saucisses." },
  { folder: "campagne_kosmokultor", slug: "pauvrea1", name: "Pauvre affamé (Hello Trotski)",
    dangerosite: 0, degats: 1, pv: 1, dons: [],
    desc: "Un pauvre affamé dans un t-shirt Hello Trotski trop petit pour lui." },
  { folder: "campagne_kosmokultor", slug: "grosbarbu", name: "Gros barbu à la broche",
    dangerosite: 2, degats: 1, pv: 3, dons: [],
    desc: "Un gros barbu qui a faim, une broche improvisée à la main." },
  { folder: "campagne_kosmokultor", slug: "fansa1pupil", name: "Fans aux pupilles dilatées",
    dangerosite: 0, degats: 1, pv: 1, dons: ["massesalarial"],
    desc: "1D6 fans anonymes, les pupilles dilatées et la bave aux lèvres." },
  { folder: "campagne_kosmokultor", slug: "poulpoide", name: "Poulpoïde affamé",
    dangerosite: 2, degats: 1, pv: 1, dons: [],
    desc: "Un poulpoïde qui a la fringale s'est saisi de Yerof Boudin, le batteur, pour l'entraîner sous la scène et le farcir." },

  // S2 Acte 2 — Fuite à travers la cambrousse
  { folder: "campagne_kosmokultor", slug: "klonrevient", name: "Klon revient (Acte 2)",
    dangerosite: 5, degats: 1, pv: 8, dons: ["tauxinteret"],
    desc: "Le Klon, les crocs en moins, revient avec un presse-purée en guise de massue." },
  { folder: "campagne_kosmokultor", slug: "fansabbats", name: "Fans péroxydés du groupe Abbats",
    dangerosite: 0, degats: 1, pv: 1, dons: ["massesalarial"],
    desc: "1D6 fans péroxydés du groupe Abbats, des gargouillis dans l'estomac." },
  { folder: "campagne_kosmokultor", slug: "pauvrepaysan", name: "Pauvre paysan en salopette",
    dangerosite: 0, degats: 1, pv: 1, dons: [],
    desc: "Un pauvre paysan en salopette, cédant à la frénésie du groupe." },
  { folder: "campagne_kosmokultor", slug: "punknemtsy", name: "Punk nemtsy à crête de coq",
    dangerosite: 0, degats: 1, pv: 1, dons: [],
    desc: "Un punk nemtsy avec une crête de coq et un pot de moutarde." },
  { folder: "campagne_kosmokultor", slug: "fansanobois", name: "Fans anonymes avec bois de chauffage",
    dangerosite: 0, degats: 1, pv: 1, dons: ["massesalarial"],
    desc: "1D6 fans anonymes et du bois pour le feu." },
  { folder: "campagne_kosmokultor", slug: "philateliste", name: "Philatéliste drogué de Rakatansky 11",
    dangerosite: 2, degats: 3, pv: 1, dons: [],
    desc: "Canarde les Kamarades à la cloueuse. Peut-être un fan de safari galactique en goguette." },

  // S2 Acte 3 — Horde affamée
  { folder: "campagne_kosmokultor", slug: "quads", name: "Quads avec lanceurs de brochettes",
    dangerosite: 2, degats: 2, pv: 2, dons: [],
    desc: "Équipés de lanceurs de brochettes (dégâts directs). Manœuvre spéciale « Abordage » : convertissent leurs dégâts en 2 ou 3 dévoreurs qui sautent sur le tracteur des Kamarades." },
  { folder: "campagne_kosmokultor", slug: "devoreurs", name: "Dévoreurs d'abordage",
    dangerosite: 0, degats: 1, pv: 1, dons: ["massesalarial"],
    desc: "Morfals largués depuis les quads." },
  { folder: "campagne_kosmokultor", slug: "tracteurlada", name: "Vieux tracteur Lada",
    dangerosite: 2, degats: 0, pv: 5, dons: [],
    desc: "Dégâts spéciaux : si le tracteur touche, gaz d'échappement — chaque Kamarade à bord teste en KARKASS ou perd 1 PV. Peut aussi éperonner le véhicule pour 2 dégâts." },
  { folder: "campagne_kosmokultor", slug: "soyouzchas", name: "Soyouz chasseur",
    dangerosite: 3, degats: 0, pv: 3, dons: [],
    desc: "Dégâts spéciaux : pas d'armes, mais diffuse du Mijail Mathieu à toute berzingue. À chaque survol, les Kamarades testent en PRISONNIER POLITIQUE ou subissent -1 à leur prochain jet." },

  // S3 — Very Bad Creep
  { folder: "campagne_kosmokultor", slug: "pouxtatanov", name: "Poux de Tatanov",
    dangerosite: 0, degats: 1, pv: 1, dons: ["massesalarial"],
    desc: "Parasites gélatineux verdâtres, réveillés avec le géant Tatanov. Sang acide : chaque blessure infligée à un pou renvoie autant de dégâts au Kamarade au contact. Nombre d'assaillants : 2D6. Point faible : les ondes sonores (explosent près des scènes de concert)." }
];

// -------------------------------------------------------------------------
// Build embedded-item payloads from a list of don slugs. For each don, we
// clone the source doc and assign a new _id/_key scoped to the actor.
// -------------------------------------------------------------------------
function buildEmbeddedDons(actorId, donSlugs) {
  const items = [];
  for (const slug of donSlugs) {
    const src = DONS[slug];
    if (!src) throw new Error(`unknown don slug: ${slug}`);

    // Embedded item IDs only need to be unique within the parent actor. Use
    // the same slug-padded style for consistency.
    const itemId = padId("edn", slug);

    const item = structuredClone(src);
    item._id = itemId;
    item._key = `!actors.items!${actorId}.${itemId}`;
    // Embedded copies don't belong to the compendium folder — they live
    // under the actor.
    delete item.folder;
    delete item.sort;
    items.push(item);
  }
  return items;
}

// -------------------------------------------------------------------------
// Emit all the JSON files.
// -------------------------------------------------------------------------
const written = [];

// Folders.
for (const [key, folder] of Object.entries(FOLDERS)) {
  const doc = {
    _id: folder.id,
    _key: `!folders!${folder.id}`,
    name: folder.name,
    type: "Actor",
    sorting: "a",
    folder: null,
    sort: 0,
    color: "",
    description: "",
    flags: {}
  };
  writeFileSync(join(OUT, `_folder_${key}.json`), JSON.stringify(doc, null, 2) + "\n", "utf8");
  written.push(`folder ${key}`);
}

// Actors + their embedded items.
let sort = 0;
const seenActorIds = new Set();
for (const e of ENEMIES) {
  const folder = FOLDERS[e.folder];
  if (!folder) throw new Error(`enemy "${e.name}" references unknown folder ${e.folder}`);

  const actorId = padId("enm", e.slug);
  if (seenActorIds.has(actorId)) throw new Error(`duplicate actor _id: ${actorId}`);
  seenActorIds.add(actorId);

  const embeddedItems = buildEmbeddedDons(actorId, e.dons);
  const itemIds = embeddedItems.map(i => i._id);

  const actor = {
    _id: actorId,
    _key: `!actors!${actorId}`,
    name: e.name,
    type: "enemy",
    img: "icons/svg/skull.svg",
    system: {
      dangerosite: e.dangerosite,
      degats: e.degats,
      health: { value: e.pv, max: e.pv },
      description: e.desc,
      notes: ""
    },
    prototypeToken: {
      name: e.name,
      displayName: 0,
      actorLink: false,
      disposition: -1
    },
    items: itemIds,
    effects: [],
    folder: folder.id,
    sort: sort++,
    ownership: { default: 0 },
    flags: {}
  };

  writeFileSync(
    join(OUT, `${e.folder}__${e.slug}.json`),
    JSON.stringify(actor, null, 2) + "\n",
    "utf8"
  );
  written.push(`actor ${e.slug}`);

  for (const item of embeddedItems) {
    writeFileSync(
      join(OUT, `${e.folder}__${e.slug}__${item._id}.json`),
      JSON.stringify(item, null, 2) + "\n",
      "utf8"
    );
    written.push(`  └─ embedded don ${item.name}`);
  }
}

console.log(`Wrote ${written.length} source file(s) to ${OUT}`);
console.log(`  - ${ENEMIES.length} enemies across ${Object.keys(FOLDERS).length} folders`);
