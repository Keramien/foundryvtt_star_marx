import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import {
  computeKamaradeKontrebandeMax,
  prepareKamaradeDerivedData
} from "../../../module/actor/kamarade.mjs";

const SIGN = catalog.find(entry => entry.slug === "gryazny");

describe("Kamarade Sign - Gryazny (gryazny)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "racial");
  });

  test("adds +2 to max Kontrebandes when the racial sign is present", () => {
    const actor = createActor();

    const withoutSign = computeKamaradeKontrebandeMax(actor);
    actor.items.push(createGryaznySigne());
    const withSign = computeKamaradeKontrebandeMax(actor);
    actor.items = [];
    const afterRemoval = computeKamaradeKontrebandeMax(actor);

    assert.equal(withoutSign, 5);
    assert.equal(withSign, 7);
    assert.equal(afterRemoval, 5);
  });

  test("stacks with a custom base Kontrebande limit", () => {
    const actor = createActor({
      system: {
        limits: { kontrebande: 6 }
      },
      items: [createGryaznySigne()]
    });

    assert.equal(computeKamaradeKontrebandeMax(actor), 8);
  });

  test("prepareDerivedData adds and removes the bonus with the sign", () => {
    const actor = createActor();

    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.kontrebandeMax, 5);

    actor.items.push(createGryaznySigne());
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.kontrebandeMax, 7);

    actor.items = [];
    prepareKamaradeDerivedData(actor);
    assert.equal(actor.system.kontrebandeMax, 5);
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

function createGryaznySigne() {
  return {
    id: "sgrgryaznyAAAAAA",
    type: "signe",
    name: SIGN.name,
    system: {
      category: "racial"
    }
  };
}
