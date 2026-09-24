# Overnight UI pass

Live queue for the cloud chat on `halo-ui-streamline`. Read this every wake before you edit.

The phone videos are on Camron’s Mac, not in git. The film log below is the record you can use. Product context that is in git: `web/KEPT-BOARD.md`, `web/HALO-V2-SUNDAY.md`, `docs/PRODUCT_ROADMAP.md`, `docs/CRAFT-JUICE.md`, `web/lane-plans/`.

## You are not done

A green check is not the end of the night. Every wake you re-read this file, the Kept board, and the Sunday spec, then hunt the next real hitch: a dead control, a blink, a flash, a double motion, a slow handoff, or a fix on one screen that breaks another.

One change per wake. Then the click-through. Then subscribe again.

Stop subscribing only when the clock in America/Denver is 8:00am or later on Thursday 2026-09-24. Until then, a clean wake still looks for one small smoothness or latency improvement that does not touch a frozen token. If you cannot find a safe one, write that on the Kept board and subscribe anyway.

Timer prompt, every wake:

`Read web/OVERNIGHT-UI.md. You are not done. One change, then the click-through. If the click-through failed, that change is not done. Subscribe again unless it is 8:00am America/Denver or later on 2026-09-24.`

## How a professional pass works

- Assume a fix in one file can break Home, Chat, the play round, Menu, History, Library, Settings, login, Keep, or the keyboard.
- After the edit, click the control you changed and the neighbors. On phone width and on desktop.
- Two writers of the same CSS variable, a layout change while iOS is presenting the keyboard, and a fade that leaves `pointer-events` on are the bugs we have already paid for. Do not repeat them.
- Soft motion skips travel and fades. Check Settings before you call a missing animation a bug.
- Desktop Chrome does not sign the iPhone keyboard. Say what you clicked in the browser, and what only a phone can prove.
- Do not read the whole repo into context. Read this file, the board, the Sunday spec, and the files you will touch.

## Frozen

Morph `--travel` 1080ms. Harvest z-index 120. Desktop 16-seat. Phone dock. `text-size-adjust`. Family `/ask` stays 1.2.0. No `deploy:early`. No `vercel --prod`. No Xcode rebuild. No Apple sign-in work. Legal pages stay done.

House motion is in `docs/CRAFT-JUICE.md`. Use `--ease-travel`, `--ease-gel`, `--ease-glass`. Sheets are 520/380, not 1080. Chrome (Send, menu, Copy) stays about 100–180ms. Do not add delay to hide a layout bug.

## Known open bugs

1. Lab mark in the header, lab host only (`halo-lab-personal-f999`, localhost, `/preview`). Not on `halo-gules-three`. A short build id so a reopen proves the new page.
2. While the native keyboard is open, the page does not scroll and the composer does not slide under the keys.
3. Home stays faded until the keyboard is fully gone. Faded chips do not receive taps.
4. Menu, History, Library, and Settings open and stay open. A tap does not fall through onto a chip.
5. Send from Home leaves Home. It does not sit there on “Asking…”.

Keyboard stay-up is signed on the 22:07 film. Do not call `scrollTo` while Ask is focused. Do not move the composer during the first part of the keyboard animation.

## Film log (videos are not in git)

- 2026-09-23 22:07 — Keyboard stays up and the composer sits above the keys. Then the page scrolls the composer under the keys. Home and chips blink back while the keyboard is up. Menu and Settings open; taps can fall through. Send stays on Home with “Asking…”.
- 2026-09-23 21:58 — Old lab build. Composer jumps, keyboard aborts. Ignore the iOS photo menu in that film.
- 2026-09-21 21:43 — Keyboard drops unless he types. Send flashes white and returns Home.
- 2026-09-21 21:21 — Home pops back about a second after Ask. Holding a chip opens the iOS Copy menu and later taps die.
- 2026-09-20 22:41 — Status-bar icons were inverted on appearance change. That invert was fixed. Do not reopen it.

## The iPhone shell

The phone app is a web view of the lab site, not a separate interface. Read `MotionProvider.tsx`, `NativeBoot.tsx`, the keyboard rules in `ask-shell.css`, and `native/capacitor.config.js` before you change keyboard, scroll, or tap behavior.

Diagnose shell bugs from that code and from the film log. Known shell rules: moving the composer while the keyboard is opening makes the web view drop the keyboard. Scrolling the page slides the composer under the keys. A faded layer that still receives taps lets a chip steal the click. The cloud computer cannot raise the real iOS keyboard. Do not claim that keyboard is fixed from a browser click. Say what the code does, and what only the phone can prove.

## What you are looking at

The cloud computer’s display is not the product. A wide window of local `/preview` shows the old mixer rail and old palette. That rail is a lab tool. Do not restyle it, and do not treat its colors as Halo.

Current Halo is Paper: stone field, chips, greeting, Keep beads, Cove, one composer. Set the viewport to **393×852** before you look or click. That is the phone.

Open `https://halo-lab-personal-f999.vercel.app/preview?look=paper` after a lab deploy, or local `http://localhost:3000/preview?look=paper`. If a mixer panel is on screen, ignore it. The page behind it, at 393×852, is the one that must match the phone. A desktop pass is a second check only.

## Click-through (after every change)

`npm run dev` in `web/`. Open `/preview?look=paper` at **393×852** first. Then once at desktop width.

- Home: a chip opens its round; the round closes; greeting, Keep, and Cove are still there.
- Ask: focus fades Home; leaving Ask brings Home back; faded chips do not take the click.
- Header: Menu, History, Library, Settings each open, a control inside works, and they close. The tap does not hit a chip behind the sheet.
- Send from Home leaves Home.
- `/login` still renders.
- `cd web && npm run test:harvest` is green.

If any line fails, undo the part that caused it and repair both the new break and the old bug before you subscribe.

## Ship a wake

Update `web/KEPT-BOARD.md`. Commit on `cloud/overnight-ui` and keep that branch pushed. When `npx vercel whoami` works, `cd web && npm run deploy:lab` and alias the preview to `halo-lab-personal-f999.vercel.app`. Never production.
