import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getCoverageReport } from "../scripts/check-signes-coverage.mjs";

describe("Kamarade Signs Coverage", () => {
  test("has one test file per source sign", () => {
    const report = getCoverageReport();
    assert.equal(report.ok, true, JSON.stringify(report, null, 2));
  });
});
