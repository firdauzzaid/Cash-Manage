import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";
import type { Database } from "./db.js";
export type Mail = (mail: {
  to: string;
  subject: string;
  text: string;
}) => Promise<void>;
export type Config = {
  authURL: string;
  authSecret: string;
  origins: string[];
  production: boolean;
};
export function createAuth(pool: Database, config: Config, sendMail: Mail) {
  return betterAuth({
    appName: "Cash Flow",
    baseURL: config.authURL,
    secret: config.authSecret,
    database: pool,
    trustedOrigins: [
      ...config.origins,
      ...(!config.production ? ["exp://**"] : []),
    ],
    user: { modelName: "auth_users" },
    session: {
      modelName: "auth_sessions",
      cookieCache: { enabled: false },
      expiresIn: 60 * 60 * 24 * 14,
    },
    account: { modelName: "auth_accounts" },
    verification: { modelName: "auth_verifications" },
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "auth_rate_limits",
      window: 60,
      max: 60,
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) =>
        sendMail({
          to: user.email,
          subject: "Atur ulang kata sandi Cash Flow",
          text: `Buka tautan berikut untuk mengatur ulang kata sandi. Jangan bagikan tautan ini.\n${url}`,
        }),
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      expiresIn: 3600,
      sendVerificationEmail: async ({ user, url }) =>
        sendMail({
          to: user.email,
          subject: "Verifikasi email Cash Flow",
          text: `Verifikasi email Anda untuk mulai mencatat bersama keluarga.\n${url}`,
        }),
    },
    advanced: {
      useSecureCookies: config.production,
      ipAddress: { ipAddressHeaders: ["x-cashflow-client-ip"] },
    },
    plugins: [expo()],
  });
}
export function configFromEnv(): Config {
  const authURL = process.env.BETTER_AUTH_URL ?? "http://localhost:4310",
    authSecret = process.env.BETTER_AUTH_SECRET ?? "";
  if (authSecret.length < 32)
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters");
  const production = process.env.NODE_ENV === "production";
  if (production && !authURL.startsWith("https://"))
    throw new Error("Production BETTER_AUTH_URL must use HTTPS");
  return {
    authURL,
    authSecret,
    production,
    origins: (process.env.TRUSTED_ORIGINS ?? "cashflow://")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  };
}
