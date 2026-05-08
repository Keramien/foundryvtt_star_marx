import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import {
  computeKamaradeTraitCost,
  computeKamaradeTraitPoints,
  prepareKamaradeDerivedData
} from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "derogation");

describe("Kamarade Sign - Derogation (derogation)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "general");
  });

  test("keeps the normal outside-doctrine cost without a targeted Derogation", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "marteau" },
        traits: {
          faucille: {
            corruption: { points: 3, manualBonus: 0, total: 0 }
          }
        }
      }
    });

    assert.equal(computeKamaradeTraitCost(actor, "faucille", "corruption"), 2);
    assert.equal(computeKamaradeTraitPoints(actor).spent, 6);
  });

  test("reduces the selected outside-doctrine Trait cost to doctrine cost", () => {
    const actor = createActor({
      items: [createDerogationSigne({ targetTrait: "faucille.corruption" })],
      system: {
        details: { doctrine: "marteau" },
        traits: {
          faucille: {
            corruption: { points: 3, manualBonus: 0, total: 0 }
          }
        }
      }
    });

    assert.equal(computeKamaradeTraitCost(actor, "faucille", "corruption"), 1);
    assert.equal(computeKamaradeTraitPoints(actor).spent, 3);
  });

  test("does not reduce other outside-doctrine Traits", () => {
    const actor = createActor({
      items: [createDerogationSigne({ targetTrait: "faucille.corruption" })],
      system: {
        details: { doctrine: "marteau" },
        traits: {
          faucille: {
            corruption: { points: 3, manualBonus: 0, total: 0 },
            grouillot: { points: 2, manualBonus: 0, total: 0 }
          }
        }
      }
    });

    const traitPoints = computeKamaradeTraitPoints(actor);

    assert.equal(computeKamaradeTraitCost(actor, "faucille", "corruption"), 1);
    assert.equal(computeKamaradeTraitCost(actor, "faucille", "grouillot"), 2);
    assert.equal(traitPoints.spent, 7);
  });

  test("prepareDerivedData exposes the reduced spent points", () => {
    const actor = createActor({
      items: [createDerogationSigne({ targetTrait: "etoile.pionnier" })],
      system: {
        details: { doctrine: "marteau" },
        traits: {
          etoile: {
            pionnier: { points: 4, manualBonus: 0, total: 0 }
          }
        }
      }
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.traitPoints.spent, 4);
    assert.equal(actor.system.traitPoints.available, 16);
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

function createDerogationSigne({ targetTrait = "" } = {}) {
  return {
    id: "sgnderogationAAA",
    type: "signe",
    name: SIGN.name,
    system: {
      category: "general",
      targetTrait
    }
  };
}
