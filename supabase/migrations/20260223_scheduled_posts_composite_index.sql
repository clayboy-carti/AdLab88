-- Add a composite index to cover the common (user_id, ad_id, status) filter
-- used when checking whether an ad already has a scheduled post.
-- The three single-column indexes that existed previously still help other
-- queries, but this composite index eliminates sequential scans on the
-- most frequent query pattern in the schedule route.

CREATE INDEX IF NOT EXISTS scheduled_posts_user_ad_status_idx
  ON scheduled_posts (user_id, ad_id, status);
