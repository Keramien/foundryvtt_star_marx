import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import { prepareKamaradeDerivedData } from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "bicyclope");

describe("Kamarade Sign - Bicyclope (bicyclope)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "racial");
  });

  test("adds +2 automatic bonus to MEDAILLE OLYMPIQUE on favorable terrain", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "faucille" },
        traits: {
          marteau: {
            medailleOlympique: { points: 1, manualBonus: 1, total: 0 }
          }
        }
      },
      items: [createBicyclopeSigne()]
    });

    prepareKamaradeDerivedData(actor);

    const medailleOlympique = actor.system.traits.marteau.medailleOlympique;
    assert.equal(medailleOlympique.base, 1);
    assert.equal(medailleOlympique.autoBonus, 2);
    assert.equal(medailleOlympique.manualBonus, 1);
    assert.equal(medailleOlympique.optionalMax, null);
    assert.equal(medailleOlympique.total, 4);
  });

  test("stacks the racial sign bonus with the Marteau doctrine bonus", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "marteau" },
        traits: {
          marteau: {
            medailleOlympique: { points: 1, manualBonus: 0, total: 0 }
          }
        }
      },
      items: [createBicyclopeSigne()]
    });

    prepareKamaradeDerivedData(actor);

    const medailleOlympique = actor.system.traits.marteau.medailleOlympique;
    assert.equal(medailleOlympique.base, 1);
    assert.equal(medailleOlympique.autoBonus, 3);
    assert.equal(medailleOlympique.total, 4);
  });

  test("removes the automatic bonus when the sign is removed", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "faucille" },
        traits: {
          marteau: {
            medailleOlympique: { points: 1, manualBonus: 1, total: 0 }
          }
        }
      },
      items: [createBicyclopeSigne()]
    });

    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.traits.marteau.medailleOlympique.autoBonus, 2);
    assert.equal(actor.system.traits.marteau.medailleOlympique.total, 4);

    actor.items = [];
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.traits.marteau.medailleOlympique.autoBonus, 0);
    assert.equal(actor.system.traits.marteau.medailleOlympique.total, 2);
  });

  test("does not apply the racial sign bonus to other Marteau traits", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "faucille" },
        traits: {
          marteau: {
            lutte: { points: 1, manualBonus: 0, total: 0 }
          }
        }
      },
      items: [createBicyclopeSigne()]
    });

    prepareKamaradeDerivedData(actor);

    const lutte = actor.system.traits.marteau.lutte;
    assert.equal(lutte.autoBonus, 0);
    assert.equal(lutte.total, 1);
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

function createBicyclopeSigne() {
  return {
    id: "sgrbicyclopeAAAA",
    type: "signe",
    name: SIGN.name,
    system: {
      category: "racial"
    }
  };
}
