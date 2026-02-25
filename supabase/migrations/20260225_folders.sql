-- ── Campaign folders ──────────────────────────────────────────────────────────

CREATE TABLE folders (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_folders_user_id ON folders(user_id);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own folders"
  ON folders FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── folder_id on asset tables ─────────────────────────────────────────────────

ALTER TABLE generated_ads
  ADD COLUMN folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

ALTER TABLE generated_videos
  ADD COLUMN folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
