import { DOCTRINES, TRAITS_BY_DOCTRINE, SYSTEM_ID } from "../helpers/config.mjs";
import { openStarMarxImagePicker } from "../helpers/image-picker.mjs";

const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

// Single Item sheet that picks its body template based on the item type.
// `_configureRenderParts` rewrites the body part template before each render,
// which keeps the class simple (one registration covers race / signe / clef).
export class StarMarxItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["star-marx", "sheet", "item"],
    position: { width: 520, height: 560 },
    window: { resizable: true, contentClasses: ["star-marx-content"] },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      editImage: StarMarxItemSheet.#onEditImage
    }
  };

  static PARTS = {
    header: { template: `systems/${SYSTEM_ID}/templates/item/parts/header.hbs` },
    body:   { template: `systems/${SYSTEM_ID}/templates/item/parts/race.hbs` }
  };

  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    const type = this.item.type;
    const bodyByType = {
      race:          `systems/${SYSTEM_ID}/templates/item/parts/race.hbs`,
      signe:         `systems/${SYSTEM_ID}/templates/item/parts/signe.hbs`,
      clef:          `systems/${SYSTEM_ID}/templates/item/parts/clef.hbs`,
      don:           `systems/${SYSTEM_ID}/templates/item/parts/don.hbs`,
      signe_soyouz:  `systems/${SYSTEM_ID}/templates/item/parts/signe_soyouz.hbs`
    };
    if (parts.body && bodyByType[type]) {
      parts.body = { ...parts.body, template: bodyByType[type] };
    }
    return parts;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.item;

    context.item = item;
    context.system = item.system;
    context.isEditable = this.isEditable;

    context.doctrines = DOCTRINES;
    context.traitsByDoctrine = TRAITS_BY_DOCTRINE;
    context.requiresTraitTarget = !!item.flags?.starmarx?.requiresTraitTarget;
    context.targetTraitGroups = this.#buildTargetTraitGroups();

    // No need to pre-enrich HTML here: we render HTML fields with the
    // <prose-mirror> custom element, which takes the raw value via `value="…"`
    // and handles serialization + editing itself.

    return context;
  }

  static async #onEditImage(event, target) {
    event.preventDefault();
    if (!this.isEditable) return;
    const field = target.dataset.edit ?? "img";
    return openStarMarxImagePicker({
      document: this.item,
      field,
      position: this.position
    });
  }

  #buildTargetTraitGroups() {
    return DOCTRINES.map(doctrine => ({
      id: doctrine,
      labelKey: `STARMARX.Doctrine.${this.#capitalize(doctrine)}`,
      traits: TRAITS_BY_DOCTRINE[doctrine].map(trait => ({
        id: trait,
        value: `${doctrine}.${trait}`,
        labelKey: `STARMARX.Trait.${this.#capitalize(doctrine)}.${this.#capitalize(trait)}`
      }))
    }));
  }

  #capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
