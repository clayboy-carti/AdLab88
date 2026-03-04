ALTER TABLE generated_ads
  ADD COLUMN IF NOT EXISTS signed_url text,
  ADD COLUMN IF NOT EXISTS signed_url_expires_at timestamptz;

ALTER TABLE generated_videos
  ADD COLUMN IF NOT EXISTS signed_url text,
  ADD COLUMN IF NOT EXISTS signed_url_expires_at timestamptz;
