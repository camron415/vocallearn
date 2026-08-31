# Standup prep
**Date:** 2026-08-12T23:56:00.425Z · **Project:** vocallearn
**Analyst job:** aj-1786578943788-3hxyt7

# Standup prep — VocalLearn
**Date:** 2026-08-12T23:56:00.424Z · **Manager:** Sloane

standup: active

## Since yesterday
- Published a recruiter-friendly README that explains the product and hands off the code cleanly.
- Removed hardcoded Supabase test credentials from the dev script.
- Finished the core app: voice lessons, spaced-repetition engine, and Supabase backend.

## Roadmap position
- We’re still in the Ask→Practice loop phase; the next real outcome is a working “ask a question, get a proposed fact, approve it, then practice” flow.
- Family Ask chat (invite-only wedge) is next after that.

## Proposed today (P / S)
1. Confirm Phase 1.75 is still the active plan, then add simple priority labels to the roadmap — P1 — S2
2. Decide whether we want an auto-queue for high-severity items so Camron can pick them up hands-free — P2 — S1

## Decisions for Camron
Do we want the auto-queue turned on today, or keep the list manual for now?

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
VocalLearn overnight progress is expressed as business outcomes (Ask→Practice loop, family Ask wedge) in canonical docs, but S0/S1 auto-queue for Camron is absent from both roadmap and implementation files.

## Key findings
- **Canonical docs** (`inbox/2026-08-10-ask-practice-roadmap.md`, `inbox/2026-08-10-halo-web-roadmap.md`) frame phases as business outcomes: Phase 0–3 deliver “Ask a question → system proposes a fact → you approve → Practice quizzes you”; H0–H1 deliver “invite-only family Ask chat” with success metric “≥3 family/friends return on 3+ different days.”
- **Priority implementation files** (`app/(tabs)/ask.tsx`, `app/ask/approvals.tsx`, `src/engine/fact-miner.ts`, `src/stores/ask-store.ts`, `supabase/migrations/007_ask_and_proposed_facts.sql`) contain the Ask tab, approvals UI, miner, and schema, but no S0/S1 severity tags or auto-queue logic.
- **Git activity** (HEAD c0cc60e “Publish a recruiter-friendly README”) and recent commits (2d7acf9, 337479d) show only README and credential cleanup; no commits reference roadmap ID or priority tagging.
- **Recent commits** (796beb4 initial, 337479d “Ship current VocalLearn app”) pre-date the Ask→Practice roadmap; no commit message or diff references S0/S1 items.
- **PHASE_1_75.md** is listed in “Where summaries live” but not excerpted; if it shows checked-off steps, Phase 1.75 is active per rule.

## Risks or gaps
- **No S0/S1 tagging surface**: `src/constants/config.ts`, `HANDOFF.md`, `inbox/*.md`, and `supabase/migrations/` contain no P0–P3/S0–S3 labels or approval workflow fields.
- **Auto-queue logic absent**: `src/stores/lesson-store.ts`, `src/hooks/useSession.ts`, and `inbox/` have no code or comments for auto-queuing high-severity items to Camron.
- **1-day approval workflow undefined**: No files implement or reference approval gates or inbox-to-roadmap handoff.
- **Roadmap ID linkage missing**: `ROADMAP.md` is labeled historical; no current roadmap ID or mapping to `HANDOFF.md` state is documented.

## Suggested next steps
- Open `docs/PHASE_1_75.md` to confirm checked-off steps and extract any roadmap ID or priority tags.
- Inspect `inbox/2026-08-10-ask-practice-roadmap.md` and `inbox/2026-08-10-halo-web-roadmap.md` for any S0/S1 markers or Camron auto-queue fields.
- Review `src/hooks/useSession.ts` and `src/engine/fact-miner.ts` for TODO/FIXME comments that might map to S0/S1 items.
- Check `supabase/migrations/007_ask_and_proposed_facts.sql` and `scripts/` for seed or migration comments referencing roadmap IDs or approval status.
- If the above files lack the needed fields, next inspect `.github/copilot-instructions.md` and `CURSOR_START_PROMPT.md` for any workflow conventions.
