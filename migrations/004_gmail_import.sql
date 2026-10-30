-- Up Migration
CREATE TABLE gmail_connections (
 id uuid PRIMARY KEY,
 profile_id uuid NOT NULL UNIQUE REFERENCES profiles,
 gmail_address text NOT NULL,
 refresh_token_ciphertext text NOT NULL,
 label_name text NOT NULL DEFAULT 'Cash Flow' CHECK(length(label_name) BETWEEN 1 AND 100),
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked','error')),
 last_synced_at timestamptz,
 last_error_code text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE gmail_oauth_states (
 state_hash text PRIMARY KEY,
 profile_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
 verifier_ciphertext text NOT NULL,
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gmail_oauth_state_expiry ON gmail_oauth_states(expires_at);
CREATE TABLE gmail_candidates (
 id uuid PRIMARY KEY,
 connection_id uuid NOT NULL REFERENCES gmail_connections ON DELETE CASCADE,
 gmail_message_id text NOT NULL,
 amount_minor bigint NOT NULL CHECK(amount_minor BETWEEN 1 AND 1000000000000),
 occurred_on date,
 note text NOT NULL DEFAULT '' CHECK(length(note)<=120),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
 transaction_id uuid REFERENCES transactions,
 created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz,
 UNIQUE(connection_id,gmail_message_id)
);
CREATE INDEX gmail_candidates_pending ON gmail_candidates(connection_id,created_at DESC) WHERE status='pending';
GRANT SELECT,INSERT,UPDATE,DELETE ON gmail_connections,gmail_oauth_states,gmail_candidates TO cashflow_app;

-- Down Migration
-- Forward-only: OAuth credentials and candidates are removed only by explicit disconnect or account deletion.
