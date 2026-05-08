import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import { prepareKamaradeDerivedData } from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "memepaspeur");
const KLON_SIGN = catalog.find(entry => entry.slug === "klon");

describe("Kamarade Sign - Meme pas peur (memepaspeur)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "trait");
  });

  test("uses BRISEUR DE GREVE instead of PRISONNIER POLITIQUE for fear resistance", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "faucille" },
        traits: {
          marteau: {
            briseurDeGreve: { points: 4, manualBonus: 0, total: 0 },
            prisonnierPolitique: { points: 1, manualBonus: 0, total: 0 }
          }
        }
      },
      items: [createMemePasPeurSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.fearResistance.trait, "briseurDeGreve");
    assert.equal(actor.system.fearResistance.base, 4);
    assert.equal(actor.system.fearResistance.bonus, 0);
    assert.equal(actor.system.fearResistance.value, 4);
  });

  test("stacks racial fear bonuses on the substituted trait", () => {
    const actor = createActor({
      system: {
        details: { doctrine: "faucille" },
        traits: {
          marteau: {
            briseurDeGreve: { points: 4, manualBonus: 0, total: 0 },
            prisonnierPolitique: { points: 1, manualBonus: 0, total: 0 }
          }
        }
      },
      items: [createMemePasPeurSigne(), createKlonSigne()]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(actor.system.fearResistance.trait, "briseurDeGreve");
    assert.equal(actor.system.fearResistance.base, 4);
    assert.equal(actor.system.fearResistance.bonus, 2);
    assert.equal(actor.system.fearResistance.value, 6);
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

function createMemePasPeurSigne() {
  return {
    id: "sgtmemepaspeurAA",
    type: "signe",
    name: SIGN.name,
    system: {
      category: "trait",
      traitLink: "marteau.briseurDeGreve"
    }
  };
}

function createKlonSigne() {
  return {
    id: "sgrklonAAAAAAAA",
    type: "signe",
    name: KLON_SIGN.name,
    system: {
      category: "racial"
    }
  };
}
