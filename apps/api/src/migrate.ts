import { runner } from "node-pg-migrate";
import { fileURLToPath } from "node:url";
const connectionString = process.env.MIGRATION_DATABASE_URL;
if (!connectionString)
  throw new Error(
    "MIGRATION_DATABASE_URL is required; runtime credentials cannot migrate",
  );
const target = new URL(connectionString);
console.log(
  `Migration target: ${target.hostname}:${target.port || "5432"}${target.pathname} (forward-only)`,
);
await runner({
  databaseUrl: connectionString,
  dir: fileURLToPath(new URL("../../../migrations", import.meta.url)),
  direction: "up",
  migrationsTable: "cashflow_migrations",
  checkOrder: true,
  verbose: false,
});
