-- Add image quality and aspect ratio columns to generated_ads
-- These store the settings chosen by the user on the Create page

ALTER TABLE generated_ads
  ADD COLUMN IF NOT EXISTS image_quality TEXT,
  ADD COLUMN IF NOT EXISTS aspect_ratio TEXT;

COMMENT ON COLUMN generated_ads.image_quality IS 'Resolution chosen at generation time (1K or 2K)';
COMMENT ON COLUMN generated_ads.aspect_ratio IS 'Aspect ratio chosen at generation time (e.g. 1:1, 9:16, 16:9)';
