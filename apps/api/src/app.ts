import Fastify, { LogController, type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import { fromNodeHeaders } from "better-auth/node";
import { randomUUID } from "node:crypto";
import { createAuth, type Config, type Mail } from "./auth.js";
import type { Database } from "./db.js";
import { fail, HttpError } from "./errors.js";
import { mutate, read, type Actor } from "./access.js";
import * as v from "./validation.js";
import * as finance from "./finance.js";
import * as reports from "./reports.js";
import * as households from "./households.js";
import { requestDeletion } from "./deletion.js";
export async function createApp(
  pool: Database,
  config: Config,
  sendMail: Mail,
  logging = false,
) {
  const app = Fastify({
    logger: logging,
    logController: new LogController({ disableRequestLogging: true }),
    bodyLimit: 32 * 1024,
    trustProxy: false,
  });
  const auth = createAuth(pool, config, sendMail);
  await app.register(cors, {
    origin: config.origins.filter((o) => o.startsWith("http")),
    credentials: true,
  });
  await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });
  await app.register(swagger, {
    openapi: { info: { title: "Cash Flow API", version: "0.1.0" } },
  });
  app.setErrorHandler((e, _req, reply) => {
    if (e instanceof HttpError)
      return reply
        .status(e.status)
        .send({ code: e.code, message: e.message, details: e.details });
    const err = e as {
      code?: string;
      statusCode?: number;
      validation?: unknown;
    };
    if (err.code === "23505")
      return reply.status(409).send({
        code: "DUPLICATE",
        message: "Data serupa sudah ada. Muat ulang sebelum mencoba lagi.",
      });
    if (
      err.validation ||
      err.code === "23514" ||
      err.code === "23503" ||
      err.code === "22P02"
    )
      return reply.status(400).send({
        code: "INVALID_INPUT",
        message: "Isian atau referensi tidak valid.",
      });
    if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500)
      return reply.status(err.statusCode).send({
        code: "REQUEST_REJECTED",
        message: "Permintaan ditolak. Periksa isian atau coba kembali nanti.",
      });
    app.log.error({ code: err.code ?? "INTERNAL_ERROR" }, "Request failed");
    return reply.status(500).send({
      code: "INTERNAL_ERROR",
      message:
        "Penyimpanan belum dapat dipastikan. Coba lagi dengan isian yang sama.",
    });
  });
  app.get("/health/live", async () => ({ status: "ok" }));
  app.get("/health/ready", async () => {
    await pool.query("SELECT id FROM households LIMIT 0");
    await pool.query("SELECT id FROM auth_users LIMIT 0");
    return { status: "ready" };
  });
  app.get("/openapi.json", async () => app.swagger());
  app.get("/account-deletion", async (_req, reply) =>
    reply
      .type("text/html")
      .send(
        '<!doctype html><html lang="id"><meta name="viewport" content="width=device-width"><title>Penghapusan akun Cash Flow</title><main><h1>Penghapusan akun Cash Flow</h1><p>Di aplikasi, buka Keluarga → Akun saya → Hapus akun. Alihkan kepemilikan keluarga atau hapus keluarga yang Anda miliki terlebih dahulu.</p><p>Akun login dan sesi dihapus. Catatan keuangan yang telah dibagikan tetap tersimpan, dengan pencatat bernama “Pengguna dihapus”. Catatan bebas dan file yang pernah diekspor tetap merupakan data bersama.</p><p>Jika tidak dapat masuk, gunakan Atur ulang kata sandi di aplikasi. Kebijakan backup dan kontak dukungan harus ditetapkan sebelum peluncuran publik.</p></main></html>',
      ),
  );
  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    handler: async (req, reply) => {
      const headers = fromNodeHeaders(req.headers);
      headers.set("x-cashflow-client-ip", req.ip);
      const request = new Request(new URL(req.url, config.authURL), {
        method: req.method,
        headers,
        ...(req.method !== "GET"
          ? { body: JSON.stringify(req.body ?? {}) }
          : {}),
      });
      const response = await auth.handler(request);
      reply.code(response.status);
      for (const [name, value] of response.headers)
        if (name !== "set-cookie") reply.header(name, value);
      const cookies = response.headers.getSetCookie();
      if (cookies.length) reply.header("set-cookie", cookies);
      return reply.send(await response.text());
    },
  });
  async function actor(req: FastifyRequest): Promise<Actor> {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) fail(401, "SIGN_IN_REQUIRED", "Silakan masuk kembali.");
    if (!session.user.emailVerified)
      fail(403, "VERIFY_EMAIL", "Verifikasi email sebelum mengakses keluarga.");
    await pool.query(
      "INSERT INTO profiles(id,auth_user_id,display_name) VALUES($1,$2,$3) ON CONFLICT(auth_user_id) DO NOTHING",
      [
        randomUUID(),
        session.user.id,
        session.user.name.slice(0, 80) || "Anggota",
      ],
    );
    const profile = (
      await pool.query("SELECT id,status FROM profiles WHERE auth_user_id=$1", [
        session.user.id,
      ])
    ).rows[0];
    if (profile?.status !== "active")
      fail(
        403,
        "ACCOUNT_UNAVAILABLE",
        "Akun sedang dihapus atau tidak lagi aktif.",
      );
    return {
      id: profile.id,
      authId: session.user.id,
      email: session.user.email,
    };
  }
  const params = (req: FastifyRequest) => req.params as Record<string, string>;
  const query = (req: FastifyRequest) => req.query as v.Body;
  const mutationSchema = {
    body: { type: "object", maxProperties: 24, additionalProperties: true },
    headers: {
      type: "object",
      required: ["idempotency-key"],
      properties: { "idempotency-key": { type: "string", format: "uuid" } },
    },
  };
  app.get("/me", async (req) => {
    const a = await actor(req);
    const profile = (
      await pool.query("SELECT id,display_name FROM profiles WHERE id=$1", [
        a.id,
      ])
    ).rows[0];
    const hs = (
      await pool.query(
        "SELECT h.*,m.role FROM households h JOIN household_members m ON m.household_id=h.id WHERE m.profile_id=$1 AND m.status='active' AND h.deleted_at IS NULL ORDER BY h.created_at,h.id",
        [a.id],
      )
    ).rows;
    const invitations = (
      await pool.query(
        "SELECT i.id,h.name AS household_name,i.expires_at FROM household_invitations i JOIN households h ON h.id=i.household_id WHERE i.email_normalized=$1 AND i.status='pending' AND i.expires_at>now() AND h.deleted_at IS NULL ORDER BY i.created_at DESC",
        [a.email.toLowerCase()],
      )
    ).rows;
    return { ...profile, email: a.email, households: hs, invitations };
  });
  app.post("/households", { schema: mutationSchema }, async (req) => {
    const a = await actor(req),
      b = v.body(req.body);
    return mutate(
      pool,
      a,
      undefined,
      req.headers["idempotency-key"],
      "POST /households",
      b,
      (ctx) => households.createHousehold(ctx, b),
    );
  });
  app.get("/invitations/:id", async (req) => {
    const a = await actor(req);
    const invitation = (
      await pool.query(
        "SELECT i.id,h.name AS household_name FROM household_invitations i JOIN households h ON h.id=i.household_id WHERE i.id=$1 AND i.email_normalized=$2 AND i.status='pending' AND i.expires_at>now() AND h.deleted_at IS NULL",
        [v.uuid(params(req).id), a.email.toLowerCase()],
      )
    ).rows[0];
    if (!invitation)
      fail(
        403,
        "INVITATION_UNAVAILABLE",
        "Undangan tidak tersedia untuk email ini.",
      );
    return invitation;
  });
  app.post(
    "/invitations/:id/accept",
    { schema: mutationSchema },
    async (req) => {
      const a = await actor(req),
        id = v.uuid(params(req).id);
      const invitation = (
        await pool.query(
          "SELECT household_id FROM household_invitations WHERE id=$1 AND email_normalized=$2",
          [id, a.email.toLowerCase()],
        )
      ).rows[0];
      if (!invitation)
        fail(
          403,
          "INVITATION_UNAVAILABLE",
          "Undangan tidak tersedia untuk email ini.",
        );
      return mutate(
        pool,
        a,
        invitation.household_id,
        req.headers["idempotency-key"],
        `POST /invitations/${id}/accept`,
        {},
        (ctx) => households.accept(ctx, id),
        true,
      );
    },
  );
  app.get("/households/:hid/:resource", async (req, reply) => {
    reply.header("cache-control", "no-store");
    const a = await actor(req),
      { hid, resource } = params(req),
      q = query(req);
    return read(pool, a, v.uuid(hid), async (ctx) => {
      if (resource === "summary") return reports.summary(ctx, q);
      if (resource === "accounts") return reports.accounts(ctx);
      if (resource === "recorders")
        return (
          await ctx.db.query(
            "SELECT p.id AS profile_id,p.display_name FROM profiles p WHERE EXISTS(SELECT 1 FROM transactions t WHERE t.household_id=$1 AND t.created_by=p.id) OR EXISTS(SELECT 1 FROM household_members m WHERE m.household_id=$1 AND m.profile_id=p.id AND m.status='active') ORDER BY p.display_name,p.id",
            [hid],
          )
        ).rows;
      if (resource === "categories")
        return (
          await ctx.db.query(
            "SELECT * FROM categories WHERE household_id=$1 ORDER BY kind,name,id",
            [hid],
          )
        ).rows;
      if (resource === "transactions") return reports.transactions(ctx, q);
      if (resource === "budgets") return reports.budgets(ctx, q.month);
      if (resource === "members")
        return (
          await ctx.db.query(
            "SELECT m.*,p.display_name FROM household_members m JOIN profiles p ON p.id=m.profile_id WHERE m.household_id=$1 AND m.status='active' ORDER BY m.role DESC,m.joined_at",
            [hid],
          )
        ).rows;
      if (resource === "invitations") {
        if (ctx.role !== "owner")
          fail(403, "OWNER_REQUIRED", "Hanya pemilik dapat melihat undangan.");
        return (
          await ctx.db.query(
            "SELECT id,email_normalized,CASE WHEN status='pending' AND expires_at<=now() THEN 'expired' ELSE status END AS status,expires_at,version FROM household_invitations WHERE household_id=$1 ORDER BY created_at DESC LIMIT 100",
            [hid],
          )
        ).rows;
      }
      if (resource === "audit") {
        const values: unknown[] = [hid, ctx.role === "owner"];
        let cursor = "";
        if (q.cursor) {
          const c = v.text(q.cursor, 200).split("|");
          if (
            c.length !== 2 ||
            !/^\d{4}-\d{2}-\d{2}T/.test(c[0]) ||
            Number.isNaN(Date.parse(c[0]))
          )
            fail(400, "INVALID_CURSOR", "Posisi riwayat tidak valid.");
          values.push(v.text(c[0], 40), v.uuid(c[1]));
          cursor = " AND (a.created_at,a.id)<($3::timestamptz,$4::uuid)";
        }
        const rows = (
          await ctx.db.query(
            `SELECT a.*,p.display_name AS actor_name FROM audit_events a JOIN profiles p ON p.id=a.actor_profile_id WHERE a.household_id=$1 AND (a.visibility='finance' OR $2::boolean) ${cursor} ORDER BY a.created_at DESC,a.id DESC LIMIT 51`,
            values,
          )
        ).rows;
        const items = rows.slice(0, 50),
          last = items.at(-1);
        return {
          items,
          next_cursor:
            rows.length > 50
              ? `${last.created_at.toISOString()}|${last.id}`
              : null,
        };
      }
      if (resource === "export") {
        const result = await reports.csv(ctx, q);
        reply
          .header("content-type", "text/csv; charset=utf-8")
          .header(
            "content-disposition",
            'attachment; filename="cash-flow.csv"',
          );
        return result;
      }
      fail(404, "NOT_FOUND", "Data tidak ditemukan.");
    });
  });
  app.get("/households/:hid/transactions/:id", async (req) => {
    const a = await actor(req),
      { hid, id } = params(req);
    return read(pool, a, v.uuid(hid), async (ctx) => {
      const row = (
        await ctx.db.query(
          "SELECT t.*,p.display_name AS actor_name FROM transactions t JOIN profiles p ON p.id=t.created_by WHERE t.household_id=$1 AND t.id=$2 AND t.deleted_at IS NULL",
          [hid, v.uuid(id)],
        )
      ).rows[0];
      if (!row) fail(404, "NOT_FOUND", "Transaksi tidak ditemukan.");
      return row;
    });
  });
  for (const method of ["POST", "PUT", "DELETE"] as const) {
    app.route({
      method,
      url:
        method === "POST"
          ? "/households/:hid/:resource"
          : "/households/:hid/:resource/:id",
      schema: mutationSchema,
      handler: async (req) => {
        const a = await actor(req),
          { hid, resource, id } = params(req),
          b = v.body(req.body);
        if (id) v.uuid(id);
        return mutate(
          pool,
          a,
          v.uuid(hid),
          req.headers["idempotency-key"],
          `${method} /households/${hid}/${resource}${id ? "/" + id : ""}`,
          b,
          async (ctx) => {
            if (method === "DELETE")
              return finance.remove(ctx, resource, id, b);
            if (resource === "accounts") return finance.saveAccount(ctx, b, id);
            if (resource === "categories")
              return finance.saveCategory(ctx, b, id);
            if (resource === "transactions")
              return finance.saveTransaction(ctx, b, id);
            if (resource === "budgets") return finance.saveBudget(ctx, b, id);
            if (method === "POST" && resource === "invitations")
              return households.invite(ctx, b);
            if (method === "POST")
              return households.householdAction(ctx, resource, b);
            fail(404, "NOT_FOUND", "Tindakan tidak ditemukan.");
          },
        );
      },
    });
  }
  app.post(
    "/me/deletion",
    {
      schema: mutationSchema,
      config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
    },
    async (req) => {
      const a = await actor(req),
        b = v.body(req.body);
      v.uuid(req.headers["idempotency-key"]);
      if (
        typeof b.password !== "string" ||
        b.password.length < 1 ||
        b.password.length > 128
      )
        fail(400, "INVALID_INPUT", "Konfirmasi kata sandi diperlukan.");
      const password = b.password;
      try {
        await auth.api.verifyPassword({
          headers: fromNodeHeaders(req.headers),
          body: { password },
        });
      } catch {
        fail(
          400,
          "PASSWORD_REQUIRED",
          "Kata sandi tidak sesuai atau sesi perlu diperbarui. Masuk kembali lalu coba lagi.",
        );
      }
      return requestDeletion(pool, a);
    },
  );
  return { app, auth };
}
