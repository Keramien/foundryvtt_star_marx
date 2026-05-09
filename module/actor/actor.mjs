import { prepareKamaradeDerivedData } from "./kamarade.mjs";
import { prepareSoyouzDerivedData } from "./soyouz.mjs";
import { prepareEnemyDerivedData } from "./enemy.mjs";

const HEALTH_ATTRIBUTES = new Set(["health", "system.health", "system.health.value"]);
const LINKED_TOKEN_ACTOR_TYPES = new Set(["kamarade", "soyouz"]);

export class StarMarxActor extends Actor {
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    if (LINKED_TOKEN_ACTOR_TYPES.has(this.type)) {
      this.prototypeToken.updateSource({ actorLink: true });
    }
  }

  async modifyTokenAttribute(attribute, value, isDelta = false, isBar = true) {
    if (!HEALTH_ATTRIBUTES.has(attribute)) {
      return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
    }

    const health = this.system?.health ?? {};
    const max = toNumber(health.max);
    const current = toNumber(health.value, max);
    const next = isDelta ? current + toNumber(value) : toNumber(value);
    const bounded = Math.max(0, Math.min(max, next));

    return this.update({ "system.health.offset": bounded - max });
  }

  prepareDerivedData() {
    super.prepareDerivedData();

    switch (this.type) {
      case "kamarade":
        prepareKamaradeDerivedData(this);
        break;
      case "soyouz":
        prepareSoyouzDerivedData(this);
        break;
      case "enemy":
        prepareEnemyDerivedData(this);
        break;
    }
  }

  getRollData() {
    const data = super.getRollData();
    return data;
  }
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
