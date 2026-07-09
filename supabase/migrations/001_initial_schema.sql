-- VocalLearn Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  preferred_mode TEXT NOT NULL DEFAULT 'both' CHECK (preferred_mode IN ('voice', 'write', 'both')),
  notification_style TEXT NOT NULL DEFAULT 'scheduled' CHECK (notification_style IN ('random', 'scheduled', 'off')),
  notification_times JSONB,
  daily_goal_minutes INT NOT NULL DEFAULT 30,
  streak_count INT NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SUBJECTS
-- ============================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_community BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- LESSONS
-- ============================================
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL DEFAULT 0,
  is_community BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- FACTS (the atomic learning unit)
-- ============================================
CREATE TABLE IF NOT EXISTS facts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons ON DELETE CASCADE,
  content TEXT NOT NULL,
  explanation TEXT,
  strictness TEXT NOT NULL DEFAULT 'medium' CHECK (strictness IN ('high', 'medium', 'low')),
  order_index INT NOT NULL DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- USER FACT PROGRESS (spaced repetition state)
-- ============================================
CREATE TABLE IF NOT EXISTS user_fact_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  fact_id UUID NOT NULL REFERENCES facts ON DELETE CASCADE,
  ease_factor FLOAT NOT NULL DEFAULT 2.5,
  interval_days FLOAT NOT NULL DEFAULT 0,
  repetitions INT NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mastery_level INT NOT NULL DEFAULT 0,
  times_correct INT NOT NULL DEFAULT 0,
  times_incorrect INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, fact_id)
);

-- ============================================
-- SESSION LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS session_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('voice', 'write', 'both')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  facts_reviewed INT NOT NULL DEFAULT 0,
  facts_correct INT NOT NULL DEFAULT 0,
  duration_seconds INT
);

-- ============================================
-- LEADERBOARD ENTRIES (opt-in)
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects ON DELETE CASCADE,
  mastery_score FLOAT NOT NULL DEFAULT 0,
  facts_mastered INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, subject_id)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fact_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Subjects: everyone can read, authenticated users can create
CREATE POLICY "Anyone can view subjects" ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create subjects" ON subjects FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Lessons: everyone can read, creators can manage
CREATE POLICY "Anyone can view lessons" ON lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creators can insert lessons" ON lessons FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Facts: everyone can read
CREATE POLICY "Anyone can view facts" ON facts FOR SELECT TO authenticated USING (true);

-- User progress: users can only see/manage their own
CREATE POLICY "Users can view own progress" ON user_fact_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_fact_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_fact_progress FOR UPDATE USING (auth.uid() = user_id);

-- Session logs: users can only see/manage their own
CREATE POLICY "Users can view own sessions" ON session_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON session_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON session_logs FOR UPDATE USING (auth.uid() = user_id);

-- Leaderboard: everyone can read, users manage their own
CREATE POLICY "Anyone can view leaderboard" ON leaderboard_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own leaderboard entry" ON leaderboard_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leaderboard entry" ON leaderboard_entries FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_facts_lesson_id ON facts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_fact_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_next_review ON user_fact_progress(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_session_logs_user_id ON session_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_subject ON leaderboard_entries(subject_id, mastery_score DESC);
