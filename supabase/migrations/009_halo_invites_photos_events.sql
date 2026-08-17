-- One-use invites, recipe photos, privacy-safe usage events.
-- Run in the Supabase SQL editor after 008_halo_family.sql.

ALTER TABLE halo_invites
  ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION halo_reserve_invite(tok TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r halo_invites;
  updated INT;
BEGIN
  SELECT * INTO r FROM halo_invites WHERE token = tok;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing');
  END IF;
  IF r.used_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'used');
  END IF;
  IF r.expires_at < NOW() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;
  IF r.reserved_at IS NOT NULL AND r.reserved_at > NOW() - INTERVAL '3 minutes' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'busy');
  END IF;

  UPDATE halo_invites
  SET reserved_at = NOW()
  WHERE token = tok
    AND used_at IS NULL
    AND expires_at > NOW()
    AND (reserved_at IS NULL OR reserved_at < NOW() - INTERVAL '3 minutes');
  GET DIAGNOSTICS updated = ROW_COUNT;
  IF updated <> 1 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'used');
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION halo_reserve_invite(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION halo_peek_invite(tok TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r halo_invites;
BEGIN
  SELECT * INTO r FROM halo_invites WHERE token = tok;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing');
  END IF;
  IF r.used_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'used');
  END IF;
  IF r.expires_at < NOW() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

ALTER TABLE halo_recipes
  ADD COLUMN IF NOT EXISTS photo_path TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'halo-recipe-photos',
  'halo-recipe-photos',
  false,
  4194304,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users read own recipe photos" ON storage.objects;
CREATE POLICY "Users read own recipe photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'halo-recipe-photos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users insert own recipe photos" ON storage.objects;
CREATE POLICY "Users insert own recipe photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'halo-recipe-photos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users update own recipe photos" ON storage.objects;
CREATE POLICY "Users update own recipe photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'halo-recipe-photos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own recipe photos" ON storage.objects;
CREATE POLICY "Users delete own recipe photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'halo-recipe-photos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

CREATE TABLE IF NOT EXISTS halo_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  kind TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_halo_events_user_created
  ON halo_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_halo_events_kind_created
  ON halo_events (kind, created_at DESC);

CREATE OR REPLACE FUNCTION halo_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM halo_members
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION halo_is_admin() TO authenticated;

ALTER TABLE halo_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own halo events" ON halo_events;
CREATE POLICY "Users insert own halo events" ON halo_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read halo events" ON halo_events;
CREATE POLICY "Admins read halo events" ON halo_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR halo_is_admin());

DROP POLICY IF EXISTS "Admins read profiles" ON profiles;
CREATE POLICY "Admins read profiles" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR halo_is_admin());

DROP POLICY IF EXISTS "Admins read halo members" ON halo_members;
CREATE POLICY "Admins read halo members" ON halo_members
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR halo_is_admin());
