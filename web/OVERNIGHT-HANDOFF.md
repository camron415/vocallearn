# Overnight UI handoff — 2026-09-24

Grok 4.7 cloud agent. Night ran on branch `cloud/overnight-ui` (base `halo-ui-streamline`, tip when the branch was cut: `c6af70b`). Loop stopped **8:27am America/Denver**. Do not arm another overnight timer.

Mac agents cannot see the cloud chat. This file is the review. Atlas at `127.0.0.1:8787` was down on the cloud VM all night (`HTTP 000`), so there is no phone-agent dump. Pull this branch.

## Paste into a Mac chat

```
Review the overnight UI pass. Read web/OVERNIGHT-HANDOFF.md, web/KEPT-BOARD.md, and web/OVERNIGHT-UI.md.

Branch: cloud/overnight-ui. Base: halo-ui-streamline. Do not promote. Do not vercel --prod. Do not deploy:early.

The night is over. Judge Paper at 393×852 on /preview?look=paper. The mixer is a lab tool. Morph --travel stays 1080ms. Harvest z-index stays 120. Family /ask stays 1.2.0.

The iOS keyboard was not raised in the cloud browser. Do not treat those keyboard commits as phone-signed. Lab alias halo-lab-personal-f999 was not updated: npx vercel whoami stayed logged out.
```

## Where the code is

- Branch: `cloud/overnight-ui` (pushed).
- Review range: `c6af70b..d7016c1` (plus this handoff commit).
- Pull request: https://github.com/camron415/vocallearn/pull/2 (draft, base `halo-ui-streamline`).
- Local check: `git fetch origin cloud/overnight-ui && git checkout cloud/overnight-ui` then `cd web && npm run dev` and open `http://localhost:3000/preview?look=paper` at **393×852**.
- Tests that stayed green: `cd web && npm run test:harvest` — 25/25 on every code wake.

## What shipped

Each line is one wake. Later commits do not redo earlier ones.

1. **Send, sheets, keyboard fade, lab build id** (`74c16ce`). `AskLanding` finishes a leave that was already in flight, so Home does not stick on “Asking…”. Preview send still opens the canned Nile chat, not the typed question. `AskShell` clears sending when the route becomes chat. `MotionProvider` keeps the fade up through a focus blip and clears it after the keyboard flag drops. `SimpleSheet` sets `data-halo-sheet`. Menu veil and chips under a sheet do not take taps. Lab hosts show a short build id (`dev` locally) via `NEXT_PUBLIC_HALO_BUILD`. Not on `halo-gules-three`.
2. **Phone mixer starts minimized** (`38f32ac`). At ≤720px the `/preview` mixer starts collapsed so it does not cover the left chips. Desktop still starts open. Do not restyle mixer colors.
3. **Faded chips cannot take taps** (`a0818e3`). `.recent-slot { pointer-events: auto }` was punching through a parent `pointer-events: none`. Slots are `none` while `data-halo-kb` or `data-halo-kb-fade` or `data-halo-sheet` is set.
4. **Page does not stick scrolled while the keyboard flag is on** (`0427a56`). `html[data-halo-kb]` is `position: fixed`. **Body is not `position: fixed`.** That collapsed the hero and jumped the greeting under the header. Do not put `position: fixed` on `body`.
5. **Greeting stays above the lifted composer** (`8053bcc`). With the keyboard flag on, `.ask-hero` aligns to the end and its min-height subtracts `--kb-inset`.
6. **Play SAY does not scroll the page** (`23bed56`). `HomeBubbles` no longer `scrollIntoView`s the answer field. Phone focus uses `preventScroll: true`.
7. **Chat thread scrolls inside `.chat-scroll`** (`d5d2625`). `scrollIntoView` was also scrolling the document.
8. **Lock-in card scrolls inside `.chat-scroll`** (`261d0bd`). The card clears the composer by about 12px. No `scrollIntoView`.
9. **Edit focuses the shell field** (`c8276d2`). The old path looked for `#followup`, which AskShell does not render. Focus uses `preventScroll`.
10. **SEE → SAY does not focus a hidden 1px field** (`299d9ed`). That decoy could scroll the phone. The real answer field still focuses with `preventScroll`.
11. **Phone suggestions sit above the shell field** (`2aa4901`). Paper + Loop 17 pin the list under the field with `top: 100% !important`. The phone override is in `motion.css` inside `@media (max-width: 720px)` and must beat that. A weaker rule collapsed the list to a sliver. Typing “When” at 393 showed two rows above the field, and a tap filled the question. Desktop suggestions stay under the field (the rule is inside 720).
12. **Keyboard fade does not arm on load** (`4ffdf5a`). `releaseKb` used to set `data-halo-kb-fade` when the keyboard had never been up, so chips looked normal and ignored taps for ~1s. A focus during that window could leave the fade stuck. Fade now arms only if the keyboard flag was actually on.
13. **Phone header is Menu on the first paint** (`fbab8d4`). `useCoarsePointer()` starts false, so the server HTML was Library / History / Settings and then swapped to Menu. Both chromes render. `chrome-wide` / `chrome-phone` in `home.css` pick by width. No hydration swap.
14. **Cove ◎ receives taps** (`1819a8c`). On a phone the Keep dock paints in `.topbar-actions` (z-index 50) and covered the badge. `.brand-row` is z-index 51 inside the 720px block in `motion.css`. A touch opens the Kept panel on screen. A bead whose center is inside the dock still hits. On a wide `/preview` window the lab mixer covers the badge. Ignore the mixer. The phone app has no mixer.

Board-only commits after that: no safe hitch at 7:56am (`3644bf7`), stop at 8:27am (`d7016c1`).

## Files a reviewer should open

- `web/src/components/MotionProvider.tsx` — keyboard flag, inset, fade. Native path does not write `--kb-inset` until the measured keyboard has held still. One guess lift at 520ms only if the web view never shrinks. Nothing here calls `scrollTo`.
- `web/src/components/NativeBoot.tsx` — read before any further keyboard or tap change. Do not move the composer while the keyboard is opening.
- `web/src/app/styles/motion.css` — phone keyboard lock, greeting, suggestions, slot pointer-events, Cove z-index.
- `web/src/app/styles/ask-shell.css` — shell composer. Do not retune play-overlay pose.
- `web/src/components/AskLanding.tsx`, `AskShell.tsx` — send leave.
- `web/src/components/HomeBubbles.tsx` — SAY focus, no hidden warm field.
- `web/src/components/ChatThread.tsx`, `HarvestLock.tsx` — pane scroll only.
- `web/src/components/HaloHeader.tsx`, `web/src/app/styles/home.css` — phone vs desktop chrome.
- `web/src/components/PreviewSwitcher.tsx` — phone mixer starts minimized.
- `native/capacitor.config.js` — origin is lab HTTPS. `contentInset: never`. No Keyboard plugin. Do not rebuild Xcode from this pass.
- Do not edit `LoopSkin.tsx` to beat a phone rule. Beat it from `motion.css`. Lane 15 owns LoopSkin.

## Click-through that passed in Chrome

Viewport 393×852, touch, `/preview?look=paper`, then one desktop check. `el.click()` bypasses `pointer-events: none`. Real checks used `elementFromPoint` and `touchscreen.tap`. Escape for the round has to be a `keydown` on `document`. `page.keyboard.press("Escape")` often misses the listener.

Passed, across wakes: Rome opens a round and closes. History and Settings open and stay open. A chip coordinate hits the sheet, not the chip. Ask leaves Home (not stuck on “Asking…”). `/login` shows “Welcome back”. Login fields and the Settings name field compute at 16px. Desktop header is Library, History, Settings, and the greeting is still there.

Library’s “Preview only” row is `disabled` because `/preview` passes `demo`. That is not a broken control.

## Do not call these fixed

- **Real iOS keyboard.** The cloud browser cannot raise it. Code intent: while the keys are up the page does not scroll, the composer does not slide under the keys, Home stays faded until the flag drops, and faded chips do not receive taps. Only a phone film can sign that. Known film (2026-09-23 22:07) was the old lab build: keyboard stayed up, then the page scrolled the composer under the keys, Home blinked back, sheet taps fell through, Send sat on “Asking…”.
- **Lab alias.** `npx vercel whoami` was logged out every wake (Vercel CLI 59.26.0). No `deploy:lab`. No alias to `halo-lab-personal-f999.vercel.app`. The installed Halo app still loads the old lab page until someone who is logged in deploys. Do not `vercel login` from a cloud agent. Never `vercel --prod` or `deploy:early` unless Camron says promote.
- **Family `/ask` send.** Preview send is the canned Nile thread. The live API path was not exercised. Family `/ask` stays 1.2.0.
- **Off-screen Keep beads.** Older beads scroll under the wordmark. Beads whose centers sit inside `.keep-dock` are the hit target. Do not “fix” this by changing bead diameter or the signed phone dock.

## Frozen — do not retune while reviewing

- Morph `--travel` 1080ms.
- Harvest z-index 120.
- Desktop 16-seat. Home chip seating. Bead diameter.
- Phone dock (follow-up stadium). `text-size-adjust`.
- Sheets 520 / 380. Chrome (Send, menu, Copy) stays about 100–180ms.
- House motion: `--ease-travel`, `--ease-gel`, `--ease-glass`.
- No Xcode, no Apple sign-in, no legal-page edits, no Bells / haptics sprint.

## How the night was run

One change, then a 393×852 click-through, then desktop, then `test:harvest`, then a Kept-board log line, then commit and push `cloud/overnight-ui`. A 30-minute one-shot timer armed the next wake. The timer that fired at 8:26am Denver was the stop. It did not arm another timer.

Testing was Puppeteer against `http://localhost:3000` (Chrome at `/usr/local/bin/google-chrome`). Computer Use was not available for later wakes.

## Suggested review order

1. Pull `cloud/overnight-ui`.
2. Read this file, then skim `web/KEPT-BOARD.md` from the first “## Log (newest first)” only. There is a second, older log section. Do not append to that one.
3. On a phone-width `/preview?look=paper`: Menu, History, Library, Settings, Rome round, Ask, Cove ◎, a visible Keep bead.
4. On the phone app, after a lab deploy Camron runs himself: keyboard up, composer above the keys, no page scroll, Home stays faded, Send leaves Home.
