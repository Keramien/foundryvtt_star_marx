const BaseTokenDocument = globalThis.TokenDocument ?? class {
  async _preCreate() {}
};
const LINKED_TOKEN_ACTOR_TYPES = new Set(["kamarade", "soyouz"]);

export class StarMarxTokenDocument extends BaseTokenDocument {
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    if (!usesLinkedToken(this, data)) return;
    this.updateSource?.({ actorLink: true });
  }
}

export async function ensureLinkedActorPrototypeTokensLinked() {
  if (!globalThis.game?.user?.isGM) return;

  const updates = [];
  for (const actor of globalThis.game.actors ?? []) {
    if (!LINKED_TOKEN_ACTOR_TYPES.has(actor.type)) continue;
    if (actor.prototypeToken?.actorLink === true) continue;

    updates.push(actor.update?.({ "prototypeToken.actorLink": true }));
  }

  await Promise.all(updates.filter(Boolean));
}

function usesLinkedToken(token, data) {
  const actor = token.actor ?? getWorldActor(data?.actorId ?? token.actorId);
  return LINKED_TOKEN_ACTOR_TYPES.has(actor?.type);
}

function getWorldActor(actorId) {
  if (!actorId) return undefined;
  return globalThis.game?.actors?.get?.(actorId);
}
