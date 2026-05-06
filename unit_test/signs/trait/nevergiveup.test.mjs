import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import {
  computeKamaradeHealthMax,
  computeKamaradeHealthTraitTotal,
  getKamaradeHealthTraitId,
  prepareKamaradeDerivedData
} from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "nevergiveup");
const DOS_AU_MUR_SIGN = catalog.find(entry => entry.slug === "dosaumur");
const EN_PREMIERE_LIGNE_SIGN = catalog.find(entry => entry.slug === "enpremiereligne");
const KROLIK_SIGN = catalog.find(entry => entry.slug === "krolik");

describe("Kamarade Sign - Never Give Up ! (nevergiveup)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "trait");
  });

  test("uses PRISONNIER POLITIQUE instead of KARKASS for max HP", () => {
    const actor = createActor({
      system: {
        traits: {
          marteau: {
            karkass: { points: 4, manualBonus: 0, total: 0 },
            prisonnierPolitique: { points: 1, manualBonus: 0, total: 0 }
          }
        }
      }
    });

    assert.equal(getKamaradeHealthTraitId(actor), "karkass");
    assert.equal(computeKamaradeHealthMax(actor, actor.system), 9);

    actor.items.push(createNeverGiveUpSigne());

    assert.equal(getKamaradeHealthTraitId(actor), "prisonnierPolitique");
    assert.equal(computeKamaradeHealthTraitTotal(actor, actor.system), 1);
    assert.equal(computeKamaradeHealthMax(actor, actor.system), 6);
  });

  test("keeps doctrine and manual bonuses on PRISONNIER POLITIQUE", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "marteau" },
        traits: {
          marteau: {
            karkass: { points: 0, manualBonus: 0, total: 0 },
            prisonnierPolitique: { points: 3, manualBonus: 1, total: 0 }
          }
        }
      },
      items: [createNeverGiveUpSigne()]
    });

    prepareKamaradeDerivedData(actor);

    const prisonnierPolitique = actor.system.traits.marteau.prisonnierPolitique;
    assert.equal(prisonnierPolitique.base, 3);
    assert.equal(prisonnierPolitique.autoBonus, 1);
    assert.equal(prisonnierPolitique.manualBonus, 1);
    assert.equal(prisonnierPolitique.total, 5);
    assert.equal(actor.system.health.max, 10);
  });

  test("keeps normal HP bonuses around the PRISONNIER POLITIQUE base", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "marteau" },
        traits: {
          marteau: {
            karkass: { points: 0, manualBonus: 0, total: 0 },
            prisonnierPolitique: { points: 3, manualBonus: 1, total: 0 }
          }
        },
        health: { value: 5, max: 5, offset: 0, bonus: 2 }
      },
      items: [createNeverGiveUpSigne(), createKrolikSigne(), createEnPremiereLigneSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.health.max, 17);
    assert.equal(actor.system.health.value, 17);
  });

  test("health offset preserves wound count when Never Give Up changes max HP", () => {
    const actor = createActor({
      system: {
        health: { value: 4, max: 5, offset: -1, bonus: 0 },
        traits: {
          marteau: {
            karkass: { points: 0, manualBonus: 0, total: 0 },
            prisonnierPolitique: { points: 3, manualBonus: 0, total: 0 }
          }
        }
      }
    });

    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 4);

    actor.items.push(createNeverGiveUpSigne());
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.health.max, 8);
    assert.equal(actor.system.health.value, 7);

    actor.items = [];
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 4);
  });

  test("does not feed Dos au mur PRISONNIER POLITIQUE bonus into max HP", () => {
    const actor = createActor({
      system: {
        health: { value: 1, max: 5, offset: -4, bonus: 0 },
        traits: {
          marteau: {
            karkass: { points: 0, manualBonus: 0, total: 0 },
            prisonnierPolitique: { points: 0, manualBonus: 0, total: 0 }
          }
        }
      },
      items: [createNeverGiveUpSigne(), createDosAuMurSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.traits.marteau.prisonnierPolitique.total, 1);
    assert.equal(computeKamaradeHealthTraitTotal(actor, actor.system), 0);
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 1);
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

function createNeverGiveUpSigne() {
  return {
    id: "sgtnevergiveupAA",
    type: "signe",
    name: SIGN.name,
    system: {
      category: "trait",
      traitLink: "marteau.prisonnierPolitique"
    }
  };
}

function createDosAuMurSigne() {
  return {
    id: "sgtdosaumurAAAAA",
    type: "signe",
    name: DOS_AU_MUR_SIGN.name,
    system: {
      category: "trait",
      traitLink: "marteau.lutte"
    }
  };
}

function createEnPremiereLigneSigne() {
  return {
    id: "SIGN-1",
    type: "signe",
    name: EN_PREMIERE_LIGNE_SIGN.name,
    system: {
      category: "trait",
      traitLink: "marteau.karkass"
    }
  };
}

function createKrolikSigne() {
  return {
    id: "sgrkrolikAAAAAAA",
    type: "signe",
    name: KROLIK_SIGN.name,
    system: {
      category: "racial"
    }
  };
}
