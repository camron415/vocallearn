-- Curriculum modules + lesson unlock metadata
-- Adds a middle layer between subjects and lessons so a subject can behave like a course.

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(subject_id, order_index)
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view modules" ON modules FOR SELECT TO authenticated USING (true);

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES modules ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unlock_threshold FLOAT NOT NULL DEFAULT 0.7;

CREATE INDEX IF NOT EXISTS idx_modules_subject_id ON modules(subject_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
