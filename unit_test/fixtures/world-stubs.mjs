export function createWorldStubs() {
  return {
    game: {
      user: { id: "UNIT_TEST_USER" },
      world: { id: "UNIT_TEST_WORLD" },
      i18n: { localize: key => key }
    },
    ui: {
      notifications: {
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined
      }
    }
  };
}
