# Standup prep
**Date:** 2026-08-14T12:01:07.566Z · **Project:** vocallearn
**Analyst job:** aj-1786708847720-yacogd

# Standup prep — VocalLearn
**Date:** 2026-08-14T12:01:07.565Z · **Manager:** Sloane

standup: active

## Since yesterday
- Published a recruiter-friendly README and archived the engineering notes.
- Removed hardcoded Supabase test credentials from the dev script.
- Added the Ask tab and supporting stores, engine, and database types.

## Roadmap position
- We are still in the Ask → Practice phase.
- Next real outcome is confirming an approved fact from chat appears in a spoken quiz.

## Proposed today (P / S)
1. Confirm Phase 1.75 is still the active plan, then add simple priority labels to the roadmap — P1 — S2
2. Run a quick device smoke-test: start a chat, approve one fact, then open Practice and see if the fact shows up for spoken review — P2 — S1

## Decisions for Camron
Should we schedule a 15-minute smoke-test on device today, or wait until the Ask approval flow is fully wired?

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
VocalLearn’s overnight summary and phase docs describe Ask→Practice as observable user outcomes (chat → propose → approve → quiz) rather than file-level artifacts, but the current git state shows only partial Ask scaffolding and no Phase 3 exit evidence.

## Key findings
- **Git activity**: HEAD c0cc60e (“Publish a recruiter-friendly README”) plus 7 files changed (134 insertions) including `app/(tabs)/ask.tsx`, `src/engine/fact-miner.ts`, `src/stores/ask-store.ts`, and `supabase/migrations/007_ask_and_proposed_facts.sql`; no commits reference Phase 3 exit checks.
- **Canonical docs**: `inbox/2026-08-10-ask-practice-roadmap.md` states “Phase 0–3 implemented in app (2026-08-10)” and lists explicit exit criteria (e.g., “Same approved fact gets spoken quiz in Practice”); `PHASE_1_75.md` is referenced but not excerpted, so Phase 1.75 status cannot be asserted.
- **Priority implementation files**: `app/ask/approvals.tsx` and `app/(tabs)/ask.tsx` exist in working tree, but no evidence of `proposed_facts.status = 'approved'` → `facts` insertion or SM-2 scheduling in `src/stores/lesson-store.ts`.
- **Observable outcomes**: Roadmap defines measurable checkpoints (e.g., “You can start a chat, leave the app, reopen, and continue the same thread”); current commits do not include test logs or device screenshots confirming these.
- **Recent commits**: 2d7acf9 removed Supabase credentials; 337479d shipped the prior build; neither mentions Ask→Practice loop completion.

## Risks or gaps
- **Phase 3 exit unverified**: No `bug_reports`, `session_logs`, or `session_interactions` entries confirm an approved fact reached spoken quiz on-device.
- **Schema vs code drift**: Migration `007_ask_and_proposed_facts.sql` is untracked; `src/types/database.ts` delta (+82 lines) may not yet include `proposed_facts` columns.
- **Approval UI incomplete**: `app/ask/approvals.tsx` is listed but no code excerpts show yes/no handlers writing to `facts` or linking to a “From Ask” lesson.
- **Miner integration missing**: `src/engine/fact-miner.ts` exists, yet no prompt constants or dedup logic against existing `facts` are visible in the provided excerpts.
- **Next file to inspect if uncertain**: `docs/PHASE_1_75.md` for checked-off steps and `supabase/migrations/007_ask_and_proposed_facts.sql` for column definitions.

## Suggested next steps
1. Open `docs/PHASE_1_75.md` and confirm any checked Phase 1.75 steps before declaring Phase 1.75 active.
2. Pull the latest `session_logs` and `session_interactions` for the most recent Ask conversation to verify Phase 3 exit criteria.
3. Review `src/engine/fact-miner.ts` and `src/constants/ask.ts` to confirm dedup logic runs against existing `facts` before writing `proposed_facts`.
4. Inspect `app/ask/approvals.tsx` for the approve handler that inserts into `facts` and triggers SM-2 scheduling.
5. Schedule a 15-minute device smoke-test focused solely on the observable loop: Ask → pending fact → approve → spoken quiz.
