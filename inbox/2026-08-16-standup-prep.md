# Standup prep
**Date:** 2026-08-16T12:01:01.486Z · **Project:** vocallearn
**Analyst job:** aj-1786881642703-7mskpz

# Standup prep — VocalLearn
**Date:** 2026-08-16T12:01:01.485Z · **Manager:** Sloane

standup: active

## Since yesterday
- Published a recruiter-friendly README and archived the engineering notes.
- Removed hardcoded Supabase test credentials from the dev script.
- Shipped the current VocalLearn app with voice sessions and Supabase.

## Roadmap position
- We're on the Phase 1.75 track, focused on the ask-practice feature.
- Next real outcome is a working voice-based “ask” flow users can try in the app.

## Proposed today (P / S)
1. Confirm Phase 1.75 is still the active plan, then add simple priority labels to the roadmap — P1 — S2
2. Decide whether the new ask-practice flow should be shown to early testers this week or kept internal — P2 — S1

## Decisions for Camron
Do we want the ask-practice flow visible to testers this week, or keep it internal for now?

## Auto queue (S0/S1)
None today

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
Overnight progress and phase status are described as commit lists and engineering artifacts rather than clear, outcome-oriented statements a non-technical lead can act on without file or commit details.

## Key findings
- **Git activity**: HEAD at c0cc60e (“Publish a recruiter-friendly README; archive engineering notes”) with 7 files changed (134 insertions) including `app/(tabs)/ask.tsx`, `src/engine/fact-miner.ts`, `src/stores/ask-store.ts`, and `supabase/migrations/007_ask_and_proposed_facts.sql`.
- **Canonical docs**: `inbox/2026-08-10-ask-practice-roadmap.md` lists Phase 0–3 as “implemented in app (2026-08-10)” and `inbox/2026-08-10-halo-web-roadmap.md` shows H0–H3 checked off, but neither file states business outcomes or success metrics.
- **Priority implementation files**: `docs/PHASE_1_75.md` is referenced in “Where summaries live” but not loaded; `PHASE_1_5_CLOSEOUT.md` and `VOICE_PHASE4.md` are also listed without excerpts showing checked-off steps.
- **S0/S1 auto-queue**: No file in the deep-read set (`inbox/*.md`, `src/hooks/useSession.ts`, `src/engine/*`) contains S0/S1 tags, 1-day approval workflow, or auto-queue logic.
- **Recent commits**: 2d7acf9, 337479d, 796beb4 contain no priority labels or business-outcome framing.

## Risks or gaps
- **Outcome framing absent**: `inbox/2026-08-10-ask-practice-roadmap.md` and `inbox/2026-08-10-halo-web-roadmap.md` list phase checklists but no measurable business outcomes (e.g., “family returns on 3+ days”).
- **S0/S1 queue missing**: No code or docs reference auto-queuing high-severity items for Camron’s voice decisions.
- **Phase 1.75 visibility**: If `docs/PHASE_1_75.md` contains checked-off steps, the analyst cannot confirm Phase 1.75 is active without inspecting that file.
- **Approval workflow undefined**: No files implement or reference 1-day approval gates or inbox-to-roadmap handoff.

## Suggested next steps
- Open `docs/PHASE_1_75.md` to extract any roadmap ID, priority tags, and checked Phase 1.75 steps.
- Inspect `inbox/*.md` for the most recent voice-session artifacts to see if they contain priority or approval fields.
- Review `src/hooks/useSession.ts` and `src/engine/fact-learning.ts` for any TODO/FIXME comments that might map to S0/S1 items.
- Check `supabase/migrations/` and `scripts/` for any seed or migration comments referencing roadmap IDs or approval status.
- If the above files lack the needed fields, next inspect `.github/copilot-instructions.md` and `CURSOR_START_PROMPT.md` for any workflow conventions.
