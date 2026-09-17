# Composer morph — problem, options, and recommended path

**Date:** 2026-09-03  
**Status:** Planning only (no further morph work tonight)  
**Audience:** Future Camron + any agent touching Home ↔ Chat transitions  
**Related:** `SpringStage.tsx`, `AskShell.tsx`, `ask/layout.tsx`, `HALO-V2-SUNDAY.md` (frozen `--travel` 1080ms)

---

## Release context — 1.1.2 live

| Item | State |
| --- | --- |
| **1.1.2** | **Live on early access** (`halo-gules-three.vercel.app`) — Library ≡ recipes, Save-this-recipe pill, recipe dark mode, local parse (instant save), manila highlight wash, morph hotfixes |
| **Morph quality** | Improved but not “perfect.” Blank ghost ~1s after travel on production `/ask` (page-swap architecture). AskShell (Track 1) built in lab — persistent composer in `ask/layout`, hydration fix, lab deploy `halo-q1nibuepo-personal-f999.vercel.app` — **not promoted** to early access yet |
| **Frozen** | `--travel` 1080ms, harvest z-index 120, play sheet ~832px — do not retune without Replay / ship-blocker |

---

## The product ask (one sentence)

The composer is **one object**. It should stay on screen for every millisecond of the Home ↔ Chat loop. Only **text** and **placeholder** change; everything else (field chrome, buttons, fade of background) should feel as calm as chips fading in.

---

## Why this is hard today (root cause)

Halo’s signed-in flow uses **two Next.js pages**:

- `/ask` → `AskLanding` (hero composer, center)
- `/ask/[id]` → `ChatThread` (dock composer, bottom)

When you navigate, React **unmounts one page and mounts the other**. The composer is not one DOM node — it is **two separate instances** in two component trees.

The current morph system (`SpringStage.tsx`) papers over that gap:

1. **FLIP travel** on the leaving page (1080ms) — composer moves; user sees text.
2. **`pinComposeGhost`** at travel end — **blank painted div** covers the field (no text, no buttons) so the unmount does not flash.
3. **Router navigation** — RSC fetch, new page mount (variable latency).
4. **`useComposeMorph`** on the arriving page — may FLIP again from handoff pose.
5. **Content enter** — greeting, chips, chat scroll fade on their own timers.

The ~1–2s “ghost” is **not** “React is slow loading buttons.” It is **structural dead time** between step 2 and step 4 while the route swaps under a blank cover.

Prefetch (`router.prefetch`) and `pending-turn` (start Grok during travel) help **answer latency**; they do not remove the blank composer, because the composer itself is destroyed on navigation.

---

## Is there truly a way?

**Yes.** Many products do exactly this (iMessage input, Slack mobile composer, Instagram comment bar, Linear command palette). The solution is never “make the page swap faster.” It is **do not swap the composer**.

What does **not** exist as a magic browser API:

- There is no HTML tag that survives a full document navigation while animating.
- There is no CSS-only trick that keeps one React component mounted across two Next.js `page.tsx` files without a shared parent.

What **does** exist (proven patterns):

| Pattern | Idea | Used by |
| --- | --- | --- |
| **Persistent shell layout** | Composer lives in `layout.tsx` (or parallel route slot); only stage content swaps | Next.js App Router, most SPAs |
| **Single route, two views** | `/ask` toggles `view=home \| chat` in client state; no route change during morph | `/preview` today, many mobile apps |
| **View Transitions API** | Browser cross-document animation; still evolving, uneven Safari support | Chrome, some marketing sites |
| **Shared-element / FLIP portal** | One element in `document.body` portal; never owned by either page | Framer Motion `layoutId`, custom FLIP libs |
| **iframe / native shell** | Composer in native chrome; webview swaps content only | iOS apps, Electron |

For Halo (web, Next.js 16, Paper skin, Cove loop), the **durable** options are the first two.

---

## What we already built (Track 1 — AskShell)

**Files:** `web/src/app/ask/layout.tsx`, `web/src/components/AskShell.tsx`, `web/src/lib/ask-shell.ts`, `web/src/app/styles/ask-shell.css`

**Mechanism:**

- `AskShellProvider` wraps all `/ask/*` routes.
- **One** `ComposeStadium` instance stays mounted in the layout.
- `AskLanding` / `ChatThread` render **content only** when shell is active (phantom `compose-stack` on Home for chip layout walls).
- `leaveToChat` / `leaveToHome` call `travelComposeTowardDock/Hero` on the **same** DOM node — **no `pinComposeGhost`**.
- Greeting + chips gated on `contentEntering` after composer settles.

**Enable:** default on (`NEXT_PUBLIC_HALO_ASK_SHELL=0` to disable).  
**Lab deploy:** `halo-q1nibuepo-personal-f999.vercel.app` (2026-09-03).  
**Not yet on** early-access production until promote.

**Remaining gaps (if promoting AskShell):**

- Fixed positioning vs hero grid — may need anchor measurement for pixel-perfect parity with pre-shell.
- Play-lesson mode (composer grows for round) — shell has hooks but needs full QA.
- `/preview` and `/demo` still use old two-page morph inside one URL (query-param view) — shell not wired there yet.
- Chip fade still depends on pack layout completing after composer lands — tune `HomeBubbles` `arrived` timer vs `contentEntering` signal.

---

## Recommended solution (senior engineer take)

### Phase A — Ship AskShell on `/ask` (highest ROI)

**Goal:** Production early access matches the localhost loop Camron approved.

1. Promote lab AskShell build to `halo-gules-three.vercel.app` after Safari iPhone + Chrome smoke.
2. Delete or gate old ghost path when `shell.active` (already mostly done).
3. Tie `is-entering` / chip fade to **composer settled** event, not mount-time `setTimeout(1080)`.

**Effort:** Small–medium (mostly QA + chip timing).  
**Risk:** Low if frozen `--travel` unchanged.

### Phase B — Public demo parity (`/demo`)

**Goal:** Recruiters / meetups see the same morph without API or mixer.

1. Real `/demo` page (not redirect) + `AskShell` on demo layout.
2. `demo` mode: canned replies only, `startKeepCloudSync({ skip: true })` (already on preview).
3. Never show mixer on `/demo`.

**Effort:** Small.  
**Risk:** None to signed-in users.

### Phase C — Optional polish (only if A still feels short)

| Tweak | Benefit |
| --- | --- |
| Cross-fade placeholder text (`What’s on your mind?` → `Follow up…`) | Only visible text change during morph |
| `content-visibility` / skeleton for chat thread | Perceived speed; composer unchanged |
| View Transitions API behind flag | Free cross-fade of background; composer still needs shell |
| Single URL `/ask?view=chat&id=…` | Eliminates RSC route swap entirely; bigger routing change |

**Do not pursue:** Rich DOM clone ghost (tried — double-print/blink), navigating mid-travel without shell, or retuning 1080ms travel without Camron Replay.

---

## Architecture diagram (target state)

```
┌─────────────────────────────────────────────────────────┐
│  ask/layout.tsx  (AskShellProvider — NEVER unmounts)     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Persistent ComposeStadium (one ref, one DOM node) │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  {children} — swaps per route                       │  │
│  │    /ask        → AskLanding (greeting, chips)     │  │
│  │    /ask/[id]   → ChatThread (messages, harvest)   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

Background content fades like chips. Composer only changes:

- `transform` (FLIP travel center ↔ dock)
- `placeholder` + `value` (ask text → empty → follow-up)
- Optional: `Ask` button label → `Send`

---

## What “done” looks like (acceptance)

- [ ] Composer visible **every frame** of Home → Chat → Home screen recording (60fps eyeball, no blank stadium).
- [ ] Ask text visible through travel; clears when chat thread is visible; follow-up placeholder shows.
- [ ] Greeting + chips fade in **together** after composer reaches hero center on return.
- [ ] No regression: harvest z-index 120, `--travel` 1080ms, play sheet width, Keep cap 30.
- [ ] `/demo` matches `/ask` morph; zero API calls; no mixer.

---

## Files to touch (when work resumes)

| File | Role |
| --- | --- |
| `AskShell.tsx` | Persistent composer, travel orchestration, content enter/leave |
| `AskLanding.tsx` | Shell mode: phantom stack, register home UI + submit |
| `ChatThread.tsx` | Shell mode: hide dock, register submit, `leaveToHome` |
| `HomeBubbles.tsx` | Pack + `arrived` timing vs shell settle |
| `home.css` / `ask-shell.css` | Enter animations, fixed compose position |
| `SpringStage.tsx` | Legacy ghost path — keep for non-shell / soft motion only |
| `preview/layout.tsx` | **Lab proof (2026-09-03):** AskShell lives here only. Family `/ask` layout is a passthrough. |

---

## Lab proof (2026-09-03)

**Status: PARKED — did not work for Camron (2026-09-03).** Come back to this later. Do not promote. Do not wire to family `/ask` until a fresh pass passes screen-record QA.

**URL tried:** `http://localhost:3000/preview` (mixer on in dev; ignore the rail)

**Intent:** One `ComposeStadium` in `preview/layout` never unmounts. Home ↔ Chat is a search-param swap (`?view=chat`). Ask text rides down with the field. When the composer lands, outgoing copy uses `halo-greeting-out` and incoming “Follow up…” uses `halo-greeting-in` — same keyframes as chips. No `pinComposeGhost`. Family `/ask` layout is a passthrough (frozen).

**What Camron saw:** Proof did **not** behave as intended (details not captured — re-test with screen record on resume).

**Code left in tree (lab only):**
- `web/src/app/preview/layout.tsx` — `AskShellProvider lab`
- `web/src/components/AskShell.tsx`
- `web/src/app/styles/ask-shell.css`
- `web/src/app/ask/layout.tsx` — passthrough (family frozen)

**When resuming:**
1. Hard refresh `/preview`, confirm `data-halo-ask-shell="1"` on `<html>` and single `#ask-shell-field` (no duplicate `#mind`).
2. Screen-record Home → Ask → Home; note ghost, double composer, or copy fade failures.
3. Fix before any promote. AskShell approach in Phase A of this doc still stands; implementation needs debug.

---

## Parked (2026-09-03)

Camron: “leave a note, we will come back for it later — it did not work.” No further morph work until explicitly reopened.

---

## References (concepts, not dependencies)

- **FLIP:** First, Last, Invert, Play — Paul Lewis / Google (2016). Halo uses this in `flipCompose`.
- **Next.js layouts:** [Layouts preserve state](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#layouts) — official path for persistent UI.
- **View Transitions API:** [MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) — background only until Safari is solid.
- **Framer Motion `layoutId`:** Shared element across conditional renders — same idea as AskShell, library handles FLIP.

---

## Log

| Date | Note |
| --- | --- |
| 2026-09-03 | Initial plan. 1.1.2 live on early access. AskShell lab built, not promoted. User asked for deep analysis + simple answer; no code tonight. |
| 2026-09-03 | Lab proof on `/preview` only: persistent composer + chip-style copy fade. Family `/ask` layout restored (frozen). |
| 2026-09-03 | **PARKED.** Camron tested localhost `/preview` — did not work. Note left in KEPT-BOARD + § Parked above. Resume later. |
