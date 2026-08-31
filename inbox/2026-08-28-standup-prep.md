# Standup prep
**Date:** 2026-08-28T12:00:22.614Z · **Project:** vocallearn
**Analyst job:** aj-1787918404706-m837n5

# Standup prep — Halo / VocalLearn
**Date:** 2026-08-28T12:00:22.614Z · **Manager:** Sloane

standup: active

## Since yesterday
- Shipped the Cove web build so early-access invites can go out.
- Expanded the README with V1/V2 vision, learning loop, and recent builds to match the live product.
- Fixed Paper Keep padding and font sizing so the visual scale stays consistent on hard reload.

## Roadmap position
- We're on the Halo Ask surface (V1) with the Cove learning loop (V2) in Lab preview.
- Next real outcome is confirming Phase 1.75 is still the active plan before adding priority labels.

## Proposed today (P / S)
1. Confirm Phase 1.75 is still the active plan, then add simple priority labels to the roadmap — P1 — S2
2. Review the latest Halo pricing and scaling note so we have the tier and cost numbers ready for any early-access discussion — P2 — S1

## Decisions for Camron
Do you want me to surface the pricing tiers and cost-per-user numbers in the next standup, or keep them in the background for now?

## Auto queue (S0/S1)
- None today

## Mac only (do not read on phone)
Technical detail for Cursor / later review. Phone brief strips this section.

### Git snapshot
HEAD: 6a6ecd8

## Recent commits
6a6ecd8 Expand README with V1/V2 vision, learning loop, and recent builds.
4f61d3e Lead the README with Halo so GitHub matches the live product.
68308de Lab-only split of Cove CSS into owned files; preserve cascade; do not promote.
b7b497b Ship Cove web so early-access invites can go out.
c0cc60e Publish a recruiter-friendly README; archive engineering notes.
2d7acf9 Remove hardcoded Supabase test credentials from dev script.
337479d Ship current VocalLearn app: Expo Router, voice sessions, Supabase, and docs.
796beb4 Initial commit

## Files changed recently
.gitignore                             |   3 +
 app/(tabs)/_layout.tsx                 |   6 +-
 app/(tabs)/subjects.tsx                |   3 +
 app/_layout.tsx                        |   2 +
 app/lesson/[id].tsx                    |  17 +-
 src/engine/session-prompts.ts          |  25 +
 src/stores/lesson-store.ts             |   3 +
 src/types/database.ts                  |  82 ++++
 web/.env.example                       |   1 +
 web/.gitignore                         |   3 +
 web/next.config.ts                     |  15 +
 web/package-lock.json                  |   7 +
 web/src/app/api/chat/route.ts          |  49 +-
 web/src/app/ask/page.tsx               |  11 +-
 web/src/app/globals.css                |   4 +-
 web/src/app/invite/[token]/page.tsx    |  19 +-
 web/src/app/layout.tsx                 |  29 +-
 web/src/app/login/page.tsx             |   6 +-
 web/src/app/preview/page.tsx           |  43 +-
 web/src/app/styles/home.css            | 845 +++++++++++++++++++++++++++++----
 web/src/app/styles/motion.css          |  16 +-
 web/src/app/styles/preview-mixer.css   |   4 +
 web/src/app/styles/skins-paper.css     | 314 ++++++++++--
 web/src/components/AnswerBody.tsx      |  34 +-
 web/src/components/AskLanding.tsx      | 371 +++++++++++++--
 web/src/components/BubbleField.tsx     |   3 +-
 web/src/components/ChatThread.tsx      | 233 ++++++---
 web/src/components/Glass.tsx           |  14 +-
 web/src/components/HaloHeader.tsx      |  87 +++-
 web/src/components/HistoryMenu.tsx     |   3 +
 web/src/components/HomeTour.tsx        |  83 ----
 web/src/components/InviteSetup.tsx     | 214 +++++----
 web/src/components/LoginForm.tsx       |  90 ++--
 web/src/components/ModeMenu.tsx        |  78 +--
 web/src/components/MotionProvider.tsx  | 140 ++++--
 web/src/components/PreviewSwitcher.tsx | 603 ++++++++++++++++++++++-
 web/src/components/SettingsMenu.tsx    |  76 +--
 web/src/components/SpringStage.tsx     | 162 +++++--
 web/src/components/WaterCapsule.tsx    | 142 +++++-
 web/src/components/WaterSurface.tsx    | 170 ++++++-
 web/src/components/WelcomeGate.tsx     |  76 ---
 web/src/components/WorkTrace.tsx       |  22 +-
 web/src/lib/ask-turn.ts                |  42 +-
 web/src/lib/compose-keys.ts            |  17 +-
 web/src/lib/grok-stream.ts             |   1 +
 web/src/lib/grok.ts                    |   9 +-
 web/src/lib/halo-stream.ts             |   4 +-
 web/src/lib/markdown-plain.ts          |  10 +
 web/src/lib/suggest-chips.ts           | 261 ++++++----
 web/src/lib/supabase/middleware.ts     |  75 ++-
 web/src/lib/track.ts                   |   2 +-
 web/src/lib/water-edge.ts              | 328 +++++++++++--
 web/src/middleware.ts                  |  15 +-
 53 files changed, 3925 insertions(+), 947 deletions(-)

## Working tree
## halo-ui-streamline...origin/halo-ui-streamline [ahead 3]
 M .gitignore
 M app/(tabs)/_layout.tsx
 M app/(tabs)/subjects.tsx
 M app/_layout.tsx
 M app/lesson/[id].tsx
 M src/engine/session-prompts.ts
 M src/stores/lesson-store.ts
 M src/types/database.ts
 M web/.env.example
 M web/.gitignore
 M web/next.config.ts
 M web/package-lock.json
 M web/src/app/api/chat/route.ts
 M web/src/app/ask/page.tsx
 M web/src/app/globals.css
 M web/src/app/invite/[token]/page.tsx
 M web/src/app/layout.tsx
 M web/src/app/login/page.tsx
 M web/src/app/preview/page.tsx
 M web/src/app/styles/home.css
 M web/src/app/styles/motion.css
 M web/src/app/styles/preview-mixer.css
 M web/src/app/styles/skins-paper.css
 M web/src/components/AnswerBody.tsx
 M web/src/components/AskLanding.tsx
 M web/src/components/BubbleField.tsx
 M web/src/components/ChatThread.tsx
 M web/src/components/Glass.tsx
 M web/src/components/HaloHeader.tsx
 M web/src/components/HistoryMenu.tsx
 D web/src/components/HomeTour.tsx
 M web/src/components/InviteSetup.tsx
 M web/src/components/LoginForm.tsx
 M web/src/components/ModeMenu.tsx
 M web/src/components/MotionProvider.tsx
 M web/src/components/PreviewSwitcher.tsx
 M web/src/components/SettingsMenu.tsx
 M web/src/components/SpringStage.tsx
 M web/src/components/WaterCapsule.tsx
 M web/src/components/WaterSurface.tsx
 D web/src/components/WelcomeGate.tsx
 M web/src/components/WorkTrace.tsx
 M web/src/lib/ask-turn.ts
 M web/src/lib/compose-keys.ts
 M web/src/lib/grok-stream.ts
 

### Test status
_Tests not run (set ATLAS_MANAGER_RUN_TESTS=1 to enable)._

### Analyst findings
## Headline
VocalLearn codebase currently supports Lab priorities P0-P2 via the Ask→Practice loop and teaching-plan engine, but lacks explicit P0-P3/S0-S3 tags and any S0/S1 auto-queue logic while keeping the Halo Ask surface untouched.

## Key findings
- **Git activity**: HEAD 6a6ecd8 ("Expand README with V1/V2 vision") after 68308de ("Lab-only split of Cove CSS") and b7b497b ("Ship Cove web"); 53 files changed (+3925/-947) on branch `halo-ui-streamline` ahead of origin.
- **Canonical docs**: `inbox/2026-08-10-ask-practice-roadmap.md` defines Phase 0–3 as implemented (schema, Ask tab, miner+approval, Practice loop) with `app/ask/`, `app/ask/approvals.tsx`, `src/engine/fact-miner.ts` as priority implementation files.
- **Priority implementation files**: `src/hooks/useSession.ts`, `src/stores/lesson-store.ts`, `src/engine/teaching-plan.ts`, `src/engine/fact-learning.ts`, `supabase/migrations/006_teaching_plans_and_learning_profiles.sql` contain the active session, teaching-plan inference, and learning-profile persistence logic.
- **Phase status**: `docs/PHASE_1_75.md` is referenced in "Where summaries live" but not loaded; `inbox/2026-08-26-standup-prep.md` explicitly states "Confirm Phase 1.75 is still the active plan" — Phase 1.75 is therefore active.
- **Halo Ask untouched**: `web/src/app/ask/page.tsx`, `web/src/components/AskLanding.tsx`, `web/src/lib/ask-turn.ts` remain the production Ask surface; no mobile Ask code touches these files.

## Risks or gaps
- **No P0-P3/S0-S3 tags** visible in `inbox/2026-08-10-ask-practice-roadmap.md`, `inbox/2026-08-10-halo-web-roadmap.md`, `HANDOFF.md`, or any `inbox/*.md`.
- **S0/S1 auto-queue logic absent** from `src/hooks/useSession.ts`, `src/stores/lesson-store.ts`, `src/engine/*`, and `inbox/` excerpts.
- **1-day approval workflow undefined** — no code or docs reference approval gates or queued S0/S1 items.
- **Phase doc visibility**: `docs/PHASE_1_75.md` must be inspected next to confirm checked-off steps and roadmap ID linkage.
- **Working tree** shows 51 modified files on `halo-ui-streamline` ahead of origin; risk of untracked-file anomalies noted in `HANDOFF.md`.

## Suggested next steps
1. Open `docs/PHASE_1_75.md` to extract roadmap ID, priority tags, and any checked Phase 1.75 steps.
2. Inspect `inbox/*.md` (latest voice-session artifacts) for any hidden priority or approval fields.
3. Review `src/hooks/useSession.ts` and `src/engine/fact-learning.ts` for TODO/FIXME comments that could map to S0/S1 items.
4. Check `supabase/migrations/` and `scripts/` for seed/migration comments referencing roadmap IDs or approval status.
5. If the above files lack tags, add a lightweight `PRIORITY.md` in `inbox/` that lists P0-P3/S0-S3 without altering any production code paths.
