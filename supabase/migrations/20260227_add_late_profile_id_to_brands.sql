-- Add Late profile ID to brands table.
-- Each brand gets its own Late profile, created lazily on first account connection.

ALTER TABLE brands ADD COLUMN IF NOT EXISTS late_profile_id TEXT;
