import { applyEndOfCombatKamaradeEffects } from "./kamarade-combat-effects.mjs";

const BaseCombat = globalThis.Combat ?? class {
  _onDelete() {}
};

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
