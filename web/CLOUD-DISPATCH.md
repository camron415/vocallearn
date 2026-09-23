# Cloud dispatch

Job board for Cloud Agents. Local chats do not edit a lane marked `ready` or `running` here.

**Updated:** 2026-09-23  
**Orchestrator:** local Halo chat  
**Branch agents must use:** `halo-ui-streamline` after this tree is pushed. Remote today is `ef7fd94` (v1.2.0). The 1.3 tree is still uncommitted on the laptop, so a cloud VM that clones now will not see NativeBoot, legal pages, juice, or this file.

## Wake rule

One item per wake. Then stop.

1. Read this file. Claim only the lane in your prompt.
2. If your current item is `blocked_on_spec` or `needs_camron`, stop. Do not invent the spec. Do not resubscribe.
3. Do that item. `cd web && npm run test:harvest`. For UI, `npm run dev` and check `/preview` at 393px and at desktop.
4. Edit the item status in this file to `done`, name the next item, and write a Kept-board log line.
5. Commit on `cloud/<lane>` only. Open or update a PR into `halo-ui-streamline`. Do not merge. Do not push the working branch itself. Do not deploy production.
6. If the next item in **this lane** is `ready`, subscribe to a 30-minute timer whose prompt is: `Read web/CLOUD-DISPATCH.md and continue lane <lane> only. One item. Then stop.`
7. If the next item is not `ready`, do not subscribe.

A cron automation is the backup when the timer does not fire. Same rule: one item, then stop. A run that never exits blocks the next cron fire for that automation.

## Spend

Cloud agents bill the model you pick, against included Cursor Models or Other Models first. There is no separate unlimited cloud-hours pool.

- Pro+ does not get the long-running research preview (that preview is Ultra, Teams, and Enterprise). A normal cloud run still finishes a multi-step item without the laptop. It does not run for 36 hours by itself.
- On-demand has to be enabled or a run will not start. Included usage is spent first. Set the hard limit around $15, not $0. A run will not start unless about $2 of room remains under that limit.
- Grok 4.7 with Fast off. Automations open the model's max context window; do not read the whole repo. Above 256k input, Grok bills at 2×.
- Opus 5.5 for the spec lanes. One Fable session only if a spec lane fails twice on the same question.

## Frozen

Morph `--travel` 1080ms. Harvest z-index 120. Desktop 16-seat. Phone dock. `text-size-adjust`. Family `/ask` stays 1.2.0. No `deploy:early`. No `vercel --prod`.

## 1.3 as it stands

| Goal | State | Who |
| --- | --- | --- |
| Wave 0 shell on the phone, lab HTTPS | Met | Camron keeps the phone |
| Legal `/privacy` `/terms` + Settings links | Done in the dirty tree | Nobody reopens it |
| Onboard Packet A (tour, email, invite create) | In the tree, unsigned | `needs_camron` on a phone |
| Onboard Packet B (Apple / Google) | Blocked on Apple Developer approval | Camron |
| Keyboard stays up; send does not flash Home | 21:43 film still fails | Lanes K and C |
| One workshop (joins, land, no hitch) | Required, not signed | Lane J after spec S3 |
| Bells: haptics + first-sentence Listen | In the tree | Phone feel stays Camron. Web holes are lane B |
| White frame on resume | Splash is `#fafaf9` | Lane N, then Camron rebuilds in Xcode |
| TestFlight / promote | Not this week | Camron |

## File locks

| Lane | May edit | Must not edit |
| --- | --- | --- |
| H harvest | `HomeBubbles.tsx` quote/miss path, harvest tests | AskShell, LoopSkin, NativeBoot, `native/` |
| K keyboard | `NativeBoot.tsx`, `MotionProvider.tsx`, keyboard inset in `motion.css` | AskLanding, ChatThread, pending-turn, AskShell, LoopSkin, `native/` |
| C composer | AskLanding, ChatThread, pending-turn, AskShell, SpringStage | LoopSkin, NativeBoot, `native/`, `motion.css` |
| J joins | LoopSkin motion tokens, `home.css` land/join, HarvestLock land CSS | 1080, z 120, AskShell, `native/` |
| N splash | `native/capacitor.config.js` background colors only | Xcode project, signing, any web file |
| S specs | This file and `web/lane-plans/` | Any `src/` or `native/` |

## Lane H — harvest proofs

**Model:** Grok 4.7, xhigh, Fast off. **Status:** `ready`. **Branch:** `cloud/harvest`.

### H1 — current — `ready`

Miss reveal shows a token where the answer sentence should show. `quoteParts` in `web/src/components/HomeBubbles.tsx` prefers span/token over `answer`.

Done when a dry test fails on token-only reveal and passes when the full answer sentence is what the player sees. `npm run test:harvest` green. Play-sheet layout unchanged.

### H2 — `blocked` until H1 is `done` and lane C is not `running`

Thinking-stream: the reply should replace in place sentence by sentence, not grow a paragraph forever. Spec is the parked note on the Kept board (2026-09-17). Files move to lane C if they are AskShell or ChatThread. If H2 needs those files, mark H2 `handed_to_C` and stop.

## Lane K — keyboard

**Model:** Grok 4.7, xhigh, Fast off. **Status:** `blocked_on_spec`. **Branch:** `cloud/keyboard`.

### K1 — `blocked_on_spec`

Implement spec S1 from this file. Do not start until S1 status is `ready`.

21:43 film: Ask focuses, keyboard rises, about a second later Home is back unless he is already typing. Native-only. Desktop at 1280 must still open a chip round.

Done when `/preview` at 393 keeps the composer focused through the keyboard inset, `test:harvest` is green, and this file lists a one-tap phone check for Camron.

## Lane C — composer send

**Model:** Grok 4.7, xhigh, Fast off. **Status:** `blocked_on_spec`. **Branch:** `cloud/composer`.

### C1 — `blocked_on_spec`

Implement spec S2. The 21:43 send of “he” stayed on Home with Asking…, then a white flash put Home back.

Done when a lab send from Home lands in the thread without a white frame and without popping Home, at 393. Morph 1080 stays. `test:harvest` green.

## Lane J — joins

**Model:** Grok 4.7, xhigh, Fast off. **Status:** `blocked_on_spec`. **Branch:** `cloud/joins`.

### J1 — `blocked_on_spec`

Implement spec S3. One owner of LoopSkin. Required before 1.3 is called done.

Done when the duration map in S3 matches computed styles on `/preview` for morph land, harvest land, and menu sheet, and no rule retunes 1080 or z 120.

## Lane N — splash color

**Model:** Grok 4.7, Fast off. **Status:** `ready`. **Branch:** `cloud/splash`.

### N1 — current — `ready`

`native/capacitor.config.js` uses `#fafaf9` for `ios.backgroundColor`, SplashScreen, and StatusBar. Resume flashes white on dark Home.

Set those three to the dark paper field already used by Halo dark theme. Do not run `xcodebuild`. Do not change `server.url`. Done when the diff is only those colors, and this file says Camron must rebuild in Xcode before the phone changes.

## Lane S — specs (Other Models)

**Model:** Opus 5.5, thinking, Fast off. **Not Fable** unless this lane fails twice. **Branch:** `cloud/specs`. Specs only. No `src/` edits.

### S1 — keyboard machine — `ready`

Write the state machine under **Spec S1** below. Read `NativeBoot.tsx`, `MotionProvider.tsx`, and `web/lane-plans/21-phone-breaks.md`. Explain the 21:43 drop in that machine. Name the smallest code change for K1. Set S1 to `ready` for lane K by changing K1 to `ready` only after the machine is in this file. Then stop. Do not implement.

### S2 — send flash — `blocked` until S1 is done

Same for the white flash on send. Read AskLanding, pending-turn, AskShell. Set C1 to `ready` when the spec is in this file. Stop.

### S3 — duration map — `blocked` until S2 is done

Table of instant / tap / travel / hold for morph land, harvest land, menu sheet, lock-in fly. Cite file and selector. 1080 and z 120 stay put. Set J1 to `ready`. Stop.

## Spec S1

_Empty until the Opus wake writes it._

## Spec S2

_Empty until the Opus wake writes it._

## Spec S3

_Empty until the Opus wake writes it._

## Needs Camron

These do not get a cloud loop.

- Sign the phone films for K and C after their PRs exist.
- Rebuild the iOS app after N1 so the splash color is in the binary.
- Apple Developer approval, then Packet B.
- TestFlight, promote, production deploy.
- Whether a haptic “feels” medium. The web weights are already in `web/src/lib/halo-juice.ts`.

## Paste prompts

### Opus, lane S, first wake

```
You are lane S on vocalLearn, branch halo-ui-streamline.
Read web/CLOUD-DISPATCH.md and do S1 only.
Opus 5.5 thinking. Fast off.
Write Spec S1 into that file. Then set K1 to ready.
Do not edit src or native. Do not start S2.
Commit on cloud/specs and open a PR. Do not merge.
Stop. Do not subscribe.
```

### Grok, lane H, first wake

```
You are lane H on vocalLearn, branch halo-ui-streamline.
Read web/CLOUD-DISPATCH.md and do H1 only.
Grok 4.7, xhigh, Fast off.
One item. test:harvest. Update this file and web/KEPT-BOARD.md.
Commit on cloud/harvest and open a PR. Do not merge. No promote.
If H2 is ready and does not need lane C files, subscribe a 30-minute timer:
"Read web/CLOUD-DISPATCH.md and continue lane H only. One item. Then stop."
Otherwise stop and do not subscribe.
```

### Grok, lane N, one wake

```
You are lane N on vocalLearn.
Read web/CLOUD-DISPATCH.md and do N1 only.
Grok 4.7, Fast off.
Colors in native/capacitor.config.js only. No xcodebuild. No web files.
Commit on cloud/splash and open a PR. Do not merge.
Stop. Do not subscribe.
```

Start K, C, and J only after this file shows their item as `ready`. Use the same wake rule, branches `cloud/keyboard`, `cloud/composer`, and `cloud/joins`.
