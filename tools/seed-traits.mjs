// One-off/idempotent seed for reference compendiums:
// - packs-src/traits: one Item per Kamarade Trait
// - packs-src/traits_soyouz: one Item per Soyouz Trait
//
// These Items are reference aids only. They intentionally carry no mechanical
// automation and can be safely regenerated from this source.

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(\w):/, "$1:"));
const TRAITS_OUT = join(ROOT, "packs-src", "traits");
const SOYOUZ_TRAITS_OUT = join(ROOT, "packs-src", "traits_soyouz");
const FR = JSON.parse(readFileSync(join(ROOT, "languages", "fr.json"), "utf8"));

const TRAIT_IMG = "icons/svg/dice-target.svg";
const SOYOUZ_TRAIT_IMG = "icons/svg/statue.svg";

const DOCTRINE_FOLDERS = {
  marteau: { id: "fldtraitmarteauA", key: "Marteau", sort: 0 },
  faucille: { id: "fldtraitfaucille", key: "Faucille", sort: 1 },
  etoile: { id: "fldtraitetoileAA", key: "Etoile", sort: 2 }
};

const KAMARADE_TRAITS = [
  {
    doctrine: "marteau",
    doctrineKey: "Marteau",
    traits: [
      {
        id: "ak47",
        key: "Ak47",
        detail: [
          "Ce Trait regroupe toutes les compétences relatives aux armes de jet. Il sert également lors des jets basiques de lancer, comme agripper un hélicoptère avec un grappin."
        ]
      },
      {
        id: "briseurDeGreve",
        key: "BriseurDeGreve",
        detail: [
          "Ce Trait regroupe toute action ou attitude faisant appel à l'intimidation. C'est la compétence classique des criminels et des mauvais garçons : racketter, faire taire quelqu'un, etc."
        ]
      },
      {
        id: "goulag",
        key: "Goulag",
        detail: [
          "Ce Trait permet aux Kamarades de survivre dans les villes polluées de l'Union, les jungles hostiles de la Border Zone et les goulags divers qui parsèment l'Univers.",
          "Grâce à lui, un Kamarade peut manger des trucs immondes sans tomber gravement malade, marcher avec deux chaussures gauches, identifier une plante toxique, monter un campement de fortune, ou survivre au vide une minute de plus avec des moyens absolument peu recommandables."
        ]
      },
      {
        id: "karkass",
        key: "Karkass",
        detail: [
          "Ce Trait regroupe toute action, talent ou attitude faisant appel à la résistance physique du Kamarade.",
          "On doit compter dessus pour survivre à une baignade dans une mer d'hydrocarbures ou à un baiser à la russe avec un Canichk, cette race de Nemtsyi très poilue et dépourvue d'œil qui porte tout à la bouche pour l'analyser."
        ]
      },
      {
        id: "lutte",
        key: "Lutte",
        detail: [
          "Ce Trait fait appel à tout ce qui touche au corps à corps, comme immobiliser quelqu'un, lui donner un coup de poing, se débattre ou régler un désaccord dialectique à portée de mandibule."
        ]
      },
      {
        id: "medailleOlympique",
        key: "MedailleOlympique",
        detail: [
          "Ce Trait joue un rôle dans toutes les actions nécessitant une aptitude sportive : course, escalade, natation, ou faire glisser une pierre en frottant très vite un parquet avec un balai."
        ]
      },
      {
        id: "muskle",
        key: "Muskle",
        detail: [
          "Ce Trait permet de mesurer la force musculaire du Kamarade pour soulever du poids, briser des choses, forcer ce qui résiste, et rappeler par l'exemple que la matière doit plier devant la volonté collectivisée."
        ]
      },
      {
        id: "prisonnierPolitique",
        key: "PrisonnierPolitique",
        detail: [
          "Beaucoup de citoyens ont développé ce mélange subtil de comédie, de baratin et de volonté qui leur permet de résister à la torture ou de jouer les soumis."
        ]
      },
      {
        id: "soyouz",
        key: "Soyouz",
        detail: [
          "Ce Trait regroupe toutes les compétences relatives aux vaisseaux spatiaux : aussi bien les piloter que d'identifier un modèle, voire reconnaître une antiquité ou un bâtiment historique."
        ]
      }
    ]
  },
  {
    doctrine: "faucille",
    doctrineKey: "Faucille",
    traits: [
      {
        id: "acrobate",
        key: "Acrobate",
        detail: [
          "Ce Trait regroupe toutes les actions faisant appel à l'agilité et à la souplesse : grimper, faire des entrechats entre des rayons laser, se faufiler avec panache, etc."
        ]
      },
      {
        id: "actionPartisane",
        key: "ActionPartisane",
        detail: [
          "Ce Trait permet aux Kamarades de concevoir et d'effectuer des actions politiques interdites sans se faire surprendre par la police politique ou dénoncer par un voisin zélé.",
          "Il couvre aussi bien le collage d'affiches en douce que la pose de bombe ou le repérage des issues pour un attentat nudiste."
        ]
      },
      {
        id: "bolchoi",
        key: "Bolchoi",
        detail: [
          "Ce Trait regroupe toutes les compétences théoriques et pratiques liées aux arts : danse, piano, peinture, etc.",
          "Il couvre également la connaissance des courants artistiques et des artistes eux-mêmes, morts, vivants, ou entre les deux."
        ]
      },
      {
        id: "corruption",
        key: "Corruption",
        detail: [
          "Dans un monde gangréné par la pénurie, le népotisme et l'arbitraire, ce Trait regroupe les capacités du Kamarade à obtenir ce qui est théoriquement interdit en échange de biens matériels ou autres.",
          "Il sert notamment à graisser des pattes, faire des faux papiers et transformer l'administration en partenaire provisoirement coopératif."
        ]
      },
      {
        id: "etreAuParfum",
        key: "EtreAuParfum",
        detail: [
          "Ce Trait permet d'évaluer l'aisance sociale : connaître les rumeurs et les potins, flairer les mensonges et les secrets.",
          "Il relève aussi d'une certaine mentalité criminelle, comme la capacité à faire chanter quelqu'un avec le sourire le plus administratif possible."
        ]
      },
      {
        id: "grouillot",
        key: "Grouillot",
        detail: [
          "Les Kamarades auraient tort de délaisser ce Trait, celui des fées du logis.",
          "Il peut servir à débusquer les bennes à ordures afin de s'y cacher, débarrasser une monture de ses puces, effacer des traces compromettantes, cuisiner l'improbable et rendre service là où personne ne veut mettre les mains."
        ]
      },
      {
        id: "marcheNoir",
        key: "MarcheNoir",
        detail: [
          "Ce Trait est cher à tous les contrebandiers, mais aussi au moindre citoyen de l'Union qui voudrait autre chose qu'un pantalon quinze tailles en dessous ou deux chaussures gauches.",
          "Il sert à dégotter des marchandises, estimer une valeur marchande, connaître les réseaux de revente, cacher un produit illicite, etc."
        ]
      },
      {
        id: "poupeeRusse",
        key: "PoupeeRusse",
        detail: [
          "Ce Trait regroupe toutes les actions et attitudes liées à la séduction et les moyens d'en abuser.",
          "Il permet évidemment de séduire, mais aussi d'inciter les partenaires romantiques ou sexuels du Kamarade à lui confier leurs secrets, à l'entretenir ou à lui rendre des services par espoir d'un regard ou d'un sourire."
        ]
      },
      {
        id: "propagande",
        key: "Propagande",
        detail: [
          "Ce Trait regroupe toutes les compétences faisant appel au mensonge ou au baratin, que ce soit en travestissant directement la vérité ou en faisant diversion."
        ]
      },
      {
        id: "socialTraitre",
        key: "SocialTraitre",
        detail: [
          "Ce Trait regroupe toutes les capacités faisant appel à la discrétion : marcher sans bruit, se cacher dans l'ombre, ouvrir des portes sans les faire grincer ou dérober une carte de rationnement dans les poches d'un quidam."
        ]
      }
    ]
  },
  {
    doctrine: "etoile",
    doctrineKey: "Etoile",
    traits: [
      {
        id: "dopage",
        key: "Dopage",
        detail: [
          "Ce Trait regroupe toutes les compétences théoriques et pratiques de médecine et de pharmacopée.",
          "Il sert à soigner, fabriquer une drogue ou un médicament, reconnaître une maladie, et parfois aider un ami à remporter une compétition de natation féminine."
        ]
      },
      {
        id: "jeuxEtParis",
        key: "JeuxEtParis",
        detail: [
          "Ce Trait regroupe toutes les compétences théoriques et pratiques liées aux jeux ainsi que la capacité à tricher : connaître les règles, tricher aux cartes, bluffer, etc."
        ]
      },
      {
        id: "kgb",
        key: "Kgb",
        detail: [
          "Ce Trait regroupe par essence toutes les compétences policières : remarquer un détail qui cloche, repérer quelque chose de suspect, filer quelqu'un, déduire, enquêter, analyser des dossiers, etc."
        ]
      },
      {
        id: "machiniste",
        key: "Machiniste",
        detail: [
          "Ce Trait regroupe toutes les compétences mécaniques : réparer une machine, un vaisseau spatial, un aspirateur, un grille-pain, et tout ce qui prétend fonctionner malgré son origine soviétique."
        ]
      },
      {
        id: "operateurCodeur",
        key: "OperateurCodeur",
        detail: [
          "Ce Trait regroupe toutes les capacités informatiques : pirater un ordinateur, trouver une information sur Interkom, comprendre une interface hostile, etc."
        ]
      },
      {
        id: "pionnier",
        key: "Pionnier",
        detail: [
          "Ce Trait regroupe toutes les compétences d'ethnologie et de xénologie.",
          "Il sert à parler une langue étrangère, connaître une civilisation nemtsy, ou comprendre les us et coutumes d'un pays, d'une tribu ou d'une bureaucratie locale."
        ]
      },
      {
        id: "rechercheConception",
        key: "RechercheConception",
        detail: [
          "Ce Trait regroupe toutes les compétences scientifiques : inventer une machine, une nouvelle substance chimique, connaître les travaux d'un chercheur connu, etc."
        ]
      },
      {
        id: "samizdats",
        key: "Samizdats",
        detail: [
          "Ce Trait regroupe toutes les compétences liées au journalisme et à l'édition.",
          "Il sert à écrire un livre ou un article, enquêter, publier malgré la censure, ou faire disparaître un stand alors qu'arrive la Tcheka pendant une convention clandestine."
        ]
      },
      {
        id: "tchernobyl",
        key: "Tchernobyl",
        detail: [
          "Tchernobyl est le Trait des mutants, des robots et autres Kamarades à pouvoir spécial.",
          "Pour jouer ce genre de Kamarade, il faut avoir un score en TCHERNOBYL et prendre un Signe particulier correspondant à son pouvoir. Comme toujours, le Secrétaire Général garde le dernier mot sur les usages possibles."
        ]
      },
      {
        id: "universitet",
        key: "Universitet",
        detail: [
          "Ce Trait regroupe toutes les compétences liées aux sciences humaines et sociales, ainsi que la connaissance du fonctionnement des universités et des professeurs reconnus dans leurs domaines."
        ]
      }
    ]
  }
];

const SOYOUZ_TRAITS = [
  {
    id: "tupolev",
    key: "Tupolev",
    detail: [
      "TUPOLEV représente la vitesse de déplacement d'un engin, sa manœuvrabilité et le punch de ses moteurs.",
      "Quand un Kamarade essaye de le faire manœuvrer, le score en TUPOLEV s'ajoute naturellement au score en SOYOUZ du pilote."
    ]
  },
  {
    id: "orgueDeStaline",
    key: "OrgueDeStaline",
    detail: [
      "ORGUE DE STALINE représente l'armement du vaisseau.",
      "Ce score s'ajoute au score en AK 47 d'un éventuel canonnier. Avec un score de -2, l'appareil est totalement désarmé, et tirer sur les ennemis par les fenêtres ouvertes reste une idée historiquement problématique."
    ]
  },
  {
    id: "parade",
    key: "Parade",
    detail: [
      "PARADE représente l'aspect du vaisseau.",
      "Ce score peut être ajouté aux tentatives de PROPAGANDE ou de BRISEUR DE GRÈVE des pilotes, que ce soit pour faire peur, forcer un blocus spatial ou négocier les termes d'un contrat impliquant le vaisseau."
    ]
  },
  {
    id: "lebedev",
    key: "Lebedev",
    detail: [
      "LEBEDEV représente l'équipement informatique et les scanners du soyouz.",
      "Il peut s'ajouter à un jet d'OPÉRATEUR CODEUR pour lire des échos radar, analyser des données scientifiques ou hacker l'Interkom."
    ]
  },
  {
    id: "datcha",
    key: "Datcha",
    detail: [
      "DATCHA représente le confort d'un vaisseau, son habitabilité et le côté douillet de ses équipements.",
      "À -2, c'est l'exiguïté totale, les angles vifs des machines et pratiquement aucun espace prévu pour y vivre. À 0, on imagine un confort spartiate. À +1, le soyouz commence à être confortable comme un petit studio. Au-delà, c'est le luxe."
    ]
  },
  {
    id: "tetris",
    key: "Tetris",
    detail: [
      "TÉTRIS représente la capacité des soutes.",
      "À -2, il y a à peine la place pour une valisette. À -1, tout le monde peut amener des bagages limités. Au-delà, on commence à pouvoir songer à une cargaison, voire à des tankers exceptionnels.",
      "Le TÉTRIS sert aussi à calculer les dégâts lorsque l'engin est utilisé lui-même comme une arme, par exemple en emboutissant un adversaire avec la masse du vaisseau."
    ]
  },
  {
    id: "murDeFer",
    key: "MurDeFer",
    detail: [
      "MUR DE FER représente le blindage et l'armure du vaisseau, sa résistance aux impacts, mais surtout ses points de vie."
    ]
  }
];

function i18n(path) {
  const parts = path.split(".");
  let node = FR;
  for (const part of parts) node = node?.[part];
  if (typeof node !== "string") throw new Error(`Missing i18n key: ${path}`);
  return node;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function toHtml(paragraphs) {
  return paragraphs.map(text => `<p>${escapeHtml(text)}</p>`).join("");
}

function hashSlug(value) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(7, "0").slice(0, 7);
}

function makeId(prefix, value) {
  const compact = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  const suffix = hashSlug(value);
  const head = `${prefix}${compact}`.slice(0, 16 - suffix.length);
  return `${head}${suffix}`.padEnd(16, "A").slice(0, 16);
}

function folderDoc({ id, key, sort }) {
  return {
    _id: id,
    _key: `!folders!${id}`,
    name: i18n(`STARMARX.Doctrine.${key}`),
    type: "Item",
    sorting: "a",
    folder: null,
    sort,
    color: "",
    description: "",
    flags: {}
  };
}

function itemDoc({ id, name, type, img, system, folder, sort }) {
  return {
    _id: id,
    name,
    type,
    img,
    system,
    effects: [],
    folder,
    sort,
    ownership: { default: 0 },
    flags: {},
    _key: `!items!${id}`
  };
}

function writeJson(dir, fileName, doc) {
  writeFileSync(join(dir, fileName), JSON.stringify(doc, null, 2) + "\n", "utf8");
}

function writeKamaradeTraits() {
  mkdirSync(TRAITS_OUT, { recursive: true });

  for (const folder of Object.values(DOCTRINE_FOLDERS)) {
    writeJson(TRAITS_OUT, `_folder_${folder.id}.json`, folderDoc(folder));
  }

  let sort = 0;
  for (const group of KAMARADE_TRAITS) {
    const folderId = DOCTRINE_FOLDERS[group.doctrine].id;
    for (const trait of group.traits) {
      const labelPath = `STARMARX.Trait.${group.doctrineKey}.${trait.key}`;
      const shortPath = `STARMARX.Trait.ShortDescription.${group.doctrineKey}.${trait.key}`;
      const doc = itemDoc({
        id: makeId("trt", `${group.doctrine}.${trait.id}`),
        name: i18n(labelPath),
        type: "trait",
        img: TRAIT_IMG,
        folder: folderId,
        sort: sort++,
        system: {
          doctrine: group.doctrine,
          traitKey: `${group.doctrine}.${trait.id}`,
          shortDescription: i18n(shortPath),
          description: toHtml(trait.detail)
        }
      });
      writeJson(TRAITS_OUT, `${group.doctrine}-${trait.id}.json`, doc);
    }
  }

  return sort;
}

function writeSoyouzTraits() {
  mkdirSync(SOYOUZ_TRAITS_OUT, { recursive: true });

  let sort = 0;
  for (const trait of SOYOUZ_TRAITS) {
    const labelPath = `STARMARX.Soyouz.Traits.${trait.key}`;
    const shortPath = `STARMARX.Soyouz.Trait.ShortDescription.${trait.key}`;
    const doc = itemDoc({
      id: makeId("trs", trait.id),
      name: i18n(labelPath),
      type: "trait_soyouz",
      img: SOYOUZ_TRAIT_IMG,
      folder: null,
      sort: sort++,
      system: {
        traitKey: trait.id,
        shortDescription: i18n(shortPath),
        description: toHtml(trait.detail)
      }
    });
    writeJson(SOYOUZ_TRAITS_OUT, `${trait.id}.json`, doc);
  }

  return sort;
}

const kamaradeCount = writeKamaradeTraits();
const soyouzCount = writeSoyouzTraits();

console.log(`Wrote ${kamaradeCount} Kamarade Trait source JSON(s) to ${TRAITS_OUT}`);
console.log(`Wrote ${soyouzCount} Soyouz Trait source JSON(s) to ${SOYOUZ_TRAITS_OUT}`);
