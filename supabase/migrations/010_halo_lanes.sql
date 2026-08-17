-- Lanes (family / tester / lab) and invite lane copy.
-- Run in the VocalLearn SQL editor after 009.

ALTER TABLE halo_members
  ADD COLUMN IF NOT EXISTS lane TEXT NOT NULL DEFAULT 'family';

ALTER TABLE halo_members
  DROP CONSTRAINT IF EXISTS halo_members_lane_check;

ALTER TABLE halo_members
  ADD CONSTRAINT halo_members_lane_check
  CHECK (lane IN ('family', 'tester', 'lab'));

UPDATE halo_members
SET lane = 'lab'
WHERE role = 'admin' AND lane = 'family';

ALTER TABLE halo_invites
  ADD COLUMN IF NOT EXISTS lane TEXT NOT NULL DEFAULT 'family';

ALTER TABLE halo_invites
  DROP CONSTRAINT IF EXISTS halo_invites_lane_check;

ALTER TABLE halo_invites
  ADD CONSTRAINT halo_invites_lane_check
  CHECK (lane IN ('family', 'tester', 'lab'));

CREATE OR REPLACE FUNCTION halo_claim_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tok TEXT;
  invite_id UUID;
  invite_lane TEXT;
BEGIN
  SELECT raw_user_meta_data->>'invite_token' INTO tok
  FROM auth.users
  WHERE id = NEW.id;

  IF tok IS NULL OR tok = '' THEN
    RETURN NEW;
  END IF;

  SELECT id, lane INTO invite_id, invite_lane
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

  INSERT INTO halo_members (user_id, role, lane)
  VALUES (NEW.id, 'member', COALESCE(invite_lane, 'family'))
  ON CONFLICT (user_id) DO UPDATE
    SET lane = EXCLUDED.lane;

  RETURN NEW;
END;
$$;
