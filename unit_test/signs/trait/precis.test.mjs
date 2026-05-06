import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import {
  computeKamaradeDamageBonus,
  computeKamaradeDamageValue,
  prepareKamaradeDerivedData
} from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "precis");

describe("Kamarade Sign - Precis (precis)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "trait");
  });

  test("adds +1 damage bonus to AK47 only", () => {
    const actor = createActor({
      items: [createPrecisSigne()]
    });

    assert.equal(computeKamaradeDamageBonus(actor, "ak47"), 1);
    assert.equal(computeKamaradeDamageBonus(actor, "lutte"), 0);
  });

  test("applies the AK47 damage bonus on derived damage", () => {
    const actor = createActor({
      system: {
        traits: {
          marteau: {
            ak47: { points: 5, manualBonus: 0, total: 0 },
            lutte: { points: 5, manualBonus: 0, total: 0 }
          }
        },
        damage: {
          ak47: { value: 0, bonus: 0 },
          lutte: { value: 0, bonus: 0 }
        }
      },
      items: [createPrecisSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.traits.marteau.ak47.total, 5);
    assert.equal(actor.system.traits.marteau.lutte.total, 5);
    assert.equal(actor.system.damage.ak47.value, 4);
    assert.equal(actor.system.damage.lutte.value, 3);
  });

  test("stacks sign damage with manual AK47 damage bonus", () => {
    const actor = createActor({
      system: {
        traits: {
          marteau: {
            ak47: { points: 5, manualBonus: 0, total: 5 }
          }
        },
        damage: {
          ak47: { value: 0, bonus: 2 }
        }
      },
      items: [createPrecisSigne()]
    });

    assert.equal(computeKamaradeDamageValue(actor, actor.system, "ak47"), 6);
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

function createPrecisSigne() {
  return {
    id: "sgtprecisAAAAAAA",
    type: "signe",
    name: SIGN.name,
    system: {
      category: "trait",
      traitLink: "marteau.ak47"
    }
  };
}
