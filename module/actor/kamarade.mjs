import {
  BASE_HP,
  BASE_ZLOTYS,
  DOCTRINES,
  STARTING_TRAIT_POINTS,
  TRAITS_BY_DOCTRINE,
  TRAIT_COST,
  damageFromRank
} from "../helpers/config.mjs";

export function prepareKamaradeDerivedData(actor) {
  if (actor.type !== "kamarade") return;

  const sys = actor.system;
  initializeKamaradeHealthOffset(actor);
  prepareKamaradeTraitTotals(actor);

  // HP max is derived from KARKASS, or PRISONNIER POLITIQUE with Never Give Up,
  // plus persistent/sign bonuses. Current
  // HP is stored as an offset from max so max changes keep wound count.
  sys.health.max = computeKamaradeHealthMax(actor, sys);
  sys.health.value = computeKamaradeHealthValue(actor, sys);

  initializeKamaradeZlotysOffset(actor);
  sys.zlotys.base = computeKamaradeZlotysBase(sys);
  sys.zlotys.value = computeKamaradeZlotysValue(actor, sys);

  // Damage sources read their trait total, manual bonuses, and sign bonuses.
  sys.damage.lutte.value = computeKamaradeDamageValue(actor, sys, "lutte");
  sys.damage.ak47.value = computeKamaradeDamageValue(actor, sys, "ak47");

  // Fear resistance is a derived roll stat. It normally uses PRISONNIER
  // POLITIQUE, but specific signs can swap the base trait or add bonuses.
  sys.fearResistance ??= {};
  const fearResistance = computeKamaradeFearResistance(actor, sys);
  sys.fearResistance.base = fearResistance.base;
  sys.fearResistance.bonus = fearResistance.bonus;
  sys.fearResistance.value = fearResistance.value;
  sys.fearResistance.trait = fearResistance.trait;

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

  // Kontrebande capacity can be raised by racial signs.
  sys.kontrebandeMax = computeKamaradeKontrebandeMax(actor);
}

export function computeKamaradeTraitPoints(actor) {
  const sys = actor.system;
  const doctrine = sys.details?.doctrine ?? DOCTRINES[0];
  const xpTraits = sys.details?.xp?.traits ?? 0;

  let spent = 0;
  for (const d of DOCTRINES) {
    const cost = (d === doctrine) ? TRAIT_COST.doctrine : TRAIT_COST.hors;
    for (const traitId of TRAITS_BY_DOCTRINE[d]) {
      const trait = sys.traits?.[d]?.[traitId] ?? {};
      spent += computeKamaradeTraitBase(trait) * cost;
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

export function computeKamaradeKontrebandeMax(actor) {
  const base = actor.system.limits?.kontrebande ?? 5;
  return base + computeKamaradeKontrebandeMaxBonus(actor);
}

export function prepareKamaradeTraitTotals(actor) {
  const sys = actor.system;

  for (const doctrine of DOCTRINES) {
    for (const traitId of TRAITS_BY_DOCTRINE[doctrine]) {
      const trait = sys.traits?.[doctrine]?.[traitId];
      if (!trait) continue;

      const breakdown = computeKamaradeTraitDetail(actor, doctrine, traitId, trait);
      trait.base = breakdown.base;
      trait.autoBonus = breakdown.autoBonus;
      trait.manualBonus = breakdown.manualBonus;
      trait.bonus = breakdown.manualBonus;
      trait.optionalMax = breakdown.optionalMax;
      trait.total = breakdown.total;
    }
  }
}

export function computeKamaradeTraitDetail(actor, doctrine, traitId, trait = {}, context = {}) {
  const calculationContext = resolveKamaradeCalculationContext(actor, context);
  const base = computeKamaradeTraitBase(trait);
  const autoBonus = computeKamaradeTraitAutoBonus(actor, doctrine, traitId, calculationContext);
  const manualBonus = computeKamaradeTraitManualBonus(actor, doctrine, traitId, trait);
  const rawTotal = base + autoBonus + manualBonus;
  const optionalMax = computeKamaradeTraitOptionalMax(actor, doctrine, traitId, rawTotal);
  const total = Number.isFinite(optionalMax) && rawTotal > optionalMax  ? optionalMax : rawTotal;

  return { base, autoBonus, manualBonus, optionalMax, total };
}

export function computeKamaradeTraitTotal(actor, doctrine, traitId, trait = {}, context = {}) {
  return computeKamaradeTraitDetail(actor, doctrine, traitId, trait, context).total;
}

export function computeKamaradeTraitBase(trait = {}) {
  if (Number.isFinite(trait.points)) return trait.points;
  return Number.isFinite(trait.base) ? trait.base : 0;
}

export function computeKamaradeTraitManualBonus(actor, doctrine, traitId, trait = {}) {
  const sourceTrait = actor._source?.system?.traits?.[doctrine]?.[traitId];
  if (!Number.isFinite(sourceTrait?.manualBonus) && Number.isFinite(sourceTrait?.bonus)) {
    return sourceTrait.bonus;
  }
  if (Number.isFinite(trait.manualBonus)) return trait.manualBonus;
  return Number.isFinite(trait.bonus) ? trait.bonus : 0;
}

export function computeKamaradeTraitAutoBonus(actor, doctrine, traitId, context = {}) {
  const chosenDoctrine = actor.system.details?.doctrine ?? DOCTRINES[0];
  const doctrineBonus = (doctrine === chosenDoctrine) ? 1 : 0;
  return doctrineBonus + computeKamaradeSignTraitBonus(actor, doctrine, traitId, context);
}

export function computeKamaradeTraitOptionalMax(actor, doctrine, traitId, rawTotal) {
  if (actor.type !== "kamarade") return null;

  if (
    hasKamaradeSigne(actor, "hjort")
    && doctrine === "marteau"
    && traitId === "prisonnierPolitique"
  ) {
    return 1;
  }

  return null;
}

export function computeKamaradeDamageValue(actor, sys, source, context = {}) {
  const calculationContext = resolveKamaradeCalculationContext(actor, context);
  const traitTotal = computeKamaradeDamageTraitTotal(sys, source);
  const value = damageFromRank(traitTotal)
    + (sys.damage?.[source]?.bonus ?? 0)
    + computeKamaradeDamageBonus(actor, source, calculationContext);
  const cap = computeKamaradeDamageCap(actor, source);
  return Number.isFinite(cap) && value > cap ? cap : value;
}

export function computeKamaradeDamageTraitTotal(sys, source) {
  switch (source) {
    case "lutte":
      return sys.traits?.marteau?.lutte?.total ?? 0;
    case "ak47":
      return sys.traits?.marteau?.ak47?.total ?? 0;
    default:
      return 0;
  }
}

export function computeKamaradeFearResistance(actor, sys) {
  const traitId = getKamaradeFearResistanceTraitId(actor);
  const trait = sys.traits?.marteau?.[traitId] ?? {};
  const base = computeKamaradeTraitTotal(actor, "marteau", traitId, trait);
  const bonus = computeKamaradeFearResistanceBonus(actor);
  return {
    trait: traitId,
    base,
    bonus,
    value: base + bonus
  };
}

export function getKamaradeFearResistanceTraitId(actor) {
  return hasKamaradeSigne(actor, "memepaspeur") ? "briseurDeGreve" : "prisonnierPolitique";
}

export function computeKamaradeFearResistanceBonus(actor) {
  if (actor.type !== "kamarade") return 0;

  let bonus = 0;
  if (hasKamaradeSigne(actor, "klon")) bonus += 2;
  if (hasKamaradeSigne(actor, "mnogy")) bonus += 2;
  return bonus;
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
  const healthTraitTotal = computeKamaradeHealthTraitTotal(actor, sys);
  const signBonus = computeKamaradeSignHpBonus(actor);
  return BASE_HP + healthTraitTotal + (sys.health?.bonus ?? 0) + signBonus;
}

export function computeKamaradeHealthTraitTotal(actor, sys) {
  const traitId = getKamaradeHealthTraitId(actor);
  const trait = sys.traits?.marteau?.[traitId] ?? {};
  return computeKamaradeTraitTotal(actor, "marteau", traitId, trait, { dosAuMurActive: false });
}

export function getKamaradeHealthTraitId(actor) {
  return hasKamaradeSigne(actor, "nevergiveup") ? "prisonnierPolitique" : "karkass";
}

export function computeKamaradeHealthValue(actor, sys) {
  const max = sys.health?.max ?? computeKamaradeHealthMax(actor, sys);
  const offset = sys.health?.offset ?? 0;
  return Math.max(0, Math.min(max, max + offset));
}

export function initializeKamaradeZlotysOffset(actor) {
  const sys = actor.system;
  sys.zlotys ??= { value: BASE_ZLOTYS, base: BASE_ZLOTYS, offset: 0 };

  const sourceZlotys = actor._source?.system?.zlotys;
  if (actor._source?.system) {
    if (Number.isFinite(sourceZlotys?.offset)) return;
  } else if (Number.isFinite(sys.zlotys?.offset)) {
    return;
  }

  const base = Number.isFinite(sourceZlotys?.base) ? sourceZlotys.base : (sys.zlotys?.base ?? BASE_ZLOTYS);
  const value = Number.isFinite(sourceZlotys?.value) ? sourceZlotys.value : (sys.zlotys?.value ?? base);
  sys.zlotys.base = base;
  sys.zlotys.offset = value - base;
}

export function computeKamaradeZlotysBase(sys) {
  return sys.zlotys?.base ?? BASE_ZLOTYS;
}

export function computeKamaradeZlotysValue(actor, sys) {
  const base = computeKamaradeZlotysBase(sys);
  const bonus = computeKamaradeZlotysBonus(actor);
  const offset = sys.zlotys?.offset ?? 0;
  return Math.max(0, base + bonus + offset);
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

export function computeKamaradeKontrebandeMaxBonus(actor) {
  if (actor.type !== "kamarade") return 0;

  let bonus = 0;
  if (hasKamaradeSigne(actor, "gryazny")) bonus += 2;
  return bonus;
}

export function computeKamaradeZlotysBonus(actor) {
  if (actor.type !== "kamarade") return 0;

  let bonus = 0;
  if (hasKamaradeSigne(actor, "hjort")) bonus += 2;
  return bonus;
}

export function computeKamaradeSignTraitBonus(actor, doctrine, traitId, context = {}) {
  if (actor.type !== "kamarade") return 0;

  const calculationContext = resolveKamaradeCalculationContext(actor, context);
  let bonus = 0;
  if (calculationContext.dosAuMurActive && doctrine === "marteau") {
    bonus += 1;
  }
  if (hasActiveKamaradeSizeSigne(actor, "grand") && doctrine === "marteau" && traitId === "briseurDeGreve") {
    bonus += 2;
  }
  if (hasKamaradeSigne(actor, "bicyclope") && doctrine === "marteau" && traitId === "medailleOlympique") {
    bonus += 2;
  }
  if (hasKamaradeSigne(actor, "hjort") && doctrine === "faucille" && traitId === "corruption") {
    bonus += 2;
  }
  if (hasKamaradeSigne(actor, "krolik") && doctrine === "marteau" && traitId === "briseurDeGreve") {
    bonus -= 2;
  }
  return bonus;
}

export function computeKamaradeSignHpBonus(actor) {
  if (actor.type !== "kamarade") return 0;

  let bonus = 0;
  if (hasKamaradeSigne(actor, "enpremiereligne")) bonus += 3;
  if (hasActiveKamaradeSizeSigne(actor, "grand")) bonus += 2;
  if (hasKamaradeSigne(actor, "mnogy")) bonus += 1;
  if (hasKamaradeSigne(actor, "krolik")) bonus += 2;
  return bonus;
}

export function computeKamaradeDamageBonus(actor, source, context = {}) {
  if (actor.type !== "kamarade") return 0;

  const calculationContext = resolveKamaradeCalculationContext(actor, context);
  let bonus = 0;
  if (calculationContext.dosAuMurActive) bonus += 1;
  if (hasKamaradeSigne(actor, "boucher") && source === "lutte") bonus += 1;
  if (hasActiveKamaradeSizeSigne(actor, "grand") && source === "lutte") bonus += 1;
  if (hasKamaradeSigne(actor, "krolik") && source === "lutte") bonus += 1;
  if (hasKamaradeSigne(actor, "precis") && source === "ak47") bonus += 1;
  return bonus;
}

export function computeKamaradeDamageCap(actor, source) {
  if (actor.type !== "kamarade") return null;

  if (hasActiveKamaradeSizeSigne(actor, "petit") && source === "lutte") return 2;
  return null;
}

export function hasActiveKamaradeSizeSigne(actor, name) {
  if (!hasKamaradeSigne(actor, name)) return false;
  return !(hasKamaradeSigne(actor, "grand") && hasKamaradeSigne(actor, "petit"));
}

export function resolveKamaradeCalculationContext(actor, context = {}) {
  return {
    ...context,
    dosAuMurActive: context?.dosAuMurActive ?? isKamaradeDosAuMurActive(actor)
  };
}

export function isKamaradeDosAuMurActive(actor) {
  if (actor.type !== "kamarade") return false;
  if (!hasKamaradeSigne(actor, "dosaumur")) return false;
  return computeKamaradeHealthValueForContext(actor, actor.system) === 1;
}

export function computeKamaradeHealthValueForContext(actor, sys) {
  const max = computeKamaradeHealthMax(actor, sys);
  const offset = sys.health?.offset;
  if (Number.isFinite(offset)) return Math.max(0, Math.min(max, max + offset));

  const value = sys.health?.value;
  if (Number.isFinite(value)) return Math.max(0, Math.min(max, value));
  return max;
}

export function normalizeSignSlug(value) {
  if (typeof value !== "string") return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}
