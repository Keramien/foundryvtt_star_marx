import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import {
  computeKamaradeDamageCap,
  prepareKamaradeDerivedData
} from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "petit");
const GRAND_SIGN = catalog.find(entry => entry.slug === "grand");

describe("Kamarade Sign - Petit (petit)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "general");
  });

  test("keeps SOCIAL TRAITRE stealth bonus as a manual bonus", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "marteau" },
        traits: {
          faucille: {
            socialTraitre: { points: 1, manualBonus: 1, total: 0 }
          }
        }
      },
      items: [createPetitSigne()]
    });

    prepareKamaradeDerivedData(actor);

    const socialTraitre = actor.system.traits.faucille.socialTraitre;
    assert.equal(socialTraitre.base, 1);
    assert.equal(socialTraitre.autoBonus, 0);
    assert.equal(socialTraitre.manualBonus, 1);
    assert.equal(socialTraitre.total, 2);
  });

  test("manual SOCIAL TRAITRE stealth bonus can be added by the player", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "marteau" },
        traits: {
          faucille: {
            socialTraitre: { points: 1, manualBonus: 2, total: 0 }
          }
        }
      },
      items: [createPetitSigne()]
    });

    prepareKamaradeDerivedData(actor);

    const socialTraitre = actor.system.traits.faucille.socialTraitre;
    assert.equal(socialTraitre.autoBonus, 0);
    assert.equal(socialTraitre.manualBonus, 2);
    assert.equal(socialTraitre.total, 3);
  });

  test("caps LUTTE damage at 2 after damage bonuses", () => {
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
      items: [createPetitSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.traits.marteau.lutte.total, 7);
    assert.equal(computeKamaradeDamageCap(actor, "lutte"), 2);
    assert.equal(actor.system.damage.lutte.value, 2);
  });

  test("does not cap AK47 damage", () => {
    const actor = createActor({
      system: {
        traits: {
          marteau: {
            ak47: { points: 7, manualBonus: 0, total: 0 }
          }
        },
        damage: {
          ak47: { value: 0, bonus: 2 }
        }
      },
      items: [createPetitSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.traits.marteau.ak47.total, 7);
    assert.equal(computeKamaradeDamageCap(actor, "ak47"), null);
    assert.equal(actor.system.damage.ak47.value, 6);
  });

  test("cancels all Petit effects when Grand is also present", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "marteau" },
        traits: {
          marteau: {
            lutte: { points: 7, manualBonus: 0, total: 0 }
          }
        },
        damage: {
          lutte: { value: 0, bonus: 2 }
        }
      },
      items: [createPetitSigne(), createGrandSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(computeKamaradeDamageCap(actor, "lutte"), null);
    assert.equal(actor.system.damage.lutte.value, 6);
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

function createPetitSigne() {
  return {
    id: "sgnpetitAAAAAAAA",
    type: "signe",
    name: SIGN.name,
    system: {
      category: "general"
    }
  };
}

function createGrandSigne() {
  return {
    id: "sgngrandAAAAAAAA",
    type: "signe",
    name: GRAND_SIGN.name,
    system: {
      category: "general"
    }
  };
}
