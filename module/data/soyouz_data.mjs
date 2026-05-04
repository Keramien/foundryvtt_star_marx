// SoyouzData — schema for the ship Actor subtype.
//
// A soyouz has its own 7 Traits (distinct from Kamarade Traits), a PV pool
// derived from MUR DE FER, an embedded list of signes_soyouz, and six crew
// posts that hold lists of Kamarade Actor UUIDs assigned by drag-drop.
//
// Derived values (traitTotal, health.max, damageFromOrgue) are declared in
// the schema so prepareDerivedData can write them without triggering
// validation — same pattern as KamaradeData.

import { SOYOUZ_TRAITS, SOYOUZ_POSTES } from "../helpers/config.mjs";

const {
  SchemaField, StringField, NumberField, HTMLField, ArrayField
} = foundry.data.fields;

// One trait row. Effective `total` = score + bonus + avaries, derived by
// prepareDerivedData and kept in the schema to pass validation on write.
//   score   — base rank (-2..+2 at creation, sums must total 0)
//   bonus   — persistent modifiers (signes, equipment, narrative grants)
//   avaries — damage / malfunctions, typically negative (starts dropping
//             by 1 per hit once PV are exhausted)
function soyouzTraitField() {
  return new SchemaField({
    score:   new NumberField({ required: true, integer: true, initial: 0 }),
    bonus:   new NumberField({ required: true, integer: true, initial: 0 }),
    avaries: new NumberField({ required: true, integer: true, initial: 0 }),
    total:   new NumberField({ required: true, integer: true, initial: 0 })
  });
}

function buildTraitsSchema() {
  const fields = {};
  for (const tid of SOYOUZ_TRAITS) fields[tid] = soyouzTraitField();
  return new SchemaField(fields);
}

// A post holds a list of Actor UUIDs (Kamarades). We store UUIDs (not plain
// ids) so references resolve whether the target lives in the same world, in
// a different actor folder, or in a compendium.
function buildPostesSchema() {
  const fields = {};
  for (const p of SOYOUZ_POSTES) {
    fields[p] = new ArrayField(new StringField({ required: true }));
  }
  return new SchemaField(fields);
}

export class SoyouzData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      details: new SchemaField({
        description: new HTMLField(),
        notes:       new HTMLField()
      }),
      traits: buildTraitsSchema(),
      health: new SchemaField({
        value: new NumberField({ required: true, integer: true, initial: 5, min: 0 }),
        max:   new NumberField({ required: true, integer: true, initial: 5, min: 0 }),
        offset: new NumberField({ required: true, integer: true, initial: 0 })
      }),
      postes: buildPostesSchema(),

      // Derived, written by StarMarxActor.prepareDerivedData. Kept in schema
      // to avoid validation noise on derivation writes.
      traitTotal:      new NumberField({ required: true, integer: true, initial: 0 }),
      damageFromOrgue: new StringField({ required: true, initial: "1" })
    };
  }
}
