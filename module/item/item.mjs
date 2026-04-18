// StarMarxItem — base Item document for Star Marx.
//
// The main responsibility here is cascade deletion: when a `race` Item is
// removed from an Actor, every signe/clef that was auto-created with
// `system.racialOf === this.id` must go away too.
export class StarMarxItem extends Item {
  async _preDelete(options, user) {
    await super._preDelete(options, user);
    if (this.type !== "race") return;
    const actor = this.parent;
    if (!actor) return;

    const children = actor.items.filter(i =>
      (i.type === "signe" || i.type === "clef") &&
      i.system?.racialOf === this.id
    );
    if (children.length === 0) return;

    await actor.deleteEmbeddedDocuments(
      "Item",
      children.map(i => i.id),
      { render: false }
    );
  }
}
