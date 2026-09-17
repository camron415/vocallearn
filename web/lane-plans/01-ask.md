# Lane 1 — Ask / AI routing (plan only)

**Date:** 2026-09-06  
**Owner:** Ask / AI team lead  
**Status:** plan. No `web/src` edits. No promote. Family `/ask` frozen.

---

## Live vs lab assumed

Scores and “what wife/parents hit” are **early-access production**, not this working tree.

| | **LIVE (family)** | **LAB (this repo, not promoted)** |
| --- | --- | --- |
| Site | https://halo-gules-three.vercel.app `/ask` | local / `deploy:lab` `/preview` until Camron says promote |
| Commit | `halo-web@1.1.2` **`136d15f`** | working tree ahead of `136d15f` |
| Model | **Grok 4.3 only** (`streamGrokChat`). No `ask-provider`, no `openai.ts` | Luna default when `HALO_USE_LUNA` + `OPENAI_API_KEY`; Grok for files / medium+effort / lookup+search. Luna fail → Grok (`ask-stream.ts`) |
| Compose cap | **4000** chars (`ask-turn.ts` hardcode). Copy: `"Message too long"` | **2000** (`HALO_ASK_MESSAGE_MAX_CHARS`, `limits.ts`). Copy includes the number |
| Cost brakes | Weekly **$1**/user + household **$30**/30d. Checked in `prepareAskTurn` **before** the call. **No** daily-40, burst, inflight, or `ask_hold` | Daily **40**, burst **8**/min, inflight **1**, `ask_hold` reserve, magic-byte files, 6 files/day, body 4.5MB |
| Search | **Default reason path is `tools: true`, `maxToolCalls: 1`** even for ordinary chat (`136d15f` `ask-route.ts`). Lookup-and-not-deep: feeds only, search off, effort `none` | Default shallow chat: **search off**. Files: search only if depth or lookup. Lookup/depth: search on |
| Intent | `harvestAnswerHint` regex (depth, not lookup) | `classifyAskIntent` + `intentAnswerGuide` (Lane 2 owns classify; `route.ts` awaits it) |
| Attach | 3 × 4MB. MIME guess, **no** magic-bytes, **no** total 8MB cap, all images `detail: high`, text slice **20k**, any `DOCS` type uploaded to xAI | `validateAskAttachments`: JPEG/PNG/PDF magic, 1 PDF, total 8MB, text **8k**, first image high / rest low |
| Errors | Stream catch → `"Something went wrong. Try again."` | Same generic stream catch, plus richer 429 copy (daily / already answering / files) |
| Not on live | Luna, HarvestLock, ChromeMenu, AskShell, intent classify, `ask-guard` | Wired here; **do not describe as family** |

**Trap:** live `web/.env.example` lists `HALO_DAILY_MESSAGE_CAP=40`. **`136d15f` `ask-turn.ts` never reads it.** Family can blow past 40 as long as weekly $1 holds.

**Also assumed:** VocalLearn `app/` is a different product. This lane does not wrap iOS. Teach-me is not a send intercept.

---

## Head scores — agree / disagree (code only)

Family-facing scores. Lab noted separately. 1 = harmful, 5 = usable, 8 = distinctive, 10 = category-defining.

| # | Category | Head | This lane | Why |
| --- | ---: | ---: | ---: | --- |
| 2 | Simple AI / simple UI | **7** | **7 live** (Ask surface **8**) | One composer, no model picker, no mode picker. Routing is regex in `ask-route.ts`. The 7 is dragged down by unexplained harvest (Lane 5/10), not by Ask chrome. |
| 10 | Ask answer quality | **7** | **7 live / 6 if Luna promoted as-is** | Live is real Grok 4.3 + free feeds + search-on-default. No eval harness, so 7 is a household vibe, not a measured truth score. Lab Luna is `gpt-4.1-mini` while comments/prices say “GPT-5.6 Luna”. |
| 11 | Chat UX / morph | **6** | **6 overall; 7 for Ask mechanics** | Resume, `prepareOnly`, thinking/status, attach, copy, recipe early-return are serious. The 6 is the morph ghost (Lane 5; AskShell parked). Do not retune `--travel` 1080ms. |
| 19 | Cost / abuse | **5 live** | **4 live / 7 lab-if-promoted** | Head already dropped 7→5. Live still **searches almost every non-lookup ask**, has **no inflight/daily/reserve**, and env documents a daily cap that is not enforced. That is weaker than “weekly $ is enough.” |
| 23 | Voice | **4** | **4** (not this lane) | `DictateButton` is Web Speech. Mic still renders on Safari iPhone; tap explains type-instead. Play SAY is typing. Native STT does not drive Halo Ask. |

**Disagree with raising 19 after seeing lab `ask-guard`.** Family never hits those brakes until promote.

**Disagree with treating Chat UX 6 as an Ask-routing problem.** Fixing stream/errors can add a point of *reliability*; it will not move morph.

---

## Sub-scores (max 8 per head category)

### 2 — Simple AI / UI

| Sub | Live | Lab | Notes |
| --- | ---: | ---: | --- |
| One-box send (no picker) | 8 | 8 | Correct. Never add a model menu. |
| Hidden routing | 7 | 7 | Regex LOOKUP/DEPTH. False positives (`sport`, `meaning of`) are invisible to the user until the answer feels off. |
| Time-to-first-token | 7 | 6 | Live: feeds only on lookup/seedLive. Lab: intent classify up to 2500ms in parallel; lookup still waits on feeds before Grok. |
| Length without a Settings knob | 7 | 7 | Short 500 / medium 1600 (Grok); lookup effort `none` → 1100. Family cannot over-ask for “long.” |
| Error copy they can act on | 5 | 6 | Weekly/household copy is good. Stream failures are generic. Lab 429s are better. |
| Harvest appearing unexplained | 4 | 4 | Not this lane’s copy. System hints (`harvestAnswerHint` / `intentAnswerGuide`) already shape answers. |

### 10 — Ask answer quality

| Sub | Live | Lab | Notes |
| --- | ---: | ---: | --- |
| Direct answer to *this* question | 7 | 7 | System prompt: practical, warm, markdown. Intent guide (lab) tells Grok not to tutor on practical turns. |
| Truth / numbers | 6 | 6 | Live feeds + “do not invent figures.” ASK_SYSTEM_PROMPT still says **“You can search the web”** on every turn, including lookup with tools off (overlay tries to retract). |
| Live feeds (weather/markets/scores) | 8 | 8 | Open-Meteo, Yahoo, ESPN, etc. Geo from profile + request + client TZ. Strong household feature. |
| Web search when it matters | 7 | 6 | Live: search **on by default** for reason asks (costly, usually grounded). Lab: search off for shallow — cheaper, easier to be stale on undated facts that missed LOOKUP. |
| Files / vision | 6 | 7 | Live: JPEG/PNG/PDF works; spoofed MIME and 20k text dumps are allowed. Lab tighter. |
| Streaming completeness | 7 | 7 | `grok-stream`: SSE → non-stream `/responses` → `/chat/completions` fallback. Usage sometimes missing → `estimateAskMicros`. |
| Eval / regression | 2 | 3 | Harvest has fixtures. **Answers have no canned truth pack.** `ask-guard-check` / `ask-provider-check` are unit-ish, not “is Boise 72°F.” |
| Personal (their city, their follow-up) | 7 | 7 | Locale line, history trim last 24 / 8 full / 900 clip. Resume reloads last user. Not a tutor with a syllabus. |

### 11 — Chat UX (Ask-owned slice)

Morph / AskShell / hamburger: Lane 5–6. This table is send → stream → resume → error.

| Sub | Live | Lab | Notes |
| --- | ---: | ---: | --- |
| Send + morph prefetch | 7 | 7 | `prepareOnly` inserts the user row, arms resume, prefetches `/ask/[id]` during 1080ms travel. |
| Resume after remount | 8 | 8 | `resume` + 409 = already answered; Strict Mode delay 80ms; 3 retries. |
| Work / thinking / searching | 7 | 7 | Status `checking`/`reading` on feeds; Grok emits `searching`/`thinking`. Show-work after 450ms. |
| Attach UX vs server | 6 | 7 | Client accept is wide (HEIC…). Live server transcode-or-fail with “JPG, PNG, or PDF.” |
| Failure while leaving Home | 5 | 5 | `abortLeave` exists. Stream error after land is a red `form-error` line. Orphan user row if claim fails post-`prepareOnly` (lab). |
| Recipe intercept | 7 | 7 | `"save this recipe"` never hits Grok. JSON reply, not SSE. Lane 8 owns extract quality. |

### 19 — Cost / abuse

| Sub | Live | Lab | Notes |
| --- | ---: | ---: | --- |
| Weekly $1 | 6 | 6 | Real check. Live: after spend already ≥ cap. No reserve, so the turn that crosses $1 still completes. |
| Household $30 | 6 | 6 | `spendSince` without userId (service client in lab). Copy names Camron. |
| Daily / burst / inflight | **1** | **8** | Live: absent. Lab: 40 / 8 / 1 with human copy. |
| Search spend | **3** | **7** | Live default `tools: true`. Sunday note: tool calls are **not** in `limits.ts` (token-only). |
| File abuse | 4 | 7 | Live: 3×4MB, no daily file cap, no magic-bytes. Lab: 6/day + magic. |
| Luna vs Grok meter | n/a | **4** | `lunaCostMicros` is GPT-5.6 list ($0.20 / $1.20 / M). Runtime model default **`gpt-4.1-mini`**. Settings % can lie. |
| Dual gate / underestimate | n/a | 5 | `prepareAskTurn` estimates **luna + search false** whenever there are no files, then `claimAskTurn` uses the real provider. Tight budgets: morph succeeds, resume 429s. |

### 23 — Voice (handoff)

| Sub | Live | Lab | Notes |
| --- | ---: | ---: | --- |
| Desktop Chrome dictate | 6 | 6 | Web Speech, continuous + interim. |
| Safari iPhone | 2 | 2 | Button still there; `onBlocked` tells them to type. |
| Honest copy | 5 | 5 | Exists, but only after tap. |
| SAY / tutor voice | 1 | 1 | Not Ask. Native app does not feed Keep. |

---

## What wife/parents actually hit

Production `/ask`, signed-in member, Grok-only.

### Send (Home composer)

1. Type (or desktop dictate) → Send.
2. Client `prepareOnly: true` → server creates `ask_conversations`, **inserts the user message**, checks weekly $1 / household $30, returns `conversationId`.
3. Morph 1080ms to `/ask/[id]` (blank ghost is Lane 5). Model is **not** streaming yet.
4. Chat page `resume: true` starts the SSE. Status may show “checking” / feed names if LOOKUP matched.
5. Tokens stream. If the miner likes the turn, spans light up and chips fly (Lane 2/5). They cannot inspect beads.

**They cannot pick a model.** They cannot pick search. They cannot pick length. That is the product.

**Live routing they actually get**

- “What’s the weather?” → lookup, **no** Grok search, Open-Meteo, effort `none`, short-ish (1100 cap).
- “Why did the market drop?” → reason + feeds + **search** (DEPTH + LOOKUP).
- “How do I get ketchup out of a shirt?” → **reason + search on** (live default). Lab would be Luna, search off.
- “What’s a good sport for kids?” → LOOKUP `sport` + not DEPTH → **ESPN scoreboard path**, search off. Answer can feel like last night’s NFL, not parenting. This is a real “they didn’t get what they asked” bug.
- “Save this recipe” → no model; Library (Lane 8).

Caps they can hit: **4000** chars (client live compose may still allow until server 400); **$1/week** (“Try again next week”); household $30 (“Ask Camron”). They will **not** hit “Today’s message limit” on live.

### Resume

- Refresh / Strict remount / morph land: last row is user → auto-resume (up to 3).
- 409 “Nothing to resume” if the assistant already saved → treated as success + `router.refresh()`.
- Attachments stashed in session for the resume POST.
- If they send a second question while the first is streaming, ChatThread **aborts** the first (`generating` set). Live has **no** server inflight lock — two devices can run two Groks.

### Files

- Paperclip: images / HEIC / PDF / txt. Live server: jpeg/png inline, pdf → xAI `/files`, text inlined 20k.
- Failure copy: `"Could not attach that file. Try a smaller JPG, PNG, or PDF."` or “too large (max 4 MB)”.
- No daily file cap on live. Three 4MB photos is a real Grok bill.

### Search / live data

- Lookup: they should see feed names in the answer (prompt: “Name these feeds”). Sources list attached from feeds, not invented.
- Depth/reason (live): Grok `web_search`, work trace “searching”. Sources from Grok citations + sanitize.
- If a feed 3500ms-timeouts, prompt says say you could not fetch it. If **no** feed matched: “Ask which city, ticker, or league.” Weather without a city uses **profile/geo default place**.

### Errors

| Situation | What they see |
| --- | --- |
| Not invited | “This account is not invited.” |
| Weekly $ | “This week’s limit is reached. Try again next week.” |
| Household | “Household monthly limit reached. Ask Camron if you need more.” |
| Empty send | “Message required” (client usually blocks) |
| 4000 chars | “Message too long” |
| Grok/stream throw | **“Something went wrong. Try again.”** — no retry hint, no “Grok is down”, no timeout |
| Recipe none | “I couldn't find a recipe in this chat…” |
| Voice iPhone | After mic tap: type instead / Chrome on computer |

`maxDuration = 60`. A long search+reason can die at Vercel 60s and look like the generic error.

---

## How this lane makes it feel like THEY got what they asked (cheaply enough to spread)

The bet is not “smarter ChatGPT.” It is: **this household’s question, answered in the first screen, then (when worth it) a chip that is obviously that answer.**

Ask’s job:

1. **Lead with their token.** Capital, temperature, score, “use cold water on ketchup” — first sentence. `intentAnswerGuide` already says this for `direct`; live only has `harvestAnswerHint` on depth explains. Promote that lead-with-the-answer rule for lookup **without** waiting on Teach-me.
2. **Search only when the question is dated or deep.** Live’s default `tools: true` is the opposite of “cheaply enough to spread.” Lab already flipped shallow chat to search-off. That lab default is the promote path — **after** a canned pack proves shallow Luna/Grok without search does not invent prices.
3. **Use free feeds for the family staples** (weather, markets, scores). That is both quality and cost. Keep regex honest so “sport for kids” does not become ESPN.
4. **No picker.** Savings come from routing, not from making mom choose Luna. Luna is a silent default for shallow; Grok stays files/depth/live.
5. **Caps a parent understands.** Weekly $ is invisible until it trips. A daily 40 + “already answering” is how you invite siblings without Camron watching Settings. Promote lab brakes; do not invent Stripe this month.
6. **Do not tutor on send.** Practical/photo/shopping answers stay answers. Harvest/intent (Lane 2) decide chips. A Teach-me intercept would destroy “they got what they asked.”

Spread test (this lane): three family members can ask weather, a school fact, and a stain/how-to in one week without Camron refreshing keys or explaining a model menu — and the school fact is the one that becomes a chip.

---

## Improvements by related 1–10 (now / later / never)

“Now” = after chief converges, still **not** this plan wave. “Later” = after three uncoached family rounds or a named promote. “Never” = conflicts with identity or freeze.

### 2 Simple AI/UI

| | |
| --- | --- |
| **Now** | Keep zero pickers. Match system prompt to whether search is actually on (stop “You can search” on lookup). |
| **Later** | One Paper-quiet line after first harvest (Lane 5/10 copy; we only avoid stuffing tutor prose into the answer). |
| **Never** | Model picker, Search toggle, Length slider, “Advanced reasoning” chip. |

### 4 Repeat-use (shared)

| | |
| --- | --- |
| **Now** | Honest 429s after morph (claim using the real route at `prepareOnly`, or don’t insert until claimed). |
| **Later** | Settings usage that matches Luna vs Grok actual $ (Lane 7). |
| **Never** | Per-chat model history badge. |

### 10 Ask answer quality

| | |
| --- | --- |
| **Now** | Routing false-positive pass (`sport`, `meaning of`, `holiday` in non-live asks). Canned **answer** pack: weather, capital, stain, “why photosynthesis”, ticker — fail if first sentence misses the ask. Search-prompt honesty. |
| **Later** | Promote Luna only after that pack. Optional: tool-call metering (Sunday post-V2). |
| **Never** | Teach-me intercept. Fine-tune. Multi-agent “researcher.” Eval theater without family questions. |

### 11 Chat UX

| | |
| --- | --- |
| **Now** | Typed stream errors (timeout vs attach vs budget vs Grok). Don’t abort a useful partial without saving it if we already have text (today catch releases hold and shows generic). |
| **Later** | Morph/AskShell only if Camron still hates the ghost after encoding (Lane 5). |
| **Never** | Retune `--travel` 1080ms or harvest z-index 120. Revive AskShell without Camron. |

### 15 Mobile Safari (shared with 6)

| | |
| --- | --- |
| **Now** | File fail copy that mentions HEIC→JPG. Voice honesty is Lane 6. |
| **Later** | ChromeMenu promote (not this lane). |
| **Never** | Capacitor as a fix for dictation. |

### 19 Cost / abuse

| | |
| --- | --- |
| **Now** | Promote lab `ask-guard` + 2000-char + magic-byte files **or** at least: live default search **off** for shallow (already in lab `ask-route`) + enforce daily-40 if env says 40. Align Luna **model id and prices**. Estimate `prepareOnly` with intended provider/search. |
| **Later** | Meter `web_search` / file uploads in `costMicros`. Household admin “who spent.” |
| **Never** | Stripe / public signup this month. Lab $12 as family. |

### 23 Voice

| | |
| --- | --- |
| **Now** | Nothing in Ask routing. Handoff Lane 6: don’t show a working-looking mic that fails. |
| **Later** | If native STT is ported, it is play/SAY (Lane 9/4), not Ask send. |
| **Never** | Voice-only Ask, wake word, VocalLearn session loop inside `/ask`. |

### 24 Code health (Ask files)

| | |
| --- | --- |
| **Now** | Do not import `ask-route 2.ts` (duplicate). Lane 11 deletes after converge. |
| **Later** | Kill unused live `HALO_DAILY_MESSAGE_CAP` comment-vs-code mismatch by making one source of truth. |
| **Never** | Rewrite Grok stream for fun. |

### 27 Trust (shared 7)

| | |
| --- | --- |
| **Now** | Magic-byte files before friends-wave. Don’t put file bytes in harvest telemetry (Lane 2/7). |
| **Later** | Privacy sentence: photos go to xAI. |
| **Never** | Ads, public transcripts. |

---

## Top 5 implementation tickets

Do not start until chief converges. Files this lane may touch: `web/src/app/api/chat/route.ts`, `ask-route.ts`, `ask-turn.ts`, `ask-stream.ts`, `ask-provider.ts`, `ask-guard.ts`, `grok.ts`, `openai.ts`, `files.ts`, `live-lookups.ts`. Coordinate `limits.ts` with Lane 7.

### T1 — Live search default = lab shallow-off (cost + “they asked”)

**Files:** `ask-route.ts` (live still `tools: true` on the final default branch; lab already `false`). Do not change LOOKUP feed behavior.  
**Success (human can fail):** On production-like Grok-only, send **“How do I get ketchup out of a shirt?”** Work trace must **not** show searching. Answer must still be a usable how-to in the first screen. Send **“Why did the S&P drop today?”** — searching **or** Yahoo snapshot must appear; first sentence is about the market, not a stain lecture.  
**Fail:** Ordinary chores trigger `web_search`.  
**Depends:** none. Safe before Luna.

### T2 — Prompt tells the truth about search

**Files:** `constants.ts` `ASK_SYSTEM_PROMPT` Search section (or inject from `ask-route` / `grok.ts` `grokInput` only when `tools`). `liveLookupContext` already retracts; the base prompt still asserts search.  
**Success:** “What’s the weather in Boise?” — answer names Open-Meteo (or says fetch failed). **No** “I searched the web.” **No** invented `## Sources` URLs.  
**Fail:** Lookup answers cite fake links or claim a search that `maxToolCalls` was 0.

### T3 — Promote household brakes (without a picker)

**Files:** `ask-guard.ts`, `ask-turn.ts`, `limits.ts` (with Lane 7), `route.ts` claim/commit. Ship what lab already has: daily 40, burst 8, inflight 1, reserve, 2000-char, magic-byte files. **Fix:** `prepareAskTurn` must estimate with **intended** provider/search (not luna+search false), and must not leave a stranded user row if claim will fail — claim (or a cheap precheck with the real estimate) before insert, or `prepareOnly` without insert.  
**Success:** 41st send same calendar-ish day → *“Today’s message limit is reached. Try again tomorrow.”* Two overlapping sends on one account → *“Already answering…”* Spoofed `.jpg` of the bytes `not-a-jpeg` → reject. Settings weekly $ still works.  
**Fail:** Family site still only weekly $ while `.env` says 40. Morph succeeds then 429 after the question is already in History.  
**Do not** turn on Luna in the same ticket.

### T4 — Actionable stream errors

**Files:** `route.ts` catch, `ask-stream.ts` / `grok-stream.ts` (surface status, don’t dump API bodies).  
**Success:** Pull GROK key locally → not a silent hang; copy like “Ask is unavailable. Try again in a minute.” (not raw xAI JSON). Stop a search-heavy turn at ~60s → “That took too long. Try a shorter question.” Budget 429s stay as they are.  
**Fail:** Every failure is “Something went wrong. Try again.”

### T5 — Silent Luna, after a human answer pack (quality + cost to spread)

**Files:** `ask-provider.ts`, `openai.ts`, `ask-stream.ts`, `limits.ts` prices vs `GPT_LUNA_MODEL`. Fallback Grok already exists.  
**Success pack (fail any row):**  
1. Weather / ticker / scores still **Grok + feeds** (not Luna guessing).  
2. Stain/how-to or “what’s for dinner” is **Luna** (or Grok if Luna unset) — no model name on screen.  
3. Kill OpenAI key mid-lab → stream still completes (Grok fallback); no picker.  
4. Settings spend for a Luna turn uses **that model’s** rates, not a GPT-5.6 comment.  
**Fail:** Capital/weather invents a number with search off; UI shows “GPT”; meter says 0¢ for a real call.  
**Promote:** Camron + Lane 11. Not bundled with HarvestLock.

---

## Handoffs

| Lane | Give / need |
| --- | --- |
| **2 Harvest** | We inject `harvestAnswerHint` (live) or `intentAnswerGuide` (lab) into the system prompt. We do **not** own `ask-intent.ts` / `learn-mine.ts`. Need: classify must not block first token more than the existing 2500ms parallel; socks/practical skip is their promote. If they change `primaryAsk`, we can later put it in the prompt — not now. |
| **3 Keep** | No scheduler edits. Conversation ids are ours; chips are theirs after harvest SSE. |
| **4 Play** | HarvestLock is post-answer. We keep sending `harvest` events the same way. No Teach-me button on send. |
| **5 UI** | Morph ghost / AskShell parked. Error string we emit lands in `form-error`. First-harvest copy is theirs; we will not pad answers with “review tomorrow.” |
| **6 Mobile** | DictateButton + HEIC. We only tighten **server** file messages. Do not start iOS shell. |
| **7 Backend** | Co-own `limits` / `halo_events` / household meter. T3 is a joint promote. Luna prices. Duplicate `ask-route 2.ts` listed for delete, not for import. |
| **8 Library** | `isSaveRecipeCommand` early-return stays in `route.ts`. Extract quality is theirs. |
| **9 Native** | Freeze VocalLearn for Ask. No STT in `/api/chat`. |
| **10 Product** | Defend: no Teach-me intercept. Ask stays the front door. They write the one harvest line; we don’t put onboarding in the model. |
| **11 Ops** | T1/T2 can lab-deploy without Luna. T3/T5 are promote checklist items. Answer canned pack should sit next to `test:harvest` (they design CI; we supply prompts). Do not `vercel --prod` from this lane. |

---

## Do not do

- Teach-me intercept on send (no “I’ll quiz you” instead of answering).
- Model picker, search toggle, length slider, provider badge.
- Morph `--travel` 1080ms retune; harvest z-index 120; AskShell revive; Home seating / bead diameter / Paper.
- Edit `learn-mine.ts`, `ask-intent.ts`, `keep-memory.ts`, `HomeBubbles` play, `HarvestFlights`.
- Implement this wave. Edit `web/KEPT-BOARD.md`. Deploy. Promote. Family `/ask` changes.
- Describe lab 2000-char / daily-40 / Luna as what wife/parents hit today.
- Claim voice is fixed from Ask routing.
- Stripe, public signup, iOS wrapper, streaks.

---

## Files this lane would touch later (not now)

`web/src/app/api/chat/route.ts`  
`web/src/lib/ask-route.ts`  
`web/src/lib/ask-turn.ts`  
`web/src/lib/ask-stream.ts`  
`web/src/lib/ask-provider.ts`  
`web/src/lib/ask-guard.ts`  
`web/src/lib/grok.ts` (+ `grok-stream.ts` if T4 needs it)  
`web/src/lib/openai.ts`  
`web/src/lib/files.ts`  
`web/src/lib/live-lookups.ts`  
`web/src/lib/limits.ts` (with Lane 7)  
`web/src/lib/constants.ts` (search-prompt honesty)

Duplicate dead: `web/src/lib/ask-route 2.ts` (Lane 11).
