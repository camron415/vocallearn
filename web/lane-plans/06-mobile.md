# Lane 6 — Mobile web (Safari iPhone)

Plan only. 2026-09-06. No `web/src`. No KEPT-BOARD. No deploy. No promote. No Capacitor / TestFlight.

**Job:** the product a person would actually open on a phone — type-first, Keep visible, harvest fly trustworthy, play usable. iOS shell is a wrapper around Safari. It does not fix Safari.

---

## Live vs lab (assumed)

| Surface | What phone users get |
| --- | --- |
| **Early access production** `136d15f` | Paper `/ask`. Header = Cove + Keep pocket + **Library + History + Settings as three icon buttons**. No `ChromeMenu`. Keyboard inset, composer wrap, recipes body-scroll, 1.1.2-mobile header CSS. Dictate mic still in the composer. Grok-only, 4000-char. |
| **Working tree (not promoted)** | `HaloHeader` swaps those three buttons for **`ChromeMenu` hamburger when `useCoarsePointer()`**. HarvestLock in chat. AskShell parked (`/preview` only). Intent/Luna/ask-guard exist; **not this lane.** |
| **VocalLearn `app/`** | Separate product. Does not drive Halo Keep. **Not a phone fix.** |

Family today = production. Score “what they get,” not “what the tree can do.”

Frozen (every ticket): harvest z-index **120**, morph `--travel` **1080ms**, Paper, bead diameter, Home seating. AskShell parked. Family `/ask` frozen until Camron says promote.

---

## Scores I disagree with

Head: Mobile 6, Voice 4, First-session 4, Morph 6.

| Category | Head | Mine | Why (code / ship evidence) |
| --- | ---: | ---: | --- |
| **15 Mobile Safari** | 6 | **5 live / 7 after hamburger + fly-trust** | 6 is a blended craft score. Live still makes Keep compete with three header actions (`136d15f` `HaloHeader` has no `ChromeMenu`). Keyboard, wrap, play, recipes scroll **are** real (QA-2 / 1.1.2-mobile; Camron LAN QA good). Usable type-first Ask is a 5: works, not a reason to return. Hamburger in this tree is the width fix; it is not family yet. |
| **23 Voice / dictation** | 4 | **4 overall; 2 on iPhone Safari** | `DictateButton` treats “API constructor exists” as support. iOS Safari exposes `webkitSpeechRecognition`, so the copy *“Voice dictation isn’t available in Safari on iPhone”* **never fires**. Mic is a trap: tap → maybe permission → hang / no results. HTTPS LAN copy is honest (`Dictation needs HTTPS…`). Desktop Chrome is the 4. |
| **3 First-session** | 4 | **4; phone 3** | Empty Home + unexplained harvest is Product/UI. Phone makes it worse: fake mic, three header icons, fly that can skip (see auto-soft). Not this lane’s copy to write. |
| **11 Morph** | 6 | **6 desktop; 5 phone** | Page-swap ghost is structural (`COMPOSER-MORPH-PLAN.md`). Worse on phone (keyboard + slower RSC). **Do not own.** AskShell parked after Camron `/preview` fail. Do not retune 1080ms. |

I agree Mobile is not a 3: type-to-send, keyboard inset, play sheet, and harvest-burst clamp already shipped. I disagree that 6 is what **live iPhone** is.

---

## Further split (1–10)

| Sub | Score | Evidence |
| --- | ---: | --- |
| Type-to-send + keyboard | **7** | `MotionProvider` sets `--kb-inset` from `visualViewport` only (no double-pin `--app-top`). `data-halo-kb` pads Home/Chat/play. Phone field `font-size: 16px` (no focus-zoom). Composer grid: field row, Attach/Dictate/Send row (`motion.css` `@media (max-width: 720px)`). |
| Header vs Keep width | **4 live / 7 lab** | Live: three `history-wrap` triggers + pocket `max-width: min(11rem, 58vw)` → ~3 beads, left fade. Tree: `compact ? ChromeMenu : Library+History+Settings`. CSS already hides labels, shows icons. |
| Harvest fly trust | **5** | Burst path clamps x to viewport (`HarvestFlights` `pad` 20, `vw * 0.22`). Land box clamped (`keepLandBox`). **Risk:** `ChatThread` passes `reduced={useEffectiveMotion() === "reduced"}`. First visit, `detectWeakHardware()` sets intensity reduced if `hardwareConcurrency <= 4`. Safari iPhone commonly reports **4**. That is the old “no fly on iPhone” bug. Board said QA-2 limited skip to `prefers-reduced-motion`; **current tree still uses effective motion (includes auto-soft).** Instant land = highlights then beads with no orb = looks broken. |
| Play sheet / SAY | **7** | `@media (max-width: 640px)`: one-column pills, sheet `overflow-y: auto`, `-webkit-overflow-scrolling`. SAY: no autofocus on ≤720px; `preventScroll` + `scrollIntoView nearest`. Keyboard: play max-height `100dvh - kb - 5.25rem`. Frozen seating / 832 sheet — do not restyle Paper. |
| Dictation honesty | **3** | Mic always rendered. `supported` is constructor-only. Failure copy is the no-ctor branch, which iPhone does not take. |
| Morph / ghost | **5** | Known; parked. Worse on phone. Lane 5 / AskShell later. |
| Reduced-motion vs auto-soft | **4** | OS reduce: skip fly (correct). Weak-hardware auto-soft: skip fly (wrong on iPhone). |
| Breakpoint agreement | **5** | JS compact = `max-width: 720px` **OR** `pointer: coarse`. Phone CSS is **only** `max-width: 720px`. Landscape iPhone (~844–932 CSS px) can get hamburger **and** desktop nowrap composer / desktop Keep width. `isPhoneHomeView` is width-only (`PHONE_HOME_MAX_W = 720`). |

Mean of these eight ≈ **5.1 live**. Head 6 is the post-hamburger hope.

---

## What wife / parents actually hit on iPhone Safari (live)

Day 1, production `/ask`:

1. Empty Home. Greeting. Center composer. **Type.** First tap focuses (idle suggest skipped when `coarse`). Keyboard lifts; greeting hides; Send stays on the second row.
2. Morph Home → Chat. Blank ghost ~1s. Answer streams. Wrap works (12px inset, `minmax(0,1fr)`, `scrollbar-gutter: auto`).
3. If harvest: kind spans. **Maybe** orbs to Keep (z 120). **Maybe** chips just appear (auto-soft). Dock shows ~3 beads; Library/History/Settings icons eat the rest.
4. Mic looks like ChatGPT. Often does nothing useful. No “type instead” unless ctor missing (it isn’t).
5. Tomorrow: due chips above composer (phone walls). Tap → SEE then SAY. Type SAY. Day cap 3. Gold ◎.

They can chat. They often will not understand Keep. They cannot inspect beads. Voice is not a feature. **This is not ready to wrap as an app.**

---

## Header vs beads

**Live:** Cove | ◎ | pocket (~3 beads, clipped fade) | Lib | Hist | Settings.

**This tree, coarse pointer:** Cove | ◎ | pocket (wider) | **Menu** → sheet: History, Library, Settings. Nested menus `hideTrigger`.

That is the right phone chrome. Collection is the product; Settings is not.

Promote ChromeMenu only after Safari QA:

- Home and Chat: one hamburger, three destinations, Close works, no stacked sheets stuck open.
- Keep pocket visibly wider (≥5 beads before clip at default slot).
- Harvest land still hits `[data-keep-pocket]` (menu must keep `data-saves-pocket` / land target).
- Desktop ≥721px **and** fine pointer: still three labeled actions (no hamburger on Camron’s laptop).
- Do not shrink bead diameter. Do not gray bands. Do not put Menu where Cove is.

`motion.css` `.chrome-menu > .history-wrap { display: contents }` is nested-trigger CSS; the root node is **both** `chrome-menu` and `history-wrap`. QA for double-wrap / missing tap target before promote.

---

## Dictation — honest copy (spec, not code)

Product stance: **type-first on iPhone.** Voice is not a 1.2 promise.

| Context | Do |
| --- | --- |
| Safari iPhone / iOS WebKit (coarse + Apple UA), or ctor missing | **Hide the mic** *or* render it disabled with visible title / composer error: *“Type on iPhone — Safari dictation isn’t reliable.”* Do not wait for a failed `start()`. |
| `http://` LAN (`dev:lan`) | Keep existing: *“Dictation needs HTTPS. On your phone use the lab deploy link, not the local Wi‑Fi address.”* |
| Desktop Chrome / Edge, HTTPS | Keep Web Speech. That is the 4. |
| Play SAY | Stays **type**. Do not add SpeechRecognition to the round. Native STT is Lane 9, later. |

Do not ship a cloud STT just to make the mic light up. Do not tell family “talk to Halo” until Safari (or a real native engine) actually transcribes.

---

## Gate list — Safari must do X before any iOS shell

Capacitor / TestFlight / PWA “Add to Home Screen” **after** all of these are true on **Safari iPhone** (lab URL, then early access). A WebView does not add Web Speech, `visualViewport`, or `100dvh`. It adds a store icon around the same bugs.

**Safari must:**

1. **Type-first Ask** — focus composer, type, Send; keyboard never covers Send or the play SAY field; no iOS focus-zoom (16px field holds).
2. **Keep visible** — hamburger live; pocket shows a real collection (not three crushed beads); harvest land target on-screen.
3. **Harvest fly trustworthy** — orbs fly to Keep unless the user (or OS) asked for reduced motion. Auto-soft / `hardwareConcurrency` must **not** skip flights. z-index stays 120.
4. **Play usable** — tap due chip; SEE all; SAY all; miss quote; end `You did good.`; sheet scrolls inside; pills one column; day-cap line readable above keyboard.
5. **Dictation honest** — no working-looking mic that fails silently.
6. **Chrome complete** — History, Library (recipes scroll), Settings reachable from Menu; login/invite paper still usable.
7. **Reduced motion** — OS reduce: no fly, instant Keep; full motion: fly. Settings motion toggle respected **without** treating every iPhone as weak hardware.
8. **Three family members** finish a Home round on their phones **without a stand-over demo** (head-planner product gate). Loop comprehension beats a store listing.

**Safari should (not shell-blocking, still this lane):** landscape iPhone doesn’t get a desktop nowrap composer; first-harvest one-line copy (Lane 5/10 words, this lane checks it fits).

**Safari must not wait on:** AskShell, Teach-me, Stripe, push, native VocalLearn, bead inspect (Lane 5) — inspect helps collection but is not a shell gate if Keep is at least **visible**.

Roadmap 1.4 (“iOS TestFlight, gate: mobile web QA green”) is correct **as a gate**. The calendar date is not. Shell after the list above, not “mid-Oct.”

---

## Improvements vs related 1–10s

| Score | Now (this lane, after go) | Later | Never (this lane) |
| --- | --- | --- | --- |
| Mobile 5→7 | Promote ChromeMenu; fly vs auto-soft; hide/disable iPhone mic; landscape CSS/JS agree | HarvestLock phone layout when Lane 4 promotes; bead inspect hit targets (Lane 5) | Capacitor to “fix” Safari; retune 1080 / z 120 |
| Voice 2→4 on phone | Honest copy / hide mic | Lane 9 native STT for SAY **if** chief wants speak-to-grade | Fake Web Speech polish; cloud STT for Ask this month |
| First-session 3 | Fit Product’s one line on 18ch greeting; don’t add a tour overlay | — | Mixer language, Nile, Teach-me CTA |
| Morph 5 | Document only | AskShell if Camron reopens | Ghost clone, View Transitions as the fix, iframe shell |

How this lane helps “people come back”: **Keep has to be seen and believed on the device they actually use.** Wrong harvest is Lane 2. Invisible Keep is us. A store app around a crushed dock is worse.

---

## Top 5 implementation tickets

Human can fail each. Files we would touch **later** (not now). Do not own AskShell, `keep-memory`, miner, `app/`.

### T1 — Promote phone hamburger so Keep can breathe

- **Files:** `ChromeMenu.tsx`, `HaloHeader.tsx` (already wired in tree), `motion.css` (`.chrome-menu`, `.keep-pocket`, `.topbar-action-*`).
- **Success:** On Safari iPhone lab URL, header shows **one** Menu. Pocket wider than live 136d15f (screen-record side-by-side). History / Library / Settings open from the sheet and close cleanly. Desktop unchanged (three labels). Harvest still lands in the dock.
- **Fail:** Menu + three icons both show; pocket still ~3 beads; land misses dock; desktop gets hamburger.

### T2 — Harvest fly unless OS reduced-motion

- **Files:** `ChatThread.tsx` (`reduced` passed to `HarvestFlights` / `CollectFlights`), possibly `MotionProvider.tsx` / `useEffectiveMotion` **only if** harvest must ignore auto-soft while menus still soften. Prefer a **harvest-specific** `prefers-reduced-motion` flag so we do not reopen wet-chrome perf.
- **Success:** iPhone with `hardwareConcurrency === 4`, Settings motion full, **no** OS reduce → orbs fly to Keep (z 120). OS reduce → instant land, no orb. Recipe flyer same rule.
- **Fail:** Chips appear in Keep with no flight on a stock iPhone. Do not “fix” by retuning duration or z-index.

### T3 — DictateButton honesty

- **Files:** `DictateButton.tsx`, phone CSS in `AskLanding` / `ChatThread` composer actions if the button is hidden (reflow Send).
- **Success:** Safari iPhone: no tappable “working” mic. User sees type-first (hidden or disabled + the sentence in Dictation spec). LAN http still explains HTTPS. Desktop Chrome mic still dictates.
- **Fail:** Mic still starts recognition and hangs. Copy only in `sr-only`.

### T4 — Breakpoints: one definition of phone

- **Files:** `coarse-pointer.ts`, `motion.css` / play `@media` (720 vs 640), document `isPhoneHomeView` (Lane 3/5 own pack; we don’t retune seats — we align **composer/header** media with JS compact).
- **Success:** Landscape iPhone: composer still wraps (field then actions); header still compact; play pills still one column. iPad-with-keyboard (fine pointer, wide): desktop header labels, not hamburger, unless Camron says otherwise.
- **Fail:** Landscape nowrap crushes Send; or MacBook touch-screen gets hamburger.

### T5 — Phone smoke that a human can run

- **Files:** none in `src` (Lane 11 may paste into `HARVEST-OPS.md`). This lane’s later implement pass **runs** it on device, not in Chrome device-mode.
- **Success:** Checklist below is green on lab deploy **and** (after Camron promote) early access. Wife path: `/login` → `/ask` → type → harvest fly → Menu → History → Home → (if due) one round.
- **Fail:** Desktop-only QA, or LAN-only without the HTTPS dictation note.

**Phone smoke (Safari iPhone):**

- [ ] Ping / login / `/ask`
- [ ] Type, Send, stream, wrap
- [ ] Harvest fly → Keep (unless OS reduce)
- [ ] Menu: History, Library (recipes scroll), Settings
- [ ] Mic absent or honest
- [ ] Keyboard: Send visible; play SAY visible
- [ ] Due chip round if Lab QA Force due
- [ ] Hard refresh; Keep still there (cloud)

---

## Handoffs

| To | What |
| --- | --- |
| **Lane 5 UI** | Bead inspect must work in a clipped pocket (sheet, not a hover). First-harvest one line must fit ~18ch. Morph ghost: they own; we only report phone pain. Do not revive AskShell unless Camron asks. |
| **Lane 4 Review** | HarvestLock has no phone CSS beyond wrap. If promoted, SAY field + keyboard inset on **chat** (not only Home play). Play seating frozen. |
| **Lane 9 Native** | Freeze VocalLearn as lab. Do not start TestFlight. If Halo ever speaks SAY, port engine — don’t wrap Safari. |
| **Lane 10 Product** | Copy only: type-first, review tomorrow, Menu = History/Library/Settings. No tour chrome from us. |
| **Lane 11 Ops** | ChromeMenu + fly-trust + dictation honesty = promote checklist items. Duplicate `coarse-pointer 2.ts` is clutter (list, don’t delete in plan wave). |
| **Lane 2 Harvest** | Junk chips flying into a tiny dock destroy trust faster on phone. Precision before shell. |
| **Lane 3 Keep** | We don’t touch `keep-memory`. Overflow still silent; visibility is chrome. |

---

## Do not do

- Capacitor, TestFlight, PWA install prompt, `apple-mobile-web-app-capable` as a product strategy.
- Edit `AskShell`, `keep-memory`, miner / `ask-intent`, native `app/`.
- Retune harvest z-index 120 or morph 1080ms.
- Promote family `/ask` or `deploy:early`.
- Shrink or gray Keep beads to fit three icons (hamburger instead).
- “Fix” dictation with a cloud STT or by lying that Safari works.
- Auto-focus SAY on phone (already skipped — do not regress).
- Pin stages to `visualViewport` offset again (double-shift).
- Teach-me, streaks, Stripe, notifications as mobile work.
- Delete `* 2.ts` in this wave.

---

## Files this lane would touch (later)

`web/src/components/ChromeMenu.tsx`  
`web/src/components/DictateButton.tsx`  
`web/src/lib/coarse-pointer.ts`  
Phone CSS already in `motion.css`, `HaloHeader.tsx`, `AskLanding.tsx`, `ChatThread.tsx`, `HomeBubbles.tsx` (play focus / preventScroll only — not seating pack).

Not ours: `AskShell.tsx`, `keep-memory.ts`, `learn-mine.ts`, `app/`.
