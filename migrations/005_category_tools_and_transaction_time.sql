-- Up Migration
ALTER TABLE transactions ADD COLUMN occurred_at timestamptz;
CREATE INDEX transactions_page_time ON transactions(household_id,occurred_on DESC,(COALESCE(occurred_at,created_at)) DESC,id DESC) WHERE deleted_at IS NULL;

-- Down Migration
-- Forward-only: restoration uses a verified backup into a separate database.
