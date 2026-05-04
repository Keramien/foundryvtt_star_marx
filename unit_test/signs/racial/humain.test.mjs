import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import {
  computeKamaradeSignesMax,
  computeKamaradeTraitPoints,
  prepareKamaradeDerivedData
} from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "humain");

describe("Kamarade Sign - Humain (humain)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "racial");
  });

  test("adds +2 to max trait points when the racial sign is present", () => {
    const actor = createActor({
      items: [createHumainSigne()]
    });

    const traitPoints = computeKamaradeTraitPoints(actor);

    assert.equal(traitPoints.max, 22);
    assert.equal(traitPoints.spent, 0);
    assert.equal(traitPoints.available, 22);
  });

  test("stacks with trait XP", () => {
    const actor = createActor({
      items: [createHumainSigne()],
      system: {
        details: {
          xp: { traits: 3, signes: 0, clefs: 0, autres: 0, total: 0 }
        }
      }
    });

    const traitPoints = computeKamaradeTraitPoints(actor);

    assert.equal(traitPoints.max, 25);
    assert.equal(traitPoints.available, 25);
  });

  test("adds +1 to max chosen signs when the racial sign is present", () => {
    const actor = createActor({
      items: [createHumainSigne()]
    });

    assert.equal(computeKamaradeSignesMax(actor), 2);
  });

  test("max chosen signs stacks with sign XP", () => {
    const actor = createActor({
      items: [createHumainSigne()],
      system: {
        details: {
          xp: { traits: 0, signes: 2, clefs: 0, autres: 0, total: 0 }
        }
      }
    });

    assert.equal(computeKamaradeSignesMax(actor), 3);
  });

  test("prepareDerivedData adds and removes the bonus with the sign", () => {
    const actor = createActor();

    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.traitPoints.max, 20);
    assert.equal(actor.system.traitPoints.available, 20);
    assert.equal(actor.system.signesMax, 1);

    actor.items.push(createHumainSigne());
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.traitPoints.max, 22);
    assert.equal(actor.system.traitPoints.available, 22);
    assert.equal(actor.system.signesMax, 2);

    actor.items = [];
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.traitPoints.max, 20);
    assert.equal(actor.system.traitPoints.available, 20);
    assert.equal(actor.system.signesMax, 1);
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

function createHumainSigne() {
  return {
    id: "sgrhumainAAAAAAA",
    type: "signe",
    name: SIGN.name,
    system: {
      category: "racial"
    }
  };
}
