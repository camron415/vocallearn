-- Halo family: members, invites, recipes, answer length.
-- Run in the Supabase SQL editor. Safe to re-run.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS answer_length TEXT NOT NULL DEFAULT 'medium';

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_answer_length_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_answer_length_check
  CHECK (answer_length IN ('short', 'medium', 'long'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS halo_onboarded_at TIMESTAMPTZ;

-- Existing accounts skip the first-run welcome.
UPDATE profiles
SET halo_onboarded_at = COALESCE(halo_onboarded_at, NOW())
WHERE halo_onboarded_at IS NULL;

CREATE TABLE IF NOT EXISTS halo_members (
  user_id UUID PRIMARY KEY REFERENCES profiles ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE halo_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own halo membership" ON halo_members;
CREATE POLICY "Users read own halo membership" ON halo_members
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

INSERT INTO halo_members (user_id, role)
SELECT id, 'admin' FROM profiles
ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS halo_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  used_by UUID REFERENCES profiles ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_halo_invites_token ON halo_invites (token);

ALTER TABLE halo_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage halo invites" ON halo_invites;
CREATE POLICY "Admins manage halo invites" ON halo_invites
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM halo_members m
      WHERE m.user_id = auth.uid() AND m.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM halo_members m
      WHERE m.user_id = auth.uid() AND m.role = 'admin'
    )
    AND created_by = auth.uid()
  );

CREATE TABLE IF NOT EXISTS halo_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  conversation_id UUID REFERENCES ask_conversations ON DELETE SET NULL,
  title TEXT NOT NULL,
  ingredients TEXT NOT NULL DEFAULT '',
  steps TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_halo_recipes_user
  ON halo_recipes (user_id, created_at DESC);

ALTER TABLE halo_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own halo recipes" ON halo_recipes;
CREATE POLICY "Users manage own halo recipes" ON halo_recipes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

GRANT EXECUTE ON FUNCTION halo_peek_invite(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION halo_claim_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tok TEXT;
  invite_id UUID;
BEGIN
  SELECT raw_user_meta_data->>'invite_token' INTO tok
  FROM auth.users
  WHERE id = NEW.id;

  IF tok IS NULL OR tok = '' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO invite_id
  FROM halo_invites
  WHERE token = tok
    AND used_at IS NULL
    AND expires_at > NOW()
  FOR UPDATE;

  IF invite_id IS NULL THEN
    RAISE EXCEPTION 'This invite link is invalid or already used';
  END IF;

  UPDATE halo_invites
  SET used_at = NOW(), used_by = NEW.id
  WHERE id = invite_id;

  INSERT INTO halo_members (user_id, role)
  VALUES (NEW.id, 'member')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS halo_claim_invite ON auth.users;
DROP TRIGGER IF EXISTS halo_claim_invite ON profiles;
CREATE TRIGGER halo_claim_invite
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION halo_claim_invite();
