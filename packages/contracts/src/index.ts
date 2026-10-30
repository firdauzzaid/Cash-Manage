export const MAX_MONEY = 1_000_000_000_000n;
export type Kind = "income" | "expense" | "transfer";
export type Versioned = { id: string; version: number };
export type Household = Versioned & {
  name: string;
  timezone: string;
  currency: "IDR";
  revision: string;
  role: "owner" | "member";
};
export type Account = Versioned & {
  name: string;
  kind: "cash" | "bank" | "ewallet";
  opening_balance_minor: string;
  opening_date: string;
  balance_minor: string;
  archived_at: string | null;
};
export type Category = Versioned & {
  name: string;
  kind: "income" | "expense";
  archived_at: string | null;
};
export type Transaction = Versioned & {
  type: Kind;
  account_id: string;
  destination_account_id: string | null;
  category_id: string | null;
  amount_minor: string;
  fee_minor: string;
  fee_category_id: string | null;
  occurred_on: string;
  note: string;
  created_by: string;
  actor_name: string;
  created_at: string;
  updated_at: string;
};
export type Budget = Versioned & {
  category_id: string;
  category_name: string;
  month_start: string;
  limit_minor: string;
  spent_minor: string;
};
export type Summary = {
  revision: string;
  balance_minor: string;
  income_minor: string;
  expense_minor: string;
  categories: { category_id: string; name: string; amount_minor: string }[];
  income_categories: {
    category_id: string;
    name: string;
    amount_minor: string;
  }[];
  accounts: Account[];
};
export type Member = Versioned & {
  profile_id: string;
  display_name: string;
  role: "owner" | "member";
  status: string;
};
export type Invitation = Versioned & {
  email_normalized: string;
  status: string;
  expires_at: string;
};
export type Audit = {
  id: string;
  actor_name: string;
  entity_type: string;
  action: string;
  changes: Record<string, unknown>;
  created_at: string;
};
export type TransactionInput = {
  type: Kind;
  account_id: string;
  destination_account_id: string | null;
  category_id: string | null;
  amount_minor: string;
  fee_minor: string;
  fee_category_id: string | null;
  occurred_on: string;
  note: string;
};

export {
  notificationDraft,
  type NotificationDraft,
} from "./notification-import.js";
export function money(value: string): string {
  const n = BigInt(value);
  return `${n < 0n ? "−" : ""}Rp${(n < 0n ? -n : n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}
export function validMoney(
  value: unknown,
  signed = false,
  zero = false,
): value is string {
  if (
    typeof value !== "string" ||
    !(signed ? /^-?(0|[1-9]\d*)$/ : /^(0|[1-9]\d*)$/).test(value)
  )
    return false;
  const n = BigInt(value);
  return n <= MAX_MONEY && n >= (signed ? -MAX_MONEY : zero ? 0n : 1n);
}
export function validDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !value.startsWith("0000-") &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function today(timezone = "Asia/Jakarta"): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts();
  return ["year", "month", "day"]
    .map((k) => parts.find((p) => p.type === k)!.value)
    .join("-");
}
