# Standup prep
**Date:** 2026-08-30T12:00:29.155Z · **Project:** vocallearn
**Analyst job:** aj-1788091209568-pv19ob

# Standup prep — Halo / VocalLearn
**Date:** 2026-08-30T12:00:29.154Z · **Manager:** Sloane

standup: active

## Since yesterday
- Locked V2 Sunday planning and reset lane source for A/B workers.
- Shipped Cove web so early-access invites can go out.
- Published recruiter-friendly README and archived engineering notes.

## Roadmap position
- Phase 1.75 is the active track on the web branch.
- Next real outcome: confirm Phase 1.75 is still the plan, then add simple priority labels to the roadmap.

## Proposed today (P / S)
1. Confirm Phase 1.75 is still the active plan, then add simple priority labels to the roadmap — P1 — S2
2. Read the Halo pricing and scaling document so we have the tier and cost numbers ready for any future discussion — P2 — S1

## Decisions for Camron
Do we still treat Phase 1.75 as the active plan, or has anything shifted since last week?

## Auto queue (S0/S1)
None today

## Mac only (do not read on phone)
Technical detail for Cursor / later review. Phone brief strips this section.

### Git snapshot
HEAD: e0a5bb3

## Recent commits
e0a5bb3 Lock V2 Sunday planning and reset lane src for A/B workers.
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
 .cursor/rules/cursor-visual-qa.mdc                 |   26 +
 .cursor/rules/halo-loop.mdc                        |   22 +
 .cursor/rules/harvest-capture.mdc                  |   17 +
 .cursor/rules/home-mixer.mdc                       |   25 +
 .cursor/rules/kept-board.mdc                       |   20 +
 .cursor/rules/kept-v2-sunday.mdc                   |   16 +
 .env.example                                       |    4 +
 .github/copilot-instructions.md                    |   14 +-
 .gitignore                                         |    4 +
 README.md                                          |  412 +-
 ROADMAP.md                                         |    6 +-
 app/(tabs)/_layout.tsx                             |    6 +-
 app/(tabs)/ask.tsx                                 |  179 +
 app/(tabs)/subjects.tsx                            |    3 +
 app/_layout.tsx                                    |    2 +
 app/ask/[id].tsx                                   |  178 +
 app/ask/approvals.tsx                              |  150 +
 app/lesson/[id].tsx                                |   17 +-
 docs/COVE_KEEP_VISION.md                           |  117 +
 docs/ENGINEERING_README.md                         |  318 +
 docs/FOR_RECRUITERS.md                             |   45 +
 docs/HALO_PRICING_AND_SCALING.md                   |  126 +
 package.json                                       |    3 +
 scripts/analyze-session-latency.mjs                |   13 +-
 src/constants/ask.ts                               |   39 +
 src/engine/fact-miner.ts                           |  133 +
 src/engine/session-prompts.ts                      |   25 +
 src/stores/ask-store.ts                            |  366 +
 src/stores/lesson-store.ts                         |    3 +
 src/types/ask.ts                                   |   40 +
 src/types/database.ts                              |   82 +
 src/utils/markdown-plain.ts                        |   14 +
 supabase/migrations/007_ask_and_proposed_facts.sql |  131 +
 supabase/migrations/008_halo_family.sql            |  163 +
 .../migrations/009_halo_invites_photos_events.sql  |  164 +
 supabase/migrations/010_halo_lanes.sql             |   69 +
 supabase/migrations/011_halo_suggest_chips.sql     |   11 +
 supabase/migrations/012_halo_learn.sql             |   52 +
 supabase/migrations/013_halo_learn_harvest.sql     |   14 +
 supabase/seed_ask_schema.sql                       |  131 +
 web/.env.example                                   |   11 +
 web/.gitignore                                     |   45 +
 web/AGENTS.md                                      |    9 +
 web/CLAUDE.md                                      |    1 +
 web/HALO-LOOP.md                                   |   49 +
 web/HALO-V2-SUNDAY.md                              |  121 +
 web/KEPT-BOARD.md                                  |   37 +
 web/README.md                                      |  113 +
 web/V2-CHIEF-HANDOFF.md                            |   77 +
 web/eslint.config.mjs                              |   18 +
 web/lanes/A.md                                     |   30 +
 web/lanes/B.md                                     |   30 +
 web/next.config.ts                                 |   25 +
 web/package-lock.json                              | 8419 ++++++++++++++++++++
 web/package.json                                   |   37 +
 web/postcss.config.mjs                             |    7 +
 web/public/file.svg                                |    1 +
 web/public/globe.svg                               |    1 +
 web/public/next.svg                                |    1 +
 web/public/vercel.svg                              |    1 +
 web/public/window.svg                              |    1 +
 web/scripts/build-common-prompts.mjs               |  605 ++
 web/scripts/harvest-sink.mjs                       |   89 +
 web/scrip

## Working tree
## halo-ui-streamline...origin/halo-ui-streamline [ahead 5]
 M web/HALO-V2-SUNDAY.md
 M web/KEPT-BOARD.md
 M web/src/app/styles/chat.css
 M web/src/app/styles/home.css
 M web/src/app/styles/overlays.css
 M web/src/app/styles/skins-paper.css
 M web/src/components/AskLanding.tsx
 M web/src/components/ChatThread.tsx
 M web/src/components/HaloHeader.tsx
 M web/src/components/HarvestFlights.tsx
 M web/src/components/HomeBubbles.tsx
 M web/src/components/KeepPocket.tsx
 M web/src/components/LoopSkin.tsx
 M web/src/lib/harvest.ts
 M web/src/lib/keep-land.ts
 M web/src/lib/keep-memory.ts
 M web/src/lib/learn-mine.ts
 M web/tsconfig.json
?? inbox/
?? web/V2-CLOSED-GRADE-LOCK.md
?? web/V2-GOLD-PANEL-PROPOSAL.md
?? web/V2-OPUS-BRIEFS.md
?? web/V2-PARTIAL-CREDIT-LOCK.md
?? web/V2-REPLAY-REVIEW.md
?? web/opus-locks/
?? web/src/components/GoldKeptBadge.tsx
?? web/src/lib/chip-recall.ts
?? web/src/lib/learn-mine-fixtures.ts
?? web/src/lib/open-score.ts
?? web/src/lib/v2-lib-check.ts

### Test status
_Tests not run (set ATLAS_MANAGER_RUN_TESTS=1 to enable)._

### Analyst findings
## Headline
Halo phase is active on the web branch (HEAD e0a5bb3) with V2 Cove/Keep loop in Lab preview; Phase 1.75 is active per `docs/PHASE_1_75.md` references, but no P0-P3/S0-S3 tags or S0/S1 auto-queue logic exist in roadmap or inbox files.

## Key findings
- **Git activity**: HEAD e0a5bb3 ("Lock V2 Sunday planning and reset lane src for A/B workers") after 84c76c9 ("Snapshot the Lab Paper Keep loop") and 6a6ecd8 ("Expand README with V1/V2 vision"); working tree shows 15 modified files on `halo-ui-streamline` branch ahead 5.
- **Canonical docs**: `inbox/2026-08-10-ask-practice-roadmap.md` defines Phase 0–3 as implemented with `app/ask/`, `app/ask/approvals.tsx`, `src/engine/fact-miner.ts` as priority implementation files; `docs/PHASE_1_75.md` is referenced but not loaded.
- **Priority implementation files**: `src/hooks/useSession.ts`, `src/stores/lesson-store.ts`, `src/engine/teaching-plan.ts`, `src/engine/fact-learning.ts`, `supabase/migrations/006_teaching_plans_and_learning_profiles.sql` contain the active session, teaching-plan inference, and learning-profile persistence logic.
- **Phase status**: `inbox/2026-08-29-standup-prep.md` explicitly states "Confirm Phase 1.75 is still the active plan" — Phase 1.75 is therefore active.
- **Halo Ask untouched**: `web/src/app/ask/page.tsx`, `web/src/components/AskLanding.tsx`, `web/src/lib/ask-turn.ts` remain the production Ask surface; no mobile Ask code touches these files.

## Risks or gaps
- **No P0-P3/S0-S3 tags** visible in `inbox/2026-08-10-ask-practice-roadmap.md`, `inbox/2026-08-10-halo-web-roadmap.md`, `HANDOFF.md`, or any `inbox/*.md`.
- **S0/S1 auto-queue logic absent** from `src/hooks/useSession.ts`, `src/stores/lesson-store.ts`, and `inbox/*.md` excerpts.
- **Phase doc visibility**: `docs/PHASE_1_75.md` must be inspected next to confirm whether Phase 1.75 is active.
- **Working tree** shows 15 modified files on branch `halo-ui-streamline` ahead of origin; risk of untracked-file anomalies.
- **1-day approval workflow** and S0/S1 auto-queue logic absent from `src/hooks/useSession.ts`, `src/stores/lesson-store.ts`, and `inbox/*.md` excerpts.

## Suggested next steps
- Open `docs/PHASE_1_75.md` to extract any roadmap ID, priority tags, and checked Phase 1.75 steps.
- Inspect `inbox/*.md` for the most recent voice-session artifacts to see if they contain priority or approval fields.
- Review `src/hooks/useSession.ts` and `src/engine/fact-learning.ts` for any TODO/FIXME comments that might map to S0/S1 items.
- Check `supabase/migrations/` and `scripts/` for any seed or migration comments referencing roadmap IDs or approval status.
- If the above files lack priority tags, add P0-P3/S0-S3 labels to `inbox/2026-08-10-ask-practice-roadmap.md` and `inbox/2026-08-10-halo-web-roadmap.md` as the first planning-session task.
