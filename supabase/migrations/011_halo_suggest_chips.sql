-- Cached AI home-screen suggestion chips (per user).
-- Run in the Supabase SQL editor. Safe to re-run.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS halo_suggest_chips JSONB;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS halo_suggest_at TIMESTAMPTZ;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS halo_suggest_chat_count INT;
