import {
  SOYOUZ_TRAITS,
  SOYOUZ_BASE_HP,
  soyouzDamageFromOrgue
} from "../helpers/config.mjs";

// Soyouz derivations:
//   trait.total     = score + bonus + avaries  (per trait)
//   traitTotal      = Σ score (scores only — the creation-balance metric
//                     stays stable whether avaries or bonuses are applied)
//   health.max      = 5 + MUR DE FER total      (floored at 0)
//   damageFromOrgue = damage dealt by the ship's weapons (lookup table on
//                     the effective ORGUE DE STALINE total)
export function prepareSoyouzDerivedData(actor) {
  const sys = actor.system;
  const t = sys.traits ?? {};

  let sumScore = 0;
  for (const tid of SOYOUZ_TRAITS) {
    const row = t[tid];
    if (!row) continue;
    row.total = (row.score ?? 0) + (row.bonus ?? 0) + (row.avaries ?? 0);
    sumScore += (row.score ?? 0);
  }
  sys.traitTotal = sumScore;

  const murDeFerTotal = t.murDeFer?.total ?? 0;
  sys.health.max = Math.max(0, SOYOUZ_BASE_HP + murDeFerTotal);
  sys.health.value = Math.max(0, Math.min(sys.health.value ?? 0, sys.health.max));

  sys.damageFromOrgue = soyouzDamageFromOrgue(t.orgueDeStaline?.total ?? 0);
}

// Shift Soyouz current HP by the same delta as max HP when MUR DE FER changes.
// Returns true when the caller should stop processing update hooks.
export function applySoyouzHealthPreUpdate(actor, changed) {
  const watched = [
    "system.traits.murDeFer.score",
    "system.traits.murDeFer.bonus",
    "system.traits.murDeFer.avaries"
  ];
  if (!watched.some(p => foundry.utils.hasProperty(changed, p))) return true;

  const currentMax = actor.system.health.max;
  const mergedSys = foundry.utils.mergeObject(
    foundry.utils.deepClone(actor.toObject().system),
    changed.system ?? {}
  );
  const m = mergedSys.traits?.murDeFer ?? {};
  const murTotal = (m.score ?? 0) + (m.bonus ?? 0) + (m.avaries ?? 0);
  const newMax = Math.max(0, SOYOUZ_BASE_HP + murTotal);
  const delta = newMax - currentMax;
  if (delta === 0) return true;

  const incomingValue = foundry.utils.getProperty(changed, "system.health.value");
  const baseValue = (incomingValue !== undefined) ? incomingValue : (actor.system.health.value ?? 0);
  const shifted = Math.max(0, Math.min(newMax, baseValue + delta));
  foundry.utils.setProperty(changed, "system.health.value", shifted);
  return true;
}
