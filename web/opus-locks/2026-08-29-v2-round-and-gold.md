# Opus lock — partial credit + gold panel (2026-08-29)

Source: Brief 1 response. Merged into `V2-PARTIAL-CREDIT-LOCK.md` and `V2-GOLD-PANEL-PROPOSAL.md`.

## Partial credit

1. Headline always `You did good.` (3/3, 2/3, 0/3). No conditional headline.
2. Failed row: bead at current band, no ring upgrade, no flight; row ~55% opacity; no red, no "not passed" per row. Passed rows above failed. Optional section labels once: `Banked` / `Still working` — not per row.
3. Partial round = 1 of 2 day cap. First re-tap of same cluster remainder same day = **free** (same round). Second re-tap of same remainder = consumes other slot.
4. r3 partial fail on a fact → retry at **full r1** (SEE + SAY with letter cue), not r3 SAY-only. Fact re-enters schedule at r1.
5. End card: stagger band upgrades (60ms row reveal, 200ms ring per row), then **one batch bank flight on Done** — not fly while reading.

## Gold panel

6. Panel title **`Kept`** only. Summary carries mastered count (`7 mastered · …`).
7. Achievements strip → **post-V2**.
8. V2 panel = title + one summary line + fact rows. Cut by-type counts. Summary: `7 mastered · 24 rounds · 5 in progress`. Rows: prompt, answer, kind label; ~40vh scroll; not tappable; Esc/outside.
9. `roundsLifetime++` on every end-card dismiss (split OK). Free remainder retry does **not** increment.
