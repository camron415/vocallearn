# iOS fit + 1.3 planning (2026-09-14)

**Status:** Camron planning lock for **type scale** and **QA device**. 1.3 theme is a **candidate** (not yet rewritten in `PRODUCT_ROADMAP.md`).  
**From:** Cursor chat 2026-09-14 (Camron + chief).  
**Canonical product index:** [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md)  
**Safari QA how-to:** [`web/HARVEST-OPS.md`](../web/HARVEST-OPS.md)

Paste for a new tab: `Read docs/IOS-FIT-AND-1.3.md. Type scale is locked. Canonical iPhone = default Text Size + Standard Display Zoom. Do not shrink beads or Home seats. No promote.`

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

## 1.3 candidate (Camron, not yet canonical)

He wants: **invite-start iOS app → UI/transition polish → then a more engaging review loop.**

That **pulls TestFlight from 1.4 into 1.3**. Do not wrap until Safari is signed on the canonical settings above.

Apple (invite vs public):

| Path | Fit |
| --- | --- |
| **TestFlight + email invites** | Closest to Halo rings. Beta App Review on first build. Builds expire ~90 days. TestFlight app. |
| TestFlight public link | Not invite-only |
| **Unlisted App Store** | Full review; not in search; **anyone with the link** can install — keep **in-app invite**. After TestFlight. |
| Searchable App Store | Old **1.5** |

Capacitor/WKWebView is still this CSS. The shell **helps** fit (no Safari URL bar → more stable `dvh`). It does not one-size SE vs Pro Max.

**Proposed 1.3:** TestFlight (email rings) + locked type film + polish (morph ghost, play feel, fly trust) + leftover loop if not in 1.2 (Drop, H1, due-drop). **Do not retune** z 120 / 1080 / beads / seats without a Replay.

**Later:** more engaging reviews, Teach-me thin, Stripe. **Streaks stay out** until the loop is sticky.

To make this official, update `docs/PRODUCT_ROADMAP.md` § 1.3 / 1.4 in a later turn when Camron says so.

---

## Do not do from this file

- No src for a Dynamic Type reflow system.
- No Capacitor until 1.2 Safari sign-off at default type.
- No promote.
- No shrinking Keep beads or Home seats to “fit more.”
- No `user-scalable=no`.
