# Chat unbox — 1.2 craft lock (2026-09-07)

Supersedes the **Chat AI — card fill** line in `2026-08-30-menu-chat-unify.md`.
User sunk bubble, menus, play sheet, harvest, morph: unchanged.

## Decision

Assistant copy sits **on the paper field**. User copy stays a **sunk bubble**.
This matches current LLM chat pages without leaving Halo Paper.

| Surface | Fill | Radius |
| --- | --- | --- |
| User | `--paper-sunk`, right-aligned | 22px, 9px bottom-right |
| Assistant / live | transparent (field) | none |
| Code / quote / recipe / HarvestLock / H1 line | existing card or inset | unchanged |
| Harvest spans | kind wash on the field | unchanged |

Copy sits in a **wrap-level action row** (one nowrap chip row, icons only).
Same header stone wash as History / Settings. Assistant: Copy · Listen · Save
when offered. User: Copy · Edit (prefills Follow up). Learn-more / Teach-me stay parked.

**Camron lab QA 2026-09-07** — unbox + icon row signed. Do not promote with this packet.

**Later (1.3+):** inline edit of the user bubble in place (not the composer).

## Not changed

Harvest z-index 120, morph `--travel` 1080ms, Paper tokens, bead diameter,
Home seating, HarvestLock internals, flyers, morph, AskShell.
Family `/ask` not promoted.

## Files

`chat.css` owns the look. `MessageActions.tsx` owns the chip row.
`ChatThread.tsx` only slots the row (not HarvestLock). LoopSkin / `home.css`
loop-17 / `tokens.css` dark / `motion.css` glass-off + phone `.msg` padding
were leftovers that re-carded AI; those fills stay transparent.
