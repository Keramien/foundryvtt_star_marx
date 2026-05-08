import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import {
  computeKamaradeTraitTotal,
  prepareKamaradeDerivedData
} from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "monprecieux");

describe("Kamarade Sign - Mon precieux ! (monprecieux)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "general");
  });

  test("adds +1 automatic bonus to the targeted Trait", () => {
    const actor = createActor({
      items: [createMonPrecieuxSigne({ targetTrait: "faucille.corruption" })],
      system: {
        details: { doctrine: "marteau" },
        traits: {
          faucille: {
            corruption: { points: 2, manualBonus: 0, total: 0 },
            grouillot: { points: 2, manualBonus: 0, total: 0 }
          }
        }
      }
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.traits.faucille.corruption.autoBonus, 1);
    assert.equal(actor.system.traits.faucille.corruption.total, 3);
    assert.equal(actor.system.traits.faucille.grouillot.autoBonus, 0);
    assert.equal(actor.system.traits.faucille.grouillot.total, 2);
  });

  test("does not apply when no target Trait is selected", () => {
    const actor = createActor({
      items: [createMonPrecieuxSigne()],
      system: {
        details: { doctrine: "marteau" },
        traits: {
          etoile: {
            pionnier: { points: 3, manualBonus: 0, total: 0 }
          }
        }
      }
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.traits.etoile.pionnier.autoBonus, 0);
    assert.equal(actor.system.traits.etoile.pionnier.total, 3);
  });

  test("applies only once even if several precious items target the same Trait", () => {
    const actor = createActor({
      items: [
        createMonPrecieuxSigne({ id: "MON-PRECIEUX-1", targetTrait: "etoile.pionnier" }),
        createMonPrecieuxSigne({ id: "MON-PRECIEUX-2", targetTrait: "etoile.pionnier" })
      ],
      system: {
        details: { doctrine: "marteau" },
        traits: {
          etoile: {
            pionnier: { points: 1, manualBonus: 0, total: 0 }
          }
        }
      }
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(computeKamaradeTraitTotal(actor, "etoile", "pionnier", actor.system.traits.etoile.pionnier), 2);
    assert.equal(actor.system.traits.etoile.pionnier.autoBonus, 1);
  });

  test("uses only one precious item when several target different Traits", () => {
    const actor = createActor({
      items: [
        createMonPrecieuxSigne({ id: "MON-PRECIEUX-1", targetTrait: "etoile.pionnier" }),
        createMonPrecieuxSigne({ id: "MON-PRECIEUX-2", targetTrait: "faucille.corruption" })
      ],
      system: {
        details: { doctrine: "marteau" },
        traits: {
          etoile: {
            pionnier: { points: 1, manualBonus: 0, total: 0 }
          },
          faucille: {
            corruption: { points: 1, manualBonus: 0, total: 0 }
          }
        }
      }
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.traits.etoile.pionnier.autoBonus, 1);
    assert.equal(actor.system.traits.etoile.pionnier.total, 2);
    assert.equal(actor.system.traits.faucille.corruption.autoBonus, 0);
    assert.equal(actor.system.traits.faucille.corruption.total, 1);
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

function createMonPrecieuxSigne({ id = "sgnmonprecieuxAA", targetTrait = "" } = {}) {
  return {
    id,
    type: "signe",
    name: SIGN.name,
    system: {
      category: "general",
      targetTrait
    }
  };
}
