import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  KAMARADE_ZLOTY_ROLL_OPTIONS,
  normalizeKamaradePreRollOptions
} from "../../module/helpers/kamarade-pre-roll.mjs";

describe("Kamarade pre-roll options", () => {
  test("normalizes empty options to a classic 2d6 roll", () => {
    const options = normalizeKamaradePreRollOptions();

    assert.equal(options.baseFormula, "2d6");
    assert.equal(options.zlotyCost, 0);
    assert.equal(options.rollBonus, 0);
    assert.equal(options.damageMultiplier, 1);
    assert.equal(options.setHealthToOne, false);
  });

  test("Membre du Parti rolls three dice and keeps the best two", () => {
    const options = normalizeKamaradePreRollOptions({
      zlotyOption: KAMARADE_ZLOTY_ROLL_OPTIONS.membreDuParti
    });

    assert.equal(options.baseFormula, "3d6kh2");
    assert.equal(options.zlotyCost, 1);
    assert.equal(options.damageMultiplier, 1);
  });

  test("Apparatchik rolls and adds three dice", () => {
    const options = normalizeKamaradePreRollOptions({
      zlotyOption: KAMARADE_ZLOTY_ROLL_OPTIONS.apparatchik
    });

    assert.equal(options.baseFormula, "3d6");
    assert.equal(options.zlotyCost, 2);
  });

  test("Pic a glace adds one to the roll and doubles final damage", () => {
    const options = normalizeKamaradePreRollOptions({
      contextualBonus: 2.8,
      zlotyOption: KAMARADE_ZLOTY_ROLL_OPTIONS.picAGlace
    });

    assert.equal(options.contextualBonus, 2);
    assert.equal(options.baseFormula, "2d6");
    assert.equal(options.zlotyCost, 3);
    assert.equal(options.rollBonus, 1);
    assert.equal(options.damageMultiplier, 2);
    assert.equal(options.setHealthToOne, true);
  });
});
