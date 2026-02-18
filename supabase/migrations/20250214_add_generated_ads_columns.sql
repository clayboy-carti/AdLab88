-- Add missing columns to generated_ads table for AI metadata
-- These columns store the strategic reasoning and prompts from the AI generation

ALTER TABLE generated_ads
ADD COLUMN IF NOT EXISTS angle_justification TEXT,
ADD COLUMN IF NOT EXISTS image_generation_prompt TEXT,
ADD COLUMN IF NOT EXISTS brand_voice_match TEXT,
ADD COLUMN IF NOT EXISTS framework_applied TEXT,
ADD COLUMN IF NOT EXISTS target_platform TEXT,
ADD COLUMN IF NOT EXISTS estimated_performance TEXT,
ADD COLUMN IF NOT EXISTS storage_path TEXT; -- Path in Supabase Storage (generated-ads bucket)

-- Update the generated_image_url column to be nullable since we now store storage_path
ALTER TABLE generated_ads
ALTER COLUMN generated_image_url DROP NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN generated_ads.angle_justification IS 'Why this positioning angle was chosen';
COMMENT ON COLUMN generated_ads.image_generation_prompt IS 'Prompt used for DALL-E image generation';
COMMENT ON COLUMN generated_ads.brand_voice_match IS 'How well the copy matches brand voice';
COMMENT ON COLUMN generated_ads.framework_applied IS 'Which marketing framework was applied';
COMMENT ON COLUMN generated_ads.target_platform IS 'Intended platform (Instagram, Facebook, etc)';
COMMENT ON COLUMN generated_ads.estimated_performance IS 'AI prediction of ad performance';
COMMENT ON COLUMN generated_ads.storage_path IS 'Permanent storage path in Supabase Storage';
