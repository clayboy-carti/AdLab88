-- Create scheduled_posts table (if not already created manually)
-- and ensure the late_post_id column exists.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ad_id         UUID        REFERENCES generated_ads(id) ON DELETE CASCADE NOT NULL,
  scheduled_for DATE        NOT NULL,
  platform      TEXT        NOT NULL DEFAULT 'post',
  caption       TEXT        NOT NULL DEFAULT '',
  status        TEXT        NOT NULL DEFAULT 'scheduled',  -- 'scheduled' | 'published' | 'cancelled'
  platforms     TEXT[]      DEFAULT '{}',
  late_post_id  TEXT,                                      -- ID returned by Late API
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Add late_post_id to existing table if column was not present
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS late_post_id TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS scheduled_posts_user_id_idx  ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS scheduled_posts_ad_id_idx    ON scheduled_posts(ad_id);
CREATE INDEX IF NOT EXISTS scheduled_posts_status_idx   ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS scheduled_posts_late_post_id ON scheduled_posts(late_post_id);

-- Row Level Security
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'scheduled_posts' AND policyname = 'Users can view own scheduled posts'
  ) THEN
    CREATE POLICY "Users can view own scheduled posts"
      ON scheduled_posts FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'scheduled_posts' AND policyname = 'Users can insert own scheduled posts'
  ) THEN
    CREATE POLICY "Users can insert own scheduled posts"
      ON scheduled_posts FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'scheduled_posts' AND policyname = 'Users can update own scheduled posts'
  ) THEN
    CREATE POLICY "Users can update own scheduled posts"
      ON scheduled_posts FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;
