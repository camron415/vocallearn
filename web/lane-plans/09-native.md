# Lane 9 — Native VocalLearn / voice / future iOS

Plan only. 2026-09-06. No `web/src` Halo edits, no `app/` restyle, no TestFlight, no deploy, no promote, no `web/KEPT-BOARD.md`.

**Verdict: freeze native as a lab this month.** Do not port SM-2, teaching plans, the session tutor, `proposed_facts`, Ara TTS, or Expo push into Halo. Do not wrap iOS. The thing native proved that Halo still needs is **same-session retrieval** — and that is already a web idea (`HarvestLock`), not an iPhone wrapper.

---

## Live vs lab assumed

| Surface | What it is | Who uses it |
| --- | --- | --- |
| **Early access Halo** | `halo-web@1.1.2` `136d15f` at `/ask` | Wife/parents: type Ask (Web Speech mic on desktop Chrome; **Safari iPhone often cannot**). Play SAY is **type-only**. No Teach-me. No push. Keep JSON, not native facts. |
| **Working-tree Halo** | HarvestLock, `open-score`, DictateButton copy for Safari | Lab. HarvestLock **not promoted**. |
| **VocalLearn `app/`** | Expo RN voice tutor: STT (`expo-speech-recognition`), TTS (Ara → `expo-speech`), SM-2, hint ladder, teaching frames, in-session spoken recall | **Camron’s phone only.** Shares Supabase `ask_conversations` with Halo. Writes `proposed_facts`. Does **not** read or write `halo_keep_state`. `src/lib/notifications.ts` is a stub. |
| **Roadmap 1.4 “iOS TestFlight”** | Capacitor/WebView **around production web**, gated on Safari QA | **Not built.** Not the Expo VocalLearn app. |

Family never opens VocalLearn. Scoring native as if it were the family product inflates Voice / Teach-me / Encoding.

---

## Decision: port vs freeze

| Native piece | Halo this month | Why |
| --- | --- | --- |
| In-session spoken recall (`useSession` + `scoreResponse`) | **Idea only → Lane 4 HarvestLock / try-it-now** | Science: retrieve **now**, space **later**. Native `createDefaultProgress()` is due immediately. Halo stamps `dueAt` next calendar day. Wrapping iOS does not encode the fact; typing SAY today does. |
| Hint 1 → hint 2 → reveal → repeat (repeat still fails) | **Do not port the tutor ladder** | Halo play already: miss shows the harvested sentence, retry same beat, **one miss fails the round**. Same grading honesty, family-scale. Native ladder is Teach-me. |
| `scoring.ts` Grok 0–5 + `tryFastScoreResponse` | **Do not replace Halo grading** | Halo closed SAY is local (`HomeBubbles` `gradeAgainst` / `closedHit`; HarvestLock `gradeLocally`). Open gists are not Home-due. `open-score.ts` already does local → optional cheap Grok JSON `{"ok"}`. Native 0–5 would fight Keep `finishRound` binary + gold math (Lane 3/4). |
| Number-word / article-strip helpers | **Thin port only if chief + Lane 4 ask** | Native `numberVariants` helps *spoken* “two” vs “2”. Halo `when` chips already compare digits. Low value until SAY is actually spoken. |
| `teaching-plan.ts` frames (pipeline / contrast / analogy) | **Freeze** | Lesson-tutor machinery for CS-ish facts. Halo is JIT chips from household questions. Teach-me is a 2 until harvest + encoding are trusted. |
| SM-2 (`spaced-repetition.ts`: ease, delay penalty, 1/2/3/7 growth) | **Freeze** | Halo `PASS_GAP_DAYS` 1/3/7 + day cap 3 is the family product. Importing ease-factor would retune Keep, which this lane does not own. |
| `fact-miner.ts` + `proposed_facts` approval queue | **Freeze. Do not wire into Keep** | Native Ask: “Facts go to Practice after you approve.” Halo auto-harvests to Keep. Dual decks already exist (`halo_learn_cards` vs Keep JSON). A third (`proposed_facts`) is worse. Native miner is unused by Keep (confirmed). |
| `src/lib/voice.ts` Ara TTS + Expo STT | **Freeze** | Cannot run in Safari. Capacitor would still be a **new** plugin job, not a copy-paste of this file. |
| `notifications.ts` stub | **Freeze. Wrong stack for Halo** | Expo push would ping VocalLearn, not family `/ask`. Halo habit (Lane 10) if any is due chips + later web/shell push — not this stub. |
| Native Ask tab sharing `ask_conversations` | **Leave as-is; do not productize** | Same chat rows can appear in Expo Ask without Keep beads. Fine for Camron. Dangerous if family were given the IPA. |
| Capacitor / TestFlight (roadmap 1.4) | **Do not start** | Shell wraps Safari; it does not fix Safari. Lane 6 owns the gate. Head planner: no iOS until **three family members** finish a round uncoached. |

**Port this month: nothing, unless chief explicitly approves a thin helper into `web/src/lib/open-score.ts`.** Native stays a lab. Halo gets more educational on phone by **typed retrieval in the web loop**, not by speaking through a wrapper.

---

## What would make Halo more educational on phone *without* an iOS wrapper

Remembering-by-speaking is native’s bet. Memory science does not require a microphone. It requires **producing the answer** in the same session, then again later.

On iPhone Safari today:

1. **Ask is type-first.** `DictateButton` uses Web Speech. Constructor missing → blocked copy: *“Voice dictation isn’t available in Safari on iPhone. Type instead…”* Play SAY never mounts that button (`HomeBubbles` has no `DictateButton`). So “voice 4” is desktop compose, not phone learning.
2. **Same-session encoding is typed HarvestLock** (lab, not live). Promote or replace that (Lane 4) beats any STT work. Wife/parents can type “Nile” now. They cannot tap a reliable mic.
3. **Honest mic.** Hide or disable dictate when `getRecognitionCtor()` is null (Lane 6). A dead mic teaches “this app is broken,” not “remember this.”
4. **Do not buy Safari STT this month.** Server Whisper / `getUserMedia` is a new cost surface (Lane 1/7), latency on cellular, and permission UX. It is not a native port. Park with roadmap “Realtime voice in web.”
5. **Do not wrap until type-first is obvious.** Capacitor TestFlight would give a home-screen icon and maybe later a native STT plugin. It would not teach the loop, would not harvest better, and would not make Keep inspectable. Wrong month.

If Halo is more educational on phone in September, it will be because harvest chips match the question, the person says/types the fact once today, and Home play works with a keyboard — not because VocalLearn’s session engine moved.

---

## Scores I disagree with

Head: Voice **4**, Teach-me **2**, Encoding **4**, Mobile **6**, Business **2**.

| Category | Head | Mine | Why (code, not vibe) |
| --- | ---: | ---: | --- |
| **23 Voice / dictation** | 4 | **3** for family product | Desktop Chrome dictation is real (`DictateButton` + Web Speech). Safari iPhone is an explicit dead end. Play SAY and HarvestLock SAY are type-only. Native STT/`scoreResponse` never touch Keep. A 4 reads as “voice is a bit weak.” Family-on-iPhone voice is closer to missing. Keep 4 only if the scoreboard means “desktop Ask mic exists.” |
| **21 Teach-me** | 2 | **2** (agree; family **1** if we split lab) | Native `teaching-plan.ts` + session teach phase exist. Family `/ask` has no `[ Teach me this ]`. Intent `teach_light` is harvest/answer shape, not a lesson. Do not raise this by pointing at `app/`. |
| **7 Encoding** | 4 | **4** (agree) | Native in-session spoken recall would score higher **if family used it**. They don’t. Halo production encoding is read + fly + wait until tomorrow. Do not bump encoding on lab code. HarvestLock is the encoding ticket and it is Lane 4. |
| **15 Mobile Safari** | 6 | **6** (Lane 6 owns; I agree) | Native cannot raise this. TestFlight would freeze a 6 into a store icon. |
| **26 Business** | 2 | **2** (agree) | No Stripe in native either. `notifications.ts` stub. TestFlight ≠ a business. |

I am not asking the chief to change Encoding or Teach-me. I **am** asking Voice to be scored as **3 family / 7 native-lab unused**, so nobody “fixes Voice” by wrapping iOS.

---

## Further split (1–10)

| Sub | Score | Notes |
| --- | ---: | --- |
| Ask dictation, desktop Chrome | 6 | Works; compose only, not encoding. |
| Ask dictation, Safari iPhone | 2 | Explicit unsupported path in `DictateButton`. |
| Play / HarvestLock SAY by voice | 1 | No mic on those surfaces. |
| Native STT/TTS lab quality | 7 | Real Expo pipeline; Camron-only; stale-build risk (HANDOFF). |
| Semantic grading (native Grok 0–5) | 7 lab / **0 family** | Unused by Halo Keep. |
| Halo SAY grading (typed, closed) | 7 | Local, kind-aware in `HomeBubbles`; good enough for family chips. |
| SM-2 vs Halo 1/3/7 | Native 8 research / Halo 7 family | Do not swap this month. |
| Teach-me / lesson frames | 8 native lab / **1 family** | |
| Habit / push from native | 1 | Stub. Wrong target app. |
| Shared `ask_conversations` | 6 chats / **1 facts** | Chats sync; `proposed_facts` dead to Keep. |
| iOS shell readiness | 2 | Safari type-first loop not uncoached-proof; ChromeMenu not live; HarvestLock not live. |

---

## What wife/parents actually experience

- iPhone Safari: type the question, read the answer, maybe see chips fly, type the quiz tomorrow. No spoken recall. Mic often absent or a failure toast.
- Desktop: can dictate the **question**, still type the **answer** in play.
- They never see VocalLearn’s pinned card, hint ladder, Ara voice, or Practice approval queue.
- Roadmap “optional voice where cheap” (1.4 Teach-me integrated) is not a current family surface.

---

## Top 5 tickets (later — **not this wave**)

Implementation wave is after chief converges. This lane’s default is **zero tickets**. If the chief still wants named work:

1. **N9-1 Freeze native lab (default).** Files: none required. Optional later: one freeze paragraph in `HANDOFF.md` (not Halo). Success: no TestFlight, no `app/` restyle, no `notifications.ts` implementation, no `proposed_facts` → Keep. Fail: any PR that wraps `/ask` or restyles Expo “to help Halo.”

2. **N9-2 Thin open-score helper (chief + Lane 4 gate only).** Extract `normalizeForMatch` + `numberVariants` from `src/engine/scoring.ts` into `web/src/lib/open-score.ts` (copy, do not import RN into Next). Do **not** port `scoreResponse` / Grok 0–5. Human test: typed HarvestLock still passes “plants use sunlight to make food”; closed “Nile” still fails “Amazon”; “1776” still accepts “1776.” Fail: open gist becomes a word-bag that marks junk correct, or Keep math gains a 0–5 quality field.

3. **N9-3 Encoding contract handoff (no native files).** Write the rule Lane 4 already almost has: retrieve in-session; reveal/miss still fails the grade; spacing starts after that. Native evidence: `getAssessmentSchedulingQuality` returns 0 on reveal-repeat. Success: HarvestLock or try-it-now ships without importing `useSession.ts`.

4. **N9-4 Phone voice honesty (Lane 6 owns UI).** When Web Speech is missing, don’t offer a mic that fails. Success: family iPhone never looks like dictation should work. This lane does not edit `DictateButton`.

5. **N9-5 Parked: spoken SAY after a real STT path.** Only after (a) three uncoached family rounds, (b) harvest precision on production, (c) same-session encoding live, (d) Lane 6 Safari gate green. Then 1.4 shell = **Capacitor around Halo web**, plus a **new** STT plugin — not VocalLearn Expo in a WebView, not Ara TTS in chat. Expo `notifications.ts` is not Halo push. Success test then: one Home SAY answered by voice on a TestFlight build. **Do not start now.**

---

## Handoffs

| To | What |
| --- | --- |
| **Lane 4 Review** | Encoding this month is typed HarvestLock / try-it-now, not native session. Keep “one miss fails” (aligned with native reveal-repeat). Do not import hint-2 tutor copy. Optional N9-2 only if closed/open typed grades feel stingy. |
| **Lane 6 Mobile** | Voice on family iPhone is your copy/gate, not a wrapper. Safari must be type-first obvious before any shell. Dictation honest. We will not start Capacitor. |
| **Lane 3 Keep** | Do not import SM-2 ease. Do not due-immediately on harvest without Lane 4 encoding (native’s immediate due assumes in-session quiz). Do not ingest `proposed_facts`. |
| **Lane 7 Backend** | `proposed_facts` unused by Keep — leave dead; do not migrate into `halo_keep_state`. Shared `ask_conversations` is enough. Native Grok scoring keys stay in Expo env, not Halo route. |
| **Lane 10 Product** | Defend parking Teach-me and iOS. Habit is not Expo push. “Remember by speaking” on iPhone this month = type the fact out loud at the table if they want; the app grades typing. |
| **Lane 1 Ask** | Do not add server STT this month. DictateButton stays Web Speech. |
| **Lane 11 Ops** | Native is out of `test:harvest` / promote. Do not add Expo CI to the Halo promote checklist. |

---

## Do not do

- Restyle VocalLearn / Paper-ize `app/`.
- Start TestFlight, Capacitor, or any iOS wrapper.
- Promote Halo. Touch family `/ask`.
- Edit Halo harvest / Keep / play chrome (`learn-mine`, `keep-memory`, `HomeBubbles` seating, HarvestFlights z-index 120, morph 1080ms).
- Fill in `src/lib/notifications.ts` as if it were Halo reminders.
- Wire `proposed_facts` or native `facts` into Keep.
- Replace Halo 1/3/7 with SM-2.
- Port `useSession.ts`, teaching frames, or Ara TTS into web.
- Socratic intercept / Teach-me button as a native dump into chat.
- Server Whisper to “fix Safari.”
- Dual-productize native Ask for family (approval queue vs auto Keep).

---

## Files this lane would touch later (if chief says go)

Allowed: `app/`, `src/engine/*`, or thin copy into `web/src/lib/open-score.ts`.

Default later: **no files.** N9-2 only: `src/engine/scoring.ts` (read) → `web/src/lib/open-score.ts` (small helpers + fixtures). Freeze note: `HANDOFF.md` only if Camron wants the next native chat to see it.

Do not own: `DictateButton.tsx`, `HomeBubbles.tsx`, `HarvestLock.tsx`, `keep-memory.ts`, `learn-mine.ts`.

---

## Blocked on

- Lane 4: same-session encoding decision (promote HarvestLock vs redesign).
- Lane 2: harvest precision on production (speaking junk louder is worse).
- Lane 6: Safari type-first QA before any shell conversation.
- Chief: three uncoached family rounds before Teach-me / iOS / Stripe (head off-script — **defend**).
- Atlas was down at plan time; this file is the checkpoint.

---

## Write-back (for chief)

```text
LANE: 9 Native
SCORES I DISAGREE WITH: Voice 4 → 3 family (Safari SAY/Ask mic dead; native unused). Teach-me 2, Encoding 4, Mobile 6, Business 2 stand.
FURTHER SPLIT: Desktop dictate 6; Safari dictate 2; play SAY voice 1; native STT lab 7 unused; native semantic grade 7/0 family; iOS shell ready 2.
TOP 5 TICKETS: (1) freeze native — no TestFlight/restyle; (2) thin number/normalize helpers into open-score only if chief+L4; (3) encoding rule → Lane 4 HarvestLock, not useSession; (4) honest iPhone mic → Lane 6; (5) spoken SAY parked until Safari+encoding+uncoached rounds, then Capacitor around Halo web not Expo.
HANDOFFS: L4 encoding; L6 Safari/mic/shell gate; L3 no SM-2; L7 proposed_facts stay dead; L10 park Teach-me/iOS; L1 no Whisper.
DO NOT DO: restyle app/; TestFlight; Halo src; notifications stub; proposed_facts→Keep; SM-2 swap; Teach-me dump; promote.
```
