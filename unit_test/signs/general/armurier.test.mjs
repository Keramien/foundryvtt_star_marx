import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import {
  getArmurierUsedActorUuids,
  resolveKamaradeTraitRollModifiers
} from "../../../module/actor/kamarade-roll-modifiers.mjs";

const SIGN = catalog.find(entry => entry.slug === "armurier");

describe("Kamarade Sign - Armurier (armurier)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "general");
  });

  test("applies +1 to the owner's first AK 47 roll and +1 damage", async () => {
    const actor = createActor("OWNER", [createArmurierSigne()]);
    const combat = createCombat([actor]);

    const modifiers = await resolveKamaradeTraitRollModifiers(actor, {
      doctrine: "marteau",
      traitId: "ak47",
      combat
    });

    assert.equal(modifiers.rollBonus, 1);
    assert.equal(modifiers.damageBonus, 1);
    assert.equal(modifiers.sources[0].key, "armurier");
  });

  test("applies +1 to the owner's first LUTTE roll and +1 damage", async () => {
    const actor = createActor("OWNER", [createArmurierSigne()]);
    const combat = createCombat([actor]);

    const modifiers = await resolveKamaradeTraitRollModifiers(actor, {
      doctrine: "marteau",
      traitId: "lutte",
      combat
    });

    assert.equal(modifiers.rollBonus, 1);
    assert.equal(modifiers.damageBonus, 1);
  });

  test("does not apply to non-combat Traits", async () => {
    const actor = createActor("OWNER", [createArmurierSigne()]);
    const combat = createCombat([actor]);

    const modifiers = await resolveKamaradeTraitRollModifiers(actor, {
      doctrine: "faucille",
      traitId: "propagande",
      combat
    });

    assert.equal(modifiers.rollBonus, 0);
    assert.equal(modifiers.damageBonus, 0);
    assert.deepEqual(modifiers.sources, []);
  });

  test("does not apply without an active combat", async () => {
    const actor = createActor("OWNER", [createArmurierSigne()]);

    const modifiers = await resolveKamaradeTraitRollModifiers(actor, {
      doctrine: "marteau",
      traitId: "ak47",
      combat: null
    });

    assert.equal(modifiers.rollBonus, 0);
  });

  test("does not apply twice to the same Kamarade in one combat", async () => {
    const actor = createActor("OWNER", [createArmurierSigne()]);
    const combat = createCombat([actor]);

    const first = await resolveKamaradeTraitRollModifiers(actor, {
      doctrine: "marteau",
      traitId: "ak47",
      combat,
      consume: true
    });
    const second = await resolveKamaradeTraitRollModifiers(actor, {
      doctrine: "marteau",
      traitId: "lutte",
      combat,
      consume: true
    });

    assert.equal(first.rollBonus, 1);
    assert.equal(second.rollBonus, 0);
    assert.deepEqual(getArmurierUsedActorUuids(combat), [actor.uuid]);
  });

  test("applies to another Kamarade listed in otherAffectedKamarades", async () => {
    const target = createActor("TARGET");
    const owner = createActor("OWNER", [createArmurierSigne({
      otherAffectedKamarades: [target.uuid]
    })]);
    const combat = createCombat([owner, target]);

    const modifiers = await resolveKamaradeTraitRollModifiers(target, {
      doctrine: "marteau",
      traitId: "ak47",
      combat
    });

    assert.equal(modifiers.rollBonus, 1);
    assert.equal(modifiers.damageBonus, 1);
    assert.equal(modifiers.sources[0].sourceActorUuid, owner.uuid);
  });

  test("does not apply to another Kamarade missing from otherAffectedKamarades", async () => {
    const target = createActor("TARGET");
    const owner = createActor("OWNER", [createArmurierSigne()]);
    const combat = createCombat([owner, target]);

    const modifiers = await resolveKamaradeTraitRollModifiers(target, {
      doctrine: "marteau",
      traitId: "ak47",
      combat
    });

    assert.equal(modifiers.rollBonus, 0);
  });

  test("lets each listed Kamarade consume their own first roll", async () => {
    const firstTarget = createActor("TARGET-1");
    const secondTarget = createActor("TARGET-2");
    const owner = createActor("OWNER", [createArmurierSigne({
      otherAffectedKamarades: [firstTarget.uuid, secondTarget.uuid]
    })]);
    const combat = createCombat([owner, firstTarget, secondTarget]);

    const first = await resolveKamaradeTraitRollModifiers(firstTarget, {
      doctrine: "marteau",
      traitId: "ak47",
      combat,
      consume: true
    });
    const second = await resolveKamaradeTraitRollModifiers(secondTarget, {
      doctrine: "marteau",
      traitId: "lutte",
      combat,
      consume: true
    });

    assert.equal(first.rollBonus, 1);
    assert.equal(second.rollBonus, 1);
    assert.deepEqual(getArmurierUsedActorUuids(combat), [firstTarget.uuid, secondTarget.uuid]);
  });
});

function createActor(id, items = []) {
  return createKamaradeFixture({
    id,
    uuid: `Actor.${id}`,
    type: "kamarade",
    system: {
      details: { doctrine: "marteau" }
    },
    items
  });
}

function createArmurierSigne(system = {}) {
  return {
    id: "sgnarmurierAAAAA",
    uuid: "Item.sgnarmurierAAAAA",
    type: "signe",
    name: SIGN.name,
    system: {
      category: "general",
      otherAffectedKamarades: [],
      ...system
    }
  };
}

function createCombat(actors) {
  return {
    started: true,
    combatants: actors.map(actor => ({ actor })),
    flags: {},
    getFlag(namespace, key) {
      return this.flags?.[namespace]?.[key];
    },
    async setFlag(namespace, key, value) {
      this.flags[namespace] ??= {};
      this.flags[namespace][key] = value;
      return this;
    }
  };
}
