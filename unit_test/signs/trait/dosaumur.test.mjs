import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import {
  computeKamaradeDamageBonus,
  computeKamaradeDamageValue,
  computeKamaradeTraitTotal,
  isKamaradeDosAuMurActive,
  prepareKamaradeDerivedData
} from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "dosaumur");
const BOUCHER_SIGN = catalog.find(entry => entry.slug === "boucher");
const PETIT_SIGN = catalog.find(entry => entry.slug === "petit");
const PRECIS_SIGN = catalog.find(entry => entry.slug === "precis");

describe("Kamarade Sign - Dos au mur (dosaumur)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "trait");
  });

  test("does not apply above 1 current HP", () => {
    const actor = createActor({
      system: {
        health: { value: 2, max: 5, offset: -3, bonus: 0 },
        traits: {
          marteau: {
            karkass: { points: 0, manualBonus: 0, total: 0 },
            lutte: { points: 5, manualBonus: 0, total: 0 },
            ak47: { points: 5, manualBonus: 0, total: 0 }
          }
        }
      },
      items: [createDosAuMurSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(isKamaradeDosAuMurActive(actor), false);
    assert.equal(actor.system.traits.marteau.karkass.autoBonus, 0);
    assert.equal(actor.system.traits.marteau.lutte.autoBonus, 0);
    assert.equal(actor.system.traits.marteau.ak47.autoBonus, 0);
    assert.equal(actor.system.damage.lutte.value, 3);
    assert.equal(actor.system.damage.ak47.value, 3);
  });

  test("adds +1 to every Marteau trait at 1 current HP", () => {
    const actor = createActor({
      system: {
        health: { value: 1, max: 5, offset: -4, bonus: 0 },
        traits: {
          marteau: {
            karkass: { points: 0, manualBonus: 0, total: 0 },
            lutte: { points: 5, manualBonus: 0, total: 0 },
            ak47: { points: 5, manualBonus: 0, total: 0 }
          },
          faucille: {
            corruption: { points: 2, manualBonus: 0, total: 0 }
          }
        }
      },
      items: [createDosAuMurSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(isKamaradeDosAuMurActive(actor), true);
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 1);
    assert.equal(actor.system.traits.marteau.karkass.autoBonus, 1);
    assert.equal(actor.system.traits.marteau.karkass.total, 1);
    assert.equal(actor.system.traits.marteau.lutte.autoBonus, 1);
    assert.equal(actor.system.traits.marteau.lutte.total, 6);
    assert.equal(actor.system.traits.marteau.ak47.autoBonus, 1);
    assert.equal(actor.system.traits.marteau.ak47.total, 6);
    assert.equal(actor.system.traits.faucille.corruption.autoBonus, 1);
    assert.equal(actor.system.traits.faucille.corruption.total, 3);
  });

  test("does not feed Dos au mur KARKASS bonus into max HP", () => {
    const actor = createActor({
      system: {
        health: { value: 1, max: 5, offset: -4, bonus: 0 },
        traits: {
          marteau: {
            karkass: { points: 0, manualBonus: 0, total: 0 }
          }
        }
      },
      items: [createDosAuMurSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.traits.marteau.karkass.total, 1);
    assert.equal(computeKamaradeTraitTotal(actor, "marteau", "karkass", actor.system.traits.marteau.karkass, {}), 1);
    assert.equal(
      computeKamaradeTraitTotal(
        actor,
        "marteau",
        "karkass",
        actor.system.traits.marteau.karkass,
        { dosAuMurActive: false }
      ),
      0
    );
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 1);
  });

  test("adds +1 to LUTTE and AK47 damage at 1 current HP", () => {
    const actor = createActor({
      system: {
        health: { value: 1, max: 5, offset: -4, bonus: 0 },
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
      items: [createDosAuMurSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(computeKamaradeDamageBonus(actor, "lutte"), 1);
    assert.equal(computeKamaradeDamageBonus(actor, "ak47"), 1);
    assert.equal(actor.system.damage.lutte.value, 4);
    assert.equal(actor.system.damage.ak47.value, 4);
  });

  test("stacks with Boucher and Precis damage bonuses", () => {
    const actor = createActor({
      system: {
        health: { value: 1, max: 5, offset: -4, bonus: 0 },
        traits: {
          marteau: {
            lutte: { points: 5, manualBonus: 0, total: 5 },
            ak47: { points: 5, manualBonus: 0, total: 5 }
          }
        },
        damage: {
          lutte: { value: 0, bonus: 0 },
          ak47: { value: 0, bonus: 0 }
        }
      },
      items: [createDosAuMurSigne(), createBoucherSigne(), createPrecisSigne()]
    });

    assert.equal(computeKamaradeDamageValue(actor, actor.system, "lutte"), 5);
    assert.equal(computeKamaradeDamageValue(actor, actor.system, "ak47"), 5);
  });

  test("respects Petit LUTTE damage cap after the Dos au mur bonus", () => {
    const actor = createActor({
      system: {
        health: { value: 1, max: 5, offset: -4, bonus: 0 },
        traits: {
          marteau: {
            lutte: { points: 7, manualBonus: 0, total: 0 }
          }
        },
        damage: {
          lutte: { value: 0, bonus: 2 }
        }
      },
      items: [createDosAuMurSigne(), createPetitSigne()]
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

function createDosAuMurSigne() {
  return {
    id: "sgtdosaumurAAAAA",
    type: "signe",
    name: SIGN.name,
    system: {
      category: "trait",
      traitLink: "marteau.lutte"
    }
  };
}

function createBoucherSigne() {
  return {
    id: "sgtboucherAAAAAA",
    type: "signe",
    name: BOUCHER_SIGN.name,
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

function createPrecisSigne() {
  return {
    id: "sgtprecisAAAAAAA",
    type: "signe",
    name: PRECIS_SIGN.name,
    system: {
      category: "trait",
      traitLink: "marteau.ak47"
    }
  };
}
