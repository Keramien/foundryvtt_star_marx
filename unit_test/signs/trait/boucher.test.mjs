import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import {
  computeKamaradeDamageBonus,
  computeKamaradeDamageValue,
  prepareKamaradeDerivedData
} from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "boucher");
const PETIT_SIGN = catalog.find(entry => entry.slug === "petit");

describe("Kamarade Sign - Boucher (boucher)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "trait");
  });

  test("adds +1 damage bonus to LUTTE only", () => {
    const actor = createActor({
      items: [createBoucherSigne()]
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
      items: [createBoucherSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.traits.marteau.lutte.total, 5);
    assert.equal(actor.system.traits.marteau.ak47.total, 5);
    assert.equal(actor.system.damage.lutte.value, 4);
    assert.equal(actor.system.damage.ak47.value, 3);
  });

  test("stacks sign damage with manual LUTTE damage bonus", () => {
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
      items: [createBoucherSigne()]
    });

    assert.equal(computeKamaradeDamageValue(actor, actor.system, "lutte"), 6);
  });

  test("respects Petit LUTTE damage cap after the Boucher bonus", () => {
    const actor = createActor({
      system: {
        traits: {
          marteau: {
            lutte: { points: 7, manualBonus: 0, total: 0 }
          }
        },
        damage: {
          lutte: { value: 0, bonus: 2 }
        }
      },
      items: [createBoucherSigne(), createPetitSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.damage.lutte.value, 2);
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

function createBoucherSigne() {
  return {
    id: "sgtboucherAAAAAA",
    type: "signe",
    name: SIGN.name,
    system: {
      category: "trait",
      traitLink: "marteau.lutte"
    }
  };
}

function createPetitSigne() {
  return {
    id: "sgnpetitAAAAAAAA",
    type: "signe",
    name: PETIT_SIGN.name,
    system: {
      category: "general"
    }
  };
}
