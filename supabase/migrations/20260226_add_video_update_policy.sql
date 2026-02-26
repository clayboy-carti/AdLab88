-- generated_videos was missing an UPDATE RLS policy, causing folder moves to
-- be silently blocked. Ads had this policy from the initial schema; videos did not.

CREATE POLICY "Users can update own videos"
  ON generated_videos FOR UPDATE
  USING (auth.uid() = user_id);
