import { describe, test } from "node:test";
import assert from "node:assert/strict";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import {
  computeKamaradeHealthMax,
  prepareKamaradeDerivedData
} from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "enpremiereligne");

describe("Kamarade Sign - En premiere ligne (enpremiereligne)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "trait");
  });

  test("computeKamaradeHealthMax includes +3 when the sign is present", () => {
    const actor = createRuntimeActor({
      system: makeSystem({ value: 5, max: 5, offset: 0 }),
      items: []
    });

    const withoutSign = computeKamaradeHealthMax(actor, actor.system);
    actor.items.push({ type: "signe", name: "En premiere ligne" });
    const withSign = computeKamaradeHealthMax(actor, actor.system);
    actor.items.pop();
    const afterRemoval = computeKamaradeHealthMax(actor, actor.system);

    assert.equal(withoutSign, 5);
    assert.equal(withSign, 8);
    assert.equal(afterRemoval, 5);
  });

  test("health offset preserves wound count when the sign changes max HP", () => {
    const actor = createRuntimeActor({
      system: makeSystem({ value: 4, max: 5, offset: -1 }),
      items: []
    });

    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 4);
    assert.equal(actor.system.health.offset, -1);

    actor.items.push({ id: "SIGN-1", type: "signe", name: "En premiere ligne" });
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.health.max, 8);
    assert.equal(actor.system.health.value, 7);
    assert.equal(actor.system.health.offset, -1);

    actor.items = [];
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 4);
    assert.equal(actor.system.health.offset, -1);
  });

  test("health offset preserves wound count when KARKASS changes max HP", () => {
    const actor = createRuntimeActor({
      system: makeSystem({ value: 4, max: 5, offset: -1 }),
      items: []
    });

    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 4);
    assert.equal(actor.system.health.offset, -1);

    actor.system.traits.marteau.karkass.points = 1;
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.health.max, 6);
    assert.equal(actor.system.health.value, 5);
    assert.equal(actor.system.health.offset, -1);

    actor.system.traits.marteau.karkass.points = 0;
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 4);
    assert.equal(actor.system.health.offset, -1);
  });
});

function makeSystem({ value, max, offset }) {
  return {
    details: {
      doctrine: "faucille",
      xp: { traits: 0, signes: 0, clefs: 0, autres: 0, total: 0 }
    },
    traits: {
      marteau: {
        karkass: { points: 0, bonus: 0, total: 0 },
        lutte: { points: 0, bonus: 0, total: 0 },
        ak47: { points: 0, bonus: 0, total: 0 }
      },
      faucille: {
        baratin: { points: 0, bonus: 0, total: 0 },
        discretion: { points: 0, bonus: 0, total: 0 },
        bidouille: { points: 0, bonus: 0, total: 0 }
      },
      etoile: {
        science: { points: 0, bonus: 0, total: 0 },
        pilotage: { points: 0, bonus: 0, total: 0 },
        vigilance: { points: 0, bonus: 0, total: 0 }
      }
    },
    health: { value, max, offset, bonus: 0 },
    damage: {
      lutte: { value: 1, bonus: 0 },
      ak47: { value: 1, bonus: 0 }
    },
    limits: { signes: 1, clefs: 5 }
  };
}

function createRuntimeActor({ system, items }) {
  return {
    type: "kamarade",
    system,
    items,
    toObject: function toObject() {
      return { system: structuredClone(this.system) };
    }
  };
}
