-- Add batch_id to group ads generated in the same batch run
-- Batch ads share the same batch_id UUID; single-generated ads have NULL
ALTER TABLE generated_ads ADD COLUMN IF NOT EXISTS batch_id UUID;

CREATE INDEX IF NOT EXISTS generated_ads_batch_id_idx ON generated_ads(batch_id);
