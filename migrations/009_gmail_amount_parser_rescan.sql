-- Up Migration
-- Recheck historic transaction-like emails after tightening the payment amount parser.
-- Existing candidates are preserved so no user review decision is overwritten.
UPDATE gmail_connections
SET history_page_token=NULL,
  history_delta_page_token=NULL,
  history_complete=false,
  history_checked_count=0,
  history_total_estimate=NULL;

-- Down Migration
-- Forward-only: restoration uses a verified backup into a separate database.
