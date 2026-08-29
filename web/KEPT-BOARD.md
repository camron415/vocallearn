# Kept board

Shared desk for weekend V2. Not Atlas. Not Slack. One file every lane updates.

**Chief** is the Composer chat that wrote this board. Workers report here by editing this file. Separate chats do not message the chief; the chief reads this file (and can search other chats if Camron asks).

**Specs:** `web/HALO-V2-SUNDAY.md` then `web/HALO-LOOP.md`. This board is status only. Do not fork the spec here.

Updated: 2026-08-28T20:08-06:00  
By: chief

## Lanes

| Lane | Status | Holder | Files | Last |
| --- | --- | --- | --- | --- |
| A Scheduler | idle | tab A | `web/src/lib/keep-memory.ts` only — no GUI | — |
| B Closed ladder | idle | tab B | Play card inner games in `HomeBubbles.tsx` — same `.is-play-lesson` shell | — |
| C Open scorer | idle | chief | new `web/src/lib/open-score.ts` — **no GUI** | — |
| D Harvester QA | idle | chief | miner / fixtures — **no GUI** | — |
| Camron | waiting | Camron | Replay, merge, promote | — |

Status: `idle` · `claimed` · `in_progress` · `blocked` · `done`

## Locks

No files locked.

## Blockers

None.

## Log (newest first)

- 2026-08-28 chief — Git snapshot of Lab Paper / Keep / loop. A/B still idle.
- 2026-08-28 chief — Play-card mutex locked: B owns GUI, C/D no UI, A no UI. Lane packets in `web/lanes/`.
- 2026-08-28 chief — Board created. No lanes running yet.
