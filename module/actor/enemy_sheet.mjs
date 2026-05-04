import { SYSTEM_ID } from "../helpers/config.mjs";
import { openStarMarxImagePicker } from "../helpers/image-picker.mjs";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

// Sheet for the `enemy` actor subtype. Much simpler than KamaradeSheet:
// one flat panel showing combat stats + dons list + description. Reuses
// the same `star-marx sheet actor` CSS classes so the visual style stays
// consistent with the Kamarade sheet.
export class EnemySheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["star-marx", "sheet", "actor", "enemy"],
    position: { width: 560, height: 720 },
    window: { resizable: true, contentClasses: ["star-marx-content"] },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      editImage:  EnemySheet.#onEditImage,
      itemCreate: EnemySheet.#onItemCreate,
      itemEdit:   EnemySheet.#onItemEdit,
      itemDelete: EnemySheet.#onItemDelete
    }
  };

  static PARTS = {
    body: { template: `systems/${SYSTEM_ID}/templates/actor/enemy.hbs`, scrollable: [""] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    context.isEditable = this.isEditable;
    context.dons = this.actor.itemTypes.don ?? [];
    return context;
  }

  // Only dons are meaningful on an enemy. Drops of other item types are
  // silently accepted as generic embeds — handy for future extension.
  async _onDropItem(event, data) {
    const item = await Item.implementation.fromDropData(data);
    if (!item) return;
    return this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
  }

  static async #onEditImage(event, target) {
    event.preventDefault();
    if (!this.isEditable) return;
    const field = target.dataset.edit ?? "img";
    return openStarMarxImagePicker({
      document: this.actor,
      field,
      position: this.position
    });
  }

  static async #onItemCreate(event, target) {
    const type = target.dataset.itemType ?? "don";
    const name = game.i18n.format("DOCUMENT.New", {
      type: game.i18n.localize(`STARMARX.Item.Type.${type}`)
    });
    const [item] = await this.actor.createEmbeddedDocuments("Item", [{ name, type }]);
    item?.sheet?.render(true);
  }

  static async #onItemEdit(event, target) {
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.actor.items.get(id);
    item?.sheet?.render(true);
  }

  static async #onItemDelete(event, target) {
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.actor.items.get(id);
    if (!item) return;
    await item.deleteDialog();
  }
}
