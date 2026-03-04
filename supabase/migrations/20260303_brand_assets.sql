-- ── Brand Assets ──────────────────────────────────────────────────────────────

CREATE TABLE brand_assets (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT        NOT NULL,
  file_name    TEXT        NOT NULL,
  file_size    INTEGER     NOT NULL,
  mime_type    TEXT        NOT NULL,
  category     TEXT        NOT NULL DEFAULT 'other',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_brand_assets_user_id ON brand_assets(user_id);

ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own brand assets"
  ON brand_assets FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── brand-assets Storage Bucket ───────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own brand assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'brand-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users read own brand assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'brand-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own brand assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'brand-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
