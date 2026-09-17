-- Hold release: users (and service role) can UPDATE their own halo_events rows.
-- Without this, ask_hold pending:true sticks until TTL (~3 min) after the answer.

DROP POLICY IF EXISTS "Users update own halo events" ON halo_events;
CREATE POLICY "Users update own halo events" ON halo_events
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
