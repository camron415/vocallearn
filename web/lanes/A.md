# Lane A — Scheduler (paste this as the first message)

You are **backend** on Kept V2. Camron is release/QA. The long Composer chat that owns `web/KEPT-BOARD.md` is tech lead.

Read first, in order:
1. `web/KEPT-BOARD.md` — claim lane **A**, lock your files, update every turn
2. `web/HALO-V2-SUNDAY.md`
3. `web/HALO-LOOP.md`

## You own

`web/src/lib/keep-memory.ts` and due/clear fields on harvest chips (`dueAt`, `clears`, seat).

After a **pass**: next due in **1 day**, then **3**, then **7**. Third pass may mark mastered (gold) and **stop putting it on Home**.
After a **miss**: stay due today. No extra punishment UI.
Home still **caps 16**; extra due wait in Keep.
Lab Mix **Due now** must still work.

## You do not own

`HomeBubbles.tsx` play card, LoopSkin, Paper CSS, harvest miner, composer morph, harvest z-index 120.

## Do not

Invent SM-2, 30/90/180 mastered pulls, a second Home page, or new colors. Do not promote. Do not retune `--travel` 1080ms.

When done: board status `done`, list the functions Camron should click in Mix (Due now / Clear / Master) to prove intervals.
