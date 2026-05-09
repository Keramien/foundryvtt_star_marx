import {
  DOCTRINES,
  TRAITS_BY_DOCTRINE,
  SYSTEM_ID
} from "../helpers/config.mjs";
import { openStarMarxImagePicker } from "../helpers/image-picker.mjs";
import { resolveKamaradeTraitRollModifiers } from "./kamarade-roll-modifiers.mjs";
import {
  computeKamaradeZlotysBonus,
  getKamaradeFearResistanceTraitId,
  getKamaradeHealthTraitId
} from "./kamarade.mjs";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class KamaradeSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["star-marx", "sheet", "actor", "kamarade"],
    position: { width: 760, height: 820 },
    window: { resizable: true, contentClasses: ["star-marx-content"] },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      editImage:        KamaradeSheet.#onEditImage,
      itemCreate:       KamaradeSheet.#onItemCreate,
      itemCreateBonus:  KamaradeSheet.#onItemCreateBonus,
      itemEdit:         KamaradeSheet.#onItemEdit,
      itemDelete:       KamaradeSheet.#onItemDelete,
      openCompendium:   KamaradeSheet.#onOpenCompendium,
      resetTraits:      KamaradeSheet.#onResetTraits,
      rollFearResistance: KamaradeSheet.#onRollFearResistance,
      rollTrait:        KamaradeSheet.#onRollTrait,
      helpTrait:        KamaradeSheet.#onHelpTrait
    }
  };

  static PARTS = {
    header:       { template: `systems/${SYSTEM_ID}/templates/actor/parts/header.hbs` },
    tabs:         { template: `systems/${SYSTEM_ID}/templates/actor/parts/tabs.hbs` },
    presentation: { template: `systems/${SYSTEM_ID}/templates/actor/parts/presentation.hbs`, scrollable: [""] },
    traits:       { template: `systems/${SYSTEM_ID}/templates/actor/parts/traits.hbs`,       scrollable: [""] },
    signes:       { template: `systems/${SYSTEM_ID}/templates/actor/parts/signes.hbs`,       scrollable: [""] },
    clefs:        { template: `systems/${SYSTEM_ID}/templates/actor/parts/clefs.hbs`,        scrollable: [""] },
    equipement:   { template: `systems/${SYSTEM_ID}/templates/actor/parts/equipement.hbs`,   scrollable: [""] }
  };

  static TABS = {
    primary: {
      tabs: [
        { id: "presentation", icon: "fa-solid fa-id-card",   label: "STARMARX.Sheet.Tabs.Presentation" },
        { id: "traits",       icon: "fa-solid fa-dice-d6",   label: "STARMARX.Sheet.Tabs.Traits" },
        { id: "signes",       icon: "fa-solid fa-star",      label: "STARMARX.Sheet.Tabs.Signes" },
        { id: "clefs",        icon: "fa-solid fa-key",       label: "STARMARX.Sheet.Tabs.Clefs" },
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

    context.race  = actor.itemTypes.race?.[0] ?? null;
    // Soft rule: a race may advertise which doctrines it is "compatible" with.
    // We don't prevent a player from choosing any doctrine, but the sheet will
    // flag the mismatch with a warning badge.
    context.doctrineMismatch = !!context.race
      && context.race.system.doctrinesAutorisees?.[context.chosenDoctrine] === false;
    context.signes = this.#partitionSignes(actor);
    context.clefs = this.#partitionClefs(actor);
    context.kontrebandes = actor.items.filter(i => i.type === "kontrebande");
    context.bardas       = actor.items.filter(i => i.type === "barda");

    context.signesMax = sys.signesMax ?? sys.limits?.signes ?? 2;
    context.clefsMax = sys.clefsMax ?? sys.limits?.clefs ?? 5;
    context.kontrebandeMax = sys.kontrebandeMax ?? sys.limits?.kontrebande ?? 5;
    context.healthFormula = this.#buildHealthFormula(actor);
    context.fearResistanceFormula = this.#buildFearResistanceFormula(actor);

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

  _onRender(context, options) {
    super._onRender(context, options);
    this.element
      .querySelector("[data-health-value]")
      ?.addEventListener("change", this.#onHealthValueChange.bind(this));
    this.element
      .querySelector("[data-zlotys-value]")
      ?.addEventListener("change", this.#onZlotysValueChange.bind(this));
  }

  // Build an ordered list of doctrine groups with chosen doctrine first.
  // Each trait exposes purchased ranks, automatic bonuses, manual bonuses,
  // optional rule overrides, and the final computed total.
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
          manualBonusPath: `system.traits.${d}.${tid}.manualBonus`,
          base: t.points ?? t.base ?? 0,
          autoBonus: t.autoBonus ?? 0,
          manualBonus: t.manualBonus ?? t.bonus ?? 0,
          optionalMax: t.optionalMax,
          hasOptionalValue: Number.isFinite(t.optionalMax),
          total: t.total ?? 0
        };
      })
    }));
  }

  // Three buckets:
  //   raciaux : signes granted by the current race (category === "racial")
  //   bonus   : signes granted externally (equipment, GM) — system.bonus = true
  //   generaux: player-chosen signes, counted against signesMax
  #partitionSignes(actor) {
    const signes = actor.items.filter(i => i.type === "signe");
    const raciaux = signes.filter(i => i.system.category === "racial");
    const bonus = signes.filter(i => i.system.bonus && i.system.category !== "racial");
    const generaux = signes.filter(i =>
      i.system.category !== "racial" && !i.system.bonus
    );
    return { raciaux, bonus, generaux };
  }

  // Three buckets mirroring signes:
  //   raciales : racial keys, usually granted by the current race
  //   bonus    : keys granted externally and ignored by the cap
  //   generales: player-chosen keys, counted against clefsMax
  #partitionClefs(actor) {
    const clefs = actor.items.filter(i => i.type === "clef");
    const raciales = clefs.filter(i => this.#isRacialClef(i));
    const bonus = clefs.filter(i => i.system.bonus && !this.#isRacialClef(i));
    const generales = clefs.filter(i =>
      !this.#isRacialClef(i) && !i.system.bonus
    );
    return { raciales, bonus, generales };
  }

  #isRacialClef(item) {
    return !!item?.system?.racialOf;
  }

  #capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  #buildHealthFormula(actor) {
    const traitId = getKamaradeHealthTraitId(actor);
    const trait = game.i18n.localize(`STARMARX.Trait.Marteau.${this.#capitalize(traitId)}`).toLocaleUpperCase();
    return game.i18n.format("STARMARX.Actor.Health.Formula", { trait });
  }

  #buildFearResistanceFormula(actor) {
    const traitId = getKamaradeFearResistanceTraitId(actor);
    const trait = game.i18n.localize(`STARMARX.Trait.Marteau.${this.#capitalize(traitId)}`).toLocaleUpperCase();
    return game.i18n.format("STARMARX.Actor.FearResistance.Formula", { trait });
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

  async #onZlotysValueChange(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isEditable) return;

    const base = this.actor.system.zlotys?.base ?? 0;
    const bonus = computeKamaradeZlotysBonus(this.actor);
    const rawValue = Number(event.currentTarget.value);
    const currentValue = Number.isFinite(rawValue) ? rawValue : 0;
    const boundedValue = Math.max(0, currentValue);
    event.currentTarget.value = boundedValue;

    await this.actor.update({ "system.zlotys.offset": boundedValue - base - bonus });
  }

  // --- Drag & drop ---
  //
  // ActorSheetV2 calls `_onDropItem` when an Item is dropped (either from the
  // sidebar, another actor, or a compendium). We fully take over item creation
  // here (don't chain to super) so the rules — exactly one race, soft
  // signes/clefs caps, no direct drop of racial signes — are always handled.
  async _onDropItem(event, data) {
    const item = await Item.implementation.fromDropData(data);
    if (!item) return;

    switch (item.type) {
      case "race":  return this.#onDropRace(item);
      case "signe": return this.#onDropSigne(item);
      case "clef":  return this.#onDropClef(item);
      case "kontrebande": return this.#onDropKontrebande(item);
      default:      return this.#createEmbedded(item);
    }
  }

  // Shared helper: drop an item on the actor by copying its full data. Using
  // toObject() avoids embedding a compendium reference or a live document.
  async #createEmbedded(item) {
    return this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
  }

  async #createEmbeddedData(data) {
    return this.actor.createEmbeddedDocuments("Item", [data]);
  }

  async #onDropRace(item) {
    const actor = this.actor;

    // Enforce "exactly one race": remove any existing race (_preDelete on the
    // race item will cascade-delete linked racial signes and clefs).
    const existing = actor.itemTypes.race ?? [];
    if (existing.length > 0) {
      await actor.deleteEmbeddedDocuments("Item", existing.map(r => r.id));
    }

    // Copy the dropped race onto the actor.
    const [newRace] = await actor.createEmbeddedDocuments("Item", [item.toObject()]);

    // Resolve every racial-signe UUID, tag each copy with racialOf so the
    // cascade delete fires when the race is removed, then batch-create.
    const uuids = newRace.system?.signesRacialUuids ?? [];
    const toCreate = [];
    for (const uuid of uuids) {
      if (!uuid) continue;
      try {
        const racialSigne = await fromUuid(uuid);
        if (!racialSigne || racialSigne.type !== "signe") continue;
        const signeData = racialSigne.toObject();
        foundry.utils.setProperty(signeData, "system.category", "racial");
        foundry.utils.setProperty(signeData, "system.racialOf", newRace.id);
        toCreate.push(signeData);
      } catch (err) {
        console.warn("Star Marx | Could not resolve racial signe UUID", uuid, err);
      }
    }
    if (toCreate.length > 0) {
      await actor.createEmbeddedDocuments("Item", toCreate);
    }

    // Resolve mandatory racial-key UUIDs with the same ownership link, so
    // replacing the race removes its granted keys too.
    const clefUuids = newRace.system?.clefsRacialUuids ?? [];
    const clefsToCreate = [];
    for (const uuid of clefUuids) {
      if (!uuid) continue;
      try {
        const racialClef = await fromUuid(uuid);
        if (!racialClef || racialClef.type !== "clef") continue;
        const clefData = racialClef.toObject();
        foundry.utils.setProperty(clefData, "system.racialOf", newRace.id);
        clefsToCreate.push(clefData);
      } catch (err) {
        console.warn("Star Marx | Could not resolve racial clef UUID", uuid, err);
      }
    }
    if (clefsToCreate.length > 0) {
      await actor.createEmbeddedDocuments("Item", clefsToCreate);
    }

    if (existing.length > 0) {
      ui.notifications.info(game.i18n.localize("STARMARX.Notifications.RaceReplaced"));
    }
    return [newRace];
  }

  async #onDropSigne(item) {
    const actor = this.actor;

    if (item.system?.category === "racial") {
      ui.notifications.warn(game.i18n.localize("STARMARX.Notifications.RacialSigneNotDroppable"));
      return false;
    }

    const max = actor.system.signesMax ?? actor.system.limits?.signes ?? 1;
    const isBonus = item.system?.bonus;
    // Cap applies only to player-chosen signes — racial and bonus ones are tracked separately.
    const current = actor.items.filter(i =>
      i.type === "signe" && i.system.category !== "racial" && !i.system.bonus
    ).length;
    if (!isBonus && current >= max) {
      ui.notifications.warn(game.i18n.format("STARMARX.Notifications.SigneLimitReached", { max }));
    }

    return this.#createEmbedded(item);
  }

  async #onDropClef(item) {
    const actor = this.actor;
    const max = actor.system.clefsMax ?? actor.system.limits?.clefs ?? 5;
    const isRacial = this.#isRacialClef(item);
    const isBonus = item.system?.bonus;
    const current = (actor.itemTypes.clef ?? []).filter(i =>
      !this.#isRacialClef(i) && !i.system.bonus
    ).length;

    if (!isRacial && !isBonus && current >= max) {
      ui.notifications.warn(game.i18n.format("STARMARX.Notifications.ClefLimitReached", { max }));
    }

    return this.#createEmbeddedData(item.toObject());
  }

  async #onDropKontrebande(item) {
    const actor = this.actor;
    if (!this.#canAddKontrebande(actor)) return false;
    return this.#createEmbedded(item);
  }

  #canAddKontrebande(actor) {
    const max = actor.system.kontrebandeMax ?? actor.system.limits?.kontrebande ?? 5;
    const current = actor.items.filter(i => i.type === "kontrebande").length;
    if (current >= max) {
      ui.notifications.warn(game.i18n.format("STARMARX.Notifications.KontrebandeLimitReached", { max }));
      return false;
    }
    return true;
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
    const type = target.dataset.itemType;
    if (!type) return;
    if (type === "kontrebande" && !this.#canAddKontrebande(this.actor)) return;
    const name = game.i18n.format("DOCUMENT.New", {
      type: game.i18n.localize(`STARMARX.Item.Type.${type}`)
    });
    const [item] = await this.actor.createEmbeddedDocuments("Item", [{ name, type }]);
    item?.sheet?.render(true);
  }

  // Create a blank signe/clef tagged as a bonus (equipment / GM grant). Shares
  // the payload shape of #onItemCreate but sets system.bonus = true up front
  // so the new doc lands in the Bonus list rather than the player-chosen list.
  static async #onItemCreateBonus(event, target) {
    const type = target.dataset.itemType ?? "signe";
    const name = game.i18n.format("DOCUMENT.New", {
      type: game.i18n.localize(`STARMARX.Item.Type.${type}`)
    });
    const [item] = await this.actor.createEmbeddedDocuments("Item", [{
      name,
      type,
      system: { bonus: true }
    }]);
    item?.sheet?.render(true);
  }

  static async #onOpenCompendium(event, target) {
    event.preventDefault();
    const packName = target.dataset.pack;
    if (!packName) return;

    const pack = game.packs.get(`${SYSTEM_ID}.${packName}`);
    if (!pack) {
      ui.notifications.warn(game.i18n.format("STARMARX.Notifications.CompendiumUnavailable", { pack: packName }));
      return;
    }

    ui.sidebar?.activateTab?.("compendium");
    pack.render(true);
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

  static async #onRollFearResistance(event, target) {
    const total = this.actor.system.fearResistance?.value ?? 0;
    const roll = await new Roll("2d6 + @total", { total }).evaluate();

    const label = game.i18n.localize("STARMARX.Actor.FearResistance.Label");
    const threshold = game.i18n.localize("STARMARX.Roll.Threshold");
    const hint = game.i18n.localize("STARMARX.Roll.FearResistanceDangerositeHint");
    const flavor = `<strong>${label}</strong>
      <small>(${threshold} 9 - ${hint})</small>`;

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor
    });
  }

  // Roll 2d6 + trait.total for a given trait, post to chat with a
  // success/failure verdict against the default threshold of 9.
  static async #onRollTrait(event, target) {
    const doctrine = target.dataset.doctrine;
    const traitId  = target.dataset.trait;
    const trait = this.actor.system.traits?.[doctrine]?.[traitId];
    if (!trait) return;

    const total = trait.total ?? 0;
    const modifiers = await resolveKamaradeTraitRollModifiers(this.actor, {
      doctrine,
      traitId,
      combat: game.combat,
      consume: true
    });
    const rollBonus = modifiers.rollBonus ?? 0;
    const roll = await new Roll("2d6 + @total + @rollBonus", { total, rollBonus }).evaluate();

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
      <small>(${game.i18n.localize("STARMARX.Roll.Threshold")} ${threshold})</small>
      ${KamaradeSheet.#buildRollModifierFlavor(modifiers)}`;

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor
    });
  }

  // Help roll — placeholder until the mechanic is designed.
  static async #onHelpTrait(event, target) {
    ui.notifications.info(game.i18n.localize("STARMARX.Sheet.Action.HelpTraitTodo"));
  }

  static #buildRollModifierFlavor(modifiers) {
    if (!modifiers?.sources?.length) return "";

    const lines = modifiers.sources.map(source => {
      const label = game.i18n.localize(source.labelKey);
      return game.i18n.format("STARMARX.Roll.ModifierSummary", {
        source: label,
        rollBonus: source.rollBonus ?? 0,
        damageBonus: source.damageBonus ?? 0
      });
    });
    return `<small>${lines.join("<br>")}</small>`;
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
