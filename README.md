# VocalLearn

VocalLearn is a voice-first spaced repetition learning app built with React Native, Expo, Supabase, and xAI/Grok. The core idea is the production effect: users learn better by saying facts out loud, not just reading them. The app teaches small facts, quizzes spoken recall, evaluates meaning with AI, and schedules review with a modified SM-2 model.

Use this file as the project front door. For the current engineering state, recent conversation summary, rebuild workflow, and immediate next steps, start with `HANDOFF.md`.

## Read This First

- `README.md`: project overview, structure, workflows
- `HANDOFF.md`: current engineering state and latest conversation handoff
- `CURSOR_START_PROMPT.md`: ready-to-paste prompt for starting the next Cursor conversation
- `ROADMAP.md`: older planning document; useful for product history, but parts of the stack/architecture sections are outdated

## Core Goals

- Build a voice-powered learning app where users learn any subject by speaking facts out loud.
- Keep facts as the atomic learning unit so lessons stay small, testable, and schedulable.
- Use AI to judge semantic correctness, not exact wording, except where strict recall matters.
- Combine lesson teaching, active recall, and spaced repetition into one session engine.
- Make the tutor feel structured and patient instead of chatty or vague.

## Current Stack

- React Native 0.81 + React 19
- Expo SDK 54 + Expo Router
- TypeScript
- Zustand for app state
- Supabase for auth, data, RLS, and logs
- xAI Grok for tutor/scoring calls
- `expo-speech-recognition` for STT and `expo-speech` for TTS
- `expo-updates` is installed, but production OTA flow is not fully operational yet

## Project Structure

```text
vocalLearn/
├── app/                  Expo Router screens
│   ├── (tabs)/           Main app tabs
│   ├── auth/             Login/register
│   ├── lesson/           Lesson details
│   └── session/          Active session UI
├── src/
│   ├── components/       Reusable UI and session components
│   ├── constants/        App config and prompt constants
│   ├── engine/           Core learning/session logic
│   ├── hooks/            Session orchestration hooks
│   ├── lib/              Supabase, Grok, voice, notifications
│   ├── stores/           Zustand stores
│   ├── types/            App and database types
│   └── utils/            Small helpers
├── supabase/
│   ├── migrations/       Schema changes
│   └── *.sql             Seed/update/reset helpers
├── ios/                  Native iOS project
├── scripts/              Seeders and utility scripts
└── ROADMAP.md            Older roadmap and product planning
```

## Architecture Notes

- `app/session/[id].tsx` is the session screen and STT/TTS UI layer.
- `src/hooks/useSession.ts` is the main session engine.
- `src/stores/lesson-store.ts` loads lessons, facts, and progress from Supabase.
- `src/engine/spaced-repetition.ts` manages scheduling quality and review intervals.
- `src/engine/tutor.ts` and related prompt helpers control tutor/scoring prompts.
- `src/lib/grok.ts` contains the Grok API client and fallback behavior.

Important design rules:

- Facts are the unit of learning.
- Strictness is stored per fact, not chosen by the model.
- LLM calls are stateless: send current lesson context and user mastery each time.
- Database rows use snake_case; app-layer types use camelCase.
- `@/` maps to `src/`.

## Recent Major Work

The most recent product/engineering push focused on making teaching and review feel much more structured.

### New teaching-plan and learning-profile system

Added:

- `src/types/teaching.ts`
- `src/engine/teaching-plan.ts`
- `src/engine/fact-learning.ts`
- `src/engine/teach-copy.ts`

What this does:

- Infers a stable lesson teaching frame and per-fact teaching plan.
- Supports one-pass vs two-pass teaching heuristics.
- Generates better teach copy, hints, reveal prompts, and review prompts.
- Persists richer fact outcomes beyond plain correct/incorrect.

### Session behavior changes

Main changes in `src/hooks/useSession.ts` and `app/session/[id].tsx`:

- Added a pinned current-question card so the spoken prompt stays visible.
- Replaced the old wrong-answer loop with a hint ladder:
  - hint 1
  - hint 2
  - reveal
  - forced repeat once
- Reveal-repeat still counts as incorrect for recall quality and future scheduling.
- Added `notifySpeechDetected()` so teach/check-in auto-advance does not interrupt the user once they start speaking.
- Persisted richer `learning_profile` state on `user_fact_progress`.

### Migration and data model work

Migration added:

- `supabase/migrations/006_teaching_plans_and_learning_profiles.sql`

It adds:

- `lessons.teaching_plan`
- `facts.teaching_plan`
- `user_fact_progress.learning_profile`

Important behavior:

- `teaching_plan` columns are optional overrides.
- Old lessons do not need manual backfill to use the new system.
- When those columns are null, the app infers plans in `src/stores/lesson-store.ts` via `src/engine/teaching-plan.ts`.

## Most Recent Conversation State

As of June 1, 2026, the active debugging thread was about whether the newest session changes had actually made it onto the phone.

What was verified:

- The local source code contains the new session/question/hint logic.
- The Supabase migration is live and the new columns exist.
- Bug reports from the phone still reflected old behavior, which strongly suggested the phone was running a stale build.
- A fresh iOS archive/export/install was then completed successfully.

Final result of that thread:

- Archive succeeded.
- Export succeeded.
- Fresh IPA install to the connected iPhone succeeded.
- App launch on device succeeded.

Root cause of the install hiccup:

- The first install command pointed `devicectl` at an exported `.app` path that did not exist.
- The successful path was the exported `.ipa`.

## Build, Rebuild, and Update Workflow

### Local development

```bash
npm install
npx expo start
npx tsc --noEmit
```

Useful package scripts:

```bash
npm run start
npm run typecheck
npm run ios
npm run ios:device
npm run android
```

### iPhone release rebuild that worked

For reliable local phone installs, build into `/tmp`, not the synced `build/` directory under Documents. Using the repo `build/` tree can trigger native signing/resource issues.

Working pattern:

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
```

Install and launch on the connected phone:

```bash
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

### Important install caveat

If export produces `VocalLearn.ipa`, install that IPA. Do not point `devicectl` at a nonexistent exported `.app` path.

### OTA / EAS status

Repo status:

- `expo-updates` is installed.
- `eas.json` exists.
- `app.json` has `runtimeVersion` and `updates` config.

But the current shipping situation is still incomplete for same-day OTA use:

- EAS login/linking/publish flow has not been fully finished.
- Prior repo notes also indicate native update config is not yet in a state where you should assume OTA will solve same-day phone updates.
- For now, the safe path is still a fresh native build/install when behavior must be guaranteed.

## Release Checklist

Use this when you need confidence that a phone test is actually running current code.

### Before building

- Run `npm run typecheck`
- Confirm the target code changes exist locally
- If database changes are involved, verify the relevant Supabase migration is live

### Build and install

- Build iOS release artifacts into `/tmp`
- Export an IPA
- Install the IPA with `xcrun devicectl device install app`
- Launch the app with `xcrun devicectl device process launch`

### After install

- Re-test the exact behavior that previously failed
- If behavior still looks old, assume stale build only after confirming the fresh install path used the IPA and succeeded
- If the app freezes or regresses, pull the latest `bug_reports`, `session_logs`, and `session_interactions` for the exact test run

## Supabase and Data Notes

- Main schema starts at `supabase/migrations/001_initial_schema.sql`.
- Recent teaching metadata lives in `supabase/migrations/006_teaching_plans_and_learning_profiles.sql`.
- Seed/update/reset helpers exist under `supabase/` and `scripts/`.
- Some live content updates and learning-state resets require a privileged SQL path outside normal app auth because current workspace env does not include a service role key.

Current environment conventions:

- App env vars are in `.env.local`.
- Public vars are prefixed with `EXPO_PUBLIC_`.
- Key ones include Supabase URL/key and Grok API config.

## Known Important Caveats

- The git worktree in this environment has behaved oddly before, with many app files sometimes appearing untracked. Be careful not to assume a clean git status means much here.
- React 19 + Zustand required narrower selectors in several screens to avoid update-depth crashes.
- Review behavior was recently reworked to operate as segmented full-lesson review, not only due-fact review.
- The current iOS standalone path is reliable with `/tmp` build artifacts and direct `devicectl` install.

## Suggested Starting Points In Code

If continuing session behavior work:

- `src/hooks/useSession.ts`
- `app/session/[id].tsx`
- `src/engine/teach-copy.ts`
- `src/engine/teaching-plan.ts`
- `src/engine/fact-learning.ts`

If continuing lesson/content loading work:

- `src/stores/lesson-store.ts`
- `src/types/lesson.ts`
- `src/types/database.ts`

If continuing backend/data work:

- `supabase/migrations/006_teaching_plans_and_learning_profiles.sql`
- `scripts/`
- `supabase/*.sql`

## Immediate Next Steps From Here

The fresh build is on the phone, so the next useful step is direct on-device retesting of:

- pinned question visibility
- hint 1 / hint 2 / reveal / repeat ladder
- reveal-repeat staying incorrect for scheduling
- teach/check-in not auto-advancing when the user starts talking
- whether the reported new-lesson freeze still reproduces

If the freeze still happens on the fresh build, the next move should be pulling the newest `bug_reports`, `session_logs`, and `session_interactions` for that exact run and tracing the failing turn.

## Useful References

- `ROADMAP.md` for older roadmap planning
- `.github/copilot-instructions.md` for project-specific coding conventions
- `HANDOFF.md` for the latest engineering handoff
