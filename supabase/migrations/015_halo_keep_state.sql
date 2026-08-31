-- Keep loop state per signed-in user (chips, ranks, day cap).
-- Mirrors localStorage halo-keep-v2 so phone and desktop share one Keep.
-- Run in the Supabase SQL editor. Safe to re-run.

CREATE TABLE IF NOT EXISTS halo_keep_state (
  user_id UUID PRIMARY KEY REFERENCES profiles ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE halo_keep_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own keep state" ON halo_keep_state;
CREATE POLICY "Users manage own keep state" ON halo_keep_state
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
