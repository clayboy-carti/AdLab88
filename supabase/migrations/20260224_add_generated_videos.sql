-- Generated videos: stores videos animated from product mockup images
-- Source image is tracked via source_ad_id (references generated_ads)
-- content_type is always 'product_video' to distinguish from image entries in the library

CREATE TABLE IF NOT EXISTS generated_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_ad_id UUID REFERENCES generated_ads(id) ON DELETE SET NULL,
  motion_prompt TEXT,
  storage_path TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'product_video',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS generated_videos_user_id_idx ON generated_videos(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS generated_videos_source_ad_id_idx ON generated_videos(source_ad_id);

-- RLS: users can only access their own videos
ALTER TABLE generated_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own videos"
  ON generated_videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own videos"
  ON generated_videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos"
  ON generated_videos FOR DELETE
  USING (auth.uid() = user_id);
