import { validDate, validMoney } from "@cashflow/contracts";
import { fail } from "./errors.js";
export type Body = Record<string, unknown>;
export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function uuid(v: unknown): string {
  if (typeof v !== "string" || !uuidPattern.test(v))
    fail(400, "INVALID_ID", "ID tidak valid.");
  return v;
}
export function body(v: unknown): Body {
  if (!v || typeof v !== "object" || Array.isArray(v))
    fail(400, "INVALID_INPUT", "Isian tidak valid.");
  return v as Body;
}
export function text(v: unknown, max = 80, empty = false): string {
  if (typeof v !== "string" || v.trim().length > max || (!empty && !v.trim()))
    fail(
      400,
      "INVALID_INPUT",
      `Teks harus ${empty ? "0" : "1"}–${max} karakter.`,
    );
  return v.trim();
}
export function oneOf<T extends string>(v: unknown, values: readonly T[]): T {
  if (!values.includes(v as T))
    fail(400, "INVALID_INPUT", "Pilihan tidak valid.");
  return v as T;
}
export function amount(v: unknown, signed = false, zero = false): string {
  if (!validMoney(v, signed, zero))
    fail(
      400,
      "INVALID_AMOUNT",
      "Nominal harus berupa rupiah bulat, maksimal Rp1 triliun.",
    );
  return v;
}
export function date(v: unknown): string {
  if (!validDate(v)) fail(400, "INVALID_DATE", "Tanggal tidak valid.");
  return v;
}
export function version(v: unknown): number {
  if (!Number.isSafeInteger(v) || Number(v) < 1)
    fail(400, "INVALID_VERSION", "Versi perubahan diperlukan.");
  return Number(v);
}
export function email(v: unknown): string {
  const s = text(v, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
    fail(400, "INVALID_EMAIL", "Alamat email tidak valid.");
  return s;
}
export function month(v: unknown): string {
  const s = date(v);
  if (!s.endsWith("-01"))
    fail(400, "INVALID_MONTH", "Periode harus tanggal pertama bulan.");
  return s;
}
export function optionalId(v: unknown): string | null {
  return v === null || v === undefined ? null : uuid(v);
}
