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
  mobileReturnURL: string;
};
export type GmailSyncResult = {
  created: number;
  scanned: number;
  history_complete: boolean;
  reason?: GmailFailureCode;
};
export type GmailFailureCode =
  | "TOKEN_REVOKED"
  | "RATE_LIMITED"
  | "GOOGLE_UNAVAILABLE"
  | "HISTORY_EXPIRED"
  | "SYNC_FAILED";

class GmailError extends Error {
  constructor(readonly code: GmailFailureCode) {
    super(code);
  }
}

function failureCode(status: number, history = false): GmailFailureCode {
  if (history && status === 404) return "HISTORY_EXPIRED";
  if (status === 400 || status === 401) return "TOKEN_REVOKED";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "GOOGLE_UNAVAILABLE";
  return "SYNC_FAILED";
}

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
    throw new GmailError(failureCode(response.status));
  return {
    access_token: result.access_token,
    ...(result.refresh_token ? { refresh_token: result.refresh_token } : {}),
  };
}

async function gmail<T>(accessToken: string, path: string, history = false) {
  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me" + path,
    {
      headers: { authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok) throw new GmailError(failureCode(response.status, history));
  return (await response.json()) as T;
}

export async function finishGmailAuthorization(
  pool: Database,
  config: GmailConfig,
  state: string,
  code: string,
) {
  const pending = (
    await pool.query(
      "SELECT * FROM gmail_oauth_states WHERE state_hash=$1 AND expires_at>now()",
      [digest(state)],
    )
  ).rows[0];
  if (!pending) throw new Error("GMAIL_OAUTH_STATE_INVALID");
  const tokens = await tokenRequest(
    {
      code,
      code_verifier: decrypt(pending.verifier_ciphertext, config),
      grant_type: "authorization_code",
      redirect_uri: config.redirectURL,
    },
    config,
  );
  const refreshToken = tokens.refresh_token;
  if (!refreshToken) throw new Error("GMAIL_REFRESH_TOKEN_MISSING");
  const profile = await gmail<{ emailAddress?: string; historyId?: string }>(
    tokens.access_token,
    "/profile",
  );
  const gmailAddress = profile.emailAddress;
  if (!gmailAddress) throw new Error("GMAIL_PROFILE_UNAVAILABLE");
  await transaction(pool, async (db) => {
    const claimed = (
      await db.query(
        "DELETE FROM gmail_oauth_states WHERE state_hash=$1 AND expires_at>now() RETURNING profile_id",
        [digest(state)],
      )
    ).rows[0];
    if (!claimed) throw new Error("GMAIL_OAUTH_STATE_INVALID");
    await db.query(
      `INSERT INTO gmail_connections(id,profile_id,gmail_address,refresh_token_ciphertext,label_name,history_id)
       VALUES($1,$2,$3,$4,$5,$6)
       ON CONFLICT(profile_id) DO UPDATE SET gmail_address=EXCLUDED.gmail_address,refresh_token_ciphertext=EXCLUDED.refresh_token_ciphertext,label_name=EXCLUDED.label_name,status='active',last_error_code=NULL,history_page_token=NULL,history_delta_page_token=NULL,history_complete=false,history_checked_count=0,history_total_estimate=NULL,history_id=EXCLUDED.history_id,updated_at=now()`,
      [
        randomUUID(),
        claimed.profile_id,
        gmailAddress,
        encrypt(refreshToken, config),
        "Deteksi otomatis",
        profile.historyId ?? null,
      ],
    );
  });
}

type GmailConnection = {
  id: string;
  refresh_token_ciphertext: string;
  history_page_token: string | null;
  history_delta_page_token: string | null;
  history_complete: boolean;
  history_checked_count: number;
  history_total_estimate: number | null;
  history_id: string | null;
};

const transactionSearch =
  "{Rp IDR} {transaksi pembayaran transfer debit kredit qris}";

async function connectionActive(pool: Database, id: string) {
  return !!(
    await pool.query(
      "SELECT 1 FROM gmail_connections WHERE id=$1 AND status IN ('active','error')",
      [id],
    )
  ).rows[0];
}

type GmailPayload = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPayload[];
  headers?: { name: string; value: string }[];
};

function messageText(payload?: GmailPayload) {
  const plain: string[] = [],
    html: string[] = [];
  const collect = (part?: GmailPayload) => {
    if (!part) return;
    if (part.body?.data) {
      const text = Buffer.from(part.body.data, "base64url")
        .toString("utf8")
        .slice(0, 64000);
      if (part.mimeType === "text/html") html.push(text);
      else if (part.mimeType === "text/plain") plain.push(text);
    }
    for (const child of part.parts ?? []) collect(child);
  };
  collect(payload);
  const source = plain.length ? plain.join("\n") : html.join("\n");
  return source
    .replace(/<\/(?:div|p|tr|li|td|th|br)[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(nbsp|amp);/gi, (_, entity: string) =>
      entity.toLowerCase() === "nbsp" ? " " : "&",
    )
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, 64000);
}

async function processGmailMessages(
  pool: Database,
  id: string,
  accessToken: string,
  ids: string[],
) {
  let created = 0;
  for (const messageId of ids) {
    if (!(await connectionActive(pool, id)))
      return { created: 0, scanned: 0, active: false };
    const message = await gmail<{
      id: string;
      snippet?: string;
      payload?: GmailPayload;
    }>(accessToken, `/messages/${encodeURIComponent(messageId)}?format=full`);
    const subject =
      message.payload?.headers?.find(
        (header) => header.name.toLowerCase() === "subject",
      )?.value ?? "";
    const draft = notificationDraft(
      `${subject}\n${message.snippet ?? ""}\n${messageText(message.payload)}`,
    );
    if (draft.blocked || !draft.amount_minor) continue;
    if (!(await connectionActive(pool, id)))
      return { created: 0, scanned: 0, active: false };
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
  return {
    created,
    scanned: ids.length,
    active: await connectionActive(pool, id),
  };
}

export async function syncGmailConnection(
  pool: Database,
  config: GmailConfig,
  id: string,
): Promise<GmailSyncResult> {
  const connection = (
    await pool.query(
      "SELECT id,refresh_token_ciphertext,history_page_token,history_delta_page_token,history_complete,history_checked_count,history_total_estimate,history_id FROM gmail_connections WHERE id=$1 AND status IN ('active','error')",
      [id],
    )
  ).rows[0] as GmailConnection | undefined;
  if (!connection) return { created: 0, scanned: 0, history_complete: false };
  try {
    const tokens = await tokenRequest(
      {
        grant_type: "refresh_token",
        refresh_token: decrypt(connection.refresh_token_ciphertext, config),
      },
      config,
    );
    if (!(await connectionActive(pool, id)))
      return { created: 0, scanned: 0, history_complete: false };
    if (!connection.history_complete) {
      let historyId = connection.history_id;
      if (!historyId) {
        const profile = await gmail<{ historyId?: string }>(
          tokens.access_token,
          "/profile",
        );
        historyId = profile.historyId ?? null;
        if (!historyId) throw new GmailError("SYNC_FAILED");
        await pool.query(
          "UPDATE gmail_connections SET history_id=$2,updated_at=now() WHERE id=$1",
          [id, historyId],
        );
      }
      const query = new URLSearchParams({
        maxResults: "50",
        q: transactionSearch,
        ...(connection.history_page_token
          ? { pageToken: connection.history_page_token }
          : {}),
      });
      const list = await gmail<{
        messages?: { id: string }[];
        nextPageToken?: string;
        resultSizeEstimate?: number;
      }>(tokens.access_token, `/messages?${query}`);
      const result = await processGmailMessages(
        pool,
        id,
        tokens.access_token,
        (list.messages ?? []).map((message) => message.id),
      );
      if (!result.active)
        return { created: 0, scanned: 0, history_complete: false };
      const historyComplete = !list.nextPageToken;
      await pool.query(
        `UPDATE gmail_connections SET status='active',last_synced_at=now(),last_error_code=NULL,
          history_page_token=$2,history_complete=$3,history_id=$4,
          history_checked_count=history_checked_count+$5,
          history_total_estimate=COALESCE($6,history_total_estimate),updated_at=now() WHERE id=$1`,
        [
          id,
          historyComplete ? null : (list.nextPageToken ?? null),
          historyComplete,
          historyId,
          result.scanned,
          list.resultSizeEstimate ?? null,
        ],
      );
      return {
        created: result.created,
        scanned: result.scanned,
        history_complete: historyComplete,
      };
    }
    if (!connection.history_id) throw new GmailError("HISTORY_EXPIRED");
    const query = new URLSearchParams({
      maxResults: "50",
      startHistoryId: connection.history_id,
      ...(connection.history_delta_page_token
        ? { pageToken: connection.history_delta_page_token }
        : {}),
    });
    const history = await gmail<{
      history?: { messagesAdded?: { message?: { id?: string } }[] }[];
      nextPageToken?: string;
      historyId?: string;
    }>(tokens.access_token, `/history?${query}`, true);
    const ids = [
      ...new Set(
        (history.history ?? []).flatMap((entry) =>
          (entry.messagesAdded ?? []).flatMap((added) =>
            added.message?.id ? [added.message.id] : [],
          ),
        ),
      ),
    ];
    const result = await processGmailMessages(
      pool,
      id,
      tokens.access_token,
      ids,
    );
    if (!result.active)
      return { created: 0, scanned: 0, history_complete: true };
    const complete = !history.nextPageToken;
    await pool.query(
      `UPDATE gmail_connections SET status='active',last_synced_at=now(),last_error_code=NULL,
        history_id=CASE WHEN $2 THEN COALESCE($3,history_id) ELSE history_id END,
        history_delta_page_token=$4,updated_at=now() WHERE id=$1`,
      [
        id,
        complete,
        history.historyId ?? null,
        complete ? null : (history.nextPageToken ?? null),
      ],
    );
    return {
      created: result.created,
      scanned: result.scanned,
      history_complete: true,
    };
  } catch (error) {
    const reason = error instanceof GmailError ? error.code : "SYNC_FAILED";
    if (reason === "HISTORY_EXPIRED") {
      await pool.query(
        "UPDATE gmail_connections SET status='active',last_error_code=$2,history_id=NULL,history_page_token=NULL,history_delta_page_token=NULL,history_complete=false,history_checked_count=0,history_total_estimate=NULL,updated_at=now() WHERE id=$1",
        [id, reason],
      );
      return { created: 0, scanned: 0, history_complete: false, reason };
    }
    await pool.query(
      "UPDATE gmail_connections SET status='error',last_error_code=$2,updated_at=now() WHERE id=$1",
      [id, reason],
    );
    return {
      created: 0,
      scanned: 0,
      history_complete: connection.history_complete,
      reason,
    };
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
  const failures: GmailFailureCode[] = [];
  for (const connection of connections) {
    const result = await syncGmailConnection(pool, config, connection.id);
    created += result.created;
    if (result.reason) failures.push(result.reason);
  }
  return { created, failures: [...new Set(failures)] };
}
