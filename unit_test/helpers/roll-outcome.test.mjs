import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  STAR_MARX_ROLL_THRESHOLD,
  buildStarMarxRollFormula,
  evaluateStarMarxRollOutcome,
  extractRollDiceValues
} from "../../module/helpers/roll-outcome.mjs";

describe("Star Marx roll outcomes", () => {
  test("uses 9 as the default success threshold", () => {
    assert.equal(STAR_MARX_ROLL_THRESHOLD, 9);
  });

  test("detects a critical failure when every die is 1, regardless of bonuses", () => {
    const outcome = evaluateStarMarxRollOutcome(roll({ dice: [1, 1], total: 12 }));

    assert.equal(outcome.key, "criticalFailure");
    assert.equal(outcome.success, false);
    assert.equal(outcome.critical, true);
  });

  test("detects a critical success when every die is 6, regardless of penalties", () => {
    const outcome = evaluateStarMarxRollOutcome(roll({ dice: [6, 6], total: 8 }));

    assert.equal(outcome.key, "criticalSuccess");
    assert.equal(outcome.success, true);
    assert.equal(outcome.critical, true);
  });

  test("detects a standard success when total reaches 9", () => {
    const outcome = evaluateStarMarxRollOutcome(roll({ dice: [3, 4], total: 9 }));

    assert.equal(outcome.key, "success");
    assert.equal(outcome.success, true);
    assert.equal(outcome.critical, false);
  });

  test("detects a standard failure when total is below 9", () => {
    const outcome = evaluateStarMarxRollOutcome(roll({ dice: [3, 4], total: 8 }));

    assert.equal(outcome.key, "failure");
    assert.equal(outcome.success, false);
    assert.equal(outcome.critical, false);
  });

  test("extracts natural values from every die term", () => {
    const values = extractRollDiceValues({
      dice: [
        { results: [{ result: 2 }, { result: 5 }] },
        { results: [{ value: 6 }] }
      ]
    });

    assert.deepEqual(values, [2, 5, 6]);
  });

  test("builds formulas without zero-value modifiers", () => {
    const formula = buildStarMarxRollFormula("2d6", [0, 3, -0, -2]);

    assert.equal(formula, "2d6 + 3 - 2");
  });

  test("keeps the base formula alone when every modifier is zero", () => {
    const formula = buildStarMarxRollFormula("2d6", [0, -0]);

    assert.equal(formula, "2d6");
  });
});

function roll({ dice, total }) {
  return {
    total,
    dice: [
      {
        results: dice.map(result => ({ result }))
      }
    ]
  };
}
