-- VocalLearn: Remove test subjects — American History, Astronomy, Human Anatomy, Rocket Science/Physics
-- Run this in Supabase SQL Editor.
-- Cascade rules: deleting a subject removes its lessons → facts → user_fact_progress,
-- session_logs, and leaderboard_entries automatically.

DELETE FROM subjects
WHERE name IN (
  'American History',
  'Astronomy',
  'Human Anatomy',
  'Rocket Science',
  'Physics',
  'Rocket Science & Physics'
);
