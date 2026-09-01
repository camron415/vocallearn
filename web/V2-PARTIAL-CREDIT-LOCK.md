# V2 partial credit — locked (Opus 2026-08-29)

**Status:** Locked. Supersedes whole-cluster miss. Camron + Opus aligned.

---

## Core rule

Cluster round **splits** at Done: passed facts bank to Keep; failed facts stay on Home as individual due chips.

Grade **per chip** when round ends (each chip passed = SEE+SAY complete for that chip in session; r3 = both SAY beats).

---

## During the round

- Miss: `Not quite —`, quote, retry same beat until correct.
- Other facts continue.
- Chip **passed** only when all its beats in this session are correct.

---

## End card

**Headline:** always `You did good.` — never “Almost” or score-y variants.

**Rows (passed above failed):**

| Passed | Failed |
| --- | --- |
| Full opacity; bead shows **upgraded** band | ~55% opacity; bead at **current** band, no upgrade |
| Band animates on card (stagger) | No ring upgrade, no flight |
| Included in batch flight on Done | Stays on Home when sheet closes |

Optional **one** pair of section labels above the list (not per row): `Banked` / `Still working`.

**Animation sequence:**

1. Rows appear staggered **60ms** apart.
2. Each passed row: band ring upgrades over **200ms**.
3. User reads; taps **Done**.
4. **One batch** bank flight for all passed chips (sheet empties as panel closes).

---

## After Done

| Chip | Home | Keep | Schedule |
| --- | --- | --- | --- |
| Passed | Leaves | Bank flight | `clears++`, 1d/3d/7d |
| Passed → gold | Leaves | Fade to ◎ badge | Mastered |
| Failed | Stays due | — | No clear; see r3 rule below |

**Re-tap failed:** shorter round = only missed chips from that cluster; each runs **SEE + SAY** (even if only SAY failed before).

**r3 partial fail:** that fact drops to **r1 shape** on retry — SEE + SAY with letter cue. Not bare r3 SAY beats. Re-enters at r1 on schedule.

---

## Day cap (Camron amend 2026-08-29)

- **3 rounds per day** (was 2 in Sunday spec — update `DAY_ROUND_CAP`).
- Opening a cluster round consumes **1** slot (even partial pass).
- **First** re-tap same day to finish the **same cluster’s remainder** = **free** (same round).
- Further re-taps of that remainder consume slots until day cap hit.
- Fourth open attempt (after free retry logic) → blocked; B shows day-cap copy.

Lane A tracks: `roundsToday`, cluster id, `remainderFreeUsed` per cluster per day.

---

## r3 fail → r1 retry

On partial fail at r3: next round for that chip is **full r1** (SEE + SAY with cue). Reset **round index** to r1 in scheduler (`clears` / schedule as Opus: re-enters at r1). **Visually** bead shows **bronze or new** band (downgrade representation) until they pass again.

---

## roundsLifetime

Increment **once** on end-card dismiss (any split). Not only clean sweep. **Do not** increment on free remainder retry.

---

## Lanes

| Lane | Work |
| --- | --- |
| A | Per-chip `finishRound`; split; day-cap remainder token; `roundsLifetime`; r3-fail → r1 reset |
| B | End card rows, sections, stagger, batch flight on Done, dot center |
| Chief | P0 CSS; gold panel; harvest highlight |
