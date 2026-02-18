-- AdLab88 Storage Bucket Policies
-- Run this AFTER creating the storage buckets in Supabase Dashboard

-- ============================================================================
-- STEP 1: Create Storage Buckets (Do this in Supabase Dashboard > Storage)
-- ============================================================================

-- Create these buckets manually in the dashboard:
--
-- 1. Bucket name: reference-images
--    - Public: NO (private)
--    - File size limit: 5MB
--    - Allowed MIME types: image/jpeg, image/png
--
-- 2. Bucket name: generated-ads
--    - Public: NO (private)
--    - File size limit: 10MB
--    - Allowed MIME types: image/png

-- ============================================================================
-- STEP 2: Run these policies in SQL Editor
-- ============================================================================

-- Policies for reference-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reference-images',
  'reference-images',
  false,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-ads',
  'generated-ads',
  false,
  10485760, -- 10MB in bytes
  ARRAY['image/png']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png'];

-- ============================================================================
-- STEP 3: Storage RLS Policies
-- ============================================================================

-- reference-images bucket policies
CREATE POLICY "Users can upload own reference images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reference-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own reference images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'reference-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own reference images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'reference-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- generated-ads bucket policies
CREATE POLICY "Users can upload own generated ads"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'generated-ads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own generated ads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'generated-ads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify buckets exist:
-- SELECT * FROM storage.buckets;

-- Verify policies:
-- SELECT * FROM pg_policies WHERE schemaname = 'storage';
