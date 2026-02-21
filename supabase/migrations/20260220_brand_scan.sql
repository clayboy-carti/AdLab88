-- Brand Scan Migration
-- Run in Supabase SQL Editor

-- 1. Add website_url to brands table
ALTER TABLE brands ADD COLUMN IF NOT EXISTS website_url TEXT;

-- 2. Brand scans table (tracks URL crawl + AI extraction jobs)
CREATE TABLE IF NOT EXISTS brand_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'complete', 'failed')),

  -- AI-extracted brand DNA (stored as JSONB)
  extracted_data JSONB,

  -- Error message if status = 'failed'
  error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS brand_scans_user_id_idx ON brand_scans(user_id);
CREATE INDEX IF NOT EXISTS brand_scans_created_at_idx ON brand_scans(created_at DESC);

-- Row Level Security
ALTER TABLE brand_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scans"
  ON brand_scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans"
  ON brand_scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scans"
  ON brand_scans FOR UPDATE
  USING (auth.uid() = user_id);
