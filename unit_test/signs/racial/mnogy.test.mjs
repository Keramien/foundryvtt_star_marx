import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import {
  computeKamaradeFearResistance,
  computeKamaradeHealthMax,
  prepareKamaradeDerivedData
} from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "mnogy");

describe("Kamarade Sign - Mnogy (mnogy)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "racial");
  });

  test("adds +1 to max HP when the racial sign is present", () => {
    const actor = createActor();

    const withoutSign = computeKamaradeHealthMax(actor, actor.system);
    actor.items.push(createMnogySigne());
    const withSign = computeKamaradeHealthMax(actor, actor.system);
    actor.items = [];
    const afterRemoval = computeKamaradeHealthMax(actor, actor.system);

    assert.equal(withoutSign, 5);
    assert.equal(withSign, 6);
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

    actor.items.push(createMnogySigne());
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.health.max, 6);
    assert.equal(actor.system.health.value, 5);
    assert.equal(actor.system.health.offset, -1);

    actor.items = [];
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 4);
    assert.equal(actor.system.health.offset, -1);
  });

  test("adds +2 to fear resistance", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "faucille" },
        traits: {
          marteau: {
            prisonnierPolitique: { points: 3, manualBonus: 0, total: 0 }
          }
        }
      }
    });

    assert.deepEqual(computeKamaradeFearResistance(actor, actor.system), {
      trait: "prisonnierPolitique",
      base: 3,
      bonus: 0,
      value: 3
    });

    actor.items.push(createMnogySigne());
    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.fearResistance.trait, "prisonnierPolitique");
    assert.equal(actor.system.fearResistance.base, 3);
    assert.equal(actor.system.fearResistance.bonus, 2);
    assert.equal(actor.system.fearResistance.value, 5);
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

function createMnogySigne() {
  return {
    id: "sgrmnogyAAAAAAAA",
    type: "signe",
    name: SIGN.name,
    system: {
      category: "racial"
    }
  };
}
