# V2 Opus 5 — thin brief queue

**When to use Opus:** One ambiguous product lock per call. **Not** for CSS tweaks or wiring existing components.

**Format:** Paste **Brief 1** below into Opus. Ask for **≤500 words** output → save reply under `web/opus-locks/2026-08-29-v2-round-and-gold.md`. No repo. No full Sunday spec.

**When to skip Opus:** Dot centering, light-mode shadow, bank flight wire-up, preview token strings → **Composer 2.5** + Replay.

---

## Brief 1 — Partial credit + gold progress panel (PASTE THIS)

```
Product: Kept / Halo Lab. Weekend V2. Paper skin. Composer-width panels. No XP, streaks, percent, replay.

── A. Partial credit (replaces whole-cluster miss) ──
Home tap → round on 832px sheet. Cluster 2–4 facts. SEE all, then SAY all.
- Grade per fact at Done. Passed: clears++, schedule 1d/3d/7d, leave Home, end-card row shows band upgrade then bank-flight to Keep.
- Failed: stay on Home alone; cluster splits. Re-tap = round of only missed chips; each still runs full SEE+SAY (even if only SAY failed before).
- End card: fact left, bead right; pass vs not passed. Headline today: "You did good."

── B. Gold ◎ panel (expand existing badge dropdown; not a new page) ──
Sunday lock today: "Kept — n", static rows token|answer, no achievements.
Camron proposal:
1. Header "Mastered — {n}" (unless you recommend Kept)
2. Summary: mastered | rounds lifetime | in progress (Keep dock count)
3. Achievements: mastered milestones 1/5/10/25 → bronze/silver/gold/diamond rings; earned=full+check, locked=25% opacity; no bars
4. By-type counts: when/where/who/meaning with kind color
5. Fact rows: prompt primary, answer secondary, kind label — match end-card voice; scroll ~40vh; not tappable; Esc/outside dismiss
Data: roundsLifetime counter on clean round dismiss; rest from chips[].

── Frozen ──
Gold bead leaves dock with fade to ◎ (no harvest arc). Day cap 2 rounds. Keep dock = in-progress only.

── Questions (bullets only) ──
Partial credit:
1. End headline when 2/3 pass?
2. Failed row visual on end card?
3. Partial round counts toward day cap?
4. r3 partial fail: retry both SAY beats?
5. Animate band then fly per row, or stagger all then batch fly?

Gold panel:
6. "Mastered" vs "Kept" header?
7. Is achievements strip V2 or post-V2 given minimal Sunday lock?
8. Too dense for one panel (summary + achievements + by-type + list) — what to cut for V2?
9. roundsLifetime on partial-clean (some facts pass) — count or not?

Output: numbered decisions only. No code. ≤500 words.
```

---

## Brief 2 — Light mode play sheet contrast

```
Lab Paper. Play sheet #FCFCFB on field ~#e8e8ed — invisible in light; dark #2c2c2e OK.
Keep 832px sheet, 440 inner, kind band 18%, shadow 0 8px 28px / 7%.
One fix: border vs fill vs page tint. 3 bullets max.
```

---

## Brief 3 — Re-harvest Chat behavior

```
First Chat visit: harvest flies to Keep. Return: no duplicate beads; highlight spans only, no second flight.
Highlight style that won't read as harvest? 2 bullets.
```

---

## Brief 4 — Visual unification (PASTE THIS + 8 screenshots)

Capture all 8 below on Lab `/preview`. Attach in order; paste the label line in the same message.

**Use a NEW Opus chat** — do not continue the partial-credit / gold thread. Brief 4 is self-contained; a fresh chat is cheaper and keeps Opus from re-deciding product rules.

### Screenshot checklist (attach in this order)

| # | What to capture |
| --- | --- |
| 1 | **Home — light** (due chips + Keep beads visible) |
| 2 | **Home — dark** |
| 3 | **Play sheet — dark** (SEE / multiple-choice step; kind band visible) |
| 4 | **Play sheet — light** (SEE / multiple-choice; same kind as 3 if possible) |
| 5 | **Play sheet — light** (end card / “You did good.” + Done) |
| 6 | **History** menu open (light) |
| 7 | **Settings** menu open (light) |
| 8 | **Chat** preview (thread + composer dock; Attach / Dictate / Ask visible) |

**Paste with images (one line):**  
`1 Home light · 2 Home dark · 3 Play MC dark · 4 Play MC light · 5 Play end card light · 6 History light · 7 Settings light · 8 Chat light`

```
ROLE: Senior product/design lead. Paper skin. Kept/Halo. No repo. No redesign.

INPUT: 8 screenshots in order (see labels above).

CONSTRAINTS: No code. ≤500 words. Numbered output only. This brief guides Grok 4.6 implementation — be specific enough to code from. Do NOT propose a new design system, rebrand, or layout change.

── FROZEN DESIGN LANGUAGE (do not change) ──
Product: Kept. Site: Halo / Cove. Skin: **Paper** (Lab `/preview` until promote).
- **Not** Material, not iOS glassmorphism, not neumorphism, not a new palette.
- **Composer width ~832px** (`var(--halo-chat)`). Play sheet = same width as chat morph; inner content column ~440px centered.
- **Stone interactive pattern:** `stone-btn` — pill `border-radius: 999px`, fill `var(--halo-stone)`, hover `var(--halo-stone-hover)`. Used by History, Settings, Attach, Dictate, Ask, Done. No lift, no drop shadow on buttons.
- **Kind color** only on: bead fill, 44px top band on play sheet (~18% kind alpha), SAY underline, end-card accent, due-chip 1px outline. Never full-card wash.
- **Kind band vs bead (IMPORTANT — review in screenshots):** For the same fact kind (when/where/who/meaning), the play-sheet top band and the Home bead/chip must read as the **same hue family** — band = muted tint (~18% alpha of bead hue), bead = full saturation. If screenshots show the band looking like a different color than the bead (wrong hue, not just lighter), flag it and prescribe token-aligned fixes (e.g. band from same `--bead-*` at ~18%, not a separate palette).
- **Beads:** 3px inset metal rims (bronze `#A0703C`, silver `#8C97A0`, gold `#B98A1E`). Keep dock = in-progress only. Gold = ◎ badge right of Cove.
- **Play sheet:** kind band + stone/gray card body; MC pills slightly lighter than card; SAY = underline only (no text box). Shadow `0 8px 28px rgba(0,0,0,0.07)` on sheet.
- **Dark Paper:** invert light grays — card ~`#2c2c2e`, pills ~`#3a3a3c`, field stays near-black. Same structure as light, not a different layout.
- **Motion:** harvest/bank flights exist; no confetti, no XP, no streaks, no percent, no new animations.
- **Out of scope:** new fonts, new icons, achievements UI, seating changes, bead resize, promote.
- Kept panel: not in screenshots — use V2-GOLD-PANEL-PROPOSAL.md if prescribing ◎ panel surfaces.

TASK: **Unify existing surfaces only** — assign each UI role light/dark fills so Home (1–2), play card (3–5), History (6), Settings (7), and Chat composer (8) feel like one Paper family. Call out mismatches; prescribe hex/rgba fixes. **Compare play-sheet kind band (3–4) vs Home bead for the same kind (1–2)** — same hue family; band = ~18% alpha of bead, not a different color. Use shot 5 for end-card + Done stone hover.

Roles to define:
- Page field, card/panel, inset row/pill, interactive hover (stone), kind accent (band/outline only)

OUTPUT per role:
1. Role name
2. Light fill + border/shadow
3. Dark fill + border/shadow
4. Hover rule (must match stone-btn)
5. CSS areas only (home.css, overlays.css, LoopSkin — file names, not code)

End with: TOP 5 fixes in ship order for one Grok 4.6 pass. Explicitly list what NOT to change.
```

Save reply to `web/opus-locks/2026-08-29-visual-unify.md`.

---

## Brief 5 — Menu + chat Paper unify (PASTE THIS)

**Full package:** `web/V2-OPUS-BRIEF-5-MENUS.md` (screenshot list + prompt + handoff).  
**Save reply:** `web/opus-locks/2026-08-30-menu-chat-unify.md`

Scope: Home/History/Settings/Chat surfaces + menu transitions. **Not** play round, Home↔Chat morph, harvest, highlights.

---

## Do NOT send to Opus

| Item | Do instead |
| --- | --- |
| Closed SAY grading rules | `V2-CLOSED-GRADE-LOCK.md` + Composer fix |
| Done / ◎ hover | Composer (stone-btn pattern) |
| Center dot meter | Composer |
| Bank flight wire-up | Composer |
| Preview token cleanup | Composer |
| SAY order shuffle | Composer |
| Safari rims | Camron + Replay |

---

## After Opus replies

1. Save to `web/opus-locks/2026-08-29-v2-round-and-gold.md`
2. Paste here → chief merges into `V2-PARTIAL-CREDIT-LOCK.md` + amends `HALO-V2-SUNDAY.md` § Gold
3. Delegate: P0 CSS (Composer) → partial credit (A+B) → gold panel (chief) → Replay

**Staging docs:** `web/V2-PARTIAL-CREDIT-LOCK.md`, `web/V2-GOLD-PANEL-PROPOSAL.md`
