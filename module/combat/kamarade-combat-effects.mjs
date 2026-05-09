import { hasKamaradeSigne } from "../actor/kamarade.mjs";

const REGENERATION_HEAL = 3;

export async function applyEndOfCombatKamaradeEffects(combat, options = {}) {
  const results = [];
  for (const actor of collectUniqueKamaradeCombatActors(combat)) {
    const result = await applyKamaradeRegeneration(actor, options);
    if (result.applied) results.push(result);
  }
  return results;
}

export function collectUniqueKamaradeCombatActors(combat) {
  const actors = new Map();
  for (const combatant of combat?.combatants ?? []) {
    const actor = combatant?.actor;
    if (actor?.type !== "kamarade") continue;

    const key = actor.uuid ?? actor.id ?? actor.name;
    if (!key || actors.has(key)) continue;
    actors.set(key, actor);
  }
  return [...actors.values()];
}

export async function applyKamaradeRegeneration(actor, options = {}) {
  const {
    healAmount = REGENERATION_HEAL,
    updateActor = true,
    notify = true
  } = options;

  if (actor?.type !== "kamarade" || !hasKamaradeSigne(actor, "regeneration")) {
    return { applied: false, healed: 0 };
  }

  const health = computeKamaradeCombatHealing(actor, healAmount);
  if (updateActor && health.healed > 0) {
    await actor.update({ "system.health.offset": health.next - health.max });
  }

  if (notify && shouldNotifyActor(actor)) {
    notifyKamaradeRegeneration(actor, health);
  }

  return {
    applied: true,
    actor,
    ...health
  };
}

export function computeKamaradeCombatHealing(actor, amount) {
  const max = actor.system?.health?.max ?? 0;
  const current = getKamaradeCurrentHealth(actor, max);
  const next = Math.max(0, Math.min(max, current + amount));

  return {
    current,
    max,
    next,
    healed: next - current
  };
}

function getKamaradeCurrentHealth(actor, max) {
  const value = actor.system?.health?.value;
  if (Number.isFinite(value)) return Math.max(0, Math.min(max, value));

  const offset = actor.system?.health?.offset;
  if (Number.isFinite(offset)) return Math.max(0, Math.min(max, max + offset));

  return max;
}

function shouldNotifyActor(actor) {
  if (!globalThis.game?.user) return false;
  if (game.user.isGM) return true;
  return actor.testUserPermission?.(game.user, "OWNER") ?? false;
}

function notifyKamaradeRegeneration(actor, health) {
  const key = health.healed > 0
    ? "STARMARX.Notifications.RegenerationApplied"
    : "STARMARX.Notifications.RegenerationAlreadyFull";
  const message = game.i18n.format(key, {
    actor: actor.name,
    healed: health.healed,
    max: health.max
  });
  ui.notifications.success(message, { console: false });
}
