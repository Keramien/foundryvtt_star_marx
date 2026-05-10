export const SOYOUZ_ROLL_ACTOR_OPTIONS = Object.freeze({
  computer: "computer"
});

const SOYOUZ_TRAIT_ROLL_CONFIGS = Object.freeze({
  tupolev: Object.freeze({
    poste: "pilote",
    actorTraits: Object.freeze([
      Object.freeze({ doctrine: "marteau", traitId: "soyouz" })
    ]),
    damageMode: "none"
  }),
  orgueDeStaline: Object.freeze({
    poste: "artilleur",
    actorTraits: Object.freeze([
      Object.freeze({ doctrine: "marteau", traitId: "ak47" })
    ]),
    damageMode: "orgueDeStaline"
  }),
  parade: Object.freeze({
    poste: "beauParleur",
    actorTraits: Object.freeze([
      Object.freeze({ doctrine: "faucille", traitId: "propagande" }),
      Object.freeze({ doctrine: "marteau", traitId: "briseurDeGreve" })
    ]),
    damageMode: "none"
  }),
  lebedev: Object.freeze({
    poste: "operateur",
    actorTraits: Object.freeze([
      Object.freeze({ doctrine: "etoile", traitId: "operateurCodeur" })
    ]),
    damageMode: "none"
  }),
  datcha: Object.freeze({
    poste: "",
    actorTraits: Object.freeze([]),
    damageMode: "none"
  }),
  tetris: Object.freeze({
    poste: "pilote",
    actorTraits: Object.freeze([
      Object.freeze({ doctrine: "marteau", traitId: "soyouz" })
    ]),
    damageMode: "tetris"
  }),
  murDeFer: Object.freeze({
    poste: "technicien",
    actorTraits: Object.freeze([
      Object.freeze({ doctrine: "etoile", traitId: "machiniste" })
    ]),
    damageMode: "none"
  })
});

const EMPTY_SOYOUZ_TRAIT_ROLL_CONFIG = Object.freeze({
  poste: "",
  actorTraits: Object.freeze([]),
  damageMode: "none"
});

export function getSoyouzTraitRollConfig(traitId) {
  return SOYOUZ_TRAIT_ROLL_CONFIGS[traitId] ?? EMPTY_SOYOUZ_TRAIT_ROLL_CONFIG;
}

export function getSoyouzTraitRollConfigs() {
  return SOYOUZ_TRAIT_ROLL_CONFIGS;
}

export function getSoyouzActorTraitKey({ doctrine, traitId } = {}) {
  return doctrine && traitId ? `${doctrine}.${traitId}` : "";
}

export function parseSoyouzActorTraitKey(value) {
  const [doctrine = "", traitId = ""] = String(value ?? "").split(".");
  return { doctrine, traitId };
}
