import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import {
  computeKamaradeDamageBonus,
  computeKamaradeDamageValue,
  computeKamaradeHealthMax,
  prepareKamaradeDerivedData
} from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "krolik");

describe("Kamarade Sign - Krolik (krolik)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "racial");
  });

  test("adds +2 to max HP when the racial sign is present", () => {
    const actor = createActor();

    const withoutSign = computeKamaradeHealthMax(actor, actor.system);
    actor.items.push(createKrolikSigne());
    const withSign = computeKamaradeHealthMax(actor, actor.system);
    actor.items = [];
    const afterRemoval = computeKamaradeHealthMax(actor, actor.system);

    assert.equal(withoutSign, 5);
    assert.equal(withSign, 7);
    assert.equal(afterRemoval, 5);
  });

  test("health offset preserves wound count when the sign changes max HP", () => {
    const actor = createActor({
      system: {
        health: { value: 4, max: 5, offset: -1, bonus: 0 }
      }
    });

    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 4);
    assert.equal(actor.system.health.offset, -1);

    actor.items.push(createKrolikSigne());
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.health.max, 7);
    assert.equal(actor.system.health.value, 6);
    assert.equal(actor.system.health.offset, -1);

    actor.items = [];
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 4);
    assert.equal(actor.system.health.offset, -1);
  });

  test("adds -2 automatic bonus to BRISEUR DE GREVE", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "faucille" },
        traits: {
          marteau: {
            briseurDeGreve: { points: 3, manualBonus: 1, total: 0 }
          }
        }
      },
      items: [createKrolikSigne()]
    });

    prepareKamaradeDerivedData(actor);

    const briseurDeGreve = actor.system.traits.marteau.briseurDeGreve;
    assert.equal(briseurDeGreve.base, 3);
    assert.equal(briseurDeGreve.autoBonus, -2);
    assert.equal(briseurDeGreve.manualBonus, 1);
    assert.equal(briseurDeGreve.optionalMax, null);
    assert.equal(briseurDeGreve.total, 2);
  });

  test("adds +1 damage bonus to LUTTE only", () => {
    const actor = createActor({
      items: [createKrolikSigne()]
    });

    assert.equal(computeKamaradeDamageBonus(actor, "lutte"), 1);
    assert.equal(computeKamaradeDamageBonus(actor, "ak47"), 0);
  });

  test("applies the LUTTE damage bonus on derived damage", () => {
    const actor = createActor({
      system: {
        traits: {
          marteau: {
            lutte: { points: 5, manualBonus: 0, total: 0 },
            ak47: { points: 5, manualBonus: 0, total: 0 }
          }
        },
        damage: {
          lutte: { value: 0, bonus: 0 },
          ak47: { value: 0, bonus: 0 }
        }
      },
      items: [createKrolikSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.traits.marteau.lutte.total, 5);
    assert.equal(actor.system.traits.marteau.ak47.total, 5);
    assert.equal(actor.system.damage.lutte.value, 4);
    assert.equal(actor.system.damage.ak47.value, 3);
  });

  test("stacks sign damage with manual damage bonus", () => {
    const actor = createActor({
      system: {
        traits: {
          marteau: {
            lutte: { points: 5, manualBonus: 0, total: 5 }
          }
        },
        damage: {
          lutte: { value: 0, bonus: 2 }
        }
      },
      items: [createKrolikSigne()]
    });

    assert.equal(computeKamaradeDamageValue(actor, actor.system, "lutte"), 6);
  });
});

function createActor(overrides = {}) {
  const actor = createKamaradeFixture({
    type: "kamarade",
    ...overrides
  });
  actor.system.health.offset ??= 0;
  return actor;
}

function createKrolikSigne() {
  return {
    id: "sgrkrolikAAAAAAA",
    type: "signe",
    name: SIGN.name,
    system: {
      category: "racial"
    }
  };
}
