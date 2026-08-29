-- Harvest chips: kind/token/span/weight on learn cards.
-- Run in the Supabase SQL editor. Safe to re-run.

ALTER TABLE halo_learn_cards
  ADD COLUMN IF NOT EXISTS kind TEXT;

ALTER TABLE halo_learn_cards
  ADD COLUMN IF NOT EXISTS token TEXT;

ALTER TABLE halo_learn_cards
  ADD COLUMN IF NOT EXISTS span TEXT;

ALTER TABLE halo_learn_cards
  ADD COLUMN IF NOT EXISTS weight TEXT NOT NULL DEFAULT 'simple';
