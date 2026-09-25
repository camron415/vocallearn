# Phone handoff — 2026-09-24 night

Read this before editing. The last chat burned a day toggling the same three strategies. Do not repeat them.

Branch: `cloud/overnight-ui`. Phone loads `https://halo-lab-personal-f999.vercel.app`. Local worktree that has this branch checked out: `/tmp/halo-overnight`. The main repo may still be on `halo-ui-streamline`. Do not checkout this branch there if that worktree exists.

Lab only. No `vercel --prod`. No `deploy:early`. Family `/ask` stays 1.2.0. Do not change `--travel` (1080ms) or harvest z-index 120.

## What the phone is

The iPhone app is a Capacitor WKWebView of the lab site. It is not a separate UI. `data-halo-native=1`. Native background and splash are paper `#fafaf9` (`native/capacitor.config.js`). A full document load flashes white before any CSS can paint. Dark mode does not fix that without an Xcode rebuild. Do not rebuild Xcode unless Camron asks.

The composer already lives in `AskShell`, mounted from `web/src/app/ask/layout.tsx`, above `/ask` and `/ask/[id]`. History → an existing chat stays inside that shell and feels fine. Cove out of a review stays on the page and feels fine. Ask is the broken path.

## What Camron last saw

Force-quit, reopen, type, tap Ask.

1. A pause on “Asking…”.
2. Then Home disappears.
3. Dark gray screen, the composer at the bottom, and one bubble with the question.
4. The composer looks finished. No reply. It stays there.

That is the opening stub in `AskShell.showOpening`. It paints the line and clears `sending` before `ChatThread` mounts. The real page never replaced it, so the stream never started. `sessionStorage` key `halo-ask-live:<id>` only helps after `ChatThread` mounts and resumes.

Tip when this was written: `ac7b0e5` (plus this file).

## The only job

Make a phone Ask mount the real chat and start the reply.

Done when, on the phone, after one force-quit and reopen:

1. Type and tap Ask. The reply appears. Not a gray screen with one bubble and a finished composer.
2. History → a chat still opens, no white flash.
3. Hold a chip that has a real `askId` opens that chat. A chip with no `askId`, or an id of `1` through `6`, still does not navigate.
4. Cove out of a review still returns Home without a flash.
5. `cd web && npm run test:harvest` passes.

Then stop. Deploy the lab alias once. Write one line on `web/KEPT-BOARD.md`. Do not start a second theory in the same turn. If the phone check fails, write what the phone did and stop.

Camron checks once. Do not ask him to film unless a new bug appears. Chrome at 393 is not a sign-off.

## Do not do these again

Each one was tried. Each one traded one bug for the next.

- **Do not `location.assign` (or any full load) on Ask, hold, or History.** It flashes white because the web view background is `#fafaf9`.
- **Do not `router.push` while the iOS keyboard is up.** WKWebView stalls. History works because the keyboard is down. If the keyboard flag is on, clear it and blur, then push after a short wait. That wait alone does not mount the chat.
- **Do not run the 1080ms Home leave and then navigate on the phone.** `goAfterLeave` short-circuits native on purpose. Turning that travel back on froze the web view. Desktop can keep 1080ms. Do not change the constant.
- **Do not delete a working open and replace it with a stub that never mounts `ChatThread`.** The gray one-bubble screen is that stub. `showOpening` hides Home and clears the button. The reply lives in `ChatThread` after `/ask/[id]` actually loads.
- **Do not leave `sending` true until a soft navigation that never finishes.** That is the eternal “Asking…”.
- **Do not start the SSE body on Home and then abandon the page.** Native Ask uses `prepareOnly` so the server creates the conversation and stores the user message, then the chat page is supposed to resume. Keep that unless you replace it with a stream that `ChatThread` actually attaches to.
- **Do not treat a missing `askId` as a successful hold.** It returns on purpose. Do not invent a chat id.
- **Do not write `--kb-inset` on the focus tick, `scrollTo` while the keyboard is presenting, or `position: fixed` on `body`.** Those drop the keyboard or jump the greeting. One inset write after the keys have settled is allowed. Native eases that inset over 320ms. `html[data-halo-native] { transition: none }` was the snap. Do not put it back.
- **Do not fade Home away as a substitute for navigation.** Fading chips while the keyboard is up is intentional so they do not take taps. It is not the chat.
- **Do not swarm `!important` or rewrite the app.** `LoopSkin.tsx` has on the order of 800 `!important` rules. That makes visual fixes fight each other. It is not why the reply never starts. Harvest, Keep, review, and History stay.
- **Do not deploy a second guess because the first deploy has not been checked.** One change, one alias, stop.

## Files

- `web/src/components/AskLanding.tsx` — native `startAsk` posts `prepareOnly`, then `showOpening`, then `pushAsk`. `pushAsk` is `router.push` only.
- `web/src/components/AskShell.tsx` — `showOpening` sets `opening` and `mode` to chat. Clear `opening` only when the real chat route is actually showing, or remove the stub once the route mounts.
- `web/src/components/ChatThread.tsx` — resumes from `halo-ask-live` and `takePendingResume`. This is what must run.
- `web/src/app/ask/[id]/page.tsx` — server page. Soft nav waits on this. That wait is why a push can look like nothing.
- `web/src/app/api/chat/route.ts` — `prepareOnly` returns JSON `{ conversationId }` after the user message is saved.
- Do not edit `LoopSkin.tsx`, seating, the signed phone dock, or `native/` for this job.

## Deploy

From `/tmp/halo-overnight/web`:

`npm run test:harvest && npm run build && npx vercel deploy --yes`

Then `npx vercel alias set <preview-host> halo-lab-personal-f999.vercel.app`.

Do not parse `vercel ls`. The host is in the deploy output (`Preview https://…`).

Camron force-quits Halo and reopens it. No USB unless the web view is stuck on an old origin.
