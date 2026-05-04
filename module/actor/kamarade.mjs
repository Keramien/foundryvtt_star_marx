import {
  BASE_HP,
  DOCTRINES,
  STARTING_TRAIT_POINTS,
  TRAITS_BY_DOCTRINE,
  TRAIT_COST,
  damageFromRank
} from "../helpers/config.mjs";

export function prepareKamaradeDerivedData(actor) {
  if (actor.type !== "kamarade") return;

  const sys = actor.system;
  const chosenDoctrine = sys.details?.doctrine ?? DOCTRINES[0];

  // Compute the effective total for every trait:
  //   total = points + bonus + (1 if the trait is in the chosen doctrine)
  // The +1 is the free rank granted at creation by the chosen doctrine.
  for (const d of DOCTRINES) {
    const doctrineBonus = (d === chosenDoctrine) ? 1 : 0;
    for (const tid of TRAITS_BY_DOCTRINE[d]) {
      const t = sys.traits?.[d]?.[tid];
      if (!t) continue;
      t.total = (t.points ?? 0) + (t.bonus ?? 0) + doctrineBonus;
    }
  }

  initializeKamaradeHealthOffset(actor);

  // HP max is derived from KARKASS total + persistent/sign bonuses. Current
  // HP is stored as an offset from max so max changes keep wound count.
  sys.health.max = computeKamaradeHealthMax(actor, sys);
  sys.health.value = computeKamaradeHealthValue(actor, sys);

  // Damage sources read their trait total too.
  sys.damage.lutte.value = damageFromRank(sys.traits?.marteau?.lutte?.total ?? 0)
    + (sys.damage.lutte.bonus ?? 0);
  sys.damage.ak47.value = damageFromRank(sys.traits?.marteau?.ak47?.total ?? 0)
    + (sys.damage.ak47.bonus ?? 0);

  // XP is split across 4 editable buckets. Total is computed for display.
  const xp = sys.details.xp;
  const xpTraits = xp.traits ?? 0;
  const xpSignes = xp.signes ?? 0;
  const xpClefs  = xp.clefs  ?? 0;
  const xpAutres = xp.autres ?? 0;
  sys.details.xp.total = xpTraits + xpSignes + xpClefs + xpAutres;

  sys.traitPoints = computeKamaradeTraitPoints(actor);

  // Signes slots: creation base + racial/sign bonuses + 1 per 2 XP spent on signes.
  sys.signesMax = computeKamaradeSignesMax(actor);

  // Clefs slots: 2 XP = 1 slot, capped by the rules' hard max (default 5).
  sys.clefsMax = Math.min(sys.limits?.clefs ?? 5, Math.floor(xpClefs / 2));
}

export function computeKamaradeTraitPoints(actor) {
  const sys = actor.system;
  const doctrine = sys.details?.doctrine ?? DOCTRINES[0];
  const xpTraits = sys.details?.xp?.traits ?? 0;

  let spent = 0;
  for (const d of DOCTRINES) {
    const cost = (d === doctrine) ? TRAIT_COST.doctrine : TRAIT_COST.hors;
    for (const traitId of TRAITS_BY_DOCTRINE[d]) {
      const points = sys.traits?.[d]?.[traitId]?.points ?? 0;
      spent += points * cost;
    }
  }

  const max = STARTING_TRAIT_POINTS + xpTraits + computeKamaradeTraitPointsBonus(actor);
  return { max, spent, available: max - spent };
}

export function computeKamaradeSignesMax(actor) {
  const sys = actor.system;
  const xpSignes = sys.details?.xp?.signes ?? 0;
  return (sys.limits?.signes ?? 2)
    + Math.floor(xpSignes / 2)
    + computeKamaradeSignesMaxBonus(actor);
}

export function initializeKamaradeHealthOffset(actor) {
  const sys = actor.system;
  const sourceHealth = actor._source?.system?.health;
  if (actor._source?.system) {
    if (Number.isFinite(sourceHealth?.offset)) return;
  } else if (Number.isFinite(sys.health?.offset)) {
    return;
  }

  const value = Number.isFinite(sourceHealth?.value) ? sourceHealth.value : (sys.health?.value ?? BASE_HP);
  const max = Number.isFinite(sourceHealth?.max) ? sourceHealth.max : (sys.health?.max ?? BASE_HP);
  sys.health.offset = value - max;
}

export function computeKamaradeHealthMax(actor, sys) {
  const doctrine = sys.details?.doctrine ?? DOCTRINES[0];
  const k = sys.traits?.marteau?.karkass ?? {};
  const doctrineBonus = (doctrine === "marteau") ? 1 : 0;
  const karkassTotal = (k.points ?? 0) + (k.bonus ?? 0) + doctrineBonus;
  const signBonus = computeKamaradeSignHpBonus(actor);
  return BASE_HP + karkassTotal + (sys.health?.bonus ?? 0) + signBonus;
}

export function computeKamaradeHealthValue(actor, sys) {
  const max = sys.health?.max ?? computeKamaradeHealthMax(actor, sys);
  const offset = sys.health?.offset ?? 0;
  return Math.max(0, Math.min(max, max + offset));
}

export function hasKamaradeItem(actor, name) {
  let found = false;
  actor.items?.forEach(item => {
    if (item && item.name && normalizeSignSlug(item.name) === name) {
      found = true;
    }
  });
  return found;
}

export function hasKamaradeSigne(actor, name) {
  let found = false;
  actor.items?.forEach(item => {
    if (item?.type === "signe" && item.name && normalizeSignSlug(item.name) === name) {
      found = true;
    }
  });
  return found;
}

export function computeKamaradeTraitPointsBonus(actor) {
  if (actor.type !== "kamarade") return 0;

  let bonus = 0;
  if (hasKamaradeSigne(actor, "humain")) bonus += 2;
  return bonus;
}

export function computeKamaradeSignesMaxBonus(actor) {
  if (actor.type !== "kamarade") return 0;

  let bonus = 0;
  if (hasKamaradeSigne(actor, "humain")) bonus += 1;
  return bonus;
}

export function computeKamaradeSignHpBonus(actor) {
  if (actor.type !== "kamarade") return 0;

  let bonus = 0;
  if (hasKamaradeSigne(actor, "enpremiereligne")) bonus += 3;
  if (hasKamaradeSigne(actor, "mnogy")) bonus += 1;
  return bonus;
}

export function normalizeSignSlug(value) {
  if (typeof value !== "string") return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}
