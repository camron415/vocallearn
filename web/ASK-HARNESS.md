# Ask TurnPlan harness

Automated routing **and chip-quality** QA so Camron only hand-checks **visual** loop motion (morph, Keep fade, lock-in, phone dock).

**1.2 ship gate (met 2026-09-17):** `npm run test:harvest && npm run build`. Claims pack is inside `test:harvest`. Live `test:ask:buckets` last full run **28/28 routing · 11/11 primary** (2026-09-15). Re-run buckets after classifier/miner edits.

## Commands

| Command | What it runs |
| --- | --- |
| `npm run test:harvest` | Dry suites: routing, chip invariants, answer shape |
| `npm run test:ask:claims` | Dry discovery A/B: remember vs skip, short asks, open/closed, typos, same-answer different cue |
| `npm run test:harvest:family:dry` | Canned skip/harvest intent |
| `npm run test:ask:buckets` | Live SSE on `halo.lab.smoke@invalid.local` — routing + `expectPrimary` |
| `npm run test:ask:harness:live` | Alias → `test:ask:buckets` |
| `HALO_SMOKE_ONLY=id,id` | Subset of live cases. Does not overwrite `ask-bucket-smoke-latest.md`. |

**Ship gate:** `npm run test:harvest && npm run build`. Run `test:ask:buckets` after classifier/miner changes and before lab promote.

Wrong **main** chip = hard fail. Empty Keep on remember = soft miss (safety net, not the design).

## Discovery loop (one TurnPlan)

1. **Classify** — `job` ⟂ `freshness`, plus `askKind` (main chip type) and `answerDepth` (brief / standard / long, derived in code).
2. **Answer** — first sentence holds the main atom. How/why may be long. Grok only for files, web search, or `answerDepth: long`.
3. **Miner** — only if `harvest`. Chip 1 = main fact, then supports. **No sides-only.** Verbatim span, no user-prompt echo, citation-year guard.
4. **Code uniqueness** — Keep identity is the **cue**, not the answer word. Same answer + different question is two chips. Restated questions are one. Token blocking is gone. Classify `remember` may harvest a short follow-up (`Jupiter`); smash still skips without classify.

Paper highlights may still fuzzy-match. The miner **filter** requires a verbatim span.

**Flags (no extra user form):** `harvest_miss` when remember mined 0 chips. Lock-in **Don't keep this** sets `harvest_lock.meta.reject`. Review in [`HARVEST-OPS.md`](./HARVEST-OPS.md). Empty Keep on remember is also a harness soft miss.

## Classify timing

1. Home Ask starts the **real** `/api/chat` stream on Enter (not `prepareOnly`). Classify + first tokens run during the 1080ms morph. Chat attaches to that stream.
2. Classify is **Luna** when `HALO_USE_LUNA` is on (tiny JSON, no Ask length/clock junk). Grok none is the fallback if Luna is off.
3. Cache key: user + conversation + **this turn's text**. One call per turn on that isolate. Home no longer fires a second classify on Chat mount.
4. Stream **awaits** classify. Hang cap is **1200ms** (`CLASSIFY_MS`). Regex fallback only on timeout / parse fail / &lt;8 char fast-path. Do not restore a 900ms regex race.
5. Live `test:ask:buckets` POSTs `/api/chat` **directly** — it does **not** prove the Home morph path. Re-run buckets before promote after classifier model changes.

## Tomorrow (2026-09-14) — finish harness quality

Done this chat (Lane harness). Full live pack **26/28 routing · 11/11 primary atom**, then ice-cream + socks re-check **2/2**. Combined **28/28 routing · 11/11 primary**.

Need (from the pack): ice cream + “current ones” no Keep; bomb history Keep (1938 / Manhattan); BYU/weather feeds; **Gettysburg first chip 1863**; Utah Salt Lake City; no “Give me brief”. All held.

Holes fixtured without restaurant regex:

- Live listing recipe pill → `resolveSaveOffer` skips unless job is kitchen. Frozen in `save-offer-check.ts`.
- Socks classify-remember → merge lets product skip win. Frozen in `ask-intent-check.ts`.
- Gettysburg where-first JSON still in `chip-invariants-check.ts`; added tonight’s live date-span JSON as a passing primary.

Runner: two scores in the header; citation on `freshness: web`; `expectPrimary` on sky / Austen / Pythagoras; smoke `harvest_turns` reset so stale INTENT cannot fake remember; `HALO_SMOKE_ONLY` for hole re-checks (does not overwrite `ask-bucket-smoke-latest.md`).

Camron visual only after buckets green: morph, Keep, lock-in, phone dock. **No promote** unless he says promote.

## Cue uniqueness (2026-09-16 — include on 1.2 promote)

Keep identity is the **cue**, not the answer word. Token blocking is gone. Closed one-word names Keep.

| Check | Result |
| --- | --- |
| `npm run test:ask:claims` | **24/24** dry classify → gate → miner uniqueness |
| `npm run test:harvest` | **21/21** including the claim pack |
| Camron lab `/preview` | “largest planet” now harvests **Jupiter** (same ask that used to miss) |

Parked: synonym merge, list/set answers, 400-row peek. Spec: [`INTENT-HARVEST-1.2.md`](./INTENT-HARVEST-1.2.md) § Cue uniqueness. Ops: [`HARVEST-OPS.md`](./HARVEST-OPS.md).

Parked (not tomorrow): Home SEE/SAY, follow-up Keep rewrite, Packet C full miner rewrite, migration 018 plan persist, CI nightly, fourth judge model.

## Related

- [`HARVEST-OPS.md`](./HARVEST-OPS.md)
- [`KEPT-BOARD.md`](./KEPT-BOARD.md)
