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

  test("routes Enemy actors to Enemy derived health data", async () => {
    installActorStub();
    const { StarMarxActor } = await import("../../module/actor/actor.mjs");

    const actor = createEnemyActor();
    StarMarxActor.prototype.prepareDerivedData.call(actor);

    assert.equal(actor.system.health.offset, -3);
    assert.equal(actor.system.health.value, 6);
  });

  test("links Kamarade prototype tokens by default", async () => {
    installActorStub();
    const { StarMarxActor } = await import("../../module/actor/actor.mjs");

    const updates = [];
    const actor = {
      type: "kamarade",
      prototypeToken: {
        updateSource: update => updates.push(update)
      }
    };

    await StarMarxActor.prototype._preCreate.call(actor, {}, {}, {});

    assert.deepEqual(updates, [{ actorLink: true }]);
  });

  test("forces explicitly configured Kamarade prototype tokens to stay linked", async () => {
    installActorStub();
    const { StarMarxActor } = await import("../../module/actor/actor.mjs");

    const updates = [];
    const actor = {
      type: "kamarade",
      prototypeToken: {
        updateSource: update => updates.push(update)
      }
    };

    await StarMarxActor.prototype._preCreate.call(actor, {
      prototypeToken: { actorLink: false }
    }, {}, {});

    assert.deepEqual(updates, [{ actorLink: true }]);
  });

  test("links Soyouz prototype tokens by default", async () => {
    installActorStub();
    const { StarMarxActor } = await import("../../module/actor/actor.mjs");

    const updates = [];
    const actor = {
      type: "soyouz",
      prototypeToken: {
        updateSource: update => updates.push(update)
      }
    };

    await StarMarxActor.prototype._preCreate.call(actor, {}, {}, {});

    assert.deepEqual(updates, [{ actorLink: true }]);
  });

  test("does not force Enemy prototype tokens to be linked", async () => {
    installActorStub();
    const { StarMarxActor } = await import("../../module/actor/actor.mjs");

    const updates = [];
    const actor = {
      type: "enemy",
      prototypeToken: {
        updateSource: update => updates.push(update)
      }
    };

    await StarMarxActor.prototype._preCreate.call(actor, {}, {}, {});

    assert.deepEqual(updates, []);
  });

  test("converts Kamarade token HUD health value updates to health offset", async () => {
    installActorStub();
    const { StarMarxActor } = await import("../../module/actor/actor.mjs");

    const updates = [];
    const actor = {
      type: "kamarade",
      system: { health: { value: 7, max: 8, offset: -1 } },
      update: update => {
        updates.push(update);
        return actor;
      }
    };

    const result = await StarMarxActor.prototype.modifyTokenAttribute.call(actor, "health", 3);

    assert.equal(result, actor);
    assert.deepEqual(updates, [{ "system.health.offset": -5 }]);
  });

  test("converts Soyouz token HUD health deltas to health offset", async () => {
    installActorStub();
    const { StarMarxActor } = await import("../../module/actor/actor.mjs");

    const updates = [];
    const actor = {
      type: "soyouz",
      system: { health: { value: 6, max: 8, offset: -2 } },
      update: update => {
        updates.push(update);
        return actor;
      }
    };

    const result = await StarMarxActor.prototype.modifyTokenAttribute.call(actor, "health", -3, true);

    assert.equal(result, actor);
    assert.deepEqual(updates, [{ "system.health.offset": -5 }]);
  });

  test("converts Enemy token HUD health value updates to health offset", async () => {
    installActorStub();
    const { StarMarxActor } = await import("../../module/actor/actor.mjs");

    const updates = [];
    const actor = {
      type: "enemy",
      system: { health: { value: 9, max: 12, offset: -3 } },
      update: update => {
        updates.push(update);
        return actor;
      }
    };

    const result = await StarMarxActor.prototype.modifyTokenAttribute.call(actor, "health", 4);

    assert.equal(result, actor);
    assert.deepEqual(updates, [{ "system.health.offset": -8 }]);
  });

  test("clamps token HUD health changes to Kamarade health bounds", async () => {
    installActorStub();
    const { StarMarxActor } = await import("../../module/actor/actor.mjs");

    const updates = [];
    const actor = {
      type: "kamarade",
      system: { health: { value: 6, max: 8, offset: -2 } },
      update: update => {
        updates.push(update);
        return actor;
      }
    };

    await StarMarxActor.prototype.modifyTokenAttribute.call(actor, "health", 20);
    await StarMarxActor.prototype.modifyTokenAttribute.call(actor, "health", -20);

    assert.deepEqual(updates, [
      { "system.health.offset": 0 },
      { "system.health.offset": -8 }
    ]);
  });

  test("delegates non-health token attribute updates to Foundry", async () => {
    installActorStub();
    const { StarMarxActor } = await import("../../module/actor/actor.mjs");

    const actor = {
      type: "kamarade",
      system: { health: { max: 8, offset: -1 } }
    };

    const result = await StarMarxActor.prototype.modifyTokenAttribute.call(actor, "zlotys", 3);

    assert.equal(result, "foundry-modify-token-attribute");
    assert.deepEqual(actor.modifyTokenAttributeCalls, [{
      attribute: "zlotys",
      value: 3,
      isDelta: false,
      isBar: true
    }]);
  });

  test("links newly created Kamarade scene tokens", async () => {
    installActorStub();
    installGameActorsStub([
      { id: "A1", type: "kamarade" }
    ]);
    const { StarMarxTokenDocument } = await import("../../module/token/token_document.mjs");

    const updates = [];
    const token = {
      actorId: "A1",
      updateSource: update => updates.push(update)
    };

    await StarMarxTokenDocument.prototype._preCreate.call(token, {
      actorId: "A1",
      actorLink: false
    }, {}, {});

    assert.deepEqual(updates, [{ actorLink: true }]);
  });

  test("links newly created Soyouz scene tokens", async () => {
    installActorStub();
    installGameActorsStub([
      { id: "A1", type: "soyouz" }
    ]);
    const { StarMarxTokenDocument } = await import("../../module/token/token_document.mjs");

    const updates = [];
    const token = {
      actorId: "A1",
      updateSource: update => updates.push(update)
    };

    await StarMarxTokenDocument.prototype._preCreate.call(token, {
      actorId: "A1",
      actorLink: false
    }, {}, {});

    assert.deepEqual(updates, [{ actorLink: true }]);
  });

  test("does not force Enemy scene tokens to be linked", async () => {
    installActorStub();
    installGameActorsStub([
      { id: "A1", type: "enemy" }
    ]);
    const { StarMarxTokenDocument } = await import("../../module/token/token_document.mjs");

    const updates = [];
    const token = {
      actorId: "A1",
      updateSource: update => updates.push(update)
    };

    await StarMarxTokenDocument.prototype._preCreate.call(token, {
      actorId: "A1",
      actorLink: false
    }, {}, {});

    assert.deepEqual(updates, []);
  });

  test("links existing Kamarade and Soyouz prototype tokens on ready", async () => {
    installActorStub();
    const actorUpdates = [];
    installGameActorsStub([
      {
        id: "A1",
        type: "kamarade",
        prototypeToken: { actorLink: false },
        update: update => actorUpdates.push(update)
      },
      {
        id: "A2",
        type: "soyouz",
        prototypeToken: { actorLink: false },
        update: update => actorUpdates.push(update)
      },
      {
        id: "A3",
        type: "enemy",
        prototypeToken: { actorLink: false },
        update: update => actorUpdates.push(update)
      }
    ]);
    const { ensureLinkedActorPrototypeTokensLinked } = await import("../../module/token/token_document.mjs");

    await ensureLinkedActorPrototypeTokensLinked();

    assert.deepEqual(actorUpdates, [
      { "prototypeToken.actorLink": true },
      { "prototypeToken.actorLink": true }
    ]);
  });
});

function installActorStub() {
  globalThis.Actor ??= class Actor {
    async _preCreate() {}
    prepareDerivedData() {}
    getRollData() { return {}; }
    async modifyTokenAttribute(attribute, value, isDelta = false, isBar = true) {
      this.modifyTokenAttributeCalls ??= [];
      this.modifyTokenAttributeCalls.push({ attribute, value, isDelta, isBar });
      return "foundry-modify-token-attribute";
    }
  };
}

function installGameActorsStub(actors) {
  const byId = new Map(actors.map(actor => [actor.id, actor]));
  byId[Symbol.iterator] = function* () {
    yield* actors;
  };

  globalThis.game = {
    user: { isGM: true },
    actors: byId
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

function createEnemyActor() {
  return {
    type: "enemy",
    _source: {
      system: {
        health: { value: 6, max: 9 }
      }
    },
    system: {
      dangerosite: 2,
      degats: 3,
      health: { value: 6, max: 9, offset: 0 }
    }
  };
}

function trait({ score = 0, bonus = 0, avaries = 0 } = {}) {
  return { score, bonus, avaries, total: 0 };
}
