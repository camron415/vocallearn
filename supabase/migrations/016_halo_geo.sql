-- Account timezone + coarse place for clock, weather, and local news.
-- Do not store IP addresses. Safe to re-run.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS geo_city TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS geo_region TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS geo_country TEXT;
