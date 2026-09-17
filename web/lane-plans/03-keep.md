# Lane 3 — Keep / memory / due / sync (plan only)

**Date:** 2026-09-06  
**Status:** plan. No `web/src` edits. No KEPT-BOARD. No deploy. No promote.  
**Assumed surfaces:** live early access = `/ask` at `136d15f` (Keep JSON + next-calendar-day due already shipped). Working tree = same scheduler plus unpromoted harvest/lock-in around it. Family `/ask` frozen.

Later implement in: `keep-memory.ts`, `keep-cloud.ts`, `local-day.ts`, `web/src/app/api/keep/route.ts`.  
Do **not** own: HomeBubbles GUI, HarvestLock, ChatThread, HarvestFlights.

---

## Live vs lab this plan assumes

| | Live family (`136d15f`) | This working tree |
| --- | --- | --- |
| Store | `localStorage halo-keep-v2` + `halo_keep_state` blob | Same |
| First due | `nextDueAt(0)` = **next local calendar midnight** | Same |
| Caps | Keep 30 / Home 16 / day **3** | Same (`DAY_ROUND_CAP = 3`) |
| Open chips | No `dueAt`, never Home | Same |
| Dual deck | Miner still writes `halo_learn_cards`; loop reads Keep JSON | Same |
| Encoding | Read + fly. Retrieval starts tomorrow | HarvestLock exists, **not promoted** |

Calendar math (`local-day.ts`, UTC-midnight repair) is live and honest. The product hole is not “the clock is wrong.” It is that the first retrieval is delayed and unexplained, and the bank silently drops facts.

---

## What the user actually experiences

**Day 1.** They ask something worth keeping. Spans light up, chips fly to header dots. Home stays empty of those facts (correct: harvest lands Keep). The dots do nothing if tapped. Nothing says “these wait until tomorrow.” If they already have 30 chips in the JSON array (including gold), the new fact can fly and then **not persist** (`addKeepChip` returns with no write).

**Later that night / next morning.** At local midnight the closed chips become eligible. Up to 16 take Home seats (`applyDueSeats`). Open/gist chips stay in Keep forever. They tap a chip; Lane 4 runs the round; Lane 3 `finishRound([{id, passed}])` banks passes (1d / 3d / 7d) or leaves misses due today. One miss in play still arrives here as `passed: false` even if the retry typed correctly. Third clean → gold, off dock, ◎ count up.

**Simple:** The bank is real. It is not yet a bank they can trust or inspect. The wait is a calendar rule, not a mystery bug — but it *feels* like a mystery because nothing encodes today and nothing names tomorrow.

---

## Scores I disagree with

Head: SRS 7, Keep collection 6, Home due 8, Persistence 7, Habit 2.

| Category | Head | Mine | Why (code) |
| --- | ---: | ---: | --- |
| Spaced review engine | 7 | **7** | Agree. `PASS_GAP_DAYS` 1/3/7, `roundIndex` from clears not lateness, remainder-free re-tap, r3 fail → `clears` 0, gold at `MASTER_AFTER` 3. Not Anki. Enough for a family app **if** first encoding exists. Gap is encoding (cat. 7), not this scheduler. |
| Keep collection | 6 | **5** | Beads sort correctly (silver → bronze → new). Users cannot inspect, edit, or delete. Overflow is a silent no-op. Open chips sit in the same dock and never play. Collection without a read path is jewelry. |
| Home due field | 8 | **8** | Agree for **data**: `HOME_SEAT_CAP` 16, already-on-Home keep seats, extras wait in Keep, closed-only, gold excluded. GUI/seating is frozen and owned elsewhere. |
| Persistence / Keep sync | 7 | **6** | Phone ↔ desktop blob works (`GET/PUT /api/keep`, 500ms debounce, last-updated wins). Two things keep it off 7: (1) `slice(-KEEP_CAP)` + length cap treat **gold + due + open + waiting** as one 30, so the vault can be evicted; (2) miner deck `halo_learn_cards` is a second library the Home loop never plays. |
| Habit / notifications | 2 | **2** | Agree. Due chips and a day cap are the only return hooks. Lane 3 should not invent push/streaks. |

Sunday spec still says day cap **2**; code and Camron amend are **3**. That is a docs bug. Do not “fix” the cap back to 2.

---

## Further split (Keep-owned)

| Sub | Score | Evidence |
| --- | ---: | --- |
| Scheduler honesty (TZ, calendar, 1/3/7) | 8 | `addLocalCalendarDays` + `repairUtcMidnightDue`; `local-day-check.ts` covers Denver evening → next midnight. Not rolling 24h. |
| First-due / encoding timing | 4 | First Home retrieval is next local day. Same-visit Home empty is correct. No same-session retrieval on live. Wife/parents already flagged the wait. |
| Merge / dedupe | 5 | `addKeepChip` merges **by id**. `existingDueHarvest` blocks re-stamp only if the match is already due/gold. Waiting Keep chips can duplicate on a new UUID. Miner unique is `(user_id, prompt)` on the other table. |
| Cloud conflict | 5 | Whole-payload LWW. Phone round vs desktop harvest in the same minute: later `updatedAt` wins, the other is discarded. No per-chip merge. |
| Overflow | 2 | `if (chips.length >= KEEP_CAP) return`. No event, no `+N`, no overflow list. Hydrate also `slice(-KEEP_CAP)` (newest-in-array survive). |
| Gold vault integrity | 5 | Visually off dock (`sortKeepBeads` drops gold). Still counted in the 30. `finishRound` moves passes to **end**, so hydrate’s last-30 prefers recent gold over old waiting facts. |
| Open-chip bank | 3 | `isPlayableClosed` gate: no `dueAt` stamp, never Home. They still occupy the 30 and can appear as dock beads. |
| `finishRound` math | 8 | Per-chip pass/fail, miss stays `dueAt: now` / Home, remainder map, lifetime skip on free re-tap. Play owns UX; this contract is right. **No unit tests** of it in `v2-lib-check`. |

---

## First due: wait-until-tomorrow vs same-day vs Lane 4 encoding

This is the product decision this lane owes.

### A — Keep wait-until-tomorrow (current)

Harvest stamps `dueAt = nextDueAt(0, now)` = local midnight of **tomorrow**. Seat stays `keep` until `dueAt <= now`. Vision must-not holds: same visit does not drop chips on Home.

- **Helps memory:** spacing after a night is the right *second* retrieval.
- **Hurts the product:** it is also the *first* retrieval. Reading + watching a fly is not encoding. The wait looks like a broken empty Home.

### B — Same-day first due

Stamp first `dueAt` as today (now, or later tonight). Then 1d/3d/7d after the first clean round.

- **If they go Home in the same visit,** chips sit on the field next to the composer they just used. That is the vision must-not (“do not drop beads on Home in the same visit as the Ask”). Home stops meaning “due reviews” and starts meaning “you just harvested.”
- **If we special-case “not this visit,”** the rule becomes a session ghost — another mysterious wait.
- **Does not encode.** Seeing a chip on Home is not retrieval. It only shortens the wait.
- **If Lane 4 also encodes today,** same-day Home due double-tests in one calendar day and wastes the 1-day gap.

### C — Encoding owned by Lane 4 (HarvestLock / try-it-now)

Same-session SEE then SAY **in chat**, then fly to Keep. Lane 3 **does not** move first Home due. First Home due stays next local calendar day. Copy (Lane 5/10) names the wait.

- First retrieval = now (encoding).
- Second retrieval = tomorrow morning (spacing).
- Home stays empty of today’s harvest (vision).
- Matches the head off-script order and `LIBRARY-BACKLOG.md` “first review on harvest” without turning Home into a dump.

### Recommend: **C**. Do not ship B.

Lane 3 keeps A’s calendar stamp. Lane 4 owns the missing first retrieval. Lane 5/10 own one quiet line: facts saved, review tomorrow.

**Fallback if HarvestLock does not promote:** copy-only (still A). Not same-day Home due.

**Micro-round-on-land** (a SEE beat after the fly) is also Lane 4/5 chrome, not a `dueAt` change. Do not implement a hidden same-day due to fake a micro-round.

`dropKeepDue` / Mix “Due now” stay Lab tools. Never a family default.

---

## Caps (code is source of truth)

| Cap | Code | Spec | Call |
| --- | --- | --- | --- |
| Keep in-progress | `KEEP_CAP = 30` (not exported) | ~30 visible | Keep **30 in-progress**. Stop counting gold/open against it. |
| Home seats | `HOME_SEAT_CAP = 16` | 16 | Keep. Frozen seating GUI. |
| Day rounds | `DAY_ROUND_CAP = 3` | 2 (stale) | Keep **3**. Remainder-free first re-tap of a failed cluster does not consume. Sunday copy “third tap” was written for cap 2 — Lane 5/10 must say 3. |

Open chips: stay **no `dueAt`**. Do not invent Home play. Optionally exclude them from the 30 and from the dock (inspect-only “saved, not quizzed”). That is a data flag + read API; Lane 5 draws it.

One miss fails the round: **keep**. Play sets `passed`. `finishRound` must not upgrade a retry-correct. Do not add ease/fuzz/SM-2 this month.

---

## Dual store

| Deck | Who writes | Who reads for the loop |
| --- | --- | --- |
| `halo_keep_state` JSON / `halo-keep-v2` | Client persist + `PUT /api/keep` | Home, Keep pocket, ◎, play math |
| `halo_learn_cards` | `learn-mine.ts` insert (UUID becomes chip id) | Miner `knownPrompts`; zombie `/api/learn` + `LearnReview` |

They drift: unique-on-prompt vs Keep-by-id; cap drop in JSON leaves orphan SQL rows; LearnReview can still show a card the V2 sheet never will.

**This month (Lane 3 + 7):** Keep JSON remains the loop source of truth. Do not migrate facts to relational. Do not delete `halo_learn_cards` (miner ids + dedupe). Do not wire LearnReview back to Home. Lane 7 may later treat learn_cards as harvest log only.

Duplicate `keep-cloud 2.ts` / `keep-land 2.ts` are not imported by the runtime Keep path. Lane 11 cleanup; do not touch in this lane’s implement wave unless chief says so.

---

## Read API Lane 5 needs (bead inspect + overflow)

Lane 5 owns chrome (panel vs sheet). Lane 3 owns stable reads. Today they scrape `readKeepChips()` + `sortKeepBeads()`. That is not enough: no inspect DTO, no overflow count, `KEEP_CAP` is private, gold is mixed into the same array.

Propose (implement later in `keep-memory.ts` only):

```ts
export const KEEP_CAP = 30; // in-progress closed+waiting+due, not gold

export type KeepInspect = {
  id: string;
  token: string;
  prompt: string;
  answer: string;
  kind: ChipKind;
  rank: 0 | 1 | 2 | 3;          // new / bronze / silver / gold
  seat: ChipSeat;
  recall: "closed" | "open";
  playable: boolean;            // closed && not gold
  dueAt: number | null;         // null = open or unstamped
  keptAt: number | null;
  clears: number;
  cluster?: string;
  askId?: string | null;        // Lane 5 may deep-link History later; v1 ignore
};

readKeepInspect(id: string): KeepInspect | null;

/** Dock row: silver → bronze → new, max KEEP_CAP. No gold. No Home-due. */
readDockBeads(): HarvestChip[];

/** In-progress beyond the 30 shown. Empty until overflow exists. */
readKeepOverflow(): { count: number; chips: KeepInspect[] };

/** Gold vault for ◎. Not capped by KEEP_CAP. */
readGoldVault(): KeepInspect[];

/** Why addKeepChip no-op’d. Lane 5 shows +N / refuse, not a toast stack. */
type KeepAddResult =
  | { ok: true; chip: HarvestChip }
  | { ok: false; reason: "cap" | "dup-due" | "invalid" };

tryAddKeepChip(chip: HarvestChip): KeepAddResult; // replace silent addKeepChip return
```

v1 inspect is **read-only** (prompt / answer / rank). `removeKeepChip` already exists — do not expose delete in the first panel (`LIBRARY-BACKLOG` defers it).

Overflow chrome: `+N` or a small sheet listing `readKeepOverflow()`. Hidden chips stay in JSON (not dropped). New harvests at cap: **refuse the new chip** (prefer known collection over silent eviction of old gold). Return `{ ok: false, reason: "cap" }` so harvest fly can land on `+N` instead of a vanishing bead.

Do not put facts in Library (Lane 8). ◎ panel stays gold-only; in-progress inspect is the bead panel.

---

## Improvements by score (now / later / never)

| Score | Now (after chief go) | Later | Never this season |
| --- | --- | --- | --- |
| SRS 7 | Unit tests for `finishRound` / first due / remainder / gold; align cap comments to 3 | Open-fact due only when Lane 4 can grade them | Ease factor, fuzz, Anki load, SM-2 port from native |
| Collection 5→7 | Inspect DTO + overflow count; stop gold counting as 30 | Delete-from-bead; overflow sheet polish | Library-as-facts, infinite dots |
| Home due 8 | Leave seating. Optional: `readDueSummary()` for greeting copy | — | Same-visit Home dump, same-day first due |
| Persistence 6→7 | Cap math that preserves gold; `tryAddKeepChip` result | Per-chip merge if family hits clobber | Full relational Keep rewrite this month |
| Habit 2 | `readDueSummary()` for Lane 10 copy only | — | Push, email, V2 streaks |

---

## Top 5 implementation tickets

Human-fail tests. Files this lane may touch after go.

1. **Gold and overflow do not share one silent 30**  
   Files: `keep-memory.ts`.  
   Success: 30 in-progress + 10 gold; harvest a 31st closed chip → chip is **not** stored, `tryAddKeepChip` returns `cap`, gold vault still has 10. Today: length ≥ 30 no-ops **or** `slice(-30)` can drop gold.  
   Fail if: a gold row disappears to make room, or the new chip vanishes with no result for UI.

2. **Inspect + overflow read API**  
   Files: `keep-memory.ts` (export DTO). Lane 5 wires taps.  
   Success: given a dock bead id, `readKeepInspect` returns prompt, answer, kind, rank name-equivalent, `playable`. `readKeepOverflow().count` is 0 under cap and N above.  
   Fail if: Lane 5 still has to filter raw `readKeepChips()` to know rank/due/open.

3. **`finishRound` fixture suite**  
   Files: new `keep-memory-check.ts`, hook into `v2-lib-check.ts`. (Scheduler is untested except `local-day`.)  
   Success: clean r1 → due +1 local day, seat keep; miss → Home + `dueAt` now + remainder id; r3 miss → `clears` 0; r3 pass → mastered; remainder-free tap does not bump `roundsLifetime`; open chip never becomes Home.  
   Fail if: retry-correct is treated as pass inside Keep (Keep must honor the boolean play sent).

4. **Dedupe waiting Keep by token/answer, not only id**  
   Files: `keep-memory.ts` (`addKeepChip` / merge). Coordinate with Lane 2 miner; do not restamp due/gold (`mergeHarvest` already protects Home).  
   Success: re-harvest Nile while chips still waiting in Keep → one cluster, copy may refresh, `dueAt`/`clears` unchanged.  
   Fail if: a second Nile bead appears, or a Home due chip is pulled back to Keep.

5. **Cloud payload cap matches in-progress, not array tail**  
   Files: `keep-memory.ts` `parseKeepCloudPayload` / hydrate / `writeKeepChips`; `api/keep/route.ts` only if validation must reject oversized blobs.  
   Success: pulling cloud with 40 gold + 12 waiting does not slice away gold. Push still LWW.  
   Fail if: phone load after desktop gold-up drops mastered rows.  
   Out of scope for this ticket: true per-chip CRDT merge (later, with Lane 7).

---

## Handoffs

| To | What |
| --- | --- |
| **Lane 4** | Owns first encoding (promote/redesign HarvestLock or try-it-now). Do not ask Keep to same-day due as a substitute. Play keeps sending `{id, passed}`; one miss = fail. |
| **Lane 5** | Bead inspect panel + `+N` overflow chrome. Call `readKeepInspect` / `readDockBeads` / `readKeepOverflow`. Frozen: bead diameter, harvest z 120, seating. First-harvest line: “review tomorrow.” |
| **Lane 2** | Miner still upserts `halo_learn_cards` and mints ids. Waiting-Keep token/answer dedupe is ours; prompt-unique SQL is theirs. Open chips: they may emit; we will not due them. |
| **Lane 7** | Keep blob vs learn_cards. Do not migrate this month. LWW is known. If they add server validation, use `parseKeepCloudPayload`. |
| **Lane 8** | Facts stay in Keep, not Library. |
| **Lane 10** | Copy for the wait; day cap 3 not 2; habit without push. Do not schedule Teach-me on our scheduler. |
| **Lane 11** | Add `keep-memory-check` to `test:harvest`. Duplicate `keep-cloud 2.ts` is inert. Sunday day-cap 2 vs code 3 is a spec fix. |
| **Lane 6** | Inspect panel must work on Safari header width; we do not change dock CSS. |

---

## Do not do

- Same-day first due on Home.
- Drop today’s harvest onto Home in the same visit.
- Change `DAY_ROUND_CAP` back to 2.
- Retune harvest z-index 120, morph 1080ms, bead diameter, Home seating, Paper.
- Promote HarvestLock, intent, Luna, or anything else.
- Edit family `/ask`, HomeBubbles play GUI, ChatThread, HarvestFlights, HarvestLock.
- Push notifications, streaks, XP, SM-2, native Keep port.
- Relational rewrite of Keep; deleting `halo_learn_cards`; reviving LearnReview as the loop.
- Bead delete / edit in v1 inspect.
- Open-fact Home play.
- Touch `web/KEPT-BOARD.md` this plan wave.

---

## Files I would touch (when chief says go)

- `web/src/lib/keep-memory.ts` — cap, inspect API, dedupe, `tryAddKeepChip`, `finishRound` unchanged unless tests prove a bug
- `web/src/lib/keep-memory-check.ts` — new fixtures
- `web/src/lib/v2-lib-check.ts` — register the suite
- `web/src/lib/keep-cloud.ts` — only if add-result must not push empty no-ops
- `web/src/lib/local-day.ts` — only if a test finds a TZ hole (none known)
- `web/src/app/api/keep/route.ts` — only if payload validation must allow gold beyond 30

Blocked on: chief converge; Lane 4 encoding decision (we assume C); Lane 5 to consume the read API. Not blocked on Teach-me, iOS, or Stripe.
