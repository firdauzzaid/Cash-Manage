-- Up Migration
ALTER TABLE gmail_connections
  ADD COLUMN history_page_token text,
  ADD COLUMN history_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN history_checked_count integer NOT NULL DEFAULT 0,
  ADD COLUMN history_total_estimate integer;

-- Existing connections are safely restarted so their older transaction emails are considered.
UPDATE gmail_connections
SET history_page_token=NULL,history_complete=false,history_checked_count=0,history_total_estimate=NULL;

-- Down Migration
-- Forward-only: restoration uses a verified backup into a separate database.
