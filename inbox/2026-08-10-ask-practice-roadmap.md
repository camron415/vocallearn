# VocalLearn Ask → Practice Roadmap

**Status:** Phase 0–3 implemented in app (2026-08-10). Waiting on Supabase restore + SQL apply + device install.  
**Date:** 2026-08-10  
**Goal:** Prove one loop: Ask a question → system proposes a fact → you approve → Practice quizzes you on it.

Related notes:

- `inbox/2026-08-08-atlas-vocallearn-integration-brief.md`
- `inbox/2026-08-10-ask-practice-design-decisions.md`

---

## Locked decisions


| Decision             | Choice                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| Product              | VocalLearn = **Ask** + **Practice** (existing engine)                                                       |
| Ask backend          | xAI **Chat Completions** (Grok), not phone Agent API                                                        |
| Phone Call button    | Later / optional `tel:` deep link — not required for Phase 1                                                |
| Context in Ask       | **Light** (name, short learning goal)                                                                       |
| Fact mining          | **Always-on** after Ask conversations                                                                       |
| Dedup                | Against existing Supabase facts **before** approval                                                         |
| Approval             | Dedicated UI (tab/section) — yes/no                                                                         |
| Branding             | **Ask** (do not brand as Atlas in-app)                                                                      |
| Users                | Camron only for now                                                                                         |
| Success metric       | One end-to-end dummy: history fact → approve → get quizzed                                                  |
| Out of scope for now | Standup tools, realtime in-app voice Ask, multi-user, deep privacy redaction, course entertainment redesign |


---

## Phase 0 — Foundations (schema + plumbing)

**Outcome:** Data model ready; no fancy UI required yet.

1. Supabase tables (or additive columns) for:
  - `ask_conversations` — id, user_id, title, created_at, updated_at
  - `ask_messages` — id, conversation_id, role (`user`/`assistant`), content, created_at
  - `proposed_facts` — id, user_id, source_conversation_id, source_message_ids, content, explanation, tags, confidence, status (`pending`/`approved`/`rejected`), dedup_of_fact_id nullable, created_at
2. Link approved proposals → existing `facts` (+ lesson or a dedicated “From Ask” lesson/subject)
3. Light Ask system prompt constants (persona: helpful tutor; light personal context only)
4. Env: confirm `EXPO_PUBLIC_GROK_`* works for Chat Completions from the app

**Exit check:** Can insert a fake conversation + proposed_fact row in Supabase and read them from the app.

---

## Phase 1 — Ask tab (text + history)

**Outcome:** Grok-app-like Ask that we own.

1. New bottom tab: **Ask**
2. Conversation list (create new, open existing, basic title from first message)
3. Chat screen: text input, send, scrolling transcript
4. Dictate → text via existing iOS dictation / speech recognition into the text field (send as normal text — **not** realtime voice chat)
5. Persist every turn to Supabase
6. Continue prior conversations from history

**Exit check:** You can start a chat, leave the app, reopen, and continue the same thread.

**Not in Phase 1:** Call button, Atlas tools, mastery injection, fancy streaming UI polish (streaming nice-to-have if cheap).

---

## Phase 2 — Always-on miner + dedup + approval

**Outcome:** Facts appear for your review without manual lesson authoring.

1. After assistant replies (or on conversation idle / end-of-turn batch), run a **cheap** extraction prompt:
  - Input: recent messages (+ optional light context)
  - Output: 0–N candidate facts (`content`, short `explanation`, tags, why_worth_learning)
  - Skip junk (recipes, one-off lookups, logistics, chit-chat)
2. Dedup:
  - Compare candidates to existing `facts` + pending `proposed_facts` (embedding or LLM-similarity + simple text match)
  - Drop or mark duplicates before they hit the queue
3. Write survivors to `proposed_facts` with `status = pending`
4. **Approval UI** (new tab or Learn sub-section):
  - List pending cards
  - Approve → create real `fact` in a “From Ask” lesson/subject, attach to Practice pipeline
  - Reject → status rejected (keep for debugging)
5. Optional later: “Remember this” manual boost — **not required** for Phase 2

**Exit check:** Ask “What year did the Berlin Wall fall?” (or similar) → see a pending fact → Approve → fact exists in DB for Practice.

---

## Phase 3 — Practice the approved fact

**Outcome:** Close the loop with the **existing** session engine.

1. Ensure approved Ask facts land in a lesson/queue Practice can load (dedicated subject e.g. “From Ask” or “My Facts”)
2. Start a normal session / review segment that includes that fact
3. Confirm teach → quiz → learning_profile / SM-2 behave as today
4. Smoke-test on device (fresh IPA if needed)

**Exit check:** Same approved fact gets spoken quiz in Practice; correct/incorrect updates progress.

**This is the first “it’s real” milestone.** Stop and celebrate before building more.

---

## Phase 4 — Polish the loop (only after Phase 3 works)

Pick based on pain, not ambition:

1. Better conversation titles / search in Ask history
2. Miner quality tweaks (fewer false positives)
3. Approval batch actions (approve all high-confidence)
4. Badge count of pending facts on Approval / Learn tab
5. Call button (`tel:`) + later phone-transcript intake into the **same** miner
6. Light mastery hint back into Ask (“you’re still weak on X”) — **thin**, not full Atlas sync
7. Notifications: “3 facts waiting” / “due reviews”

---

## Phase 5 — Later (explicitly deferred)

- Multi-user / freemium  
- Strong local PII redaction / privacy marketing  
- Browser capture of Google / other LLMs  
- In-app realtime voice Ask  
- Standup / project orchestration inside VocalLearn  
- Full bidirectional Atlas knowledge graph  
- Paid Apple Developer + TestFlight distribution  
- Entertaining redesign of Career Prep / Junior Interview courses

---

## Suggested build order (when you say go)

```text
Phase 0  →  Phase 1  →  Phase 2  →  Phase 3  →  pause & test on phone  →  Phase 4 as needed
```

Do **not** start Phase 4 until Phase 3 exit check passes on your iPhone.

---

## Engineering touchpoints (for implementers)


| Area               | Likely files / places                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| Tabs / Ask UI      | `app/(tabs)/`, new `ask` routes                                         |
| Grok chat          | `src/lib/grok.ts` (extend or sibling client for multi-turn Ask)         |
| Stores             | new `ask-store` or similar; reuse `lesson-store` for approved facts     |
| Session / Practice | existing `useSession.ts` — prefer reuse over rewrite                    |
| Schema             | `supabase/migrations/00x_ask_and_proposed_facts.sql`                    |
| Miner              | `src/engine/fact-miner.ts` (or `src/lib/`) + prompt in `src/constants/` |


---

## Risks to watch

1. **Miner noise** — approval queue is the safety net; tune prompts after you feel the spam level
2. **Where facts live** — a dedicated “From Ask” subject keeps Practice simple; don’t overthink modules yet
3. **Cost** — Chat Completions + occasional cheap miner calls should stay low vs realtime; log token use early
4. **Dedup false merges** — prefer missing a dedup over silently dropping a distinct fact
5. **Scope creep mid-Phase-1** — no Call button, no Atlas tools, no mastery sync until Phase 3 works

---

## Review checklist for Camron

- [x] Phase order feels right  
- [x] “From Ask” subject/lesson approach is OK for approved facts  
- [x] Dictate-to-text in Phase 1 is enough (no realtime)  
- [x] Approval as its own tab/section is OK  
- [x] Anything missing before Phase 0 starts?

**Reply with approve / tweak notes.** After approval, implementation starts at Phase 0 only.