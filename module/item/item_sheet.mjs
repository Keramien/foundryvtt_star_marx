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
      armurierKamaradeRemove: StarMarxItemSheet.#onArmurierKamaradeRemove,
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
    context.requiresTeamMode = !!item.flags?.starmarx?.requiresTeamMode;
    context.requiresArmurierTargets = this.#requiresArmurierTargets(item);
    context.targetTraitGroups = this.#buildTargetTraitGroups();
    context.armurierOtherAffectedKamarades = context.requiresArmurierTargets
      ? await this.#buildArmurierOtherAffectedKamarades(item)
      : [];

    // No need to pre-enrich HTML here: we render HTML fields with the
    // <prose-mirror> custom element, which takes the raw value via `value="…"`
    // and handles serialization + editing itself.

    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);

    const armurierDropZone = this.element.querySelector("[data-armurier-kamarade-drop]");
    armurierDropZone?.addEventListener("dragover", StarMarxItemSheet.#onArmurierKamaradeDragOver);
    armurierDropZone?.addEventListener("drop", this.#onArmurierKamaradeDrop.bind(this));
  }

  async _onDropActor(event, data) {
    if (!this.#isArmurierTargetDrop(event)) {
      return super._onDropActor?.(event, data);
    }

    event.preventDefault();
    event.stopPropagation();
    return this.#addArmurierKamaradeFromDropData(data);
  }

  static #onArmurierKamaradeDragOver(event) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  }

  async #onArmurierKamaradeDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const data = TextEditor.getDragEventData(event);
    return this.#addArmurierKamaradeFromDropData(data);
  }

  async #addArmurierKamaradeFromDropData(data) {
    const actor = await Actor.implementation.fromDropData(data);
    if (!actor) return false;
    if (actor.type !== "kamarade") {
      ui.notifications.warn(game.i18n.localize("STARMARX.Signe.Armurier.OnlyKamarade"));
      return false;
    }

    const uuid = actor.uuid;
    if (uuid === this.item.parent?.uuid) return false;

    const current = foundry.utils.deepClone(this.item.system.otherAffectedKamarades ?? []);
    if (current.includes(uuid)) return false;

    current.push(uuid);
    return this.item.update({ "system.otherAffectedKamarades": current });
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

  static async #onArmurierKamaradeRemove(event, target) {
    event.preventDefault();
    if (!this.isEditable) return;

    const uuid = target.closest("[data-uuid]")?.dataset.uuid;
    if (!uuid) return;

    const current = (this.item.system.otherAffectedKamarades ?? []).filter(entry => entry !== uuid);
    return this.item.update({ "system.otherAffectedKamarades": current });
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

  async #buildArmurierOtherAffectedKamarades(item) {
    const uuids = item.system.otherAffectedKamarades ?? [];
    return Promise.all(uuids.map(async uuid => {
      const actor = await this.#resolveDocumentUuid(uuid);
      return {
        uuid,
        name: actor?.name ?? game.i18n.format("STARMARX.Signe.Armurier.UnknownKamarade", { uuid }),
        img: actor?.img ?? "icons/svg/mystery-man.svg"
      };
    }));
  }

  async #resolveDocumentUuid(uuid) {
    if (typeof fromUuid !== "function") return null;
    try {
      return await fromUuid(uuid);
    } catch (error) {
      console.warn("Star Marx | Failed to resolve Armurier target", uuid, error);
      return null;
    }
  }

  #isArmurierTargetDrop(event) {
    return this.#requiresArmurierTargets(this.item)
      && !!event.target.closest("[data-armurier-kamarade-drop]");
  }

  #requiresArmurierTargets(item) {
    return !!item.flags?.starmarx?.requiresArmurierTargets
      || normalizeSlug(item.name) === "armurier";
  }
}

function normalizeSlug(value) {
  if (typeof value !== "string") return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}
