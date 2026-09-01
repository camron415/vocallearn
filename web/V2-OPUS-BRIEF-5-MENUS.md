# Opus Brief 5 — Menu + chat Paper unify (one-shot)

**Use:** New Opus chat. **Medium** thinking. Attach **12 screenshots** (list below) + paste **PROMPT** block only.  
**Do not** attach repo, Sunday spec, or Brief 1–4 threads.

**Save reply to:** `web/opus-locks/2026-08-30-menu-chat-unify.md`

**After Opus:** One Grok/Cursor pass implements the lock. Implementer **must** open each menu in Lab preview and screenshot before reporting done.

---

## Why prior passes stalled (code audit — for you, not Opus)

| Issue | Cause |
| --- | --- |
| Light/dark feel different | Rules split across `LoopSkin.tsx` (`!important`), `overlays.css`, `skins-paper.css`, `tokens.css` dark overrides |
| History/Settings “not Paper” | Portal overlay (`history-overlay` → `body`), not morph-linked to composer; serif page title reads like a separate site |
| Fill vs border still off | Brief 4 said card border; follow-up said shadow-only — implementers mixed both |
| Chat bubbles drift | `chat.css` + `tokens.css` + `LoopSkin` all touch `.msg--user` / `.msg--assistant` |
| Transitions absent | History/Settings `animation: none`; play sheet uses composer grow (`--travel` 1080ms) — menus don’t share that motion language |

**In scope files (implementation later):** `LoopSkin.tsx`, `overlays.css`, `chat.css`, `HistoryMenu.tsx`, `SettingsMenu.tsx` (structure/classes only).  
**Frozen files:** `HomeBubbles.tsx`, play round GUI, `harvest*`, `keep-land.ts`, morph `--travel` value, z-index 120, chip seating, bead colors/rims, inline chat highlights (`.answer` kind spans), bank/gold/harvest flights.

---

## Screenshot checklist (attach in order, Lab `/preview?look=paper`)

Capture **light** and **dark** for each. Hide preview mixer (Hide) and collapse Next.js dev overlay.

| # | Capture |
| --- | --- |
| 1 | Home light — chips + Keep + composer |
| 2 | Home dark |
| 3 | History open light |
| 4 | History open dark |
| 5 | Settings open light |
| 6 | Settings open dark |
| 7 | Chat light (`&view=chat&thread=1`) — user + AI bubbles + composer |
| 8 | Chat dark |
| 9 | Home → tap History **mid-open** if you can; else skip |
| 10 | Home → Settings **mid-open** if you can; else skip |

**Label line (paste under images):**  
`1 Home L · 2 Home D · 3 Hist L · 4 Hist D · 5 Set L · 6 Set D · 7 Chat L · 8 Chat D · 9 Hist transition · 10 Set transition`

**Optional 11–12:** Composer close-up light/dark (inset hairline check).

---

## PROMPT (paste this — ≤400 words out)

```
ROLE: Senior product/design lead. Kept/Halo Paper Lab. No repo. No code.

INPUT: 10–12 screenshots (labels above). Current partial lock: field #FAFAF9 / #0E0E10, card #F3F2F0 / #2C2C2E, inset #FCFCFB / #3A3A3C. Stone buttons unchanged.

SCOPE — unify ONLY:
• Home field + composer (inset)
• History + Settings menus (same card shell, same motion in/out)
• Chat thread bubbles (user=inset, AI=card) + chat composer (inset)
• Light AND dark must read with equal optical weight (fill separation first; hairlines only on inset rows/pills/composer, not on large cards)

TRANSITION — Camron preference: composer-anchored morph (like play sheet grow), NOT a disconnected full-screen overlay.

**Two entry points — same menu shell, same motion language:**
• **Home:** History/Settings open from bottom `compose` / `compose-dock` (Ask hero composer).
• **Chat:** History/Settings open from bottom `compose-dock` (follow-up composer) — separate anchor, must feel identical (width, grow curve, dismiss).
• Header History/Settings buttons trigger the same sheet; do not look like a different UI per page.

Pick ONE pattern (or hybrid with justification):
A) **Preferred:** Composer morph — card grows from composer pill to full menu (`--halo-chat` wide). Specify Home vs Chat: same CSS/motion tokens, two DOM anchors or one shared pattern.
B) Centered overlay card with play-sheet easing (fallback if A needs too much JSX)
C) Other — only if A/B fail screenshots; say what breaks on Chat vs Home

If A: state whether History and Settings share one morph component, how Close reverses to composer, and whether field dims behind (like play) or stays visible.

Requirements either way:
• Same width as composer (`--halo-chat` ~832px), radius 20px, card shadow both modes
• Close inside card header, stone pill right
• Opening/closing must feel reversible Home↔menu (not a new page)
• Do NOT specify changes to play/review round, Home↔Chat morph, harvest, Keep flights, chip field, gold ◎

CHAT — user bubble recessed (inset), AI bubble card; NO border on either; kind color ONLY on inline answer highlights (already in screenshots). No new bubble colors from bead palette.

HISTORY vs SETTINGS — one shared shell:
• Shared: card, header row, section label style (match play-sheet kind label: 11px, 0.08em, 600, uppercase, ~55% ink)
• History only: inset rows + stone hover on rows
• Settings only: name field inset; segmented controls stone inactive / active #171719 light, #F3F2F0 dark

OUTPUT (numbered only, ≤400 words):
1. Chosen transition (A/B/C) — Home enter/exit + Chat enter/exit (explicit if same or differ); duration; easing (do not change play sheet 1080ms)
2. Token table: field / card / inset — light hex, dark hex, border rule, shadow rule
3. Per-surface one-liner: Home field, composer, History card, Settings card, chat user, chat AI, chat scroll field
4. Light/dark parity rule (one sentence)
5. TOP 6 implementation steps + file names only (LoopSkin, overlays.css, chat.css, HistoryMenu, SettingsMenu)
6. VERIFY checklist: 8 opens an implementer must screenshot before ship
7. DO NOT CHANGE list (explicit)

No redesign. No new fonts. No third gray system beyond field/card/inset + stone.
```

---

## What Opus cannot do (workflow)

Opus in a normal chat **cannot** open `localhost:3000`. Visual verification happens **after** the lock:

1. **You** attach screenshots → Opus locks spec.
2. **Grok/Cursor** implements → uses browser on `http://localhost:3000/preview?look=paper`, opens History/Settings/Chat, screenshots each state light+dark, compares to lock.
3. **You** replay the 8-shot set for promote gate.

If you want live menu inspection *during* design: run Opus with **computer use** on your Mac, or paste fresh screenshots after each menu open.

---

## Grok handoff (after Opus replies)

Paste to Cursor:

> Implement `web/opus-locks/2026-08-30-menu-chat-unify.md` only. Files: LoopSkin, overlays.css, chat.css, HistoryMenu.tsx, SettingsMenu.tsx. Do not touch HomeBubbles, play round, harvest, morph timing, highlights. Browser-verify all 8 items in Opus §6 before done.

---

## Known conflicts to resolve in Opus answer

1. **Menu transition vs frozen morph** — Opus must prescribe *new* menu animation without changing `--travel` on play sheet (can reuse easing curve, different duration OK).
2. **Title typography** — History/Settings use Fraunces serif H1; Home uses greeting sans. Opus should say whether menu title stays serif or switches to match chrome.
3. **Portal overlay** — menus render on `document.body`; morph-from-composer may need JSX change — Opus should flag if transition is CSS-only or needs `HistoryMenu`/`SettingsMenu` structure.
