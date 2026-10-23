import test from "node:test";
import assert from "node:assert/strict";
import { money, validMoney, validDate } from "@cashflow/contracts";
import { csvCell } from "../src/reports.js";
test("rupiah stays exact beyond floating point precision", () => {
  assert.equal(money("9007199254740993123"), "Rp9.007.199.254.740.993.123");
  assert.equal(money("-2500"), "−Rp2.500");
  for (const bad of ["1.1", "1e3", "01", "1000000000001", "-1", 1, Infinity])
    assert.equal(validMoney(bad), false);
  assert.equal(validMoney("0"), false);
  assert.equal(validMoney("0", false, true), true);
  assert.equal(validMoney("-1000000000000", true), true);
});
test("date validation rejects impossible dates and timestamps", () => {
  assert.equal(validDate("2024-02-29"), true);
  for (const bad of [
    "2025-02-29",
    "2026-04-31",
    "2026-01-01T00:00:00Z",
    "x",
    "2026-13-01",
    "0000-01-01",
  ])
    assert.equal(validDate(bad), false);
});
test("CSV text cannot start a spreadsheet formula", () => {
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell("  +2"), '"\'  +2"');
  assert.equal(csvCell("hello, world"), '"hello, world"');
});
