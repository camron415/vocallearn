-- Harvest turn log: ask + reply + mined cards for policy/miner tuning.
-- Run in the Supabase SQL editor. Safe to re-run.

CREATE TABLE IF NOT EXISTS halo_harvest_turns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  conversation_id UUID REFERENCES ask_conversations ON DELETE SET NULL,
  user_text TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  skipped BOOLEAN NOT NULL DEFAULT FALSE,
  skip_reason TEXT,
  card_count INT NOT NULL DEFAULT 0,
  kinds TEXT[] NOT NULL DEFAULT '{}',
  cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  miner_raw TEXT,
  policy_version TEXT NOT NULL DEFAULT 'v2',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_halo_harvest_turns_user_created
  ON halo_harvest_turns (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_halo_harvest_turns_conversation
  ON halo_harvest_turns (conversation_id, created_at DESC)
  WHERE conversation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_halo_harvest_turns_skipped
  ON halo_harvest_turns (skipped, created_at DESC);

ALTER TABLE halo_harvest_turns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own harvest turns" ON halo_harvest_turns;
CREATE POLICY "Users insert own harvest turns" ON halo_harvest_turns
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own harvest turns" ON halo_harvest_turns;
CREATE POLICY "Users read own harvest turns" ON halo_harvest_turns
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR halo_is_admin());
