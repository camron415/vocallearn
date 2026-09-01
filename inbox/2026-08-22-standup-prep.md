# Standup prep
**Date:** 2026-08-22T12:00:58.433Z · **Project:** vocallearn
**Analyst job:** aj-1787400039523-pf41s1

# Standup prep — Halo / VocalLearn
**Date:** 2026-08-22T12:00:58.433Z · **Manager:** Sloane

standup: active

## Since yesterday
- Cove web site shipped so early-access invites can go out.
- Recruiter-friendly README published and engineering notes archived.
- Hardcoded Supabase test credentials removed from dev script.

## Roadmap position
- On the Halo UI streamline track with Cove web as the live shipping surface.
- Next real outcome is committing the 35-file working tree so the live site is protected in git.

## Proposed today (P / S)
1. Approve commit of the 35-file working tree so the live Halo site is protected in git — P0
2. Confirm whether the next native build should target the Ask→Practice loop smoke-test or continue Halo H3 motion polish — P1
3. Schedule a 30-minute device test of the Ask→Practice loop once the fresh IPA is installed — P2

## Decisions for Camron
Should we commit the 35-file working tree now to protect the live site, or hold off?

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
 web/src/app/globals.css                | 1320 +++++++++++++++++++++++++++++---
 web/src/app/invite/[token]/page.tsx    |   19 +-
 web/src/app/layout.tsx                 |   10 +
 web/src/app/login/page.tsx             |    6 +-
 web/src/app/preview/page.tsx           |   33 +-
 web/src/components/AnswerBody.tsx      |   34 +-
 web/src/components/AskLanding.tsx      |  126 ++-
 web/src/components/BubbleField.tsx     |    3 +-
 web/src/components/ChatThread.tsx      |  183 +++--
 web/src/components/Glass.tsx           |   14 +-
 web/src/components/HaloHeader.tsx      |   77 +-
 web/src/components/HomeTour.tsx        |   83 --
 web/src/components/InviteSetup.tsx     |  214 +++---
 web/src/components/LoginForm.tsx       |   90 ++-
 web/src/components/ModeMenu.tsx        |   23 +-
 web/src/components/MotionProvider.tsx  |   95 ++-
 web/src/components/PreviewSwitcher.tsx |  237 +++++-
 web/src/components/SettingsMenu.tsx    |   16 +-
 web/src/components/WaterCapsule.tsx    |   61 +-
 web/src/components/WaterSurface.tsx    |   57 +-
 web/src/components/WelcomeGate.tsx     |   76 --
 web/src/components/WorkTrace.tsx       |   22 +-
 web/src/lib/ask-turn.ts                |   42 +-
 web/src/lib/compose-keys.ts            |   17 +-
 web/src/lib/grok-stream.ts             |    1 +
 web/src/lib/grok.ts                    |    9 +-
 web/src/lib/halo-stream.ts             |    4 +-
 web/src/lib/markdown-plain.ts          |   10 +
 web/src/lib/suggest-chips.ts           |  261 ++++---
 web/src/lib/supabase/middleware.ts     |    4 +-
 web/src/lib/track.ts                   |    2 +-
 web/src/lib/water-edge.ts              |  171 ++++-
 47 files changed, 2792 insertions(+), 755 deletions(-)

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
VocalLearn is on the Halo UI streamline track with the live Cove web site as the current shipping surface (HEAD b7b497b) while the native Ask→Practice loop (Phase 0–3) remains implemented in the working tree but untested on device.

## Key findings
- **Git activity**: HEAD at b7b497b (“Ship Cove web so early-access invites can go out”) after c0cc60e and 2d7acf9; 35 files changed, 857 insertions, 593 deletions, with heavy web/ and src/ work uncommitted on branch `halo-ui-streamline`.
- **Canonical docs**: `inbox/2026-08-20-standup-prep.md` and `inbox/2026-08-19-standup-prep.md` both list two explicit P-level decisions for Camron and state “Auto queue (S0/S1): None today”; `inbox/2026-08-18-halo-next-agenda.md` frames the Lab agenda as outcome statements (“Hybrid Ask routing”, “Soft Learn MVP”).
- **Priority implementation files**: `web/src/components/InviteSetup.tsx`, `web/src/lib/ask-turn.ts`, `web/src/lib/suggest-chips.ts`, `src/engine/fact-miner.ts`, `src/stores/ask-store.ts`, `app/(tabs)/ask.tsx`, and `app/ask/approvals.tsx` contain the new Ask + Halo code referenced in the outcome statements.
- **Phase status**: `docs/PHASE_1_75.md` is referenced but not loaded; `PHASE_1_5_CLOSEOUT.md` and `docs/VOICE_PHASE4.md` are listed in “Where summaries live” but not shown; `inbox/2026-08-10-ask-practice-roadmap.md` states Phase 0–3 implemented and awaiting device smoke-test.
- **Recent commits** confirm the web site is the current shipping surface; native Ask→Practice work remains in the working tree.

## Risks or gaps
- **Uncommitted August work**: All Halo UI and Ask scaffolding (35 files) sit in the working tree; a crash or revert would lose the live site.
- **Device smoke-test missing**: `inbox/2026-08-10-ask-practice-roadmap.md` explicitly states Phase 3 exit check (“same approved fact gets spoken quiz”) has not yet run on iPhone.
- **Supabase schema drift**: Phase 0 tables (`ask_conversations`, `ask_messages`, `proposed_facts`) are implemented in code but the migration status is unknown without inspecting `supabase/migrations/`.
- **No P0-P3/S0-S3 tags visible in older docs**: Neither `HANDOFF.md`, `README.md`, nor any inbox file contains priority or auto-queue labels outside the two newest standup-prep files.
- **Next file to inspect if uncertain**: `docs/PHASE_1_75.md` to confirm whether Phase 1.75 steps are checked off.

## Suggested next steps
1. **Camron voice decision (P0)**: Approve commit of the 35-file working tree so the live Halo site is protected in git.
2. **Camron voice decision (P1)**: Confirm whether the next native build should target the Ask→Practice loop (Phase 3 smoke-test) or continue Halo H3 motion polish.
3. **Planning session item (P2)**: Schedule a 30-minute device test of the Ask→Practice loop once the fresh IPA is installed; capture `bug_reports`/`session_logs`/`session_interactions` if the freeze reproduces.
4. **Planning session item (P3)**: Inspect `supabase/migrations/` for Ask schema drift and confirm `supabase/migrations/011_halo_suggest_chips.sql` is applied.
5. **Planning session item (P4)**: Open `docs/PHASE_1_75.md` to verify Phase 1.75 steps are checked off before declaring Phase 1.75 active.
