import { applyEndOfCombatKamaradeEffects } from "./kamarade-combat-effects.mjs";

export const STAR_MARX_INITIATIVE_FORMULA = "2d6";

const BaseCombat = globalThis.Combat ?? class {
  _onDelete() {}
};

export function configureStarMarxInitiative(config = globalThis.CONFIG) {
  if (!config?.Combat) return;

  config.Combat.initiative = {
    ...(config.Combat.initiative ?? {}),
    formula: STAR_MARX_INITIATIVE_FORMULA,
    decimals: 0
  };
}

export class StarMarxCombat extends BaseCombat {
  async applyEndOfCombatEffects(options = {}) {
    return applyEndOfCombatKamaradeEffects(this, {
      updateActor: globalThis.game?.users?.activeGM?.isSelf ?? false,
      notify: true,
      ...options
    });
  }

  _onDelete(options, userId) {
    super._onDelete(options, userId);
    if (!this.started) return;

    this.applyEndOfCombatEffects().catch(error => {
      console.error("Star Marx | Could not apply end-of-combat effects", error);
    });
  }
}
