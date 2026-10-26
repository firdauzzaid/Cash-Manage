import { randomUUID } from "node:crypto";
import { today } from "@cashflow/contracts";
import type { Context } from "./access.js";
import { audit, existing } from "./access.js";
import { fail } from "./errors.js";
import * as v from "./validation.js";
export async function saveAccount(ctx: Context, b: v.Body, id?: string) {
  const old = id
    ? await existing(
        ctx,
        "financial_accounts",
        id,
        v.version(b.expected_version),
      )
    : null;
  const name = v.text(b.name),
    kind = v.oneOf(b.kind, ["cash", "bank", "ewallet"]),
    opening = v.amount(b.opening_balance_minor, true, true),
    on = v.date(b.opening_date);
  if (on > today(ctx.household.timezone))
    fail(
      400,
      "FUTURE_DATE",
      "Saldo awal tidak boleh bertanggal di masa depan.",
    );
  if (
    id &&
    (
      await ctx.db.query(
        "SELECT 1 FROM transactions WHERE household_id=$1 AND deleted_at IS NULL AND (account_id=$2 OR destination_account_id=$2) AND occurred_on<$3 LIMIT 1",
        [ctx.household.id, id, on],
      )
    ).rowCount
  )
    fail(
      400,
      "OPENING_DATE",
      "Tanggal saldo awal melewati transaksi yang sudah ada.",
    );
  const rid = id ?? randomUUID();
  if (old)
    await ctx.db.query(
      "UPDATE financial_accounts SET name=$3,kind=$4,opening_balance_minor=$5,opening_date=$6,updated_by=$7,updated_at=now(),version=version+1 WHERE household_id=$1 AND id=$2",
      [ctx.household.id, rid, name, kind, opening, on, ctx.actor.id],
    );
  else
    await ctx.db.query(
      "INSERT INTO financial_accounts(id,household_id,name,kind,opening_balance_minor,opening_date,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$7)",
      [rid, ctx.household.id, name, kind, opening, on, ctx.actor.id],
    );
  await audit(ctx, "account", rid, old ? "updated" : "created", {
    name,
    kind,
    opening_balance_minor: opening,
    opening_date: on,
  });
  return { id: rid, version: (old?.version ?? 0) + 1 };
}
export async function saveCategory(ctx: Context, b: v.Body, id?: string) {
  const old = id
    ? await existing(ctx, "categories", id, v.version(b.expected_version))
    : null;
  const name = v.text(b.name),
    kind = v.oneOf(b.kind, ["income", "expense"]),
    restore = b.restore === true;
  if (b.restore !== undefined && typeof b.restore !== "boolean")
    fail(400, "INVALID_INPUT", "Status pemulihan kategori tidak valid.");
  if (old && old.kind !== kind)
    fail(400, "CATEGORY_KIND", "Jenis kategori tidak dapat diubah.");
  if (restore && (!old || !old.archived_at))
    fail(400, "CATEGORY_ACTIVE", "Kategori sudah aktif.");
  if (restore) {
    const duplicate = await ctx.db.query(
      "SELECT 1 FROM categories WHERE household_id=$1 AND kind=$2 AND lower(trim(name))=lower(trim($3)) AND archived_at IS NULL AND id<>$4 LIMIT 1",
      [ctx.household.id, kind, name, id],
    );
    if (duplicate.rowCount)
      fail(
        409,
        "CATEGORY_NAME",
        "Kategori aktif dengan nama dan jenis sama sudah ada. Ubah nama kategori ini sebelum mengaktifkannya kembali.",
      );
  }
  const rid = id ?? randomUUID();
  if (old)
    await ctx.db.query(
      "UPDATE categories SET name=$3,archived_at=CASE WHEN $4 THEN NULL ELSE archived_at END,version=version+1 WHERE household_id=$1 AND id=$2",
      [ctx.household.id, rid, name, restore],
    );
  else
    await ctx.db.query(
      "INSERT INTO categories(id,household_id,name,kind,created_by) VALUES($1,$2,$3,$4,$5)",
      [rid, ctx.household.id, name, kind, ctx.actor.id],
    );
  await audit(
    ctx,
    "category",
    rid,
    restore ? "restored" : old ? "updated" : "created",
    {
      name,
      kind,
    },
  );
  return { id: rid, version: (old?.version ?? 0) + 1 };
}
async function reference(
  ctx: Context,
  table: "financial_accounts" | "categories",
  id: string,
  oldId?: string,
  kind?: string,
) {
  const row = (
    await ctx.db.query(
      `SELECT * FROM ${table} WHERE household_id=$1 AND id=$2`,
      [ctx.household.id, id],
    )
  ).rows[0];
  if (!row || (row.archived_at && id !== oldId) || (kind && row.kind !== kind))
    fail(
      400,
      "INVALID_REFERENCE",
      "Rekening atau kategori tidak sesuai keluarga, jenis, atau status aktif.",
    );
  return row;
}
async function transactionNames(ctx: Context, id: string) {
  return (
    await ctx.db.query(
      `SELECT t.type,t.amount_minor,t.fee_minor,t.occurred_on,t.note,
        a.name AS account_name,d.name AS destination_name,c.name AS category_name,fc.name AS fee_category_name
      FROM transactions t
      JOIN financial_accounts a ON a.id=t.account_id AND a.household_id=t.household_id
      LEFT JOIN financial_accounts d ON d.id=t.destination_account_id AND d.household_id=t.household_id
      LEFT JOIN categories c ON c.id=t.category_id AND c.household_id=t.household_id
      LEFT JOIN categories fc ON fc.id=t.fee_category_id AND fc.household_id=t.household_id
      WHERE t.household_id=$1 AND t.id=$2`,
      [ctx.household.id, id],
    )
  ).rows[0];
}
export async function saveTransaction(ctx: Context, b: v.Body, id?: string) {
  const old = id
    ? await existing(ctx, "transactions", id, v.version(b.expected_version))
    : null;
  const type = v.oneOf(b.type, ["income", "expense", "transfer"]);
  const account = v.uuid(b.account_id),
    destination = v.optionalId(b.destination_account_id),
    category = v.optionalId(b.category_id),
    feeCategory = v.optionalId(b.fee_category_id);
  const amount = v.amount(b.amount_minor),
    fee = v.amount(b.fee_minor ?? "0", false, true),
    on = v.date(b.occurred_on),
    note = v.text(b.note ?? "", 500, true);
  if (on > today(ctx.household.timezone))
    fail(400, "FUTURE_DATE", "Transaksi tidak boleh bertanggal di masa depan.");
  const source = await reference(
    ctx,
    "financial_accounts",
    account,
    old?.account_id,
  );
  if (on < source.opening_date)
    fail(
      400,
      "BEFORE_OPENING",
      "Tanggal transaksi mendahului saldo awal rekening.",
    );
  let target: any = null,
    transactionCategory: any = null,
    transactionFeeCategory: any = null;
  if (type === "transfer") {
    if (
      !destination ||
      destination === account ||
      category ||
      (fee === "0" ? !!feeCategory : !feeCategory)
    )
      fail(
        400,
        "TRANSFER_SHAPE",
        "Rekening tujuan dan biaya transfer tidak sesuai.",
      );
    target = await reference(
      ctx,
      "financial_accounts",
      destination,
      old?.destination_account_id,
    );
    if (on < target.opening_date)
      fail(
        400,
        "BEFORE_OPENING",
        "Tanggal transfer mendahului saldo awal tujuan.",
      );
    if (feeCategory)
      transactionFeeCategory = await reference(
        ctx,
        "categories",
        feeCategory,
        old?.fee_category_id,
        "expense",
      );
  } else {
    if (!category || destination || fee !== "0" || feeCategory)
      fail(
        400,
        "TRANSACTION_SHAPE",
        "Isian pemasukan atau pengeluaran tidak sesuai.",
      );
    transactionCategory = await reference(
      ctx,
      "categories",
      category,
      old?.category_id,
      type,
    );
  }
  const previous = old ? await transactionNames(ctx, id!) : null;
  const rid = id ?? randomUUID(),
    values = [
      ctx.household.id,
      rid,
      type,
      account,
      destination,
      category,
      amount,
      fee,
      feeCategory,
      on,
      note,
      ctx.actor.id,
    ];
  if (old)
    await ctx.db.query(
      "UPDATE transactions SET type=$3,account_id=$4,destination_account_id=$5,category_id=$6,amount_minor=$7,fee_minor=$8,fee_category_id=$9,occurred_on=$10,note=$11,updated_by=$12,updated_at=now(),version=version+1 WHERE household_id=$1 AND id=$2",
      values,
    );
  else
    await ctx.db.query(
      "INSERT INTO transactions(household_id,id,type,account_id,destination_account_id,category_id,amount_minor,fee_minor,fee_category_id,occurred_on,note,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)",
      values,
    );
  const fields = [
    {
      label: "Jenis",
      before: previous?.type ?? null,
      after: type,
      format: "kind",
    },
    {
      label: "Rekening",
      before: previous?.account_name ?? null,
      after: source.name,
    },
    {
      label: "Rekening tujuan",
      before: previous?.destination_name ?? null,
      after: target?.name ?? null,
    },
    {
      label: "Kategori",
      before: previous?.category_name ?? null,
      after: transactionCategory?.name ?? null,
    },
    {
      label: "Nominal",
      before: previous?.amount_minor ?? null,
      after: amount,
      format: "money",
    },
    {
      label: "Biaya transfer",
      before: previous?.fee_minor ?? null,
      after: fee,
      format: "money",
    },
    {
      label: "Kategori biaya",
      before: previous?.fee_category_name ?? null,
      after: transactionFeeCategory?.name ?? null,
    },
    { label: "Tanggal", before: previous?.occurred_on ?? null, after: on },
  ].filter((field) =>
    old
      ? field.before !== field.after
      : field.after !== null &&
        !(field.label === "Biaya transfer" && field.after === "0"),
  );
  await audit(ctx, "transaction", rid, old ? "updated" : "created", {
    type,
    account_id: account,
    destination_account_id: destination,
    category_id: category,
    amount_minor: amount,
    fee_minor: fee,
    fee_category_id: feeCategory,
    occurred_on: on,
    note_changed: old ? old.note !== note : note !== "",
    fields,
  });
  return { id: rid, version: (old?.version ?? 0) + 1 };
}
export async function saveBudget(ctx: Context, b: v.Body, id?: string) {
  const old = id
    ? await existing(ctx, "budgets", id, v.version(b.expected_version))
    : null;
  const category = v.uuid(b.category_id),
    month = v.month(b.month_start),
    limit = v.amount(b.limit_minor);
  await reference(ctx, "categories", category, old?.category_id, "expense");
  const rid = id ?? randomUUID();
  if (old)
    await ctx.db.query(
      "UPDATE budgets SET category_id=$3,month_start=$4,limit_minor=$5,updated_by=$6,updated_at=now(),version=version+1 WHERE household_id=$1 AND id=$2",
      [ctx.household.id, rid, category, month, limit, ctx.actor.id],
    );
  else
    await ctx.db.query(
      "INSERT INTO budgets(id,household_id,category_id,month_start,limit_minor,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$6)",
      [rid, ctx.household.id, category, month, limit, ctx.actor.id],
    );
  await audit(ctx, "budget", rid, old ? "updated" : "created", {
    category_id: category,
    month_start: month,
    limit_minor: limit,
  });
  return { id: rid, version: (old?.version ?? 0) + 1 };
}
export async function remove(
  ctx: Context,
  resource: string,
  id: string,
  b: v.Body,
) {
  const tables = {
    accounts: "financial_accounts",
    categories: "categories",
    transactions: "transactions",
    budgets: "budgets",
  } as const;
  const table = Object.hasOwn(tables, resource)
    ? tables[resource as keyof typeof tables]
    : undefined;
  if (!table) fail(404, "NOT_FOUND", "Tindakan tidak ditemukan.");
  const row = await existing(ctx, table, id, v.version(b.expected_version));
  if (table === "transactions")
    await ctx.db.query(
      "UPDATE transactions SET deleted_at=now(),deleted_by=$3,updated_by=$3,updated_at=now(),version=version+1 WHERE household_id=$1 AND id=$2",
      [ctx.household.id, id, ctx.actor.id],
    );
  else if (table === "budgets")
    await ctx.db.query("DELETE FROM budgets WHERE household_id=$1 AND id=$2", [
      ctx.household.id,
      id,
    ]);
  else
    await ctx.db.query(
      `UPDATE ${table} SET archived_at=now(),version=version+1 WHERE household_id=$1 AND id=$2`,
      [ctx.household.id, id],
    );
  await audit(
    ctx,
    resource,
    id,
    table === "transactions" || table === "budgets" ? "deleted" : "archived",
    { previous_version: row.version },
  );
  return { id, version: row.version + 1 };
}
