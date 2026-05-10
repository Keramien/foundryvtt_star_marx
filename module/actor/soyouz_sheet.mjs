import {
  SYSTEM_ID,
  SOYOUZ_TRAITS,
  SOYOUZ_POSTES,
  soyouzDamageFromOrgue
} from "../helpers/config.mjs";
import { openStarMarxImagePicker } from "../helpers/image-picker.mjs";
import {
  KAMARADE_ZLOTY_ROLL_OPTIONS,
  computeKamaradeHelpModifier,
  getKamaradeHelpRollOptionConfigs,
  getKamaradeZlotyRollOptionConfigs,
  normalizeKamaradeHelpRollOptions,
  normalizeKamaradePreRollOptions
} from "../helpers/kamarade-pre-roll.mjs";
import {
  STAR_MARX_ROLL_THRESHOLD,
  buildStarMarxRollFormula,
  buildStarMarxRollOutcomeFlavor,
  evaluateStarMarxRollOutcome,
  extractRollDiceValues
} from "../helpers/roll-outcome.mjs";
import {
  SOYOUZ_ROLL_ACTOR_OPTIONS,
  getSoyouzActorTraitKey,
  getSoyouzTraitRollConfig,
  parseSoyouzActorTraitKey
} from "../helpers/soyouz-roll-config.mjs";
import { computeKamaradeZlotysBonus, hasKamaradeSigne, normalizeSignSlug } from "./kamarade.mjs";
import { resolveKamaradeTraitRollModifiers } from "./kamarade-roll-modifiers.mjs";

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
      editImage:    SoyouzSheet.#onEditImage,
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

  _onRender(context, options) {
    super._onRender(context, options);
    this.element
      .querySelector("[data-health-value]")
      ?.addEventListener("change", this.#onHealthValueChange.bind(this));
  }

  async #onHealthValueChange(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isEditable) return;

    const max = this.actor.system.health.max ?? 0;
    const rawValue = Number(event.currentTarget.value);
    const currentValue = Number.isFinite(rawValue) ? rawValue : 0;
    const boundedValue = Math.max(0, Math.min(max, currentValue));
    event.currentTarget.value = boundedValue;

    await this.actor.update({ "system.health.offset": boundedValue - max });
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

    const targetedEnemy = SoyouzSheet.#getTargetedEnemy();
    const preRoll = await SoyouzSheet.#promptPreRollOptions({
      soyouz: this.actor,
      traitId,
      allowIcePick: SoyouzSheet.#canUseIcePick({ targetedEnemy }),
      includeHelp: false
    });
    if (!preRoll) return;

    const context = await SoyouzSheet.#resolvePreRollContext({
      soyouz: this.actor,
      traitId,
      preRoll
    });
    if (!context) return;
    if (!SoyouzSheet.#isPreRollOptionAllowed(preRoll, { selectedActor: context.actor, targetedEnemy })) return;
    if (!await SoyouzSheet.#applyPreRollActorUpdates(context.actor, preRoll)) return;

    const modifiers = context.actorTrait
      ? await resolveKamaradeTraitRollModifiers(context.actor, {
        doctrine: context.actorTrait.doctrine,
        traitId: context.actorTrait.traitId,
        combat: game.combat,
        consume: true
      })
      : emptyModifiers();

    const roll = await new Roll(buildStarMarxRollFormula(preRoll.baseFormula, [
      context.actorTraitTotal,
      context.shipTraitTotal,
      preRoll.contextualBonus,
      modifiers.rollBonus,
      preRoll.rollBonus
    ])).evaluate();

    const outcome = evaluateStarMarxRollOutcome(roll);
    const flavor = `<strong>${context.shipTraitLabel}</strong>
      ${buildStarMarxRollOutcomeFlavor(outcome)}
      <small>(${game.i18n.localize("STARMARX.Roll.Threshold")} ${STAR_MARX_ROLL_THRESHOLD})</small>`;
    const rollBreakdown = {
      rollRows: SoyouzSheet.#buildRollDetailRows({
        roll,
        actor: context.actor,
        actorTraitLabel: context.actorTraitLabel,
        actorTraitTotal: context.actorTraitTotal,
        shipTraitLabel: context.shipTraitLabel,
        shipTraitTotal: context.shipTraitTotal,
        modifiers,
        preRoll
      }),
      damage: SoyouzSheet.#buildDamageBreakdown({
        actor: context.actor,
        actorTrait: context.actorTrait,
        shipTraitLabel: context.shipTraitLabel,
        shipTraitTotal: context.shipTraitTotal,
        rollConfig: context.rollConfig,
        modifiers,
        preRoll
      })
    };

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor,
      flags: { [SYSTEM_ID]: { rollBreakdown } }
    });
  }

  static async #onHelpTrait(event, target) {
    const traitId = target.dataset.trait;
    const trait = this.actor.system.traits?.[traitId];
    if (!trait) return;

    const preRoll = await SoyouzSheet.#promptPreRollOptions({
      soyouz: this.actor,
      traitId,
      allowIcePick: false,
      includeHelp: true
    });
    if (!preRoll) return;

    const context = await SoyouzSheet.#resolvePreRollContext({
      soyouz: this.actor,
      traitId,
      preRoll
    });
    if (!context) return;
    if (!SoyouzSheet.#isPreRollOptionAllowed(preRoll, { selectedActor: context.actor, targetedEnemy: null })) return;
    if (!await SoyouzSheet.#applyPreRollActorUpdates(context.actor, preRoll)) return;

    const roll = await new Roll(buildStarMarxRollFormula(preRoll.baseFormula, [
      context.actorTraitTotal,
      context.shipTraitTotal,
      preRoll.contextualBonus
    ])).evaluate();
    const outcome = evaluateStarMarxRollOutcome(roll, { threshold: preRoll.help.threshold });
    const helpLabel = game.i18n.localize(preRoll.help.labelKey);
    const flavor = `<strong>${game.i18n.format("STARMARX.Roll.Help.FlavorTitle", {
        trait: context.shipTraitLabel,
        help: helpLabel
      })}</strong>
      ${buildStarMarxRollOutcomeFlavor(outcome)}
      <small>(${game.i18n.localize("STARMARX.Roll.Threshold")} ${preRoll.help.threshold})</small>`;

    const helpModifier = computeKamaradeHelpModifier(preRoll.help, outcome);
    const rollBreakdown = {
      rollRows: SoyouzSheet.#buildRollDetailRows({
        roll,
        actor: context.actor,
        actorTraitLabel: context.actorTraitLabel,
        actorTraitTotal: context.actorTraitTotal,
        shipTraitLabel: context.shipTraitLabel,
        shipTraitTotal: context.shipTraitTotal,
        modifiers: null,
        preRoll
      }),
      help: SoyouzSheet.#buildHelpBreakdown({
        help: preRoll.help,
        helpModifier,
        outcome
      })
    };

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor,
      flags: { [SYSTEM_ID]: { rollBreakdown } }
    });
  }

  static async #promptPreRollOptions({ soyouz, traitId, allowIcePick, includeHelp = false }) {
    const rollConfig = getSoyouzTraitRollConfig(traitId);
    const actorHtml = await SoyouzSheet.#buildActorOptionsHtml(soyouz, rollConfig);
    const traitHtml = SoyouzSheet.#buildActorTraitOptionsHtml(rollConfig);
    const zlotyHtml = getKamaradeZlotyRollOptionConfigs()
      .map(option => {
        const unavailable = option.key === KAMARADE_ZLOTY_ROLL_OPTIONS.picAGlace && !allowIcePick;
        const disabled = unavailable ? " disabled" : "";
        const label = game.i18n.format(option.optionLabelKey ?? option.labelKey, { cost: option.cost });
        return `<option value="${option.key}"${disabled}>${SoyouzSheet.#escapeHtml(label)}</option>`;
      })
      .join("");
    const helpHtml = includeHelp
      ? `
        <label class="star-marx-pre-roll__field">
          <span>${game.i18n.localize("STARMARX.Roll.PreRoll.HelpOption")}</span>
          <select name="helpOption">
            ${getKamaradeHelpRollOptionConfigs().map(option => {
              const label = game.i18n.localize(option.optionLabelKey);
              return `<option value="${option.key}">${SoyouzSheet.#escapeHtml(label)}</option>`;
            }).join("")}
          </select>
        </label>`
      : "";

    const content = `
      <form class="star-marx-pre-roll">
        ${helpHtml}
        <label class="star-marx-pre-roll__field">
          <span>${game.i18n.localize("STARMARX.Roll.Soyouz.Actor")}</span>
          <select name="actorUuid">${actorHtml}</select>
        </label>
        <label class="star-marx-pre-roll__field">
          <span>${game.i18n.localize("STARMARX.Roll.Soyouz.ActorTrait")}</span>
          <select name="actorTrait">${traitHtml}</select>
        </label>
        <label class="star-marx-pre-roll__field">
          <span>${game.i18n.localize("STARMARX.Roll.PreRoll.ContextualBonus")}</span>
          <input type="number" name="contextualBonus" value="0" step="1">
        </label>
        <label class="star-marx-pre-roll__field">
          <span>${game.i18n.localize("STARMARX.Roll.PreRoll.ZlotyOption")}</span>
          <select name="zlotyOption">${zlotyHtml}</select>
        </label>
        <p class="star-marx-pre-roll__hint">${game.i18n.localize("STARMARX.Roll.Soyouz.ZlotyHint")}</p>
      </form>`;

    return foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n.localize("STARMARX.Roll.PreRoll.Title") },
      content,
      modal: true,
      rejectClose: false,
      ok: {
        label: game.i18n.localize("STARMARX.Roll.PreRoll.Roll"),
        callback: (event, button) => {
          const preRoll = normalizeKamaradePreRollOptions({
            contextualBonus: button.form.elements.contextualBonus.valueAsNumber,
            zlotyOption: button.form.elements.zlotyOption.value
          });
          preRoll.actorUuid = button.form.elements.actorUuid.value;
          preRoll.actorTrait = parseSoyouzActorTraitKey(button.form.elements.actorTrait.value);
          if (includeHelp) {
            preRoll.help = normalizeKamaradeHelpRollOptions(button.form.elements.helpOption.value);
          }
          return preRoll;
        }
      }
    });
  }

  static async #buildActorOptionsHtml(soyouz, rollConfig) {
    const options = [{
      value: SOYOUZ_ROLL_ACTOR_OPTIONS.computer,
      label: game.i18n.localize("STARMARX.Roll.Soyouz.Computer")
    }];
    const uuids = Array.from(new Set(soyouz.system.postes?.[rollConfig.poste] ?? []));
    for (const uuid of uuids) {
      const actor = await SoyouzSheet.#resolveUuid(uuid);
      if (actor?.type !== "kamarade") continue;
      options.push({ value: uuid, label: actor.name });
    }

    return options
      .map(option => `<option value="${SoyouzSheet.#escapeHtml(option.value)}">${SoyouzSheet.#escapeHtml(option.label)}</option>`)
      .join("");
  }

  static #buildActorTraitOptionsHtml(rollConfig) {
    if (rollConfig.actorTraits.length === 0) {
      return `<option value="">${SoyouzSheet.#escapeHtml(game.i18n.localize("STARMARX.Roll.Soyouz.NoActorTrait"))}</option>`;
    }

    return rollConfig.actorTraits
      .map(actorTrait => {
        const label = game.i18n.localize(SoyouzSheet.#getKamaradeTraitLabelKey(actorTrait));
        const value = getSoyouzActorTraitKey(actorTrait);
        return `<option value="${SoyouzSheet.#escapeHtml(value)}">${SoyouzSheet.#escapeHtml(label)}</option>`;
      })
      .join("");
  }

  static async #resolvePreRollContext({ soyouz, traitId, preRoll }) {
    const rollConfig = getSoyouzTraitRollConfig(traitId);
    const shipTrait = soyouz.system.traits?.[traitId];
    if (!shipTrait) return null;

    const actor = preRoll.actorUuid === SOYOUZ_ROLL_ACTOR_OPTIONS.computer
      ? null
      : await SoyouzSheet.#resolveUuid(preRoll.actorUuid);
    if (preRoll.actorUuid !== SOYOUZ_ROLL_ACTOR_OPTIONS.computer && actor?.type !== "kamarade") {
      ui.notifications.warn(game.i18n.localize("STARMARX.Roll.Soyouz.KamaradeMissing"));
      return null;
    }

    const actorTrait = actor ? SoyouzSheet.#resolveActorTrait(rollConfig, preRoll.actorTrait) : null;
    const actorTraitTotal = actorTrait
      ? (actor.system.traits?.[actorTrait.doctrine]?.[actorTrait.traitId]?.total ?? 0)
      : 0;
    const actorTraitLabel = actorTrait
      ? game.i18n.localize(SoyouzSheet.#getKamaradeTraitLabelKey(actorTrait))
      : "";

    return {
      rollConfig,
      actor,
      actorTrait,
      actorTraitTotal,
      actorTraitLabel,
      shipTraitTotal: shipTrait.total ?? 0,
      shipTraitLabel: game.i18n.localize(`STARMARX.Soyouz.Traits.${capitalize(traitId)}`)
    };
  }

  static #resolveActorTrait(rollConfig, actorTrait) {
    const key = getSoyouzActorTraitKey(actorTrait);
    return rollConfig.actorTraits.find(candidate => getSoyouzActorTraitKey(candidate) === key)
      ?? rollConfig.actorTraits[0]
      ?? null;
  }

  static #isPreRollOptionAllowed(preRoll, { selectedActor, targetedEnemy }) {
    if (!selectedActor && preRoll.zlotyCost > 0) {
      ui.notifications.warn(game.i18n.localize("STARMARX.Roll.Soyouz.ComputerCannotSpendZlotys"));
      return false;
    }

    if (preRoll.zlotyOption !== KAMARADE_ZLOTY_ROLL_OPTIONS.picAGlace) return true;
    if (selectedActor && SoyouzSheet.#canUseIcePick({ targetedEnemy })) return true;

    ui.notifications.warn(game.i18n.localize("STARMARX.Roll.PreRoll.PicAGlaceUnavailable"));
    return false;
  }

  static #canUseIcePick({ targetedEnemy }) {
    return !!targetedEnemy && SoyouzSheet.#isCombatActive(game.combat);
  }

  static #isCombatActive(combat) {
    return !!combat && combat.started !== false;
  }

  static async #applyPreRollActorUpdates(actor, preRoll) {
    if (!actor) return true;

    const updates = {};
    if (preRoll.zlotyCost > 0) {
      const currentZlotys = actor.system.zlotys?.value ?? 0;
      if (currentZlotys < preRoll.zlotyCost) {
        ui.notifications.warn(game.i18n.format("STARMARX.Roll.PreRoll.NotEnoughZlotys", {
          actor: actor.name,
          cost: preRoll.zlotyCost
        }));
        return false;
      }

      const base = actor.system.zlotys?.base ?? 0;
      const bonus = computeKamaradeZlotysBonus(actor);
      updates["system.zlotys.offset"] = currentZlotys - preRoll.zlotyCost - base - bonus;
    }

    if (preRoll.setHealthToOne) {
      const max = actor.system.health?.max ?? 0;
      if (max > 0) updates["system.health.offset"] = 1 - max;
    }

    if (Object.keys(updates).length > 0) await actor.update(updates);
    return true;
  }

  static #buildRollDetailRows({
    roll,
    actor,
    actorTraitLabel,
    actorTraitTotal,
    shipTraitLabel,
    shipTraitTotal,
    modifiers,
    preRoll
  }) {
    const diceValues = extractRollDiceValues(roll);
    const diceTotal = diceValues.reduce((sum, value) => sum + value, 0);
    const diceDetail = diceValues.length
      ? `${diceValues.join(" + ")} = ${diceTotal}`
      : "2d6";
    const rows = [
      { text: `${game.i18n.localize("STARMARX.Roll.Dice")} ${diceDetail}` }
    ];

    if (actor && actorTraitTotal !== 0) {
      rows.push({
        value: actorTraitTotal,
        label: game.i18n.format("STARMARX.Roll.Soyouz.KamaradeTraitBonus", {
          trait: actorTraitLabel,
          actor: actor.name
        })
      });
    }
    if (shipTraitTotal !== 0) {
      rows.push({
        value: shipTraitTotal,
        label: game.i18n.format("STARMARX.Roll.Soyouz.ShipTraitBonus", { trait: shipTraitLabel })
      });
    }
    if (preRoll?.detailKey) {
      rows.push({ text: game.i18n.localize(preRoll.detailKey) });
    }
    if (preRoll?.contextualBonus !== 0) {
      rows.push({
        value: preRoll.contextualBonus,
        label: game.i18n.localize("STARMARX.Roll.PreRoll.ContextualBonusDetail")
      });
    }
    for (const source of modifiers?.sources ?? []) {
      const rollBonus = source.rollBonus ?? 0;
      if (rollBonus === 0) continue;
      rows.push({
        value: rollBonus,
        label: game.i18n.localize(source.labelKey)
      });
    }
    if (preRoll?.rollBonus !== 0) {
      rows.push({
        value: preRoll.rollBonus,
        label: game.i18n.localize(preRoll.labelKey)
      });
    }

    return rows;
  }

  static #buildDamageBreakdown({
    actor,
    actorTrait,
    shipTraitLabel,
    shipTraitTotal,
    rollConfig,
    modifiers,
    preRoll
  }) {
    if (rollConfig.damageMode !== "orgueDeStaline" && rollConfig.damageMode !== "tetris") return null;

    const baseDamage = Number(soyouzDamageFromOrgue(shipTraitTotal));
    if (!Number.isFinite(baseDamage)) return null;

    const terms = [{
      value: baseDamage,
      label: game.i18n.format("STARMARX.Roll.Soyouz.ShipDamageFromTrait", {
        trait: shipTraitLabel,
        total: shipTraitTotal
      })
    }];
    if (actor && actorTrait?.doctrine === "marteau" && actorTrait.traitId === "ak47") {
      const manualBonus = actor.system.damage?.ak47?.bonus ?? 0;
      if (manualBonus !== 0) {
        terms.push({
          value: manualBonus,
          label: game.i18n.localize("STARMARX.Roll.ManualDamageBonus")
        });
      }
      if (hasKamaradeSigne(actor, "precis")) {
        terms.push({ value: 1, label: SoyouzSheet.#getSigneName(actor, "precis") });
      }
    }
    for (const source of modifiers?.sources ?? []) {
      const damageBonus = source.damageBonus ?? 0;
      if (damageBonus === 0) continue;
      terms.push({
        value: damageBonus,
        label: game.i18n.localize(source.labelKey)
      });
    }

    let damage = terms.reduce((sum, term) => sum + term.value, 0);
    const rows = terms.map(term => ({
      value: term.value,
      label: term.label,
      forceSign: true
    }));
    if ((preRoll?.damageMultiplier ?? 1) !== 1) {
      damage *= preRoll.damageMultiplier;
      rows.push({
        text: game.i18n.format(preRoll.damageDetailKey, {
          multiplier: preRoll.damageMultiplier,
          source: game.i18n.localize(preRoll.labelKey)
        })
      });
    }

    return {
      label: game.i18n.localize("STARMARX.Roll.Damage"),
      toggleLabel: game.i18n.localize("STARMARX.Roll.DamageToggleHint"),
      total: damage,
      rows
    };
  }

  static #buildHelpBreakdown({ help, helpModifier, outcome }) {
    const helpLabel = game.i18n.localize(help.labelKey);
    const labelKey = outcome.success
      ? "STARMARX.Roll.Help.SuccessLabel"
      : "STARMARX.Roll.Help.FailureLabel";

    return {
      label: game.i18n.format(labelKey, { help: helpLabel }),
      total: helpModifier
    };
  }

  static #getKamaradeTraitLabelKey({ doctrine, traitId }) {
    return `STARMARX.Trait.${capitalize(doctrine)}.${capitalize(traitId)}`;
  }

  static #getTargetedEnemy() {
    const targets = Array.from(game.user?.targets ?? []);
    return targets.find(target => target?.actor?.type === "enemy")?.actor ?? null;
  }

  static #getSigneName(actor, slug) {
    const item = Array.from(actor.items ?? []).find(entry =>
      entry?.type === "signe" && normalizeSignSlug(entry.name) === slug
    );
    return item?.name ?? slug;
  }

  static async #resolveUuid(uuid) {
    if (!uuid || typeof fromUuid !== "function") return null;
    try {
      return await fromUuid(uuid);
    } catch (error) {
      console.warn("Star Marx | Failed to resolve Soyouz roll actor", uuid, error);
      return null;
    }
  }

  static #escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function emptyModifiers() {
  return { rollBonus: 0, damageBonus: 0, sources: [] };
}
