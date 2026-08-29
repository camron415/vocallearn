# Kept V2 — Sunday family slice

One page. If a weekend chat disagrees with this file, this file wins.
Product name: **Kept**. Loop bank: **Keep**. Site/project: **Halo / Cove**. Do not rename this weekend.

Audience: wife + parents (Early access). Not public. Not every mini-game. Not VocalLearn voice.

Gamification stays a **5**. Kingdom/monsters stay a metaphor in our heads, not the UI.

## What V2 must feel like

Ask something → facts harvest into Keep → next day (or Mix Due now) they sit on Home → you clear a cluster → beads rank up (bronze / silver / gold) → Home says You're clear. Miss stays on Home until you get it.

If that loop works on a phone in Safari, V2 is shippable. Extra games, extra practice, and six-month pulls wait.

## Sunday in / Sunday out

| In | Out until after Sunday |
| --- | --- |
| Closed facts: matching (have) + one harder step (type or cued) | Full 4×2 mini-game matrix |
| Open facts: harvest can *flag* them; one type-in paraphrase scored on meaning | Voice / production-effect as required |
| Due: real calendar interval after a pass (1d → 3d → 7d is enough) | Full SM-2 + 30/90/180 mastered pulls |
| Home still caps **16**. Extra due wait in Keep | Overflow UI / practice mode |
| 3 oks → gold / mastered mark we already have | Cove achievements sheet as a product |
| Thin You're-clear (have). No fireworks | Haptics, sound pack, Paper retune |
| Persist Keep (`halo-keep-v1` + server later if we have time) | Hybrid routing / cheap weather APIs |
| Lab `/preview` until Camron says **promote** | Public share, Reddit, Loom-to-strangers |

Cost: family Ask is already cheap. Do not add Grok+search on every review. Closed reviews are free. Open paraphrase: one cheap score call per card, cap it.

Promote to Early access only after Safari iPhone + Chrome desktop + Safari desktop on the real loop. Camron says the word.

## Review ladder (lock this)

Same three clears for both kinds. Games get harder as rank goes up. Long-term re-checks (months later) stay **easy confirmation**, not a harder boss. Extra-hard drills are a later Practice mode.

**Closed** (one word / short token — Nile, 1776) — **Lane B, same play card:**

1. Bronze — matching / multiple-choice (built). Do not restyle the shell.
2. Silver — cued: prompt + type the token, or a tighter choice set. **Inner area only.**
3. Gold — unaided recall: type (speak optional if dictate already works). **Inner area only.**

**Open** (a sentence in their own words) — **Lane C scores; Lane B’s card later:**

1. Bronze — meaning check: two or three paraphrases, pick the true one.
2. Silver — cued paraphrase: type 1–2 sentences, cheap model scores gist.
3. Gold — free recall: same scorer, less cue.

Do not build all six this weekend. **Must:** closed 1 (have) + closed 2. **Should:** open flag + scorer lib. **Skip tonight:** open GUI, speak-required, variation/application, monster UI.

## Play card contract (Lane B — GUI mutex)

There is **one** review surface for every rank and both fact types:

- Composer becomes `.is-play-lesson` and grows into `[data-halo-play-root]`.
- Shell stays: kind label, progress bar, prompt, verdict, kind wash, width `var(--halo-chat)`, grow `--travel` 1080ms.
- Ranks only swap the **inner** play (`.home-play-choices` / type field). No second overlay, no new route, no new card dimensions.
- Paper chrome, harvest z-index 120, morph, Keep dock, Home seats: frozen.

Lane C must not invent UI. Lane A must not invent UI.

## Scheduler (lock this)

- Pass → next due in 1 day, then 3, then 7. Third pass can mark mastered (gold) and **stop daily Home** for now.
- Miss → stays due today. No penalty theater on the chip.
- If more than 16 are due, Home shows 16; the rest wait. No second page.
- Mastered returning in 30/90/180 days: spec only, not Sunday code.

## Parallel work (file locks)

Do not put two agents on the same file. Camron merges and Replays.

| Lane | Owns | Must not touch |
| --- | --- | --- |
| **A Scheduler** | `web/src/lib/keep-memory.ts`, harvest chip `dueAt` / `clears` | HomeBubbles play UI, Paper CSS |
| **B Closed ladder** | `web/src/components/HomeBubbles.tsx` play card only | keep-memory scheduler, harvest miner |
| **C Open scorer** | new `web/src/lib/open-score.ts` + harvest kind/flag | LoopSkin, composer morph |
| **D Harvester QA** | `web/src/lib/learn-mine.ts` / harvest tests, fixtures | Visual CSS |
| **Camron** | Replay, Safari/Chrome, promote call, this spec | — |

Harvest z-index 120 and morph `--travel` 1080ms stay locked. Family `/ask` stays frozen until promote.

## Team (tonight)

| Role | Who | Does |
| --- | --- | --- |
| Release / QA | Camron | Replay, Safari/Chrome, promote call, first messages in tabs A and B |
| Tech lead | Chief chat (this long thread) | Spec, board, lanes C + D in-chat, merge advice |
| Backend | Tab A | Due intervals |
| Play GUI | Tab B | Closed silver/gold **inside the existing card** |
| Scorer | Chief → C | Library only |
| Harvest QA | Chief → D | Fixtures / miner, no CSS |

**Git:** trunk-based. Same working copy. File locks on the board, not four long branches. Do not GitFlow. Short branches only after Camron snapshots the current Lab Paper onto git. Two agents must never hold the same file.

Paste the whole file `web/lanes/A.md` or `web/lanes/B.md` as the first message in that tab.

Slack, extra MCPs, Atlas 24-7: skip. Desk: `web/KEPT-BOARD.md`. Max two extra tabs (A and B). C and D run from the chief chat.

## Done when

A family member can: ask → see beads → next session Home has due chips → play bronze then a harder closed card → miss stays → pass ranks the ring → empty Home says You're clear. Open facts may still be MC-only if the scorer missed the cut.
