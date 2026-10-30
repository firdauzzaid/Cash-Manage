import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";
import { notificationDraft } from "@cashflow/contracts";
import type { Database } from "./db.js";
import { transaction } from "./access.js";

export type GmailConfig = {
  clientId: string;
  clientSecret?: string;
  redirectURL: string;
  encryptionKey: Buffer;
  labelName: string;
  mobileReturnURL: string;
};
export type GmailSyncResult = {
  created: number;
  reason?: "LABEL_NOT_FOUND" | "SYNC_FAILED";
};

function secret(value: string) {
  const key = Buffer.from(value, "base64");
  if (key.length !== 32)
    throw new Error("GMAIL_TOKEN_ENCRYPTION_KEY must be a base64 32-byte key");
  return key;
}

export function gmailConfigFromEnv(): GmailConfig | undefined {
  const clientId = process.env.GMAIL_OAUTH_CLIENT_ID,
    redirectURL = process.env.GMAIL_OAUTH_REDIRECT_URI,
    key = process.env.GMAIL_TOKEN_ENCRYPTION_KEY;
  if (!clientId && !redirectURL && !key) return undefined;
  if (!clientId || !redirectURL || !key)
    throw new Error(
      "GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_REDIRECT_URI and GMAIL_TOKEN_ENCRYPTION_KEY must be set together",
    );
  if (!redirectURL.startsWith("https://"))
    throw new Error("GMAIL_OAUTH_REDIRECT_URI must use HTTPS");
  return {
    clientId,
    ...(process.env.GMAIL_OAUTH_CLIENT_SECRET
      ? { clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET }
      : {}),
    redirectURL,
    encryptionKey: secret(key),
    labelName: process.env.GMAIL_LABEL_NAME?.trim() || "Cash Flow",
    mobileReturnURL:
      process.env.GMAIL_MOBILE_RETURN_URL?.trim() || "cashflow://profile",
  };
}

function encrypt(value: string, config: GmailConfig) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", config.encryptionKey, iv),
    body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]),
    tag = cipher.getAuthTag();
  return [iv, tag, body].map((part) => part.toString("base64url")).join(".");
}

function decrypt(value: string, config: GmailConfig) {
  const [iv, tag, body] = value
    .split(".")
    .map((part) => Buffer.from(part, "base64url"));
  if (!iv || !tag || !body)
    throw new Error("Invalid encrypted Gmail credential");
  const cipher = createDecipheriv("aes-256-gcm", config.encryptionKey, iv);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(body), cipher.final()]).toString("utf8");
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}

function verifier() {
  return randomBytes(48).toString("base64url");
}

function challenge(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}

export async function beginGmailAuthorization(
  pool: Database,
  config: GmailConfig,
  profileId: string,
) {
  const state = randomBytes(32).toString("base64url"),
    codeVerifier = verifier();
  await transaction(pool, async (db) => {
    await db.query(
      "DELETE FROM gmail_oauth_states WHERE expires_at<=now() OR profile_id=$1",
      [profileId],
    );
    await db.query(
      "INSERT INTO gmail_oauth_states(state_hash,profile_id,verifier_ciphertext,expires_at) VALUES($1,$2,$3,now()+interval '10 minutes')",
      [digest(state), profileId, encrypt(codeVerifier, config)],
    );
  });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectURL,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
    code_challenge: challenge(codeVerifier),
    code_challenge_method: "S256",
  }).toString();
  return { authorization_url: url.toString() };
}

async function tokenRequest(
  values: Record<string, string>,
  config: GmailConfig,
): Promise<{ access_token: string; refresh_token?: string }> {
  const body = new URLSearchParams({
    ...values,
    client_id: config.clientId,
    ...(config.clientSecret ? { client_secret: config.clientSecret } : {}),
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15000),
  });
  const result = (await response.json().catch(() => null)) as {
    access_token?: string;
    refresh_token?: string;
  } | null;
  if (!response.ok || !result?.access_token)
    throw new Error("GMAIL_TOKEN_EXCHANGE_FAILED");
  return {
    access_token: result.access_token,
    ...(result.refresh_token ? { refresh_token: result.refresh_token } : {}),
  };
}

async function gmail<T>(accessToken: string, path: string) {
  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me" + path,
    {
      headers: { authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok) throw new Error("GMAIL_API_FAILED");
  return (await response.json()) as T;
}

export async function finishGmailAuthorization(
  pool: Database,
  config: GmailConfig,
  state: string,
  code: string,
) {
  const pending = await transaction(pool, async (db) => {
    const claimed = (
      await db.query(
        "DELETE FROM gmail_oauth_states WHERE state_hash=$1 AND expires_at>now() RETURNING *",
        [digest(state)],
      )
    ).rows[0];
    if (!claimed) throw new Error("GMAIL_OAUTH_STATE_INVALID");
    return claimed;
  });
  const tokens = await tokenRequest(
    {
      code,
      code_verifier: decrypt(pending.verifier_ciphertext, config),
      grant_type: "authorization_code",
      redirect_uri: config.redirectURL,
    },
    config,
  );
  if (!tokens.refresh_token) throw new Error("GMAIL_REFRESH_TOKEN_MISSING");
  const profile = await gmail<{ emailAddress?: string }>(
    tokens.access_token,
    "/profile",
  );
  if (!profile.emailAddress) throw new Error("GMAIL_PROFILE_UNAVAILABLE");
  await pool.query(
    `INSERT INTO gmail_connections(id,profile_id,gmail_address,refresh_token_ciphertext,label_name)
     VALUES($1,$2,$3,$4,$5)
     ON CONFLICT(profile_id) DO UPDATE SET gmail_address=EXCLUDED.gmail_address,refresh_token_ciphertext=EXCLUDED.refresh_token_ciphertext,label_name=EXCLUDED.label_name,status='active',last_error_code=NULL,updated_at=now()`,
    [
      randomUUID(),
      pending.profile_id,
      profile.emailAddress,
      encrypt(tokens.refresh_token, config),
      config.labelName,
    ],
  );
}

type GmailConnection = {
  id: string;
  refresh_token_ciphertext: string;
  label_name: string;
};

export async function syncGmailConnection(
  pool: Database,
  config: GmailConfig,
  id: string,
): Promise<GmailSyncResult> {
  const connection = (
    await pool.query(
      "SELECT id,refresh_token_ciphertext,label_name FROM gmail_connections WHERE id=$1 AND status IN ('active','error')",
      [id],
    )
  ).rows[0] as GmailConnection | undefined;
  if (!connection) return { created: 0 };
  try {
    const tokens = await tokenRequest(
      {
        grant_type: "refresh_token",
        refresh_token: decrypt(connection.refresh_token_ciphertext, config),
      },
      config,
    );
    const labels = await gmail<{ labels?: { id: string; name: string }[] }>(
      tokens.access_token,
      "/labels",
    );
    const label = labels.labels?.find(
      (item) => item.name === connection.label_name,
    );
    if (!label) {
      await pool.query(
        "UPDATE gmail_connections SET status='error',last_error_code='LABEL_NOT_FOUND',updated_at=now() WHERE id=$1",
        [id],
      );
      return { created: 0, reason: "LABEL_NOT_FOUND" };
    }
    const list = await gmail<{ messages?: { id: string }[] }>(
      tokens.access_token,
      `/messages?labelIds=${encodeURIComponent(label.id)}&maxResults=50`,
    );
    let created = 0;
    for (const item of list.messages ?? []) {
      const message = await gmail<{
        id: string;
        snippet?: string;
        payload?: { headers?: { name: string; value: string }[] };
      }>(
        tokens.access_token,
        `/messages/${encodeURIComponent(item.id)}?format=metadata&metadataHeaders=Subject`,
      );
      const subject =
        message.payload?.headers?.find(
          (header) => header.name.toLowerCase() === "subject",
        )?.value ?? "";
      const draft = notificationDraft(`${subject}\n${message.snippet ?? ""}`);
      if (draft.blocked || !draft.amount_minor) continue;
      const result = await pool.query(
        "INSERT INTO gmail_candidates(id,connection_id,gmail_message_id,amount_minor,occurred_on,note) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(connection_id,gmail_message_id) DO NOTHING",
        [
          randomUUID(),
          id,
          message.id,
          draft.amount_minor,
          draft.occurred_on ?? null,
          draft.note ?? "",
        ],
      );
      created += result.rowCount ?? 0;
    }
    await pool.query(
      "UPDATE gmail_connections SET status='active',last_synced_at=now(),last_error_code=NULL,updated_at=now() WHERE id=$1",
      [id],
    );
    return { created };
  } catch {
    await pool.query(
      "UPDATE gmail_connections SET status='error',last_error_code='SYNC_FAILED',updated_at=now() WHERE id=$1",
      [id],
    );
    return { created: 0, reason: "SYNC_FAILED" };
  }
}

export async function syncGmailConnections(
  pool: Database,
  config: GmailConfig,
) {
  const connections = (
    await pool.query(
      "SELECT id FROM gmail_connections WHERE status IN ('active','error') ORDER BY last_synced_at NULLS FIRST LIMIT 50",
    )
  ).rows as { id: string }[];
  let created = 0;
  for (const connection of connections)
    created += (await syncGmailConnection(pool, config, connection.id)).created;
  return { created };
}
