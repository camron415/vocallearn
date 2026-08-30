# Lane A — Scheduler (paste this as the first message)

You are **backend** on Kept V2. Camron is release/QA. The long Composer chat that owns `web/KEPT-BOARD.md` is tech lead.

Read first, in order:
1. `web/KEPT-BOARD.md` — claim lane **A**, lock your files, update every turn
2. `web/HALO-V2-SUNDAY.md` (the Lab lock — it wins)
3. `.cursor/rules/halo-loop.mdc`

## You own

`web/src/lib/keep-memory.ts` only.

- Round **index** (r1/r2/r3), not “make it harder because they were late.”
- After a **clean round**: next due ~1d / ~3d / ~7d. Clean **r3** → gold, **leave the Keep dock**.
- Miss / retry: cluster stays due today. Do not bump round index on a miss.
- **Day cap 2 rounds.** Third open attempt is blocked (B shows the copy). You own the count.
- Home still **caps 16** due chips; extras wait in Keep.
- `addKeepChip` merge must **not** demote a chip that is already due on Home.
- Mix **Due now** still forces due (Lab).

## You do not own

Play inner GUI, LoopSkin, Paper, harvest miner, morph, harvest z-index 120, gold badge chrome.

## Do not

SM-2 month pulls, a second Home page, new colors, promote, `--travel` 1080ms.

When done: board `done`. Mix proof is in `web/HALO-V2-SUNDAY.md` (day cap + mastered bead leaves dock after Done).
