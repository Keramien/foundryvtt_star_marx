import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import {
  computeKamaradeZlotysValue,
  prepareKamaradeDerivedData
} from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "hjort");

describe("Kamarade Sign - Hjort (hjort)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "racial");
  });

  test("adds +2 Zlotys when the racial sign is present", () => {
    const actor = createActor();

    const withoutSign = computeKamaradeZlotysValue(actor, actor.system);
    actor.items.push(createHjortSigne());
    const withSign = computeKamaradeZlotysValue(actor, actor.system);
    actor.items = [];
    const afterRemoval = computeKamaradeZlotysValue(actor, actor.system);

    assert.equal(withoutSign, 5);
    assert.equal(withSign, 7);
    assert.equal(afterRemoval, 5);
  });

  test("zlotys offset preserves the current purse when the sign changes the base total", () => {
    const actor = createActor({
      system: {
        zlotys: { value: 3, base: 5, offset: -2 }
      }
    });

    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.zlotys.base, 5);
    assert.equal(actor.system.zlotys.value, 3);
    assert.equal(actor.system.zlotys.offset, -2);

    actor.items.push(createHjortSigne());
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.zlotys.base, 5);
    assert.equal(actor.system.zlotys.value, 5);
    assert.equal(actor.system.zlotys.offset, -2);

    actor.items = [];
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.zlotys.base, 5);
    assert.equal(actor.system.zlotys.value, 3);
    assert.equal(actor.system.zlotys.offset, -2);
  });

  test("adds +2 automatic bonus to CORRUPTION", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "etoile" },
        traits: {
          faucille: {
            corruption: { points: 1, manualBonus: 1, total: 0 }
          }
        }
      },
      items: [createHjortSigne()]
    });

    prepareKamaradeDerivedData(actor);

    const corruption = actor.system.traits.faucille.corruption;
    assert.equal(corruption.base, 1);
    assert.equal(corruption.autoBonus, 2);
    assert.equal(corruption.manualBonus, 1);
    assert.equal(corruption.optionalMax, null);
    assert.equal(corruption.total, 4);
  });

  test("keeps legacy trait bonus as manual bonus", () => {
    const actor = createActor({
      _source: {
        system: {
          traits: {
            faucille: {
              corruption: { points: 1, bonus: 2 }
            }
          }
        }
      },
      system: {
        details: { doctrine: "etoile" },
        traits: {
          faucille: {
            corruption: { points: 1, bonus: 2, manualBonus: 0, total: 0 }
          }
        }
      },
      items: [createHjortSigne()]
    });

    prepareKamaradeDerivedData(actor);

    const corruption = actor.system.traits.faucille.corruption;
    assert.equal(corruption.manualBonus, 2);
    assert.equal(corruption.bonus, 2);
    assert.equal(corruption.total, 5);
  });

  test("caps PRISONNIER POLITIQUE with an optional rule value", () => {
    const actor = createActor({
      system: {
        traits: {
          marteau: {
            prisonnierPolitique: { points: 3, manualBonus: 1, total: 0 }
          }
        }
      },
      items: [createHjortSigne()]
    });

    prepareKamaradeDerivedData(actor);

    const prisonnierPolitique = actor.system.traits.marteau.prisonnierPolitique;
    assert.equal(prisonnierPolitique.base, 3);
    assert.equal(prisonnierPolitique.autoBonus, 0);
    assert.equal(prisonnierPolitique.manualBonus, 1);
    assert.equal(prisonnierPolitique.optionalMax, 1);
    assert.equal(prisonnierPolitique.total, 1);
  });

  test("does not cap PRISONNIER POLITIQUE when the Hjort sign is absent", () => {
    const actor = createActor({
      system: {
        traits: {
          marteau: {
            prisonnierPolitique: { points: 3, manualBonus: 1, total: 0 }
          }
        }
      }
    });

    prepareKamaradeDerivedData(actor);

    const prisonnierPolitique = actor.system.traits.marteau.prisonnierPolitique;
    assert.equal(prisonnierPolitique.optionalMax, null);
    assert.equal(prisonnierPolitique.total, 4);
  });
});

function createActor(overrides = {}) {
  const actor = createKamaradeFixture({
    type: "kamarade",
    ...overrides
  });
  actor.system.health.offset ??= 0;
  actor.system.zlotys.base ??= 5;
  actor.system.zlotys.offset ??= actor.system.zlotys.value - actor.system.zlotys.base;
  return actor;
}

function createHjortSigne() {
  return {
    id: "sgrhjortAAAAAAAA",
    type: "signe",
    name: SIGN.name,
    system: {
      category: "racial"
    }
  };
}
