# Gold progress panel — locked (Opus 2026-08-29)

**Status:** V2 scope locked. Achievements + by-type → post-V2.

Expand `GoldKeptBadge` dropdown only. Composer width. Paper. Not a new page.

---

## V2 panel (ship this)

```
┌─ Kept ─────────────────────────────┐
│ 7 mastered · 24 rounds · 5 in progress │
├────────────────────────────────────┤
│ [prompt]                           │
│ answer · When                      │
│ … scroll max ~40vh …               │
└────────────────────────────────────┘
```

1. **Title:** `Kept` (not `Mastered — n` — summary holds the count).
2. **Summary:** one line — `{n} mastered · {roundsLifetime} rounds · {inProgress} in progress`
3. **Fact rows:** `chip.prompt` primary, `chip.answer` secondary, kind label (`KIND_LABEL`). End-card voice. Not token|answer columns.
4. Scroll ~40vh. Rows not tappable. Dismiss Esc / outside tap.

## Data (`keep-memory.ts`)

- `roundsLifetime` — increment on end-card dismiss (split OK); not on free remainder retry.
- `inProgress` — count banked Keep beads (in-progress dock).
- `mastered` — gold/mastered chips.
- Rows — mastered chips only in list.

## V2 polish (Camron — no achievements yet)

- **◎ badge** slightly larger / more visible when count > 0.
- **Keep dock beads** slightly larger so 3px metal bands read; kind color still visible.
- **Gold dismiss** uses fade to badge (not bank flight to Keep) — different motion from passed facts.
- **Bead hover tooltip** (token on hover): **post-V2** — skip for now unless trivial.

## Files

`GoldKeptBadge.tsx`, `LoopSkin` gold-kept-* CSS, `keep-memory.ts` (counter + readers). Chief lane. No play sheet, harvest, morph.
