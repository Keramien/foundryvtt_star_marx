import {
  DOCTRINES,
  TRAITS_BY_DOCTRINE,
  SYSTEM_ID,
  damageFromRank
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
import { resolveKamaradeTraitRollModifiers } from "./kamarade-roll-modifiers.mjs";
import {
  computeKamaradeDamageCap,
  computeKamaradeZlotysBonus,
  getKamaradeDefaultRaceSlug,
  getKamaradeDefaultRacialSigneSlug,
  getKamaradeFearResistanceTraitId,
  getKamaradeHealthTraitId,
  hasActiveKamaradeSizeSigne,
  hasKamaradeSigne,
  isKamaradeDosAuMurActive,
  normalizeSignSlug
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

    context.race  = actor.itemTypes.race?.[0] ?? this.#buildDefaultRace(actor);
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
    const defaultRacialSigne = this.#buildDefaultRacialSigne(actor);
    const raciaux = signes.filter(i => i.system.category === "racial");
    if (defaultRacialSigne) raciaux.unshift(defaultRacialSigne);
    const bonus = signes.filter(i => i.system.bonus && i.system.category !== "racial");
    const generaux = signes.filter(i =>
      i.system.category !== "racial" && !i.system.bonus
    );
    return { raciaux, bonus, generaux };
  }

  #buildDefaultRace(actor) {
    if (getKamaradeDefaultRaceSlug(actor) !== "humain") return null;
    return {
      id: "default-race-humain",
      img: "icons/svg/mystery-man.svg",
      name: game.i18n.localize("STARMARX.Race.Default.Humain.Name"),
      system: {
        description: game.i18n.localize("STARMARX.Race.Default.Humain.Description"),
        restrictions: game.i18n.localize("STARMARX.Race.Default.Humain.Restrictions")
      },
      isVirtual: true
    };
  }

  #buildDefaultRacialSigne(actor) {
    if (getKamaradeDefaultRacialSigneSlug(actor) !== "humain") return null;
    return {
      id: "default-signe-racial-humain",
      img: "icons/svg/aura.svg",
      name: game.i18n.localize("STARMARX.Signe.Default.Humain.Name"),
      system: {
        category: "racial",
        description: game.i18n.localize("STARMARX.Signe.Default.Humain.Description")
      },
      isVirtual: true
    };
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
    const targetedEnemy = KamaradeSheet.#getTargetedEnemy();
    const preRoll = await KamaradeSheet.#promptPreRollOptions({
      actor: this.actor,
      allowIcePick: false
    });
    if (!preRoll) return;
    if (!KamaradeSheet.#isPreRollOptionAllowed(preRoll, { targetedEnemy: null })) return;
    if (!await KamaradeSheet.#applyPreRollActorUpdates(this.actor, preRoll)) return;

    const total = this.actor.system.fearResistance?.value ?? 0;
    const dangerosite = KamaradeSheet.#getEnemyDangerosite(targetedEnemy);
    const dangerositeModifier = targetedEnemy ? -dangerosite : 0;
    const formula = buildStarMarxRollFormula(preRoll.baseFormula, [
      total,
      preRoll.contextualBonus,
      preRoll.rollBonus,
      dangerositeModifier
    ]);
    const roll = await new Roll(formula).evaluate();
    const outcome = evaluateStarMarxRollOutcome(roll);

    const label = game.i18n.localize("STARMARX.Actor.FearResistance.Label");
    const threshold = game.i18n.localize("STARMARX.Roll.Threshold");
    const hint = game.i18n.localize("STARMARX.Roll.FearResistanceDangerositeHint");
    const flavor = `<strong>${label}</strong>
      ${buildStarMarxRollOutcomeFlavor(outcome)}
      <small>(${threshold} ${STAR_MARX_ROLL_THRESHOLD} - ${hint})</small>`;
    const rollBreakdown = {
      rollRows: KamaradeSheet.#buildRollDetailRows({
        roll,
        traitLabel: label,
        traitTotal: total,
        modifiers: null,
        preRoll,
        targetedEnemy,
        dangerositeModifier
      })
    };

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor,
      flags: { [SYSTEM_ID]: { rollBreakdown } }
    });
  }

  // Roll 2d6 + trait.total for a given trait, post to chat with the
  // critical/success/failure verdict against the default threshold of 9.
  static async #onRollTrait(event, target) {
    const doctrine = target.dataset.doctrine;
    const traitId  = target.dataset.trait;
    if (!this.actor.system.traits?.[doctrine]?.[traitId]) return;

    const targetedEnemy = KamaradeSheet.#getTargetedEnemy();
    const preRoll = await KamaradeSheet.#promptPreRollOptions({
      actor: this.actor,
      allowIcePick: KamaradeSheet.#canUseIcePick({ targetedEnemy })
    });
    if (!preRoll) return;
    if (!KamaradeSheet.#isPreRollOptionAllowed(preRoll, { targetedEnemy })) return;
    if (!await KamaradeSheet.#applyPreRollActorUpdates(this.actor, preRoll)) return;

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
    const dangerosite = KamaradeSheet.#getEnemyDangerosite(targetedEnemy);
    const dangerositeModifier = targetedEnemy ? -dangerosite : 0;
    const formula = buildStarMarxRollFormula(preRoll.baseFormula, [
      total,
      preRoll.contextualBonus,
      rollBonus,
      preRoll.rollBonus,
      dangerositeModifier
    ]);
    const roll = await new Roll(formula).evaluate();

    const outcome = evaluateStarMarxRollOutcome(roll);
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const traitLabel = game.i18n.localize(`STARMARX.Trait.${cap(doctrine)}.${cap(traitId)}`);
    const flavor = `<strong>${traitLabel}</strong>
      ${buildStarMarxRollOutcomeFlavor(outcome)}
      <small>(${game.i18n.localize("STARMARX.Roll.Threshold")} ${STAR_MARX_ROLL_THRESHOLD})</small>`;
    const rollBreakdown = {
      rollRows: KamaradeSheet.#buildRollDetailRows({
        roll,
        traitLabel,
        traitTotal: total,
        modifiers,
        preRoll,
        targetedEnemy,
        dangerositeModifier
      }),
      damage: KamaradeSheet.#buildDamageBreakdown({
        actor: this.actor,
        doctrine,
        traitId,
        traitLabel,
        traitTotal: total,
        modifiers,
        preRoll,
        targetedEnemy
      })
    };

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor,
      flags: { [SYSTEM_ID]: { rollBreakdown } }
    });
  }

  static async #onHelpTrait(event, target) {
    const doctrine = target.dataset.doctrine;
    const traitId = target.dataset.trait;
    if (!this.actor.system.traits?.[doctrine]?.[traitId]) return;

    const preRoll = await KamaradeSheet.#promptPreRollOptions({
      actor: this.actor,
      allowIcePick: false,
      includeHelp: true
    });
    if (!preRoll) return;
    if (!KamaradeSheet.#isPreRollOptionAllowed(preRoll, { targetedEnemy: null })) return;
    if (!await KamaradeSheet.#applyPreRollActorUpdates(this.actor, preRoll)) return;

    const trait = this.actor.system.traits?.[doctrine]?.[traitId];
    if (!trait) return;

    const total = trait.total ?? 0;
    const formula = buildStarMarxRollFormula(preRoll.baseFormula, [
      total,
      preRoll.contextualBonus
    ]);
    const roll = await new Roll(formula).evaluate();
    const outcome = evaluateStarMarxRollOutcome(roll, { threshold: preRoll.help.threshold });

    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const traitLabel = game.i18n.localize(`STARMARX.Trait.${cap(doctrine)}.${cap(traitId)}`);
    const helpLabel = game.i18n.localize(preRoll.help.labelKey);
    const flavor = `<strong>${game.i18n.format("STARMARX.Roll.Help.FlavorTitle", {
        trait: traitLabel,
        help: helpLabel
      })}</strong>
      ${buildStarMarxRollOutcomeFlavor(outcome)}
      <small>(${game.i18n.localize("STARMARX.Roll.Threshold")} ${preRoll.help.threshold})</small>`;

    const helpModifier = computeKamaradeHelpModifier(preRoll.help, outcome);
    const rollBreakdown = {
      rollRows: KamaradeSheet.#buildRollDetailRows({
        roll,
        traitLabel,
        traitTotal: total,
        modifiers: null,
        preRoll,
        targetedEnemy: null,
        dangerositeModifier: 0
      }),
      help: KamaradeSheet.#buildHelpBreakdown({
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

  static async #promptPreRollOptions({ actor, allowIcePick, includeHelp = false }) {
    const zlotys = actor.system.zlotys?.value ?? 0;
    const optionHtml = getKamaradeZlotyRollOptionConfigs()
      .map(option => {
        const unavailable = option.key === KAMARADE_ZLOTY_ROLL_OPTIONS.picAGlace && !allowIcePick;
        const tooExpensive = option.cost > zlotys;
        const disabled = unavailable || tooExpensive ? " disabled" : "";
        const label = game.i18n.format(option.optionLabelKey ?? option.labelKey, { cost: option.cost });
        return `<option value="${option.key}"${disabled}>${KamaradeSheet.#escapeHtml(label)}</option>`;
      })
      .join("");
    const helpHtml = includeHelp
      ? `
        <label class="star-marx-pre-roll__field">
          <span>${game.i18n.localize("STARMARX.Roll.PreRoll.HelpOption")}</span>
          <select name="helpOption">
            ${getKamaradeHelpRollOptionConfigs().map(option => {
              const label = game.i18n.localize(option.optionLabelKey);
              return `<option value="${option.key}">${KamaradeSheet.#escapeHtml(label)}</option>`;
            }).join("")}
          </select>
        </label>`
      : "";

    const content = `
      <form class="star-marx-pre-roll">
        ${helpHtml}
        <label class="star-marx-pre-roll__field">
          <span>${game.i18n.localize("STARMARX.Roll.PreRoll.ContextualBonus")}</span>
          <input type="number" name="contextualBonus" value="0" step="1">
        </label>
        <label class="star-marx-pre-roll__field">
          <span>${game.i18n.localize("STARMARX.Roll.PreRoll.ZlotyOption")}</span>
          <select name="zlotyOption">${optionHtml}</select>
        </label>
        <p class="star-marx-pre-roll__hint">${game.i18n.format("STARMARX.Roll.PreRoll.AvailableZlotys", { value: zlotys })}</p>
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
          if (includeHelp) {
            preRoll.help = normalizeKamaradeHelpRollOptions(button.form.elements.helpOption.value);
          }
          return preRoll;
        }
      }
    });
  }

  static #isPreRollOptionAllowed(preRoll, { targetedEnemy }) {
    if (preRoll.zlotyOption !== KAMARADE_ZLOTY_ROLL_OPTIONS.picAGlace) return true;
    if (KamaradeSheet.#canUseIcePick({ targetedEnemy })) return true;

    ui.notifications.warn(game.i18n.localize("STARMARX.Roll.PreRoll.PicAGlaceUnavailable"));
    return false;
  }

  static #canUseIcePick({ targetedEnemy }) {
    return !!targetedEnemy && KamaradeSheet.#isCombatActive(game.combat);
  }

  static #isCombatActive(combat) {
    return !!combat && combat.started !== false;
  }

  static async #applyPreRollActorUpdates(actor, preRoll) {
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
    traitLabel,
    traitTotal,
    modifiers,
    preRoll,
    targetedEnemy,
    dangerositeModifier
  }) {
    const diceValues = extractRollDiceValues(roll);
    const diceTotal = diceValues.reduce((sum, value) => sum + value, 0);
    const diceDetail = diceValues.length
      ? `${diceValues.join(" + ")} = ${diceTotal}`
      : "2d6";
    const rows = [
      { text: `${game.i18n.localize("STARMARX.Roll.Dice")} ${diceDetail}` }
    ];
    if (traitTotal !== 0) {
      rows.push({
        value: traitTotal,
        label: game.i18n.format("STARMARX.Roll.StatBonus", { stat: traitLabel })
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

    if (targetedEnemy && dangerositeModifier !== 0) {
      rows.push({
        value: dangerositeModifier,
        label: game.i18n.format("STARMARX.Roll.EnemyDanger", { enemy: targetedEnemy.name })
      });
    }

    return rows;
  }

  static #buildDamageBreakdown({
    actor,
    doctrine,
    traitId,
    traitLabel,
    traitTotal,
    modifiers,
    preRoll,
    targetedEnemy
  }) {
    if (!targetedEnemy) return null;

    const damageSource = KamaradeSheet.#getDamageSource(doctrine, traitId);
    const terms = [{
      value: damageFromRank(traitTotal),
      label: game.i18n.format("STARMARX.Roll.DamageFromStat", {
        stat: traitLabel,
        total: traitTotal
      })
    }];

    const manualBonus = damageSource ? (actor.system.damage?.[damageSource]?.bonus ?? 0) : 0;
    if (manualBonus !== 0) {
      terms.push({
        value: manualBonus,
        label: game.i18n.localize("STARMARX.Roll.ManualDamageBonus")
      });
    }

    terms.push(...KamaradeSheet.#buildSignDamageTerms(actor, damageSource));
    for (const source of modifiers?.sources ?? []) {
      const damageBonus = source.damageBonus ?? 0;
      if (damageBonus === 0) continue;
      terms.push({
        value: damageBonus,
        label: game.i18n.localize(source.labelKey)
      });
    }

    const rawDamage = terms.reduce((sum, term) => sum + term.value, 0);
    const cap = damageSource ? computeKamaradeDamageCap(actor, damageSource) : null;
    const capped = Number.isFinite(cap) && rawDamage > cap;
    let damage = capped ? cap : rawDamage;
    const rows = terms.map(term => ({
      value: term.value,
      label: term.label,
      forceSign: true
    }));
    if (capped) {
      rows.push({
        text: game.i18n.format("STARMARX.Roll.DamageCapApplied", {
          cap,
          source: KamaradeSheet.#getSigneName(actor, "petit")
        })
      });
    }
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

  static #buildSignDamageTerms(actor, damageSource) {
    const terms = [];
    if (isKamaradeDosAuMurActive(actor)) {
      terms.push({ value: 1, label: KamaradeSheet.#getSigneName(actor, "dosaumur") });
    }
    if (damageSource === "lutte") {
      if (hasKamaradeSigne(actor, "boucher")) {
        terms.push({ value: 1, label: KamaradeSheet.#getSigneName(actor, "boucher") });
      }
      if (hasActiveKamaradeSizeSigne(actor, "grand")) {
        terms.push({ value: 1, label: KamaradeSheet.#getSigneName(actor, "grand") });
      }
      if (hasKamaradeSigne(actor, "krolik")) {
        terms.push({ value: 1, label: KamaradeSheet.#getSigneName(actor, "krolik") });
      }
    }
    if (damageSource === "ak47" && hasKamaradeSigne(actor, "precis")) {
      terms.push({ value: 1, label: KamaradeSheet.#getSigneName(actor, "precis") });
    }
    return terms;
  }

  static #getTargetedEnemy() {
    const targets = Array.from(game.user?.targets ?? []);
    return targets.find(target => target?.actor?.type === "enemy")?.actor ?? null;
  }

  static #getEnemyDangerosite(enemy) {
    const dangerosite = Number(enemy?.system?.dangerosite);
    return Number.isFinite(dangerosite) ? dangerosite : 0;
  }

  static #getDamageSource(doctrine, traitId) {
    if (doctrine !== "marteau") return null;
    if (traitId === "lutte" || traitId === "ak47") return traitId;
    return null;
  }

  static #getSigneName(actor, slug) {
    const item = Array.from(actor.items ?? []).find(entry =>
      entry?.type === "signe" && normalizeSignSlug(entry.name) === slug
    );
    return item?.name ?? slug;
  }

  static #escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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
