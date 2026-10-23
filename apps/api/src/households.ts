import { randomUUID } from "node:crypto";
import { audit, existing, owner, type Context } from "./access.js";
import { fail } from "./errors.js";
import * as v from "./validation.js";
export async function createHousehold(ctx: Context, b: v.Body) {
  const id = randomUUID(),
    name = v.text(b.name),
    timezone = v.text(b.timezone ?? "Asia/Jakarta");
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
  } catch {
    fail(400, "TIMEZONE", "Zona waktu tidak valid.");
  }
  await ctx.db.query(
    "INSERT INTO households(id,name,timezone,created_by) VALUES($1,$2,$3,$4)",
    [id, name, timezone, ctx.actor.id],
  );
  await ctx.db.query(
    "INSERT INTO household_members(id,household_id,profile_id,role) VALUES($1,$2,$3,'owner')",
    [randomUUID(), id, ctx.actor.id],
  );
  for (const [category, kind] of [
    ["Gaji", "income"],
    ["Pemasukan lain", "income"],
    ["Belanja rumah", "expense"],
    ["Makan & minum", "expense"],
    ["Transportasi", "expense"],
    ["Tagihan", "expense"],
    ["Kesehatan", "expense"],
    ["Pendidikan", "expense"],
    ["Hiburan", "expense"],
    ["Biaya transfer", "expense"],
    ["Lainnya", "expense"],
  ]) {
    await ctx.db.query(
      "INSERT INTO categories(id,household_id,name,kind,created_by) VALUES($1,$2,$3,$4,$5)",
      [randomUUID(), id, category, kind, ctx.actor.id],
    );
  }
  ctx.household = { id };
  await audit(ctx, "household", id, "created", { name, timezone }, "admin");
  return { id, version: 1 };
}
export async function invite(ctx: Context, b: v.Body) {
  owner(ctx);
  const email = v.email(b.email),
    id = randomUUID();
  await ctx.db.query(
    "UPDATE household_invitations SET status='expired',version=version+1 WHERE household_id=$1 AND email_normalized=$2 AND status='pending' AND expires_at<=now()",
    [ctx.household.id, email],
  );
  await ctx.db.query(
    "INSERT INTO household_invitations(id,household_id,invited_by,email_normalized) VALUES($1,$2,$3,$4)",
    [id, ctx.household.id, ctx.actor.id, email],
  );
  await audit(ctx, "invitation", id, "created", {}, "admin");
  return { id, version: 1 };
}
export async function accept(ctx: Context, id: string) {
  const invitation = (
    await ctx.db.query(
      "SELECT * FROM household_invitations WHERE id=$1 AND household_id=$2",
      [id, ctx.household.id],
    )
  ).rows[0];
  if (
    !invitation ||
    invitation.email_normalized !== ctx.actor.email.toLowerCase() ||
    invitation.status !== "pending" ||
    new Date(invitation.expires_at).getTime() <= Date.now()
  )
    fail(
      403,
      "INVITATION_UNAVAILABLE",
      "Undangan tidak tersedia untuk email ini atau telah kedaluwarsa.",
    );
  const active = (
    await ctx.db.query(
      "SELECT id FROM household_members WHERE household_id=$1 AND profile_id=$2 AND status='active'",
      [ctx.household.id, ctx.actor.id],
    )
  ).rowCount;
  if (!active)
    await ctx.db.query(
      "INSERT INTO household_members(id,household_id,profile_id,role) VALUES($1,$2,$3,'member') ON CONFLICT(household_id,profile_id) DO UPDATE SET status='active',role='member',joined_at=now(),revoked_at=NULL,version=household_members.version+1",
      [randomUUID(), ctx.household.id, ctx.actor.id],
    );
  await ctx.db.query(
    "UPDATE household_invitations SET status='accepted',accepted_by=$2,accepted_at=now(),version=version+1 WHERE id=$1",
    [id, ctx.actor.id],
  );
  await audit(ctx, "invitation", id, "accepted", {}, "admin");
  return { id: ctx.household.id, version: invitation.version + 1 };
}
export async function householdAction(ctx: Context, action: string, b: v.Body) {
  if (action === "leave") {
    if (ctx.role === "owner")
      fail(
        409,
        "OWNER_TRANSFER_REQUIRED",
        "Alihkan kepemilikan atau hapus keluarga sebelum keluar.",
      );
    await ctx.db.query(
      "UPDATE household_members SET status='revoked',revoked_at=now(),version=version+1 WHERE household_id=$1 AND profile_id=$2",
      [ctx.household.id, ctx.actor.id],
    );
    await audit(ctx, "member", ctx.actor.id, "left", {}, "admin");
  } else {
    owner(ctx);
    if (action === "rename" || action === "delete") {
      if (ctx.household.version !== v.version(b.expected_version))
        fail(409, "VERSION_CONFLICT", "Keluarga telah berubah.", {
          current: ctx.household,
        });
      if (action === "rename") {
        const name = v.text(b.name);
        await ctx.db.query(
          "UPDATE households SET name=$2,version=version+1 WHERE id=$1",
          [ctx.household.id, name],
        );
        await audit(
          ctx,
          "household",
          ctx.household.id,
          "renamed",
          { name },
          "admin",
        );
      } else {
        if (b.confirm_name !== ctx.household.name)
          fail(
            400,
            "CONFIRM_NAME",
            "Ketik nama keluarga dengan tepat untuk menghapus.",
          );
        await audit(ctx, "household", ctx.household.id, "deleted", {}, "admin");
        await ctx.db.query(
          "UPDATE households SET deleted_at=now(),version=version+1 WHERE id=$1",
          [ctx.household.id],
        );
        await ctx.db.query(
          "UPDATE household_invitations SET status='revoked',version=version+1 WHERE household_id=$1 AND status='pending'",
          [ctx.household.id],
        );
      }
    } else if (action === "transfer-owner" || action === "revoke-member") {
      const member = await existing(
        ctx,
        "household_members",
        v.uuid(b.member_id),
        v.version(b.expected_version),
      );
      if (member.status !== "active" || member.role === "owner")
        fail(400, "INVALID_MEMBER", "Pilih anggota aktif selain pemilik.");
      const profile = (
        await ctx.db.query("SELECT status FROM profiles WHERE id=$1", [
          member.profile_id,
        ])
      ).rows[0];
      if (profile?.status !== "active")
        fail(409, "ACCOUNT_UNAVAILABLE", "Anggota tidak lagi aktif.");
      if (action === "transfer-owner") {
        await ctx.db.query(
          "UPDATE household_members SET role='member',version=version+1 WHERE household_id=$1 AND role='owner' AND status='active'",
          [ctx.household.id],
        );
        await ctx.db.query(
          "UPDATE household_members SET role='owner',version=version+1 WHERE household_id=$1 AND id=$2",
          [ctx.household.id, member.id],
        );
      } else
        await ctx.db.query(
          "UPDATE household_members SET status='revoked',revoked_at=now(),version=version+1 WHERE household_id=$1 AND id=$2",
          [ctx.household.id, member.id],
        );
      await audit(ctx, "member", member.id, action, {}, "admin");
    } else if (action === "revoke-invitation") {
      const invitation = await existing(
        ctx,
        "household_invitations",
        v.uuid(b.invitation_id),
        v.version(b.expected_version),
      );
      if (invitation.status !== "pending")
        fail(409, "INVITATION_UNAVAILABLE", "Undangan tidak lagi menunggu.");
      await ctx.db.query(
        "UPDATE household_invitations SET status='revoked',version=version+1 WHERE id=$1",
        [invitation.id],
      );
      await audit(ctx, "invitation", invitation.id, "revoked", {}, "admin");
    } else fail(404, "NOT_FOUND", "Tindakan tidak ditemukan.");
  }
  return { id: ctx.household.id };
}
