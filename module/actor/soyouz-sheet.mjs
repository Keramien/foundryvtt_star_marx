import { SYSTEM_ID, SOYOUZ_TRAITS, SOYOUZ_POSTES } from "../helpers/config.mjs";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

// Sheet for the `soyouz` Actor subtype (player ship).
//
// Layout mirrors the Kamarade sheet: a static header + a tabbed body with
// five panels (presentation, equipage, traits, signes, soute). The `tabs`
// template is shared with the Kamarade sheet — it's purely rendering the
// tab nav from the `tabs` context variable.
//
// Items: only `signe_soyouz` and `barda` are tracked as list sections; any
// other item type dropped is still embedded (future-proofing). The `soute`
// tab is barda-only by design — it replaces the Kamarade's full equipement
// panel.
export class SoyouzSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["star-marx", "sheet", "actor", "soyouz"],
    position: { width: 760, height: 820 },
    window: { resizable: true, contentClasses: ["star-marx-content"] },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      itemCreate:   SoyouzSheet.#onItemCreate,
      itemEdit:     SoyouzSheet.#onItemEdit,
      itemDelete:   SoyouzSheet.#onItemDelete,
      crewRemove:   SoyouzSheet.#onCrewRemove,
      crewOpen:     SoyouzSheet.#onCrewOpen,
      resetTraits:  SoyouzSheet.#onResetTraits,
      rollTrait:    SoyouzSheet.#onRollTrait,
      helpTrait:    SoyouzSheet.#onHelpTrait
    }
  };

  static PARTS = {
    header:       { template: `systems/${SYSTEM_ID}/templates/actor/parts/soyouz/header.hbs` },
    tabs:         { template: `systems/${SYSTEM_ID}/templates/actor/parts/tabs.hbs` },
    presentation: { template: `systems/${SYSTEM_ID}/templates/actor/parts/soyouz/presentation.hbs`, scrollable: [""] },
    equipage:     { template: `systems/${SYSTEM_ID}/templates/actor/parts/soyouz/equipage.hbs`,     scrollable: [""] },
    traits:       { template: `systems/${SYSTEM_ID}/templates/actor/parts/soyouz/traits.hbs`,       scrollable: [""] },
    signes:       { template: `systems/${SYSTEM_ID}/templates/actor/parts/soyouz/signes.hbs`,       scrollable: [""] },
    soute:        { template: `systems/${SYSTEM_ID}/templates/actor/parts/soyouz/soute.hbs`,        scrollable: [""] }
  };

  static TABS = {
    primary: {
      tabs: [
        { id: "presentation", icon: "fa-solid fa-id-card",     label: "STARMARX.Soyouz.Tabs.Presentation" },
        { id: "equipage",     icon: "fa-solid fa-users",       label: "STARMARX.Soyouz.Tabs.Equipage" },
        { id: "traits",       icon: "fa-solid fa-dice-d6",     label: "STARMARX.Soyouz.Tabs.Traits" },
        { id: "signes",       icon: "fa-solid fa-star",        label: "STARMARX.Soyouz.Tabs.Signes" },
        { id: "soute",        icon: "fa-solid fa-box-archive", label: "STARMARX.Soyouz.Tabs.Soute" }
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

    context.traits = SOYOUZ_TRAITS.map(tid => {
      const row = sys.traits?.[tid] ?? {};
      return {
        id: tid,
        labelKey:    `STARMARX.Soyouz.Traits.${capitalize(tid)}`,
        scorePath:   `system.traits.${tid}.score`,
        bonusPath:   `system.traits.${tid}.bonus`,
        avariesPath: `system.traits.${tid}.avaries`,
        score:   row.score   ?? 0,
        bonus:   row.bonus   ?? 0,
        avaries: row.avaries ?? 0,
        total:   row.total   ?? 0
      };
    });

    // Total-traits badge: 0 = balanced creation. Deviations are flagged red.
    context.traitTotal = sys.traitTotal ?? 0;
    context.traitTotalBalanced = context.traitTotal === 0;

    context.damageFromOrgue = sys.damageFromOrgue ?? "1";

    context.signes = actor.itemTypes.signe_soyouz ?? [];
    context.bardas = actor.itemTypes.barda ?? [];

    context.postes = SOYOUZ_POSTES.map(id => {
      const uuids = sys.postes?.[id] ?? [];
      return {
        id,
        labelKey: `STARMARX.Soyouz.Postes.${capitalize(id)}`,
        members: uuids.map(uuid => {
          const a = fromUuidSync(uuid);
          return {
            uuid,
            name: a?.name ?? game.i18n.localize("STARMARX.Soyouz.Crew.Unknown"),
            img:  a?.img  ?? "icons/svg/mystery-man.svg",
            missing: !a
          };
        })
      };
    });

    context.tabs = this._prepareTabs("primary");
    return context;
  }

  // Ensures each content part gets its `tab` metadata (id, group, cssClass).
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    if (context.tabs?.[partId]) context.tab = context.tabs[partId];
    return context;
  }

  // --- Drag & drop ---

  async _onDropItem(event, data) {
    const item = await Item.implementation.fromDropData(data);
    if (!item) return;
    return this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
  }

  // Kamarades can be dropped onto a post. The drop target's `data-poste`
  // attribute (set on the outer `.poste` div) tells us which list to append
  // the new UUID to.
  async _onDropActor(event, data) {
    const actor = await Actor.implementation.fromDropData(data);
    if (!actor) return;
    if (actor.type !== "kamarade") {
      ui.notifications.warn(game.i18n.localize("STARMARX.Soyouz.Notifications.OnlyKamaradeCrew"));
      return false;
    }

    const posteEl = event.target.closest("[data-poste]");
    const posteId = posteEl?.dataset?.poste;
    if (!posteId || !SOYOUZ_POSTES.includes(posteId)) {
      ui.notifications.warn(game.i18n.localize("STARMARX.Soyouz.Notifications.DropOnPoste"));
      return false;
    }

    const uuid = actor.uuid;
    const current = foundry.utils.deepClone(this.actor.system.postes?.[posteId] ?? []);
    if (current.includes(uuid)) return false;
    current.push(uuid);
    return this.actor.update({ [`system.postes.${posteId}`]: current });
  }

  // --- Actions ---

  static async #onItemCreate(event, target) {
    const type = target.dataset.itemType ?? "signe_soyouz";
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

  static async #onCrewRemove(event, target) {
    const posteId = target.closest("[data-poste]")?.dataset.poste;
    const uuid = target.closest("[data-uuid]")?.dataset.uuid;
    if (!posteId || !uuid) return;
    const current = (this.actor.system.postes?.[posteId] ?? []).filter(u => u !== uuid);
    await this.actor.update({ [`system.postes.${posteId}`]: current });
  }

  static async #onCrewOpen(event, target) {
    const uuid = target.closest("[data-uuid]")?.dataset.uuid;
    if (!uuid) return;
    const a = await fromUuid(uuid);
    a?.sheet?.render(true);
  }

  // Zero every Trait score. Bonuses and avaries are preserved — the reset
  // is only about rebalancing the base scores (e.g. rebuilding from 0).
  static async #onResetTraits(event, target) {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("STARMARX.Soyouz.Action.ResetTraitsTitle") },
      content: `<p>${game.i18n.localize("STARMARX.Soyouz.Action.ResetTraitsConfirm")}</p>`
    });
    if (!confirmed) return;

    const updates = {};
    for (const tid of SOYOUZ_TRAITS) updates[`system.traits.${tid}.score`] = 0;
    await this.actor.update(updates);
  }

  // Roll 2d6 + trait.total for one ship Trait. Mirrors the Kamarade roll
  // (same chat format and threshold) so the two sheets feel consistent —
  // the GM can apply narrative context around it.
  static async #onRollTrait(event, target) {
    const traitId = target.dataset.trait;
    const trait = this.actor.system.traits?.[traitId];
    if (!trait) return;

    const total = trait.total ?? 0;
    const roll = await new Roll("2d6 + @total", { total }).evaluate();

    const threshold = 9;
    const success = roll.total >= threshold;
    const traitLabel = game.i18n.localize(`STARMARX.Soyouz.Traits.${capitalize(traitId)}`);
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

  static async #onHelpTrait(event, target) {
    ui.notifications.info(game.i18n.localize("STARMARX.Sheet.Action.HelpTraitTodo"));
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
