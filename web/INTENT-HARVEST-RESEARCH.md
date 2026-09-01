# Intent harvest — research report

**For:** Camron · Halo / Cove planning  
**Date:** 2026-08-31  
**Status:** Planning (not implementation)  
**Companion:** [`INTENT-HARVEST-1.2.md`](./INTENT-HARVEST-1.2.md) (rules), [`PRODUCT-DISCOVERY.md`](./PRODUCT-DISCOVERY.md) (Saves / Learn-more / Teach-me)

---

## Executive summary (plain English)

When someone asks a question, they usually want **one main answer** plus a **small set of supporting details** they’d actually remember tomorrow. Memory research says **less is more**: 3–5 well-chosen facts beat 10 random ones. Your product already encodes fact *types* as four colors (when / where / who / meaning). The job of **intent harvest** is not to copy the whole AI reply into chips — it is to answer:

1. **What was the question really about?**
2. **What is the direct answer?** (always harvest if it’s a closed fact)
3. **What 0–2 extra facts help you understand that answer?** (same topic only)
4. **What should we skip?** (tangents, recipes → Saves, weather → skip)

**Closed facts** (Augusta, 1863, 4,130 miles) fit your current play sheet. **Open facts** (full-sentence explanations) are harder to grade and should stay **out of review for now**, but the miner can still *identify* them for future use or for Teach-me lessons.

**Direction:** Two-stage pipeline — (A) classify intent in code + cheap model, (B) miner extracts cards with strict rules, (C) validator drops anything that fails the “flashcard title” test. Cap at **3 chips default, 4–5 only for long depth answers**.

---

## Part 1 — Header & Saves placement (1.1.1)

### What you have today

| Zone | Home | Chat |
| --- | --- | --- |
| Left | **Cove** (text, not a link) + ◎ | **← Home** + Cove + thread title + ◎ |
| Right | Keep beads · History · Settings | Same |

There is no navigation target for Saves. Adding a fifth text label (“Lists”, “Recipes”) will crowd the bar on iPhone.

### Recommendation: don’t add a word — add one symbol

**Option A (recommended): Library drawer `≡` or bookmark**

- One icon left of History (or replace nothing — tuck as **second row** inside Settings only for 1.1.1 *if* you want zero chrome change).
- Tap opens the same **MenuSheet** pattern as History/Settings: **Saved** section (Recipes, Lists).
- **Flyer lands on the icon** (`data-saves-pocket`) — neutral stone orb, not kind colors.
- Scales to: achievements, help, later — without new header words.

**Option B: Bookmark ⌁ or tray icon only**

- Single icon between Keep pocket and History.
- Best if Saves is the only “document” feature for a while.

**Cove clickability**

| Screen | Behavior |
| --- | --- |
| **Home** (`/ask`) | Cove → scroll to top / refresh ask field (mild); or no-op |
| **Chat** | You already have **← Home** — Cove should **not** also go home (duplicate) |
| **Saves / Settings** | Cove or ← Home returns to `/ask` |

**Rule:** One way home on inner screens = **← Home** only. On Home, Cove can become a subtle link to “reset view” but not required for 1.1.1.

### Chat action row (unchanged from prior plan)

Under the last assistant bubble:

```
[ Save this recipe ]     ← detect + flyer to Library icon
[ Learn more: … ]        ← 1.2
```

Same pill style as future Civil War buttons. No kind colors on Save.

---

## Part 2 — Memory science (why 3–5 facts)

### How memory actually works (simple)

- **Working memory** holds ~4 meaningful chunks at once (Cowan’s research). Flood the user with 10 chips and most vanish.
- **Retrieval practice** — actively recalling beats re-reading (Roediger & Karpicke). Your SEE/SAY loop is correct.
- **Production effect** — saying/writing the answer strengthens memory (MacLeod). VocalLearn’s voice angle fits here; web SAY is typing for now.
- **Spacing** — reviewing tomorrow beats cramming today (Ebbinghaus, SM-2). Your calendar-day due + 1d/3d/7d matches this.

**Implication for harvest:** Each chip should be **one retrievable unit** — a name, year, place, or short phrase — not a paragraph.

### What makes a fact “worth keeping”

Psychologists distinguish:

| Type | Example | Halo mapping |
| --- | --- | --- |
| **Specific fact** | “Gettysburg was July 1863” | Closed chip (when) |
| **Concept gist** | “Photosynthesis converts light to sugar” | Open (not in play yet) |
| **Procedure** | “First preheat oven to 350°” | Meaning / Saves (recipe) |
| **Irrelevant detail** | “Lincoln was 6'4”” in a battle question | Skip |

**Central idea principle:** People remember what was **central to their goal**, not peripheral details (Graesser, Kintsch). Intent harvest = find the **goal-central** facts for *this user’s question*.

### The “production effect” in your product

User **asked** (goal) → **read** answer (encoding) → **review** later (retrieval). Optional future: **Teach-me** adds guided encoding before review. Harvest should capture what they’d want to **produce** in SAY, not everything they **read**.

---

## Part 3 — How humans pick “key takeaways”

When a teacher summarizes a chapter, they implicitly:

1. **Identify the question** the chapter answers.
2. **Select the answer sentence** (thesis).
3. **Add 2–3 supporting facts** that would be on a test.
4. **Drop** anecdotes, tone, and “interesting but optional” material.

Your miner should mimic a **good teacher writing a quiz**, not a **librarian cataloging every sentence**.

### Simple heuristic (flashcard title test)

> If you printed the user’s question on the front of a flashcard, would this fact be a **fair** back-of-card answer or a **required** clue to get there?

- Fair → harvest  
- Unrelated interesting trivia → skip  

### Length tiers → chip budget

| Answer length | Suggested max chips | Notes |
| --- | --- | --- |
| Short lookup (1–3 sentences) | **1–2** | Primary + optional one support |
| Medium explain (1–2 paragraphs) | **2–3** | Primary closed atoms + mixed kinds |
| Long depth (3+ paragraphs, sources) | **3–4** (hard cap **5**) | Must pass tangent filter |

Never exceed **5**. Current code cap is **3** (`maxCardsPerTurn`) — raise to 4–5 only for `wantsDeeperAsk` after 1.2 validation proves quality.

---

## Part 4 — How AI systems summarize (and what we steal)

### Extractive vs abstractive

| Method | What it does | Halo use |
| --- | --- | --- |
| **Extractive** | Copy exact phrases from source | **Harvest spans** — must exist in reply |
| **Abstractive** | Rewrite in new words | **Answers** on chips (prompt/answer), not spans |

You want **extractive spans** for highlights + **abstractive prompts** for quiz questions. Miner already does this; intent layer chooses *which* spans.

### Typical RAG / summarization pipeline

1. **Query understanding** — what is the user asking?  
2. **Passage scoring** — which sentences matter? (TF-IDF, embedding similarity, cross-encoder)  
3. **Diversity selection** — don’t pick five sentences that say the same thing (MMR — maximal marginal relevance)  
4. **Compression** — fit token budget  

**Halo equivalent:**

```
userText → resolveHarvestIntent()     // step 1
reply sentences → score vs intent     // step 2
pick cards with kind diversity        // step 3 (when/where/who/meaning)
cap at 3–5                            // step 4
```

### What ChatGPT / Perplexity do (loosely)

- They optimize for **helpful complete answers**, not **minimal review deck**.  
- You must add a **second pass** whose only job is “what to remember.”  
- That pass should see **USER + ASSISTANT** and output structured JSON (your miner), not more prose.

---

## Part 5 — Closed vs open facts

### Definitions (your codebase)

- **Closed:** short token, gradable (Augusta, 1776, 4,130 miles) — `chip-recall.ts`  
- **Open:** sentence-length gist — rejected by `V2_HARVEST_POLICY.closedOnly`

### Why play sheet is closed-only (for now)

- SEE multiple choice needs **3 wrong answers same shape** — hard for open gists.  
- SAY grading needs a **normalizer** — paraphrase OK for short answers, messy for paragraphs.  
- Open facts are **valuable for Teach-me** and **display**, not for current Home rounds.

### Policy recommendation

| Phase | Closed | Open |
| --- | --- | --- |
| **1.2** | Harvest all intent-central closed atoms | Log in telemetry only, or `recall: open` cards stored but `seat: archived` |
| **1.3+** | Same | Optional “gist” mode in Kept panel, no play |
| **Teach-me** | Lesson emits both | Lesson ends with closed chips for review |

**Do not** mix open facts into play until grading story is clear.

---

## Part 6 — The four kinds (variety without randomness)

Your kinds are not decoration — they map to **question types the brain uses**:

| Kind | Question shape | Example chip |
| --- | --- | --- |
| **when** | When / how long / year | 1863, 4,130 miles (duration/count) |
| **where** | Where / place | Gettysburg, Egypt |
| **who** | Who / name | Grant, Nile (as entity) |
| **meaning** | What is / definition / number | population, formula, key phrase |

### Variety rule (for 2+ chips)

When the answer supports it:

- **Prefer different kinds** in one cluster (battle: **when** + **where** + **who**).  
- **Never** three chips of the same kind unless the user asked a list (“name three causes”).  
- **Primary kind** = whatever matches the **main ask** (capital → where first).

### Intent → kind priority

| User intent pattern | Primary kind | Secondary |
| --- | --- | --- |
| capital of / where | where | who (leader) optional |
| when did / year | when | where optional |
| who was / author | who | when optional |
| population / how many / define | meaning | where optional |
| explain / why / how | meaning (atoms) | mix |

---

## Part 7 — Intent pipeline (how to build it)

### Layer 0 — Ask (already exists)

`resolveAskRoute`, Grok/Luna, live feeds → **accurate reply**.  
Measure separately from harvest.

### Layer 1 — Intent classification (code + optional mini-model)

```typescript
type HarvestIntent = {
  primaryType: "lookup" | "explain" | "compare" | "list" | "procedure";
  closedExpected: boolean;      // capital, date, count → true
  topicKey: string;             // "gettysburg", "maine-capital"
  primaryQuestion: string;      // normalized user ask
  maxCards: number;             // 1–5 from length tier
};
```

**Cheap signals:**

- Regex: `capital of`, `population of`, `when did`, `who was`, `define`  
- Length: user + reply word count  
- `wantsDeeperAsk()` from `ask-route.ts`  

Optional: 1 Grok call `effort:none` on **user text only** before miner if regex ambiguous.

### Layer 2 — Miner (existing, new prompt)

Feed:

```
USER: {userText}
INTENT: {primaryQuestion, topicKey, maxCards, closedExpected}
ASSISTANT: {reply}

Rules: [see INTENT-HARVEST-1.2.md]
```

Output: 0–`maxCards` JSON cards.

### Layer 3 — Validator (code)

1. `cardsFromMinerJson` — distractors, closed-only, span in reply  
2. **NEW** `intentFilter(cards, intent)` — drop tangents  
3. **NEW** `requirePrimary(cards, intent)` — if closed lookup and zero cards → fallback or retry  
4. **NEW** `diversifyKinds(cards)` — if 3 cards same kind, keep best 2  

### Layer 4 — Deterministic fallback (1.2)

For high-confidence lookups only:

- `capital of X` → regex extract proper noun after “capital” in reply  
- `population of X` → extract number pattern  

Use only when miner returns `[]` — safety net, not primary path.

---

## Part 8 — Scoring sentences (research-backed sketch)

For each candidate span in ASSISTANT, score 0–1:

| Signal | Weight | Meaning |
| --- | --- | --- |
| **Intent similarity** | High | Embedding or keyword overlap with `primaryQuestion` |
| **Position** | Medium | First paragraph often has direct answer (journalism pyramid) |
| **Closedness** | High for play | Has number, date, capitalized place, proper noun |
| **Kind diversity** | Medium | Bonus if kind not yet used in cluster |
| **Already harvested** | Hard filter | `harvestFactKey` dedupe |

Take top N spans → miner fills prompts/distractors.

This can be **prompt-only** in 1.2 (miner does scoring implicitly) and **code-assisted** in 1.3 if quality plateaus.

---

## Part 9 — Testing & tuning loop

### Weekly cadence (you + telemetry)

1. Export `halo_harvest_turns` (last 50 non-skipped).  
2. Label each: **primary correct?** **tangent?** **missed primary?**  
3. Add failing rows to `harvest-smoke-cases.ts`.  
4. Adjust miner prompt + intent regex — **not** play sheet.  

### Success metrics (1.2)

| Metric | Target |
| --- | --- |
| Primary closed ask gets ≥1 correct chip | **≥90%** |
| Tangent chips (human label) | **<10%** of chips |
| Zero-card non-skip on closed lookup | **<5%** |
| Kind diversity when 2+ chips | **≥70%** mixed kinds |

### Real-question protocol

You and 2 testers: **only ask things you genuinely want to know** for one week. Log: question, happy with chips Y/N, which chip wrong. This beats synthetic capitals.

---

## Part 10 — Phased rollout

| Release | Harvest / UX |
| --- | --- |
| **1.1.1** | Calendar due, TZ, “You’re clear”, **Saves** + Library icon + action row + neutral flyer |
| **1.2** | Intent layers 1–4, miner prompt v2, fixtures, Luna routing |
| **1.3** | Open facts logged, grading nuance, streak fairness |
| **1.4** | Teach-me emits chips from lesson script |
| **1.5** | Optional open “gist” shelf; miner uses thread-level intent |

---

## Part 11 — Direct answers to your hardest questions

### “How do we know the most important 3–5 facts?”

1. Start from **the user’s question**, not the model’s essay.  
2. **One chip must answer that question** (closed).  
3. Add facts only if removing them would make the answer **incomplete for a quiz on the same topic**.  
4. Cap by answer length (table above).  
5. Enforce **kind diversity** when possible.

### “Closed vs open?”

- **Play / Home:** closed only through 1.3.  
- **Open:** store for later Teach-me + Kept display; don’t quiz yet.

### “How do other AIs summarize?”

- They optimize completeness. You optimize **retrievability**. Second pass, smaller budget, flashcard test.

### “Is this too hard?”

- **No** for 1.2 if you accept: regex + prompt + validator + weekly telemetry.  
- **Yes** if you expect perfection on every depth essay without human-labeled fixtures.

---

## Appendix — Header decision matrix

| Approach | Pros | Cons |
| --- | --- | --- |
| Text “Lists” in header | Obvious | Crowded on phone |
| Bookmark icon | Clear, one tap | Another icon |
| **Library `≡` drawer** | Scales (Saves, help, later) | One more pattern to learn |
| Inside Settings only | Zero chrome | Buried; weak flyer moment |

**Pick for 1.1.1:** Bookmark icon **or** Library drawer — not a text label.

---

*End of report. Next: lock header symbol + approve intent layer 1.2 build order.*
