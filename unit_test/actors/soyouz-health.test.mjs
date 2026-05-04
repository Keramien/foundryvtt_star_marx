import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { prepareSoyouzDerivedData } from "../../module/actor/soyouz.mjs";

describe("Soyouz health offset", () => {
  test("health offset preserves wound count when MUR DE FER changes max HP", () => {
    const actor = createSoyouzActor({
      system: makeSystem({ value: 4, max: 5, offset: -1, murDeFerScore: 0 })
    });

    prepareSoyouzDerivedData(actor);
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 4);
    assert.equal(actor.system.health.offset, -1);

    actor.system.traits.murDeFer.score = 2;
    prepareSoyouzDerivedData(actor);
    assert.equal(actor.system.health.max, 7);
    assert.equal(actor.system.health.value, 6);
    assert.equal(actor.system.health.offset, -1);

    actor.system.traits.murDeFer.score = 0;
    prepareSoyouzDerivedData(actor);
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 4);
    assert.equal(actor.system.health.offset, -1);
  });

  test("missing offset is initialized from current and max HP", () => {
    const actor = createSoyouzActor({
      system: makeSystem({ value: 3, max: 5, murDeFerScore: 0 })
    });

    prepareSoyouzDerivedData(actor);

    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 3);
    assert.equal(actor.system.health.offset, -2);
  });
});

function createSoyouzActor({ system }) {
  return {
    type: "soyouz",
    system
  };
}

function makeSystem({ value, max, offset, murDeFerScore }) {
  return {
    traits: {
      tupolev: trait(),
      orgueDeStaline: trait(),
      parade: trait(),
      lebedev: trait(),
      datcha: trait(),
      tetris: trait(),
      murDeFer: trait({ score: murDeFerScore })
    },
    health: { value, max, ...(offset !== undefined ? { offset } : {}) },
    traitTotal: 0,
    damageFromOrgue: "1"
  };
}

function trait({ score = 0, bonus = 0, avaries = 0 } = {}) {
  return { score, bonus, avaries, total: 0 };
}
