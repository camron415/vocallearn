-- VocalLearn: Remove Finance Basics test data
-- Run this in Supabase SQL Editor.
-- The cascade rules handle everything: deleting the subject removes
-- lessons → facts → user_fact_progress, session_logs, leaderboard_entries automatically.

DELETE FROM subjects WHERE id = '91b2c3d4-e5f6-7890-abcd-ef1234567890';
