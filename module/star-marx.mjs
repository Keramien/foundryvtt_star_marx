import { StarMarxActor } from "./actor/actor.mjs";
import { KamaradeSheet } from "./actor/sheet.mjs";
import { StarMarxItem } from "./item/item.mjs";
import { StarMarxItemSheet } from "./item/sheet.mjs";
import { KamaradeData } from "./data/actor-kamarade.mjs";
import {
  RaceData, SigneData, KontrebandeData, ClefData,
  BardaData, FaiblesseData, AtoutData
} from "./data/items.mjs";
import { SYSTEM_ID } from "./helpers/config.mjs";

Hooks.once("init", () => {
  console.log("Star Marx | Initializing system");

  CONFIG.Actor.documentClass = StarMarxActor;
  CONFIG.Item.documentClass = StarMarxItem;

  // Register typed data models — replaces template.json (deprecated in v14,
  // removed in v16). Each entry wires a subtype to its schema class.
  CONFIG.Actor.dataModels = {
    kamarade: KamaradeData
  };
  CONFIG.Item.dataModels = {
    race:        RaceData,
    signe:       SigneData,
    kontrebande: KontrebandeData,
    clef:        ClefData,
    barda:       BardaData,
    faiblesse:   FaiblesseData,
    atout:       AtoutData
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

  // Register the Kamarade sheet. Scoped to type "kamarade" so we don't collide
  // with the core sheet (no need to unregister).
  foundry.documents.collections.Actors.registerSheet(SYSTEM_ID, KamaradeSheet, {
    types: ["kamarade"],
    makeDefault: true,
    label: "STARMARX.Sheet.KamaradeLabel"
  });

  // Our custom Item sheet handles race / signe / clef. Other item types keep
  // the default Foundry sheet for now.
  foundry.documents.collections.Items.registerSheet(SYSTEM_ID, StarMarxItemSheet, {
    types: ["race", "signe", "clef"],
    makeDefault: true,
    label: "STARMARX.Sheet.ItemLabel"
  });
});

Hooks.once("ready", () => {
  console.log("Star Marx | Ready");
});
