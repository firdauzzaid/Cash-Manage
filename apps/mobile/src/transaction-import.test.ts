/// <reference types="node" />

import assert from "node:assert/strict";
import test from "node:test";
import { notificationDraft } from "./transaction-import.js";

test("notification draft reads an unambiguous Indonesian payment notification", () => {
  assert.deepEqual(
    notificationDraft(
      "Pembayaran berhasil\nMerchant: Supermarket Sejahtera\nNominal: Rp125.500\nTanggal: 30/10/2026",
    ),
    {
      amount_minor: "125500",
      occurred_on: "2026-10-30",
      note: "Supermarket Sejahtera",
    },
  );
});

test("notification draft leaves an ambiguous amount empty", () => {
  assert.deepEqual(
    notificationDraft("Pembayaran Rp15.000 dengan biaya Rp1.000"),
    {},
  );
});

test("notification draft blocks a failed payment", () => {
  assert.deepEqual(
    notificationDraft("Status transaksi: Gagal\nNominal: Rp125.500"),
    { blocked: true },
  );
});
