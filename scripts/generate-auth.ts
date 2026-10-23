import { writeFile } from "node:fs/promises";
import { getMigrations } from "better-auth/db/migration";
import { createAuth, configFromEnv } from "../apps/api/src/auth.js";
import { Pool } from "../apps/api/src/db.js";
const connectionString = process.env.TEST_DATABASE_URL;
if (
  !connectionString ||
  !new URL(connectionString).pathname.endsWith("/cashflow_test")
)
  throw new Error("Generation requires the isolated cashflow_test database");
const pool = new Pool({ connectionString });
try {
  const auth = createAuth(pool, configFromEnv(), async () => {});
  const plan = await getMigrations(auth.options);
  if (plan.unsafeChanges.length || plan.schemaProblems.length)
    throw new Error("Unsafe auth schema plan");
  const sql = await plan.compileMigrations();
  await writeFile(
    new URL("../migrations/000_auth.sql", import.meta.url),
    "-- Up Migration\n-- Generated from Better Auth 1.7.11 and the configured Expo plugin.\n" +
      sql +
      "\n-- Down Migration\n-- Forward-only.\n",
    { flag: "wx" },
  );
  console.log("Auth SQL generated for review; no database mutation executed.");
} finally {
  await pool.end();
}
