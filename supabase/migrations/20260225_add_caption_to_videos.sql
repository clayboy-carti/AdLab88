-- Allow a social post caption to be saved on a video before it is scheduled.
-- The caption is copied into scheduled_posts.caption when scheduling occurs.

ALTER TABLE generated_videos ADD COLUMN IF NOT EXISTS caption TEXT NOT NULL DEFAULT '';
