import {
  DOCTRINES,
  TRAITS_BY_DOCTRINE,
  SYSTEM_ID
} from "../helpers/config.mjs";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class KamaradeSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["star-marx", "sheet", "actor", "kamarade"],
    position: { width: 760, height: 820 },
    window: { resizable: true, contentClasses: ["star-marx-content"] },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      itemCreate:  KamaradeSheet.#onItemCreate,
      itemEdit:    KamaradeSheet.#onItemEdit,
      itemDelete:  KamaradeSheet.#onItemDelete,
      resetTraits: KamaradeSheet.#onResetTraits,
      rollTrait:   KamaradeSheet.#onRollTrait,
      helpTrait:   KamaradeSheet.#onHelpTrait
    }
  };

  static PARTS = {
    header:       { template: `systems/${SYSTEM_ID}/templates/actor/parts/header.hbs` },
    tabs:         { template: `systems/${SYSTEM_ID}/templates/actor/parts/tabs.hbs` },
    presentation: { template: `systems/${SYSTEM_ID}/templates/actor/parts/presentation.hbs`, scrollable: [""] },
    traits:       { template: `systems/${SYSTEM_ID}/templates/actor/parts/traits.hbs`,       scrollable: [""] },
    signes:       { template: `systems/${SYSTEM_ID}/templates/actor/parts/signes.hbs`,       scrollable: [""] },
    equipement:   { template: `systems/${SYSTEM_ID}/templates/actor/parts/equipement.hbs`,   scrollable: [""] }
  };

  static TABS = {
    primary: {
      tabs: [
        { id: "presentation", icon: "fa-solid fa-id-card",   label: "STARMARX.Sheet.Tabs.Presentation" },
        { id: "traits",       icon: "fa-solid fa-dice-d6",   label: "STARMARX.Sheet.Tabs.Traits" },
        { id: "signes",       icon: "fa-solid fa-star",      label: "STARMARX.Sheet.Tabs.Signes" },
        { id: "equipement",   icon: "fa-solid fa-briefcase", label: "STARMARX.Sheet.Tabs.Equipement" }
      ],
      initial: "presentation"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    const sys = actor.system;

    context.actor = actor;
    context.system = sys;
    context.isEditable = this.isEditable;

    context.doctrines = DOCTRINES;
    context.chosenDoctrine = sys.details?.doctrine ?? DOCTRINES[0];
    context.traitGroups = this.#buildTraitGroups(sys, context.chosenDoctrine);

    context.signes = this.#partitionSignes(actor);
    context.kontrebandes = actor.items.filter(i => i.type === "kontrebande");
    context.bardas       = actor.items.filter(i => i.type === "barda");

    // Expose the primary tab list for the nav template. Individual content
    // parts receive their own `tab` context via _preparePartContext below.
    context.tabs = this._prepareTabs("primary");

    return context;
  }

  // Ensures each content part gets its `tab` metadata (id, group, cssClass).
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    if (context.tabs?.[partId]) context.tab = context.tabs[partId];
    return context;
  }

  // Build an ordered list of doctrine groups with chosen doctrine first.
  // Each trait exposes paths+values for points (editable), bonus (editable),
  // and total (computed, read-only).
  #buildTraitGroups(sys, chosen) {
    const ordered = [chosen, ...DOCTRINES.filter(d => d !== chosen)];
    return ordered.map(d => ({
      id: d,
      isChosen: d === chosen,
      labelKey: `STARMARX.Doctrine.${this.#capitalize(d)}`,
      traits: TRAITS_BY_DOCTRINE[d].map(tid => {
        const t = sys.traits?.[d]?.[tid] ?? {};
        return {
          id: tid,
          labelKey: `STARMARX.Trait.${this.#capitalize(d)}.${this.#capitalize(tid)}`,
          pointsPath: `system.traits.${d}.${tid}.points`,
          bonusPath:  `system.traits.${d}.${tid}.bonus`,
          points: t.points ?? 0,
          bonus:  t.bonus  ?? 0,
          total:  t.total  ?? 0
        };
      })
    }));
  }

  #partitionSignes(actor) {
    const signes = actor.items.filter(i => i.type === "signe");
    const racial = signes.find(i => i.system.category === "racial") ?? null;
    const generaux = signes.filter(i => i.system.category !== "racial");
    return { racial, generaux };
  }

  #capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // --- Actions ---

  static async #onItemCreate(event, target) {
    const type = target.dataset.itemType;
    if (!type) return;
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

  // Roll 2d6 + trait.total for a given trait, post to chat with a
  // success/failure verdict against the default threshold of 9.
  static async #onRollTrait(event, target) {
    const doctrine = target.dataset.doctrine;
    const traitId  = target.dataset.trait;
    const trait = this.actor.system.traits?.[doctrine]?.[traitId];
    if (!trait) return;

    const total = trait.total ?? 0;
    const roll = await new Roll("2d6 + @total", { total }).evaluate();

    const threshold = 9;
    const success = roll.total >= threshold;
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const traitLabel = game.i18n.localize(`STARMARX.Trait.${cap(doctrine)}.${cap(traitId)}`);
    const verdict = game.i18n.localize(success
      ? "STARMARX.Roll.CriticalSuccess"
      : "STARMARX.Roll.CriticalFailure");
    const color = success ? "#2e6b2e" : "#a61c1c";
    const flavor = `<strong>${traitLabel}</strong>
      <span style="color:${color}">— ${verdict}</span>
      <small>(${game.i18n.localize("STARMARX.Roll.Threshold")} ${threshold})</small>`;

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor
    });
  }

  // Help roll — placeholder until the mechanic is designed.
  static async #onHelpTrait(event, target) {
    ui.notifications.info(game.i18n.localize("STARMARX.Sheet.Action.HelpTraitTodo"));
  }

  // Reset every Trait rank to 0. Traits points spent drop to 0 as a result.
  static async #onResetTraits(event, target) {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("STARMARX.Sheet.TraitPoints.ResetTitle") },
      content: `<p>${game.i18n.localize("STARMARX.Sheet.TraitPoints.ResetConfirm")}</p>`
    });
    if (!confirmed) return;

    // Reset only the points the player spent. Bonuses (from equipment etc.)
    // are preserved.
    const updates = {};
    for (const d of DOCTRINES) {
      for (const tid of TRAITS_BY_DOCTRINE[d]) {
        updates[`system.traits.${d}.${tid}.points`] = 0;
      }
    }
    await this.actor.update(updates);
  }
}
