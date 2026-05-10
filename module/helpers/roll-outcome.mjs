export const STAR_MARX_ROLL_THRESHOLD = 9;

const ROLL_OUTCOMES = {
  criticalSuccess: {
    key: "criticalSuccess",
    labelKey: "STARMARX.Roll.CriticalSuccess",
    success: true,
    critical: true,
    color: "#2e6b2e"
  },
  success: {
    key: "success",
    labelKey: "STARMARX.Roll.Success",
    success: true,
    critical: false,
    color: "#2e6b2e"
  },
  failure: {
    key: "failure",
    labelKey: "STARMARX.Roll.Failure",
    success: false,
    critical: false,
    color: "#a61c1c"
  },
  criticalFailure: {
    key: "criticalFailure",
    labelKey: "STARMARX.Roll.CriticalFailure",
    success: false,
    critical: true,
    color: "#a61c1c"
  }
};

export function evaluateStarMarxRollOutcome(roll, { threshold = STAR_MARX_ROLL_THRESHOLD } = {}) {
  const diceValues = extractRollDiceValues(roll);
  if (diceValues.length > 0 && diceValues.every(value => value === 1)) {
    return buildRollOutcome("criticalFailure", threshold, diceValues);
  }
  if (diceValues.length > 0 && diceValues.every(value => value === 6)) {
    return buildRollOutcome("criticalSuccess", threshold, diceValues);
  }

  const total = Number(roll?.total);
  const key = Number.isFinite(total) && total >= threshold ? "success" : "failure";
  return buildRollOutcome(key, threshold, diceValues);
}

export function extractRollDiceValues(roll) {
  const dice = Array.isArray(roll?.dice) ? roll.dice : [];
  return dice.flatMap(die => {
    const results = Array.isArray(die?.results) ? die.results : [];
    return results
      .map(result => Number(result?.result ?? result?.value))
      .filter(Number.isFinite);
  });
}

export function buildStarMarxRollOutcomeFlavor(outcome, i18n = globalThis.game?.i18n) {
  const label = i18n?.localize?.(outcome.labelKey) ?? outcome.labelKey;
  return `<span style="color:${outcome.color}"> - ${label}</span>`;
}

export function buildStarMarxRollFormula(baseFormula, modifiers = []) {
  const formula = [baseFormula];
  for (const modifier of modifiers) {
    const value = Number(modifier);
    if (!Number.isFinite(value) || value === 0) continue;
    const operator = value > 0 ? "+" : "-";
    formula.push(`${operator} ${Math.abs(value)}`);
  }
  return formula.join(" ");
}

function buildRollOutcome(key, threshold, diceValues) {
  return {
    ...ROLL_OUTCOMES[key],
    threshold,
    diceValues
  };
}
