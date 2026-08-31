# Standup prep
**Date:** 2026-08-17T12:01:11.512Z · **Project:** vocallearn
**Analyst job:** aj-1786968045920-p24n3w

# Standup prep — VocalLearn
**Date:** 2026-08-17T12:01:11.511Z · **Manager:** Sloane

standup: active

## Since yesterday
- Published a recruiter-friendly README and archived engineering notes.
- Cleaned up hardcoded Supabase test credentials from the dev script.
- Shipped the current VocalLearn app with voice sessions and Supabase.

## Roadmap position
- Phase 1.75 is active; the Ask→Practice loop (schema, Ask tab, fact miner, and approve flow) is the current focus.
- Next real outcome is to confirm the Ask→Practice loop works end-to-end so users can propose facts and move them into practice.

## Proposed today (P / S)
1. Confirm Phase 1.75 is still the active plan, then add simple priority labels to the roadmap — P1 — S2
2. Walk through the new Ask tab once to verify the flow feels right for voice use — P2 — S1
3. Decide whether the Ask feature should stay behind a feature flag for the next test build — P3 — S2

## Decisions for Camron
Should we keep the Ask feature behind a feature flag for the next test build, or turn it on for everyone?

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
Phase 1.75 is active; Ask→Practice loop (schema + Ask tab + miner + approve → Practice) is the current focus, with 7 files changed in HEAD c0cc60e and untracked Ask feature files present.

## Key findings
- **Git activity**: HEAD c0cc60e (“Publish a recruiter-friendly README; archive engineering notes”) shows 7 files changed (134 insertions) including `app/(tabs)/ask.tsx`, `src/engine/fact-miner.ts`, `src/stores/ask-store.ts`, and `supabase/migrations/007_ask_and_proposed_facts.sql`.
- **Canonical docs**: `inbox/2026-08-10-ask-practice-roadmap.md` states “Phase 0–3 implemented in app (2026-08-10)”; `docs/PHASE_1_75.md` is referenced in “Where summaries live” but not loaded.
- **Priority implementation files**: `app/(tabs)/ask.tsx`, `src/engine/fact-miner.ts`, `src/stores/ask-store.ts`, `src/types/ask.ts`, `supabase/migrations/007_ask_and_proposed_facts.sql`, and `supabase/seed_ask_schema.sql` are untracked and implement the Ask→Practice flow.
- **Recent commits**: 2d7acf9 (credential cleanup), 337479d (voice sessions + Supabase), 796beb4 (initial) contain no P/S tags or outcome framing.
- **S0/S1 auto-queue**: No file in the deep-read set (`inbox/*.md`, `src/hooks/useSession.ts`, `src/engine/*`) contains S0/S1 tags or auto-queue logic.

## Risks or gaps
- **Outcome framing absent**: `inbox/2026-08-10-ask-practice-roadmap.md` and `inbox/2026-08-10-halo-web-roadmap.md` list phase checklists but no measurable business outcomes.
- **S0/S1 queue missing**: No code or docs reference auto-queuing high-severity items for Camron’s voice decisions.
- **Phase 1.75 visibility**: `docs/PHASE_1_75.md` is referenced but not loaded; cannot confirm checked-off steps without inspecting that file.
- **Approval workflow undefined**: No files implement or reference 1-day approval gates or inbox-to-roadmap handoff.

## Suggested next steps
- Open `docs/PHASE_1_75.md` to extract roadmap ID, priority tags, and checked Phase 1.75 steps.
- Inspect `inbox/*.md` for the most recent voice-session artifacts to see if they contain priority or approval fields.
- Review `src/hooks/useSession.ts` and `src/engine/fact-learning.ts` for any TODO/FIXME comments that might map to S0/S1 items.
- Check `supabase/migrations/` and `scripts/` for any seed or migration comments referencing roadmap IDs or approval status.
- If the above files lack the needed fields, next inspect `.github/copilot-instructions.md` and `CURSOR_START_PROMPT.md` for any workflow conventions.
