// KamaradeData — typed schema for the only Actor subtype in Star Marx.
//
// Replaces the legacy template.json entry for Actor.kamarade. Fields that
// prepareDerivedData writes back (trait.total, health.max, damage.*.value,
// traitPoints, signesMax, clefsMax, details.xp.total) are declared here with
// sensible defaults so writes during derivation pass schema validation.

import { DOCTRINES, TRAITS_BY_DOCTRINE } from "../helpers/config.mjs";

const {
  SchemaField, StringField, NumberField, HTMLField, ObjectField
} = foundry.data.fields;

// One {points, bonus, total} block per Trait. `total` is derived but kept in
// the schema so prepareDerivedData can write it without validation noise.
function traitPairField() {
  return new SchemaField({
    points: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
    bonus:  new NumberField({ required: true, integer: true, initial: 0 }),
    total:  new NumberField({ required: true, integer: true, initial: 0 })
  });
}

// Build the nested schema:  traits.<doctrine>.<traitId>.{points,bonus,total}
function traitsField() {
  const byDoctrine = {};
  for (const d of DOCTRINES) {
    const inner = {};
    for (const tid of TRAITS_BY_DOCTRINE[d]) inner[tid] = traitPairField();
    byDoctrine[d] = new SchemaField(inner);
  }
  return new SchemaField(byDoctrine);
}

export class KamaradeData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      details: new SchemaField({
        description: new HTMLField(),
        notes:       new HTMLField(),
        doctrine:    new StringField({ required: true, initial: "faucille", choices: DOCTRINES }),
        groupuscule: new StringField({ required: true, initial: "" }),
        sexe:        new StringField({ required: true, initial: "" }),
        age:         new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        historique:  new HTMLField(),
        secret:      new HTMLField(),
        manie:       new HTMLField(),
        xp: new SchemaField({
          traits: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
          signes: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
          clefs:  new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
          autres: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
          total:  new NumberField({ required: true, integer: true, initial: 0 })
        })
      }),
      traits: traitsField(),
      health: new SchemaField({
        value: new NumberField({ required: true, integer: true, initial: 5, min: 0 }),
        max:   new NumberField({ required: true, integer: true, initial: 5 }),
        offset: new NumberField({ required: true, integer: true, initial: 0 }),
        bonus: new NumberField({ required: true, integer: true, initial: 0 })
      }),
      damage: new SchemaField({
        lutte: new SchemaField({
          bonus: new NumberField({ required: true, integer: true, initial: 0 }),
          value: new NumberField({ required: true, integer: true, initial: 1 })
        }),
        ak47: new SchemaField({
          bonus: new NumberField({ required: true, integer: true, initial: 0 }),
          value: new NumberField({ required: true, integer: true, initial: 1 })
        })
      }),
      armure: new SchemaField({
        description: new HTMLField(),
        uses: new SchemaField({
          value: new NumberField({ required: true, integer: true, initial: 2, min: 0 }),
          max:   new NumberField({ required: true, integer: true, initial: 2, min: 0 })
        })
      }),
      zlotys: new SchemaField({
        value: new NumberField({ required: true, integer: true, initial: 5, min: 0 })
      }),
      limits: new SchemaField({
        kontrebande: new NumberField({ required: true, integer: true, initial: 5, min: 0 }),
        clefs:       new NumberField({ required: true, integer: true, initial: 5, min: 0 }),
        // Base cap for "chosen" signes only. Racial signes (coming from the
        // race) and bonus signes (from equipment/GM) are counted separately.
        signes:      new NumberField({ required: true, integer: true, initial: 1, min: 0 })
      }),

      // Derived values written by KamaradeActor.prepareDerivedData. Declared
      // as top-level Object/Number fields so assignments don't hit schema
      // validation. Keep these here rather than splitting into a separate
      // derived model — it's a small closed set.
      traitPoints: new ObjectField({ required: false, nullable: true, initial: null }),
      signesMax:   new NumberField({ required: false, nullable: true, initial: null }),
      clefsMax:    new NumberField({ required: false, nullable: true, initial: null })
    };
  }
}
