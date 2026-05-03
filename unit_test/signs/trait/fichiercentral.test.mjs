import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import { createSigneFixture } from "../../fixtures/signe.factory.mjs";
import { applySigneEffect } from "../../helpers/apply-signe.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };

const SIGN = catalog.find(entry => entry.slug === "fichiercentral");

describe("Kamarade Sign - Fichier central (fichiercentral)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "trait");
  });

  test.skip("applies the sign effect in nominal conditions", () => {
    const kamarade = createKamaradeFixture();
    const signe = createSigneFixture(SIGN);
    const result = applySigneEffect({ kamarade, signe });
    assert.equal(result.metadata.applied, true);
  });

  test.skip("does not apply outside of required conditions", () => {
    const kamarade = createKamaradeFixture({ system: { details: { doctrine: "marteau" } } });
    const signe = createSigneFixture(SIGN);
    const result = applySigneEffect({ kamarade, signe });
    assert.equal(result.metadata.applied, false);
  });
});