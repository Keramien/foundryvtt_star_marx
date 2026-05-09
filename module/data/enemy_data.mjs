// EnemyData — schema for antagonist NPCs (monsters, villains).
//
// Enemies are much simpler than Kamarades: three numeric combat stats
// (dangerosité, dégâts, points de vie) plus a description. Dons are stored
// as embedded Items of type "don" — no dedicated schema field needed.

const {
  SchemaField, NumberField, HTMLField
} = foundry.data.fields;

export class EnemyData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      dangerosite: new NumberField({ required: true, integer: true, initial: 0 }),
      degats:      new NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      health: new SchemaField({
        value: new NumberField({ required: true, integer: true, initial: 5, min: 0 }),
        max:   new NumberField({ required: true, integer: true, initial: 5, min: 0 }),
        offset: new NumberField({ required: true, integer: true, initial: 0 })
      }),
      description: new HTMLField(),
      notes:       new HTMLField()
    };
  }
}
