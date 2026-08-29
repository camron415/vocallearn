-- Learn lite: review cards mined from a user's own asks, plus streak on profiles.
-- Run in the Supabase SQL editor. Safe to re-run.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS halo_learn_streak INT NOT NULL DEFAULT 0;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS halo_learn_last_day DATE;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS halo_learn_reviews INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS halo_learn_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  hint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, prompt)
);

CREATE INDEX IF NOT EXISTS idx_halo_learn_cards_user
  ON halo_learn_cards (user_id, created_at DESC);

ALTER TABLE halo_learn_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own learn cards" ON halo_learn_cards;
CREATE POLICY "Users manage own learn cards" ON halo_learn_cards
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS halo_learn_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  card_key TEXT NOT NULL,
  day DATE NOT NULL DEFAULT (CURRENT_DATE),
  correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_halo_learn_attempts_user_day
  ON halo_learn_attempts (user_id, day DESC);

ALTER TABLE halo_learn_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own learn attempts" ON halo_learn_attempts;
CREATE POLICY "Users manage own learn attempts" ON halo_learn_attempts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
