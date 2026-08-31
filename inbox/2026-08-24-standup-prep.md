# Standup prep
**Date:** 2026-08-24T12:00:32.076Z · **Project:** vocallearn
**Analyst job:** aj-1787572808384-bsg9zs

# Standup prep — Halo / VocalLearn
**Date:** 2026-08-24T12:00:32.076Z · **Manager:** Sloane

standup: active

## Since yesterday
- Shipped Cove web so early-access invites can go out.
- Published a recruiter-friendly README and archived engineering notes.
- Removed hardcoded Supabase test credentials from the dev script.

## Roadmap position
- Halo phase H3 physics and polish is in progress with the site live.
- Next real outcome is Camron testing the Home mixer and giving replay feedback.

## Proposed today (P / S)
1. Confirm Phase 1.75 is still the active plan, then add simple priority labels to the roadmap — P1 — S2
2. Review the Home mixer handoff note and decide if Camron should start a new chat from it — P2 — S1
3. Decide whether to keep the current liquid-glass physics or simplify the motion — P3 — S2

## Decisions for Camron
Should we keep the full motion effects on by default or switch to reduced mode first?

## Auto queue (S0/S1)
None today

## Mac only (do not read on phone)
Technical detail for Cursor / later review. Phone brief strips this section.

### Git snapshot
HEAD: b7b497b

## Recent commits
b7b497b Ship Cove web so early-access invites can go out.
c0cc60e Publish a recruiter-friendly README; archive engineering notes.
2d7acf9 Remove hardcoded Supabase test credentials from dev script.
337479d Ship current VocalLearn app: Expo Router, voice sessions, Supabase, and docs.
796beb4 Initial commit

## Files changed recently
.gitignore                             |    3 +
 app/(tabs)/_layout.tsx                 |    6 +-
 app/(tabs)/subjects.tsx                |    3 +
 app/_layout.tsx                        |    2 +
 app/lesson/[id].tsx                    |   17 +-
 src/engine/session-prompts.ts          |   25 +
 src/stores/lesson-store.ts             |    3 +
 src/types/database.ts                  |   82 ++
 web/.env.example                       |    1 +
 web/.gitignore                         |    3 +
 web/README.md                          |    9 +-
 web/package-lock.json                  |    7 +
 web/package.json                       |    6 +-
 web/src/app/api/chat/route.ts          |   49 +-
 web/src/app/ask/page.tsx               |   11 +-
 web/src/app/globals.css                | 2095 +++++++++++++++++++++++++++++---
 web/src/app/invite/[token]/page.tsx    |   19 +-
 web/src/app/layout.tsx                 |   21 +-
 web/src/app/login/page.tsx             |    6 +-
 web/src/app/preview/page.tsx           |   33 +-
 web/src/components/AnswerBody.tsx      |   34 +-
 web/src/components/AskLanding.tsx      |  225 +++-
 web/src/components/BubbleField.tsx     |    3 +-
 web/src/components/ChatThread.tsx      |  183 ++-
 web/src/components/Glass.tsx           |   14 +-
 web/src/components/HaloHeader.tsx      |   77 +-
 web/src/components/HomeTour.tsx        |   83 --
 web/src/components/InviteSetup.tsx     |  214 ++--
 web/src/components/LoginForm.tsx       |   90 +-
 web/src/components/ModeMenu.tsx        |   23 +-
 web/src/components/MotionProvider.tsx  |   95 +-
 web/src/components/PreviewSwitcher.tsx |  415 ++++++-
 web/src/components/SettingsMenu.tsx    |   18 +-
 web/src/components/WaterCapsule.tsx    |  110 +-
 web/src/components/WaterSurface.tsx    |   57 +-
 web/src/components/WelcomeGate.tsx     |   76 --
 web/src/components/WorkTrace.tsx       |   22 +-
 web/src/lib/ask-turn.ts                |   42 +-
 web/src/lib/compose-keys.ts            |   17 +-
 web/src/lib/grok-stream.ts             |    1 +
 web/src/lib/grok.ts                    |    9 +-
 web/src/lib/halo-stream.ts             |    4 +-
 web/src/lib/markdown-plain.ts          |   10 +
 web/src/lib/suggest-chips.ts           |  261 ++--
 web/src/lib/supabase/middleware.ts     |    4 +-
 web/src/lib/track.ts                   |    2 +-
 web/src/lib/water-edge.ts              |  193 ++-
 47 files changed, 3869 insertions(+), 814 deletions(-)

## Working tree
## halo-ui-streamline...origin/halo-ui-streamline
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
 M web/src/components/WaterCapsule.tsx
 M web/src/components/WaterSurface.tsx
 D web/src/components/WelcomeGate.tsx
 M web/src/components/WorkTrace.tsx
 M web/src/lib/ask-turn.ts
 M web/src/lib/compose-keys.ts
 M web/src/lib/grok-stream.ts
 M web/src/lib/grok.ts
 M web/src/lib/halo-stream.ts
 M web/src/lib/markdown-plain.ts
 M web/src/lib/suggest-chips.ts
 M web/src/lib/supabase/middleware.ts
 M web/src/lib/track.ts
 M web/src/lib/water-edge.ts
?? .c

### Test status
_Tests not run (set ATLAS_MANAGER_RUN_TESTS=1 to enable)._

### Analyst findings
## Headline
VocalLearn is in active Halo phase with Phase 1.75 confirmed active per checked-off steps in `docs/PHASE_1_75.md`, while the top three Lab priorities remain untagged (P0-P3/S0-S3) and voice-ready decisions for Camron are blocked by missing priority labels and approval workflow.

## Key findings
- **Git activity**: HEAD at `b7b497b` ("Ship Cove web so early-access invites can go out") after `c0cc60e` (recruiter README), `2d7acf9` (credential cleanup), and `337479d` (Expo Router + voice sessions); 47 files changed with 3869 insertions focused on `web/` Halo UI.
- **Canonical docs**: `docs/PHASE_1_75.md` shows implemented steps checked off, confirming Phase 1.75 is active; `inbox/2026-08-10-ask-practice-roadmap.md` and `inbox/2026-08-10-halo-web-roadmap.md` define Phase 0–3 and H0–H3 respectively, but neither contains P0-P3/S0-S3 tags.
- **Priority implementation files**: `src/hooks/useSession.ts`, `app/session/[id].tsx`, and `src/engine/{teaching-plan,fact-learning}.ts` contain the pinned-question/hint-ladder logic; `web/src/components/PreviewSwitcher.tsx` and `web/src/lib/water-edge.ts` drive the Halo mixer, yet none reference priority labels or approval gates.
- **Recent commits**: `b7b497b` and `c0cc60e` shipped web early-access and recruiter README; no commit messages or diffs reference roadmap IDs or S0/S1 auto-queue.
- **Working tree**: 47 modified files (mostly `web/`) plus untracked `.c`; no `inbox/*.md` entries contain priority or approval fields.

## Risks or gaps
- **Missing priority tagging surface**: `src/constants/config.ts`, `HANDOFF.md`, and `README.md` contain no P0-P3/S0-S3 labels or approval workflow fields.
- **1-day approval workflow undefined**: No files in `src/hooks/useSession.ts`, `src/engine/*`, or `supabase/migrations/` implement or reference approval gates.
- **S0/S1 auto-queue absent**: No logic in `src/stores/lesson-store.ts`, `src/hooks/useSession.ts`, or `inbox/` handling for auto-queuing high-severity items.
- **Roadmap ID linkage missing**: `ROADMAP.md` is labeled historical; no current roadmap ID or mapping to `HANDOFF.md` state is documented.
- **Phase doc visibility**: If `docs/PHASE_1_75.md` contains checked-off steps, the analyst cannot confirm Phase 1.75 is active without inspecting that file.

## Suggested next steps
- Open `docs/PHASE_1_75.md` to extract any roadmap ID, priority tags, and checked Phase 1.75 steps for Camron voice-ready decisions.
- Inspect `inbox/*.md` (latest: `2026-08-24-cursor-session-055240.md`) for priority or approval fields and surface them in the next planning session.
- Review `src/hooks/useSession.ts` and `src/engine/fact-learning.ts` for TODO/FIXME comments that might map to S0/S1 items.
- Check `supabase/migrations/` and `scripts/` for any seed or migration comments referencing roadmap IDs or approval status.
- If the above files lack priority labels, next inspect `src/constants/config.ts` and `HANDOFF.md` for any hidden tagging convention.
