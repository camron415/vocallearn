---
name: lab-look
description: >-
  Halo Lab Look — agent visual QA for Cove/Halo. Use when changing UI, CSS,
  motion, theme, keyboard, status bar, Replay, or when Camron sends a screen
  recording. Combines the cursor-ide-browser MCP with Lab Film on /preview.
  Not a new MCP server.
---

# Lab Look

Name for the Halo visual QA loop. Other agents: read this before filming or
guessing from CSS.

Two tools, one job:

1. **cursor-ide-browser** (MCP) — live page, CDP, lock/snapshot. Good for
   theme, layout, clicks. **Cannot** raise the real iOS keyboard.
2. **Lab Film** — `/preview?look=paper&burst=1&take=…` writes stills to
   `web/captures/home/latest/`. Good for Home↔Chat morph.

Phone-only motion (keyboard, status bar icons, haptics): Camron’s recording
or the device. Do not claim those are signed from a desktop sim.

## When to use

UI, CSS, color, animation, Appearance, keyboard covering Ask, Replay, or a
`.mp4` Camron dropped. Follow Visual QA steps 1–7 in
`.cursor/rules/cursor-visual-qa.mdc`.

## Live inspect (browser MCP)

1. Discover schemas (`GetDynamicTools` on `cursor-ide-browser`).
2. `browser_navigate` to lab `https://halo-lab-personal-f999.vercel.app/preview?look=paper` (or LAN `/preview`). Never production unless Camron said promote.
3. `browser_lock`. CDP `Emulation.setDeviceMetricsOverride` **393×852**.
4. Snapshot → click/type. For computed CSS, `browser_cdp` `Runtime.evaluate`.
5. Unlock when done.

Keyboard: focusing the composer in this browser does **not** produce iOS inset.
Do not fake a pass by setting `data-halo-kb` unless you also say it is a sim.

## Lab Film (morph / Home↔Chat)

```
cd web && npm run capture:sink
```

Open `/preview?look=paper&burst=1&take=roundtrip` at 393×852. Default take is
Home→Chat→Home. One-way: `take=morph` or `take=return`. Idle: `take=home`.

Read `web/captures/home/latest/meta.json`, then only named stills
(`start`, `travel`, `mid`, `late`, `land`, `end`). Tick frames only if a blink
sits between them.

**Done:** 2–3 clean takes on the same defect, then Camron’s phone. Sitting
limit ~4–8 loops; then a new chat.

## Phone recording Camron sends

`ffmpeg` stills (about 6–12 fps), read in order, fix from frames. Status bar
clock/wifi/battery is only trustworthy on device film.

## Frozen

Morph `--travel` **1080ms**. Harvest z-index **120**. Do not edit LoopSkin,
AskLanding, ChatThread, pending-turn, or AskShell.tsx unless that lane is
claimed. No `deploy:early` / `--prod` unless Camron says promote.

## Lab deploy

`cd web && npm run test:harvest && npm run build && npm run deploy:lab`
then `npx vercel alias set <preview> halo-lab-personal-f999.vercel.app`.
Update `web/KEPT-BOARD.md` the same turn.
