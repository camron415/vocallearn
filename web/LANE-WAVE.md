# Lane wave — plan only (paste this)

**You (Camron):** open 11 new chats. First message in each chat = **the entire fenced block** for that lane (not “lane 3” by itself). They cannot see this chief thread.

**They:** plan only. Write `web/lane-plans/NN-….md`. Do not edit `web/src`, `app/`, `supabase/`, family `/ask`, or `web/KEPT-BOARD.md`.

**Then:** come back to the chief chat. Chief reads the eleven plan files, trims collisions, then a second wave implements.

Shared goal: a product people return to because it helps **this person** remember what mattered in **their** questions — more educational, higher quality, quietly fun — not a ChatGPT clone and not an RPG. Near-term order still: harvest precision → same-session encoding → bead inspect → quiet first-harvest copy → Luna. Teach-me / streak theater / Stripe / iOS shell stay proposals until family can finish a round without a stand-over demo.

Frozen for every lane: harvest z-index **120**, morph `--travel` **1080ms**, Paper look, bead diameter, Home seating. AskShell parked. No promote.

---

## Lane 1 — Ask / AI routing

```text
Lane 1. PLAN ONLY. You are Halo Ask / AI team lead.

Do not implement. Do not edit web/src, app/, supabase/, family /ask, or web/KEPT-BOARD.md (11 chats will clobber the board). Do not deploy. Do not promote.

Read in this order, then the files listed below:
1. web/HEAD-PLANNER-REVIEW.md (full — live 136d15f vs working tree)
2. web/HALO-V2-SUNDAY.md (frozen constraints only)
3. web/LANE-WAVE.md (wave rules)
4. web/src/app/api/chat/route.ts
5. web/src/lib/ask-route.ts, ask-turn.ts, ask-stream.ts, ask-provider.ts, ask-guard.ts, limits.ts, grok.ts, openai.ts, files.ts, live-lookups.ts

Goal of the product: private Ask that answers fast, then (when worth it) feeds a memory loop that is personal to this user’s questions. Your job is the front door: truthful useful answers, routing, caps, errors — still simple (no model picker).

Head scores you own or share: Simple AI/UI 7, Ask answer quality 7, Chat UX 6, Cost/abuse 5 live, Voice 4. Decompose each further (max 8 sub-scores). Challenge the head scores only with code evidence. Separate LIVE (Grok-only, 4000-char, weekly $1) from lab (Luna, 2000-char, daily 40, reserve).

You may later implement (not now) in: chat/route.ts, ask-route, ask-turn, ask-stream, ask-provider, ask-guard, grok, openai, files, live-lookups. You do NOT own: learn-mine.ts, ask-intent.ts (Lane 2), keep-memory.ts (Lane 3), HomeBubbles play (Lane 4), HarvestFlights z-index, AskShell.

Write web/lane-plans/01-ask.md with:
- Live vs lab you assumed
- Sub-scores
- What wife/parents actually hit on send / resume / files / search / errors
- Improvements for every related 1–10 (now / later / never)
- How this lane makes answers feel like THEY got what they asked, cheaply enough to spread beyond family
- Top 5 implementation tickets (files, success test a human can fail)
- Handoffs to other lanes
- Do-not-do (Teach-me intercept, model picker, morph retune)

Also paste a short write-back in chat:
LANE: 1 Ask
SCORES I DISAGREE WITH:
FURTHER SPLIT:
TOP 5 TICKETS:
HANDOFFS:
DO NOT DO:
```

---

## Lane 2 — Harvest / intent / miner

```text
Lane 2. PLAN ONLY. You are Halo harvest team lead.

Do not implement. Do not edit web/src, app/, supabase/, family /ask, or web/KEPT-BOARD.md. Do not retune harvest z-index 120. Do not deploy. Do not promote.

Read: web/HEAD-PLANNER-REVIEW.md, web/LANE-WAVE.md, web/INTENT-HARVEST-1.2.md, web/HARVEST-OPS.md, web/src/lib/learn-mine.ts, harvest-policy.ts, ask-intent.ts, harvest.ts, harvest-log.ts, web/reports/harvest-family-review-latest.md, harvest-turns-latest.md, harvest-smoke-latest.md.

Goal: chips must be the answer to THIS question (or tight support), never socks/weather/tangents. Personal library = their curiosity, not a curriculum. This is the load-bearing risk. Live dump 15/50 harvested; canned family 8/8; intent classify NOT on 136d15f.

Head scores: Harvest 5, Encoding 4, Testing 7. Sub-score at least: skip precision, primary-fact hit, tangent rate, closed-lookup miss, latency, promote-readiness.

Later implement (not now) in: learn-mine, harvest-policy, ask-intent, harvest.ts, harvest-log, fixtures, family-review. Do NOT own: keep-memory scheduler, HomeBubbles GUI, HarvestFlights motion, ChatThread save pill (Lane 8).

Write web/lane-plans/02-harvest.md including a promote-readiness checklist for intent+skip on early access, and how harvest quality is the prerequisite for “spread to people.”

Chat write-back:
LANE: 2 Harvest
SCORES I DISAGREE WITH:
FURTHER SPLIT:
TOP 5 TICKETS:
HANDOFFS:
DO NOT DO:
```

---

## Lane 3 — Keep / memory / due / sync

```text
Lane 3. PLAN ONLY. You are Halo Keep memory team lead.

Do not implement. Do not edit web/src, app/, supabase/, family /ask, or web/KEPT-BOARD.md. Do not deploy. Do not promote.

Read: web/HEAD-PLANNER-REVIEW.md, web/LANE-WAVE.md, web/HALO-V2-SUNDAY.md, docs/COVE_KEEP_VISION.md, web/src/lib/keep-memory.ts, keep-cloud.ts, local-day.ts, web/src/app/api/keep/route.ts.

Goal: facts they harvested become a trustworthy personal bank — due when it helps memory, not a mysterious overnight wait they don’t understand. Caps 30 Keep / 16 Home / day 3 (code; spec still says 2). Open chips have no dueAt. One miss fails the round (play owns UX; you own finishRound math). Dual store halo_learn_cards vs Keep JSON.

Head scores: SRS 7, Keep collection 6, Home due 8, Persistence 7, Habit 2.

Later implement (not now) in: keep-memory.ts, keep-cloud.ts, local-day.ts, api/keep. Do NOT own: HomeBubbles GUI, HarvestLock, ChatThread, HarvestFlights.

Write web/lane-plans/03-keep.md. Explicitly compare: keep wait-until-tomorrow vs same-day first due vs encoding-owned-by-Lane-4. Recommend one. Overflow + bead inspect is Lane 5 chrome calling your data — specify the read API you’d need.

Chat write-back:
LANE: 3 Keep
SCORES I DISAGREE WITH:
FURTHER SPLIT:
TOP 5 TICKETS:
HANDOFFS:
DO NOT DO:
```

---

## Lane 4 — Review loop / play sheet

```text
Lane 4. PLAN ONLY. You are Halo review / play team lead.

Do not implement. Do not edit web/src, app/, supabase/, family /ask, or web/KEPT-BOARD.md. Do not retune morph 1080ms or harvest z-index 120. Do not deploy. Do not promote.

Read: web/HEAD-PLANNER-REVIEW.md, web/LANE-WAVE.md, web/HALO-V2-SUNDAY.md, web/src/components/HomeBubbles.tsx (play / SEE / SAY / end card), HarvestLock.tsx, web/src/lib/open-score.ts, learn.ts, web/src/components/LearnReview.tsx (zombie).

Goal: the round is the product’s fun and the encoding engine — calm, short, wants one more cluster, still obviously learning (gamification ~5–7, no XP/hearts). Same-session lock-in (HarvestLock) is more important this month than Teach-me. One miss = fail even after retry — defend or change. Open gist never plays on Home.

Head scores: Play 8, Gamification 6, Encoding 4, First-session 4.

Later implement (not now) in: HomeBubbles play/end-card (not seating pack), HarvestLock, open-score, learn.ts, deleting or flagging LearnReview/KeepAlbum. Do NOT own: keep-memory math, harvest miner, morph, Home seating algorithm.

Write web/lane-plans/04-review.md. Recommend: promote HarvestLock as-is, redesign, or “try it now” chip. How the round gets more addictive WITHOUT streaks/leagues.

Chat write-back:
LANE: 4 Review
SCORES I DISAGREE WITH:
FURTHER SPLIT:
TOP 5 TICKETS:
HANDOFFS:
DO NOT DO:
```

---

## Lane 5 — UI / Paper / motion

```text
Lane 5. PLAN ONLY. You are Halo UI / Paper / motion team lead.

Do not implement. Do not edit web/src, app/, supabase/, family /ask, or web/KEPT-BOARD.md. Do not revive AskShell unless the plan says “ask Camron.” Frozen: Paper, harvest z-index 120, morph 1080ms, bead diameter, Home seating. Do not deploy. Do not promote.

Read: web/HEAD-PLANNER-REVIEW.md, web/LANE-WAVE.md, web/HALO-V2-SUNDAY.md, web/COMPOSER-MORPH-PLAN.md, web/src/components/AskLanding.tsx, ChatThread.tsx, HaloHeader.tsx, KeepPocket.tsx, GoldKeptBadge.tsx, HarvestFlights.tsx, LoopFlights.tsx, AskShell.tsx (parked).

Goal: comprehension + quiet delight. Beads must become inspectable (tap → prompt/answer/rank). First harvest needs one Paper-quiet line. Fun is craft, not confetti. Morph ghost is polish unless Camron still hates it after encoding ships.

Head scores: Visual 8, Fun 8, Simple UI 7, Morph 6, Keep collection 6, Onboarding 3, Code health 4.

Later implement (not now) in: HaloHeader, KeepPocket, GoldKeptBadge, HarvestFlights (not z-index), LoopFlights, AskLanding greeting/copy, paper CSS, ChatThread highlight chrome. Do NOT own: keep-memory, learn-mine, HomeBubbles seating, play SEE/SAY internals, save-offer.

Write web/lane-plans/05-ui.md. Bead inspect spec (panel vs sheet). Empty-Home copy. What you will not redesign.

Chat write-back:
LANE: 5 UI
SCORES I DISAGREE WITH:
FURTHER SPLIT:
TOP 5 TICKETS:
HANDOFFS:
DO NOT DO:
```

---

## Lane 6 — Mobile web (Safari iPhone)

```text
Lane 6. PLAN ONLY. You are Halo mobile-web (Safari iPhone) team lead.

Do not implement. Do not start Capacitor / TestFlight. Do not edit web/src, app/, supabase/, family /ask, or web/KEPT-BOARD.md. Do not deploy. Do not promote.

Read: web/HEAD-PLANNER-REVIEW.md, web/LANE-WAVE.md, web/HARVEST-OPS.md, web/COMPOSER-MORPH-PLAN.md, web/src/components/ChromeMenu.tsx, DictateButton.tsx, web/src/lib/coarse-pointer.ts, phone branches in AskLanding, ChatThread, HomeBubbles.

Goal: the product people would actually open on a phone — type-first, Keep visible, harvest fly trustworthy, play usable. ChromeMenu hamburger is working tree, NOT on live 136d15f. iOS shell is a wrapper; it does not fix Safari.

Head scores: Mobile 6, Voice 4, First-session 4, Morph 6.

Later implement (not now) in: ChromeMenu, DictateButton, coarse-pointer, phone CSS in existing components. Do NOT own: AskShell, keep-memory, miner, native app/.

Write web/lane-plans/06-mobile.md. Gate list: “Safari must do X before any iOS shell.” Dictation honest copy. Header vs beads.

Chat write-back:
LANE: 6 Mobile
SCORES I DISAGREE WITH:
FURTHER SPLIT:
TOP 5 TICKETS:
HANDOFFS:
DO NOT DO:
```

---

## Lane 7 — Backend / database / auth / limits

```text
Lane 7. PLAN ONLY. You are Halo backend / auth / data team lead.

Do not implement. Do not run migrations. Do not edit web/src, app/, supabase/, family /ask, or web/KEPT-BOARD.md. Do not deploy. Do not promote.

Read: web/HEAD-PLANNER-REVIEW.md, web/LANE-WAVE.md, web/src/lib/limits.ts, usage.ts, ask-guard.ts, files.ts, web/src/lib/supabase/server.ts, web/src/app/api/keep/route.ts, invite/auth routes, supabase/migrations (keep_state, harvest_turns, recipes, members, learn_cards).

Goal: a household product that can spread without melting cost or leaking private Q&A. Live caps = weekly $1 + household $30 (score 5). Lab has daily 40 / burst / reserve. Dual decks: halo_learn_cards vs Keep JSON. Native proposed_facts unused by Keep.

Head scores: Auth 7, Persistence 7, Cost/abuse 5 live, Trust 7, Business 2, Testing 7.

Later implement (not now) in: limits/usage/ask-guard/files (coordinate Lane 1), invite/admin, keep API, planned migrations only after chief says go. Do NOT own: miner prompts, play GUI.

Write web/lane-plans/07-backend.md. What breaks at 20 users. Promote path for lab guards. PII of harvest_turns. Duplicate * 2.ts runtime risk (list, don’t delete).

Chat write-back:
LANE: 7 Backend
SCORES I DISAGREE WITH:
FURTHER SPLIT:
TOP 5 TICKETS:
HANDOFFS:
DO NOT DO:
```

---

## Lane 8 — Library / Saves / recipes

```text
Lane 8. PLAN ONLY. You are Halo Library / Saves team lead.

Do not implement. Do not edit web/src, app/, supabase/, family /ask, or web/KEPT-BOARD.md. Do not deploy. Do not promote.

Read: web/HEAD-PLANNER-REVIEW.md, web/LANE-WAVE.md, web/LIBRARY-BACKLOG.md, web/src/lib/save-offer.ts, recipes.ts, web/src/components/LibraryMenu.tsx, RecipesBoard.tsx, ChatThread save pill.

Goal: opt-in keeps (recipes/lists) stay distinct from auto Keep facts. Personal: their pasta, not a generic cookbook. Lists are unbuilt. Do not turn Library into a second Keep.

Head scores: Saves 6, Keep collection 6, Simple UI 7, Onboarding 3.

Later implement (not now) in: save-offer, recipes, LibraryMenu, RecipesBoard, recipe APIs. Do NOT own: Keep beads, harvest miner, play sheet.

Write web/lane-plans/08-library.md. Detect quality, list MVP yes/no, copy so Keep vs Library is obvious.

Chat write-back:
LANE: 8 Library
SCORES I DISAGREE WITH:
FURTHER SPLIT:
TOP 5 TICKETS:
HANDOFFS:
DO NOT DO:
```

---

## Lane 9 — Native VocalLearn / voice / future iOS

```text
Lane 9. PLAN ONLY. You are voice + native team lead.

Do not implement. Do not restyle VocalLearn. Do not start TestFlight. Do not edit web/src Halo, or web/KEPT-BOARD.md. Do not deploy Halo. Do not promote.

Read: web/HEAD-PLANNER-REVIEW.md, web/LANE-WAVE.md, HANDOFF.md, app/ session + src/engine (spaced-repetition, teaching-plan, scoring), web/src/components/DictateButton.tsx, docs/PRODUCT_ROADMAP.md § 1.4.

Goal: decide what (if anything) native should give Halo web THIS MONTH for better remembering-by-speaking — vs freeze native as a lab. Native shares ask_conversations, NOT Keep. notifications.ts is a stub.

Head scores: Voice 4, Teach-me 2, Encoding 4, Mobile 6, Business 2.

Later implement (not now) only in app/ and src/engine — or a thin port into web open-score IF chief approves. Do NOT own Halo harvest/Keep/play chrome.

Write web/lane-plans/09-native.md. Port vs freeze. What would make Halo more educational on phone without an iOS wrapper.

Chat write-back:
LANE: 9 Native
SCORES I DISAGREE WITH:
FURTHER SPLIT:
TOP 5 TICKETS:
HANDOFFS:
DO NOT DO:
```

---

## Lane 10 — Product / onboarding / habit / Teach-me

```text
Lane 10. PLAN ONLY. You are Halo product-design lead (comprehension, habit, discovery — not pixels).

Do not implement. Do not edit web/src. You MAY only write web/lane-plans/10-product.md (not KEPT-BOARD, not the canonical roadmap until chief merges). Do not deploy. Do not promote.

Read: web/HEAD-PLANNER-REVIEW.md, web/LANE-WAVE.md, docs/PRODUCT_ROADMAP.md, docs/COVE_KEEP_VISION.md, web/PRODUCT-DISCOVERY.md, web/LIBRARY-BACKLOG.md (first review on harvest), web/HALO-V2-SUNDAY.md gamification 5.

Goal: people are satisfied because it helps them learn and remember what matters to THEM. Fun and a bit addictive from a clear loop + quiet collection, not XP. Spread later; proof first = three family members finish a round uncoached.

Head scores: Identity 8, First-session 4, Onboarding 3, Teach-me 2, Habit 2, Gamification 6, Business 2.

Attack or defend the off-script sequence (harvest → encode now → bead inspect → quiet copy → Luna; park Teach-me/streaks/Stripe/iOS). Storyboard day 1 / day 2 / day 14. Smallest Paper-quiet onboarding. Habit that is not Duolingo anxiety.

Write web/lane-plans/10-product.md plus a one-page “successful consumer learning product, month 1.” Propose copy, not components (Lane 5 draws).

Chat write-back:
LANE: 10 Product
SCORES I DISAGREE WITH:
FURTHER SPLIT:
TOP 5 TICKETS:
HANDOFFS:
DO NOT DO:
```

---

## Lane 11 — Ops / QA / telemetry / promote

```text
Lane 11. PLAN ONLY. You are Halo ops / QA / promote team lead.

Do not implement. Do not deploy. Do not vercel --prod. Do not edit web/src except you may PLAN deleting duplicate * 2.ts (do not delete now). Do not edit web/KEPT-BOARD.md. Do not promote.

Read: web/HEAD-PLANNER-REVIEW.md, web/LANE-WAVE.md, web/KEPT-BOARD.md, web/HARVEST-OPS.md, web/ROADMAP-VERSIONS.md, .cursor/rules/cove-rollout.mdc, ship-checklist, web/package.json test scripts.

Goal: family never gets a half-baked experiment; lab can still move. Define “done” for intent harvest, HarvestLock, Luna, ChromeMenu. CI is test:harvest only.

Head scores: Testing 7, Code health 4, Cost/abuse 5 live (Lane 11 old brief said 7 — use 5), Business 2.

Write web/lane-plans/11-ops.md. Promote checklists. Fixture vs live traffic. Duplicate-file cleanup plan. How 11 plan files get merged without board clobber (you design the implementation-wave board protocol).

Chat write-back:
LANE: 11 Ops
SCORES I DISAGREE WITH:
FURTHER SPLIT:
TOP 5 TICKETS:
HANDOFFS:
DO NOT DO:
```

---

## After all 11 plan files exist

In the **chief** chat (this one), say: “Plans are in. Converge.” or paste:

```text
Read web/HEAD-PLANNER-REVIEW.md and every file in web/lane-plans/. Merge into one sequenced plan (max 8 implementation tickets). Resolve file overlaps. Keep frozen constraints. No code until I say go. Update KEPT-BOARD.md with the implementation wave locks.
```
