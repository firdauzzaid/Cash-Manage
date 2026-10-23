import { runner } from "node-pg-migrate";
import { fileURLToPath } from "node:url";
const url = process.env.TEST_DATABASE_URL;
if (!url || new URL(url).pathname !== "/cashflow_test")
  throw new Error("Only the isolated cashflow_test target is allowed");
console.log("Forward migrations: cashflow_test");
await runner({
  databaseUrl: url,
  dir: fileURLToPath(new URL("../migrations", import.meta.url)),
  direction: "up",
  migrationsTable: "cashflow_migrations",
  checkOrder: true,
  verbose: false,
});
