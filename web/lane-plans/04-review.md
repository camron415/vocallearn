# Lane 4 — Review / play (plan only)

**Date:** 2026-09-06  
**Role:** Halo review / play team lead  
**Mode:** plan. No `web/src` edits. No `web/KEPT-BOARD.md`. No deploy. No promote.  
**Frozen:** harvest z-index 120, morph `--travel` 1080ms, Paper, bead diameter, Home seating. Family `/ask` frozen.

**Live vs lab assumed**

| Surface | Play the family actually gets |
| --- | --- |
| Early access `136d15f` `/ask` | Home due chips → V2 SEE/SAY sheet. **No HarvestLock.** Open chips never due. One miss fails the fact. Day cap **3** (code). |
| Working tree | Same sheet **plus** in-chat `HarvestLock` before harvest fly. Not promoted. |
| `LearnReview` / `KeepAlbum` / `/api/learn` | Zombie. Header still mounts `LearnReview` on `halo-learn-open`; nothing in the live Home loop dispatches that event. Streaks still live on that API. |

**Later implement (not now) in:** `HomeBubbles.tsx` play/end-card (not seating pack), `HarvestLock.tsx`, `open-score.ts`, `learn.ts`, delete or flag `LearnReview.tsx` / `KeepAlbum.tsx`.  
**Do not own:** `keep-memory.ts` math, harvest miner, morph, Home seating algorithm.

---

## Recommendation (the ask)

**Redesign HarvestLock. Do not promote as-is. Do not put a same-day chip on Home.**

Fallback if Camron rejects the in-chat interrupt (AskShell precedent): an in-chat **“Say these back”** pill that opens the thin lock-in, still not a Home seat.

### Why not promote as-is

Evidence from `HarvestLock.tsx` + `ChatThread.beginHarvest` / `releaseLock`:

1. **Skip ≡ Done.** `onDone` and `onSkip` both call `releaseLock` → chips fly. Encoding is optional and the skip control is a peer of “Say them back.”
2. **SEE leaks the answers.** The glance list prints `token` next to `prompt` for every chip, then asks those same prompts. That is restudy, not retrieval.
3. **Wrong grammar vs tomorrow’s round.** Lock-in is stone buttons, “1 of N · gist/closed,” a Check button, and “Not quite — try another way.” Home play is kind band, dots, quote-block miss, Enter-only SAY, no score copy. Family would learn two quizzes.
4. **Closed lock-in is recognition only** (4 picks). The encoding engine of the product is SAY. Picks while the chat bubble is still on screen is copy-from-above.
5. **Closed grading is `gradeLocally`**, not `closedHit`. Fine for button labels today; fatal if lock-in ever types. `gradeLocally` is substring + 0.6 overlap.
6. **Open gist uses `scoreLockIn` 40% word overlap** (or 3 hits). Cheap and right for lock-in (no extra Grok call). Too sloppy to ever drive Home.
7. **Lab copy** (“Lock these in”, “Open gist first if there is one — your words, not a quiz token”) is mixer language. Identity leak next to Paper Ask.
8. **No encoding signal.** Completing lock-in does not stamp Keep. That is OK (due stays tomorrow) — but then skip-equals-fly means we paid a UI interrupt for nothing.

As-is HarvestLock would score **encoding ~5 in lab, still ~3 for family** because they will hit Skip.

### Why not a Home “try it now” chip

Home **is** due. Sunday spec and the live loop both teach: harvest lands in Keep; chips appear tomorrow. A same-day Home seat is a due-identity leak (wife already flagged the wait). It also collides with seating (Lane 5/3, frozen) and with day-cap (a lock-in round would consume a scarce round or need a special case in `keep-memory`, which we do not own).

A chip that sits on Home today, then vanishes into Keep, trains the wrong object.

### What to ship instead (thin lock-in)

One retrieval **before fly**, in chat, ~15–40s, then the existing harvest flight (z-index 120 untouched).

| Beat | Rule |
| --- | --- |
| Timing | After the answer is on screen, before fly. Same place as today’s `HarvestLock`. |
| Beats | **One per chip, not SEE+SAY.** Closed = 4-pick (no token list first). Open gist first, textarea, `scoreLockIn` only (no `scoreOpenFact` / Grok). |
| Miss | Play grammar: `Not quite —` + harvested sentence, retry same chip. Do **not** apply one-miss=fail here. Lock-in is encoding, not a round grade. Retry-correct still flies. |
| Skip | Still saves and still flies (never hostage). Demote to a text control after the primary. Label: `Save without saying`. |
| Done | Fly. Due stays **next local calendar day** (Lane 3). Do not write `finishRound`. Optional later: `encodedAt` stamp if Lane 3 wants it — not required for v1. |
| Chrome | Paper card, kind labels, no “gist/closed” kicker, no Check button on closed (tap pick). Match play miss copy; do not import the 832px play sheet into chat. |
| Copy-from-chat | Handoff: while SAY/picks are up, dim harvest highlights in the origin bubble (`data-harvest-lock` on the assistant wrap). Without that, lock-in is still restudy. Lane 4 does not own `ChatThread` highlights. |
| Cap | Max 3 chips already. If 0 closed and 1 open, still lock the gist — that is the only encoding open facts get this month. |

**Do not** open the Home play sheet in chat. 90–150s after a Grok answer is how you train Skip.

---

## One miss = fail — defend, with one soften

**Defend for Home SAY. Soften for Home SEE. Never use it on HarvestLock.**

Code today (`answerChoice` / `answerTyped`): the first wrong pick or wrong type pushes `chipId` into `play.missed` **before** the retry. Retry-correct still advances the dot; `finishRound([{id, passed:false}])` still keeps the fact due today and does not bump `roundIndex`. End card: always `You did good.`; mixed packs get `Banked` / `Still working` (failed rows 55% opacity, no bank flight).

**Why keep it on SAY**

- SAY is the retrieval test. The quote + retry is reteach, not a first-recall. Spacing that treats reteach as a win inflates r1→r2 (especially with the r1 first-letter cue).
- SEE is 4-option. A lucky miss-then-hit on SAY should not graduate a fact that was not recalled.
- The sheet already avoids humiliation: no red, no miss count, no percent, headline never changes. The honesty is in the recap row and the missing bank flight.

**What is too harsh**

- A SEE miss fails the **whole fact**, including a later clean SAY. Recognition ≠ recall. Distractors are a miner problem (Lane 2, same-shape bug still in the Sunday spec). Punishing a bad pick when they can type the token is the feeling people will call “unfair,” and it is the one place I would change the rule.

**Lock for implement wave**

- **SAY (or r3 SAY-b) first miss → fail the fact for the round**, even if retry is correct.
- **SEE first miss → reteach + retry; do not add to `missed[]` unless they miss the retry as well** (two SEE misses = they did not know it).
- HarvestLock: retry until pass or skip; never call `finishRound`.
- Do not reveal a labeled answer. Do not add “you still missed.” The recap row is the tell.

Human test: Nile SEE wrong then SAY `Nile` clean → Banked, bead ranks, due moves. Nile SAY wrong then retry correct → Still working, stays Home.

---

## Open gist never plays on Home — defend

`keep-memory.isPlayableClosed` already withholds `dueAt` / Home seats from open recall. `HomeBubbles` grades with `closedHit` only. `scoreOpenFact` (async Grok, no search) is **unwired to any GUI**. `scoreLockIn` is the lock-in path.

Keep that split this month:

- Open may **exist** in Keep (jewelry + future bead inspect) and may **lock-in** in chat.
- Open must **not** take a Home seat, must **not** enter `beatsFor`, must **not** call `scoreOpenFact` on the play sheet (cost + paraphrase UX + “why was that wrong?”).

`scoreOpenFact` stays parked for a later open-play experiment. Do not delete the fixtures.

---

## Scores I disagree with

Head scores: Play **8**, Gamification **6**, Encoding **4**, First-session **4**. Grading rule is **what family actually gets**.

| Category | Head | Mine | Why (code) |
| --- | ---: | ---: | --- |
| **14 Play round** | 8 | **7 live / 8 sheet** | The sheet in `HomeBubbles` is the best interaction in the app (cue ladder, miss quote, dots, end card, no red). Family on `136d15f` only meets it **tomorrow**, SAY is type-only, **zero play unit tests**, Escape mid-round abandons with no grade. Distinctive craft is 8; consumer product is 7 until lock-in exists. I would not score 9 until Mix proof is in CI and SEE-miss is softened. |
| **6 Gamification** | 6 | **6** (target 5–7) | Agree. Beads + clear-the-day + gold ◎ is the right altitude. 6 not 7 because day 1 never plays, Keep beads are not the round, and `LearnReview` still contains a streak landmine. Do **not** chase 8. |
| **7 Encoding** | 4 | **3 live / 4 blended** | Live encoding is read + watch fly. Retrieval starts next calendar day. Working-tree HarvestLock is the right *slot* and the wrong *exercise* (answer list, skip=fly). Head 4 is fair as a blend; I would mark **live-only 3**. After thin lock-in, this lane’s share can hit **6–7** without Teach-me. |
| **3 First-session** | 4 | **4** (play’s slice **3**) | Empty Home + unexplained harvest is mostly Lane 10/5. Play’s hole is: **the fun object does not exist on day 1.** Lock-in is the only first-session move this lane owns. Tour copy is not ours. |

I am **not** challenging Home due field 8 or SRS 7 — those are Lane 3/5. Day cap 3 vs spec 2 is a doc bug; the line in `HomeBubbles` is correct.

---

## Further split (play / encoding)

| Sub | Score | Notes |
| --- | ---: | --- |
| SEE quality | 7 | 4-option, shuffle, kind pills, hold 500/700. Weak when `<3` distractors or wrong shape (miner). SEE-miss currently poisons SAY. |
| SAY grading | 8 | `closedHit` is the real closed normalizer (case, commas, units, the, who last-name, where strip, when digits, meaning 1-edit if long). **Not used by HarvestLock.** No tests because it lives inside the component. |
| Miss reteach | 8 | Quote from `span`/`answer`, 1600ms hold, same beat, no red, retry-correct 700ms. Best part of the sheet. |
| r3 ladder | 6 | Two SAY beats, shuffle vs SEE order, `promptB` with kind fallback. Fallback **embeds `span`/`token`** (`Which place is “Nile”?`) — leaks the answer when miner omits `promptB`. Lab packs have `promptB`; live miner may not. |
| End card / want-one-more | 7 | `You did good.` + recap + Done + bank/gold flights. Mixed labels only when mixed. After Done, remaining due chips are still on the field (the “one more cluster” hook). No “next in 3 days.” Good. |
| Day cap UX | 7 | Line on extra tap, 3s / any tap, chips look tappable. Cap is 3 in code. Copy is Sunday-correct. Invisible until they over-tap — fine. |
| HarvestLock / same-session | 3 | Right slot, wrong exercise, skip=fly, not on live. This is the month’s encoding ticket. |
| A11y / voice | 5 | Dots `aria-label`, choices group, SAY `aria-label`, miss `role=status`. HarvestLock unlabeled. Play SAY type-only; phone autofocus skipped (`max-width: 720px`). Native STT is a different app. |
| Zombie LearnReview | 2 | Streaks, hints, WaterPane, `/api/learn` + `halo_learn_cards`, `gradeChips` side effects if the event ever fires. Identity leak. |

---

## What wife/parents actually experience

**Day 1 (live):** Ask → maybe highlights + fly to Keep → Home still empty. No round. No explanation that tomorrow is the quiz. Harvest can look like a bug.

**Day 2 (live, if they return):** Up to 16 outlined chips. Tap one → cluster gather → SEE all → SAY all (r1 cue `N—— —— ——`) → miss quote → end `You did good.` → Done → beads rank or gold ◎. Third extra tap: `That's enough for today. These are waiting for tomorrow.` One miss on a fact, even recovered, stays on Home.

**They never get (live):** HarvestLock, Teach-me, open gist on Home, streaks on the V2 sheet, a way to tap a Keep bead into the round, play-round tests.

**Working tree extra:** After a harvested answer, a Paper-ish card asks them to lock in. They can skip and the orbs still fly. Completing it does not change tomorrow.

---

## How the round gets more addictive **without** streaks / leagues / XP / hearts

Stay inside gamification **5–7**. The round is the product. Do not add a number that follows them home.

**Hooks that already exist (keep):**

- Short cluster (2–4 facts, ~90–150s). Day cap 3 = appetite, not a streak.
- After Done, other due chips are still sitting there. That **is** “one more.” Do not auto-open the next cluster.
- Bank flight + metal rim + gold ◎ pulse. Collection, not points.
- `You're clear` empty Home after the day is done (Lane 5 copy owns the feeling; the field already empties).

**Hooks this lane should add (no theater):**

1. **Day-1 retrieval** (thin lock-in) so the fun object exists before they leave. The fly after saying-it-back is the slot machine; skip must not be the default.
2. **Honest recap, not a score.** Soften SEE-miss so Banked happens when they actually recalled. Unfair fail kills “one more.”
3. **Do not preview tomorrow’s interval** on the end card (already forbidden). Delayed gold (clean ×3) is the long loop. Resist “next review in 3 days.”
4. **Kill the streak landmine** so nobody “improves” gamification by wiring `halo_learn_streak` to the header.

**Do not add:** daily streak, freeze-streak, hearts, XP, leagues, percent, combo, countdown, “continue anyway,” sound, confetti, Teach-me climb.

Habit pings are Lane 10. Beads becoming inspectable is Lane 5. This lane’s addiction job is: **a round they want to finish, then another cluster if seats remain.**

---

## Improvements vs related 1–10

| Score | Now | Later | Never (this lane) |
| --- | --- | --- | --- |
| Play 7→8 | SEE-miss soften + extract `closedHit` + fixtures. | Phone SAY polish with Lane 6. Mix proof in CI (Lane 11). | Voice SAY, extra exercise types, open on Home, percent. |
| Gamification 6 | Lock-in so day 1 plays; delete streak UI. | Bead inspect (Lane 5) makes collection a tool. | Streaks, hearts, XP, leagues. |
| Encoding 3→6 | Thin HarvestLock; dim chat highlights (handoff). | Optional `encodedAt` (Lane 3). Open stays lock-in-only. | Teach-me as encoding. Same-day Home due. Grok grade on every lock-in. |
| First-session 4 | Lock-in is the play slice. | One quiet line after fly (Lane 5/10). | Fake Nile on a real account. Tour modal. |

---

## Top 5 implementation tickets

Human success test = something a person can fail in Mix / `/preview` chat. No promote.

### T4.1 — Thin HarvestLock (do not promote today’s card)

**Files:** `HarvestLock.tsx`, harvest-lock CSS in `chat.css`. Not `ChatThread` fly timing. Not z-index 120.  
**Do:** One beat/chip; no token list; closed picks; open gist first via `scoreLockIn`; play-style miss quote; skip demoted and still flies; Paper copy; `onDone` vs `onSkip` may still both fly but skip is no longer a peer CTA.  
**Do not:** Open the 832px play sheet; call `finishRound`; call `scoreOpenFact`; change due.  
**Human can fail:** Harvest Nile in `/preview` chat → card does **not** list Nile/Egypt/4130 as a study sheet → cannot Skip as easily as the primary → miss shows the sentence → complete → orbs fly. Skip still saves. Family `/ask` untouched.

### T4.2 — Extract closed grading + play fixtures

**Files:** new small helper next to `open-score.ts` (e.g. `closed-score.ts`) moved from `HomeBubbles` `closedHit` / `gradeAgainst` / cue prefix; wire Home + future lock-in type-in; add to `v2-lib-check.ts`.  
**Cover:** `4130` = `4,130`; who last name not first; where Mount/Lake; r1 cue prefix; meaning 1-edit; open chips never `ok` through this helper.  
**Human / CI can fail:** `npm run test:harvest` (or lib-check) red if SAY grader regresses. Today **there are no HomeBubbles play tests**.

### T4.3 — Miss rule lock (SAY fail / SEE soften)

**Files:** `HomeBubbles.tsx` `answerChoice` / `answerTyped` / `missed[]` only. Not `keep-memory.finishRound` contract (still `{id, passed}`).  
**Do:** SEE miss reteaches; SAY miss fails the fact; document in a 10-line comment matching Sunday + this plan. End card behavior unchanged.  
**Human can fail:** Mix miss-on-SEE then clean SAY → Banked. Mix miss-on-SAY then retry correct → Still working, chip stays Home. Gold path still requires three **clean** rounds (Lane 3 math).

### T4.4 — Flag or delete LearnReview / KeepAlbum

**Files:** `LearnReview.tsx`, `KeepAlbum.tsx`, `HaloHeader.tsx` listener + mount. `learn.ts` keep `gradeLocally` (open-score needs it) until T4.2 lands; `nextStreak` / `DEMO_CARDS` can die with the UI. **Do not** drop `/api/learn` or `halo_learn_cards` (Lane 7).  
**Do:** Remove `halo-learn-open` path from header so the streak sheet cannot appear. Prefer delete over a lab flag — nothing live dispatches it.  
**Human can fail:** Dispatching `halo-learn-open` from the console does nothing; no WaterPane Learn overlay; Home play still works.

### T4.5 — Lock-in Mix proof (promote gate, not a promote)

**Files:** none new in seating; lab path `/preview` chat Harvest lab + a written checklist in this plan for Lane 11.  
**Gate:** Camron Replay: canned Nile → thin lock-in → miss → pass → fly (z-index 120) → beads in Keep **not** on Home → next calendar day Mix “Due now” still plays the real sheet. Skip path also flies. Reduced-motion: instant land, no broken lock.  
**Human can fail:** If lock-in blocks fly, or skip loses chips, or chips sit on Home today, **do not promote**.

---

## Handoffs

| Lane | Need |
| --- | --- |
| **2 Harvest** | Same-shape distractors (Sunday known bug) — SEE quality. Always emit `promptB` so r3 fallback does not leak the token. Open gist quality for lock-in overlap. Closed-only Home invariant stays. |
| **3 Keep** | **Do not** same-day `dueAt` as an encoding substitute. Optional `encodedAt` later. `finishRound` math stays theirs; we only pass `{id, passed}`. Day cap **3** vs spec 2 — they pick the number; we keep the line. Open never `dueAt`. |
| **5 UI** | Dim harvest highlights while lock-in is up. First-harvest quiet line after fly (“saved — say them tomorrow” or “you just locked these in”). Bead inspect is theirs; do not open LearnReview from a bead. Paper tokens for the redesigned card. |
| **1 Ask / ChatThread** | `beginHarvest` / `releaseLock` stay the slot. Do not fly until lock resolves. Do not retune morph 1080ms. Highlight dim may live here instead of Lane 5. |
| **6 Mobile** | Lock-in + play SAY on iPhone keyboard. Do not start dictate on the play sheet this month. |
| **7 Backend** | `/api/learn` + `halo_learn_streak` / `halo_learn_cards` after we unmount the GUI. Dual deck is theirs. |
| **9 Native** | Freeze. Do not port SM-2 or STT into Halo SAY this month. |
| **10 Product** | Skip vs “Save without saying” copy. Habit without streaks. Tour line after first harvest. Defend no Teach-me until three uncoached rounds. |
| **11 Ops** | Promote **blocked** on HarvestLock until T4.1 + T4.5 pass Camron. Add closed-score fixtures to CI. Do not treat “HarvestLock file exists” as done. |

---

## Do not do

- Promote HarvestLock as-is.
- Same-day Home “try it now” chip / seating of fresh harvests.
- XP, hearts, streaks on the V2 sheet, leagues, percents, “next review in 3 days.”
- Teach-me. Open gist on Home. `scoreOpenFact` Grok on lock-in or play.
- Retune morph 1080ms or harvest z-index 120.
- Touch `keep-memory` scheduler, miner, Home seating pack, AskShell.
- Revive `LearnReview` as the product round.
- Full SEE-then-SAY cluster inside chat (too long → skip).
- Change one-miss=fail on **SAY** to “retry saves.”
- Deploy / `vercel --prod` / family `/ask`.

---

## Files I would touch (later wave)

`web/src/components/HomeBubbles.tsx` (play/end-card only), `web/src/components/HarvestLock.tsx`, `web/src/app/styles/chat.css` (harvest-lock), `web/src/lib/open-score.ts` (leave gist fixtures; do not wire model to Home), new `closed-score` helper + `v2-lib-check.ts`, `web/src/lib/learn.ts` (trim after zombie), `web/src/components/LearnReview.tsx` (delete), `web/src/components/KeepAlbum.tsx` (delete), `web/src/components/HaloHeader.tsx` (unmount listener).

**Blocked on:** Camron go after chief converges; Lane 5/1 highlight-dim for lock-in honesty; Lane 2 distractors/`promptB` for SEE/r3; Lane 11 Mix proof before any promote talk.
