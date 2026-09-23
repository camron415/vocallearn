# iOS fit + 1.3 Keeply

**Status:** **1.3 locked 2026-09-17** — invite-only iOS app (Capacitor around live Halo). Type scale + canonical phone still locked from 2026-09-14.  
**Canonical product index:** [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md)  
**Safari QA how-to:** [`web/HARVEST-OPS.md`](../web/HARVEST-OPS.md)

Paste for a new tab: `Read docs/IOS-FIT-AND-1.3.md. 1.3 is Keeply iOS (Capacitor around live Halo, TestFlight invites). Type scale locked. Canonical iPhone = default Text Size + Standard Display Zoom. Do not shrink beads or Home seats. No promote.`

---

## Why first-run phone visuals looked wrong

Camron’s iPhone was on **larger than default Text Size**. Halo’s mobile CSS (header pocket `min(8.6rem, 46vw)`, 2×2 lock-in, 12px gutters, `100dvh` stages with `overflow: hidden`) was designed as a **one-screen composition**.

Agents (and Chrome device mode) assume:

- ~390×844 CSS px (iPhone 14/15/16 class)
- **Default** system Text Size
- **Standard** Display Zoom (not Zoomed)
- Bold Text off
- Safari Aa / page zoom 100%
- Portrait

That is **not** what his phone was. After he switched Text Size back to default, the 1.2 mobile decisions looked like the film. Larger type (and taller Safari chrome) made headers clip, Keep show fewer beads, and screens scroll that were not supposed to.

**Agents must not treat DevTools iPhone frames as iOS.** Chrome does not simulate Dynamic Type, Display Zoom, Bold Text, or Safari toolbar height.

---

## Lock: one type scale (Camron 2026-09-14)

**Do not reflow Halo into a scrolling document when someone ticks Text Size up.** Prefer one decided UI scale.

Already in CSS (`web/src/app/styles/tokens.css` on `html, body`):

```css
-webkit-text-size-adjust: 100%;
```

That blocks most of Safari’s automatic text inflation. **Keep it.** Chat thread scrolling is correct. Header / Home field / play chrome should **not** grow a second scrollbar from type.

Chat still scrolls. That is content, not a fit bug.

### What we cannot freeze

| Setting | Effect | Policy |
| --- | --- | --- |
| **Text Size** (Display & Brightness) | Can inflate Safari text + make OS/Safari chrome taller → shorter `dvh` | **Lock type** via `text-size-adjust: 100%`. QA at **default**. |
| **Display Zoom** (Standard vs Zoomed) | Shrinks CSS width (~390 → ~320). Not bigger letters. | Layout must still work at ~320. Keep **swipes**. Do **not** shrink bead diameter or Home 16-seat map. |
| **Device width** | SE ~375, Pro ~393, Max ~430 | Same objects; tight width, not a second design language. |
| **Safari Aa / pinch-zoom** | Page zoom | Do **not** set `user-scalable=no` / `maximum-scale=1` (App Review + a11y). |
| **Bold Text** | Wider labels (“Cove”, buttons) | Truncate / icon; don’t wrap the topbar into two rows at default type. |

Frozen craft still frozen: harvest z-index **120**, morph `--travel` **1080ms**, bead diameter, Home seating, play sheet 832 / inner ~440. Spec: `web/HALO-V2-SUNDAY.md`.

---

## Canonical QA iPhone (sign visuals here)

Before any more mobile visual work or Safari sign-off:

1. **Settings → Display & Brightness → Text Size** = **default** (middle; not Larger Accessibility Sizes).
2. **Display Zoom** = **Standard** (not Zoomed).
3. **Bold Text** off.
4. Safari **Aa** = 100% for this site.
5. Portrait, Pro-class phone if possible.

Optional photos at Zoomed or +1 text = “not the film,” not a 1.2 blocker if type stays locked.

Lab `/preview` stays the mixer. Family `/ask` is **1.2.0** as of 2026-09-17.

---

## Calendar: what old 1.3 said vs today (2026-09-14)

`PRODUCT_ROADMAP.md` (Aug 31 / Sept 1). Cadence ~2 weeks. **Mid-Sep = close 1.2, not start 1.3.**

| Version | Then | Old theme |
| --- | --- | --- |
| **1.2** Mid-Sep | **this week** | Luna, intent harvest, chat unbox, light tour, Safari QA, friends if quality holds |
| **1.3** Early Oct | ~2–3 weeks out | Streaks, extra-round cooldown, achievements, grading, **thin Teach-me**, inline edit, T&S draft, brand name |
| **1.4** Mid-Oct | after that | **iOS TestFlight** (Capacitor around web), Stripe, push, Teach-me integrated |

### 1.2 vs actual (shipped 2026-09-17)

| Old 1.2 item | Actual |
| --- | --- |
| Luna | On production: `HALO_USE_LUNA=1` + `OPENAI_API_KEY` |
| Intent harvest | **Fatter** than the old 1.2 list (TurnPlan, discovery loop, cue uniqueness, harness) |
| Chat unbox | Camron QA signed |
| Collect lock-in + inspect | Shipped; play sheet signed light + dark |
| Phone Home seats | Camron signed 2026-09-17 |
| Safari iPhone QA | Signed at default Text Size + Standard zoom |
| Light tour | H1 line only; no slideshow |
| Friends wave | Unblocked — live is **1.2.0** |

We are **late on promoting a fatter 1.2**, not late on 1.3 homework.

### Later locks that already replaced old 1.3

- **Sept 1** — two-door Ask; Teach-me opt-in not intercept; iOS 1.4 after Safari QA.
- **Sept 6** — park Teach-me, streaks, Stripe, iOS until uncoached rounds.
- **Sept 7** — [`FUN-LOOP.md`](./FUN-LOOP.md): no streaks/XP; lock-in + day-1 play + inspect; native amplifies a working loop.
- **Sept 12** — [`WESLEY_FOUNDER_ADVICE.md`](./WESLEY_FOUNDER_ADVICE.md): more non-family on the **live site**, then pay test. Not a kids pivot.

Old 1.3 streaks / Teach-me / achievements are **parked on purpose**.

---

## 1.3 locked (2026-09-17)

**Invite-only iOS app.** Not searchable App Store. Camron sends a TestFlight email; Halo invite still creates the account.

| Path | Fit |
| --- | --- |
| **TestFlight + email invites** | **1.3.** Closest to Lab / Early access / Family rings. Beta App Review on first build. Builds expire ~90 days. |
| TestFlight public link | Not invite-only — later if we want |
| **Unlisted App Store** | After TestFlight. Full review; anyone with the link can install — keep **in-app invite**. |
| Searchable App Store | **1.5+** |

**Stack:** Capacitor + WKWebView **navigates to live Halo** (same Next/Vercel, same AI routes). Not a React Native rebuild. Not VocalLearn `app/`. USB Xcode debug does **not** wait on the $99 account; TestFlight does.

**Waves:** 0 shell on Camron’s phone → 1 app chrome (launch, invite create-account, 2–3 first-run screens) → 1b morph/QA (Composer) → 1c Legal (13) → 2 TestFlight → **15 one-workshop joins (required 1.3 close)** → 16 bells (haptics / earcons / atom Listen). File locks: [`web/lane-plans/13-1.3-priority.md`](../web/lane-plans/13-1.3-priority.md). Close checklist: [`docs/PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md) § 1.3 close checklist.

### Wave 0 — Xcode on your phone (no LAN)

Folder: [`native/README.md`](../native/README.md). Capacitor WKWebView loads **production** `https://halo-gules-three.vercel.app`. Cellular works at work.

```bash
cd native
npm install
npx cap sync ios
npx cap open ios
```

Pick the iPhone, set Signing Team to your Apple ID, ⌘R. Free Apple ID is enough. `$99` is TestFlight only.

Onboard / Sign in with Apple+Google is a **different lane**: [`web/lane-plans/12-app-onboard.md`](../web/lane-plans/12-app-onboard.md). Composer send-speed is a third lane — do not mix.

Capacitor is still this CSS. The shell **helps** fit (no Safari URL bar → more stable `dvh`). It does not one-size SE vs Pro Max.

**Do not retune** z 120 / 1080 / beads / seats without a Replay. Teach-me, streaks, Stripe, **cloud/duplex** STT/TTS stay later. On-device dictate + atom Listen are 1.3 lanes 18–20 after Native + Composer unlock — do not start them from this Native chat.

---

## Brand: Keeply (working, not unique)

Camron’s pick for the **app people see**. Loop vocabulary stays **Cove / Keep / Home**. Do not mass-rename `Halo*` / `APP_NAME` in Wave 0.

Already in the world:

| Collision | What it is |
| --- | --- |
| [Keeply – Hide photos & notes](https://apps.apple.com/us/app/keeply-hide-photos-notes/id757172898) | iOS vault since ~2013 |
| [Keeply – AI link organizer](https://apps.apple.com/us/app/keeply-ai-link-organizer/id6751549375) | iOS Utilities, 2026 |
| [keeply.com](https://keeply.com) | Ampko Oy (Finland) — lead radiation blankets. **Do not buy expecting this.** |
| **Keepy** (no L) | Kids artwork / memory app (`keepy.me`) — sounds the same |
| USPTO KEEPLY | Hand tools (shears), different class |
| Shopify / keeply.work | Unrelated SaaS |

Apple listing name must be unique. Bare **Keeply** is likely rejected. Before App Store Connect: either a modifier (**Keeply Ask**) or a cleaner unused word. Domain: look at **free** TLDs (`.ai`, `.app`, `.co`, `.io`) this weekend — not `keeply.com`. Wire the winner to Vercel for desktop + the WebView origin later.

---

## Do not do from this file

- No src for a Dynamic Type reflow system.
- No shrinking Keep beads or Home seats to “fit more.”
- No `user-scalable=no`.
- No VocalLearn Expo restyle as the family app.
- No public App Store / public signup in 1.3.
- No promote of family `/ask` unless Camron says promote.
