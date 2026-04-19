// One-off: seed the `dons` pack sources from the rule text in dons.md.
// Each entry below maps to one JSON file under packs-src/dons/.
// Run once with `node tools/seed-dons.mjs`; safe to re-run (idempotent).

import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(\w):/, "$1:"));
const OUT = join(ROOT, "packs-src", "dons");
mkdirSync(OUT, { recursive: true });

const FOLDER = "fldongeneralAAAA";
const IMG = "icons/svg/skull.svg";

// _id must be exactly 16 chars (convention used across existing packs).
function padId(slug) {
  const base = "don" + slug;
  if (base.length > 16) throw new Error(`slug too long: ${slug}`);
  return base + "A".repeat(16 - base.length);
}

// Plain text → minimal HTML paragraphs, preserving blank-line separation.
function toHtml(text) {
  return text
    .split(/\n\s*\n/)
    .map(p => `<p>${p.trim().replace(/\n/g, " ")}</p>`)
    .join("");
}

const DONS = [
  {
    slug: "actiftoxique", name: "Actif Toxique", alias: "Poison", rank: 1,
    text: "Les blessures du Kamarade ne guérissent pas et ne peuvent être soignées que par des soins avec beaucoup de matériel. Un monstre ou un opposant qui possède ce don est immunisé ou mithridatisé à tous les poisons."
  },
  {
    slug: "creditpref", name: "Crédit Préférentiel", alias: "Morsure", rank: 1,
    text: "Une fois que l'opposant a mordu ou saisi sa proie, il ne la lâche plus et elle perd un point de vie par tour."
  },
  {
    slug: "darwinisme", name: "Darwinisme Social", alias: "Brutal", rank: 1,
    text: "L'opposant ignore l'armure des Kamarades."
  },
  {
    slug: "decouvert", name: "Découvert Autorisé", alias: "Second Souffle", rank: 1,
    text: "Une fois qu'il passe en dessous d'une certaine barre de points de vie (à définir), cet opposant gagne un bonus à ses dégâts et sa dangerosité."
  },
  {
    slug: "deflation", name: "Déflation", alias: "Maladie ou Traumatisme", rank: 1,
    text: "Soit l'opposant est un mutant infectieux, soit c'est un sadique qui laisse des blessures qui handicapent le Kamarade. Si le personnage est blessé par l'opposant, il tombe malade ou souffre. Il subit un malus de –2 à tous ses jets jusqu'à sa guérison complète. La maladie ou le traumatisme dure (10 – KARKASS) jours. Il peut être soigné avec un jet réussi en DOPAGE avec un malus égal à la dangerosité de l'opposant."
  },
  {
    slug: "delocalisat", name: "Délocalisation", alias: "Fuite", rank: 1,
    text: "Quand il passe à zéro point de vie, l'opposant prend la fuite, sans qu'il soit possible de le capturer. Parfait pour les méchants récurrents, même s'il vaut mieux prévoir une explication pour les Kamarades."
  },
  {
    slug: "drh1", name: "D.R.H. 1", alias: "Capitaine", rank: 1,
    text: "<strong>Effet au rang 1 :</strong> Tant que cet opposant est vivant et qu'il donne des ordres, les autres adversaires voient leur dangerosité et leurs dégâts augmentés de <strong>+1</strong>."
  },
  {
    slug: "drh2", name: "D.R.H. 2", alias: "Capitaine", rank: 2,
    text: "<strong>Effet au rang 2 :</strong> Tant que cet opposant est vivant et qu'il donne des ordres, les autres adversaires voient leur dangerosité et leurs dégâts augmentés de <strong>+2</strong>."
  },
  {
    slug: "drh3", name: "D.R.H. 3", alias: "Capitaine", rank: 3,
    text: "<strong>Effet au rang 3 :</strong> Tant que cet opposant est vivant et qu'il donne des ordres, les autres adversaires voient leur dangerosité et leurs dégâts augmentés de <strong>+3</strong>."
  },
  {
    slug: "fluctuations", name: "Fluctuations Boursières", alias: "Chaos", rank: 1,
    text: "Les opposants bougent sans cesse et créent une horde d'individus indissociables. Les joueurs ne peuvent pas choisir de taper sur un tel ou un autre ; quand ils infligent des dégâts, le Secrétaire Général choisit au hasard sur quel ennemi ils les infligent."
  },
  {
    slug: "geldesavoirs", name: "Gel des Avoirs", alias: "Paralysie", rank: 1,
    text: "La cible de l'opposant est immobilisée et ne peut agir si elle rate son jet en MUSKLE avec un malus égal à la dangerosité de l'opposant. Une fois paralysée, la cible a droit à un jet en MUSKLE à chaque round pour se libérer. Un Kamarade paralysé est automatiquement touché par un opposant."
  },
  {
    slug: "inflation", name: "Inflation", alias: "Soif de Sang", rank: 1,
    text: "L'opposant est enivré par l'odeur de sang. Chaque fois qu'un Kamarade est blessé, les dégâts de l'opposant augmentent de 1."
  },
  {
    slug: "loidumarche", name: "Loi du Marché", alias: "Sans Pitié", rank: 1,
    text: "L'opposant ne pardonne aucune erreur, à la recherche de la moindre faille dans la défense du Kamarade, il exploite les faiblesses de nos héros pour porter des attaques fatales. Face à lui, le joueur obtient un échec critique sur un 2 (double 1), mais aussi sur un 3… (Rappel : nous préconisons qu'il encaisse alors le double des dégâts.)"
  },
  {
    slug: "management", name: "Management", alias: "Boost", rank: 1,
    text: "Une fois par tour, par ses encouragements, l'opposant permet à un autre de vos adversaires de doubler ses dégâts."
  },
  {
    slug: "massesalarial", name: "Masse Salariale", alias: "Encerclement", rank: 1,
    text: "Les opposants attaquent les Kamarades de tous les côtés. Tant qu'il y a plus d'opposants que de Kamarades, ces derniers perdent soit 1 point de vie à la fin de chaque round, soit un point de vie par opposant surnuméraire ! Le choix incombe bien entendu au Secrétaire Général."
  },
  {
    slug: "miseconc1", name: "Mise en Concurrence 1", alias: "Défi", rank: 1,
    text: "<strong>Effet au rang 1 :</strong> Cet opposant peut défier un des joueurs. Il obtient alors un bonus <strong>+1</strong> à sa dangerosité contre tout autre PJ qui l'attaquerait."
  },
  {
    slug: "miseconc2", name: "Mise en Concurrence 2", alias: "Défi", rank: 2,
    text: "<strong>Effet au rang 2 :</strong> Cet opposant peut défier un des joueurs. Il obtient alors un bonus <strong>+2</strong> à sa dangerosité contre tout autre PJ qui l'attaquerait."
  },
  {
    slug: "miseconc3", name: "Mise en Concurrence 3", alias: "Défi", rank: 3,
    text: "<strong>Effet au rang 3 :</strong> Cet opposant peut défier un des joueurs. Il obtient alors un bonus <strong>+3</strong> à sa dangerosité contre tout autre PJ qui l'attaquerait."
  },
  {
    slug: "opasauvage", name: "O.P.A. Sauvage", alias: "Domination", rank: 1,
    text: "Ce don peut être un pouvoir mutant, mais aussi, si le Secrétaire Général est adroit, être dû à un chantage ou tout autre moyen de pression… Le Kamarade doit réussir un jet en PRISONNIER POLITIQUE avec un malus égal à la dangerosité de l'opposant, sinon il doit obéir à ses ordres. L'opposant peut tenter cette action une fois par round, mais ne peut pas contrôler plusieurs personnes à la fois. L'opposant ne peut pas utiliser un autre don tant qu'il utilise celui-ci. Le Kamarade ne peut être forcé à se blesser lui-même, mais peut très bien aller briser les noix de ses compagnons."
  },
  {
    slug: "plansocial", name: "Plan Social", alias: "Tyran", rank: 1,
    text: "Plutôt que d'encaisser une blessure, cet opposant peut choisir de sacrifier un de ses subordonnés."
  },
  {
    slug: "protection", name: "Protectionnisme", alias: "Immunité", rank: 1,
    text: "L'opposant n'est sensible qu'à certains Signes particuliers, à certaines technologies (électricité, champ magnétique, musique rock'n'roll à fond la caisse ou grosses poutrelles en fonte sur le coin du crâne)."
  },
  {
    slug: "recapital1", name: "Recapitalisation Bancaire 1", alias: "Régénération", rank: 1,
    text: "<strong>Effet au rang 1 :</strong> L'opposant récupère <strong>1 point de vie</strong> à la fin de chaque round."
  },
  {
    slug: "recapital2", name: "Recapitalisation Bancaire 2", alias: "Régénération", rank: 2,
    text: "<strong>Effet au rang 2 :</strong> L'opposant récupère <strong>2 points de vie</strong> à la fin de chaque round."
  },
  {
    slug: "recapital3", name: "Recapitalisation Bancaire 3", alias: "Régénération", rank: 3,
    text: "<strong>Effet au rang 3 :</strong> L'opposant récupère <strong>3 points de vie</strong> à la fin de chaque round."
  },
  {
    slug: "recession", name: "Récession", alias: "Terrifiant", rank: 1,
    text: "L'opposant est très menaçant ou lourdement armé, etc. Un Kamarade qui voit cet adversaire doit faire un jet en PRISONNIER POLITIQUE avec un malus égal à la dangerosité de l'opposant. S'il échoue, il fuit le plus loin possible, sans combattre. Il a droit à un jet en PRISONNIER POLITIQUE par tour avec un malus égal à la dangerosité de l'opposant pour retrouver ses esprits."
  },
  {
    slug: "societecran", name: "Société Écran", alias: "Armure", rank: 1,
    text: "L'opposant possède une Armure comme les Kamarades (qu'il peut utiliser 1, 2 voire 3 fois au bon vouloir du Secrétaire Général)."
  },
  {
    slug: "systepyramid", name: "Système Pyramidal", alias: "Embuscade", rank: 1,
    text: "Lors du premier tour, l'opposant n'encaisse pas de blessures, même si les Kamarades réussissent leurs jets d'attaque."
  },
  {
    slug: "tauxinteret", name: "Taux d'Intérêt", alias: "Briseur d'Os", rank: 1,
    text: "L'opposant est un colosse, ses coups sont impressionnants. Chaque fois qu'un Kamarade reçoit des dommages venant de ce géant, il doit faire un jet en KARKASS de seuil 12, s'il ne veut pas en plus gagner une Faiblesse (côtes brisées, épaule déboîtée, etc.), qui lui appliquera un malus de –2 lorsque le Secrétaire Général estimera que la situation l'exige."
  },
  {
    slug: "transfertfond", name: "Transfert de Fonds", alias: "Soin", rank: 1,
    text: "L'opposant est capable de filer un petit coup de main à ses complices. Soit il rend 2 points de vie à chacun d'eux à chaque tour, soit il peut rendre jusqu'à 4 points de vie qu'il peut distribuer où bon lui semble. Lui-même ne bénéficie pas des effets de ce don. La quantité de points de vie soignés peut bien sûr être modifiée par le Secrétaire Général selon la difficulté de la rencontre."
  },
  {
    slug: "ventedecouv", name: "Vente à Découvert", alias: "Tricheur", rank: 1,
    text: "L'opposant est vicieux et imprévisible, tout en feintes et en coups bas. Le Kamarade qui l'affronte ne jette plus deux dés mais trois, et il conserve les deux plus mauvais jets."
  }
];

const seenIds = new Set();
let sort = 0;
for (const d of DONS) {
  const id = padId(d.slug);
  if (seenIds.has(id)) throw new Error(`duplicate _id: ${id}`);
  seenIds.add(id);

  const doc = {
    _id: id,
    name: d.name,
    type: "don",
    img: IMG,
    system: {
      description: toHtml(d.text),
      alias: d.alias,
      rank: d.rank
    },
    effects: [],
    folder: FOLDER,
    sort: sort++,
    ownership: { default: 0 },
    flags: {},
    _key: `!items!${id}`
  };

  writeFileSync(join(OUT, `${d.slug}.json`), JSON.stringify(doc, null, 2) + "\n", "utf8");
}

console.log(`Wrote ${DONS.length} don source JSON(s) to ${OUT}`);
