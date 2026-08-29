# Halo loop

One page. If a chat disagrees with this file, this file wins.

## What it is

A daily ask-and-keep loop that should feel as natural on a phone as on a laptop. Gamification stays around a 5: short, spoken, not a skill game.

## Seats

| Where | Means | User sees |
| --- | --- | --- |
| **Keep** | Not due | Header beads, **one per fact**, cap **30**. |
| **Home** | Due | Field of chips to clear. |
| **Mastered** | Done | Mark in the Keep header, not on Home. |

Harvest from Ask lands in **Keep**. Facts only appear on **Home** when they are due — each as its own chip, up to 16 seats. Click one due chip to play **its cluster** (same Ask). Ok → off Home, into Keep as its own bead (flies to the **right** of the header row). Miss → stays due, round continues, with a clear miss mark. Due beads drop from Keep and grow into their seat.

Do not put the whole library on Home. Do not make chips wander or clump-animate as idle motion. Harvest flight (chat → pocket) and the composer Home↔chat morph already exist; leave them. Do not retune harvest z-index 120.

## Loop (MVP defaults, Lab)

1. **Ask** — discover something.
2. **Harvest** — facts become Keep (not due). Same Ask stays a cluster.
3. **Due** — Lab or a later scheduler drops a cluster onto Home.
4. **Clear** — click one due chip; the cluster is the round. **Ok** → off Home, into Keep (`clears + 1`). Three oks → **Mastered**. **Miss** → stays due, next card in the round still plays. Bank flight is Keep dock motion, not harvest.
5. **Nothing due** — If Keep is empty, the usual greeting. After facts are banked and Home is empty, greeting becomes **You're clear** with a short lift; Keep flashes once. No fireworks.
6. **Shelf** — Keep beads sort **gold → silver → bronze → new**, left (Cove) to right. Within a rank, older left, newer right. New harvests still land on the right of the new band. Rank is a metal ring on kind color (not gray, not bigger). A small mastered count sits left of the row. Cove-side achievements sheet later.

Parked (notes only, not Sunday): first-run tutorial polish; practice mode; fancy empty-Home; points; 30/90/180 mastered pulls; kingdom UI; Slack/agent factory. Weekend slice: `web/HALO-V2-SUNDAY.md`.

## Lab harness

`/preview` Mix → **Loop**. Reset, demo pack, spawn, due now, bank, clear, miss, master. Walk the whole loop, then Mix → **Start** / **Stop** Replay so one take covers it. Speed “due” by pressing Due now — no live clock yet.

## Build order

1. This page (done).
2. Persist Keep (done).
3. Home = due only; pocket = Keep only (done).
4. Mastery clear of a Home cluster (Lab MVP in this pass).
5. Full-clear celebration + mastered shelf (thin: copy + header mark). (Lab this pass)
6. Light daily habit (not built).
7. Invite → free month. Not while the loop is a demo.

## Working rules

One-sentence spec, 30-minute timebox, smoke-test, commit before refresh. Lab deploys only. No open-ended UI.
---
