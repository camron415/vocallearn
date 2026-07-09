-- VocalLearn Migration: Lesson Completions & Progress Tracking
-- Tracks when users complete lessons and their best scores

-- ============================================
-- LESSON COMPLETIONS
-- ============================================
CREATE TABLE IF NOT EXISTS lesson_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  times_completed INT NOT NULL DEFAULT 1,
  facts_total INT NOT NULL DEFAULT 0,
  facts_correct INT NOT NULL DEFAULT 0,
  best_accuracy FLOAT NOT NULL DEFAULT 0,
  last_duration_seconds INT,
  UNIQUE(user_id, lesson_id)
);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
  ON lesson_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own completions"
  ON lesson_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own completions"
  ON lesson_completions FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_lesson_completions_user_id ON lesson_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_lesson_id ON lesson_completions(lesson_id);
