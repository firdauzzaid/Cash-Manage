import { randomUUID } from "node:crypto";
import type { Actor } from "./access.js";
import { transaction, audit } from "./access.js";
import type { Database, PoolClient } from "./db.js";
import { fail } from "./errors.js";
async function lockHouseholds(db: PoolClient, profile: string) {
  return (
    await db.query(
      "SELECT h.id FROM households h JOIN household_members m ON m.household_id=h.id WHERE m.profile_id=$1 AND m.status='active' AND h.deleted_at IS NULL ORDER BY h.id FOR UPDATE OF h",
      [profile],
    )
  ).rows;
}
export async function requestDeletion(pool: Database, actor: Actor) {
  return transaction(pool, async (db) => {
    const profile = (
      await db.query("SELECT * FROM profiles WHERE id=$1 FOR UPDATE", [
        actor.id,
      ])
    ).rows[0];
    if (!profile || profile.status === "deleted")
      fail(403, "ACCOUNT_UNAVAILABLE", "Akun tidak lagi aktif.");
    const prior = (
      await db.query(
        "SELECT id,status FROM deletion_requests WHERE profile_id=$1",
        [actor.id],
      )
    ).rows[0];
    if (prior) return prior;
    await lockHouseholds(db, actor.id);
    if (
      (
        await db.query(
          "SELECT 1 FROM household_members m JOIN households h ON h.id=m.household_id WHERE m.profile_id=$1 AND m.role='owner' AND m.status='active' AND h.deleted_at IS NULL",
          [actor.id],
        )
      ).rowCount
    )
      fail(
        409,
        "OWNER_TRANSFER_REQUIRED",
        "Alihkan kepemilikan atau hapus keluarga yang Anda miliki sebelum menghapus akun.",
      );
    const id = randomUUID();
    await db.query(
      "INSERT INTO deletion_requests(id,profile_id) VALUES($1,$2)",
      [id, actor.id],
    );
    await db.query(
      "UPDATE profiles SET status='deletion_pending' WHERE id=$1",
      [actor.id],
    );
    return { id, status: "requested" };
  });
}
export async function processDeletions(pool: Database) {
  const requests = (
    await pool.query(
      "SELECT profile_id FROM deletion_requests WHERE status IN ('requested','failed') ORDER BY requested_at LIMIT 25",
    )
  ).rows;
  let completed = 0;
  for (const request of requests) {
    try {
      const done = await transaction(pool, async (db) => {
        const profile = (
          await db.query("SELECT * FROM profiles WHERE id=$1 FOR UPDATE", [
            request.profile_id,
          ])
        ).rows[0];
        const job = (
          await db.query(
            "SELECT * FROM deletion_requests WHERE profile_id=$1 AND status<>'completed' FOR UPDATE",
            [request.profile_id],
          )
        ).rows[0];
        if (!job) return false;
        const households = await lockHouseholds(db, profile.id);
        if (
          (
            await db.query(
              "SELECT 1 FROM household_members m JOIN households h ON h.id=m.household_id WHERE m.profile_id=$1 AND m.role='owner' AND m.status='active' AND h.deleted_at IS NULL",
              [profile.id],
            )
          ).rowCount
        )
          throw new Error("OWNER_TRANSFER_REQUIRED");
        const authUser = (
          await db.query("SELECT email FROM auth_users WHERE id=$1", [
            profile.auth_user_id,
          ])
        ).rows[0];
        for (const h of households) {
          await audit(
            {
              db,
              actor: { id: profile.id, email: "", authId: "" },
              household: h,
              role: null,
            },
            "member",
            profile.id,
            "account_deleted",
            {},
            "admin",
          );
          await db.query(
            "UPDATE households SET revision=revision+1 WHERE id=$1",
            [h.id],
          );
        }
        await db.query(
          "UPDATE household_members SET status='revoked',revoked_at=now(),version=version+1 WHERE profile_id=$1 AND status='active'",
          [profile.id],
        );
        if (authUser) {
          await db.query(
            "UPDATE household_invitations SET email_normalized='deleted-'||id::text,status=CASE WHEN status='pending' THEN 'revoked' ELSE status END,version=version+1 WHERE email_normalized=$1",
            [authUser.email.toLowerCase()],
          );
          await db.query(
            "DELETE FROM auth_verifications WHERE identifier=$1 OR value=$2",
            [authUser.email, profile.auth_user_id],
          );
        }
        // Auth credentials and sessions cascade; historical finance references the retained profile.
        await db.query(
          "UPDATE profiles SET display_name='Pengguna dihapus',status='deleted',auth_user_id=NULL,deleted_at=now() WHERE id=$1",
          [profile.id],
        );
        await db.query("DELETE FROM auth_users WHERE id=$1", [
          profile.auth_user_id,
        ]);
        await db.query(
          "UPDATE deletion_requests SET status='completed',completed_at=now(),attempt_count=attempt_count+1,last_error_code=NULL WHERE id=$1",
          [job.id],
        );
        return true;
      });
      if (done) completed++;
    } catch {
      await pool.query(
        "UPDATE deletion_requests SET status='failed',attempt_count=attempt_count+1,last_error_code='PROCESSING_FAILED' WHERE profile_id=$1 AND status<>'completed'",
        [request.profile_id],
      );
    }
  }
  return { completed };
}
