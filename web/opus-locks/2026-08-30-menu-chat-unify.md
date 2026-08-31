# Menu + chat Paper unify — implemented lock (2026-08-30)

Lab `/preview?look=paper` only. Family `/ask` untouched. Build green, all 8 opens
browser-verified at 1920×1080 (see §7).

## 1. Transition — pattern A, one shared component, two anchors

`web/src/components/MenuSheet.tsx` (new) owns the motion for **both** menus on
**both** pages. History and Settings pass only content; they no longer own an
overlay, a portal, Escape, or the body scroll lock.

| | Home | Chat |
| --- | --- | --- |
| Anchor | `.ask-hero .compose` (Ask composer) | `.compose-dock` (follow-up composer) |
| Enter | pill at the composer rect → card at rest | identical |
| Exit | card → back down into the same pill | identical |

Anchor resolution is one query, dock first (`.compose-dock` ?? `.ask-hero
.compose` ?? `.compose`), so Chat and Home run the same code path and cannot
drift. Measured: Home composer top 570 → card top 279; Chat dock top 1002 →
card top 279. Same width (832) at both ends of the morph, so the sheet only
grows vertically — no horizontal slide, no scale distortion.

**Why grow-and-pin instead of a CSS-only `max-height` sheet:** the menus are
centered in a full-viewport layer, so growing height alone would re-center the
card every frame and the pill would drift away from the composer. `MenuSheet`
measures the resting rect, pins the card (`position: fixed` at that rect), then
animates `height` + `translateY` + `border-radius` + `background-color` +
`box-shadow` from the composer pill. Inline styles are dropped on `transitionend`
(timer backstop) so the card goes back to normal flow and can scroll.

Timing — new tokens, play sheet untouched:

- `--menu-grow: 520ms`, `--menu-shrink: 380ms`, easing `--ease-travel`
  (`cubic-bezier(0.33, 0.04, 0.2, 1)`) — the play-sheet curve, shorter duration.
- Play sheet `--travel` stays 1080ms. Morph `--travel` stays 1080ms.
- Content fades in at 300ms with a 170ms delay (same read as the play body).
- `html[data-halo-motion="soft"]` and `prefers-reduced-motion` skip the morph
  entirely: veil + card cross-fade, no pin, no inline geometry.

**Composer handoff:** while a sheet is live, `<html data-halo-sheet="1">` fades
the source composer out (240ms). The attribute is dropped at the *start* of the
shrink so the composer fades back in while the sheet is still travelling down to
it. Guarded with `:not([data-halo-play="1"])` so a play round can never lose its
composer.

**Field behind:** stays visible. Veil is field at 94% + `blur(6px)` — the chips
and the thread ghost through, which is what makes it read as reversible instead
of a new page. Full-opaque veil was the old "disconnected overlay" tell.

## 2. Tokens

| Role | Light | Dark | Border | Shadow |
| --- | --- | --- | --- | --- |
| field | `#FAFAF9` | `#0E0E10` | none | none |
| card | `#F3F2F0` | `#2C2C2E` | none | `--paper-card-shadow` |
| inset | `#FCFCFB` | `#3A3A3C` | hairline `rgba(0,0,0,.05)` / `rgba(255,255,255,.06)` | none |
| **sunk** (new) | `#ECEBE7` | `#3A3A3C` | none | none |

`--paper-sunk` is the one addition. A chat bubble gets no hairline, so in light
the inset value (`#FCFCFB`, 2 steps off the field) left the user bubble
invisible — the whole reason light and dark did not read with equal weight.
`--paper-sunk` is the recessed fill for no-hairline surfaces; in dark it equals
inset because that value already separates. Only consumer today: `.msg--user`.
`--paper-inset` itself is unchanged, so the frozen play round keeps its exact
pill fill.

Also retinted: History row hover / current were the cool stone tokens
(`#F4F4F7` / `#4A5562`) and read blue on Paper — now
`color-mix(in srgb, var(--halo-ink) 6% / 12%, var(--paper-inset))`.

## 3. Per surface

- **Home field** — `--paper-field`, no border, no shadow.
- **Composer (both)** — inset fill + hairline, radius 28px, `--halo-chat` wide.
- **History card** — shared shell: card fill, radius 20px, card shadow, no border.
- **Settings card** — same shell, `settings-page` only adds grid/gap.
- **Chat user** — sunk fill, no border, no shadow.
- **Chat AI** — card fill, no border, no shadow.
- **Chat scroll** — field.

## 4. Light/dark parity rule

Fill separation carries the hierarchy in both modes; a hairline is allowed only
on inset rows, pills, and composers, never on a card or a bubble — so if a
surface loses its hairline it must move to a fill that stands on its own
(`--paper-sunk`).

## 5. Shared shell

- Shared: card, header row (title left, stone `Close` right), 11px / 0.08em /
  600 / uppercase / 55% ink section labels, radius 20px, `--halo-chat` width.
- Title stays Fraunces but drops to `clamp(1.5rem, 2.6vw, 1.8rem)` in both
  menus, so it reads as a sheet header rather than a page H1 from another site.
- History only: `CHATS` label + `Remove` on one `menu-block-head` row (was a
  bare pill floating under the title), inset rows, paper hover.
- Settings only: inset name field, stone segmented / active `#171719` light,
  `#F3F2F0` dark.

## 6. Files

| File | Change |
| --- | --- |
| `components/MenuSheet.tsx` | new — shell, anchor, morph, Escape, scroll lock |
| `components/HistoryMenu.tsx` | uses `MenuSheet`; label+Remove row; `onEscape` keeps pick-mode backout |
| `components/SettingsMenu.tsx` | uses `MenuSheet`; sections unchanged |
| `styles/overlays.css` | menu tokens, veil, grow states, title, `menu-block`, paper hover |
| `styles/chat.css` | user bubble → `--paper-sunk` |
| `components/LoopSkin.tsx` | `--paper-sunk`, user bubble, veil, title, seed state, composer handoff, paper hover |

## 7. Verified (browser, Lab `/preview?look=paper`)

Home History L · Home Settings L · Home History D · Home Settings D · Chat
History L · Chat Settings L · Chat History D · Chat Settings D — all open at
832px, top 279, same shell in both themes. Plus: grow sampled from both anchors
(Home 564→279, Chat 862→279), Escape mid-flight, backdrop dismiss, soft-motion
path, inline styles cleared after open (`style=""`), body overflow restored,
play round still grows from the composer with its own 1080ms.

## 8. Not changed

Play/review round, Home↔Chat thread morph and `--travel` 1080ms, harvest / bank
/ gold flights, harvest z-index 120, chip seating, bead colors and metal rims,
inline chat kind highlights, stone hex values, fonts, `--paper-inset`,
`--paper-card`, `--paper-field`, Family `/ask`.
