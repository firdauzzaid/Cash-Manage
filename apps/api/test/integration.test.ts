import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHash, randomBytes } from "node:crypto";
import { Pool } from "../src/db.js";
import { createApp } from "../src/app.js";
import { processDeletions } from "../src/deletion.js";
import {
  beginGmailAuthorization,
  finishGmailAuthorization,
  type GmailConfig,
} from "../src/gmail.js";
const testURL = process.env.TEST_DATABASE_URL;
test(
  "real PostgreSQL: shared finance, tenant isolation, retries and account deletion",
  { skip: !testURL, timeout: 120000 },
  async (t) => {
    assert.equal(
      new URL(testURL!).pathname,
      "/cashflow_test",
      "Never run integration tests on an application database",
    );
    const admin = new Pool({ connectionString: testURL }),
      runtimeURL = new URL(testURL!);
    runtimeURL.username = "cashflow_app";
    runtimeURL.password = process.env.APP_DB_PASSWORD!;
    const pool = new Pool({ connectionString: runtimeURL.toString(), max: 8 });
    const mail = new Map<string, string>();
    const gmail: GmailConfig = {
      clientId: "test-client",
      redirectURL: "https://cashflow.example/v1/gmail/oauth/callback",
      encryptionKey: randomBytes(32),
      labelName: "Cash Flow",
      mobileReturnURL: "cashflow://profile",
    };
    const { app } = await createApp(
      pool,
      {
        authURL: "http://localhost:4310",
        authSecret: process.env.BETTER_AUTH_SECRET!,
        origins: ["http://localhost:4310", "cashflow://"],
        production: false,
        gmail,
      },
      async (m) => {
        mail.set(m.to, m.text);
      },
    );
    await app.ready();
    t.after(async () => {
      await app.close();
      await pool.end();
      await admin.end();
    });
    const password = "Household-check-489!";
    async function call(
      cookie: string,
      method: "GET" | "POST" | "PUT" | "DELETE",
      url: string,
      b?: unknown,
      key = randomUUID(),
    ) {
      const digest = createHash("sha256")
        .update(String((b as any)?.email ?? cookie ?? key))
        .digest();
      return app.inject({
        remoteAddress: `127.0.${digest[0]}.${digest[1]}`,
        method,
        url,
        headers: {
          cookie,
          origin: "http://localhost:4310",
          "idempotency-key": key,
        },
        ...(b !== undefined ? { payload: b } : {}),
      });
    }
    async function user() {
      const email = `test-${randomUUID()}@cashflow.example`;
      const signup = await call("", "POST", "/api/auth/sign-up/email", {
        name: "Anggota uji",
        email,
        password,
      });
      assert.equal(signup.statusCode, 200, signup.body);
      const link = mail.get(email)?.match(/https?:\/\/\S+/)?.[0];
      assert.ok(link, "verification email must be sent");
      const verify = await call(
        "",
        "GET",
        new URL(link).pathname + new URL(link).search,
      );
      assert.ok(verify.statusCode < 400, verify.body);
      const signin = await call("", "POST", "/api/auth/sign-in/email", {
        email,
        password,
      });
      assert.equal(signin.statusCode, 200, signin.body);
      const set = signin.headers["set-cookie"];
      const cookie = (Array.isArray(set) ? set : [set])
        .filter(Boolean)
        .map((s) => String(s).split(";")[0])
        .join("; ");
      const me = await call(cookie, "GET", "/me");
      assert.equal(me.statusCode, 200, me.body);
      return { email, cookie, profile: me.json().id };
    }
    const a = await user(),
      b = await user(),
      outsider = await user();
    const create = await call(a.cookie, "POST", "/households", {
      name: "Keluarga uji " + randomUUID(),
      timezone: "Asia/Jakarta",
    });
    assert.equal(create.statusCode, 200, create.body);
    const hid = create.json().id,
      path = "/households/" + hid;
    const foreign = await call(outsider.cookie, "POST", "/households", {
      name: "Keluarga lain",
    });
    const other = foreign.json().id;
    let source: string,
      target: string,
      expense: string,
      income: string,
      transferId: string;
    const on = "2026-01-15",
      range = "?from=2026-01-01&to=2026-02-01";
    await t.test("OAuth denial returns control to the mobile app", async () => {
      const denied = await call(
        "",
        "GET",
        "/v1/gmail/oauth/callback?state=state&error=access_denied",
      );
      assert.equal(denied.statusCode, 302, denied.body);
      assert.equal(denied.headers.location, "cashflow://profile?gmail=denied");
    });
    await t.test(
      "invite is email-bound; members can join once and owner settings stay private",
      async () => {
        const inv = await call(a.cookie, "POST", path + "/invitations", {
          email: b.email,
        });
        assert.equal(inv.statusCode, 200, inv.body);
        const id = inv.json().id;
        assert.equal(
          (await call(outsider.cookie, "POST", `/invitations/${id}/accept`, {}))
            .statusCode,
          403,
        );
        const key = randomUUID(),
          joined = await Promise.all([
            call(b.cookie, "POST", `/invitations/${id}/accept`, {}, key),
            call(b.cookie, "POST", `/invitations/${id}/accept`, {}, key),
          ]);
        for (const r of joined) assert.equal(r.statusCode, 200, r.body);
        assert.equal(
          (await call(b.cookie, "GET", path + "/invitations")).statusCode,
          403,
        );
        assert.equal(
          (
            await call(b.cookie, "POST", path + "/invitations", {
              email: outsider.email,
            })
          ).statusCode,
          403,
        );
        const cats = (await call(a.cookie, "GET", path + "/categories")).json();
        expense = cats.find((c: any) => c.name === "Transportasi").id;
        income = cats.find((c: any) => c.kind === "income").id;
      },
    );
    await t.test(
      "opening balances do not count as income; tenant references are rejected",
      async () => {
        source = (
          await call(a.cookie, "POST", path + "/accounts", {
            name: "Bank",
            kind: "bank",
            opening_balance_minor: "1000000",
            opening_date: "2026-01-01",
          })
        ).json().id;
        target = (
          await call(b.cookie, "POST", path + "/accounts", {
            name: "Tunai",
            kind: "cash",
            opening_balance_minor: "0",
            opening_date: "2026-01-01",
          })
        ).json().id;
        const totals = (
          await call(a.cookie, "GET", path + "/summary" + range)
        ).json();
        assert.equal(totals.balance_minor, "1000000");
        assert.equal(totals.income_minor, "0");
        const incomeRecord = await call(
          a.cookie,
          "POST",
          path + "/transactions",
          {
            type: "income",
            account_id: source,
            category_id: income,
            amount_minor: "100",
            occurred_on: on,
          },
        );
        assert.equal(incomeRecord.statusCode, 200, incomeRecord.body);
        const withIncome = (
          await call(a.cookie, "GET", path + "/summary" + range)
        ).json();
        assert.equal(withIncome.income_minor, "100");
        assert.deepEqual(
          withIncome.income_categories.map((category: any) => [
            category.category_id,
            category.amount_minor,
          ]),
          [[income, "100"]],
        );
        const bad = await call(
          outsider.cookie,
          "POST",
          `/households/${other}/transactions`,
          {
            type: "income",
            account_id: source,
            category_id: income,
            amount_minor: "100",
            occurred_on: on,
          },
        );
        assert.equal(bad.statusCode, 400, bad.body);
        for (const endpoint of [
          "summary" + range,
          "accounts",
          "categories",
          "transactions" + range,
          "budgets?month=2026-01-01",
          "audit",
          "export" + range,
          "members",
        ])
          assert.equal(
            (await call(outsider.cookie, "GET", path + "/" + endpoint))
              .statusCode,
            403,
            endpoint,
          );
      },
    );
    const transfer = () => ({
      type: "transfer",
      account_id: source,
      destination_account_id: target,
      category_id: null,
      amount_minor: "200000",
      fee_minor: "2500",
      fee_category_id: expense,
      occurred_on: on,
      note: "=shared note",
    });
    await t.test(
      "atomic transfer and retry produce one principal, fee, audit and revision",
      async () => {
        const key = randomUUID(),
          rs = await Promise.all([
            call(a.cookie, "POST", path + "/transactions", transfer(), key),
            call(a.cookie, "POST", path + "/transactions", transfer(), key),
          ]);
        for (const r of rs) assert.equal(r.statusCode, 200, r.body);
        assert.deepEqual(rs[0].json(), rs[1].json());
        transferId = rs[0].json().id;
        assert.equal(
          (
            await call(
              a.cookie,
              "POST",
              path + "/transactions",
              { ...transfer(), amount_minor: "1" },
              key,
            )
          ).statusCode,
          409,
        );
        const summary = (
          await call(b.cookie, "GET", path + "/summary" + range)
        ).json();
        assert.equal(summary.balance_minor, "997600");
        assert.equal(summary.income_minor, "100");
        assert.equal(summary.expense_minor, "2500");
        assert.equal(
          summary.accounts.find((a: any) => a.id === source).balance_minor,
          "797600",
        );
        assert.equal(
          summary.accounts.find((a: any) => a.id === target).balance_minor,
          "200000",
        );
        const budget = await call(a.cookie, "POST", path + "/budgets", {
          category_id: expense,
          month_start: "2026-01-01",
          limit_minor: "10000",
        });
        assert.equal(budget.statusCode, 200, budget.body);
        assert.equal(
          (
            await call(b.cookie, "GET", path + "/budgets?month=2026-01-01")
          ).json()[0].spent_minor,
          "2500",
        );
        const count = await admin.query(
          "SELECT count(*)::int AS n FROM audit_events WHERE entity_id=$1 AND action='created'",
          [transferId],
        );
        assert.equal(count.rows[0].n, 1);
        const byCategory = await call(
          b.cookie,
          "GET",
          path + "/transactions" + range + "&search=Transportasi",
        );
        assert.equal(byCategory.statusCode, 200, byCategory.body);
        assert.deepEqual(
          byCategory.json().items.map((item: any) => item.id),
          [transferId],
        );
        const audit = await call(a.cookie, "GET", path + "/audit");
        assert.equal(audit.statusCode, 200, audit.body);
        const created = audit
          .json()
          .items.find((item: any) => item.entity_id === transferId);
        assert.ok(
          created.changes.fields.some(
            (field: any) => field.label === "Rekening tujuan",
          ),
        );
        const exp = await call(b.cookie, "GET", path + "/export" + range);
        assert.equal(exp.statusCode, 200);
        assert.ok(exp.body.includes("'=shared note"));
        assert.equal(
          (
            await call(
              outsider.cookie,
              "GET",
              path + "/transactions/" + transferId,
            )
          ).statusCode,
          403,
        );
      },
    );
    await t.test(
      "invalid references, future dates and opening dates cannot partially change balances",
      async () => {
        for (const change of [
          { destination_account_id: source },
          { fee_category_id: income },
          { occurred_on: "2999-01-01" },
          { occurred_on: "2025-12-31" },
          { amount_minor: "1.5" },
        ])
          assert.equal(
            (
              await call(a.cookie, "POST", path + "/transactions", {
                ...transfer(),
                ...change,
              })
            ).statusCode,
            400,
          );
        const invalid = await call(
          a.cookie,
          "PUT",
          path + "/accounts/" + source,
          {
            name: "Bank",
            kind: "bank",
            opening_balance_minor: "1000000",
            opening_date: "2026-01-16",
            expected_version: 1,
          },
        );
        assert.equal(invalid.statusCode, 400);
        const total = (
          await call(a.cookie, "GET", path + "/summary" + range)
        ).json();
        assert.equal(total.balance_minor, "997600");
        await assert.rejects(
          pool.query(
            "UPDATE audit_events SET action='tampered' WHERE entity_id=$1",
            [transferId],
          ),
          (e: any) => e.code === "42501",
        );
      },
    );
    await t.test(
      "a Gmail candidate belongs to its connector and its id is part of an idempotent transaction",
      async () => {
        const connection = randomUUID(),
          first = randomUUID(),
          second = randomUUID(),
          key = randomUUID(),
          payload = {
            type: "expense",
            account_id: source,
            category_id: expense,
            amount_minor: "12500",
            occurred_on: on,
            note: "Notifikasi Gmail",
          };
        await admin.query(
          "INSERT INTO gmail_connections(id,profile_id,gmail_address,refresh_token_ciphertext) VALUES($1,$2,$3,$4)",
          [connection, a.profile, `gmail-${randomUUID()}@example.test`, "test"],
        );
        for (const id of [first, second])
          await admin.query(
            "INSERT INTO gmail_candidates(id,connection_id,gmail_message_id,amount_minor,occurred_on,note) VALUES($1,$2,$3,$4,$5,$6)",
            [id, connection, randomUUID(), "12500", on, "Notifikasi Gmail"],
          );
        assert.deepEqual(
          (await call(b.cookie, "GET", "/me/gmail/candidates")).json(),
          [],
        );
        const saved = await call(
          a.cookie,
          "POST",
          `${path}/gmail-candidates/${first}/transaction`,
          payload,
          key,
        );
        assert.equal(saved.statusCode, 200, saved.body);
        const reused = await call(
          a.cookie,
          "POST",
          `${path}/gmail-candidates/${second}/transaction`,
          payload,
          key,
        );
        assert.equal(reused.statusCode, 409, reused.body);
        assert.equal(reused.json().code, "KEY_REUSED");
        const candidates = await admin.query(
          "SELECT id,status,transaction_id FROM gmail_candidates WHERE id=ANY($1::uuid[]) ORDER BY CASE WHEN id=$2 THEN 0 ELSE 1 END",
          [[first, second], first],
        );
        assert.deepEqual(
          candidates.rows.map((row: any) => row.status),
          ["accepted", "pending"],
        );
        assert.ok(candidates.rows[0].transaction_id);
        assert.equal(candidates.rows[1].transaction_id, null);
        const rejected = await call(
          a.cookie,
          "POST",
          `/me/gmail/candidates/${second}/reject`,
          {},
        );
        assert.equal(rejected.statusCode, 200, rejected.body);
        assert.equal(
          (
            await admin.query(
              "SELECT status FROM gmail_candidates WHERE id=$1",
              [second],
            )
          ).rows[0].status,
          "rejected",
        );
        await admin.query(
          "UPDATE transactions SET deleted_at=now() WHERE id=$1",
          [candidates.rows[0].transaction_id],
        );
      },
    );
    await t.test("an OAuth state is claimed only once", async () => {
      const started = await beginGmailAuthorization(pool, gmail, a.profile);
      const state = new URL(started.authorization_url).searchParams.get(
        "state",
      );
      assert.ok(state);
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async (url: string | URL) => {
        const value = String(url);
        if (value.includes("oauth2.googleapis.com/token"))
          return new Response(
            JSON.stringify({
              access_token: "access",
              refresh_token: "refresh",
            }),
          );
        return new Response(
          JSON.stringify({ emailAddress: "gmail@example.test" }),
        );
      }) as typeof fetch;
      try {
        const results = await Promise.allSettled([
          finishGmailAuthorization(pool, gmail, state!, "first"),
          finishGmailAuthorization(pool, gmail, state!, "second"),
        ]);
        assert.equal(
          results.filter((result) => result.status === "fulfilled").length,
          1,
        );
        assert.equal(
          results.filter((result) => result.status === "rejected").length,
          1,
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
    await t.test(
      "concurrent edits detect conflict; deletion changes all derived figures atomically",
      async () => {
        const rs = await Promise.all([
          call(a.cookie, "PUT", path + "/transactions/" + transferId, {
            ...transfer(),
            amount_minor: "250000",
            expected_version: 1,
          }),
          call(b.cookie, "PUT", path + "/transactions/" + transferId, {
            ...transfer(),
            amount_minor: "300000",
            expected_version: 1,
          }),
        ]);
        assert.deepEqual(rs.map((r) => r.statusCode).sort(), [200, 409]);
        assert.equal(
          (
            await call(
              b.cookie,
              "DELETE",
              path + "/transactions/" + transferId,
              { expected_version: 1 },
            )
          ).statusCode,
          409,
        );
        assert.equal(
          (
            await call(
              b.cookie,
              "DELETE",
              path + "/transactions/" + transferId,
              { expected_version: 2 },
            )
          ).statusCode,
          200,
        );
        const summary = (
          await call(a.cookie, "GET", path + "/summary" + range)
        ).json();
        assert.equal(summary.balance_minor, "1000100");
        assert.equal(summary.expense_minor, "0");
        assert.equal(
          (
            await call(a.cookie, "GET", path + "/budgets?month=2026-01-01")
          ).json()[0].spent_minor,
          "0",
        );
      },
    );
    await t.test(
      "expired and revoked invitations fail without membership; revoked members lose next request",
      async () => {
        const inv = (
          await call(a.cookie, "POST", path + "/invitations", {
            email: outsider.email,
          })
        ).json();
        await admin.query(
          "UPDATE household_invitations SET expires_at=now()-interval '1 hour' WHERE id=$1",
          [inv.id],
        );
        assert.equal(
          (
            await call(
              outsider.cookie,
              "POST",
              `/invitations/${inv.id}/accept`,
              {},
            )
          ).statusCode,
          403,
        );
        const next = (
          await call(a.cookie, "POST", path + "/invitations", {
            email: outsider.email,
          })
        ).json();
        assert.equal(
          (
            await call(a.cookie, "POST", path + "/revoke-invitation", {
              invitation_id: next.id,
              expected_version: 1,
            })
          ).statusCode,
          200,
        );
        assert.equal(
          (
            await call(
              outsider.cookie,
              "POST",
              `/invitations/${next.id}/accept`,
              {},
            )
          ).statusCode,
          403,
        );
        const member = (await call(a.cookie, "GET", path + "/members"))
          .json()
          .find((x: any) => x.profile_id === b.profile);
        assert.equal(
          (
            await call(a.cookie, "POST", path + "/revoke-member", {
              member_id: member.id,
              expected_version: member.version,
            })
          ).statusCode,
          200,
        );
        assert.equal(
          (await call(b.cookie, "GET", path + "/summary" + range)).statusCode,
          403,
        );
        const rejoin = (
          await call(a.cookie, "POST", path + "/invitations", {
            email: b.email,
          })
        ).json();
        assert.equal(
          (await call(b.cookie, "POST", `/invitations/${rejoin.id}/accept`, {}))
            .statusCode,
          200,
        );
      },
    );
    await t.test(
      "owners cannot leave or delete login until ownership transfers",
      async () => {
        assert.equal(
          (await call(a.cookie, "POST", path + "/leave", {})).statusCode,
          409,
        );
        assert.equal(
          (await call(a.cookie, "POST", "/me/deletion", { password }))
            .statusCode,
          409,
        );
        const member = (await call(a.cookie, "GET", path + "/members"))
          .json()
          .find((x: any) => x.profile_id === b.profile);
        assert.equal(
          (
            await call(a.cookie, "POST", path + "/transfer-owner", {
              member_id: member.id,
              expected_version: member.version,
            })
          ).statusCode,
          200,
        );
        assert.equal(
          (
            await call(a.cookie, "POST", path + "/invitations", {
              email: outsider.email,
            })
          ).statusCode,
          403,
        );
        await assert.rejects(
          admin.query(
            "UPDATE household_members SET status='revoked' WHERE household_id=$1 AND role='owner'",
            [hid],
          ),
          (e: any) => e.code === "23514",
        );
      },
    );
    await t.test(
      "deletion is retryable and preserves shared transactions with pseudonymous attribution",
      async () => {
        const record = await call(a.cookie, "POST", path + "/transactions", {
          type: "income",
          account_id: source,
          category_id: income,
          amount_minor: "12345",
          occurred_on: on,
        });
        assert.equal(record.statusCode, 200, record.body);
        const id = record.json().id;
        assert.equal(
          (
            await call(a.cookie, "POST", "/me/deletion", {
              password: "wrong-password-1",
            })
          ).statusCode,
          400,
        );
        const deletion = await call(a.cookie, "POST", "/me/deletion", {
          password,
        });
        assert.equal(deletion.statusCode, 200, deletion.body);
        assert.equal(
          (await call(a.cookie, "GET", path + "/summary" + range)).statusCode,
          403,
        );
        assert.equal((await processDeletions(pool)).completed, 1);
        assert.equal((await processDeletions(pool)).completed, 0);
        assert.equal(
          (
            await admin.query(
              "SELECT count(*)::int AS count FROM gmail_connections WHERE profile_id=$1",
              [a.profile],
            )
          ).rows[0].count,
          0,
        );
        assert.equal((await call(a.cookie, "GET", "/me")).statusCode, 401);
        const history = await call(
          b.cookie,
          "GET",
          path + "/transactions/" + id,
        );
        assert.equal(history.statusCode, 200, history.body);
        assert.equal(history.json().actor_name, "Pengguna dihapus");
        assert.equal(history.json().amount_minor, "12345");
        const total = (
          await call(b.cookie, "GET", path + "/summary" + range)
        ).json();
        assert.equal(total.balance_minor, "1012445");
      },
    );
    await t.test(
      "category archive keeps historical transactions and explains duplicate names on restore",
      async () => {
        const name = "Kategori histori";
        const created = await call(b.cookie, "POST", path + "/categories", {
          name,
          kind: "expense",
        });
        assert.equal(created.statusCode, 200, created.body);
        const categoryId = created.json().id;
        const record = await call(b.cookie, "POST", path + "/transactions", {
          type: "expense",
          account_id: source,
          category_id: categoryId,
          amount_minor: "10",
          occurred_on: on,
        });
        assert.equal(record.statusCode, 200, record.body);
        const transactionId = record.json().id;
        const archived = await call(
          b.cookie,
          "DELETE",
          path + "/categories/" + categoryId,
          { expected_version: 1 },
        );
        assert.equal(archived.statusCode, 200, archived.body);
        const historical = await call(
          b.cookie,
          "GET",
          path + "/transactions" + range + "&search=Kategori%20histori",
        );
        assert.equal(historical.statusCode, 200, historical.body);
        assert.deepEqual(
          historical.json().items.map((item: any) => item.id),
          [transactionId],
        );
        const duplicate = await call(b.cookie, "POST", path + "/categories", {
          name,
          kind: "expense",
        });
        assert.equal(duplicate.statusCode, 200, duplicate.body);
        const conflict = await call(
          b.cookie,
          "PUT",
          path + "/categories/" + categoryId,
          { name, kind: "expense", expected_version: 2, restore: true },
        );
        assert.equal(conflict.statusCode, 409, conflict.body);
        assert.equal(conflict.json().code, "CATEGORY_NAME");
        const renamed = await call(
          b.cookie,
          "PUT",
          path + "/categories/" + categoryId,
          {
            name: "Kategori histori lama",
            kind: "expense",
            expected_version: 2,
          },
        );
        assert.equal(renamed.statusCode, 200, renamed.body);
        const restored = await call(
          b.cookie,
          "PUT",
          path + "/categories/" + categoryId,
          {
            name: "Kategori histori lama",
            kind: "expense",
            expected_version: 3,
            restore: true,
          },
        );
        assert.equal(restored.statusCode, 200, restored.body);
        const category = (await call(b.cookie, "GET", path + "/categories"))
          .json()
          .find((item: any) => item.id === categoryId);
        assert.equal(category.archived_at, null);
        const history = await call(
          b.cookie,
          "GET",
          path + "/transactions/" + transactionId,
        );
        assert.equal(history.statusCode, 200, history.body);
        assert.equal(history.json().category_id, categoryId);
      },
    );
    await t.test(
      "password reset revokes previous sessions and logout revokes the new session",
      async () => {
        const nextPassword = "Reset-" + randomUUID();
        const reset = await call(
          "",
          "POST",
          "/api/auth/request-password-reset",
          {
            email: outsider.email,
            redirectTo: "http://localhost:4310/reset-password",
          },
        );
        assert.equal(reset.statusCode, 200, reset.body);
        const link = mail.get(outsider.email)?.match(/https?:\/\/\S+/)?.[0];
        assert.ok(link);
        const token = new URL(link).pathname.split("/").at(-1)!;
        const change = await call("", "POST", "/api/auth/reset-password", {
          token,
          newPassword: nextPassword,
        });
        assert.equal(change.statusCode, 200, change.body);
        assert.equal(
          (await call(outsider.cookie, "GET", "/me")).statusCode,
          401,
        );
        const login = await call("", "POST", "/api/auth/sign-in/email", {
          email: outsider.email,
          password: nextPassword,
        });
        assert.equal(login.statusCode, 200, login.body);
        const set = login.headers["set-cookie"],
          cookie = (Array.isArray(set) ? set : [set])
            .filter(Boolean)
            .map((s) => String(s).split(";")[0])
            .join("; ");
        assert.equal(
          (await call(cookie, "POST", "/api/auth/sign-out", {})).statusCode,
          200,
        );
        assert.equal((await call(cookie, "GET", "/me")).statusCode, 401);
      },
    );
  },
);
