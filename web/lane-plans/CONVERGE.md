# Plan-wave converge (chief, 2026-09-06)

All eleven `web/lane-plans/0*.md` files exist. This file is the merge. **No src until Camron says go.**

## Cross-lane locks (do not reopen)

- **No same-day Home due.** Encoding is in-chat. First Home due stays next local calendar day. (Lanes 3, 4, 10)
- **Do not promote HarvestLock as-is.** Redesign thin lock-in (Lane 4). Skip still saves; skip is not a peer CTA. No token list before picks.
- **Do not bundle** intent + Luna + lock-in + hamburger + daily-40 into one `--prod`. (Lane 11)
- **Do not promote `ask-guard` until `ask_hold` can UPDATE/release.** Current lab inflight can stick ~3 minutes. (Lane 7)
- **Native frozen.** No TestFlight, no SM-2, no `proposed_facts` → Keep. (Lane 9)
- **Lists / Teach-me / streaks / Stripe / iOS parked.** (Lanes 8, 10)
- Frozen craft: harvest z-index 120, morph 1080ms, Paper, beads, seating. AskShell parked.

## Order correction vs original head list

Original: harvest → encode → inspect → copy → Luna.

**Converged (Lane 10 attack accepted):**

1. Harvest precision (lab, then promote packet)
2. Quiet first-harvest line **with** harvest (copy is cheap; wife already asked)
3. Bead inspect (uncoached “what flew”)
4. Thin lock-in (quality / encoding)
5. Phone hamburger + fly-trust + honest mic
6. Money walls (`ask_hold` real, then daily-40)
7. Luna (cost, after harvest is honest)
8. Kill LearnReview whenever a header-touching ticket ships

Inspect before lock-in for the **proof** gate. Lock-in before Teach-me for the **quality** gate.

## Implementation wave (max 8 tickets)

Chief is the only `KEPT-BOARD.md` writer. Workers write `web/lane-plans/status/NN.md`.

| ID | Name | Owner | Files (lock) | Hitchhikers off |
| --- | --- | --- | --- | --- |
| **T1** | Harvest precision (dual-gate, intent filter, dump fixtures, classify off first-token path) + intent `saveOffer` for recipes | 2 (+ 1 for `route.ts` await; 8 for offer wiring) | `learn-mine.ts`, `harvest-policy.ts`, `ask-intent.ts`, family-review/fixtures; Lane 1 only `chat/route.ts` classify-await; `save-offer.ts` / ChatThread offer | lock-in, caps. Luna stays on in lab. |
| **T2** | First-harvest line (H1: `Kept — these come back tomorrow.`) | 5 + 10 copy | `ChatThread.tsx` (line only), small CSS | Lock-in, AskShell |
| **T3** | Bead inspect panel | 5 | `KeepPocket.tsx`, `HaloHeader.tsx`, paper CSS | Library facts tab |
| **T4** | Keep cap honesty + inspect/overflow reads + `finishRound` tests | 3 | `keep-memory.ts`, new `keep-memory-check.ts`, `v2-lib-check.ts` | Same-day due, SM-2 |
| **T5** | Thin HarvestLock (paper, delay after full answer, persist if they leave) + SEE-miss soften + delete LearnReview | 4 | `HarvestLock.tsx`, `ChatThread.tsx` slot, `HomeBubbles.tsx` play only, `HaloHeader.tsx` unmount, delete `LearnReview`/`KeepAlbum` | Promote lock-in, play sheet in chat, mixer copy |
| **T6** | Phone: ChromeMenu + fly unless OS-reduce; keep mic; honest error if a tap fails | 6 | `ChromeMenu.tsx`, `HaloHeader.tsx`, `ChatThread.tsx` reduced flag; `DictateButton.tsx` errors only | Capacitor, AskShell, hiding the mic |
| **T7** | `ask_hold` RLS/service-role + SQL SUM; then caps packet | 7 + 1 | `ask-guard.ts`, `usage.ts`, migration, `ask-turn.ts` claim-once | Luna in same ship |
| **T8** | Ops hygiene: HARVEST-OPS packets, `* 2.ts` delete, prod `HALO_USE_LUNA=0` | 11 | docs, gitignore, tsconfig, delete duplicates | Feature promote in same commit |

**Serial on `ChatThread.tsx`:** T2 (line) → T5 (lock-in slot) → T6 (`reduced=`). Do not run those three in parallel.

**Serial on `HaloHeader.tsx`:** T3 inspect + T5 unmount LearnReview + T6 hamburger — one owner at a time or one combined header pass after T3 spec.

## Promote packets (Camron magic word each)

1. Intent harvest + H1 (after live export, not canned 8/8)
2. Bead inspect (+ Keep cap if ready)
3. Thin lock-in (after Mix proof)
4. ChromeMenu + fly-trust + mic honesty
5. Cost guards (after T7 hold-release)
6. Luna (`HALO_USE_LUNA=1` only then)

## Score movement if this wave ships (family, after promote)

| Lens | Now | After wave (honest) |
| --- | ---: | ---: |
| Family Ask | 6 | **7** |
| Uncoached learning loop | 4 | **6–7** |
| Craft | 8 | **8** (protect) |
| Harvest live | 5 | **7** if live dump clears socks |
| Encoding | 4 | **6** with thin lock-in |
| First-session | 4 | **6** with H1 + inspect |
| Keep collection | 6 | **7** with inspect |
| Mobile Safari | 6 | **7** with hamburger + fly |
| Cost live | 5 | **7** after guards |
| Teach-me / habit pings / business | 2 | **2** (intentional) |

This is a **comprehension + trust** step, not a growth step. Spread-ready only after three uncoached family rounds (Lane 10 T10.5).

---

## Camron lock (2026-09-06 ~22:10, this chat)

Do not reopen. Implement wave follows this, not the original lane-plan disagreements.

**Paper.** Any new UI (bead inspect, lock-in, first-harvest line) uses existing paper tokens: `--paper-card`, inset hairline, same radius/shadow as harvest-lock / menu-sheet / play. No new glass, no alien popover, no second design language. Hover on desktop is a peek; tap/click opens the same paper panel on phone and desktop.

**Luna + intent stay the lab method.** Do not revert family-lab to live Grok-only harvest. Pipeline: classify → `intentAnswerGuide` (practical / direct / teach_light) → Luna answers shallow/teach, Grok for files / depth / search → miner. Classify and miner stay Grok-none unless a later ticket moves them. **Lab uses Luna from the first implement tickets** (already wired). Family promote of Luna is still its own packet after harvest chips are honest — not because Luna is optional, because we will not ship cheaper answers onto still-wrong chips.

**Beads / Keep.** Clickable. Desktop hover may show the token. Phone is tap. Inspect is a small paper panel (prompt, answer, rank), not a sheet-as-page.

**Lock-in timing.** After the **full answer is on screen**, not during stream, not the same frame as the last token. Short read beat, then the paper card. If they leave the chat or close the phone, the pending lock-in **comes back** on that conversation; facts still land in Keep so walking away does not lose the harvest. Skip still saves. Design must match Paper play, not mixer copy.

**Mic.** Camron: iPhone dictation **mostly works**. **Do not hide or disable the mic.** T6 is hamburger + fly-trust (OS reduced-motion only). Honest error copy if a tap actually fails; no “Safari can’t dictate” lie.

**Recipes.** Keep Library opt-in (tap to save). Tie **offer** to intent: if classify says this turn is a recipe / practical cooking, show Save-this-recipe more reliably; still `harvest=false` so cooking does not become Keep chips. Regex stays a fallback, tightened (drop bare `dinner` / lone `cups`). No auto-write to Library. No Facts tab.

**Native / Teach-me / streaks / Stripe / iOS.** Frozen. Inspect + named tomorrow is the clarity this month.

**Ship.** Lab only (`deploy:lab` / local / `/preview` as specified). **No early access / `--prod` until Camron says promote.** Packet-by-packet after QA. Extensive test before any packet.

**T6 correction:** drop “hide iPhone mic.” Keep DictateButton.

**T5 addition:** persist pending lock-in per conversation; delay after stream complete; paper chrome.

**T1 hitchhiker (Lane 8):** `AskIntent` may carry `saveOffer: "recipe" | null` from classify (no extra model call). ChatThread prefers that over `detectSaveOffer`, regex fallback.
