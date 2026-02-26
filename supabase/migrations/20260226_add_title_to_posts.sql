-- Add title field to both asset tables.
-- Required in the UI before generation; nullable in DB for backward compatibility
-- with existing rows that were saved before this column existed.

ALTER TABLE generated_ads
  ADD COLUMN title TEXT;

ALTER TABLE generated_videos
  ADD COLUMN title TEXT;
