-- Allow scheduled_posts to reference either an ad OR a video.
--
-- Previously ad_id had a NOT NULL FK to generated_ads, which means video IDs
-- (which live in generated_videos) could not be stored here.
--
-- Changes:
--   1. Drop the FK constraint on ad_id  (keeps the column, just removes the reference)
--   2. Make ad_id nullable              (video posts don't have an ad)
--   3. Add video_id with a FK to generated_videos

-- 1. Drop FK constraint on ad_id (auto-named by Postgres)
ALTER TABLE scheduled_posts
  DROP CONSTRAINT IF EXISTS scheduled_posts_ad_id_fkey;

-- 2. Make ad_id nullable
ALTER TABLE scheduled_posts
  ALTER COLUMN ad_id DROP NOT NULL;

-- 3. Add video_id column (nullable, FK to generated_videos)
ALTER TABLE scheduled_posts
  ADD COLUMN IF NOT EXISTS video_id UUID REFERENCES generated_videos(id) ON DELETE CASCADE;

-- Index for video_id lookups
CREATE INDEX IF NOT EXISTS scheduled_posts_video_id_idx ON scheduled_posts(video_id);
