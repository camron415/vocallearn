# Intent harvest — 1.2 rules (planning)

**Status:** Planning only  
**Goal:** Harvest facts that answer **what the user asked**, not every stable sentence in a long reply.

---

## Two separate jobs (do not conflate)

| Job | Owner | Success |
| --- | --- | --- |
| **Answer accuracy** | Ask route + Grok/Luna + live feeds | Reply correctly answers the question (truthful, not sycophantic) |
| **Harvest selection** | Miner + policy + intent pass | Chips are the **direct answer** + **tight supporting facts** only |

Bad harvest on a good answer = miner problem.  
Bad answer = routing/prompt problem.  
Fix both in 1.2, but measure separately.

---

## Intent model (per turn)

For each turn, derive:

```
intent = {
  questionType: lookup | explain | compare | how-to | opinion-adjacent,
  primaryAsk: string,      // what must be answered (one line)
  acceptableSpans: string[], // phrases in ASSISTANT that count as "the answer"
  topicKey: string,        // fold for cluster (e.g. "gettysburg", "maine capital")
}
```

**Sources (cheap → rich):**
1. Regex for lookups (`capital of`, `population of`, `when did`, `who was`)
2. User text + assistant reply passed to miner **with intent block** (1.2)
3. Optional: small pre-pass on user text only before main ask (1.2 late)

---

## Harvest rules (priority order)

### Rule 1 — Primary fact (mandatory when closed)

If the user asked a **closed question** (capital, date, count, name, definition) and the assistant gave a closed answer:

- **Always** emit **≥1 card** whose `answer` is the direct response.
- `span` = shortest substring in ASSISTANT for that answer.
- `prompt` must restate the **user’s question**, not a tangent.

**Examples**

| User | Must harvest |
| --- | --- |
| Capital of Maine? | Augusta (where) |
| When was Gettysburg? | 1863 (when) |
| Population of Tokyo? | number (meaning) |

If miner returns `cards:[]` on a closed lookup → **regression** (fixture + telemetry alert).

### Rule 2 — Supporting cluster (optional, max 2)

Additional cards only if **all** true:

1. Same `topicKey` as primary (same battle, same city, same event).
2. Different `kind` when possible (when / where / who / meaning).
3. Sentence in ASSISTANT **supports understanding the primary answer**, not general trivia.
4. Passes closed-fact policy (V2 play sheet).

**Reject:** Nile miles when user asked “longest river name only.”  
**Accept:** Year + location when user asked “tell me about the Battle of Gettysburg.”

### Rule 3 — No tangent harvest

Do not chip facts that appear in ASSISTANT but **do not help answer USER**.

Scoring heuristic for miner prompt:

> “Would this fact appear on a flashcard titled with the user’s exact question? If only on ‘random things mentioned in this paragraph’, skip.”

### Rule 4 — Recipes / lists / ephemeral

- **Recipes & lists** → Saves (1.1.1), not harvest.
- Weather, news, stocks → skip (existing policy).

### Rule 5 — Depth / explain asks

User asked “why” or “explain”:

- Primary may be **open** in reply; V2 play still **closed-only**.
- Harvest **closed atoms** embedded in the explanation (year, name, place, number).
- At least one card should tie to the **headline of the explanation** (e.g. “photosynthesis converts light to sugar” → closed sub-facts: chloroplast, CO₂, etc.).

---

## Miner prompt changes (1.2)

Add to `MINER` system block:

```
INTENT (read first):
USER question: …
Primary thing they need: …

Harvest order:
1. One card that IS the direct answer to USER (required if closed).
2. Up to 2 more ONLY if same topic and helps remember the direct answer.
3. Never harvest facts USER did not need for their question.
4. span = shortest literal substring in ASSISTANT.
```

Pass `primaryAsk` from lightweight `resolveHarvestIntent(userText)` in code.

---

## Validation pipeline (after miner JSON)

1. Existing: `cardsFromMinerJson`, distractors, closed-only.
2. **New:** `cardMatchesIntent(card, intent)` — drop cards failing relevance.
3. **New:** if closed lookup and zero cards → retry miner once with stricter prompt OR deterministic fallback (capital regex).

---

## Testing (how we know it works)

### Golden fixtures (CI, no API)

Hand-built rows: `userText`, `reply`, `expectTokens[]`, `forbidTokens[]`.  
Grow from `halo_harvest_turns` export weekly.

### Live smoke (Grok)

Extend `harvest-smoke-cases.ts`:

- Gettysburg battle (primary date + place, forbid unrelated Civil War trivia).
- Capital + population same turn (2 cards, same cluster).
- “Longest river” (Nile name required; Amazon distractor in answer must not become third chip unless asked).

### Human QA (early access)

Camron + 2 testers: ask **real** questions they care about; label “would I want this chip?”  
Target: **≥80%** primary closed asks get correct primary chip by mid-1.2.

### Telemetry

```sql
SELECT user_text, cards, skipped, skip_reason
FROM halo_harvest_turns
WHERE NOT skipped AND card_count = 0
ORDER BY created_at DESC LIMIT 20;
```

Zero-card non-skips = intent failures.

---

## Luna interaction (1.2)

- **Lookup closed facts:** Luna OK if answer is in training data; else Grok + feed.
- **Harvest miner:** stays Grok 4.3 `effort: none` (cheap, separate call after reply).
- Intent pass does **not** depend on which model wrote the answer.

---

## Open decisions

1. Deterministic fallback for capitals when miner fails? (yes for 1.2)
2. Allow 1 open-fact chip in Keep for display-only (not play) — **no for 1.2**; closed play only.
3. Thread-level intent for follow-ups (learn-more) — store `topicKey` on conversation metadata in 1.2 or 1.3?
