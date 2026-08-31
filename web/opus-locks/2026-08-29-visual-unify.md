# Opus lock — visual unification (2026-08-29)

**Amended 2026-08-30:** Fill-first. Large cards = shadow, **no outline**. Hairlines on insets only, both modes (`rgba(0,0,0,0.05)` / `rgba(255,255,255,0.06)`). User bubble = inset, no border. AI bubble = card, no border. History/Settings = centered 832px card.

**Note:** Shot 8 is Chat light; no Kept-panel screenshot. Role 6 from V2-GOLD-PANEL-PROPOSAL.md.

## Three tokens (LoopSkin → consume everywhere)

**1. Page field** — Light `#FAFAF9`. Dark `#0E0E10`. No border/shadow. `home.css` (Home + Chat scroll), `overlays.css` (History/Settings bleed).

**2. Card / panel** — Light `#F3F2F0`, border `1px solid rgba(0,0,0,0.06)`, shadow `0 8px 28px rgba(0,0,0,0.07)`, radius 20px. Dark `#2C2C2E`, border `1px solid rgba(255,255,255,0.07)`, shadow `0 8px 28px rgba(0,0,0,0.45)`. Play sheet, History/Settings sheets, Kept panel, assistant chat bubble.

**3. Inset row / pill** — Light `#FCFCFB`, hairline `1px solid rgba(0,0,0,0.05)`. Dark `#3A3A3C`, no border. Text field dark `#171719`. MC options, History rows, Settings field, composer, Kept fact rows. Press: `scale(0.985)` + `inset 0 1px 3px rgba(0,0,0,0.10)`, 90ms.

**4. Stone** — unchanged (`var(--halo-stone)` / hover).

**5. Kind accent** — Band `color-mix(in srgb, var(--bead-{kind}) 18%, var(--paper-card))` light; 22% dark. Label full `var(--play-kind)`.

**6. Kept panel** — Card token at composer width; rows = inset; scroll 40vh.

## Mismatches

- Dark band ≠ bead hue → color-mix off `--bead-*`
- Light pills darker than card → flip roles 2/3
- Dark card ≈ page → card token
- History/Settings cool `#E9E9EC` → warm inset
- `#FCFCFB` moves from card body to inset

## TOP 5 ship order

1. Land three tokens in LoopSkin
2. Flip play card/pill light + dark
3. Rebuild band color-mix; delete dark band palette
4. Retint History/Settings/composer rows
5. Kept panel card + inset

## Do not change

Harvest fly, z-index 120, morph `--travel` 1080ms, chip seating, bead diameter, 832px sheet, 440px inner, bead fill, metal rim hexes, dot meter, stone hex values, fonts, type scale, radii.
