import { createHash, randomUUID } from "node:crypto";
import type { Database, PoolClient } from "./db.js";
import { fail } from "./errors.js";
import { uuid } from "./validation.js";
export type Actor = { id: string; email: string; authId: string };
export type Context = {
  db: PoolClient;
  actor: Actor;
  household: any;
  role: "owner" | "member" | null;
};
export async function transaction<T>(
  pool: Database,
  work: (db: PoolClient) => Promise<T>,
): Promise<T> {
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const result = await work(db);
    await db.query("COMMIT");
    return result;
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  } finally {
    db.release();
  }
}
async function access(
  db: PoolClient,
  actor: Actor,
  hid?: string,
  joining = false,
  writing = false,
): Promise<Context> {
  const p = await db.query(
    "SELECT status FROM profiles WHERE id=$1 FOR SHARE",
    [actor.id],
  );
  if (p.rows[0]?.status !== "active")
    fail(403, "ACCOUNT_UNAVAILABLE", "Akun tidak lagi aktif.");
  let household: any = null,
    role: Context["role"] = null;
  if (hid) {
    uuid(hid);
    household = (
      await db.query(
        `SELECT * FROM households WHERE id=$1 AND deleted_at IS NULL FOR ${writing ? "UPDATE" : "SHARE"}`,
        [hid],
      )
    ).rows[0];
    const membership = (
      await db.query(
        "SELECT role FROM household_members WHERE household_id=$1 AND profile_id=$2 AND status='active'",
        [hid, actor.id],
      )
    ).rows[0];
    if (!household || (!joining && !membership))
      fail(403, "HOUSEHOLD_ACCESS", "Akses keluarga tidak tersedia.");
    role = membership?.role ?? null;
  }
  return { db, actor, household, role };
}
export function owner(ctx: Context) {
  if (ctx.role !== "owner")
    fail(
      403,
      "OWNER_REQUIRED",
      "Tindakan ini hanya tersedia untuk pemilik keluarga.",
    );
}
export function read<T>(
  pool: Database,
  actor: Actor,
  hid: string,
  work: (ctx: Context) => Promise<T>,
) {
  return transaction(pool, async (db) => work(await access(db, actor, hid)));
}
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v !== null && typeof v === "object")
    return `{${Object.keys(v)
      .sort()
      .map(
        (k) =>
          `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`,
      )
      .join(",")}}`;
  return JSON.stringify(v) ?? "null";
}
export async function mutate(
  pool: Database,
  actor: Actor,
  hid: string | undefined,
  key: unknown,
  operation: string,
  payload: unknown,
  work: (ctx: Context) => Promise<unknown>,
  joining = false,
) {
  const requestKey = uuid(key);
  const hash = createHash("sha256").update(canonical(payload)).digest("hex");
  return transaction(pool, async (db) => {
    // Serialize retries before household locks, including simultaneous requests to different households.
    await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      `${actor.id}:${requestKey}`,
    ]);
    const ctx = await access(db, actor, hid, joining, true);
    const prior = (
      await db.query(
        "SELECT * FROM mutation_requests WHERE actor_profile_id=$1 AND idempotency_key=$2",
        [actor.id, requestKey],
      )
    ).rows[0];
    if (prior) {
      if (prior.operation !== operation || prior.payload_hash !== hash)
        fail(
          409,
          "KEY_REUSED",
          "Kunci penyimpanan sudah digunakan untuk isian lain.",
        );
      return prior.result;
    }
    const result = await work(ctx);
    if (hid)
      await db.query("UPDATE households SET revision=revision+1 WHERE id=$1", [
        hid,
      ]);
    await db.query(
      "INSERT INTO mutation_requests(id,actor_profile_id,household_id,idempotency_key,operation,payload_hash,result) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [
        randomUUID(),
        actor.id,
        hid ?? null,
        requestKey,
        operation,
        hash,
        JSON.stringify(result),
      ],
    );
    return result;
  });
}
export async function audit(
  ctx: Context,
  entity: string,
  id: string,
  action: string,
  changes: Record<string, unknown>,
  visibility = "finance",
) {
  await ctx.db.query(
    "INSERT INTO audit_events(id,household_id,actor_profile_id,entity_type,entity_id,action,visibility,changes) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
    [
      randomUUID(),
      ctx.household.id,
      ctx.actor.id,
      entity,
      id,
      action,
      visibility,
      JSON.stringify(changes),
    ],
  );
}
export async function existing(
  ctx: Context,
  table:
    | "financial_accounts"
    | "categories"
    | "transactions"
    | "budgets"
    | "household_members"
    | "household_invitations",
  id: string,
  expected: number,
) {
  const row = (
    await ctx.db.query(
      `SELECT * FROM ${table} WHERE household_id=$1 AND id=$2`,
      [ctx.household.id, uuid(id)],
    )
  ).rows[0];
  if (!row || row.deleted_at) fail(404, "NOT_FOUND", "Data tidak ditemukan.");
  if (row.version !== expected)
    fail(
      409,
      "VERSION_CONFLICT",
      "Data telah berubah. Tinjau perubahan sebelum menyimpan lagi.",
      { current: row },
    );
  return row;
}
