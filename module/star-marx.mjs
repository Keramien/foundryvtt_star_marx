import { StarMarxActor } from "./actor/actor.mjs";
import { StarMarxCombat, configureStarMarxInitiative } from "./combat/combat.mjs";
import { KamaradeSheet } from "./actor/kamarde_sheet.mjs";
import { EnemySheet } from "./actor/enemy_sheet.mjs";
import { SoyouzSheet } from "./actor/soyouz_sheet.mjs";
import { StarMarxItem } from "./item/item.mjs";
import { StarMarxItemSheet } from "./item/item_sheet.mjs";
import { StarMarxTokenDocument, ensureLinkedActorPrototypeTokensLinked } from "./token/token_document.mjs";
import { registerStarMarxChatRollBreakdownHooks } from "./helpers/chat-roll-breakdown.mjs";
import { KamaradeData } from "./data/kamarade_data.mjs";
import { EnemyData } from "./data/enemy_data.mjs";
import { SoyouzData } from "./data/soyouz_data.mjs";
import {
  RaceData, SigneData, KontrebandeData, ClefData,
  BardaData, FaiblesseData, AtoutData, DonData,
  CorruptionData, TraitData, TraitSoyouzData, SigneSoyouzData
} from "./data/items_data.mjs";
import { SYSTEM_ID } from "./helpers/config.mjs";

Hooks.once("init", () => {
  console.log("Star Marx | Initializing system");

  CONFIG.Actor.documentClass = StarMarxActor;
  CONFIG.Combat.documentClass = StarMarxCombat;
  configureStarMarxInitiative(CONFIG);
  registerStarMarxChatRollBreakdownHooks(Hooks);
  CONFIG.Item.documentClass = StarMarxItem;
  CONFIG.Token.documentClass = StarMarxTokenDocument;

  // Register typed data models — replaces template.json (deprecated in v14,
  // removed in v16). Each entry wires a subtype to its schema class.
  CONFIG.Actor.dataModels = {
    kamarade: KamaradeData,
    enemy:    EnemyData,
    soyouz:   SoyouzData
  };
  CONFIG.Item.dataModels = {
    race:          RaceData,
    signe:         SigneData,
    kontrebande:   KontrebandeData,
    clef:          ClefData,
    barda:         BardaData,
    faiblesse:     FaiblesseData,
    atout:         AtoutData,
    don:           DonData,
    corruption:    CorruptionData,
    trait:         TraitData,
    trait_soyouz:  TraitSoyouzData,
    signe_soyouz:  SigneSoyouzData
  };

  // Handlebars helpers specific to the system.
  Handlebars.registerHelper("capitalize", (s) => {
    if (typeof s !== "string" || s.length === 0) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  });

  // String concatenation for building dynamic localization keys.
  Handlebars.registerHelper("concat", (...args) => {
    return args.slice(0, -1).join("");
  });

  // Strict equality — replacement for `{{#if (eq a b)}}` patterns.
  Handlebars.registerHelper("eq", (a, b) => a === b);

  // Strict greater-than — used to hide "Rank N" badges when N is the default 1.
  Handlebars.registerHelper("gt", (a, b) => a > b);

  // Register the Kamarade sheet. Scoped to type "kamarade" so we don't collide
  // with the core sheet (no need to unregister).
  foundry.documents.collections.Actors.registerSheet(SYSTEM_ID, KamaradeSheet, {
    types: ["kamarade"],
    makeDefault: true,
    label: "STARMARX.Sheet.KamaradeLabel"
  });

  foundry.documents.collections.Actors.registerSheet(SYSTEM_ID, EnemySheet, {
    types: ["enemy"],
    makeDefault: true,
    label: "STARMARX.Sheet.EnemyLabel"
  });

  foundry.documents.collections.Actors.registerSheet(SYSTEM_ID, SoyouzSheet, {
    types: ["soyouz"],
    makeDefault: true,
    label: "STARMARX.Sheet.SoyouzLabel"
  });

  // Our custom Item sheet handles the system's authored item families.
  foundry.documents.collections.Items.registerSheet(SYSTEM_ID, StarMarxItemSheet, {
    types: ["race", "signe", "clef", "don", "corruption", "trait", "trait_soyouz", "signe_soyouz"],
    makeDefault: true,
    label: "STARMARX.Sheet.ItemLabel"
  });
});

Hooks.once("ready", () => {
  console.log("Star Marx | Ready");
  ensureLinkedActorPrototypeTokensLinked().catch(error => {
    console.error("Star Marx | Failed to link actor prototype tokens", error);
  });
});
