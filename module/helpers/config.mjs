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

// Soyouz (ship actor) — 7 ship traits, ordered as printed on the char sheet.
// Scores run from -2 to +2 at creation (sum must be 0); can drop to -3 once
// PV are exhausted (avaries). See memory/star_marx_codex/soyouz/traits_soyouz.md
export const SOYOUZ_TRAITS = [
  "tupolev",
  "orgueDeStaline",
  "parade",
  "lebedev",
  "datcha",
  "tetris",
  "murDeFer"
];

// Crew posts. Each one holds a list of Kamarade UUIDs (drag-drop assignment).
// The rules allow multiple Kamarades per post (two gunners, two pilots, etc.)
// and the same Kamarade can reasonably occupy more than one post across turns,
// so the sheet does not enforce caps or uniqueness.
export const SOYOUZ_POSTES = [
  "pilote",
  "artilleur",
  "operateur",
  "technicien",
  "beauParleur",
  "bourrin",
  "passager"
];

export const SOYOUZ_BASE_HP = 5;

// Damage inflicted by the ship based on ORGUE DE STALINE score
// (edition_augmentee_soyouz p.82). -1 rolls 1d2-1, so we surface it as a
// string "1d2-1" — the rest are flat numbers.
export function soyouzDamageFromOrgue(score) {
  if (score <= -2) return "0";
  if (score === -1) return "1d2-1";
  return String(score + 1);
}
