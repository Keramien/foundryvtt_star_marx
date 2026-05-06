export function createKamaradeFixture(overrides = {}) {
  const base = {
    name: "Test Kamarade",
    img: "icons/svg/mystery-man.svg",
    system: {
      details: {
        doctrine: "faucille",
        groupuscule: "",
        xp: { traits: 0, signes: 0, clefs: 0, autres: 0, total: 0 }
      },
      traits: {},
      health: { value: 5, max: 5, bonus: 0 },
      damage: {
        lutte: { value: 1, bonus: 0 },
        ak47: { value: 1, bonus: 0 }
      },
      zlotys: { value: 5, base: 5, offset: 0 },
      limits: { signes: 1, clefs: 5, kontrebande: 5 }
    },
    items: []
  };

  return mergeDeep(base, overrides);
}

function mergeDeep(target, source) {
  if (!source || typeof source !== "object") return target;
  const out = structuredClone(target);
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = mergeDeep(out[key] ?? {}, value);
      continue;
    }
    out[key] = value;
  }
  return out;
}
