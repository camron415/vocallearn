# Standup prep
**Date:** 2026-07-11T13:16:30.497Z · **Project:** vocallearn
**Analyst job:** aj-1783775748984-6u8x8p

# Standup prep — VocalLearn
**Date:** 2026-07-11T13:16:30.497Z · **Manager:** Sloane

standup: active

## Since yesterday
_See git snapshot and analyst findings._

## Git snapshot
HEAD: 2d7acf9

## Recent commits
2d7acf9 Remove hardcoded Supabase test credentials from dev script.
337479d Ship current VocalLearn app: Expo Router, voice sessions, Supabase, and docs.
796beb4 Initial commit

## Working tree
## main
?? inbox/

## Roadmap excerpt
### README.md

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
npx tsc --noEm

## Test status
_Tests not run (set ATLAS_MANAGER_RUN_TESTS=1 to enable)._

## Analyst findings
## Headline
VocalLearn codebase shows no visible implementation of roadmap-ID vs. HANDOFF tracking, P0–P3/S0–S3 tagging, 1-day approval windows, or S0/S1 auto-queue logic; `ROADMAP.md` is explicitly historical and `HANDOFF.md` contains no priority or approval fields.

## Key findings
- **Git activity**: HEAD at 2d7acf9 ("Remove hardcoded Supabase test credentials from dev script") after 337479d ("Ship current VocalLearn app") and 796beb4 (initial commit); working tree clean on `main`.
- **Canonical docs**: `README.md` and `HANDOFF.md` both direct readers to `ROADMAP.md` as historical only; no roadmap ID, priority tags, or approval workflow appear in either file.
- **Priority implementation files**: Session engine in `src/hooks/useSession.ts` + `app/session/[id].tsx`, teaching logic in `src/engine/{teaching-plan,fact-learning,teach-copy}.ts`; none contain P0–P3/S0–S3 markers or approval gates.
- **Phase status**: `PHASE_1_75.md` is listed under "Where summaries live" but not loaded in the provided excerpts; `docs/PHASE_1_5_CLOSEOUT.md` and `docs/VOICE_PHASE4.md` are also referenced but unseen.
- **Auto-queue logic**: No code or docs reference S0/S1 auto-queue, 1-day approval, or inbox-to-roadmap handoff; `inbox/*.md` is described as "session close artifacts from voice" with no sample content shown.

## Risks or gaps
- **Missing roadmap ID linkage**: `ROADMAP.md` (10000 chars excerpt) states it is "mostly historical product planning now"; no current roadmap ID or mapping to `HANDOFF.md` state is documented.
- **No priority tagging surface**: `src/constants/config.ts`, `HANDOFF.md`, and `README.md` contain no P0–P3/S0–S3 labels or approval workflow fields.
- **1-day approval workflow undefined**: No files in the deep-read set (`src/hooks/useSession.ts`, `src/engine/*`, `supabase/migrations/006_*`) implement or reference approval gates.
- **S0/S1 auto-queue absent**: No logic in `src/stores/lesson-store.ts`, `src/hooks/useSession.ts`, or `inbox/` handling for auto-queuing high-severity items.
- **Phase doc visibility**: If `PHASE_1_75.md` contains checked-off steps, the analyst cannot confirm Phase 1.75 is active without inspecting that file.

## Suggested next steps
- Open `docs/PHASE_1_75.md` and `docs/ROADMAP.md` to extract any roadmap ID, priority tags, and checked Phase 1.75 steps.
- Inspect `inbox/*.md` for the most recent voice-session artifacts to see if they contain priority or approval fields.
- Review `src/hooks/useSession.ts` and `src/engine/fact-learning.ts` for any TODO/FIXME comments that might map to S0/S1 items.
- Check `supabase/migrations/` and `scripts/` for any seed or migration comments referencing roadmap IDs or approval status.
- If the above files lack the needed fields, next inspect `.github/copilot-instructions.md` and `CURSOR_START_PROMPT.md` for any workflow conventions.

## Proposed today (P / S)
1. _(Manager: list max 3 with P1–P3 and S0–S3 from analyst context)_

## Decisions for Camron
1. _(If none: write "None today" — default approval window 1 day when listed)_

## Auto queue (S0/S1)
- _(Tasks that need no standup approval)_
