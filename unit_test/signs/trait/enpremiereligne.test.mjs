import { describe, test } from "node:test";
import assert from "node:assert/strict";
import catalog from "../../meta/signes-catalog.json" with { type: "json" };

const SIGN = catalog.find(entry => entry.slug === "enpremiereligne");

describe("Kamarade Sign - En premiere ligne (enpremiereligne)", () => {
  test("catalog entry is available", () => {
    assert.ok(SIGN);
    assert.equal(SIGN.category, "trait");
  });

  test("_computeHealthMax includes +3 when the sign is present", async () => {
    installActorStub();
    const { KamaradeActor } = await import("../../../module/actor/kamarade.mjs");

    const actor = createRuntimeActor(KamaradeActor, {
      system: makeSystem({ value: 5, max: 5, offset: 0 }),
      items: []
    });

    const withoutSign = KamaradeActor.prototype._computeHealthMax.call(actor, actor.system);
    actor.items.push({ type: "signe", name: "En premiere ligne" });
    const withSign = KamaradeActor.prototype._computeHealthMax.call(actor, actor.system);
    actor.items.pop();
    const afterRemoval = KamaradeActor.prototype._computeHealthMax.call(actor, actor.system);

    assert.equal(withoutSign, 5);
    assert.equal(withSign, 8);
    assert.equal(afterRemoval, 5);
  });

  test("health offset preserves wound count when the sign changes max HP", async () => {
    installActorStub();
    const { KamaradeActor } = await import("../../../module/actor/kamarade.mjs");

    const actor = createRuntimeActor(KamaradeActor, {
      system: makeSystem({ value: 4, max: 5, offset: -1 }),
      items: []
    });

    KamaradeActor.prototype.prepareDerivedData.call(actor);
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 4);
    assert.equal(actor.system.health.offset, -1);

    actor.items.push({ id: "SIGN-1", type: "signe", name: "En premiere ligne" });
    KamaradeActor.prototype.prepareDerivedData.call(actor);
    assert.equal(actor.system.health.max, 8);
    assert.equal(actor.system.health.value, 7);
    assert.equal(actor.system.health.offset, -1);

    actor.items = [];
    KamaradeActor.prototype.prepareDerivedData.call(actor);
    assert.equal(actor.system.health.max, 5);
    assert.equal(actor.system.health.value, 4);
    assert.equal(actor.system.health.offset, -1);
  });

  test("_preUpdate stores current HP edits as health offset", async () => {
    installActorStub();
    installFoundryUtilsStub();
    const { KamaradeActor } = await import("../../../module/actor/kamarade.mjs");

    const actor = createRuntimeActor(KamaradeActor, {
      system: makeSystem({ value: 5, max: 5, offset: 0 }),
      items: []
    });
    const changed = { system: { health: { value: 3 } } };

    await KamaradeActor.prototype._preUpdate.call(actor, changed, {}, "UNIT_TEST_USER");

    assert.equal(changed.system.health.offset, -2);
    assert.equal("value" in changed.system.health, false);
  });
});

function installActorStub() {
  globalThis.Actor ??= class Actor {
    prepareDerivedData() {}
    async _preUpdate() {}
    getRollData() { return {}; }
  };
}

function installFoundryUtilsStub() {
  globalThis.foundry ??= {};
  globalThis.foundry.utils = {
    deepClone: value => structuredClone(value),
    deleteProperty: (object, path) => {
      const parts = path.split(".");
      const last = parts.pop();
      const parent = parts.reduce((current, part) => current?.[part], object);
      if (parent && last) delete parent[last];
    },
    getProperty: (object, path) => path.split(".").reduce((current, part) => current?.[part], object),
    hasProperty: (object, path) => globalThis.foundry.utils.getProperty(object, path) !== undefined,
    mergeObject: (original, other) => mergeObject(original, other),
    setProperty: (object, path, value) => {
      const parts = path.split(".");
      const last = parts.pop();
      const parent = parts.reduce((current, part) => {
        current[part] ??= {};
        return current[part];
      }, object);
      parent[last] = value;
    }
  };
}

function mergeObject(original, other) {
  for (const [key, value] of Object.entries(other ?? {})) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      original[key] = mergeObject(original[key] ?? {}, value);
    } else {
      original[key] = value;
    }
  }
  return original;
}

function makeSystem({ value, max, offset }) {
  return {
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
        baratin: { points: 0, bonus: 0, total: 0 },
        discretion: { points: 0, bonus: 0, total: 0 },
        bidouille: { points: 0, bonus: 0, total: 0 }
      },
      etoile: {
        science: { points: 0, bonus: 0, total: 0 },
        pilotage: { points: 0, bonus: 0, total: 0 },
        vigilance: { points: 0, bonus: 0, total: 0 }
      }
    },
    health: { value, max, offset, bonus: 0 },
    damage: {
      lutte: { value: 1, bonus: 0 },
      ak47: { value: 1, bonus: 0 }
    },
    limits: { signes: 1, clefs: 5 }
  };
}

function createRuntimeActor(KamaradeActor, { system, items }) {
  return {
    type: "kamarade",
    system,
    items,
    toObject: function toObject() {
      return { system: structuredClone(this.system) };
    },
    _computeTraitPoints: KamaradeActor.prototype._computeTraitPoints,
    _initializeHealthOffset: KamaradeActor.prototype._initializeHealthOffset,
    _computeHealthMax: KamaradeActor.prototype._computeHealthMax,
    _computeHealthValue: KamaradeActor.prototype._computeHealthValue,
    _computeKamaradeSignHpBonus: KamaradeActor.prototype._computeKamaradeSignHpBonus,
    _has_item: KamaradeActor.prototype._has_item,
    _normalizeSignSlug: KamaradeActor.prototype._normalizeSignSlug
  };
}
