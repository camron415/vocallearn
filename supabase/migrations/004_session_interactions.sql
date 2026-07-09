-- Session Interactions — per-turn data collection for latency analysis,
-- quality review, and filler-phrase mismatch detection.
-- Each row is one tutor/user exchange within a session.

CREATE TABLE IF NOT EXISTS session_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign keys
  session_log_id UUID NOT NULL REFERENCES session_logs ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES profiles   ON DELETE CASCADE,
  lesson_id      UUID NOT NULL REFERENCES lessons    ON DELETE CASCADE,
  fact_id        UUID          REFERENCES facts      ON DELETE SET NULL,

  -- Snapshot of the fact at the time (so data is readable even if fact changes)
  fact_content TEXT,

  -- Phase of the session: teach / quiz / review / greeting / overview / recap
  phase TEXT,

  -- What kind of turn this is:
  --   teach             — tutor presenting a fact
  --   quiz_prompt       — tutor asking a due-fact recall question
  --   review_prompt     — tutor re-asking a missed fact
  --   user_answer       — user answered a quiz/review question (scored)
  --   user_question     — user asked a question during quiz/review
  --   dont_know         — user admitted they don't know
  --   teach_checkin_question — user asked during post-fact checkin window
  --   teach_checkin_advance  — user said "got it" / advanced
  --   clarification_question — user asked after a wrong answer
  --   skip              — user (or auto-timeout) skipped a fact
  interaction_type TEXT NOT NULL,

  -- Filler clip that played before the AI response (nullable — only set when a clip played)
  filler_clip_key  TEXT,  -- key in CLIPS map, e.g. "great-question-think"
  filler_clip_text TEXT,  -- exact spoken text of the filler

  -- The full text the tutor spoke (AI response or scripted line)
  tutor_message TEXT,

  -- User's speech transcription — raw (as received from STT) and cleaned
  user_transcript_raw   TEXT,
  user_transcript_clean TEXT,

  -- Scoring result (null for non-scored turns)
  eval_score INT,    -- 0-5 SM-2 quality score
  is_correct BOOLEAN,

  -- Timing measurements (all in milliseconds)
  stt_latency_ms          INT,  -- mic-stop → transcript finalized (future instrumentation)
  grok_latency_ms         INT,  -- callGrok() start → response returned
  tts_latency_ms          INT,  -- speak() call → audio starts playing
  user_response_delay_ms  INT,  -- tutor finished speaking → submitResponse() called

  -- Token usage for the Grok call that produced this response (if applicable)
  token_usage_prompt     INT,
  token_usage_completion INT,

  -- Quality review fields — populated later by AI/human review tooling
  -- Possible values: null (unreviewed), 'flagged', 'reviewed_good', 'reviewed_bad'
  quality_flag  TEXT DEFAULT NULL,
  quality_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient per-session and per-user queries
CREATE INDEX IF NOT EXISTS session_interactions_session_log_id_idx
  ON session_interactions (session_log_id);

CREATE INDEX IF NOT EXISTS session_interactions_user_id_idx
  ON session_interactions (user_id);

CREATE INDEX IF NOT EXISTS session_interactions_quality_flag_idx
  ON session_interactions (quality_flag)
  WHERE quality_flag IS NOT NULL;

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE session_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own interactions"
  ON session_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own interactions"
  ON session_interactions FOR SELECT
  USING (auth.uid() = user_id);

-- ── Aggregate columns on session_logs ────────────────────────────────────────
-- These are populated once at session end from the interaction data.
-- Kept denormalized for fast dashboard reads.

ALTER TABLE session_logs ADD COLUMN IF NOT EXISTS avg_eval_score       FLOAT;
ALTER TABLE session_logs ADD COLUMN IF NOT EXISTS avg_grok_latency_ms  INT;
ALTER TABLE session_logs ADD COLUMN IF NOT EXISTS total_grok_calls     INT NOT NULL DEFAULT 0;
ALTER TABLE session_logs ADD COLUMN IF NOT EXISTS total_questions_asked INT NOT NULL DEFAULT 0;
ALTER TABLE session_logs ADD COLUMN IF NOT EXISTS flagged_interactions_count INT NOT NULL DEFAULT 0;
