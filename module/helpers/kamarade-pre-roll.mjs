export const KAMARADE_ZLOTY_ROLL_OPTIONS = Object.freeze({
  none: "none",
  membreDuParti: "membreDuParti",
  apparatchik: "apparatchik",
  picAGlace: "picAGlace"
});

export const KAMARADE_HELP_ROLL_OPTIONS = Object.freeze({
  help1: "help1",
  help2: "help2",
  help3: "help3"
});

const ZLOTY_ROLL_OPTION_CONFIGS = Object.freeze({
  [KAMARADE_ZLOTY_ROLL_OPTIONS.none]: Object.freeze({
    key: KAMARADE_ZLOTY_ROLL_OPTIONS.none,
    labelKey: "STARMARX.Roll.PreRoll.Zloty.None",
    optionLabelKey: "STARMARX.Roll.PreRoll.Zloty.NoneOption",
    cost: 0,
    baseFormula: "2d6",
    rollBonus: 0,
    damageMultiplier: 1,
    setHealthToOne: false
  }),
  [KAMARADE_ZLOTY_ROLL_OPTIONS.membreDuParti]: Object.freeze({
    key: KAMARADE_ZLOTY_ROLL_OPTIONS.membreDuParti,
    labelKey: "STARMARX.Roll.PreRoll.Zloty.MembreDuParti",
    optionLabelKey: "STARMARX.Roll.PreRoll.Zloty.MembreDuPartiOption",
    detailKey: "STARMARX.Roll.PreRoll.Zloty.MembreDuPartiDetail",
    cost: 1,
    baseFormula: "3d6kh2",
    rollBonus: 0,
    damageMultiplier: 1,
    setHealthToOne: false
  }),
  [KAMARADE_ZLOTY_ROLL_OPTIONS.apparatchik]: Object.freeze({
    key: KAMARADE_ZLOTY_ROLL_OPTIONS.apparatchik,
    labelKey: "STARMARX.Roll.PreRoll.Zloty.Apparatchik",
    optionLabelKey: "STARMARX.Roll.PreRoll.Zloty.ApparatchikOption",
    detailKey: "STARMARX.Roll.PreRoll.Zloty.ApparatchikDetail",
    cost: 2,
    baseFormula: "3d6",
    rollBonus: 0,
    damageMultiplier: 1,
    setHealthToOne: false
  }),
  [KAMARADE_ZLOTY_ROLL_OPTIONS.picAGlace]: Object.freeze({
    key: KAMARADE_ZLOTY_ROLL_OPTIONS.picAGlace,
    labelKey: "STARMARX.Roll.PreRoll.Zloty.PicAGlace",
    optionLabelKey: "STARMARX.Roll.PreRoll.Zloty.PicAGlaceOption",
    damageDetailKey: "STARMARX.Roll.PreRoll.Zloty.PicAGlaceDamageDetail",
    cost: 3,
    baseFormula: "2d6",
    rollBonus: 1,
    damageMultiplier: 2,
    setHealthToOne: true
  })
});

const HELP_ROLL_OPTION_CONFIGS = Object.freeze({
  [KAMARADE_HELP_ROLL_OPTIONS.help1]: Object.freeze({
    key: KAMARADE_HELP_ROLL_OPTIONS.help1,
    labelKey: "STARMARX.Roll.Help.PlusOne",
    optionLabelKey: "STARMARX.Roll.Help.PlusOneOption",
    amount: 1,
    threshold: 9
  }),
  [KAMARADE_HELP_ROLL_OPTIONS.help2]: Object.freeze({
    key: KAMARADE_HELP_ROLL_OPTIONS.help2,
    labelKey: "STARMARX.Roll.Help.PlusTwo",
    optionLabelKey: "STARMARX.Roll.Help.PlusTwoOption",
    amount: 2,
    threshold: 12
  }),
  [KAMARADE_HELP_ROLL_OPTIONS.help3]: Object.freeze({
    key: KAMARADE_HELP_ROLL_OPTIONS.help3,
    labelKey: "STARMARX.Roll.Help.PlusThree",
    optionLabelKey: "STARMARX.Roll.Help.PlusThreeOption",
    amount: 3,
    threshold: 15
  })
});

export function getKamaradeZlotyRollOptionConfig(value) {
  return ZLOTY_ROLL_OPTION_CONFIGS[value] ?? ZLOTY_ROLL_OPTION_CONFIGS[KAMARADE_ZLOTY_ROLL_OPTIONS.none];
}

export function getKamaradeZlotyRollOptionConfigs() {
  return Object.values(ZLOTY_ROLL_OPTION_CONFIGS);
}

export function getKamaradeHelpRollOptionConfig(value) {
  return HELP_ROLL_OPTION_CONFIGS[value] ?? HELP_ROLL_OPTION_CONFIGS[KAMARADE_HELP_ROLL_OPTIONS.help1];
}

export function getKamaradeHelpRollOptionConfigs() {
  return Object.values(HELP_ROLL_OPTION_CONFIGS);
}

export function normalizeKamaradePreRollOptions({
  contextualBonus = 0,
  zlotyOption = KAMARADE_ZLOTY_ROLL_OPTIONS.none
} = {}) {
  const option = getKamaradeZlotyRollOptionConfig(zlotyOption);
  return {
    contextualBonus: normalizeInteger(contextualBonus),
    zlotyOption: option.key,
    zlotyCost: option.cost,
    baseFormula: option.baseFormula,
    rollBonus: option.rollBonus,
    damageMultiplier: option.damageMultiplier,
    setHealthToOne: option.setHealthToOne,
    labelKey: option.labelKey,
    detailKey: option.detailKey ?? "",
    damageDetailKey: option.damageDetailKey ?? ""
  };
}

export function normalizeKamaradeHelpRollOptions(value = KAMARADE_HELP_ROLL_OPTIONS.help1) {
  const option = getKamaradeHelpRollOptionConfig(value);
  return {
    key: option.key,
    labelKey: option.labelKey,
    optionLabelKey: option.optionLabelKey,
    amount: option.amount,
    threshold: option.threshold
  };
}

export function computeKamaradeHelpModifier(help, outcome) {
  const amount = Math.abs(normalizeInteger(help?.amount));
  const multiplier = outcome?.critical ? 2 : 1;
  return (outcome?.success ? amount : -amount) * multiplier;
}

function normalizeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : 0;
}
