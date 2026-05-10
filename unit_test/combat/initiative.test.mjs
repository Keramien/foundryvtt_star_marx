import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  STAR_MARX_INITIATIVE_FORMULA,
  configureStarMarxInitiative
} from "../../module/combat/combat.mjs";

describe("Combat initiative", () => {
  test("uses 2d6 as the Foundry initiative formula", () => {
    const config = {
      Combat: {
        initiative: {
          formula: "1d20",
          decimals: 2
        }
      }
    };

    configureStarMarxInitiative(config);

    assert.equal(STAR_MARX_INITIATIVE_FORMULA, "2d6");
    assert.deepEqual(config.Combat.initiative, {
      formula: "2d6",
      decimals: 0
    });
  });
});
