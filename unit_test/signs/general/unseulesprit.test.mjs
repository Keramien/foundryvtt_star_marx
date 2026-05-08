import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import {
  computeKamaradeUnSeulEspritTraitBonus,
  prepareKamaradeDerivedData
} from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "unseulesprit");

describe("Kamarade Sign - Un seul esprit pour toute une equipe ! (unseulesprit)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "general");
  });

  test("adds +1 to the three team Traits when the Kamarade is in a group", () => {
    const actor = createActor({
      items: [createUnSeulEspritSigne({ teamMode: "group" })]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(computeKamaradeUnSeulEspritTraitBonus(actor), 1);
    assert.equal(actor.system.traits.marteau.lutte.autoBonus, 1);
    assert.equal(actor.system.traits.marteau.prisonnierPolitique.autoBonus, 1);
    assert.equal(actor.system.traits.marteau.briseurDeGreve.autoBonus, 1);
    assert.equal(actor.system.traits.marteau.ak47.autoBonus, 0);
  });

  test("applies -1 to the three team Traits when the Kamarade is alone", () => {
    const actor = createActor({
      items: [createUnSeulEspritSigne({ teamMode: "alone" })]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(computeKamaradeUnSeulEspritTraitBonus(actor), -1);
    assert.equal(actor.system.traits.marteau.lutte.total, 1);
    assert.equal(actor.system.traits.marteau.prisonnierPolitique.total, 1);
    assert.equal(actor.system.traits.marteau.briseurDeGreve.total, 1);
    assert.equal(actor.system.traits.marteau.ak47.total, 2);
  });

  test("defaults legacy sign instances to the group mode", () => {
    const actor = createActor({
      items: [createUnSeulEspritSigne({ teamMode: undefined })]
    });

    prepareKamaradeDerivedData(actor);

    assert.equal(computeKamaradeUnSeulEspritTraitBonus(actor), 1);
    assert.equal(actor.system.traits.marteau.lutte.total, 3);
  });
});

function createActor(overrides = {}) {
  const actor = createKamaradeFixture({
    type: "kamarade",
    system: {
      details: { doctrine: "faucille" },
      traits: {
        marteau: {
          lutte: { points: 2, manualBonus: 0, total: 0 },
          prisonnierPolitique: { points: 2, manualBonus: 0, total: 0 },
          briseurDeGreve: { points: 2, manualBonus: 0, total: 0 },
          ak47: { points: 2, manualBonus: 0, total: 0 }
        }
      }
    },
    ...overrides
  });
  actor.system.health.offset ??= 0;
  return actor;
}

function createUnSeulEspritSigne({ teamMode = "group" } = {}) {
  const system = {
    category: "general"
  };
  if (teamMode !== undefined) system.teamMode = teamMode;

  return {
    id: "sgnunseulespritA",
    type: "signe",
    name: SIGN.name,
    system
  };
}
