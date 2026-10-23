import type { Context } from "./access.js";
import { fail } from "./errors.js";
import * as v from "./validation.js";
export function period(q: v.Body) {
  const from = v.date(q.from),
    to = v.date(q.to);
  if (from >= to)
    fail(400, "INVALID_RANGE", "Tanggal akhir harus setelah tanggal awal.");
  return { from, to };
}
export async function accounts(ctx: Context) {
  return (
    await ctx.db.query(
      `SELECT a.*,COALESCE(s.balance,0)::text AS balance_minor FROM financial_accounts a
    LEFT JOIN (SELECT account_id,sum(delta_minor) AS balance FROM account_effects WHERE household_id=$1 GROUP BY account_id) s ON s.account_id=a.id
    WHERE a.household_id=$1 ORDER BY a.archived_at NULLS FIRST,a.created_at,a.id`,
      [ctx.household.id],
    )
  ).rows;
}
export async function summary(ctx: Context, q: v.Body) {
  const { from, to } = period(q);
  const totals = (
    await ctx.db.query(
      `SELECT COALESCE(sum(delta_minor),0)::text AS balance_minor,
    COALESCE(sum(delta_minor) FILTER(WHERE flow='income' AND occurred_on >= $2 AND occurred_on<$3),0)::text AS income_minor,
    COALESCE(-sum(delta_minor) FILTER(WHERE flow='expense' AND occurred_on >= $2 AND occurred_on<$3),0)::text AS expense_minor
    FROM account_effects WHERE household_id=$1`,
      [ctx.household.id, from, to],
    )
  ).rows[0];
  const categories = (
    await ctx.db.query(
      `SELECT e.category_id,c.name,(-sum(e.delta_minor))::text AS amount_minor FROM account_effects e JOIN categories c ON c.id=e.category_id AND c.household_id=e.household_id
    WHERE e.household_id=$1 AND e.flow='expense' AND e.occurred_on >= $2 AND e.occurred_on<$3 GROUP BY e.category_id,c.name ORDER BY -sum(e.delta_minor) DESC,c.name`,
      [ctx.household.id, from, to],
    )
  ).rows;
  const incomeCategories = (
    await ctx.db.query(
      `SELECT e.category_id,c.name,sum(e.delta_minor)::text AS amount_minor FROM account_effects e JOIN categories c ON c.id=e.category_id AND c.household_id=e.household_id
    WHERE e.household_id=$1 AND e.flow='income' AND e.occurred_on >= $2 AND e.occurred_on<$3 GROUP BY e.category_id,c.name ORDER BY sum(e.delta_minor) DESC,c.name`,
      [ctx.household.id, from, to],
    )
  ).rows;
  return {
    ...totals,
    revision: ctx.household.revision,
    categories,
    income_categories: incomeCategories,
    accounts: await accounts(ctx),
  };
}
export async function budgets(ctx: Context, month: unknown) {
  const start = v.month(month);
  return (
    await ctx.db.query(
      `SELECT b.*,c.name AS category_name,COALESCE(s.spent,0)::text AS spent_minor FROM budgets b
    JOIN categories c ON c.id=b.category_id AND c.household_id=b.household_id
    LEFT JOIN (SELECT category_id,-sum(delta_minor) AS spent FROM account_effects WHERE household_id=$1 AND flow='expense' AND occurred_on >=$2::date AND occurred_on<($2::date+interval '1 month') GROUP BY category_id) s ON s.category_id=b.category_id
    WHERE b.household_id=$1 AND b.month_start=$2 ORDER BY c.name,b.id`,
      [ctx.household.id, start],
    )
  ).rows;
}
export async function transactions(ctx: Context, q: v.Body, exporting = false) {
  const { from, to } = period(q),
    values: unknown[] = [ctx.household.id, from, to];
  let where =
    "t.household_id=$1 AND t.deleted_at IS NULL AND t.occurred_on >= $2 AND t.occurred_on < $3";
  const add = (value: unknown, sql: (p: string) => string) => {
    values.push(value);
    where += ` AND ${sql("$" + values.length)}`;
  };
  if (q.account_id)
    add(
      v.uuid(q.account_id),
      (p) => `(t.account_id=${p} OR t.destination_account_id=${p})`,
    );
  if (q.category_id)
    add(
      v.uuid(q.category_id),
      (p) => `(t.category_id=${p} OR t.fee_category_id=${p})`,
    );
  if (q.type)
    add(
      v.oneOf(q.type, ["income", "expense", "transfer"]),
      (p) => `t.type=${p}`,
    );
  if (q.created_by) add(v.uuid(q.created_by), (p) => `t.created_by=${p}`);
  if (q.search)
    add(
      "%" + v.text(q.search, 100).replace(/[\\%_]/g, "\\$&") + "%",
      (p) =>
        `(t.note ILIKE ${p} OR EXISTS (SELECT 1 FROM categories search_category WHERE search_category.household_id=t.household_id AND search_category.id IN (t.category_id,t.fee_category_id) AND search_category.name ILIKE ${p}))`,
    );
  if (q.cursor && !exporting) {
    let c: any;
    try {
      c = JSON.parse(
        Buffer.from(v.text(q.cursor, 200), "base64url").toString(),
      );
    } catch {
      fail(400, "INVALID_CURSOR", "Posisi halaman tidak valid.");
    }
    values.push(v.date(c.date), v.uuid(c.id));
    where += ` AND (t.occurred_on,t.id)<($${values.length - 1}::date,$${values.length}::uuid)`;
  }
  const limit = exporting ? 50001 : 51;
  const rows = (
    await ctx.db.query(
      `SELECT t.*,p.display_name AS actor_name,a.name AS account_name,d.name AS destination_name,c.name AS category_name,fc.name AS fee_category_name
    FROM transactions t JOIN profiles p ON p.id=t.created_by JOIN financial_accounts a ON a.id=t.account_id
    LEFT JOIN financial_accounts d ON d.id=t.destination_account_id LEFT JOIN categories c ON c.id=t.category_id LEFT JOIN categories fc ON fc.id=t.fee_category_id
    WHERE ${where} ORDER BY t.occurred_on DESC,t.id DESC LIMIT ${limit}`,
      values,
    )
  ).rows;
  if (exporting) {
    if (rows.length > 50000)
      fail(
        413,
        "EXPORT_TOO_LARGE",
        "Batasi periode ekspor hingga maksimal 50.000 transaksi.",
      );
    return { items: rows, next_cursor: null };
  }
  const more = rows.length > 50,
    items = rows.slice(0, 50),
    last = items.at(-1);
  return {
    items,
    next_cursor: more
      ? Buffer.from(
          JSON.stringify({ date: last.occurred_on, id: last.id }),
        ).toString("base64url")
      : null,
  };
}
export function csvCell(value: unknown): string {
  let s = String(value ?? "");
  if (/^[\s\uFEFF]*[=+@-]/.test(s) || /^[\t\r\n]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
export async function csv(ctx: Context, q: v.Body) {
  const { items } = await transactions(ctx, q, true);
  const header = [
    "Tanggal",
    "Jenis",
    "Rekening",
    "Tujuan",
    "Kategori",
    "Nominal IDR",
    "Biaya IDR",
    "Kategori biaya",
    "Pemasukan IDR",
    "Pengeluaran IDR",
    "Catatan",
    "Dicatat oleh",
    "ID",
  ];
  const rows = items.map((t) => {
    const selected = q.account_id;
    const expense =
      t.type === "expense"
        ? t.amount_minor
        : t.type === "transfer" && (!selected || selected === t.account_id)
          ? t.fee_minor
          : "0";
    return [
      t.occurred_on,
      t.type,
      t.account_name,
      t.destination_name,
      t.category_name,
      t.amount_minor,
      t.fee_minor,
      t.fee_category_name,
      t.type === "income" ? t.amount_minor : "0",
      expense,
      t.note,
      t.actor_name,
      t.id,
    ];
  });
  return (
    "\uFEFF" +
    [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n")
  );
}
