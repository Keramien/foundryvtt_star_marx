export const KAMARADE_ZLOTY_ROLL_OPTIONS = Object.freeze({
  none: "none",
  membreDuParti: "membreDuParti",
  apparatchik: "apparatchik",
  picAGlace: "picAGlace"
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

export function getKamaradeZlotyRollOptionConfig(value) {
  return ZLOTY_ROLL_OPTION_CONFIGS[value] ?? ZLOTY_ROLL_OPTION_CONFIGS[KAMARADE_ZLOTY_ROLL_OPTIONS.none];
}

export function getKamaradeZlotyRollOptionConfigs() {
  return Object.values(ZLOTY_ROLL_OPTION_CONFIGS);
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

function normalizeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : 0;
}
