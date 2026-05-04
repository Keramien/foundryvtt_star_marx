import {
  BASE_HP,
  DOCTRINES,
  STARTING_TRAIT_POINTS,
  TRAITS_BY_DOCTRINE,
  TRAIT_COST,
  damageFromRank
} from "../helpers/config.mjs";

export class KamaradeActor extends Actor {
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

    // Add HP offset if it doesn't exist
    this._initializeHealthOffset();

    // HP max is derived from KARKASS total + persistent/sign bonuses. Current
    // HP is stored as an offset from max so max changes keep wound count.
    sys.health.max = this._computeHealthMax(sys);
    sys.health.value = this._computeHealthValue(sys);

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

  _initializeHealthOffset() {
    const sys = this.system;
    const sourceHealth = this._source?.system?.health;
    if (this._source?.system) {
      if (Number.isFinite(sourceHealth?.offset)) return;
    } else if (Number.isFinite(sys.health?.offset)) {
      return;
    }

    const value = Number.isFinite(sourceHealth?.value) ? sourceHealth.value : (sys.health?.value ?? BASE_HP);
    const max = Number.isFinite(sourceHealth?.max) ? sourceHealth.max : (sys.health?.max ?? BASE_HP);
    sys.health.offset = value - max;
  }

  // Compute HP max from a given system-like object. Used during derivation and
  // when translating an incoming current-HP edit into a relative offset.
  //   max = 5 + KARKASS.total + health.bonus
  //   KARKASS.total = points + bonus + (1 if doctrine is marteau)
  _computeHealthMax(sys) {
    const doctrine = sys.details?.doctrine ?? DOCTRINES[0];
    const k = sys.traits?.marteau?.karkass ?? {};
    const doctrineBonus = (doctrine === "marteau") ? 1 : 0;
    const karkassTotal = (k.points ?? 0) + (k.bonus ?? 0) + doctrineBonus;
    const signBonus = this._computeKamaradeSignHpBonus();
    return BASE_HP + karkassTotal + (sys.health?.bonus ?? 0) + signBonus;
  }

  _computeHealthValue(sys) {
    const max = sys.health?.max ?? this._computeHealthMax(sys);
    const offset = sys.health?.offset ?? 0;
    return Math.max(0, Math.min(max, max + offset));
  }

  _has_item(name){
    let found = false;
    this.items.forEach(item => {
      if(item && item.name && this._normalizeSignSlug(item.name) === name){
        found = true;
        return;
      }
    });
    return found;
  }

  // Some signs add fixed HP bonuses outside of trait/race formulas.
  _computeKamaradeSignHpBonus() {
    if (this.type !== "kamarade") return 0;

    let bonus = 0;
    if(this._has_item("enpremiereligne"))
      bonus += 3;
    return bonus;
  }



  _normalizeSignSlug(value) {
    if (typeof value !== "string") return "";
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

  getRollData() {
    const data = super.getRollData();
    return data;
  }
}
