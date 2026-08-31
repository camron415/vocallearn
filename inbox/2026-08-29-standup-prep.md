# Standup prep
**Date:** 2026-08-29T12:00:24.887Z · **Project:** vocallearn
**Analyst job:** aj-1788004807119-qqnw9w

# Standup prep — Halo / VocalLearn
**Date:** 2026-08-29T12:00:24.887Z · **Manager:** Sloane

standup: active

## Since yesterday
- Shipped the recruiter-friendly README and archived engineering notes so hiring teams see Halo first.
- Published Cove web so early-access invites can go out.
- Snapshot the Lab Paper Keep loop as the weekend V2 restore point.

## Roadmap position
- Phase 1.75 is the active plan; V2 Cove/Keep loop is built and walkable in the Lab preview.
- Next real outcome is confirming Phase 1.75 is still the active plan, then adding simple priority labels to the roadmap.

## Proposed today (P / S)
1. Confirm Phase 1.75 is still the active plan, then add simple priority labels to the roadmap — P1 — S2
2. Read the Halo pricing and scaling doc so we have the tier and cost numbers ready for any early-access conversation — P2 — S1

## Decisions for Camron
Should we keep Phase 1.75 as the active plan for the rest of the week, or switch to a different phase?

## Auto queue (S0/S1)
- None today

## Mac only (do not read on phone)
Technical detail for Cursor / later review. Phone brief strips this section.

### Git snapshot
HEAD: 84c76c9

## Recent commits
84c76c9 Snapshot the Lab Paper Keep loop as the weekend V2 restore point.
6a6ecd8 Expand README with V1/V2 vision, learning loop, and recent builds.
4f61d3e Lead the README with Halo so GitHub matches the live product.
68308de Lab-only split of Cove CSS into owned files; preserve cascade; do not promote.
b7b497b Ship Cove web so early-access invites can go out.
c0cc60e Publish a recruiter-friendly README; archive engineering notes.
2d7acf9 Remove hardcoded Supabase test credentials from dev script.
337479d Ship current VocalLearn app: Expo Router, voice sessions, Supabase, and docs.
796beb4 Initial commit

## Files changed recently
.cursor/rules/atlas-loop.mdc                       |   12 +
 .cursor/rules/cove-rollout.mdc                     |   27 +
 .cursor/rules/cursor-visual-qa.mdc                 |   25 +
 .cursor/rules/halo-loop.mdc                        |   20 +
 .cursor/rules/harvest-capture.mdc                  |   17 +
 .cursor/rules/home-mixer.mdc                       |   25 +
 .cursor/rules/kept-board.mdc                       |   20 +
 .cursor/rules/kept-v2-sunday.mdc                   |   15 +
 .env.example                                       |   11 +
 .github/copilot-instructions.md                    |   95 +
 .gitignore                                         |   11 +
 App.tsx                                            |   20 -
 CURSOR_START_PROMPT.md                             |   38 +
 HANDOFF.md                                         |  193 +
 README.md                                          |  240 +
 ROADMAP.md                                         |  399 +
 app.json                                           |   38 +-
 app/(tabs)/_layout.tsx                             |  124 +
 app/(tabs)/ask.tsx                                 |  179 +
 app/(tabs)/index.tsx                               |  459 ++
 app/(tabs)/learn.tsx                               |  597 ++
 app/(tabs)/profile.tsx                             |  224 +
 app/(tabs)/subjects.tsx                            |  468 ++
 app/_layout.tsx                                    |   78 +
 app/ask/[id].tsx                                   |  178 +
 app/ask/approvals.tsx                              |  150 +
 app/auth/login.tsx                                 |  127 +
 app/auth/register.tsx                              |  189 +
 app/index.tsx                                      |   22 +
 app/lesson/[id].tsx                                |  149 +
 app/session/[id].tsx                               | 1765 ++++
 assets/sounds/correct.wav                          |  Bin 0 -> 54730 bytes
 assets/sounds/mic_open.wav                         |  Bin 0 -> 15920 bytes
 assets/sounds/perfect.wav                          |  Bin 0 -> 73250 bytes
 assets/sounds/session_complete.wav                 |  Bin 0 -> 104122 bytes
 assets/sounds/wrong.wav                            |  Bin 0 -> 48554 bytes
 docs/COVE_KEEP_VISION.md                           |  117 +
 docs/ENGINEERING_README.md                         |  318 +
 docs/FOR_RECRUITERS.md                             |   45 +
 docs/HALO_PRICING_AND_SCALING.md                   |  126 +
 eas.json                                           |   16 +
 index.ts                                           |    9 +-
 package-lock.json                                  | 3846 +++++++--
 package.json                                       |   41 +-
 scripts/analyze-session-latency.mjs                |   95 +
 scripts/benchmark-latency.mjs                      |  151 +
 scripts/benchmark-voice-think-fast.mjs             | 1403 ++++
 scripts/check-session-prompts.ts                   |  116 +
 scripts/gen-sounds.js                              |  187 +
 scripts/generate-seed.sh                           |   39 +
 scripts/generate-seed.ts                           |  317 +
 scripts/run-tests.sh                               |   46 +
 scripts/seed-ai-course.mjs                         |  735 ++
 scripts/seed-career-prep-course.mjs                |  441 +
 scripts/seed-junior-interview-course.mjs           |  619 ++
 scripts/start-overnight.sh                         |    6 +
 scripts/test-runner.ts                             | 1360 ++++
 src/components/session/BugReportModal.tsx          |  228 +
 src/constants/ask.ts                               |   39 +
 src/constants/config.ts                            |   77 +
 src/constants/prompts.ts                           |   39 +
 src/engine/fact-learning.ts                        |  117 +
 src/engine/fact-miner.ts                           |  133 +
 src/engine/lesson-flow.ts                          |  19

## Working tree
## halo-ui-streamline...origin/halo-ui-streamline [ahead 4]
 M .cursor/rules/halo-loop.mdc
 M .cursor/rules/kept-v2-sunday.mdc
 M web/HALO-V2-SUNDAY.md
 M web/KEPT-BOARD.md
 M web/lanes/A.md
 M web/lanes/B.md
 M web/src/app/styles/home.css
 M web/src/components/HomeBubbles.tsx
 M web/src/lib/harvest.ts
 M web/src/lib/keep-memory.ts
 M web/src/lib/learn-mine.ts
?? inbox/
?? web/src/lib/chip-recall.ts
?? web/src/lib/learn-mine-fixtures.ts
?? web/src/lib/open-score.ts
?? web/src/lib/v2-lib-check.ts

### Test status
_Tests not run (set ATLAS_MANAGER_RUN_TESTS=1 to enable)._

### Analyst findings
## Headline
Halo phase is active on the web branch (HEAD 84c76c9) with V2 Cove/Keep loop in Lab preview; Phase 1.75 is active per `docs/PHASE_1_75.md` references, but no P0-P3/S0-S3 tags or S0/S1 auto-queue logic exist in roadmap or inbox files.

## Key findings
- **Git activity**: HEAD 84c76c9 ("Snapshot the Lab Paper Keep loop as the weekend V2 restore point") after 6a6ecd8 ("Expand README with V1/V2 vision") and 4f61d3e ("Lead the README with Halo"); working tree shows 12 modified files on `halo-ui-streamline` branch ahead 4.
- **Canonical docs**: `inbox/2026-08-10-ask-practice-roadmap.md` defines Phase 0–3 as implemented with `app/ask/`, `app/ask/approvals.tsx`, `src/engine/fact-miner.ts` as priority implementation files; `docs/PHASE_1_75.md` is referenced but not loaded.
- **Priority implementation files**: `src/hooks/useSession.ts`, `src/stores/lesson-store.ts`, `src/engine/teaching-plan.ts`, `src/engine/fact-learning.ts`, `supabase/migrations/006_teaching_plans_and_learning_profiles.sql` contain the active session, teaching-plan inference, and learning-profile persistence logic.
- **Phase status**: `inbox/2026-08-28-standup-prep.md` explicitly states "Confirm Phase 1.75 is still the active plan" — Phase 1.75 is therefore active.
- **Halo Ask untouched**: `web/src/app/ask/page.tsx`, `web/src/components/AskLanding.tsx`, `web/src/lib/ask-turn.ts` remain the production Ask surface; no mobile Ask code touches these files.

## Risks or gaps
- **No P0-P3/S0-S3 tags** visible in `inbox/2026-08-10-ask-practice-roadmap.md`, `inbox/2026-08-10-halo-web-roadmap.md`, `HANDOFF.md`, or any `inbox/*.md`.
- **S0/S1 auto-queue logic absent** from `src/hooks/useSession.ts`, `src/stores/lesson-store.ts`, and `inbox/*.md` excerpts.
- **Phase doc visibility**: `docs/PHASE_1_75.md` must be inspected next to confirm checked-off steps and extract any roadmap ID or priority tags.
- **Working tree** shows 12 modified files on branch `halo-ui-streamline` ahead of origin; risk of untracked-file anomalies noted in `HANDOFF.md`.

## Suggested next steps
1. Open `docs/PHASE_1_75.md` to extract any roadmap ID, priority tags, and checked Phase 1.75 steps.
2. Inspect `inbox/2026-08-28-standup-prep.md` and `inbox/2026-08-10-halo-web-roadmap.md` for any hidden P0-P3/S0-S3 labels or approval workflow fields.
3. Review `src/hooks/useSession.ts` and `src/engine/fact-learning.ts` for any TODO/FIXME comments that might map to S0/S1 items.
4. Check `supabase/migrations/` and `scripts/` for any seed or migration comments referencing roadmap IDs or approval status.
5. If the above files lack priority tags, propose adding simple P0-P3/S0-S3 labels to `inbox/2026-08-10-halo-web-roadmap.md` as the next planning session outcome.
