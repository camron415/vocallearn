-- Bug reports table: captures in-session bug reports with automatic session context.
-- The user types a short description; the app records the current phase/fact and
-- the session_log_id so we can cross-reference session_interactions for full context.
CREATE TABLE IF NOT EXISTS bug_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_log_id  TEXT,               -- null if submitted outside a session
  user_id         UUID REFERENCES auth.users(id),
  lesson_id       TEXT,
  phase           TEXT,
  fact_content    TEXT,               -- content of the fact being worked on at report time
  user_description TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX idx_bug_reports_session_log_id ON bug_reports(session_log_id) WHERE session_log_id IS NOT NULL;
CREATE INDEX idx_bug_reports_created_at ON bug_reports(created_at DESC);

-- RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own bug reports"
  ON bug_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own bug reports"
  ON bug_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
