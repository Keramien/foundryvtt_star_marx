// System-wide constants for Star Marx.

export const SYSTEM_ID = "star_marx";

export const DOCTRINES = ["marteau", "faucille", "etoile"];

// Ordered trait ids per doctrine. Order matches the in-game character sheet layout.
export const TRAITS_BY_DOCTRINE = {
  marteau: [
    "ak47",
    "briseurDeGreve",
    "goulag",
    "karkass",
    "lutte",
    "medailleOlympique",
    "muskle",
    "prisonnierPolitique",
    "soyouz"
  ],
  faucille: [
    "acrobate",
    "actionPartisane",
    "bolchoi",
    "corruption",
    "etreAuParfum",
    "grouillot",
    "marcheNoir",
    "poupeeRusse",
    "propagande",
    "socialTraitre"
  ],
  etoile: [
    "dopage",
    "jeuxEtParis",
    "kgb",
    "machiniste",
    "operateurCodeur",
    "pionnier",
    "rechercheConception",
    "samizdats",
    "tchernobyl",
    "universitet"
  ]
};

// Damage tier from trait rank (kamarades.md, Étape 5).
//   rank 0-2 → 1, rank 3-4 → 2, rank 5-6 → 3, rank 7+ → 4
export function damageFromRank(rank) {
  if (rank >= 7) return 4;
  if (rank >= 5) return 3;
  if (rank >= 3) return 2;
  return 1;
}

// Cost in trait points to raise one rank.
export const TRAIT_COST = {
  doctrine: 1,
  hors: 2
};

export const STARTING_TRAIT_POINTS = 20;

// Base HP formula: PV = 5 + KARKASS (+ bonuses from race and signes).
export const BASE_HP = 5;

// Damage sources exposed on the sheet by default.
export const DAMAGE_SOURCES = ["lutte", "ak47"];
