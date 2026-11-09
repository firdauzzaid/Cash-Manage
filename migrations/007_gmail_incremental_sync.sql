-- Up Migration
ALTER TABLE gmail_connections
  ADD COLUMN history_id text,
  ADD COLUMN history_delta_page_token text;

-- Down Migration
-- Forward-only: restoration uses a verified backup into a separate database.
