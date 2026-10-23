import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const stamp = new Date().toISOString().replace(/[^0-9]/g, ""),
  remote = `/tmp/cashflow-${stamp}.dump`;
const directory = join(root, "backups");
mkdirSync(directory, { recursive: true });
const output = join(directory, `cashflow-${stamp}.dump`);
const run = (args) =>
  execFileSync("docker", ["compose", ...args], { cwd: root, stdio: "inherit" });
console.log(
  "Backup target: Cash Flow Compose service db, database cashflow. No existing data will be removed.",
);
run([
  "exec",
  "-T",
  "db",
  "pg_dump",
  "-U",
  "cashflow_admin",
  "-d",
  "cashflow",
  "-Fc",
  "-f",
  remote,
]);
run(["cp", `db:${remote}`, output]);
console.log(`Backup saved: ${output}`);
if (process.argv.includes("--verify-restore")) {
  const target = `cashflow_restore_${stamp}`;
  console.log(
    `Restore check into NEW database: ${target}. It will be retained for inspection.`,
  );
  run(["exec", "-T", "db", "createdb", "-U", "cashflow_admin", target]);
  run([
    "exec",
    "-T",
    "db",
    "pg_restore",
    "-U",
    "cashflow_admin",
    "--no-owner",
    "--no-privileges",
    "-d",
    target,
    remote,
  ]);
  run([
    "exec",
    "-T",
    "db",
    "psql",
    "-U",
    "cashflow_admin",
    "-d",
    target,
    "-c",
    "SELECT (SELECT count(*) FROM households) AS households,(SELECT count(*) FROM transactions) AS transactions,(SELECT count(*) FROM auth_users) AS users;",
  ]);
}
