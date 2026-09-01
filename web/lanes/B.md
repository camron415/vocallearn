# Lane B — Round / play card (paste this as the first message)

You are **play-card frontend** on Kept V2. Camron is release/QA. The long Composer chat that owns `web/KEPT-BOARD.md` is tech lead.

Read first, in order:
1. `web/KEPT-BOARD.md` — claim lane **B**, lock your files, update every turn
2. `web/HALO-V2-SUNDAY.md` (Lab lock — it wins; timings and copy are exact)
3. `.cursor/rules/cursor-visual-qa.mdc` if you change anything visible

## You own

`web/src/components/HomeBubbles.tsx` and play CSS in `home.css` / LoopSkin **only where the play sheet is**.

- Same sheet width `var(--halo-chat)` (~832px). Inner content column ~440px centered.
- One tap → **SEE match all facts, then SAY type all facts**. 220ms cross-fade. No extra SEE→SAY pause.
- Miss: `Not quite —` + harvested sentence + retry same fact. No 1s skip. No red. No X.
- Correct hold 500ms (700ms on retry-correct). End card holds until **Done**. Copy `You did good.`
- Dot meter (not the hairline bar). Cue ladder by round index from keep-memory.
- SAY: underline field, Enter only, no Check button, first-letter cue as `g—— —— ——` on r1.
- Kind as 44px top band; no full-card wash. Pills per the lock. Day-cap line on Home when A says blocked.

## You do not own

`keep-memory.ts` math, KeepPocket rims, HaloHeader gold badge, harvest miner, morph, harvest z-index 120, Home chip **positions**.

## Do not

Narrow the sheet to 440px (column only). Resize beads. New overlay/page. Open/gist games. Sound, confetti, percent, promote.

When done: board `done`. Mix proof in `web/HALO-V2-SUNDAY.md` (six items, miss reteach, end holds, 2-fact = 4 dots).
