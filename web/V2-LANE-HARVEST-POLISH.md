# Lane H — Harvest polish (Composer / Grok)

**Goal:** Ship two surgical fixes before early-access promote. Camron confirmed mobile layout + Keep sync are good. Speed is fine. Only harvest reliability gaps remain.

**Camron symptoms:**
1. **Capital asks ~50/50** — sometimes no chip; population number on same thread *does* harvest + highlight.
2. **Beads without highlights or flyers** — e.g. “largest city in the world” → 2 header beads, no chat marks, no visible flight (gold boiling-point case worked).

**Do not touch:** harvest z-index 120, morph `--travel` 1080ms, bead diameter, Home seating, Keep sync, mobile CSS from QA-3.

**Spec:** `web/HALO-V2-SUNDAY.md` · Ops: `web/HARVEST-OPS.md` · Board: `web/KEPT-BOARD.md`

---

## Root cause (diagnosed)

### Task 1 — Mining + highlights

| Layer | File | Problem |
| --- | --- | --- |
| Miner prompt | `web/src/lib/learn-mine.ts` `MINER` | Grok is inconsistent on short capital answers; may omit a card or pick a span that isn’t the shortest literal substring in the reply. |
| Validation | `learn-mine.ts` `cardsFromMinerJson` L158–159 | `spanInReply(span, reply)` is strict `includes()`. Card is **dropped entirely** if span fails — even when `token` or `answer` *is* in the reply. |
| Highlight injection | `web/src/lib/harvest.ts` `harvestMarkdown` L438–455 | Same strict `indexOf(needle)` on stabilized markdown. Bold (`**Paris**`), smart quotes, commas, or paraphrased spans → **no `[data-harvest]` mark**. |
| Render | `web/src/components/AnswerBody.tsx` L102–107 | Highlights only come from `harvestMarkdown`; no fallback. |

**Important:** Beads can still land via `beginHarvest` → `halo-keep-add` even when highlights fail. Missing marks are a **highlight matcher** bug, not a mining-always-fails bug — though mining also drops cards when span validation fails.

**Policy is already correct** for short capitals (`harvest-policy.ts` L51–55 exempts `isLookupAsk` from `minReplyLength: 40`). Do not loosen weather/news skips.

### Task 2 — Flyers always visible

| Layer | File | Problem |
| --- | --- | --- |
| Flight origin | `web/src/components/HarvestFlights.tsx` L59–65 | Polls `[data-harvest="${id}"]` for 36 rAF frames (~600ms), then **`instant` path**: calls `onLanded(chip)` with **no animation**. User sees beads pop in with no flyer. |
| Reduced motion | same L51–54 | `reduced` → instant (correct). Do not change. |

**Fix:** Never silent-instant except `prefers-reduced-motion`. When no mark, fly from a **fallback origin** on the page (latest assistant bubble).

---

## Task 1 — Smarter harvest + fuzzy highlights

**Files to touch:**
- `web/src/lib/harvest.ts` (new matcher helper; update `harvestMarkdown` + `splitHarvestText`)
- `web/src/lib/learn-mine.ts` (miner prompt + relaxed span resolution in `cardsFromMinerJson`)
- `web/src/lib/learn-mine-fixtures.ts` + `web/src/lib/harvest-smoke-cases.ts` (unit cases only — no live Grok required for merge)

**Out of scope:** `harvest-policy.ts` gate changes, `ask-route.ts`, stream timing, z-index.

### 1a. Shared span finder (`harvest.ts`)

Add **`findHarvestNeedle(haystack: string, chip: HarvestChip): { start: number; end: number; text: string } | null`**

Try in order (first hit wins; longest needle first within each step):

1. **Exact:** `chip.span`, `chip.token`, `chip.answer` (trimmed, dedupe empty)
2. **Case-insensitive** `indexOf` on the same list
3. **Markdown-stripped haystack:** remove `**`, `*`, `` ` ``, `[_]()` link syntax before search; search original indices via mapping OR search stripped and accept match on stripped text (simpler: strip both sides with same rules)
4. **Normalized key:** use existing `harvestFactKey()` — if key length ≥ 3, find a window in haystack whose `harvestFactKey` equals the needle key (word-boundary friendly for city names like `Jakarta`, `Augusta`)

Return the **actual matched substring** from `haystack` so injected link text matches what’s on screen.

Wire into:
- `harvestMarkdown(md, chips)` — replace raw `indexOf`
- `splitHarvestText(text, chips)` — same helper (keeps Hold-to-open consistent)

### 1b. Relax miner validation (`learn-mine.ts`)

In `cardsFromMinerJson`, replace single `spanInReply(span, reply)` check with:

```ts
function resolveSpanInReply(chip: MinerCardJson, reply: string): string | null {
  const candidates = [card.span, card.token, card.answer].map(s => s?.trim()).filter(Boolean);
  for (const c of candidates) {
    if (reply.includes(c)) return c;
    if (reply.toLowerCase().includes(c.toLowerCase())) return c; // pick actual slice from reply if possible
  }
  // optional: harvestFactKey match for token/answer only (closed facts)
  return null;
}
```

Store resolved span on the draft chip (slice from reply when case-insensitive match).

**Miner prompt additions** (append to `MINER` rules, keep JSON-only output):

- If USER asks **“capital of …”**, return **at least one** `where` card with `span` = **city name only** as it appears in ASSISTANT (e.g. `Augusta`, not `the capital of Maine`).
- If USER asks **“population of …”**, return a `meaning` card with `span` = **number + unit** exactly as written.
- Prefer the **shortest** stable substring for `span` (name, year, number) — never a full sentence.
- When ASSISTANT gives 2+ facts (city + population), return 2 cards when both are closed.

Do **not** remove verbatim-span guidance; add “shortest literal substring” as the priority.

### 1c. Unit tests (required before done)

Add to `learn-mine-fixtures.ts`:

| Case | Reply snippet | Miner JSON span | Expect |
| --- | --- | --- | --- |
| Bold capital | `The capital is **Augusta**.` | `Augusta` | `harvestMarkdown` highlights `Augusta` |
| Span mismatch, token ok | `…Jakarta is the largest…` | `largest city by population` (bad) / token `Jakarta` | validation keeps card via token; highlight finds `Jakarta` |
| Population comma | `population of 10,539,000` | `10,539,000` | highlight hit |

Add `gate` smoke row optional; prefer pure fixture tests calling `findHarvestNeedle` + `harvestMarkdown` directly.

**Verify:** `npm run test:harvest` (3/3 suites). Dry smoke stays 9/9+.

---

## Task 2 — Flyers always (fallback origin)

**Files to touch:**
- `web/src/components/HarvestFlights.tsx` (main fix)
- `web/src/components/ChatThread.tsx` (mark latest assistant bubble)
- Optional tiny CSS: none expected

**Out of scope:** flight path math (`samplePath`), duration, z-index 120, `prefers-reduced-motion` behavior.

### 2a. Mark fallback anchor (`ChatThread.tsx`)

On the **latest assistant** message wrap (the one that just finished streaming — last `msg-wrap--assistant` in the list, or the live bubble before it merges):

Add `data-harvest-origin="true"` on the `.msg` or `.msg-wrap` element.

When `beginHarvest` runs, ensure the finishing assistant row has this attribute (clear previous `data-harvest-origin` on older messages).

### 2b. Fallback origin resolver (`HarvestFlights.tsx`)

Replace silent `instant` path (L63–64) with:

```ts
function flightOrigin(chip: HarvestChip): { x: number; y: number } | null {
  // 1. highlight mark (existing)
  const mark = document.querySelector(`[data-harvest="${CSS.escape(chip.id)}"]`);
  const markBox = mark?.getBoundingClientRect();
  if (markBox && markBox.width >= 2) return center(markBox);

  // 2. latest assistant bubble
  const bubble = document.querySelector('[data-harvest-origin="true"] .answer')
    ?? document.querySelector('.msg-wrap--assistant:last-of-type .answer');
  const box = bubble?.getBoundingClientRect();
  if (box && box.height >= 2) {
    // Stagger multiple chips: offset x by chip index * 24px so paths don’t stack
    return { x: box.left + box.width * 0.5 + index * 24, y: box.top + box.height * 0.35 };
  }

  // 3. chat stage center (last resort — still animate)
  const stage = document.querySelector('.chat-scroll');
  ...
}
```

- **Keep polling** marks for ~36 frames if some chips have marks and others don’t (mixed turn).
- **`instant` + `onLanded` only when `reduced === true`** (accessibility).
- Non-reduced: **always** push to `next` flights array; never bead-only pop-in.

### 2c. Manual QA (Camron)

After `npm run deploy:lab` or localhost:

1. “What is the capital of Maine?” → highlight on `Augusta` + flyer to Keep.
2. “What is the population of Augusta?” → number highlighted + flyer.
3. “What is the largest city in the world?” → if 2 chips, **two flyers** even if highlights partial; at minimum both fly from answer bubble.
4. Safari iPhone: same three asks on LAN — flyers visible, beads in header.

---

## Suggested lane split (one Grok session or two)

| Lane | Task | Est. files |
| --- | --- | --- |
| **H1** | Task 1 — `findHarvestNeedle`, miner prompt, `cardsFromMinerJson`, fixtures | 4 |
| **H2** | Task 2 — `HarvestFlights` fallback, `ChatThread` origin attr | 2 |

H2 can land independently and is smaller. H1 is the capital/highlight reliability fix.

**Order:** H2 first if splitting (immediate visual win); H1 for 50/50 capital mining.

---

## Board protocol

1. Read `web/KEPT-BOARD.md` + this file.
2. Claim lane H1 or H2; list files under **Locks**.
3. End of turn: update board Log (3–8 bullets), unlock files.
4. Run `npm run test:harvest` + `npm run build` before marking done.

---

## Paste for Grok worker tab

```
Lane H1 (or H2). Read web/KEPT-BOARD.md and web/V2-LANE-HARVEST-POLISH.md. Claim the lane. Update the board every turn.
```
