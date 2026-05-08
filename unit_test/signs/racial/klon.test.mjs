import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import { prepareKamaradeDerivedData } from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "klon");

describe("Kamarade Sign - Klon (klon)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "racial");
  });

  test("adds +2 to fear resistance", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "faucille" },
        traits: {
          marteau: {
            prisonnierPolitique: { points: 2, manualBonus: 1, total: 0 }
          }
        }
      },
      items: [createKlonSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.fearResistance.trait, "prisonnierPolitique");
    assert.equal(actor.system.fearResistance.base, 3);
    assert.equal(actor.system.fearResistance.bonus, 2);
    assert.equal(actor.system.fearResistance.value, 5);
  });

  test("does not change fear resistance without the sign", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "faucille" },
        traits: {
          marteau: {
            prisonnierPolitique: { points: 2, manualBonus: 1, total: 0 }
          }
        }
      }
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.fearResistance.trait, "prisonnierPolitique");
    assert.equal(actor.system.fearResistance.base, 3);
    assert.equal(actor.system.fearResistance.bonus, 0);
    assert.equal(actor.system.fearResistance.value, 3);
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

function createKlonSigne() {
  return {
    id: "sgrklonAAAAAAAA",
    type: "signe",
    name: SIGN.name,
    system: {
      category: "racial"
    }
  };
}
