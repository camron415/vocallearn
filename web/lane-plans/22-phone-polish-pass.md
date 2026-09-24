# Phone polish pass

Queue for the Cursor Models spend. Written 2026-09-24. One orchestrator chat runs every row, one builder then one reviewer. Camron does not open more chats.

Mobile is the product. A desktop click-through is not a pass. The overnight Chrome pass at 393 did not match the phone. If a row only looks right on a wide window, it is not done.

Branch to edit: `cloud/overnight-ui`, then merge back to `halo-ui-streamline` only when a lane review passes. Lab only. No `deploy:early`. No `vercel --prod`. Family `/ask` stays 1.2.0.

Lane A is signed enough to leave (2026-09-24 afternoon). Latency and the white load flash stay noted. This pass pulls the phone thread up under the header and lets the last History row scroll clear of the home indicator.

## How a pass runs

One sub-agent at a time. The next one does not start until the reviewer for the previous one says pass.

1. **Builder.** Grok 4.7, Fast on, from the orchestrator chat. One row below. It may edit only the files named on that row. It runs `cd web && npm run test:harvest`. It clicks the row’s check at 393×852 on `/preview?look=paper`. It writes a Kept-board log line and stops. It does not start the next row.
2. **Reviewer.** A second Grok 4.7 sub-agent. It does not add features. It reads the diff, re-runs the row’s check, and looks for the bugs that row could have left on the neighbor screens named in the row. It either says pass, or it makes the smallest fix and re-checks. If the same failure happens twice, it stops the lane and writes the blocker. It does not open the next row.
3. **Lane close.** After the last row in a lane, one more reviewer reads the whole lane diff. Deploy lab and ask Camron to quit and reopen only at a lane close, not after every row. His phone is the sign-off. Chrome is only a clue.

The orchestrator is this Mac chat. It keeps the queue. It does not edit lane files while a builder is running.

A row that needs a file another row owns waits. That is the whole point of the sequence.

## Frozen on every row

Morph `--travel` 1080ms. Harvest z-index 120. Desktop 16-seat. Home chip seating. Bead diameter. Phone follow-up dock. `text-size-adjust`. Sheet timings 520/380. House easings in `docs/CRAFT-JUICE.md`. No Xcode change unless the row is in Lane 0. No Apple sign-in. Legal pages stay done. Do not restyle the lab mixer. Do not read the whole repo into context.

## Phone report — 2026-09-24 morning

Camron reinstalled, trusted, and opened the lab app. The header says `Cove dev`, so the overnight UI is on the phone. The build id did not bake in, which is why it says `dev` and not `9b196fe`. He says it feels like the same app.

What works: chips open a round. Settings opens.

What fails, and this is the work:

- The composer still scrolls.
- Tapping the composer over and over makes the screen glitch.
- Menu paths that should open a chat do nothing.
- Anything that is not a chip or Settings freezes.
- It is not smooth.

The overnight Chrome checks are not evidence those bugs are gone. Later lanes stay in the file, but they wait until this report is actually fixed on the phone.

## Lane A — Dead controls (do this first)

Mobile only. A row is done when the control responds on a 393×852 Paper page and the code path is the one the phone shell runs (`data-halo-native`). Do not spend the row polishing desktop.

Owns, in order, only the files the row names. A later row may touch a file an earlier row used only after that earlier row’s reviewer passes.

| ID | Job | Files | Done when | Reviewer looks at |
| --- | --- | --- | --- | --- |
| A.1 | Find why History, Library, and any menu row that should open a chat do nothing on the phone. Settings works. Chips work. Trace the tap from the phone menu to the chat route. | Menu components, `HaloHeader.tsx`, the chat-open handler they call | A History row navigates. The page does not sit there frozen. Settings still opens. A chip still opens a round. | The handler is not a no-op, a disabled demo flag, or a desktop-only branch. |
| A.2 | Stop the freeze. Repeated taps must not leave the shell stuck. One tap does the job. A second tap does not stack a transition. | The file A.1 changed, plus `AskShell.tsx` only if the freeze is the leave flag | Two taps on the same control end in a stable screen, not a half-faded Home. | Chips and Settings still work. |
| A.3 | The composer does not scroll the page, including while it is focused and including repeated taps on it. | `MotionProvider.tsx`, keyboard section of `motion.css` only | Focusing Ask and tapping it again leaves `scrollY` at 0. The field does not jump. | Do not write `--kb-inset` on the focus tick. No `scrollTo`. No `position: fixed` on `body`. |
| A.4 | Repeated taps on the composer do not glitch the fade, the keyboard flag, or the field position. | `MotionProvider.tsx`, `NativeBoot.tsx` | Five focus taps in a row leave one state: either the keyboard path is on and Home is faded, or it is off and Home is back. Not a mix. | A chip tap after dismiss still opens the round. |

Lane A close: deploy lab, Camron quits and reopens, and he tries a menu-to-chat, Settings, a chip, and the composer. The lane is not done on a Chrome pass alone.

## Lane 0 — Install

Done. App reinstalled over USB on 2026-09-24. Shell loads `https://halo-lab-personal-f999.vercel.app`. Header showed `Cove dev`.

## Lane 1 — Phone shell

Owns: `web/src/components/MotionProvider.tsx`, `web/src/components/NativeBoot.tsx`, keyboard rules in `web/src/app/styles/motion.css` and `web/src/app/styles/ask-shell.css` (`--kb-inset` only). Must not edit AskLanding, ChatThread, HomeBubbles play logic, LoopSkin, `native/`.

Known shell rules, already paid for: moving the composer while iOS is presenting drops the keyboard. `scrollTo` while Ask is focused fights the caret. A guessed inset written on focus yanks the field. `visualViewport` often never shrinks in the web view, so one late guess is allowed only after the present has settled. Fading Home without `pointer-events: none` lets a chip take the tap. `position: fixed` on `body` collapses the hero. Soft motion skips fades, so a missing animation is not automatically a bug.

| ID | Job | Done when | Reviewer looks at |
| --- | --- | --- | --- |
| 1.1 | Confirm the lab mark renders only on lab hosts and reads the deploy id. Not on `halo-gules-three`. | Header on `/preview` and the lab host shows the id. Production host does not. | Login and Settings still open. |
| 1.2 | While `data-halo-kb` is on, the document does not scroll. Root lock only. Body stays in normal flow. | At 393, focusing Ask does not change `scrollY`. Greeting does not jump under the header. | Composer is still on screen. |
| 1.3 | Composer stays above the keys. Measured inset after the keyboard has held still. One 520ms guess only if no measurement arrives. No `scrollTo`. No inset write on the focus tick. | Code review of `MotionProvider` matches that. A forced inset in the sim puts the field above the inset. | Desktop width over 720 never sets the flag. |
| 1.4 | Home stays faded until the keyboard flag and the fade flag are both clear. A focus blip while a measured keyboard is up does not clear the fade. | Chips stay non-hit-targets for the whole fade. They accept taps again after it. | Menu open during fade does not fall through to a chip. |
| 1.5 | Faded slots cannot punch through with `pointer-events: auto`. | `elementFromPoint` on a chip during fade hits the veil or nothing, not the chip. | A chip tap with the keyboard closed still opens the round. |
| 1.6 | Greeting stays in the band above the lifted composer. | With a simulated inset, the greeting’s box is above the composer and below the header. | Cove and Keep are still visible. |
| 1.7 | NativeBoot’s outside-tap ignore window still covers the keyboard present. Do not shorten it. | Focus on Ask does not blur from the tap that opened it. | A real outside tap after the window still dismisses. |

Lane 1 close: reviewer reads 1.1–1.7 together. Then stop for Camron’s phone film. Do not start Lane 2 until he says the keyboard either holds or names the remaining hitch.

## Lane 2 — Header

Owns: `web/src/components/HaloHeader.tsx`, `web/src/app/styles/home.css` header rules, Keep pocket overflow in the header only. Must not edit MotionProvider, AskShell, LoopSkin, seating math.

| ID | Job | Done when | Reviewer looks at |
| --- | --- | --- | --- |
| 2.1 | First paint at 393 is Menu, not Library / History / Settings flashing in. Width chooses the chrome. No hydration swap. | Server HTML and the 393 view both show Menu. | Desktop still shows the three separate buttons. |
| 2.2 | Cove badge receives the tap. The Keep dock must not cover it. | A touch on the badge opens Kept. A bead whose center is inside the dock still opens the bead. | Bead diameter is unchanged. |
| 2.3 | Gold inspect and Keep bead inspect stay mutex. Opening one closes the other. | Open gold, then a bead: gold closes. Open a bead, then gold: the bead closes. | Neither panel sticks after close. |
| 2.4 | Keep overflow fades the left when older beads are off-screen and the right when newer ones are. | A long Keep row fades the clipped end only. | The dock does not hard-cut mid-bead. |
| 2.5 | Off-screen beads are not “fixed” by resizing beads or the dock. Hit target stays the bead center inside the dock. | No diameter or dock-geometry diff. | 2.2 still passes. |

## Lane 3 — Play round

Owns: play path in `web/src/components/HomeBubbles.tsx`, play-only rules that do not move the idle composer pose. Must not edit MotionProvider, AskShell send, LoopSkin pose, desktop 16-seat, phone seat packer.

| ID | Job | Done when | Reviewer looks at |
| --- | --- | --- | --- |
| 3.1 | A chip opens its round. Escape or the close control closes it and Home is intact. | Rome (or the first chip) opens and closes at 393. Greeting, Keep, and Cove are still there. | No phantom chip outlines left behind. |
| 3.2 | SEE to SAY does not focus a hidden field. The real answer field focuses with `preventScroll`. | After the last SEE hold, `scrollY` is unchanged and one visible field is focused. | The keyboard flag is not armed before the field is actually focused. |
| 3.3 | The answer field does not call `scrollIntoView` on the document. | Typing in SAY leaves the page at 0. The field is on screen. | Check still submits. |
| 3.4 | Day cap still tells the truth when two rounds are used. | The cap line shows. It does not look like a broken chip. | A round under the cap still opens. |
| 3.5 | Light miss text stays readable (`--play-ink`). Dark stays the kind color. Done label stays ink on stone. | A forced miss on light is darker than the candy band. | Play sheet silent: no new haptic. |

## Lane 4 — Chat

Owns: `web/src/components/AskLanding.tsx`, `web/src/components/AskShell.tsx`, `web/src/components/ChatThread.tsx`, `web/src/components/HarvestLock.tsx`, suggestion placement in `motion.css` inside the 720px block. Must not edit MotionProvider keyboard measurement, LoopSkin, the signed phone dock geometry.

| ID | Job | Done when | Reviewer looks at |
| --- | --- | --- | --- |
| 4.1 | Send from Home leaves Home. It does not sit on “Asking…”. A leave already in flight still navigates once. | Preview send reaches the canned thread. The button is not stuck. | Morph `--travel` is still 1080. Soft motion still skips the travel. |
| 4.2 | The chat thread scrolls inside `.chat-scroll`, not the document. | A long thread moves the pane. `scrollY` on the page stays 0. | The composer stays put. |
| 4.3 | Lock-in scrolls inside the pane until the card sits about 12px above the composer. No `scrollIntoView` on the document. | Card bottom is above the composer. Page scroll is 0. | Copy / Listen / Save still hit. |
| 4.4 | Phone suggestions sit above the shell field. Desktop suggestions stay under it. The phone rule has to beat the paper `top: 100% !important`. | Typing “When” at 393 shows rows above the field, on screen, and a tap fills the question. At desktop width the list is under the field. | The list is not a one-pixel sliver. |
| 4.5 | Edit on a chat line focuses the shell field with `preventScroll`. It must not look for `#followup`. | Edit fills Follow up and focuses it. A forced scroll is not reset by the focus. | Send from that field still leaves the line. |
| 4.6 | Phone follow-up dock stays the signed stadium: full width, 12px gutter, attach/mic/Send on row 2 when focused. | Idle and focused dock match that. No `field-sizing: content`. | 4.4 still passes. |

Family `/ask` send against the live API is not this lane. Preview send is the canned thread. Say so in the log. Do not point a test at production.

## Lane 5 — Sheets

Owns: `web/src/components/SimpleSheet.tsx`, menu components for History, Library, Settings, the sheet veil. Must not edit Home seating, MotionProvider, LoopSkin. Open this lane only for a hitch Camron names on the phone. Do not restyle a sheet that already works.

| ID | Job | Done when | Reviewer looks at |
| --- | --- | --- | --- |
| 5.1 | Menu, History, Library, and Settings open and stay open. | Each opens, a control inside works, and it closes. | Home is unchanged after close. |
| 5.2 | A tap on the sheet does not hit a chip behind it. `data-halo-sheet` is set while a sheet is open. | `elementFromPoint` on a chip’s old coordinate hits the sheet. | Chips work again after close. |
| 5.3 | Phone uses the instant sheet. Desktop grow stays 520 open / 380 close. | A width check shows the phone sheet without a desktop grow. | Timings in tokens are unchanged. |
| 5.4 | Settings Appearance still offers Auto, Light, and Dark, and the choice sticks for the session. | Switching Light then Dark updates the page. Auto is still a choice. | Status-bar icon logic is not inverted again. |
| 5.5 | Library’s disabled “Preview only” row on `/preview` is left disabled. It is not a broken button. | The row is disabled in demo. | A real Library row that is enabled still activates. |

## Lane 6 — Joins

Last. One owner. Owns: `LoopSkin.tsx` motion tokens only, join/land rules in `home.css`, harvest-land CSS in HarvestLock. Must not edit AskShell, `--halo-native-bottom`, 1080, or z-index 120.

Do not start until Lanes 1 and 4 have passed review and Camron has signed the phone keyboard. The overnight pass was told not to fight LoopSkin from inside it. Phone overrides stay in `motion.css`.

| ID | Job | Done when | Reviewer looks at |
| --- | --- | --- | --- |
| 6.1 | Write the duration map before changing motion: which joins are 1080, which are 520/380, which are 100–180ms chrome. No code in this row. | The map is in this file’s lane log. | It does not propose retuning 1080. |
| 6.2 | Harvest landing does not jump the layout after the bead arrives. | A lab harvest land ends with the bead in Keep and Home stable. | z-index is still 120. |
| 6.3 | Home↔Chat land does not flash the chips back for a frame. | Two clean `/preview` roundtrips at 393. Chips are gone for the whole travel and present on land. | One composer, no duplicate mixer. |
| 6.4 | Remove only the `!important` fights that cause 6.2 or 6.3. Do not sweep LoopSkin for style. | The diff is those fights plus a sentence each. | Play overlay pose is unchanged. |

## Lane 7 — Left parked

Do not queue these into the polish pass.

- Auth Packet B, Apple sign-in, Google sign-in. Blocked on the paid Apple account.
- TestFlight and promote.
- In-app account delete and first-Ask AI consent.
- Bells haptics and earcons, unless Camron asks. Play sheet stays silent.
- Dictate and Listen beyond what is already in the tree.
- Teach-me, streaks, Stripe, public App Store.
- Miss-reveal token versus full sentence, unless a row in Lane 3 finds it while grading a round. Then it is one extra row, not a new lane.
- White flash on resume. That is the native splash, and it needs an Xcode rebuild Camron asks for. Not a web sub-agent.

## Reviewer prompt

Use this shape, with the row id filled in:

```
You are the reviewer for polish row <id> on vocalLearn, branch cloud/overnight-ui.
Read web/lane-plans/22-phone-polish-pass.md for that row only.
Read the diff for the files that row owns. Do not add a feature.
Run the row’s done check at 393×852 on /preview?look=paper, then the neighbor checks in the reviewer column.
cd web && npm run test:harvest.
If something the row broke is real, fix only that and re-check once.
If it fails again, stop and write the blocker on web/KEPT-BOARD.md.
If it passes, write one log line: row id, pass, what you clicked. Do not start the next row.
Morph --travel stays 1080ms. Harvest z-index stays 120. No vercel --prod.
```

## Builder prompt

```
You are the builder for polish row <id> on vocalLearn, branch cloud/overnight-ui.
Read that row in web/lane-plans/22-phone-polish-pass.md. Edit only its files.
Mobile only. Paper at 393×852, /preview?look=paper, with data-halo-native set. Ignore the lab mixer. A desktop-only fix is not done. The phone report at the top of that file is the bug list.
Do the job. Run the done check. cd web && npm run test:harvest.
Update web/KEPT-BOARD.md with one log line. Stop. Do not start the next row.
Morph --travel stays 1080ms. Harvest z-index stays 120. No vercel --prod.
```

## Order

A dead controls first (menu-to-chat, freeze, composer scroll, repeated taps). Then his phone check. 1 shell. 2 header. 3 play. 4 chat. 5 sheets. 6 joins last. 7 never, unless he opens one by name. Desktop is not a lane.
