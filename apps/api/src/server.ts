import { Pool } from "./db.js";
import nodemailer from "nodemailer";
import { configFromEnv } from "./auth.js";
import { createApp } from "./app.js";
import { processDeletions } from "./deletion.js";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  statement_timeout: 15000,
});
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "127.0.0.1",
  port: Number(process.env.SMTP_PORT ?? 1027),
  secure: process.env.SMTP_SECURE === "true",
  ...(process.env.SMTP_USER
    ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } }
    : {}),
});
const { app } = await createApp(
  pool,
  configFromEnv(),
  async (mail) => {
    await transport.sendMail({
      ...mail,
      from: process.env.SMTP_FROM ?? "Cash Flow <no-reply@cashflow.local>",
    });
  },
  true,
);
pool.on("error", () => app.log.error("Database connection interrupted"));
let processing = false;
const timer = setInterval(async () => {
  if (processing) return;
  processing = true;
  try {
    await processDeletions(pool);
  } catch {
    app.log.error("Account deletion maintenance failed");
  } finally {
    processing = false;
  }
}, 30000);
timer.unref();
app.addHook("onClose", async () => {
  clearInterval(timer);
  transport.close();
  await pool.end();
});
for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.once(signal, () => {
    void app.close();
  });
await app.listen({ port: Number(process.env.PORT ?? 4310), host: "0.0.0.0" });
