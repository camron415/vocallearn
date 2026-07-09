# VocalLearn Handoff

This is the current engineering handoff for continuing the project in Cursor.

## What The App Is

VocalLearn is a voice-first spaced repetition learning app. Users learn by speaking facts out loud, the app evaluates recall with AI, and future review is scheduled with a modified SM-2 model.

Core product goals:

- teach any subject through spoken recall
- keep facts as the atomic unit of learning
- evaluate meaning instead of exact phrasing when appropriate
- combine teaching, quiz, and review into one structured session engine
- make the tutor structured and useful instead of vague or repetitive

## Current Stack

- React Native 0.81
- React 19
- Expo SDK 54
- Expo Router
- TypeScript
- Zustand
- Supabase
- xAI Grok
- `expo-speech-recognition`
- `expo-speech`

## Key Project Structure

- `app/`: Expo Router screens
- `app/session/[id].tsx`: active session UI and STT/TTS wiring
- `src/hooks/useSession.ts`: main session engine
- `src/stores/lesson-store.ts`: lesson/fact/progress loading
- `src/engine/`: spaced repetition, teaching-plan, tutor, scoring logic
- `src/lib/`: Grok, Supabase, voice, notifications
- `supabase/migrations/`: schema changes
- `scripts/`: seeders and utility scripts

## Recent Major Work

### Teaching plans and learning profiles

Added:

- `src/types/teaching.ts`
- `src/engine/teaching-plan.ts`
- `src/engine/fact-learning.ts`
- `src/engine/teach-copy.ts`
- `supabase/migrations/006_teaching_plans_and_learning_profiles.sql`

This work introduced:

- inferred lesson-level teaching frames
- inferred per-fact teaching plans
- richer teaching copy and review phrasing
- persisted learning outcomes beyond plain correct/incorrect
- reteach and assisted-recall state

### Session behavior changes

Main behavior changes in `src/hooks/useSession.ts` and `app/session/[id].tsx`:

- pinned current question card
- wrong-answer flow replaced with `hint 1 -> hint 2 -> reveal -> repeat once`
- reveal-repeat stays incorrect for recall scheduling
- `notifySpeechDetected()` stops teach/check-in auto-advance once the user begins speaking
- richer `learning_profile` persistence on `user_fact_progress`

## Important Data Model Note

Migration `supabase/migrations/006_teaching_plans_and_learning_profiles.sql` adds:

- `lessons.teaching_plan`
- `facts.teaching_plan`
- `user_fact_progress.learning_profile`

Important nuance:

- `teaching_plan` columns are optional overrides
- old lessons do not need manual backfill to use the new system
- when those columns are null, the app infers plans in `src/stores/lesson-store.ts` using `src/engine/teaching-plan.ts`

## Most Recent Conversation Summary

The latest debugging thread was about whether the newest session changes had actually reached the phone.

What was confirmed:

- local source contains the new session logic
- the Supabase migration is live
- recent bug reports from the phone still reflected old behavior
- that strongly indicated the phone was running a stale build

What happened next:

- a fresh iOS archive was built
- export succeeded
- the app was installed and launched on the connected iPhone

Install issue root cause:

- the first install attempt used a nonexistent exported `.app` path
- the correct artifact was the exported `.ipa`

Current state at handoff:

- fresh build is installed on phone
- next useful step is direct on-device retesting of the updated session behavior

## Exact Rebuild And Install Workflow That Worked

Use `/tmp`, not the synced `build/` directory under Documents.

```bash
cd ios

export BUILD_STAMP=$(date +%Y%m%d-%H%M%S)
export DERIVED_PATH="/tmp/VocalLearn-$BUILD_STAMP-derived"
export ARCHIVE_PATH="/tmp/VocalLearn-$BUILD_STAMP.xcarchive"
export EXPORT_PATH="/tmp/VocalLearn-$BUILD_STAMP-IPA"

xcodebuild \
  -workspace VocalLearn.xcworkspace \
  -scheme VocalLearn \
  -configuration Release \
  -destination generic/platform=iOS \
  -derivedDataPath "$DERIVED_PATH" \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  archive

xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist ../build/ExportOptions.plist

xcrun devicectl device install app \
  --device 00008130-00163C9A0061401C \
  "$EXPORT_PATH/VocalLearn.ipa"

xcrun devicectl device process launch \
  --device 00008130-00163C9A0061401C \
  com.vocallearn.app
```

Connected device last used successfully:

- `iPhone de Camron Trost`
- UDID: `00008130-00163C9A0061401C`

## Known Caveats

- OTA should not be trusted yet for guaranteed same-day delivery; use a fresh native build when behavior matters
- the git worktree in this environment has behaved oddly before, including many files appearing untracked unexpectedly
- React 19 + Zustand previously required narrower selectors to avoid update-depth crashes
- review mode was recently reworked into segmented full-lesson review rather than only due-fact review

## Best Files To Open First In Cursor

If continuing session logic:

- `src/hooks/useSession.ts`
- `app/session/[id].tsx`
- `src/engine/teach-copy.ts`
- `src/engine/teaching-plan.ts`
- `src/engine/fact-learning.ts`

If continuing lesson/data loading:

- `src/stores/lesson-store.ts`
- `src/types/lesson.ts`
- `src/types/database.ts`

If continuing backend/migrations:

- `supabase/migrations/006_teaching_plans_and_learning_profiles.sql`
- `supabase/`
- `scripts/`

## Immediate Next Steps

Retest on the phone:

- pinned question visibility
- hint ladder behavior
- reveal-repeat still counting incorrect
- teach/check-in not advancing over user speech
- whether the reported new-lesson freeze still reproduces

If the freeze reproduces on the fresh build, the next move should be pulling the latest `bug_reports`, `session_logs`, and `session_interactions` for that exact run and tracing the failing turn.