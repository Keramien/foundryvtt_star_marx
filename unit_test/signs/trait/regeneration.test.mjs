import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKamaradeFixture } from "../../fixtures/kamarade.factory.mjs";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };
import { StarMarxCombat } from "../../../module/combat/combat.mjs";
import {
  applyKamaradeRegeneration
} from "../../../module/combat/kamarade-combat-effects.mjs";

const SIGN = catalog.find(entry => entry.slug === "regeneration");

describe("Kamarade Sign - Regeneration (regeneration)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "trait");
  });

  test("recovers 3 HP at the end of combat", async () => {
    const actor = createActor({ value: 2, max: 8 });

    const result = await applyKamaradeRegeneration(actor, { notify: false });

    assert.equal(result.applied, true);
    assert.equal(result.healed, 3);
    assert.equal(result.next, 5);
    assert.equal(actor.system.health.value, 5);
    assert.equal(actor.system.health.offset, -3);
  });

  test("clamps recovery to max HP", async () => {
    const actor = createActor({ value: 7, max: 8 });

    const result = await applyKamaradeRegeneration(actor, { notify: false });

    assert.equal(result.healed, 1);
    assert.equal(result.next, 8);
    assert.equal(actor.system.health.value, 8);
    assert.equal(actor.system.health.offset, 0);
  });

  test("does nothing without the sign", async () => {
    const actor = createActor({ value: 2, max: 8, withSign: false });

    const result = await applyKamaradeRegeneration(actor, { notify: false });

    assert.equal(result.applied, false);
    assert.equal(actor.system.health.value, 2);
    assert.equal(actor.updates.length, 0);
  });

  test("StarMarxCombat applies end-of-combat regeneration once per actor", async () => {
    const actor = createActor({ value: 1, max: 8 });
    const combat = new StarMarxCombat();
    combat.started = true;
    combat.combatants = [
      { actor },
      { actor }
    ];

    const results = await combat.applyEndOfCombatEffects({ notify: false, updateActor: true });

    assert.equal(results.length, 1);
    assert.equal(results[0].healed, 3);
    assert.equal(actor.system.health.value, 4);
  });

  test("uses a success notification for visible regeneration feedback", async () => {
    const actor = createActor({ value: 2, max: 8 });
    const messages = [];
    const previousGame = globalThis.game;
    const previousUi = globalThis.ui;
    globalThis.game = {
      user: { isGM: true },
      i18n: {
        format: (key, data) => `${key}:${data.actor}:${data.healed}`
      }
    };
    globalThis.ui = {
      notifications: {
        success: (message, options) => messages.push({ message, options })
      }
    };

    try {
      await applyKamaradeRegeneration(actor, { updateActor: false, notify: true });
    } finally {
      globalThis.game = previousGame;
      globalThis.ui = previousUi;
    }

    assert.equal(messages.length, 1);
    assert.equal(messages[0].message, "STARMARX.Notifications.RegenerationApplied:Test Kamarade:3");
    assert.deepEqual(messages[0].options, { console: false });
  });
});

function createActor({ value, max, withSign = true }) {
  const actor = createKamaradeFixture({
    id: "KAMARADE-1",
    uuid: "Actor.KAMARADE-1",
    type: "kamarade",
    system: {
      health: {
        value,
        max,
        offset: value - max,
        bonus: 0
      }
    },
    items: withSign ? [createRegenerationSigne()] : []
  });
  actor.updates = [];
  actor.update = async changes => {
    actor.updates.push(changes);
    for (const [path, pathValue] of Object.entries(changes)) {
      setProperty(actor, path, pathValue);
    }
    actor.system.health.value = Math.max(
      0,
      Math.min(actor.system.health.max, actor.system.health.max + actor.system.health.offset)
    );
    return actor;
  };
  return actor;
}

function createRegenerationSigne() {
  return {
    id: "sgtregenerationA",
    type: "signe",
    name: SIGN.name,
    system: {
      category: "trait",
      traitLink: "marteau.karkass"
    }
  };
}

function setProperty(object, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  let target = object;
  for (const key of keys) target = target[key] ??= {};
  target[last] = value;
}
