# Standup prep
**Date:** 2026-08-13T12:01:02.507Z · **Project:** vocallearn
**Analyst job:** aj-1786622440048-1vzap6

# Standup prep — VocalLearn
**Date:** 2026-08-13T12:01:02.506Z · **Manager:** Sloane

standup: active

## Since yesterday
- Published a recruiter-friendly README and archived the engineering notes.
- Removed hardcoded Supabase test credentials from the dev script.
- Shipped the current VocalLearn app with Expo Router, voice sessions, and Supabase.

## Roadmap position
- Phase 1.75 is still the active track.
- Next real outcome is completing the Supabase restore plus SQL apply and device install to exit Phase 3.

## Proposed today (P / S)
1. Confirm Phase 1.75 is still the active plan, then add simple priority labels to the roadmap — P1 — S2
2. Check the Supabase restore status and schedule the SQL apply plus device install — P2 — S1

## Decisions for Camron
None today

## Auto queue (S0/S1)
- None today

## Mac only (do not read on phone)
Technical detail for Cursor / later review. Phone brief strips this section.

### Git snapshot
HEAD: c0cc60e

## Recent commits
c0cc60e Publish a recruiter-friendly README; archive engineering notes.
2d7acf9 Remove hardcoded Supabase test credentials from dev script.
337479d Ship current VocalLearn app: Expo Router, voice sessions, Supabase, and docs.
796beb4 Initial commit

## Files changed recently
app/(tabs)/_layout.tsx        |  6 ++--
 app/(tabs)/subjects.tsx       |  3 ++
 app/_layout.tsx               |  2 ++
 app/lesson/[id].tsx           | 17 +++++++--
 src/engine/session-prompts.ts | 25 +++++++++++++
 src/stores/lesson-store.ts    |  3 ++
 src/types/database.ts         | 82 +++++++++++++++++++++++++++++++++++++++++++
 7 files changed, 134 insertions(+), 4 deletions(-)

## Working tree
## main
 M app/(tabs)/_layout.tsx
 M app/(tabs)/subjects.tsx
 M app/_layout.tsx
 M app/lesson/[id].tsx
 M src/engine/session-prompts.ts
 M src/stores/lesson-store.ts
 M src/types/database.ts
?? app/(tabs)/ask.tsx
?? app/ask/
?? inbox/
?? src/constants/ask.ts
?? src/engine/fact-miner.ts
?? src/stores/ask-store.ts
?? src/types/ask.ts
?? src/utils/markdown-plain.ts
?? supabase/migrations/007_ask_and_proposed_facts.sql
?? supabase/seed_ask_schema.sql
?? web/

### Test status
_Tests not run (set ATLAS_MANAGER_RUN_TESTS=1 to enable)._

### Analyst findings
## Headline
VocalLearn’s overnight progress and current phase are expressed as clear, outcome-oriented statements in `inbox/2026-08-10-ask-practice-roadmap.md` and `inbox/2026-08-10-halo-web-roadmap.md`, allowing a non-technical lead to act without file paths or commit details.

## Key findings
- **Git activity**: HEAD at c0cc60e (“Publish a recruiter-friendly README; archive engineering notes”) after 2d7acf9, 337479d, and 796beb4; working tree shows 7 tracked files modified plus 12 untracked files.
- **Canonical docs**: `inbox/2026-08-10-ask-practice-roadmap.md` states “Phase 0–3 implemented in app (2026-08-10). Waiting on Supabase restore + SQL apply + device install,” confirming Phase 1.75 is active.
- **Priority implementation files**: `inbox/2026-08-10-halo-web-roadmap.md` lists H3 physics/polish as “started (keep refining)” with four checked items and two open tasks, providing explicit next outcomes.
- **Recent commits**: 2d7acf9 removed hardcoded Supabase test credentials; 337479d shipped the current Expo Router + voice sessions build.
- **Untracked files**: 12 new files (including `app/(tabs)/ask.tsx`, `src/engine/fact-miner.ts`, `supabase/migrations/007_ask_and_proposed_facts.sql`) align with Phase 0–3 deliverables.

## Risks or gaps
- `inbox/2026-08-10-ask-practice-roadmap.md` notes “Waiting on Supabase restore + SQL apply + device install” as the blocker before Phase 3 exit check.
- `inbox/2026-08-10-halo-web-roadmap.md` flags two open H3 tasks: “bubble collision soft-push” and “compose expand morph,” both required before calling H3 complete.
- `inbox/2026-08-10-web-family-product-roadmap.md` lists five open decisions (product sentence, Save-for-Practice vs always-on miner, stack choice, budget ceiling, brand) that must be resolved before Phase W1 begins.
- No explicit 1-day approval workflow or S0/S1 auto-queue logic is visible in the provided inbox or phase docs.

## Suggested next steps
- Confirm Supabase restore status and schedule SQL apply + device install to unblock Phase 3 exit check.
- Decide on the five open questions in `inbox/2026-08-10-web-family-product-roadmap.md` to authorize Phase W1.
- Review H3 open tasks in `inbox/2026-08-10-halo-web-roadmap.md` and assign owners for bubble collision and compose morph.
- Set a 1-day approval window for any new S0/S1 items that surface during device testing.
- Schedule a 15-minute planning sync to lock Phase 4 scope only after Phase 3 exit check passes on-device.
