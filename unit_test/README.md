# Star Marx Unit Tests - Kamarade Signes

This folder hosts the unit-test architecture for Kamarade signs.

## Scope (phase 1)

- One test file per Kamarade sign from `packs-src/signes`.
- Individual sign behavior only.
- Complex signs can define multiple test cases in the same file.

## Layout

- `fixtures/`: test data builders and local stubs.
- `helpers/`: reusable state, effect, and assertion helpers.
- `meta/`: generated sign catalog + mapping rules.
- `scripts/`: generator and coverage checks.
- `signs/`: one test module per sign, grouped by category.

## Commands

From this folder:

```powershell
npm run generate
npm run check:coverage
npm test
```

From repository root:

```powershell
npm run unit:test:generate
npm run unit:test:coverage
npm run unit:test
```

## Workflow

1. Run `npm run generate` after sign content changes.
2. Implement tests in generated files (remove `test.skip` as logic is implemented).
3. Keep `npm run check:coverage` green to ensure no sign is missing a test file.
