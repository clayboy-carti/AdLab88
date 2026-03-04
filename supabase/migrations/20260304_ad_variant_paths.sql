ALTER TABLE generated_ads
  ADD COLUMN IF NOT EXISTS thumb_path       text,
  ADD COLUMN IF NOT EXISTS preview_512_path  text,
  ADD COLUMN IF NOT EXISTS preview_1024_path text;
