import { StarMarxActor } from "./actor/actor.mjs";
import { KamaradeSheet } from "./actor/sheet.mjs";
import { SYSTEM_ID } from "./helpers/config.mjs";

Hooks.once("init", () => {
  console.log("Star Marx | Initializing system");

  CONFIG.Actor.documentClass = StarMarxActor;

  // Handlebars helpers specific to the system.
  Handlebars.registerHelper("capitalize", (s) => {
    if (typeof s !== "string" || s.length === 0) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  });

  // Register the Kamarade sheet. Scoped to type "kamarade" so we don't collide
  // with the core sheet (no need to unregister).
  foundry.documents.collections.Actors.registerSheet(SYSTEM_ID, KamaradeSheet, {
    types: ["kamarade"],
    makeDefault: true,
    label: "STARMARX.Sheet.KamaradeLabel"
  });
});

Hooks.once("ready", () => {
  console.log("Star Marx | Ready");
});
