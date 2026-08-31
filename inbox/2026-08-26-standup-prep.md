# Standup prep
**Date:** 2026-08-26T12:00:35.058Z · **Project:** vocallearn
**Analyst job:** aj-1787745616813-ar3iey

# Standup prep — Halo / VocalLearn
**Date:** 2026-08-26T12:00:35.058Z · **Manager:** Sloane

standup: active

## Since yesterday
- Shipped Cove web so early-access invites can go out.
- Published a recruiter-friendly README and archived engineering notes.
- Split Cove CSS into lab-only owned files to preserve the cascade.

## Roadmap position
- Halo phase is active on the web branch with H3 motion and physics polish in progress.
- Next real outcome is finishing the remaining H3 items: bubble collision soft-push and compose expand morph.

## Proposed today (P / S)
1. Confirm Phase 1.75 is still the active plan, then add simple priority labels to the roadmap — P1 — S2
2. Review the Halo pricing and scaling document so we can discuss tiers on the next call — P2 — S1
3. Run a quick visual check on the latest Paper look with dark theme and chips visible — P3 — S0

## Decisions for Camron
Do you want the priority labels added to the roadmap today, or should we wait until we review the pricing doc first?

## Auto queue (S0/S1)
- None today

## Mac only (do not read on phone)
Technical detail for Cursor / later review. Phone brief strips this section.

### Git snapshot
HEAD: 68308de

## Recent commits
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
 src/engine/session-prompts.ts          |  25 ++
 src/stores/lesson-store.ts             |   3 +
 src/types/database.ts                  |  82 ++++++
 web/.env.example                       |   1 +
 web/.gitignore                         |   3 +
 web/README.md                          |   9 +-
 web/package-lock.json                  |   7 +
 web/package.json                       |   6 +-
 web/src/app/api/chat/route.ts          |  49 +++-
 web/src/app/ask/page.tsx               |  11 +-
 web/src/app/globals.css                |   4 +-
 web/src/app/invite/[token]/page.tsx    |  19 +-
 web/src/app/layout.tsx                 |  23 +-
 web/src/app/login/page.tsx             |   6 +-
 web/src/app/preview/page.tsx           |  33 ++-
 web/src/app/styles/home.css            | 363 ++++++++++++++++++++-----
 web/src/app/styles/motion.css          |  16 +-
 web/src/app/styles/skins-paper.css     | 448 +++++++++++++++++++++++++-----
 web/src/components/AnswerBody.tsx      |  34 ++-
 web/src/components/AskLanding.tsx      | 205 +++++++++++---
 web/src/components/BubbleField.tsx     |   3 +-
 web/src/components/ChatThread.tsx      | 219 +++++++++++----
 web/src/components/Glass.tsx           |  14 +-
 web/src/components/HaloHeader.tsx      |  87 +++++-
 web/src/components/HomeTour.tsx        |  83 ------
 web/src/components/InviteSetup.tsx     | 214 ++++++++-------
 web/src/components/LoginForm.tsx       |  90 +++---
 web/src/components/ModeMenu.tsx        |  78 +-----
 web/src/components/MotionProvider.tsx  | 139 ++++++++--
 web/src/components/PreviewSwitcher.tsx | 481 ++++++++++++++++++++++++++++++++-
 web/src/components/SettingsMenu.tsx    |  76 ++++--
 web/src/components/SpringStage.tsx     |  98 +++++--
 web/src/components/WaterCapsule.tsx    | 131 ++++++++-
 web/src/components/WaterSurface.tsx    | 158 ++++++++++-
 web/src/components/WelcomeGate.tsx     |  76 ------
 web/src/components/WorkTrace.tsx       |  22 +-
 web/src/lib/ask-turn.ts                |  42 ++-
 web/src/lib/compose-keys.ts            |  17 +-
 web/src/lib/grok-stream.ts             |   1 +
 web/src/lib/grok.ts                    |   9 +-
 web/src/lib/halo-stream.ts             |   4 +-
 web/src/lib/markdown-plain.ts          |  10 +
 web/src/lib/suggest-chips.ts           | 261 +++++++++++-------
 web/src/lib/supabase/middleware.ts     |   5 +-
 web/src/lib/track.ts                   |   2 +-
 web/src/lib/water-edge.ts              | 328 +++++++++++++++++++---
 51 files changed, 3082 insertions(+), 944 deletions(-)

## Working tree
## halo-ui-streamline...origin/halo-ui-streamline [ahead 1]
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
 M web/README.md
 M web/package-lock.json
 M web/package.json
 M web/src/app/api/chat/route.ts
 M web/src/app/ask/page.tsx
 M web/src/app/globals.css
 M web/src/app/invite/[token]/page.tsx
 M web/src/app/layout.tsx
 M web/src/app/login/page.tsx
 M web/src/app/preview/page.tsx
 M web/src/app/styles/home.css
 M web/src/app/styles/motion.css
 M web/src/app/styles/skins-paper.css
 M web/src/components/AnswerBody.tsx
 M web/src/components/AskLanding.tsx
 M web/src/components/BubbleField.tsx
 M web/src/components/ChatThread.tsx
 M web/src/components/Glass.tsx
 M web/src/components/HaloHeader.tsx
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
 M web/src/lib/grok.ts
 M web/src/lib/halo-stream.ts
 M web/src/

### Test status
_Tests not run (set ATLAS_MANAGER_RUN_TESTS=1 to enable)._

### Analyst findings
## Headline
Halo phase is active on the web branch (HEAD 68308de) with H3 motion/polish in progress; mobile Ask→Practice remains in Phase 3 exit-check state.

## Key findings
- **Git activity**: 51 files changed (+3082/-944) in the last commit 68308de ("Lab-only split of Cove CSS into owned files; preserve cascade; do not promote") after b7b497b ("Ship Cove web so early-access invites can go out").
- **Canonical docs**: `inbox/2026-08-10-halo-web-roadmap.md` lists H3 as "Motion / physics polish ✅ started (keep refining)" with remaining items "bubble collision soft-push" and "compose expand morph".
- **Priority implementation files**: `web/src/components/PreviewSwitcher.tsx` (481 insertions), `web/src/components/WaterSurface.tsx` (158 insertions), `web/src/lib/water-edge.ts` (328 insertions) contain the current liquid-glass and droplet-morph logic.
- **Phase status**: `docs/PHASE_1_75.md` is referenced but not loaded; no checked-off steps visible, so Phase 1.75 status cannot be confirmed without inspecting that file.
- **Recent commits**: 337479d shipped the current Expo Router + voice sessions build; 2d7acf9 removed hardcoded Supabase credentials.

## Risks or gaps
- **No P0-P3/S0-S3 tags** visible in `inbox/2026-08-10-halo-web-roadmap.md`, `inbox/2026-08-10-ask-practice-roadmap.md`, or `HANDOFF.md`.
- **1-day approval workflow** and S0/S1 auto-queue logic absent from `src/hooks/useSession.ts`, `src/stores/lesson-store.ts`, and `inbox/*.md` excerpts.
- **Phase doc visibility**: `docs/PHASE_1_75.md` must be inspected next to confirm whether Phase 1.75 is active.
- **Working tree** shows 51 modified files on branch `halo-ui-streamline` ahead of origin; risk of untracked-file anomalies noted in `HANDOFF.md`.

## Suggested next steps
1. Open `docs/PHASE_1_75.md` to extract any roadmap ID, priority tags, and checked Phase 1.75 steps.
2. Review `inbox/2026-08-26-cursor-session-020751.md` and sibling inbox files for the most recent voice-session artifacts containing priority or approval fields.
3. Inspect `web/src/components/PreviewSwitcher.tsx` and `web/src/lib/water-edge.ts` for any TODO/FIXME comments that map to remaining H3 items.
4. Check `supabase/migrations/` and `web/src/app/api/chat/route.ts` for any seed or migration comments referencing roadmap IDs or approval status.
5. If the above files lack explicit tags, next file to inspect is `docs/VOICE_PHASE4.md` for any cross-project priority mapping.
