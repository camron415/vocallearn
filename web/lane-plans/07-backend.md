# Lane 7 — Backend / auth / data (plan only)

**Date:** 2026-09-06  
**Lane:** P7 Backend. Plan file only. No `web/src`, no migrations, no `KEPT-BOARD`, no deploy, no promote.

**Assumed surfaces**

| Surface | Caps / data | What family hits |
| --- | --- | --- |
| **Live early access** (`136d15f`, `/ask`) | Weekly **$1** + household **$30**. Compose **4000** chars. No daily-40, no burst, no inflight, no `ask_hold`, no Luna, lighter attach. | Wife/parents. Camron is ops. |
| **Working tree (lab, not promoted)** | Default compose **2000**, daily **40**, burst **8**/min, inflight **1**, file **6**/day, magic-byte attach, `claimAskTurn` + `ask_hold` reserve, Luna env-ready. | Camron `/preview` and local `/ask` only. |
| **Native VocalLearn** | Shares `ask_conversations` / `ask_messages`. Writes `proposed_facts`. **Does not drive Halo Keep.** | Separate product. |

Goal of this lane: a household product that can spread **without melting Camron’s Grok bill or leaking private Q&A**. Harvest precision and encoding are other lanes; we own the walls around them.

---

## Scores I disagree with

Head: Auth **7**, Persistence **7**, Cost/abuse **5 live**, Trust **7**, Business **2**, Testing **7**.

| Category | Head | Mine | Why (code, not vibe) |
| --- | ---: | ---: | --- |
| Auth / invites / admin | 7 | **7** | Invite tokens, `halo_claim_invite` trigger, member gate on `/api/chat` + `/api/keep`. Right shape. Gaps are lifecycle (no revoke) not the front door. |
| Persistence / Keep sync | 7 | **6** | Chats/recipes are real Postgres + RLS. Keep is one JSON blob, last-write-wins. Miner still upserts `halo_learn_cards` the Home loop never plays. Two decks is a persistence score, not only a code-health score. |
| Cost / abuse (live) | 5 | **4** | Weekly $1 + household $30 exist, but the household read is a full-row scan, `halo_events` INSERT is client-spoofable (`meta.costMicros`), and live has no daily/burst/inflight. A determined invited user burns the week in minutes. |
| Cost / abuse (lab tree) | “tighter” | **5** | Daily-40 / burst / reserve are written, but **`halo_events` has INSERT + SELECT only — no UPDATE policy.** `commitAskTurn` / `releaseAskTurn` cannot clear holds. Inflight-1 would stick ~3 minutes after every answer. Do not promote this as-is. |
| Trust / privacy | 7 | **7 family / 5 friends-wave** | Invite-only, no ads, RLS on Halo tables, admin-only $ in Settings. `halo_harvest_turns` stores full ask + reply forever; export script dumps them with service role. Fine for four relatives. Not fine for twenty friends. |
| Business / legal / scale | 2 | **2** | No Terms, no Privacy route, no Stripe, Camron-mints-every-invite. Honest. A privacy paragraph is the only 2→3 move this month. Stripe is not. |
| Testing / promote | 7 | **6 for this lane** | `test:harvest` includes `runAskGuardFixtures` — compose cap, file count, spoofed JPEG, Luna vs Grok **estimate**. No test that a hold releases, household SUM works, or RLS blocks a fake `$30` event. Ops discipline is 7; meter coverage is 4. |

I do **not** bump Auth down. Invite-only household is the correct product. I do **not** bump Trust for current family. I **do** refuse to describe lab guards as “score 7 waiting to promote.”

---

## Further split (1–10)

| Sub | Score | Evidence |
| --- | ---: | --- |
| Invite + member gate | 8 | `POST /api/invite` admin-only, 14-day token, `halo_reserve_invite` 3-min lock, claim trigger copies lane. Chat/Keep 403 if not in `halo_members`. Lab lane cannot be minted from the invite API (`lane !== "lab"`). |
| Member lifecycle / revoke | 4 | No remove-member, no disable-invite after mint (only used/expiry), no password-reset Halo UI. At 20 users Camron cannot uninvite. |
| RLS isolation (Halo tables) | 8 | `halo_keep_state`, `halo_recipes`, `ask_*`, `halo_learn_cards` are `auth.uid() = user_id`. Harvest turns: insert own, read own **or** admin. |
| Shared-project leak | 4 | Same Supabase as VocalLearn. `facts` SELECT is `true` for all authenticated. Native `proposed_facts` is per-user (unused by Keep). `/api/recipes` and `/api/chats` DELETE check auth, **not** `halo_members`. |
| Keep blob sync | 6 | `GET/PUT /api/keep`, parse + `KEEP_CAP` 30, last-updated wins. Phone vs desktop concurrent rounds lose. No per-chip merge. Fine at 1 row/user; weak as a facts database. |
| Dual decks (`halo_learn_cards` vs Keep JSON) | 3 | Miner `insert` into `halo_learn_cards` every harvest (`learn-mine.ts`). Unique `(user_id, prompt)`. `/api/learn` still serves last 12. Home/Keep ignore it. Native `proposed_facts` is a **third** unused queue. |
| Live money brakes | 4 | $1/wk + $30/30d. No daily, no burst. `usageSnapshot` / `gateAskTurn` load **all** `ask`+`ask_hold` rows then reduce in JS. Household query uses service role **if** `SUPABASE_SERVICE_ROLE_KEY` is set; otherwise falls back to the user client and **undercounts** the house. |
| Lab reserve / burst | 4 | Logic in `ask-guard.ts` is the right shape. RLS UPDATE hole + check-then-insert race + `prepareAskTurn` gating with a **Luna** estimate before `claimAskTurn` uses the real provider. |
| Harvest telemetry PII | 4 | Full `user_text` (4k) + `reply_text` (12k) + `cards` + `miner_raw` (8k). No retention. `scripts/harvest-export.mjs` writes JSON/MD under `web/reports/`. |
| Vendor / attach PII | 5 | Images as data-URLs to Grok. PDFs uploaded to xAI Files (`uploadXaiFile`) with no delete. Geo is IANA + city/region/country — **not** raw IP (`016_halo_geo.sql`). |
| Admin tools | 6 | Settings invites + $ (admin). `/admin` lists members and 7-day event **counts**, not harvest text. Ops is still Camron. |
| Meter tests | 4 | Fixtures only. Promoting guards without a “second send 429, third send after done 200” smoke is how family gets a 3-minute lockout. |

---

## What wife/parents actually hit (live)

1. Sign in with invite account. Session cookies via `POST /api/auth/login` (Safari-safe). No public signup on Halo.
2. Ask streams on Grok. Spend is recorded as `halo_events.kind = 'ask'` **after** the call (live). They can send until **$1/week** or the **household $30** copy: “Ask Camron if you need more.”
3. They do **not** see dollar amounts unless admin (`/api/profile` `showCost: false` for members).
4. Keep beads sync phone ↔ desktop if migration 015 ran. Last writer wins. Silent drop at 30 in-progress (Keep lane owns the feel; we own the blob).
5. Chats and recipes persist. Deleting a chat does **not** delete `halo_harvest_turns` (FK `ON DELETE SET NULL` on conversation) or Keep chips.
6. They never see `halo_learn_cards` or `proposed_facts`. Those tables still grow in the background.

Working-tree-only (do not describe as live): 2000-char compose, 40/day, “Already answering,” magic-byte file reject, Luna.

---

## What breaks at 20 users (vs ~4)

Not Postgres row count. The product shape.

**Cost**

- **Household $30 is the real ceiling.** 20 × $1/week ≈ $80/month if the per-user cap were the only brake. Rolling 30-day house cap trips in week 2 if people actually use Halo. Then **everyone** is locked and Camron is the refund desk.
- **No daily fairness on live.** One scripted account dumps 4000-char Grok turns until $1 is gone in minutes. At 4 relatives that’s rude. At 20 friends it’s the default abuse.
- **Meter does not scale.** Every Ask loads ~30 days of household `halo_events` into the serverless function and sums in JS (`loadAskRows` with `userId` omitted). 20 users × 40/day × 30d = **24k rows per request** if lab daily-40 is promoted and people max it. That is the first infra break, before Grok.
- **Check-then-insert is not atomic.** Twenty concurrent first-asks of the month can overshoot $30 by one estimate each (~cents, not dollars) unless hold+gate move into SQL.
- **Spoof:** any member JWT can `INSERT` `halo_events` with `meta.costMicros` huge (`Users insert own halo events`). One spiteful or leaked session **zeros the household** for 30 days. Trust-the-family at 4. Hostage at 20.

**Trust**

- `halo_harvest_turns` becomes a **Camron-held archive of 20 people’s full Q&A**. Admin SELECT policy + export script. No retention, no privacy page. This is the leak that stops “spread” even if money holds.
- PDF/images still go to xAI. Twenty households of photos is a different promise than four.

**Ops**

- Every account is a Camron invite. 14-day links, no bulk, no revoke. Doable at 20 if slow. Miserable, not a software crash.
- Admin page loads all members + 7-day events. Fine at 20. Still no “disable this person.”

**Persistence**

- Keep remains 20 blobs. Load is fine. **Conflict rate** rises (phone + laptop). Lost `finishRound` is a support bug, not a 500.
- `halo_learn_cards` unbounded second copy × 20. Unique on prompt, not on Keep id. Bead inspect (Lane 5) cannot query this table and be right.

**What does *not* break at 20**

- RLS on Keep/chats/recipes (each user still only sees self).
- Invite claim race (`halo_reserve_invite`).
- 16 Home seats / 30 Keep (product caps, not backend).
- Native `proposed_facts` (still unused).

---

## Promote path for lab guards (Lane 1 + 7 + 11)

Do **not** promote `ask-guard` / daily-40 / burst / inflight / 2000-char / magic-bytes until this order is true. Luna is a cost win **after** the walls work; it is Lane 1’s flag, not a substitute.

### Blockers (must ship in an implement wave, after chief says go)

1. **`halo_events` write model**
   - Add RLS: user may **UPDATE own** row only when `kind = 'ask_hold'` (release/commit), **or** move `commitAskTurn` / `releaseAskTurn` to **service role**.
   - Prefer: **server-only cost**. Trigger or policy so clients cannot set `costMicros` on INSERT; only the Ask route (service) writes `ask` / `ask_hold`.
   - Human test: send → stream completes → send again immediately → **200**, not 429 “Already answering” for 3 minutes.

2. **Service role on production**
   - `SUPABASE_SERVICE_ROLE_KEY` must be present on Vercel. If missing, household cap is a lie (`createServiceClient()` returns `null`, household query uses the caller’s RLS).
   - Human test: two accounts; one burns; the other hits household copy without the first account being admin.

3. **SQL aggregate, not row dump**
   - `spendSince` / `gateAskTurn` should `SUM` (and count) in Postgres with `kind IN ('ask','ask_hold')` + stale-hold filter. Do not pull thousands of `meta` blobs per Ask.
   - This is the 20-user ticket even if we stay at 4.

4. **Env on early access (after 1–3, when Camron says promote)**
   - `HALO_ASK_MESSAGE_MAX_CHARS=2000` (or keep 4000 if Lane 1/10 insist — default in tree is 2000; live is 4000).
   - `HALO_DAILY_MESSAGE_CAP=40`
   - `HALO_ASK_BURST_PER_MIN=8`
   - `HALO_ASK_MAX_INFLIGHT=1`
   - `HALO_ASK_DAILY_FILES=6`
   - Leave `HALO_USER_BUDGET_PERIOD` **week** until a real free tier. Do not flip month as a surprise.
   - `HALO_USE_LUNA` is **not** part of the guard promote. Separate Camron call (Lane 1).

5. **Fix the double gate**
   - `prepareAskTurn` currently `gateAskTurn`s with `provider: attachments ? grok : luna` **and inserts the user row** before `/api/chat` `claimAskTurn`s with the real provider. Near-cap users get an orphan bubble and a 429. Claim once, after route/provider is known; `prepareOnly` must not spend a message without a hold.

6. **Smoke (Lane 11)**
   - Lab: 41st send → 429 today copy.
   - 9 sends in one minute → 429 slow-down.
   - Overlapping send → inflight copy, then success.
   - Spoofed JPEG → 400 (magic bytes).
   - Safari iPhone + desktop Chrome on `/ask` (not only `/preview`).
   - **Family `/ask` stays frozen until Camron says promote.**

### Not blockers for guard promote

- Relational Keep.
- Killing `halo_learn_cards` (park writes; don’t migrate).
- Stripe, public signup, Privacy **page** (Privacy **copy** should exist before friends-wave, not before daily-40).
- HarvestLock / intent (Lane 2/4). Guards do not wait on miner quality.

---

## PII of `halo_harvest_turns`

**What is stored** (migration 014 + `harvest-log.ts`): `user_id`, optional `conversation_id`, **full ask** (trim 4000), **full reply** (trim 12000), skip flag/reason, `card_count`, `kinds[]`, **cards JSON** (prompt/answer/span/token), **miner_raw** (trim 8000), `policy_version`, `created_at`.

**Who can read:** the user (own rows) and **any `halo_is_admin()`**. Insert is own-user only. There is **no DELETE policy** for users; deleting a chat does not delete the turn.

**Who else has a copy**

- Camron laptop: `npm run harvest:export` (service role) → `web/reports/harvest-turns-*.json` and `harvest-turns-latest.md` (full Ask text in the markdown).
- xAI (live answers + attachments). OpenAI too if Luna is promoted.

**Family vs friends**

- Family: acceptable as Camron’s tuning log **if** it stays admin-only and is not committed. Working tree currently has untracked/local dumps — Lane 11 should keep reports out of git.
- Friends-wave / 20 users: **not acceptable** as an unbounded full-transcript table. Plan (implement later, chief go):
  - Lab/admin accounts: keep full text (miner debugging).
  - `family` / `tester` lanes: store skip, kinds, card_count, hashes or 200-char ask preview — **not** reply body — after N days, or never store reply for those lanes.
  - Retention job: 30 days full → redacted, or delete. Cascade on account delete already exists (`ON DELETE CASCADE` from profiles).
  - Export stays **local + service role**, never an HTTP admin dump of replies.

`ask_messages` is also full Q&A (needed for chat). That is the product. Harvest turns are the **extra** copy for Camron. That extra copy is the trust problem.

Geo (`profiles.timezone`, city/region/country) is coarse and documented as no-IP. Keep it.

---

## Duplicate `* 2.ts` — runtime risk (list, do not delete)

Finder-duplicate leftovers. **Nothing imports them** (grep: zero `@/lib/… 2` specifiers). They are **not** App Router routes.

| File | Risk now | Risk if someone autocompletes it |
| --- | --- | --- |
| `web/src/lib/ask-route 2.ts` | Typecheck only (`tsconfig` `**/*.ts`) | Stale regex route without intent/Luna path. |
| `web/src/lib/keep-cloud 2.ts` | Typecheck only | **Highest:** a second Keep sync client. Phone/desktop fork. |
| `web/src/lib/keep-land 2.ts` | Typecheck only | Harvest land-box math drift. |
| `web/src/lib/coarse-pointer 2.ts` | Typecheck only | Mobile breakpoint drift. |
| `web/src/lib/harvest-lab-presets 2.ts` | Typecheck only | Lab mixer presets diverge. |
| `web/src/lib/harvest-capture-fs 2.ts` | Typecheck only | Capture sink path drift (`/api/dev/capture` uses the non-2 file). |
| `web/src/lib/harvest-score 2.ts` | Typecheck only | Capture scorecard only. |
| `web/scripts/dev-lan 2.mjs` | Unused (`package.json` → `dev-lan.mjs`) | LAN preview script confusion. |

**Not runtime today.** They **can** fail `next build` if a duplicate has a type error, and they **will** bite if an implementer imports the spaced filename. Lane 11 owns delete-in-a-cleanup-PR after chief go. **This lane will not delete them.** Inbox `* 2.md` files are docs clutter only.

---

## Dual decks and native `proposed_facts`

```
Ask reply
  ├─ mineLearnFromTurn → INSERT halo_learn_cards     (zombie deck; /api/learn)
  ├─ logHarvestTurn    → INSERT halo_harvest_turns   (Camron telemetry)
  ├─ chips in SSE      → client Keep JSON            (the real loop)
  │                       localStorage halo-keep-v2
  │                       debounce PUT halo_keep_state
  └─ native (other app) → proposed_facts             (unused by Keep)
```

**Recommendation (no migration until chief):** stop writing `halo_learn_cards` from the Halo miner **or** write only when a lab flag is on. Do not merge Keep JSON into `halo_learn_cards` this month. Do not port `proposed_facts` into Keep. Relational facts are a later Keep-lane project (bead inspect can read the blob + a GET-by-id on the same payload). `/api/learn` + LearnReview remain a zombie; Lane 4/11 hide or delete — we do not expand it.

---

## Auth / invite notes (keep)

- Rings match Settings: Lab (admin account), Early access (`tester` invite), Family (`family` invite). One URL.
- `halo_peek_invite` / `halo_reserve_invite` are `SECURITY DEFINER` for **anon**. Token is the secret; treat links like passwords.
- Native `app/auth/register.tsx` can create a Supabase user **without** `halo_members`. They cannot call `/api/chat`. They can still hit `/api/recipes` and chat DELETE. Low today; close the member check when we touch those routes.
- No Terms/Privacy routes exist under `web/src`.

---

## Improvements by score (now / later / never)

| Area | Now (after chief go) | Later | Never this season |
| --- | --- | --- | --- |
| Cost 4 | Event UPDATE or service-role commit; SQL SUM; promote daily-40 + burst + inflight with env | Luna after Lane 1 smoke; optional month period | Stripe, per-token UI, model picker |
| Persistence 6 | Stop or flag miner → `halo_learn_cards`; Keep API stays blob | If bead inspect needs query: `chips` JSON path or child table **after** loop is trusted | Rewriting Keep as Anki rows before encoding ships |
| Trust 7/5 | Retention/redaction plan for harvest_turns; don’t commit exports | Privacy page before non-family invites; xAI file delete | Ads, public social graph, logging IP |
| Auth 7 | Member check on recipes/chats when touched | Revoke member + expire invite | Public signup, OAuth sprawl |
| Business 2 | One privacy paragraph (Lane 10 copy) | Domain/legal when 10 people return uncoached | 1.5 “~100 accounts,” Stripe |
| Testing 6 | Guard smoke: release, household, spoofed event rejected | Play-round tests are Lane 4 | Full e2e suite as a gate on family `/ask` |

---

## How this lane lets the product spread

Spread is “a second household can Ask without Camron watching the bill or reading their chats.”

1. **Money:** daily-40 + burst + inflight + honest household SUM, after the hold actually releases. Weekly $1 stays. Luna later stretches the same $30.
2. **Privacy:** harvest telemetry stops being a second inbox of everyone’s Q&A. Chat stays private by RLS. Admin sees counts, not diaries, except lab.
3. **Identity of data:** one deck (Keep JSON) until we have a reason to query facts. Dual write is how we will ship the wrong inspect API.
4. **Ops:** invite-only until three uncoached family rounds (head planner). Backend does not invent self-serve to hit a headcount.

---

## Top 5 implementation tickets

Success tests are things a human can fail. **No code until chief converges and Camron says go.** Files listed are the ones this lane would touch later.

### T7.1 — Make `ask_hold` real (blocker for any guard promote)

- **Files:** new migration (planned only), `ask-guard.ts`, maybe `supabase/admin.ts`.
- **Do:** RLS UPDATE for own holds **or** service-role commit/release; stop trusting client `costMicros`.
- **Pass:** two rapid Asks from one account — first streams, second waits or 429 inflight, **third succeeds immediately after done**. Hold row `released: true` in DB.
- **Fail:** second Ask blocked ~3 minutes after a finished reply (current tree).

### T7.2 — Meter that survives 20 users

- **Files:** `ask-guard.ts`, `usage.ts`; migration only if a SQL function is cleaner.
- **Do:** Postgres SUM/count for user 7d/1d/1m and household 30d. Fail closed (503) if service role missing on household read.
- **Pass:** household 429 with two users; Vercel logs do not show megabyte event payloads per Ask.
- **Fail:** `loadAskRows` still returns every `meta` blob.

### T7.3 — Promote lab guards with Lane 1 (after T7.1–7.2, Camron **promote**)

- **Files:** `limits.ts` env already exists; `files.ts` magic bytes already in tree; `ask-turn.ts` single claim; Vercel env.
- **Do:** daily 40 / burst 8 / inflight 1 / 6 files / compose cap as agreed with Lane 1. Fix prepare-then-claim orphan message.
- **Pass:** family copy on 41st send; spoofed JPEG 400; Safari + Chrome.
- **Fail:** live still 4000-char uncapped-day after a “promote guards” deploy; or inflight lockout from T7.1 unfinished.

### T7.4 — Harvest-turn PII diet (before friends, not before family daily-40)

- **Files:** `harvest-log.ts` (Lane 2 coordinate), planned retention; `HARVEST-OPS.md` note via Lane 11.
- **Do:** lane-aware logging (full text lab-only); 30-day redaction plan; export gitignored.
- **Pass:** family/tester insert has no 12k reply (or it expires); `harvest:export` still useful for skip/kinds.
- **Fail:** another committed JSON of raw Q&A.

### T7.5 — One deck: Keep JSON is source of truth

- **Files:** `learn-mine.ts` write path (Lane 2 owns miner prompts; we own the **table write**), `/api/learn` freeze with 4/11.
- **Do:** stop upserting `halo_learn_cards` from Halo harvest (flag or delete-write). Leave table in place. No `proposed_facts` bridge. Keep `PUT /api/keep` as-is (Lane 3 merge/conflict is theirs; we do not redesign the blob this wave).
- **Pass:** new harvest → row in Keep state, **no new** `halo_learn_cards` row (or only if `HALO_WRITE_LEARN_CARDS=1`).
- **Fail:** bead inspect (Lane 5) built against `halo_learn_cards` while Home plays Keep JSON.

**Invite/admin** (if a 6th ticket is needed later): member gate on `/api/recipes` + `/api/chats`; expire/revoke invite. Not top-5 for spread.

---

## Handoffs

| To | What |
| --- | --- |
| **Lane 1 Ask** | Shared files: `limits.ts`, `usage.ts`, `ask-guard.ts`, `files.ts`, `ask-turn.ts` claim-once. They own Luna/routing; we own meter/RLS. Compose 2000 vs 4000 is a joint product call. |
| **Lane 2 Harvest** | `harvest-log.ts` PII. We do not touch miner prompts. They must not add more transcript fields. |
| **Lane 3 Keep** | `/api/keep` last-write-wins. Relational chips only if they ask after inspect. Dual-deck freeze is joint (they own JSON; we own stopping `halo_learn_cards`). |
| **Lane 4 Review** | Do not use `/api/learn` for V2 play. Zombie path. |
| **Lane 5 UI** | Bead inspect reads Keep payload, not `halo_learn_cards`. |
| **Lane 8 Library** | Recipes RLS is fine; add member gate when that route is touched. |
| **Lane 9 Native** | `proposed_facts` stays native. Shared `ask_conversations` is enough. Do not sync Keep. |
| **Lane 10 Product** | Privacy paragraph; no Stripe. Household $30 copy already exists. |
| **Lane 11 Ops** | Promote checklist = T7.1–7.3. Duplicate `* 2.ts` delete is theirs. `test:harvest` should gain a meter fixture when we implement. Do not `deploy:early` from this plan. |

---

## Do not do

- Implement, migrate, deploy, or promote in this chat.
- Edit `web/src`, `app/`, `supabase/`, family `/ask`, or `web/KEPT-BOARD.md`.
- Delete `* 2.ts` files now.
- Stripe, public signup, OAuth, iOS shell, Teach-me intercept.
- Merge Keep JSON into `halo_learn_cards` or `proposed_facts`.
- Own miner prompts or play GUI (`HomeBubbles`, HarvestLock).
- Retune harvest z-index 120 or morph 1080ms.
- Flip `HALO_USER_BUDGET_PERIOD=month` as a silent prod change.
- Describe working-tree daily-40 as live.
- Promote lab guards before `halo_events` UPDATE/service-role commit is real.

---

## Files this lane would touch later (not now)

`web/src/lib/limits.ts`, `usage.ts`, `ask-guard.ts`, `files.ts`, `ask-turn.ts` (with Lane 1), `harvest-log.ts` (with Lane 2), `web/src/app/api/keep/route.ts`, `web/src/app/api/invite/route.ts`, `web/src/app/api/chat/route.ts` (member gate already; claim path), `web/src/lib/supabase/admin.ts`, `web/src/app/api/recipes/route.ts` / `chats/route.ts` (member gate), **planned** migrations after chief go (`halo_events` UPDATE / cost trigger; optional spend RPC; optional harvest_turns retention).  

**Not ours:** `learn-mine.ts` prompts, `HomeBubbles`, `HarvestFlights`, `AskShell`.
