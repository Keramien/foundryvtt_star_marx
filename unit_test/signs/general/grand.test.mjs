import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import {
  computeKamaradeHealthMax,
  prepareKamaradeDerivedData
} from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "grand");
const PETIT_SIGN = catalog.find(entry => entry.slug === "petit");

describe("Kamarade Sign - Grand (grand)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "general");
  });

  test("adds +2 to max HP when the sign is present", () => {
    const actor = createActor();

    const withoutSign = computeKamaradeHealthMax(actor, actor.system);
    actor.items.push(createGrandSigne());
    const withSign = computeKamaradeHealthMax(actor, actor.system);
    actor.items = [];
    const afterRemoval = computeKamaradeHealthMax(actor, actor.system);

    assert.equal(withoutSign, 5);
    assert.equal(withSign, 7);
    assert.equal(afterRemoval, 5);
  });

  test("health offset preserves wound count when Grand changes max HP", () => {
    const actor = createActor({
      system: {
        health: { value: 4, max: 5, offset: -1, bonus: 0 }
      }
    });

    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 4);

    actor.items.push(createGrandSigne());
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.health.max, 7);
    assert.equal(actor.system.health.value, 6);

    actor.items = [];
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 4);
  });

  test("adds +2 automatic bonus to BRISEUR DE GREVE", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "faucille" },
        traits: {
          marteau: {
            briseurDeGreve: { points: 1, manualBonus: 1, total: 0 }
          }
        }
      },
      items: [createGrandSigne()]
    });

    prepareKamaradeDerivedData(actor);

    const briseurDeGreve = actor.system.traits.marteau.briseurDeGreve;
    assert.equal(briseurDeGreve.base, 1);
    assert.equal(briseurDeGreve.autoBonus, 2);
    assert.equal(briseurDeGreve.manualBonus, 1);
    assert.equal(briseurDeGreve.total, 4);
  });

  test("keeps SOCIAL TRAITRE stealth penalty as a manual bonus", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "marteau" },
        traits: {
          faucille: {
            socialTraitre: { points: 3, manualBonus: -2, total: 0 }
          }
        }
      },
      items: [createGrandSigne()]
    });

    prepareKamaradeDerivedData(actor);

    const socialTraitre = actor.system.traits.faucille.socialTraitre;
    assert.equal(socialTraitre.base, 3);
    assert.equal(socialTraitre.autoBonus, 0);
    assert.equal(socialTraitre.manualBonus, -2);
    assert.equal(socialTraitre.total, 1);
  });

  test("adds +1 to LUTTE damage", () => {
    const actor = createActor({
      system: {
        traits: {
          marteau: {
            lutte: { points: 5, manualBonus: 0, total: 0 }
          }
        },
        damage: {
          lutte: { value: 0, bonus: 0 }
        }
      },
      items: [createGrandSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.traits.marteau.lutte.total, 5);
    assert.equal(actor.system.damage.lutte.value, 4);
  });

  test("cancels all Grand effects when Petit is also present", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "etoile" },
        traits: {
          marteau: {
            briseurDeGreve: { points: 1, manualBonus: 0, total: 0 },
            lutte: { points: 5, manualBonus: 0, total: 0 }
          }
        },
        damage: {
          lutte: { value: 0, bonus: 0 }
        }
      },
      items: [createGrandSigne(), createPetitSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.traits.marteau.briseurDeGreve.autoBonus, 0);
    assert.equal(actor.system.traits.marteau.briseurDeGreve.total, 1);
    assert.equal(actor.system.damage.lutte.value, 3);
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

function createGrandSigne() {
  return {
    id: "sgngrandAAAAAAAA",
    type: "signe",
    name: SIGN.name,
    system: {
      category: "general"
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
