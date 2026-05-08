// Item DataModels for Star Marx. One class per Item subtype, all in this
// single file because each schema is small.
//
// These replace the Item.* entries of template.json. Shared behavior:
// every type carries an HTML `description` field.

import { DOCTRINES } from "../helpers/config.mjs";

const {
  SchemaField, StringField, NumberField, BooleanField, HTMLField, ArrayField
} = foundry.data.fields;

// Common field reused by every Item subtype. Instantiate per call — DataFields
// cannot be shared across schemas.
function description() {
  return new HTMLField();
}

export class RaceData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: description(),
      // Racial-signe UUIDs in the compendium. Written by the seed tool, read
      // at drop time to auto-create N embedded racial signes. NOT exposed in
      // the player UI. A race may have 1 (most races), 2 (Klon → Klon + Grand,
      // Simple → Simple + Petit), or 0 (edge case) racial signes.
      signesRacialUuids: new ArrayField(new StringField()),
      // Mandatory racial-key UUIDs in the compendium. Works like racial
      // signes: when the race is dropped on a Kamarade, each key is copied
      // and linked back with system.racialOf.
      clefsRacialUuids: new ArrayField(new StringField()),
      // Which Doctrines this race is compatible with. A player CAN still pick
      // a disallowed doctrine on their Kamarade — the sheet will just flag it
      // with a warning next to the race. Defaults to "all three allowed".
      doctrinesAutorisees: new SchemaField({
        marteau:  new BooleanField({ required: true, initial: true }),
        faucille: new BooleanField({ required: true, initial: true }),
        etoile:   new BooleanField({ required: true, initial: true })
      }),
      traitBonuses: new ArrayField(new SchemaField({
        doctrine: new StringField({ required: true, choices: DOCTRINES }),
        trait:    new StringField({ required: true }),
        bonus:    new NumberField({ required: true, integer: true, initial: 0 })
      })),
      hpBonus:          new NumberField({ required: true, integer: true, initial: 0 }),
      zlotysBonus:      new NumberField({ required: true, integer: true, initial: 0 }),
      signesBonus:      new NumberField({ required: true, integer: true, initial: 0 }),
      traitPointsBonus: new NumberField({ required: true, integer: true, initial: 0 }),
      restrictions: new HTMLField()
    };
  }
}

export class SigneData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: description(),
      category: new StringField({
        required: true,
        initial: "general",
        choices: ["general", "trait", "racial", "race", "groupuscule"]
      }),
      traitLink: new StringField({ required: true, initial: "" }),
      targetTrait: new StringField({ required: true, initial: "" }),
      racialOf:  new StringField({ required: true, initial: "" }),
      // Flag indicating this signe is granted by something external to
      // character creation (equipment, scenario reward, GM fiat). Bonus
      // signes don't count against the chosen-signes cap.
      bonus: new BooleanField({ required: true, initial: false })
    };
  }
}

export class KontrebandeData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: description(),
      bonus:   new NumberField({ required: true, integer: true, initial: 2 }),
      state:   new StringField({
        required: true,
        initial: "intact",
        choices: ["intact", "coche", "casse"]
      }),
      repairs: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      used:    new BooleanField({ required: true, initial: false })
    };
  }
}

export class ClefData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: description(),
      racialOf:    new StringField({ required: true, initial: "" }),
      zlotyReward: new NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      trigger:     new HTMLField(),
      // Bonus keys are granted externally and don't count against the
      // player-chosen keys cap.
      bonus:       new BooleanField({ required: true, initial: false })
    };
  }
}

export class BardaData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: description(),
      source: new StringField({ required: true, initial: "" })
    };
  }
}

export class FaiblesseData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: description(),
      malus:   new NumberField({ required: true, integer: true, initial: -4 }),
      invoked: new BooleanField({ required: true, initial: false })
    };
  }
}

export class AtoutData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: description(),
      bonus: new NumberField({ required: true, integer: true, initial: 2 }),
      used:  new BooleanField({ required: true, initial: false })
    };
  }
}

// Dons are antagonist-only attributes (monsters, NPC villains). They are
// never bought at character creation. `alias` stores the generic game term
// shown in parentheses in the rulebook (e.g., "POISON", "MORSURE"). `rank`
// is 0 for single-rank dons and 1-3 for the three repeatable ones
// (D.R.H., MISE EN CONCURRENCE, RECAPITALISATION BANCAIRE).
export class DonData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: description(),
      alias: new StringField({ required: true, initial: "" }),
      rank:  new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 3 })
    };
  }
}

// Ship-exclusive special sign, bought with 2 XP (pooled between Kamarades)
// for the crew's vaisseau. Distinct from character `signe` so the two pools
// never mix. `tag` is a free-form grouping string ("modele", "armement",
// "narratif"…) kept flat in V1 — can become a choice list if/when we ever
// start enforcing it mechanically.
export class SigneSoyouzData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: description(),
      tag: new StringField({ required: true, initial: "" })
    };
  }
}
