const ENEMY_BASE_HP = 5;

export function prepareEnemyDerivedData(actor) {
  if (actor.type !== "enemy") return;

  const sys = actor.system;
  initializeEnemyHealthOffset(actor);
  sys.health.value = computeEnemyHealthValue(sys);
}

export function initializeEnemyHealthOffset(actor) {
  const sys = actor.system;
  const sourceHealth = actor._source?.system?.health;
  if (actor._source?.system) {
    if (Number.isFinite(sourceHealth?.offset)) return;
  } else if (Number.isFinite(sys.health?.offset)) {
    return;
  }

  const value = Number.isFinite(sourceHealth?.value) ? sourceHealth.value : (sys.health?.value ?? ENEMY_BASE_HP);
  const max = Number.isFinite(sourceHealth?.max) ? sourceHealth.max : (sys.health?.max ?? ENEMY_BASE_HP);
  sys.health.offset = value - max;
}

export function computeEnemyHealthValue(sys) {
  const max = sys.health?.max ?? ENEMY_BASE_HP;
  const offset = sys.health?.offset ?? 0;
  return Math.max(0, Math.min(max, max + offset));
}
