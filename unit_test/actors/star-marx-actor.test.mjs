import { describe, test } from "node:test";
import assert from "node:assert/strict";

describe("StarMarxActor", () => {
  test("routes Kamarade actors to Kamarade derived data", async () => {
    installActorStub();
    const { StarMarxActor } = await import("../../module/actor/actor.mjs");

    const actor = createKamaradeActor();
    StarMarxActor.prototype.prepareDerivedData.call(actor);

    assert.equal(actor.system.health.max, 8);
    assert.equal(actor.system.health.value, 7);
    assert.equal(actor.system.traits.faucille.acrobate.total, 1);
  });

  test("routes Soyouz actors to Soyouz derived data", async () => {
    installActorStub();
    const { StarMarxActor } = await import("../../module/actor/actor.mjs");

    const actor = createSoyouzActor();
    StarMarxActor.prototype.prepareDerivedData.call(actor);

    assert.equal(actor.system.health.max, 7);
    assert.equal(actor.system.health.value, 6);
    assert.equal(actor.system.traits.murDeFer.total, 2);
  });
});

function installActorStub() {
  globalThis.Actor ??= class Actor {
    prepareDerivedData() {}
    getRollData() { return {}; }
  };
}

function createKamaradeActor() {
  return {
    type: "kamarade",
    items: [{ id: "SIGN-1", type: "signe", name: "En premiere ligne" }],
    system: {
      details: {
        doctrine: "faucille",
        xp: { traits: 0, signes: 0, clefs: 0, autres: 0, total: 0 }
      },
      traits: {
        marteau: {
          karkass: { points: 0, bonus: 0, total: 0 },
          lutte: { points: 0, bonus: 0, total: 0 },
          ak47: { points: 0, bonus: 0, total: 0 }
        },
        faucille: {
          acrobate: { points: 0, bonus: 0, total: 0 }
        },
        etoile: {
          science: { points: 0, bonus: 0, total: 0 },
          pilotage: { points: 0, bonus: 0, total: 0 },
          vigilance: { points: 0, bonus: 0, total: 0 }
        }
      },
      health: { value: 4, max: 5, offset: -1, bonus: 0 },
      damage: {
        lutte: { value: 1, bonus: 0 },
        ak47: { value: 1, bonus: 0 }
      },
      limits: { signes: 1, clefs: 5 }
    }
  };
}

function createSoyouzActor() {
  return {
    type: "soyouz",
    system: {
      traits: {
        tupolev: trait(),
        orgueDeStaline: trait(),
        parade: trait(),
        lebedev: trait(),
        datcha: trait(),
        tetris: trait(),
        murDeFer: trait({ score: 2 })
      },
      health: { value: 4, max: 5, offset: -1 },
      traitTotal: 0,
      damageFromOrgue: "1"
    }
  };
}

function trait({ score = 0, bonus = 0, avaries = 0 } = {}) {
  return { score, bonus, avaries, total: 0 };
}
