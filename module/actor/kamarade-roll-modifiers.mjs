import { SYSTEM_ID } from "../helpers/config.mjs";
import { normalizeSignSlug } from "./kamarade.mjs";

const ARMURIER_TRAITS = new Set(["ak47", "lutte"]);
const ARMURIER_ROLL_BONUS = 1;
const ARMURIER_DAMAGE_BONUS = 1;

export async function resolveKamaradeTraitRollModifiers(actor, {
  doctrine,
  traitId,
  combat = globalThis.game?.combat,
  consume = false
} = {}) {
  const modifiers = emptyModifiers();
  if (!isArmurierRollEligible(actor, doctrine, traitId, combat)) return modifiers;

  const actorUuid = getActorUuid(actor);
  if (!actorUuid || getArmurierUsedActorUuids(combat).includes(actorUuid)) return modifiers;

  const source = findArmurierSourceForActor(actor, combat, actorUuid);
  if (!source) return modifiers;

  if (consume) await markArmurierUsed(combat, actorUuid);

  modifiers.rollBonus += ARMURIER_ROLL_BONUS;
  modifiers.damageBonus += ARMURIER_DAMAGE_BONUS;
  modifiers.sources.push({
    key: "armurier",
    labelKey: "STARMARX.Signe.Armurier.Label",
    rollBonus: ARMURIER_ROLL_BONUS,
    damageBonus: ARMURIER_DAMAGE_BONUS,
    sourceActorUuid: getActorUuid(source.actor),
    sourceItemUuid: source.signe.uuid ?? source.signe.id ?? ""
  });
  return modifiers;
}

export function getArmurierUsedActorUuids(combat) {
  const flag = getArmurierFlag(combat);
  return Array.isArray(flag.usedActorUuids) ? flag.usedActorUuids : [];
}

function emptyModifiers() {
  return { rollBonus: 0, damageBonus: 0, sources: [] };
}

function isArmurierRollEligible(actor, doctrine, traitId, combat) {
  return actor?.type === "kamarade"
    && doctrine === "marteau"
    && ARMURIER_TRAITS.has(traitId)
    && isCombatActive(combat);
}

function isCombatActive(combat) {
  return !!combat && combat.started !== false;
}

function findArmurierSourceForActor(actor, combat, actorUuid) {
  for (const sourceActor of getCombatKamaradeActors(combat)) {
    const signe = getArmurierSigne(sourceActor);
    if (!signe) continue;
    if (getActorUuid(sourceActor) === actorUuid) return { actor: sourceActor, signe };
    if (getOtherAffectedKamarades(signe).includes(actorUuid)) return { actor: sourceActor, signe };
  }
  return null;
}

function getCombatKamaradeActors(combat) {
  const actors = [];
  for (const combatant of combat?.combatants ?? []) {
    const actor = combatant?.actor;
    if (actor?.type === "kamarade") actors.push(actor);
  }
  return actors;
}

function getArmurierSigne(actor) {
  return Array.from(actor.items ?? []).find(item =>
    item?.type === "signe" && normalizeSignSlug(item.name) === "armurier"
  );
}

function getOtherAffectedKamarades(signe) {
  const uuids = signe.system?.otherAffectedKamarades;
  return Array.isArray(uuids) ? uuids : [];
}

async function markArmurierUsed(combat, actorUuid) {
  const flag = getArmurierFlag(combat);
  const usedActorUuids = Array.from(new Set([...getArmurierUsedActorUuids(combat), actorUuid]));
  const nextFlag = { ...flag, usedActorUuids };

  if (typeof combat.setFlag === "function") {
    await combat.setFlag(SYSTEM_ID, "armurier", nextFlag);
    return;
  }

  combat.flags ??= {};
  combat.flags[SYSTEM_ID] ??= {};
  combat.flags[SYSTEM_ID].armurier = nextFlag;
}

function getArmurierFlag(combat) {
  return combat?.getFlag?.(SYSTEM_ID, "armurier")
    ?? combat?.flags?.[SYSTEM_ID]?.armurier
    ?? {};
}

function getActorUuid(actor) {
  return actor?.uuid ?? (actor?.id ? `Actor.${actor.id}` : "");
}
