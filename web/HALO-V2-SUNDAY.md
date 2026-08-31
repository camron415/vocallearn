# Kept V2 — Lab lock (weekend slice)

If a weekend chat disagrees with this file, this file wins.
Product: **Kept**. Loop bank: **Keep**. Site: **Halo / Cove**. Do not rename.

Audience: wife + parents (Early access). Lab `/preview` until Camron says **promote**. Family `/ask` frozen.

Need: keep what they just asked. Closed tokens prove the loop. Open/gist GUI is **out** this weekend.

Gamification **5**: the **round** is the product. No XP, streaks, hearts, leagues, percent.

## Frozen (do not touch)

Paper look, harvest fly-to-header, Home↔Chat morph, Home chip **seating**, bead **diameter**. Harvest z-index 120. Morph `--travel` 1080ms.

The play sheet **stays composer width (~832px / `var(--halo-chat)`)** because the morph shares it. Proportion happens in a **centered inner content column capped at ~440px**; the sheet’s own edges are unchanged.

## The round

One Home tap opens **one round** on the existing sheet: the 2–4 fact cluster from a single Ask, run as **SEE (match) across all facts, then SAY (type) across all facts**. Three facts = six retrievals, 90–150 seconds. Items cross-fade at 220ms; the SEE→SAY transition gets no extra delay. **Day cap: 2 rounds.**

Nothing on screen but the kind band, dot meter, prompt, and answer surface. No fact counter, no timer, no score, no percent, no cluster name.

Home still **caps 16 due chips**; extras wait in Keep. Day cap only limits **rounds played today**, not how many chips sit on the field.

## Correct

Chosen pill (or typed answer) inks in the kind color over **140ms**, other options drop to 35% opacity, **hold 500ms**, advance 220ms. On a retry-correct the hold is **700ms**. No checkmarks, no "Correct!", no sound, no confetti.

## Miss — replaces "Not that one" and the 1s auto-advance

Wrong pill inks and locks over 120ms. Copy `Not quite —` on its own line, then the **harvested chat sentence** as a quote block with the answer span emphasized in the kind color, fading in over 180ms. Sentence **holds a minimum of 1600ms** and stays visible through the retry. The **same fact is re-asked in the same format** — no "Try again" button, the answer surface simply goes live again; the wrong pill stays locked. Sentence fades out 200ms after the retry lands. The correct answer is never revealed as a labeled answer. No red anywhere on this sheet, no X, no miss counter.

## Dot meter (replaces the hairline bar)

Six 8px dots at the left edge of the content column, 7px gap, with a **24px gap between dot 3 and dot 4** so SEE and SAY read as two groups. Filled = solid kind color; current = transparent with a 2px inset kind-color rim; upcoming = 10% black. Dots appear left→right at 30ms on round open and fill over **180ms on advance, not on answer**. A miss never regresses a dot and never turns it red — the dot fills when the retry lands.

2-fact cluster = 4 dots (gap after 2). Scale the mid-gap to the SEE|SAY split.

## Cue ladder — by round index, never by date

| Round | SEE | SAY |
| --- | --- | --- |
| r1 (~day 1) | 4-option match | type-in, first-letter cue |
| r2 (~day 3) | 4-option match | type-in, no cue |
| r3 (~day 7) | skipped | two SAY beats per fact — **different prompts** (see below) |

**r3 SAY prompts (never the same copy twice in one round):**

- **SAY-a:** full `chip.prompt`
- **SAY-b:** `chip.promptB` — a second standalone question for the same fact. **Never** reuse `prompt`. **Never** show `hint` as the prompt. If `promptB` is missing, use a kind-based second ask (`Give the year…` / `Which place…`) that is still different from SAY-a.

Dictate / speak on SAY-b is **post-V2** unless dictate already works on the play sheet without new UI.

**Closed grading (SAY beats):** one shared normalizer. Case-insensitive; strip punctuation; **commas in numbers optional** (`4130` = `4,130`); unit aliases (`m`/`meters`/`miles`/`km`) ignored when the target is numeric; leading `the` ignored; letter cue prefix ignored on r1. **Who:** last name or full name (not first-only). **Where:** drop Mount/Lake/the. **When:** digits. **Meaning:** numeric core if present; otherwise near-exact, 1-edit only if both sides are long. Document edge cases in a short comment block.

Cue renders in the placeholder as first letter plus em-dashes (`g—— —— ——`) at 32% opacity. No hint button, no difficulty label, no round number on screen. A miss never downgrades the cue mid-round. After a clean r3 the fact goes gold.

Calendar may *schedule* when r2/r3 become due. Difficulty is **round index**, not “how late they showed up.”

## End — replaces the 0.7s dump

Cross-fade the **content column inside the same sheet** at 260ms; the band stays, the six filled dots stay. Headline `You did good.` at ~28px/500. Beneath it one line per fact — `Egypt — gift of the Nile`, cue at 50% black, answer at 85% — staggered 60ms, 12px rows. Text button `Done` in the kind color, bottom-right of the content column. **No auto-dismiss.** No percent, no miss count, no time, no "next review in 3 days," no rank change, no share.

## Day cap

On the third chip tap of a day, one line fades in over the Home field at 200ms, dismissing on any tap or after 3000ms:

`That's enough for today. These are waiting for tomorrow.`

Chips stay visible and stay looking tappable but do not open. No modal, no countdown, no "continue anyway."

## Gold

Gold beads **leave Home on end-card dismiss** with the **same bank flight** as r1/r2 Keep (same 640ms chip, no harvest arc). Destination is the ◎ badge, not the Keep dock. On land the chip vanishes, the ◎ **pulses**, and the mastered count steps up. Keep dock fade stays for Mix tools. The badge sits immediately right of the Cove word on the same baseline: a small filled ring in the gold tone plus an integer (`◎ 7`); at zero it renders at 30% opacity with no number. Press opens a **plain panel anchored under the icon** — not a page, not an overlay over the field — at composer width, left-aligned inside: header `Kept`, summary line, then one static row per gold fact. **Rows are not tappable.** Dismiss on outside tap or Esc.

Keep dock = **in progress only** (new / bronze / silver). Sort silver → bronze → new, older left, newer right within a band. Do not gray bands.

## Visual pass (the whole visual scope)

1. **Rank on beads:** `box-shadow: inset 0 0 0 3px <metal>`, never `border`. Metals: bronze `#A0703C`, silver `#8C97A0`, gold `#B98A1E`. **Second channel** is type on the **sheet** (kind label + end-card answers), not lettering on the dots: bronze 400 / silver 500 / gold 600.
2. **Kind as a top band, not a full wash:** 44px band across the full 832px at ~18% kind alpha, radius `20px 20px 0 0`; card body `#FCFCFB`. Kind label in the band at ~11px, 0.08em tracking, weight 600, full-saturation kind color.
3. **Option pills:** press = `scale(0.985)` + `inset 0 1px 3px rgba(0,0,0,0.10)` over 90ms. Enter staggered 40ms apart, `translateY(6px)→0`, 160ms. Correct = kind at 22% fill + 2px inset kind rim + weight 600. Wrong = 18% black inset rim, 40% opacity, locked.
4. **SAY input is not a box:** no border, transparent background, `border-bottom: 2px solid <kind at 30%>`, centered text at the pill label’s size and weight, kind-color caret, focus thickens the underline to full alpha over 120ms. Enter only — no submit button — with a single 120ms underline pulse on send.
5. **Wide-card compensation:** `box-shadow: 0 8px 28px rgba(0,0,0,0.07)` under the sheet; optical center above vertical middle. Dot meter aligns to the content column’s left edge, not the sheet’s.
6. **Home, seating-safe:** due chips get a 1px outer edge in their kind color at ~40% alpha so due reads outlined and Keep beads read filled — same positions, same diameter.

Dark Paper: same rules, invert the 10% black / `#FCFCFB` to the existing dark paper fills.

## Mix proof before anyone calls this done

Due now → tap a Nile chip → all six items → Clear. Loop for the miss step (sentence appears, same fact re-asked), the clear step (end card holds indefinitely), and the mastered step (bead leaves dock, badge increments after dismiss). Due now ×3 → tap three chips for the day cap. Dot counts: 6 for a 3-fact cluster, 4 for a 2-fact.

## Out of scope

Replay from the shelf, per-fact history, sound, haptics, fireworks, mastery rings on Home, calendar UI, scorer GUI, any second overlay, extra exercise types, open/gist facts, XP, streaks, hearts, leagues, percent, Paper retune, promote unless Camron says promote.

## Known bugs (still fix this weekend)

- Lab Chat canned Nile harvest **must not** restamp existing due chips off Home (`addKeepChip` merge).
- Miner/Keep dedupe by token/answer, not prompt-only.
- Distractors same shape as the token (no phrase vs city, no miles vs km).

## Lanes (when Camron says go)

| Lane | Owns | Must not touch |
| --- | --- | --- |
| **A** | `keep-memory.ts`: round index, 1d/3d/7d after a **clean round**, day cap 2, gold off dock, harvest merge must not demote due | Play inner GUI |
| **B** | `HomeBubbles.tsx` + play CSS: SEE-all then SAY-all, miss, dots, end card, inner 440 column, pills, SAY underline | keep-memory math, harvest z-index, morph |
| **Chief** | KeepPocket 3px inset rims; HaloHeader gold badge + static panel; Chat harvest stomp; distractor copy; LoopSkin | — |
| **Camron** | Replay Mix proof, Safari rings, promote call | — |

Same working copy. File locks on `web/KEPT-BOARD.md`. Do not GitFlow.

## Post-Sunday (not blocking this ship)

Handoff: `web/V2-CHIEF-HANDOFF.md`.

- **Ask cost:** default GPT-5.6 Luna, web search off; escalate Grok 4.3 + search only when files, depth, or free live feeds are not enough. Luna search costs more per call than Grok — savings are cheaper tokens + fewer searches, not cheaper search.
- **Metering:** track tool invocations in spend (today `limits.ts` is token-only).
- **Cursor:** Composer 2.5 for planning/workers; premium models only with thin briefs. Do not load Visual QA contract on non-visual turns.
