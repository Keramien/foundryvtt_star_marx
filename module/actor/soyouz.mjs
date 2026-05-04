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

  initializeSoyouzHealthOffset(actor);
  sys.health.max = computeSoyouzHealthMax(sys);
  sys.health.value = computeSoyouzHealthValue(sys);

  sys.damageFromOrgue = soyouzDamageFromOrgue(t.orgueDeStaline?.total ?? 0);
}

export function initializeSoyouzHealthOffset(actor) {
  const sys = actor.system;
  const sourceHealth = actor._source?.system?.health;
  if (actor._source?.system) {
    if (Number.isFinite(sourceHealth?.offset)) return;
  } else if (Number.isFinite(sys.health?.offset)) {
    return;
  }

  const value = Number.isFinite(sourceHealth?.value) ? sourceHealth.value : (sys.health?.value ?? SOYOUZ_BASE_HP);
  const max = Number.isFinite(sourceHealth?.max) ? sourceHealth.max : (sys.health?.max ?? SOYOUZ_BASE_HP);
  sys.health.offset = value - max;
}

export function computeSoyouzHealthMax(sys) {
  const murDeFerTotal = sys.traits?.murDeFer?.total ?? 0;
  return Math.max(0, SOYOUZ_BASE_HP + murDeFerTotal);
}

export function computeSoyouzHealthValue(sys) {
  const max = sys.health?.max ?? computeSoyouzHealthMax(sys);
  const offset = sys.health?.offset ?? 0;
  return Math.max(0, Math.min(max, max + offset));
}
