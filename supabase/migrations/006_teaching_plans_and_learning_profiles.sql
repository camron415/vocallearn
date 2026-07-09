-- Teaching plans + learning profiles
--
-- teaching_plan columns are optional authoring overrides. The app can infer
-- a lesson/fact plan when these are null, but storing JSON here lets us tweak
-- the system later without code changes.
--
-- learning_profile persists the richer fact outcome state needed for:
-- - assisted-recall scheduling
-- - reveal/repeat tracking
-- - review reteach strategy selection

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS teaching_plan JSONB;

ALTER TABLE facts
  ADD COLUMN IF NOT EXISTS teaching_plan JSONB;

ALTER TABLE user_fact_progress
  ADD COLUMN IF NOT EXISTS learning_profile JSONB NOT NULL DEFAULT jsonb_build_object(
    'lastOutcome', null,
    'lastQualityScore', null,
    'hintsUsedOnLastAttempt', 0,
    'revealedOnLastAttempt', false,
    'revealRepeatQuality', null,
    'needsReteach', false,
    'nextReteachStrategy', 'reword_same_lens',
    'outcomeCounts', jsonb_build_object()
  );
