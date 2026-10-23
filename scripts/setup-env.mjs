import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
const target = new URL("../.env", import.meta.url);
if (existsSync(target)) {
  console.log(".env sudah ada; konfigurasi dipertahankan.");
} else {
  const admin = randomBytes(32).toString("hex"),
    app = randomBytes(32).toString("hex");
  writeFileSync(
    target,
    `POSTGRES_PASSWORD=${admin}\nAPP_DB_PASSWORD=${app}\nDATABASE_URL=postgres://cashflow_app:${app}@127.0.0.1:54387/cashflow\nMIGRATION_DATABASE_URL=postgres://cashflow_admin:${admin}@127.0.0.1:54387/cashflow\nTEST_DATABASE_URL=postgres://cashflow_admin:${admin}@127.0.0.1:54388/cashflow_test\nBETTER_AUTH_SECRET=${randomBytes(32).toString("hex")}\nBETTER_AUTH_URL=http://localhost:4310\nTRUSTED_ORIGINS=http://localhost:8081,http://127.0.0.1:8081,cashflow://\nPORT=4310\nSMTP_HOST=127.0.0.1\nSMTP_PORT=1027\nSMTP_FROM=Cash Flow <no-reply@cashflow.local>\nEXPO_PUBLIC_API_URL=http://localhost:4310\n`,
    { mode: 0o600, flag: "wx" },
  );
  console.log(".env lokal dibuat dengan secret acak. Jangan commit file ini.");
}
