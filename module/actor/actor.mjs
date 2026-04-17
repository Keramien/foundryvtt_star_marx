import {
  BASE_HP,
  DOCTRINES,
  STARTING_TRAIT_POINTS,
  TRAITS_BY_DOCTRINE,
  TRAIT_COST,
  damageFromRank
} from "../helpers/config.mjs";

export class StarMarxActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();
    if (this.type !== "kamarade") return;

    const sys = this.system;
    const chosenDoctrine = sys.details?.doctrine ?? DOCTRINES[0];

    // Compute the effective total for every trait:
    //   total = points + bonus + (1 if the trait is in the chosen doctrine)
    // The +1 is the free rank granted at creation by the chosen doctrine.
    for (const d of DOCTRINES) {
      const doctrineBonus = (d === chosenDoctrine) ? 1 : 0;
      for (const tid of TRAITS_BY_DOCTRINE[d]) {
        const t = sys.traits?.[d]?.[tid];
        if (!t) continue;
        t.total = (t.points ?? 0) + (t.bonus ?? 0) + doctrineBonus;
      }
    }

    // HP max is derived from KARKASS total + the persistent health bonus.
    sys.health.max = this._computeHealthMax(sys);
    sys.health.value = Math.max(0, Math.min(sys.health.value ?? 0, sys.health.max));

    // Damage sources read their trait total too.
    sys.damage.lutte.value = damageFromRank(sys.traits?.marteau?.lutte?.total ?? 0)
      + (sys.damage.lutte.bonus ?? 0);
    sys.damage.ak47.value = damageFromRank(sys.traits?.marteau?.ak47?.total ?? 0)
      + (sys.damage.ak47.bonus ?? 0);

    // XP is split across 4 editable buckets. Total is computed for display.
    const xp = sys.details.xp;
    const xpTraits = xp.traits ?? 0;
    const xpSignes = xp.signes ?? 0;
    const xpClefs  = xp.clefs  ?? 0;
    const xpAutres = xp.autres ?? 0;
    sys.details.xp.total = xpTraits + xpSignes + xpClefs + xpAutres;

    sys.traitPoints = this._computeTraitPoints();

    // Signes slots: creation base + 1 per 2 XP spent on signes.
    sys.signesMax = (sys.limits?.signes ?? 2) + Math.floor(xpSignes / 2);

    // Clefs slots: 2 XP = 1 slot, capped by the rules' hard max (default 5).
    sys.clefsMax = Math.min(sys.limits?.clefs ?? 5, Math.floor(xpClefs / 2));
  }

  // Returns { max, spent, available } for the trait-points pool.
  //   max       = 20 + xp.traits
  //   spent     = Σ points × (1 if doctrine-trait else 2)
  //               (points-only: the free doctrine rank is NOT billed)
  //   available = max - spent
  // Not private: prepareDerivedData runs during the Actor constructor, before
  // the private-method brand is installed on `this`.
  _computeTraitPoints() {
    const sys = this.system;
    const doctrine = sys.details?.doctrine ?? DOCTRINES[0];
    const xpTraits = sys.details?.xp?.traits ?? 0;

    let spent = 0;
    for (const d of DOCTRINES) {
      const cost = (d === doctrine) ? TRAIT_COST.doctrine : TRAIT_COST.hors;
      for (const traitId of TRAITS_BY_DOCTRINE[d]) {
        const points = sys.traits?.[d]?.[traitId]?.points ?? 0;
        spent += points * cost;
      }
    }

    const max = STARTING_TRAIT_POINTS + xpTraits;
    return { max, spent, available: max - spent };
  }

  // Compute HP max from a given system-like object. Used both during
  // derivation and in _preUpdate to predict the post-update max.
  //   max = 5 + KARKASS.total + health.bonus
  //   KARKASS.total = points + bonus + (1 if doctrine is marteau)
  _computeHealthMax(sys) {
    const doctrine = sys.details?.doctrine ?? DOCTRINES[0];
    const k = sys.traits?.marteau?.karkass ?? {};
    const doctrineBonus = (doctrine === "marteau") ? 1 : 0;
    const karkassTotal = (k.points ?? 0) + (k.bonus ?? 0) + doctrineBonus;
    return BASE_HP + karkassTotal + (sys.health?.bonus ?? 0);
  }

  // When the update changes anything affecting HP max (karkass, doctrine,
  // health.bonus), shift health.value by the same delta so the character
  // keeps their "wound count" instead of refilling or losing HP silently.
  // Both value and the recomputed max are written in a single transaction.
  async _preUpdate(changed, options, user) {
    await super._preUpdate(changed, options, user);
    if (this.type !== "kamarade") return;

    const watchedPaths = [
      "system.traits.marteau.karkass.points",
      "system.traits.marteau.karkass.bonus",
      "system.details.doctrine",
      "system.health.bonus"
    ];
    if (!watchedPaths.some(p => foundry.utils.hasProperty(changed, p))) return;

    const currentMax = this.system.health.max;
    const mergedSys = foundry.utils.mergeObject(
      foundry.utils.deepClone(this.toObject().system),
      changed.system ?? {}
    );
    const newMax = this._computeHealthMax(mergedSys);
    const delta = newMax - currentMax;
    if (delta === 0) return;

    const incomingValue = foundry.utils.getProperty(changed, "system.health.value");
    const baseValue = (incomingValue !== undefined) ? incomingValue : (this.system.health.value ?? 0);
    const shiftedValue = Math.max(0, Math.min(newMax, baseValue + delta));

    foundry.utils.setProperty(changed, "system.health.value", shiftedValue);
  }

  getRollData() {
    const data = super.getRollData();
    return data;
  }
}
