-- AdLab88 Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. BRANDS TABLE
-- ============================================================================

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Core Identity
  company_name TEXT NOT NULL,
  what_we_do TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  unique_differentiator TEXT,

  -- Voice & Messaging
  voice_summary TEXT,
  personality_traits TEXT[], -- Array of 3-5 traits
  words_to_use TEXT[],
  words_to_avoid TEXT[],
  sample_copy TEXT NOT NULL, -- Minimum 1 example required

  -- Visual Identity
  brand_colors TEXT[], -- Hex codes
  typography_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint: One brand per user (MVP limitation)
CREATE UNIQUE INDEX brands_user_id_idx ON brands(user_id);

-- Row Level Security
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brands"
  ON brands FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brands"
  ON brands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brands"
  ON brands FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. REFERENCE IMAGES TABLE
-- ============================================================================

CREATE TABLE reference_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL, -- Bytes
  mime_type TEXT NOT NULL, -- 'image/jpeg' or 'image/png'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX reference_images_user_id_idx ON reference_images(user_id);

-- Row Level Security
ALTER TABLE reference_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own images"
  ON reference_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images"
  ON reference_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own images"
  ON reference_images FOR DELETE
  USING (auth.uid() = user_id);

-- Enforce max 5 images per user
CREATE FUNCTION check_image_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM reference_images WHERE user_id = NEW.user_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 reference images per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_image_limit
  BEFORE INSERT ON reference_images
  FOR EACH ROW
  EXECUTE FUNCTION check_image_limit();

-- ============================================================================
-- 3. GENERATED ADS TABLE
-- ============================================================================

CREATE TABLE generated_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  reference_image_id UUID REFERENCES reference_images(id) ON DELETE SET NULL,

  -- AI Output
  positioning_angle TEXT NOT NULL,
  angle_justification TEXT,
  hook TEXT NOT NULL, -- 5-10 words
  caption TEXT NOT NULL, -- 1-3 sentences
  cta TEXT NOT NULL, -- 3-5 words

  -- AI Metadata
  image_generation_prompt TEXT,
  brand_voice_match TEXT,
  framework_applied TEXT,
  target_platform TEXT,
  estimated_performance TEXT,

  -- Generated Assets
  storage_path TEXT, -- Path in Supabase Storage (generated-ads bucket)
  generated_image_url TEXT, -- Signed URL (temporary)

  -- Optional Metrics (MVP extension)
  ad_spend DECIMAL(10, 2),
  impressions INTEGER,
  clicks INTEGER,
  conversions INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX generated_ads_user_id_idx ON generated_ads(user_id);
CREATE INDEX generated_ads_created_at_idx ON generated_ads(created_at DESC);

-- Row Level Security
ALTER TABLE generated_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ads"
  ON generated_ads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ads"
  ON generated_ads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ads"
  ON generated_ads FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- After running the above, verify with:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
