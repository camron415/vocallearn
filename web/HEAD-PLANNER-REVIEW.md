# Halo — head planner review (2026-09-06)

Durable checkpoint. If a chat runs out of context, **this file is the source of truth**, not the transcript.

**Companion scoreboard:** open the Cursor canvas `halo-head-planner-review.canvas.tsx` beside chat.

**How to use**

1. **Spawn chats from [`web/LANE-WAVE.md`](./LANE-WAVE.md)** — paste the full fenced block, not “lane N”.
2. Team leads read **this whole file** first (especially Live vs lab, What the code produces, Scoreboard).
3. Each lane writes only `web/lane-plans/NN-….md` (plan). Chief converges. Then implement.

**Grading rule:** 1 = missing or actively harmful. 5 = usable but not yet a reason to return. 8 = distinctive and reliable. 10 = category-defining. Scores are for **what a family member actually gets**, not for how much code exists. Working-tree lab features are scored separately from early-access production.

**Overall: 6 / 10** as a private family Ask with a real memory loop underneath. **4 / 10** as a learning product someone would open tomorrow without Camron in the room. **8 / 10** as visual/motion craft.

---

## Live vs lab (do not mix these)

| Surface | What it is | What family actually uses |
| --- | --- | --- |
| **Early access production** | `halo-web@1.1.2` commit `136d15f` at https://halo-gules-three.vercel.app `/ask` | Paper Ask, **Grok-only** stream, harvest → Keep → next-calendar-day Home due → SEE/SAY, Save-this-recipe, Keep cloud sync, invite auth. Caps: **4000**-char messages, **$1/wk** + household **$30**. No daily-40, no burst, no Luna, no intent classify, no HarvestLock, no hamburger `ChromeMenu`. |
| **Working tree (this repo, not all promoted)** | Intent classify + miner INTENT, Luna routing, HarvestLock, `ask_hold` reserve, 2000-char / 40-day / burst 8, `ChromeMenu`, AskShell parked | Camron / Lab only until **promote** |
| **Lab `/preview`** | Mixer, dummy Nile, Harvest lab, Paper vs Ours | Not the family product |
| **VocalLearn `app/`** | React Native voice tutor, SM-2, spoken recall | **Separate product.** Shares Supabase `ask_conversations`, **not** Halo Keep chips. Native `proposed_facts` is unused by Keep. |

Do not tell a lane to “ship Teach-me” or “wrap iOS” as if those exist. They do not.

Parked / known holes:

- AskShell persistent composer failed Camron QA on `/preview`. Family `/ask` frozen. See `COMPOSER-MORPH-PLAN.md`.
- HarvestLock (SEE then SAY before fly) is in `ChatThread` in this tree; **not promoted**.
- Luna (`HALO_USE_LUNA` + `OPENAI_API_KEY`) is wired, **not promoted**.
- `LearnReview` + `KeepAlbum` are leftover: header still mounts LearnReview on `halo-learn-open`, but **nothing in the live Home loop dispatches that event** (`KeepAlbum` is unused). Zombie path.
- Sunday spec still says day cap **2**; code is **`DAY_ROUND_CAP = 3`**. First due is **next local calendar day**, not rolling 24h.
- Miner still upserts `halo_learn_cards`; the loop UI reads **Keep JSON** (`halo-keep-v2` + `halo_keep_state`). Two decks.
- Play round: one miss marks the fact **failed for the round even if the retry is correct**.
- Open gist chips get **no `dueAt`** and never sit on Home.

### Evidence addendum (explore passes, 2026-09-06)

Do not treat working-tree `route.ts` / `ask-guard` / AskShell as live.

| Source | Number / fact |
| --- | --- |
| Harvest turns export (50 rows, 2026-09-04) | **15** harvested turns / **28** chips; **23** `policy_skip`; **12** zero-card non-skips. Socks still in that dump (pre-intent). |
| Family canned review | **8/8** with intent + miner (weather/socks skip; capitals + Gettysburg + photosynthesis + cows + Nile OK). |
| Smoke dry | **9/9** gate-only. |
| LIVE Grok output caps | short **500**; medium **1600**; effort none **1100**. History trim: last **24** to model, last **8** full. |
| LIVE attach | 3 × 4MB, lighter validation than lab magic-bytes. |
| Native | `src/lib/notifications.ts` is a stub. No Stripe routes. CI = `test:harvest` only. |

---

## What the code actually produces (consumer product)

Halo is one screen-family: **Home Ask** (`AskLanding`) and **Chat** (`ChatThread`), paper skin, invite-only.

**Day 1 — empty Home.** Greeting by local time (`Good morning` / evening, with a UTC-reject hotfix). Center composer. Type or (desktop) dictate. Send morphs Home → Chat (~1080ms). Grok streams. If the miner thinks the answer is study-worthy, kind-colored spans light up and chips fly to header **Keep** beads (z-index 120). Those beads stay in Keep. Home stays empty of them. If the answer looks like a recipe, a stone **Save this recipe** pill can extract into `halo_recipes` and fly to Library.

**Simple:** You ask a question like ChatGPT. Sometimes colored bits fly into little dots at the top. You cannot review them yet.

**Tomorrow — due drop.** `addKeepChip` stamps `dueAt` with `nextDueAt(0)` = **+1 local calendar day**. Open chips get no due stamp. On that morning, up to **16** closed facts take Home seats (`HOME_SEAT_CAP`). Tap a chip → one **cluster round**: r1/r2 SEE-all then SAY-all; **r3 is two SAY prompts, no SEE**. Miss shows the harvested sentence and retries the same beat; **one miss still fails the fact for the round** even if the retry hits. End card: `You did good.` Day cap **3** rounds. Clean passes schedule 1d / 3d / 7d. Third clean → gold, bead leaves the dock, ◎ count steps up.

**Simple:** The next day, chips appear on the empty page. You tap one, play a short quiz, and the dots get metal rims. If you miss once, that fact does not count as a win that day.

**Limits on live early access (what family hits).** 4000-char messages. Weekly **$1** and household **$30** — not a hard 40/day. Dictation is Web Speech (uneven on Safari). Keep caps at **30** in-progress beads (silent drop when full). Closed-only on Home.

**Limits in this working tree (not promoted).** 2000-char messages, 40/day, 8/min, 1 in-flight, 6 files/day, magic-byte attach, Luna default when flagged.

**What they never get (planned, not built).** Teach-me button. Learn-more chips. Streaks on the V2 sheet. Push notifications. Stripe. Public signup. iOS TestFlight shell. A first-run tour. Tappable Keep beads. Same-day review as a promoted product behavior.

---

## Scoreboard (28 categories)

| # | Category | Score | Team |
| --- | --- | ---: | --- |
| 1 | Product identity | 8 | Product |
| 2 | Simple AI / simple UI | 7 | Ask + UI |
| 3 | First-session ease | 4 | Product + UI |
| 4 | Repeat-use ease | 7 | Ask + UI |
| 5 | Fun / delight | 8 | UI / Motion |
| 6 | Gamification (vs 5/10 target) | 6 | Review + Product |
| 7 | Learning encoding (first lock-in) | 4 | Harvest + Review |
| 8 | Spaced review engine | 7 | Keep + Review |
| 9 | Harvest selection quality | 5 | Harvest |
| 10 | Ask answer quality | 7 | Ask / AI |
| 11 | Chat UX / composer morph | 6 | UI / Motion |
| 12 | Home due field | 8 | Review + UI |
| 13 | Keep collection (beads) | 6 | Keep + UI |
| 14 | Play round (SEE / SAY) | 8 | Review |
| 15 | Mobile Safari | 6 | Mobile |
| 16 | Saves / recipes | 6 | Library |
| 17 | Auth / invites / admin | 7 | Backend |
| 18 | Persistence / Keep sync | 7 | Backend + Keep |
| 19 | Cost / abuse controls | 5 | Backend / Ask |
| 20 | Onboarding / empty Home | 3 | Product |
| 21 | Teach-me / discovery layer | 2 | Product |
| 22 | Habit / notifications | 2 | Product |
| 23 | Voice / dictation | 4 | Mobile + Native |
| 24 | Code health / dual systems | 4 | All / Ops |
| 25 | Visual craft / Paper | 8 | UI |
| 26 | Business / legal / scale | 2 | Product / Ops |
| 27 | Trust / privacy | 7 | Backend |
| 28 | Testing / promote discipline | 7 | Ops / Harvest |

Mean **5.7**. High craft, incomplete loop comprehension, almost no habit or business layer. Cost/abuse is **5 on live** (weekly $ only); lab tree would score higher.

---

## Categories (detailed + simple)

### 1. Product identity — 8

The code still matches the written bet: Ask is the front door; Keep is juice; not an RPG; not a ChatGPT clone. Names are consistent enough (Halo / Cove / Keep / Kept). Family `/ask` is a real invite product, not a demo. The risk is **identity leak**: zombie `LearnReview` streaks, Lab mixer language, and a roadmap that still lists Teach-me / iOS / Stripe on a two-week cadence the solo tree cannot honestly absorb.

*Simple: People can tell this is “family chat that saves facts,” not a game and not generic AI. That idea is clear. The extra leftover screens and a huge roadmap make it slightly fuzzier.*

### 2. Simple AI / simple UI — 7

Production Ask is one composer, streaming markdown, History / Library / Settings as separate header actions on live iPhone (hamburger `ChromeMenu` is **working tree only**). No mode picker, no model picker. Routing is regex + effort, not a user-facing brain. Complexity is hidden in `ask-route` / miner — which is correct. It stops being simple when beads appear with no copy and the morph ghost leaves a blank field.

*Simple: The happy path is type-and-send. The product gets less simple the moment learning starts, because the learning objects are not explained.*

### 3. First-session ease — 4

Empty Home is beautiful and mute. Nothing says “ask something worth remembering” vs “ask the weather.” Harvest can look like a bug (text highlights, orbs fly). Due is tomorrow, so the unique loop is invisible on day one. Wife/parents already flagged the wait. There is no light tour (`1.2` in the roadmap, unbuilt).

*Simple: A new person can chat. They probably will not understand why dots appeared, or that they should come back tomorrow to quiz.*

### 4. Repeat-use ease — 7

Signed-in return: greeting, due chips if any, history resume, Keep sync phone ↔ desktop, Settings usage. Calendar-day due + TZ repair were real 1.1.1 patches. Friction: silent 30-bead cap, day-cap copy that appears only on extra taps, recipe Library as a separate mental model from Keep.

*Simple: Coming back tomorrow works if you already know the ritual. The app does not fight you. It also does not coach you.*

### 5. Fun / delight — 8

Harvest flight, kind colors, metal rims, cluster seating, play holds, gold pulse — this is the part that is actually special. Frozen timings (`1080ms`, z-index 120) show taste, not feature-stuffing. Fun is **spectacle plus a clean round**, not points. It dips when harvest is wrong (socks as a meaning chip) because delight attached to junk feels broken.

*Simple: The animations and the quiz feel considered and pleasant. Wrong harvested facts kill that feeling fast.*

### 6. Gamification (target ~5/10) — 6

V2 correctly refused XP, hearts, leagues, percents. Collection (beads, ranks, ◎) plus clear-the-day is the right altitude. Score 6 not 8 because: (a) collection is mostly non-interactive, (b) leftover streak code in `LearnReview` / `/api/learn` is a landmine, (c) there is almost no “I want to open this tomorrow” hook besides due chips.

*Simple: It is not a video game, on purpose. The beads and gold count are the game. They are pretty, but they do not pull you back as hard as Duolingo’s ugly streak does.*

### 7. Learning encoding (first lock-in) — 4

Memory science in `INTENT-HARVEST-RESEARCH.md` is sound (retrieval, small chunks, spacing). Production encoding is **read the answer + maybe watch it fly**. Retrieval starts **next calendar day**. HarvestLock (in-chat SEE/SAY before fly) is the right product move and is sitting unpromoted. Open how/why gists are not playable on Home. Reading ≠ remembering, which the trajectory doc already admits.

*Simple: You see the fact today and are tested tomorrow. That is weaker than “say it once now, then again later.” The “say it now” piece exists in lab and is not live.*

### 8. Spaced review engine — 7

`keep-memory.ts` is a real loop: seats, clusters, `PASS_GAP_DAYS` 1/3/7, `roundIndex` from clears not lateness, partial credit `finishRound([{id, passed}])`, remainder-free re-tap, gold off dock, Home 16. Cue ladder r1–r3 is implemented in `HomeBubbles`. Not Anki-grade (no ease factor, no fuzz, no load). Day-cap 3 vs spec 2 is a doc bug, not a user bug.

*Simple: The quiz schedule is real and thoughtful. Three good days and the fact graduates. It is not a research SRS. It is enough for a family app if harvest and first encoding are good.*

### 9. Harvest selection quality — 5

Policy skips weather/news/sports well (dry smoke 9/9). Capital fallback exists because the miner used to miss Augusta. Family canned review (2026-09-06) **8/8** with Grok miner. Live export (50 rows, 2026-09-04) still shows **socks material harvested** and other practical/event turns. Intent classify is in the tree to stop that; not on early access. Max 3 cards, closed-only play. This category is the product’s **load-bearing risk**.

*Simple: Sometimes it saves the exact fact you asked. Sometimes it saves trivia or shopping. Family will trust the dots only if they almost always match the question.*

### 10. Ask answer quality — 7

Streaming Grok 4.3, live feeds for weather/markets, search on depth/lookup, file vision, 60s route, work-trace. **Live is Grok-only.** Luna is cheaper default for shallow chat **when promoted**. Output caps on live Grok: short 500 / medium 1600. Quality is “good family Grok,” not a tutor. No eval harness for answer truth.

*Simple: Answers are useful for a household. They are not a teacher. The cheap model path is not on the family site yet.*

### 11. Chat UX / composer morph — 6

History, follow-ups, attach, copy, thinking trace, resume, `prepareOnly` to start the model during travel — serious chat engineering. Morph is structurally a **page swap** (`/ask` vs `/ask/[id]`), so a blank ghost remains. AskShell (one composer in layout) was the right fix and failed QA. Do not treat morph polish as the learning-product bottleneck.

*Simple: Chat works. The animation from Home to Chat is fancy and still a little broken. Fix it later unless Camron calls it a ship-blocker.*

### 12. Home due field — 8

Seating algorithm, phone walls so chips don’t sit under the composer, kind outlines vs filled Keep beads, cluster clump, 16-cap, day-cap line. This is the daily “tidy” surface and it looks like a product. Empty Home vs cleared Home (`You're clear`) is implemented.

*Simple: When something is due, the page fills with colored chips you can tap. That part is strong.*

### 13. Keep collection (beads) — 6

Header beads, silver→bronze→new, 3px inset metal, cap 30, gold off dock onto ◎ panel (static rows). Missing: tap a bead to read the fact (parked in `LIBRARY-BACKLOG.md`). Overflow is silent. Users cannot inspect, edit, or delete from the dock. Collection without inspection is jewelry.

*Simple: The dots look like a collection. You cannot really use them as a collection yet.*

### 14. Play round (SEE / SAY) — 8

Sunday spec is largely in `HomeBubbles`: r1/r2 SEE-all then SAY-all; r3 two SAY prompts and **no SEE**; miss quote; dots with SEE|SAY gap; closed normalizer; end card; no red; no auto-dismiss. **One miss fails the fact for the round even if the retry is correct.** Best learning interaction in the web app. Weakness: SAY is type-only; open facts never due; no “why this is due” copy.

*Simple: The quiz itself is calm, short, and well designed. Missing once still counts as a miss for that day’s grade.*

### 15. Mobile Safari — 6

Multiple QA passes on live (keyboard inset, wrap, recipes scroll, harvest fly vs reduced-motion, 1.1.2-mobile header). **Hamburger `ChromeMenu` is not on early access** — live still shows Library/History/Settings as separate actions, so beads compete for width. Dictation is Web Speech; Safari iPhone is uneven / often unusable. Morph/ghost worse on phone. iOS shell in 1.4 would wrap these problems, not erase them.

*Simple: It works on an iPhone if you type. Voice is shaky. The phone menu that frees Keep space is not live yet. Do not wrap an app until Safari feels obvious.*

### 16. Saves / recipes — 6

`Save this recipe` + `/recipes` Library is shipped (1.1.2). Regex detect, extract, photo, stone flyer. Lists/packing Saves are not. Library is not a facts shelf (correct, to avoid duplicating Keep). Two collect verbs (Keep vs Library) need copy someday.

*Simple: Cooking answers can be saved as recipes. That is handy. It is a side feature, not the learning loop.*

### 17. Auth / invites / admin — 7

Invite tokens, member gate on `/api/chat`, paper login/invite, admin invites + usage in Settings, rings Lab / Early access / Family. Right shape for a household. No self-serve. Ops is Camron.

*Simple: Only invited people get in. That is fine for now. You are the IT department.*

### 18. Persistence / Keep sync — 7

Chats and recipes are real Postgres + RLS. Keep is a **JSON blob** (`halo_keep_state`) with debounce push and last-updated win. Miner still upserts **`halo_learn_cards`** but the loop UI does not play that table — two decks. Weak for concurrent edits or “list all gold facts” queries. Harvest telemetry is for Camron.

*Simple: Chats save in the cloud. The quiz beads mostly sync. There is also an older cards table the Home quiz does not use.*

### 19. Cost / abuse controls — 5

**Live family:** weekly **$1** + household **$30**. No daily-40, no burst, no inflight, compose **4000** chars, lighter file checks. Camron pays Grok. **Working tree** is much tighter (40/day, burst 8, inflight 1, reserve-before-call, 2000 chars, magic bytes, Luna). Pricing memo exists; **no Stripe**. Score is for what family can burn today, not for the unpromoted guard.

*Simple: On the live site, money brakes are weekly, not per-day. A determined user can still spend. Charging users is not built.*

### 20. Onboarding / empty Home — 3

No tour, no sample Ask on a real account (correct: no fake Nile), no “review tomorrow” after first harvest except maybe greeting copy. Empty state is indistinguishable from “is this broken?” First harvest is the onboarding, and it is unexplained.

*Simple: New users are not taught how the product works.*

### 21. Teach-me / discovery layer — 2

`PRODUCT-DISCOVERY.md` is planning. Intent `answerMode: teach_light` exists for harvest/answer shape. There is no `[ Teach me this ]` pill, no climb, no VocalLearn port. Correctly **not** intercepting every send. Incorrect to put this on an October calendar before harvest + encoding are trusted.

*Simple: The “teach me” button is an idea, not a feature.*

### 22. Habit / notifications — 2

Day cap and due chips are the only habit mechanics. No push, no email, no streak on the V2 sheet (frozen on purpose). Without a reminder, calendar due is a hope. Duolingo’s retention is 70% nag + streak anxiety; Halo refused that and did not replace it with anything.

*Simple: Nothing pings you to come back. If you forget, the chips wait quietly and you never see them.*

### 23. Voice / dictation — 4

Web dictate exists; Safari iPhone explicitly cannot. Play SAY is typing. Native VocalLearn has STT/TTS + semantic scoring and **does not drive Halo Keep**. Roadmap iOS 1.4 + Teach-me voice is a second product unless someone ports the engine.

*Simple: You can talk to Ask on a computer. On iPhone Safari you type. The voice tutor app is a different app.*

### 24. Code health / dual systems — 4

Duplicate `* 2.ts` files, parked AskShell, zombie LearnReview, **`halo_learn_cards` vs Keep JSON**, uncommitted lab (intent, Luna, lock-in, hamburger), Sunday vs code day-cap mismatch. Tests around harvest are real. The tree is a weekend-war room.

*Simple: There is leftover stuff, two ways to store facts, and copies of files. That will make future work slower and easier to break.*

### 25. Visual craft / Paper — 8

Paper tokens, play sheet 832/440, kind colors with meaning, dark parity, auth paper, menu grow from composer. Distinctive. Frozen for good reasons. Do not “refresh the brand” as a substitute for loop comprehension.

*Simple: It looks like its own product. Keep it. Do not redesign it for fun.*

### 26. Business / legal / scale — 2

Invite-only family, no Terms/Privacy live, no billing, no domain/brand lock, ~household users. Pricing memo exists. 1.5 “~100 accounts” is fantasy until the loop is understandable. Honest successful-product path: **10 people who return without coaching**, then money.

*Simple: This is not a business yet. That is OK. Do not pretend the November public launch is the current job.*

### 27. Trust / privacy — 7

Invite-only, no ads (explicit), RLS, admin-only harvest logs, family answers not a public social graph. Risk: harvest telemetry stores full Q&A; file uploads to Grok; household spend visibility. Fine for family; needs a privacy page before friends-wave.

*Simple: It is a private household app, not a public network. Say that clearly before inviting non-family.*

### 28. Testing / promote discipline — 7

`test:harvest`, family review pack, rings, KEPT-BOARD, “do not promote unless Camron says.” This is unusually adult for a solo repo. Gaps: no play-round unit tests of `HomeBubbles`, no morph tests, browser QA is Camron. Discipline > coverage.

*Simple: You are careful about what family sees. Keep that. Add tests for the quiz math, not only harvest.*

---

## Honest plan vs the written roadmap

**Roadmap (1.2→1.6)** wants Luna + intent harvest + tour, then streaks/achievements/Teach-me, then iOS/Stripe/notifications, then public-ish, then Android/minigames. Cadence ~2 weeks. That is a **fundraising-shaped calendar**, not a family-shaped one.

**What successful memory products actually did first**

| Product | First job that worked | What they did *not* do first |
| --- | --- | --- |
| Anki | Reliable cards + intervals | Social, streaks, AI |
| Duolingo | Daily 5-minute lesson you understand | Custom user-generated curriculum |
| Quizlet | Make / study a set in 30 seconds | Chat |
| Readwise | Highlight in → review out | A new AI personality |

Halo’s unique bet is **JIT cards from real questions**. That only works if (1) harvest is obviously about *this* question, (2) you retrieve once **now**, (3) you retrieve again **later**, (4) you can see what you own. Items 1–4 are incomplete. Teach-me, iOS chrome, and Stripe do not fix them.

**Off-script sequence (recommended)**

1. **Harvest precision on production** (promote intent classify + skip practical/photo/event; keep capital fallback). Measure with `halo_harvest_turns`, not vibes.
2. **Same-session encoding** — promote or redesign HarvestLock / “try it now.” This is more important than Teach-me.
3. **Bead inspect** — tap Keep bead → prompt/answer/rank. Collection becomes a tool.
4. **One light tour line** after first harvest: facts saved, review tomorrow (or review now if lock-in ships).
5. **Promote Luna** after lab smoke (cost, not a feature).
6. **Kill zombie LearnReview / KeepAlbum** or hide behind a lab flag.
7. **Do not** start Teach-me, streaks, Stripe, or iOS shell until **three family members** complete a round without a stand-over demo.
8. Morph/AskShell only if Camron still hates the ghost after 1–6.

Roadmap 1.3–1.6 should be **re-dated after** that family proof, not used as this month’s task list.

---

## Team-lead briefs (copy-paste)

**Source of truth for new chats:** [`web/LANE-WAVE.md`](./LANE-WAVE.md). Paste the **entire fenced block** for that lane as the first message. Do not type only “lane 3.”

Plan wave: write `web/lane-plans/NN-….md`. No `web/src`. No `web/KEPT-BOARD.md` (eleven parallel edits clobber the board). No promote. Frozen: harvest z-index 120, morph 1080ms, Paper, seating, beads. AskShell parked. Family `/ask` frozen.

The eleven blocks below are **stale shorter drafts**. If they disagree with `LANE-WAVE.md`, **LANE-WAVE wins**.

---

Write-back format (every lane):

```text
LANE:
SCORES I DISAGREE WITH: (category, my score, why — evidence from code)
FURTHER SPLIT: (sub-scores 1–10, max 8 rows)
WHAT THE USER ACTUALLY EXPERIENCES:
TOP 3 IMPROVEMENTS (this month, concrete):
DO NOT DO YET:
FILES I WOULD TOUCH:
BLOCKED ON:
```

---

### Lane 1 — Ask / AI routing

```text
You are team lead for Halo Ask / AI routing. Read web/HEAD-PLANNER-REVIEW.md fully, then web/src/app/api/chat/route.ts, web/src/lib/ask-route.ts, web/src/lib/ask-provider.ts, web/src/lib/ask-intent.ts, web/src/lib/ask-stream.ts, web/src/lib/ask-guard.ts, web/src/lib/limits.ts, web/src/lib/openai.ts, web/src/lib/grok.ts.

Your categories from the head review (challenge with code evidence): Simple AI/UI 7, Ask answer quality 7, Chat UX 6, Cost/abuse **5 live / tighter in lab**, Voice 4.

Think like a consumer: wife/parents on **production `/ask` (commit 136d15f, Grok-only, 4000-char, weekly $1)**. Separately note working-tree Luna, 2000-char, ask-guard. Split further (streaming reliability, routing accuracy, live feeds, attachment quality, failure copy). Do not describe lab caps as live.

Return the write-back format. Honest over roadmap. Do not implement. Do not promote. Family /ask frozen. Luna is lab-wired not promoted.
```

---

### Lane 2 — Harvest / intent / miner

```text
You are team lead for Halo harvest. Read web/HEAD-PLANNER-REVIEW.md, web/INTENT-HARVEST-1.2.md, web/HARVEST-OPS.md, web/src/lib/learn-mine.ts, web/src/lib/harvest-policy.ts, web/src/lib/ask-intent.ts, web/src/lib/harvest.ts, web/reports/harvest-family-review-latest.md, web/reports/harvest-turns-latest.md, web/reports/harvest-smoke-latest.md.

Head scores: Harvest quality 5, Learning encoding 4, Testing/ops 7. The head claim is this is the load-bearing risk. Live dump: 15 harvested / 50 turns, 23 skips, 12 empty non-skips; family canned 8/8. Intent classify is **not** on 136d15f.

Go deeper: skip vs miss vs tangent; closed vs open; capital fallback; socks/practical; live vs canned; classify vs regex; max chips; span matching; telemetry gaps. Propose a 1–10 sub-scorecard (at least: skip precision, primary-fact recall, tangent rate, latency, promote-readiness).

Return the write-back format. Do not retune harvest z-index 120. Do not implement unless this chat is later asked to. Do not promote.
```

---

### Lane 3 — Keep / memory / due / sync

```text
You are team lead for Halo Keep memory. Read web/HEAD-PLANNER-REVIEW.md, web/HALO-V2-SUNDAY.md, web/src/lib/keep-memory.ts, web/src/lib/keep-cloud.ts, web/src/lib/local-day.ts, web/src/app/api/keep/route.ts, docs/COVE_KEEP_VISION.md.

Head scores: Spaced review engine 7, Keep collection 6, Home due field 8, Persistence 7, Habit 2. Note DAY_ROUND_CAP=3 vs spec 2; first due = next local calendar day; KEEP_CAP 30 silent; gold off dock; open chips get **no dueAt**; one miss fails the round even after retry; dual `halo_learn_cards` vs Keep JSON.

Split: scheduler honesty, merge/dedupe, cloud conflict, overflow, gold vault, due-drop UX. What would you change vs “wait until tomorrow” (micro-round vs same-day due vs copy-only)?

Return the write-back format. Do not edit keep-memory unless later asked. Do not promote.
```

---

### Lane 4 — Review loop / play sheet

```text
You are team lead for Halo review play. Read web/HEAD-PLANNER-REVIEW.md, web/HALO-V2-SUNDAY.md, web/src/components/HomeBubbles.tsx (play/SEE/SAY/end card), web/src/components/HarvestLock.tsx, web/src/lib/open-score.ts, web/src/lib/learn.ts, web/src/components/LearnReview.tsx (zombie path).

Head scores: Play round 8, Gamification 6, Learning encoding 4, First-session 4. Dual systems: V2 sheet vs leftover LearnReview vs lab HarvestLock.

Split: SEE quality, SAY grading, miss reteach, r3 prompts, day cap UX, lock-in vs delayed review, accessibility. Would you promote HarvestLock, change it, or encode another way?

Return the write-back format. Do not retune morph 1080ms or harvest z-index. Do not implement. Do not promote.
```

---

### Lane 5 — UI / Paper / motion

```text
You are team lead for Halo UI, Paper, and motion. Read web/HEAD-PLANNER-REVIEW.md, web/HALO-V2-SUNDAY.md, web/COMPOSER-MORPH-PLAN.md, web/src/components/AskLanding.tsx, web/src/components/ChatThread.tsx, web/src/components/HaloHeader.tsx, web/src/components/KeepPocket.tsx, web/src/components/GoldKeptBadge.tsx, web/src/components/HarvestFlights.tsx, web/src/components/LoopFlights.tsx, web/src/components/AskShell.tsx (parked).

Head scores: Visual craft 8, Fun 8, Simple UI 7, Chat morph 6, Keep collection 6, Onboarding 3, Code health 4.

Split: Paper consistency, harvest fly, Home seating (frozen), morph ghost, menus, bead affordance, empty-state copy. What is craft vs what blocks comprehension?

Return the write-back format. Frozen: Paper look, harvest z-index 120, morph --travel 1080ms, bead diameter, Home seating. AskShell parked — do not revive unless Camron asks. Do not promote. Family /ask frozen.
```

---

### Lane 6 — Mobile web (Safari iPhone)

```text
You are team lead for Halo mobile web. Read web/HEAD-PLANNER-REVIEW.md, web/HARVEST-OPS.md (mobile QA), web/src/components/ChromeMenu.tsx, web/src/components/DictateButton.tsx, web/src/lib/coarse-pointer.ts, AskLanding/ChatThread/HomeBubbles mobile branches, COMPOSER-MORPH-PLAN.md.

Head scores: Mobile Safari 6, Voice 4, First-session 4, Chat morph 6. **ChromeMenu hamburger is working tree, not early access 136d15f.** Roadmap wants iOS TestFlight at 1.4 — argue whether live Safari is ready.

Split: keyboard, harvest fly on phone, header/Keep width, play sheet, dictation gap, hamburger vs beads, reduced-motion. Gate: what must be true before any Capacitor shell.

Return the write-back format. Do not start an iOS wrapper. Do not promote.
```

---

### Lane 7 — Backend / database / auth / limits

```text
You are team lead for Halo backend. Read web/HEAD-PLANNER-REVIEW.md, web/src/lib/limits.ts, web/src/lib/usage.ts, web/src/lib/ask-guard.ts, web/src/lib/supabase/server.ts, web/src/app/api/keep/route.ts, web/src/app/api/chat/route.ts, invite/auth routes, supabase/migrations (especially keep_state, harvest_turns, recipes, members).

Head scores: Auth 7, Persistence 7, Cost/abuse **5 live** (weekly $1 + household $30 only; daily-40 is lab), Trust 7, Business 2, Testing 7. Dual store: `halo_learn_cards` vs Keep JSON. Native `proposed_facts` unused by Halo Keep.

Split: RLS, invite ops, Keep blob vs relational facts, telemetry PII, budget reserve, household cap, admin tools. What breaks at 20 users vs 4?

Return the write-back format. Do not migrate or promote. Flag duplicate * 2.ts if they affect runtime.
```

---

### Lane 8 — Library / Saves / recipes

```text
You are team lead for Halo Library/Saves. Read web/HEAD-PLANNER-REVIEW.md, web/LIBRARY-BACKLOG.md, web/src/lib/save-offer.ts, web/src/lib/recipes.ts, web/src/components/LibraryMenu.tsx, web/src/components/RecipesBoard.tsx, ChatThread save pill.

Head scores: Saves 6, Keep collection 6, Simple UI 7, Onboarding 3.

Split: detect precision, extract quality, photo, lists-not-built, Keep vs Library confusion, flyer target. Should lists exist. Should beads ever live in Library.

Return the write-back format. Do not implement. Do not promote.
```

---

### Lane 9 — Native VocalLearn / voice / future iOS shell

```text
You are team lead for voice and native. Read web/HEAD-PLANNER-REVIEW.md, HANDOFF.md, app/ session + src/engine (spaced-repetition, teaching-plan), web DictateButton, docs/PRODUCT_ROADMAP.md § 1.4 iOS.

Head scores: Voice 4, Teach-me 2, Learning encoding 4, Mobile 6, Business 2.

Honest question: is VocalLearn a lab to port into Halo play, or a separate product that should stay frozen? What pieces (semantic grading, hint ladder, SM-2) would actually improve Halo web this month vs distract from harvest/encoding?

Return the write-back format. Do not restyle native. Do not start TestFlight. Do not promote Halo.
```

---

### Lane 10 — Product / onboarding / habit / Teach-me (design)

```text
You are team lead for Halo product design (not pixels — comprehension, habit, discovery). Read web/HEAD-PLANNER-REVIEW.md, docs/PRODUCT_ROADMAP.md, docs/COVE_KEEP_VISION.md, web/PRODUCT-DISCOVERY.md, web/LIBRARY-BACKLOG.md § first review on harvest.

Head scores: Identity 8, First-session 4, Onboarding 3, Teach-me 2, Habit 2, Gamification 6, Business 2.

The head planner went off-script: delay Teach-me, streaks, Stripe, iOS until harvest + same-session encoding + bead inspect + three uncoached family rounds. Attack or defend that with user-journey storyboards (day 1 / day 2 / day 14). Propose the smallest onboarding that is still Paper-quiet.

Return the write-back format plus a one-page “if we were a successful consumer learning product, month-1 plan.” Do not implement. Do not promote.
```

---

### Lane 11 — Ops / QA / telemetry / promote

```text
You are team lead for Halo ops. Read web/HEAD-PLANNER-REVIEW.md, web/KEPT-BOARD.md, web/HARVEST-OPS.md, web/ROADMAP-VERSIONS.md, .cursor/rules/cove-rollout.mdc, ship-checklist, harvest test scripts in web/package.json.

Head scores: Testing 7, Code health 4, Cost 7, Business 2.

Split: fixture coverage vs live family traffic, promote checklist holes, duplicate files, uncommitted lab risk, what “done” means for HarvestLock/Luna. List the exact promote blockers for intent harvest and for lock-in.

Return the write-back format. Do not deploy. Do not vercel --prod.
```

---

## Convergence prompt (after all 11 plan files exist)

In this chief chat: “Plans are in. Converge.” Full prompt is also at the bottom of `web/LANE-WAVE.md`.

```text
Read web/HEAD-PLANNER-REVIEW.md and every file in web/lane-plans/. Merge into one sequenced plan (max 8 implementation tickets). Resolve file overlaps. Keep frozen constraints. No code until I say go. Update KEPT-BOARD.md with the implementation wave locks.
```

---

## Context checkpoint (for a future model)

- Date: 2026-09-06. Production: v1.1.2 commit **136d15f** (Grok-only, 4000-char, weekly $1). Working tree ahead (intent, Luna, HarvestLock, ask-guard, ChromeMenu, parked AskShell).
- Consumer loop: Ask → harvest fly → Keep → next calendar day Home → SEE/SAY (one miss = fail) → gold ◎. Open chips never due.
- Harvest live dump: 15/50 turns chipped; family canned 8/8. Dual store: halo_learn_cards vs Keep JSON.
- Biggest product hole: unexplained first session + delayed encoding + harvest still imperfect on live.
- Biggest craft asset: Paper + play round + harvest motion.
- Score tweak after explore passes: cost/abuse **7 → 5** (live). Mean **5.7**.
- Do not promote. Family `/ask` frozen. Atlas was down at review time.
