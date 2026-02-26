-- Restore the FK from scheduled_posts.ad_id → generated_ads.id.
--
-- The video-support migration dropped this constraint to make ad_id nullable,
-- but never re-added it.  Without the FK PostgREST cannot resolve the
-- generated_ads(...) join used by the calendar query, causing it to return
-- nothing.  ad_id is nullable so rows with ad_id IS NULL (video posts) are
-- exempt from the FK check.

ALTER TABLE scheduled_posts
  ADD CONSTRAINT scheduled_posts_ad_id_fkey
  FOREIGN KEY (ad_id) REFERENCES generated_ads(id) ON DELETE CASCADE;
