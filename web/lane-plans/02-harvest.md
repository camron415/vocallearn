# Lane 2 — Harvest / intent / miner (plan only)

**Date:** 2026-09-06  
**Holder:** Harvest team lead (this chat)  
**Mode:** Plan. No `web/src`. No `web/KEPT-BOARD.md`. No deploy. No promote.  
**Frozen:** harvest z-index **120**. Family `/ask` frozen. AskShell parked.

**Job:** chips are the answer to *this* question (or tight support). Never socks, weather, recipes-as-facts, or paragraph trivia. Personal Keep = this person’s curiosity, not a curriculum.

This is the **load-bearing risk**. Encoding, play, and “spread to people” all fail if the dots are junk.

---

## Live vs lab (do not mix)

| Surface | What harvest actually does |
| --- | --- |
| **Early access `136d15f`** | Regex `shouldSkipHarvest` + post-answer Grok miner. **No** `classifyAskIntent`. **No** INTENT block. **No** capital fallback in that ship. Live dump (50 rows, 2026-09-04): **15 harvested / 28 chips**, **23 `policy_skip`**, **12 zero-card non-skips**. Socks **were** harvested. Capitals of US/Utah **missed**. |
| **Working tree (not promoted)** | `classifyAskIntent` (Grok none, 2.5s fallback) → `intentAnswerGuide` shapes the reply → miner with INTENT + `capitalFallbackCard` / `openFallbackCard`. Family canned miner **8/8**. CI `test:harvest` includes intent fallback fixtures. |
| **Canned family pack** | Uses **`fallbackAskIntent`**, not live `classifyAskIntent`. 8/8 does **not** prove the Grok classifier. |
| **Smoke latest** | Dry **9/9 gate-only**. Live miner Nile/Rome **not** in `harvest-smoke-latest.md`. |

Head claim stands: live family still hits the pre-intent miner. Lab code is ahead. Do not describe 8/8 as production quality.

---

## Head scores — agree / disagree

| Category | Head | This lane | Why |
| --- | ---: | ---: | --- |
| **9 Harvest selection** | 5 | **5 live / 6 lab** | Live 5 is correct (socks + capital misses). Lab is not an 8: `cardMatchesIntent` was specified in `INTENT-HARVEST-1.2.md` and **does not exist**; family 8/8 allows Nile→Egypt; classify is unmeasured. |
| **7 Learning encoding** | 4 | **Agree 4** (not our ship) | First lock-in is HarvestLock / delayed due (Lane 4 + 3). We only supply the chips. Wrong chips make encoding *feel* broken; we do not own SEE/SAY. |
| **28 Testing / promote** | 7 | **6 for harvest-proof** | Harvest tests are the best in the repo. The bar overclaims: 8/8 is fallback+canned; dry smoke is gates; live dump is the honest set and it is stale (pre-intent). Promote discipline elsewhere can stay 7 (Lane 11). |

---

## Sub-scorecard (1–10)

Grading rule matches the head review: 5 = usable, 8 = distinctive and reliable.

| Sub-score | Live `136d15f` | Lab tree | Evidence |
| --- | ---: | ---: | --- |
| **Skip precision** | 7 | 8 | Weather/news/stocks/sports skip well (dry 9/9, dump weather rows `policy_skip`). Live holes: recipes/events/photo-ID often **not** skipped (ravioli, BYU kickoff, Tesla time, “what is this”). Lab `fallbackAskIntent` catches socks, events, salsa, files; **recipe** still falls through unless the ask matches `easy pasta` / `simple dinner`. |
| **Primary-fact hit** | 4 | 7 | Live: capital of US (2/3 empty), capital of Utah empty, 12 empty non-skips. Lab: Utah/Maine canned hit; capital regex fallback; Gettysburg 1863. Photosynthesis still emitted a weak closed **`food`** chip. |
| **Tangent rate** | 3 | 6 | Live: socks blend as meaning; Wyoming capital + **1869**; Nigeria → Africa/Gulf/Abuja; “three statistics” dumped three encyclopedia chips; AirPods milliwatts. Lab: `maxChips` 1 on `direct` would kill Wyoming extras; **nile-name still harvested Egypt** on 8/8 because default `maxChips` is **2** and there is no intent filter. |
| **Closed-lookup miss** | 3 | 7 | Live miner blanks on short “X is the capital” replies; no fallback on `136d15f`. Lab `capitalFallbackCard` covers Maine/Utah/US in fixtures. No general retry for population/date/name. |
| **Latency** | 8 | 5 | Live: miner **after** stream; no classify. Lab: `classifyAskIntent` is **awaited before** `streamAskAnswer` in `chat/route.ts` (up to **2500ms** race). Miner still post-answer (correct). Promote must not add a felt pause. |
| **Promote-readiness** | 3 | 4 | Intent+skip are not on early access. Canned pack ≠ live traffic. Telemetry does not store intent. Dual-gate (`intent.harvest` **bypasses** `shouldSkipHarvest` in `mineLearnFromReply` when intent is passed) is a ship-blocker. |

**Lab harvest quality overall: 6.** Good enough to *try* on lab deploy; not enough to spread.

---

## What family actually experiences

**On live `/ask` today**

1. Ask weather → no chips (good).
2. Ask “capital of Utah” → sometimes **nothing flies** (miner `[]`, no fallback).
3. Ask with a sock photo → **polyester/spandex chip** flies into Keep. Tomorrow that chip can sit on Home. That is the trust-killer.
4. Ask “what was the civil war” / sushi / cows → chips often *are* the question (the good path).
5. Beads appear with no copy. If the chip is wrong, delight reads as a bug.

**In this working tree (Camron / lab only)**

- Socks / photo / event / salsa: `harvest=false` → `intent_skip` (if classify or fallback fires).
- Capitals: INTENT + regex fallback.
- How/why: `teach_light`, up to 1 open gist (Keep only, no `dueAt`) + closed pegs.
- Family pack 8/8 on **canned answers**. Photosynthesis still grew a `food` atom. Nile name-only grew **Egypt**.

**Not a curriculum.** “Three important statistics everyone should know” is the anti-pattern: a general-knowledge dump into *their* library. Harvest should refuse that shape unless *they* asked for those three numbers.

---

## Code evidence (gaps vs `INTENT-HARVEST-1.2.md`)

Specified, **not built:**

- `cardMatchesIntent(card, intent)` — drop cards that would not appear on a flashcard titled with the user’s question.
- Closed lookup + `cards:[]` → **retry miner once** or deterministic fallback (only **capital** regex exists).
- Telemetry alert on zero-card non-skips.

Built:

- Classify schema + 2.5s fallback (`ask-intent.ts`).
- INTENT block on miner (`learn-mine.ts` `minerSystem`).
- `capitalFallbackCard`, `openFallbackCard`.
- Policy ephemeral lists + short-capital reply exemption (`harvest-policy.ts`).
- `halo_harvest_turns` log (`harvest-log.ts`) — **no intent columns**; `policy_version` hardcoded `"v2"`; `trackHaloEvent` treats skip and miss as the same `skipped: length===0`.

**Bypass:** `mineLearnFromTurn` always passes intent (`intent ?? fallbackAskIntent`). Then `mineLearnFromReply` **skips `shouldSkipHarvest`** whenever intent is present. If classify says `harvest=true` on a forecast, policy will not save you. Family review *does* AND the two gates; production does not.

**Nile contradiction:** smoke `miner-nile` is a **why** ask (cluster 2–3 OK). Family `nile-name` is a **name-only** ask; 8/8 still accepted Egypt because `forbidTokens` is only Amazon and fallback `maxChips` defaults to 2.

---

## How harvest quality gates “spread to people”

Keep is not a textbook. If chips are *their* answers, beads become a private library and the round is worth opening tomorrow. If chips are socks, weather leftovers, or “fun facts from the paragraph,” family learns: **ignore the dots**. You cannot coach that away with tour copy, HarvestLock, or an iOS shell.

**Prerequisite order (defend the head planner):**

1. **Harvest precision on production** (this lane) — promote intent+skip only after the checklist below.
2. Then same-session encoding (Lane 4) — lock-in on *good* chips.
3. Then bead inspect / quiet first-harvest line (Lane 5 / 10).
4. Then Luna cost (Lane 1).
5. **Then** invite beyond the household.

Do not spread to friends while live dump still contains a socks chip. Three uncoached family rounds (Lane 10/11) are meaningless if the round is “what blend are these socks.”

---

## Promote-readiness checklist — intent + skip on early access

Chief / Lane 11 own the button. This lane owns the **harvest bar**. All boxes before Camron says **promote**.

### A. Correctness (must)

- [ ] Dual-gate: `!intent.harvest` **or** `shouldSkipHarvest` → skip. Classify cannot override ephemeral policy.
- [ ] Socks / photo ID / material blend / “what is this” + file → **skip** (fallback + classifier + a live `/ask` photo).
- [ ] Weather / news / scores / stocks → skip (already). Spanish/forecast-via-reply still skip (`el clima` dump did).
- [ ] Recipes and packing lists → **skip harvest** (Save pill is Lane 8). Fallback today misses “recipe for ravioli.”
- [ ] Event times / kickoff / “what time is X” → skip (lab fallback yes; live dump no).
- [ ] Closed lookup (capital, population, “when was X”) → **≥1 primary chip**. Empty non-skip is a **fail**, not a quiet skip.
- [ ] Capital fallback still fires if miner returns `[]`.
- [ ] `cardMatchesIntent` (or equivalent) drops extras that fail “would this be on a card titled with USER.” Nile **name-only** must not chip Egypt/Amazon/miles. Gettysburg **when** may keep 1863; Civil War trivia forbidden; Pennsylvania optional.
- [ ] Direct mode `maxChips === 1` actually caps (Wyoming 1869 must not land).
- [ ] Open gist: at most one; **no `dueAt`** (Lane 3 already); never on Home play (Lane 4).
- [ ] Span still in ASSISTANT. No invented tokens. Distractors same shape. Cap 3 cards. Play closed-only.

### B. Proof (must, not vibes)

- [ ] `npm run test:harvest` green (fixtures include socks skip, capital fallback, **nile-name forbids Egypt**, recipe skip, dual-gate).
- [ ] `test:harvest:live:dry` 9/9.
- [ ] `test:harvest:live` Nile + Rome miner (GROK_API_KEY).
- [ ] `test:harvest:family` 8/8 **and** pack grown with dump regressions: socks, ravioli, Tesla/BYU, capital US/Utah, “what is this” photo.
- [ ] Family pack also has a **classify** path (or logged classify vs fallback), not only `fallbackAskIntent`.
- [ ] Fresh `harvest:export` **after** lab deploy (not the 2026-09-04 pre-intent dump). Targets: **≥80%** closed primary asks get the right primary token; **≤1** socks-class tangent in 50 real turns; zero-card non-skips on closed lookups **= 0** or explained.
- [ ] Human: Camron + wife — one capital, one how/why, one weather, one photo. “Would I want this chip?”

### C. Latency / cost / ops

- [ ] Classify **not** a felt pause: overlap with live lookup / start stream with fallback and correct, **or** prove p95 classify < ~400ms on lab. Do not ship a 2.5s wait before first token.
- [ ] Miner stays Grok `effort: none` after reply. Luna does not mine (Lane 1).
- [ ] `halo_harvest_turns` logs `harvest`, `harvestWhy`, `answerMode`, `primaryAsk`, `skip_reason` (`intent_skip` | `policy_skip` | `mine_error` | empty-miss), classify vs fallback. Lane 7 if a migration is required — **do not migrate this wave unless chief says**. Until then, stuff JSON into `miner_raw` or existing fields without a new table.
- [ ] Lab deploy URL QA: Safari iPhone + desktop Chrome (`HARVEST-OPS.md`). Harvest still lands in **Keep**, not Home. z-index 120 untouched.
- [ ] Camron says **promote**. Not this chat.

### D. Explicit non-goals for this promote

HarvestLock, ChromeMenu, Luna, AskShell, bead inspect, Keep scheduler, Save pill UX, Teach-me.

Intent+skip can promote **without** HarvestLock. Encoding stays a 4 until Lane 4 ships. That is acceptable. **Wrong chips + lock-in** is worse than right chips + tomorrow’s round.

---

## Improvements by score (now / later / never)

| Score | Now (after chief go) | Later | Never |
| --- | --- | --- | --- |
| Skip precision | Dual-gate; recipe/photo/event in fallback **and** policy | Classifier eval set from live dump | Skip science how/why because the topic word is “weather” / “earthquake” |
| Primary-fact hit | `cardMatchesIntent` + closed-miss retry + capital fallback stay | Population/date regex fallbacks | Force 3 chips every turn |
| Tangent rate | Cap extras; forbidTokens in family pack from real dumps | Follow-up clustering (`INTENT-HARVEST-1.2` parked) | Harvest “everyone should know” trivia |
| Closed-lookup miss | Telemetry on `NOT skipped AND card_count=0`; fail CI on capital fixtures | Broader deterministic extractors | Lower minReplyLength globally (breaks noise) |
| Latency | Classify off the first-token path | Cache classify per identical userText | Extra miner call on every skip |
| Promote-readiness | Checklist A–C | Re-dump weekly | Promote on canned 8/8 alone |
| Encoding (shared) | Give Lane 4 chips worth saying | Open play when `scoreOpenFact` exists | Open gist on Home now |

---

## Top 5 implementation tickets

Later, not now. Success tests a human can fail.

### T1 — Dual-gate skip + recipe/photo/event holes

**Files:** `harvest-policy.ts`, `ask-intent.ts` (`fallbackAskIntent`, `CLASSIFIER`), `learn-mine.ts` (`mineLearnFromReply` / `mineLearnFromTurn`)  
**Do:** `skip = !intent.harvest || shouldSkipHarvest(...)`. Add recipe/list to policy (not only ephemeral weather). Fallback must skip “recipe for X” without needing `easy pasta`.  
**Human fail:** Photo of socks, or “recipe for homemade ravioli,” still grows a Keep bead.

### T2 — Primary card + `cardMatchesIntent`

**Files:** `learn-mine.ts` (`cardsFromMinerJson`), `ask-intent.ts` (small helper), `harvest-family-review.ts` (nile-name `forbidTokens: Egypt`)  
**Do:** Closed lookup with zero surviving cards → capital fallback, then one stricter miner retry. Drop cards that fail “flashcard titled with USER.” Direct `maxChips` 1 enforced after filter.  
**Human fail:** “What is usually named as the longest river?” highlights **Egypt** or Amazon. “Capital of Maine?” flies nothing.

### T3 — Family pack + CI from the live dump

**Files:** `harvest-family-review.ts`, `learn-mine-fixtures.ts`, `ask-intent-check.ts`, `harvest-smoke-cases.ts`  
**Do:** Add socks, ravioli, Tesla/BYU, capital US/Utah, photo “what is this,” Gettysburg trivia forbid. Assert skip vs miss vs tangent separately. Keep Nile **why** (smoke cluster) distinct from Nile **name** (one chip).  
**Human fail:** `test:harvest` green while dump cases would still chip socks.

### T4 — Telemetry that can fail a promote

**Files:** `harvest-log.ts`, `learn-mine.ts` (log classify/fallback), optional chat `trackHaloEvent`  
**Do:** Persist intent fields + skip taxonomy. Empty non-skip ≠ skip. Query from `HARVEST-OPS.md`. After lab traffic, export 50 rows and score the 80% / tangent bar.  
**Human fail:** We promote on 8/8 and cannot answer “did live socks stop?”

### T5 — Classify latency (coordinate Lane 1)

**Files:** `ask-intent.ts`, handoff note for `chat/route.ts` (Lane 1 owns the await)  
**Do:** Do not block first token for 2.5s. Race already falls back; still `await intentPromise` before stream. Overlap classify with lookup, or stream with fallback guide and ignore late classify for *answer* (harvest can wait until miner).  
**Human fail:** Wife hits send on a capital and stares at a blank chat for two seconds.

---

## Handoffs

| Lane | They need from us | We need from them |
| --- | --- | --- |
| **1 Ask** | `intentAnswerGuide` copy; do not mine. Classify must not stall TTFT (they own `route.ts` await). | Truthful short answers so spans exist. Luna later does not change miner. |
| **3 Keep** | Open chips, no due. We still upsert `halo_learn_cards` (legacy). Do not redesign the dual store in this harvest wave. | Cap 30 / silent drop is theirs. Scheduler / first-due is theirs. |
| **4 Review** | Closed chips only on Home. Open gist Keep-only. HarvestLock consumes **our** drafts. | Do not play socks because we failed skip. One-miss-fail is theirs. |
| **5 UI** | Highlights + fly use `harvest.ts` span matching. | **Do not** retune z-index 120. First-harvest line is copy, not miner. |
| **6 Mobile** | Same chips; fly must still land in Keep. | Phone QA of skip/harvest, not motion retune. |
| **7 Backend** | Telemetry PII is full Q&A in `halo_harvest_turns` (already). Maybe columns later. | No harvest migration unless chief says. Flag `* 2.ts` if a duplicate `learn-mine` could load. |
| **8 Library** | Recipes **must not** become Keep chips. | Save pill / detect stays theirs. |
| **10 Product** | Precision is the onboarding. Quiet line only after chips are trustworthy. | Do not schedule Teach-me / curriculum library. |
| **11 Ops** | This promote checklist. `test:harvest` ×3 + family + export. | They hold `deploy:lab` / promote. Duplicate-file cleanup is theirs. |

---

## Do not do

- Implement in this chat. Edit `web/src`, `app/`, `supabase/`, family `/ask`, or `web/KEPT-BOARD.md`.
- Retune harvest z-index **120** or morph `--travel` 1080ms.
- Deploy or promote.
- Own `keep-memory` scheduler, HomeBubbles GUI/seating, HarvestFlights motion, ChatThread save pill.
- Follow-up clustering / thread `topicKey` merge (`INTENT-HARVEST-1.2` parked).
- Open facts on Home play.
- Teach-me intercept, model picker, K-12 curriculum in Keep.
- Kill `halo_learn_cards` writes as a drive-by (Lane 7/3).
- Treat canned **8/8** or dry **9/9** as live family quality.
- Expand miner max chips to “feel educational.”

---

## Suggested now / later / never (this month)

**Now (implementation wave, after chief converges):** T1 + T2 + T3, then lab deploy + export (T4). T5 with Lane 1 if TTFT is ugly.

**Later:** classify eval vs fallback; population/date fallbacks; parked follow-ups; open play.

**Never this month:** Teach-me, streaks, Stripe, iOS, AskShell, harvest motion retune, spreading beyond family while socks can still land.
