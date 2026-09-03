# Patch 1.1.2-mobile — iPhone header + recipes scroll

**Shipped:** 2026-09-03 · **Ring:** Early access (production)

Mobile-only CSS (`max-width: 720px` / `640px`). Desktop unchanged — header still shows text labels; icon SVGs are hidden above the breakpoint.

## Fixes

1. **Recipes scroll** — `/recipes` body scrolls inside `100dvh` ask-stage on phone (`ask-stage--page-scroll`).
2. **Header crowding** — tighter icon buttons, smaller Keep pocket, left fade on clipped beads, no bleed over ◎ Kept.
3. **Icons (phone only)** — Library ≡, History clock, Settings gear.

## Files

- `RecipesBoard.tsx` — page-scroll class
- `HistoryMenu.tsx`, `SettingsMenu.tsx` — icons (hidden on desktop)
- `motion.css`, `overlays.css`, `LoopSkin.tsx` — `@media` mobile rules only

## QA

- iPhone Safari via `dev:lan` — Camron sign-off 2026-09-03
- `npm run test:harvest` + `npm run build` before deploy
