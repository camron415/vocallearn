# V2 Replay review — Camron walkthrough (2026-08-29)

Saved from chief chat after Mix proof session. Replays live under `web/captures/home/`.  
**Spec:** `web/HALO-V2-SUNDAY.md` · **Board:** `web/KEPT-BOARD.md`

---

## Replay sessions reviewed

| Folder | Duration | Frames | Notes |
| --- | --- | --- | --- |
| `2026-08-30T02-55-05-266Z` | 15s | 17 | Test replay — morph Home↔Chat |
| `2026-08-30T03-01-34-009Z` | **59s** | **32** | **Main round** — SEE/SAY, dots, typing, end |
| `2026-08-30T03-02-17-123Z` | 36s | 20 | Play sheet / WHO / cue |
| `2026-08-30T03-03-32-393Z` | 30s | 17 | (secondary take) |
| `2026-08-30T03-05-01-879Z` | 6s | 5 | **Day cap** line |
| `2026-08-30T03-06-01-973Z` | 28s | 17 | Play / dots |
| `2026-08-30T03-06-37-529Z` | 15s | 17 | Chat hold / travel |
| `2026-08-30T03-07-57-351Z` | 14s | 12 | Dark home / beads |
| `latest` | → `03-07-57-351` | | Pointer copy |

**Not captured:** dedicated harvest-tab replay folder; **r2 / r3** round ladder (only r1 exercised in film).

**Film limit:** JPG stills ~every 2s + travel burst (`travel` / `mid` / `late` / `land`). Sub-200ms UI (ink, dot fill) may fall between frames. `path.jpg` = chip motion at 80ms, not full UI.

---

## What shipped (all lanes)

### Lane A — `keep-memory.ts`
- Round index from **clears** (r1→r2→r3), not calendar lateness
- Clean round → schedule 1d / 3d / 7d; clean r3 → gold (mastered, off Keep dock)
- Miss at end of round → cluster stays due today, **no clear bump**
- Day cap: 2 rounds/day (`recordRoundOpen`)
- Home cap: 16 due chips
- Harvest merge must not demote due chips off Home

### Lane B — `HomeBubbles.tsx` + play CSS
- One tap = one round on existing 832px sheet, inner ~440px column
- SEE-all then SAY-all; r3 = two SAY beats (different prompts)
- Dot meter with SEE\|SAY gap (6 dots / 3 facts, 4 / 2 facts)
- Miss: `Not quite —` + quote, retry same beat, no red
- End: `You did good.` + recap + **Done** (no auto-dismiss)
- SAY underline, Enter only; r1 first-letter cue
- Wired `roundIndex`, `recordRoundOpen`, `finishRound`

### Chief
- Keep **3px inset** metal rims (bronze / silver / gold)
- Gold **◎ N** badge + static Kept panel
- Chat/header harvest stomp (no demoting due/gold)
- Distractor shape fixes + miner dedupe by token/answer
- Home due chips: 1px kind outline (~40%)

---

## Camron feedback → replay verdict

### ✅ Confirmed working (film + your notes)

| Item | Verdict |
| --- | --- |
| Core r1 round (SEE then SAY) | Works — frames show WHERE match, MEANING/WHO SAY, dots, cue `N—— —— ——` |
| Miss shows context quote | Works — `Not quite —` + emphasized span (film: basic but present) |
| End card + Done required | Works — structure matches spec |
| Progress to bronze after clean round | Works — beads move to Keep with rank |
| Gold / Kept panel list | Works — basic v1 acceptable |
| Day cap copy | Present in `03-05` — collides with greeting (see bugs) |
| Harvest stomp (no duplicate beads) | Fixed — re-enter Chat doesn’t duplicate header |
| Home↔Chat morph | Good — travel frames in multiple sessions |
| 16-seat cap | You verified |
| Dot count by cluster size (2–4) | You verified — layout issue only |
| Dark mode play card | Readable — stone gray on black (film confirms) |
| Keep 3px rims | Acceptable for v1 |
| Seating / harvest fly (first time) | No regression |

### ⚠️ Issues — priority order

#### P0 — Ship blockers (fix before calling V2 done)

1. **Light mode play sheet invisible / low contrast**  
   - **Replay:** `03-01` frames — card `#FCFCFB` on Paper field ~same value; band/sheet don’t separate from background.  
   - **Dark mode:** fine (`#2c2c2e`).  
   - **Fix:** Light sheet needs edge shadow, border, or slightly different body fill vs page (spec: shadow exists in CSS but page match is too close).

2. **Day cap line collides with greeting**  
   - **Replay:** `03-05` — cap at `top: 42%` overlaps “Good evening, Camron”.  
   - **Fix:** Move cap above chips or below greeting; don’t share vertical band with hero copy.

3. **No bank flight Home → Keep after round**  
   - **Your note:** beads “vanish with the card” then appear in header — no fly animation.  
   - **Code:** `LoopFlights` supports `mode: "bank"` but `HomeBubbles` only fires `mode: "drop"` (Keep→Home). `closeRound` calls `finishRound` + clears play with **no bank flight**.  
   - **Fix:** On Done (clean, not gold), animate chip positions → Keep pocket; gold uses 260ms dock fade per spec (no flight).

#### P1 — Strongly recommended before Early access

4. **Preview seed tokens are MC giveaways**  
   - e.g. token `Nile · 4,130 miles`, answers containing “Nile”, cluster-leaking cues.  
   - **Fix:** Lab-only cleanup in `PREVIEW_HOME_CHIPS` / harvest chips — answers without redundant token words; keep spans for harvest highlight only.

5. **SEE order = SAY order (too easy)**  
   - **Code:** `beatsFor` — all SEE in family order, then all SAY in **same** order.  
   - **Fix:** Shuffle SAY sequence independently of SEE (stable per round id).

6. **One miss grades whole round as miss (no progress)**  
   - **Code:** `hadMiss: true` → `finishRound(..., "miss")` — no clears bump for cluster.  
   - **Product:** Retry is per-beat (good); punishment is whole-round (harsh).  
   - **Options:** (a) keep miss on failed beats only, still award partial clear; (b) “clean round” = all beats eventually correct, miss doesn’t void; (c) status quo. **Needs Camron call.**

7. **Re-harvest flyer on every Chat entry**  
   - **Your note:** first fly OK; return to same Chat should **highlight only**, no repeat flight.  
   - **Code:** `demoHarvested` only gates auto-harvest once; manual replay + `beginHarvest` still flies.  
   - **Fix:** Track harvested chip ids per conversation; second visit = highlight spans, skip `HarvestFlights`.

8. **Dot meter off-center**  
   - **Replay:** dots left-aligned (`justify-content: flex-start` in `.compose-play-dots`).  
   - **Fix:** `justify-content: center` on dot row (keep left-align to 440 column if spec wants column edge — Camron prefers centered).

9. **r2 / r3 not tested on film**  
   - Need Mix replays after advancing clears (Due now × rounds or time cheat).  
   - r2 = SEE + SAY no cue; r3 = two SAY prompts only.

#### P2 — Polish / post-V2 or if time

10. **Miss quote UI** — small type; optional source line for trust (live Ask only; preview uses canned reply).  
11. **Gold badge** — small `◎`; future “achievements” menu (out of scope for v1 list).  
12. **End-card rank animation** — your ask: show metal band on recap rows before bead flies to Keep; gold gets special band + fly to badge. **New scope** — not in Sunday lock; park or mini-slice.  
13. **Harvest capture:** increase Film rate for play ink (optional `STILL_EVERY_MS` tweak) — not required if P0–P1 fixed.

---

## Miss-round behavior (for discussion)

**Camron lock 2026-08-29:** Partial credit + cluster split. Full spec: `web/V2-PARTIAL-CREDIT-LOCK.md`. Opus brief: `web/V2-OPUS-BRIEFS.md` Brief 1.

~~**Today:** Any miss during the round sets `hadMiss`. On **Done**, entire cluster gets `finishRound(..., "miss")` → stays due, **no** `clears++`.~~ **Superseded by partial credit lock.**

---

## Replay checklist — coverage

| ID | Scenario | Recorded? | Film notes |
| --- | --- | --- | --- |
| A1 | Full clean r1 round | ✅ `03-01` | SEE + SAY, dots, typing |
| A2 | Intentional miss | ✅ (your notes) | Quote visible; may be between frames |
| A3 | End card + Done | ✅ | Recap + Done in long take |
| A4 | Gold off dock + badge | ✅ (your notes) | Fade not visible at 2s film — needs slow Done dismiss take |
| B1 | Day cap 3rd tap | ✅ `03-05` | Copy confirmed; collision bug |
| C1 | Chat harvest fly | ⚠️ partial | Travel in `02-55`, `06-37`; no harvest-tab folder |
| C2 | Re-harvest stomp | ✅ (your notes) | No duplicate beads |
| C3 | Due outlines + Keep rims | ✅ `03-07` dark | Light-mode outline not re-filmed |
| D1 | Gold panel open | ✅ (your notes) | Not isolated in film |
| D2 | Badge at zero | ✅ (your notes) | |
| E1 | 16-seat cap | ✅ (your notes) | |
| E2 | 2-fact / 4 dots | ✅ (your notes) | Off-center |
| E3 | Dark mode | ✅ `03-01`, `03-07` | |
| — | **r2 round** | ❌ | **Gap** |
| — | **r3 round (dual SAY)** | ❌ | **Gap** |
| F | Safari manual | ? | Camron only |

---

## Can Composer 2.5 review Replays?

**Yes**, when:
- Frames exist in `web/captures/home/latest/` (or you name the timestamp folder)
- Visual QA rule loads (CSS / components / captures paths)

**Limits:**
- ~2s between routine stills; travel gets ~360ms / ~720ms extras
- I judge layout, contrast, copy placement, dot alignment — not 140ms ink timing
- For micro-motion, add a **slow Done dismiss** take or manual screenshot at peak

**Test replay (`02-55`):** pipeline confirmed working.

---

## Suggested fix lanes (model tiering)

| Work | Suggested model | Why |
| --- | --- | --- |
| Light sheet contrast, day-cap position, center dots | **Composer 2.5** | Small CSS, Visual QA |
| Wire bank flight on Done | **Composer 2.5** or **Grok 4.6** | Touches `HomeBubbles` + existing `LoopFlights` |
| Shuffle SAY order | **Composer 2.5** | ~10 lines in `beatsFor` |
| Preview token cleanup | **Composer 2.5** | `harvest.ts` fixtures only |
| Miss grading policy change | **Plan with Camron first** | Product call, then A lane |
| Re-harvest highlight-only | **Chief / Composer** | `ChatThread` + harvest state |
| End-card rank animation | **Post-V2** unless promoted | New motion scope |
| r2/r3 QA | **Camron Replay** then Composer review | Needs cleared chips |

---

## Still before “V2 released”

1. Fix **P0** (light card, day cap, bank flight)  
2. Film **r2** and **r3** (short takes)  
3. Camron **Safari** pass on rims + one round  
4. Composer **replay review** of fixes  
5. **Commit** implementation (planning already at `e0a5bb3`)  
6. **Promote** only when Camron says promote  

**Not blocking:** Luna routing, open facts, achievements menu, arc seating, replay from gold shelf.

---

## Next step

1. Camron picks **miss policy** (status quo vs partial credit).  
2. Chief or single worker takes **P0 CSS + bank flight** in one pass.  
3. Re-run **one replay** per fix (light round, day cap, Done dismiss slow).  
4. Then decide promote vs P1 polish batch.
