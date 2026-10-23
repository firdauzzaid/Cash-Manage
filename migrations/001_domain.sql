-- Up Migration
CREATE TABLE profiles (
 id uuid PRIMARY KEY, auth_user_id text UNIQUE, display_name text NOT NULL CHECK(length(display_name) BETWEEN 1 AND 80),
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','deletion_pending','deleted')),
 created_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE TABLE households (
 id uuid PRIMARY KEY, name text NOT NULL CHECK(length(name) BETWEEN 1 AND 80), currency text NOT NULL DEFAULT 'IDR' CHECK(currency='IDR'),
 timezone text NOT NULL DEFAULT 'Asia/Jakarta', revision bigint NOT NULL DEFAULT 0, version int NOT NULL DEFAULT 1,
 created_by uuid NOT NULL REFERENCES profiles, created_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE TABLE household_members (
 id uuid PRIMARY KEY, household_id uuid NOT NULL REFERENCES households, profile_id uuid NOT NULL REFERENCES profiles,
 role text NOT NULL CHECK(role IN ('owner','member')), status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
 joined_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz, version int NOT NULL DEFAULT 1,
 UNIQUE(household_id,profile_id)
);
CREATE UNIQUE INDEX one_owner ON household_members(household_id) WHERE role='owner' AND status='active';
CREATE INDEX memberships_profile ON household_members(profile_id,status);
CREATE FUNCTION check_household_owner() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE hid uuid;
BEGIN
 hid := CASE WHEN TG_TABLE_NAME='households' THEN NEW.id ELSE COALESCE(NEW.household_id,OLD.household_id) END;
 IF EXISTS(SELECT 1 FROM households WHERE id=hid AND deleted_at IS NULL)
 AND (SELECT count(*) FROM household_members WHERE household_id=hid AND role='owner' AND status='active')<>1
 THEN RAISE EXCEPTION 'Active household requires exactly one owner' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER household_owner AFTER INSERT OR UPDATE ON households DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_household_owner();
CREATE CONSTRAINT TRIGGER membership_owner AFTER INSERT OR UPDATE OR DELETE ON household_members DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_household_owner();
CREATE TABLE household_invitations (
 id uuid PRIMARY KEY, household_id uuid NOT NULL REFERENCES households, invited_by uuid NOT NULL REFERENCES profiles,
 email_normalized text NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','revoked','expired')),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days', created_at timestamptz NOT NULL DEFAULT now(),
 accepted_by uuid REFERENCES profiles, accepted_at timestamptz, version int NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX pending_invite ON household_invitations(household_id,email_normalized) WHERE status='pending';
CREATE INDEX invitations_email ON household_invitations(email_normalized,status);
CREATE TABLE financial_accounts (
 id uuid PRIMARY KEY, household_id uuid NOT NULL REFERENCES households, name text NOT NULL CHECK(length(name) BETWEEN 1 AND 80),
 kind text NOT NULL CHECK(kind IN ('cash','bank','ewallet')), opening_balance_minor bigint NOT NULL CHECK(abs(opening_balance_minor::numeric)<=1000000000000),
 opening_date date NOT NULL, created_by uuid NOT NULL REFERENCES profiles, updated_by uuid NOT NULL REFERENCES profiles,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
 version int NOT NULL DEFAULT 1, UNIQUE(household_id,id)
);
CREATE TABLE categories (
 id uuid PRIMARY KEY, household_id uuid NOT NULL REFERENCES households, name text NOT NULL CHECK(length(name) BETWEEN 1 AND 80),
 kind text NOT NULL CHECK(kind IN ('income','expense')), created_by uuid NOT NULL REFERENCES profiles,
 created_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz, version int NOT NULL DEFAULT 1, UNIQUE(household_id,id)
);
CREATE UNIQUE INDEX category_active_name ON categories(household_id,kind,lower(trim(name))) WHERE archived_at IS NULL;
CREATE TABLE transactions (
 id uuid PRIMARY KEY, household_id uuid NOT NULL REFERENCES households, type text NOT NULL CHECK(type IN ('income','expense','transfer')),
 account_id uuid NOT NULL, destination_account_id uuid, category_id uuid, amount_minor bigint NOT NULL CHECK(amount_minor BETWEEN 1 AND 1000000000000),
 fee_minor bigint NOT NULL DEFAULT 0 CHECK(fee_minor BETWEEN 0 AND 1000000000000), fee_category_id uuid,
 occurred_on date NOT NULL, note text NOT NULL DEFAULT '' CHECK(length(note)<=500),
 created_by uuid NOT NULL REFERENCES profiles, updated_by uuid NOT NULL REFERENCES profiles, deleted_by uuid REFERENCES profiles,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz, version int NOT NULL DEFAULT 1,
 FOREIGN KEY(household_id,account_id) REFERENCES financial_accounts(household_id,id),
 FOREIGN KEY(household_id,destination_account_id) REFERENCES financial_accounts(household_id,id),
 FOREIGN KEY(household_id,category_id) REFERENCES categories(household_id,id),
 FOREIGN KEY(household_id,fee_category_id) REFERENCES categories(household_id,id),
 CHECK ((type='transfer' AND destination_account_id IS NOT NULL AND destination_account_id<>account_id AND category_id IS NULL
 AND ((fee_minor=0 AND fee_category_id IS NULL) OR (fee_minor>0 AND fee_category_id IS NOT NULL)))
 OR (type IN ('income','expense') AND destination_account_id IS NULL AND category_id IS NOT NULL AND fee_minor=0 AND fee_category_id IS NULL))
);
CREATE INDEX transactions_page ON transactions(household_id,occurred_on DESC,id DESC) WHERE deleted_at IS NULL;
CREATE INDEX transactions_account ON transactions(household_id,account_id,occurred_on) WHERE deleted_at IS NULL;
CREATE INDEX transactions_destination ON transactions(household_id,destination_account_id,occurred_on) WHERE deleted_at IS NULL;
CREATE INDEX transactions_category ON transactions(household_id,category_id,occurred_on) WHERE deleted_at IS NULL;
CREATE TABLE budgets (
 id uuid PRIMARY KEY, household_id uuid NOT NULL REFERENCES households, category_id uuid NOT NULL,
 month_start date NOT NULL CHECK(extract(day FROM month_start)=1), limit_minor bigint NOT NULL CHECK(limit_minor BETWEEN 1 AND 1000000000000),
 created_by uuid NOT NULL REFERENCES profiles, updated_by uuid NOT NULL REFERENCES profiles,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version int NOT NULL DEFAULT 1,
 FOREIGN KEY(household_id,category_id) REFERENCES categories(household_id,id), UNIQUE(household_id,category_id,month_start)
);
CREATE TABLE audit_events (
 id uuid PRIMARY KEY, household_id uuid NOT NULL REFERENCES households, actor_profile_id uuid NOT NULL REFERENCES profiles,
 entity_type text NOT NULL, entity_id uuid NOT NULL, action text NOT NULL, visibility text NOT NULL CHECK(visibility IN ('finance','admin')),
 changes jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_page ON audit_events(household_id,created_at DESC,id DESC);
CREATE TABLE mutation_requests (
 id uuid PRIMARY KEY, actor_profile_id uuid NOT NULL REFERENCES profiles, household_id uuid REFERENCES households,
 idempotency_key uuid NOT NULL, operation text NOT NULL, payload_hash text NOT NULL, result jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(actor_profile_id,idempotency_key)
);
CREATE TABLE deletion_requests (
 id uuid PRIMARY KEY, profile_id uuid NOT NULL UNIQUE REFERENCES profiles,
 status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','completed','failed')),
 requested_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz, attempt_count int NOT NULL DEFAULT 0, last_error_code text
);
CREATE VIEW account_effects AS
 SELECT household_id,id AS account_id,opening_date AS occurred_on,NULL::uuid AS transaction_id,created_by,opening_balance_minor AS delta_minor,NULL::text AS flow,NULL::uuid AS category_id FROM financial_accounts
 UNION ALL SELECT household_id,account_id,occurred_on,id,created_by,CASE WHEN type='income' THEN amount_minor ELSE -amount_minor END,CASE WHEN type='transfer' THEN NULL ELSE type END,category_id FROM transactions WHERE deleted_at IS NULL
 UNION ALL SELECT household_id,destination_account_id,occurred_on,id,created_by,amount_minor,NULL::text,NULL::uuid FROM transactions WHERE type='transfer' AND deleted_at IS NULL
 UNION ALL SELECT household_id,account_id,occurred_on,id,created_by,-fee_minor,'expense',fee_category_id FROM transactions WHERE type='transfer' AND fee_minor>0 AND deleted_at IS NULL;

-- Down Migration
-- Forward-only: restoration uses a verified backup into a separate database.
