# Lane 11 — Ops / QA / telemetry / promote (plan only)

**Date:** 2026-09-06  
**Holder:** Ops / QA / promote team lead (this chat)  
**Mode:** Plan. No `web/src` edits. No `web/KEPT-BOARD.md`. No deploy. No `vercel --prod`. No promote. Duplicate `* 2.ts` listed for later delete — **not deleted this turn**.  
**Frozen:** harvest z-index **120**, morph `--travel` **1080ms**, Paper, seating, beads, AskShell parked, family `/ask` frozen.

**Job:** family never gets a half-baked experiment; lab can still move. “Done” is a promote packet, not a green `test:harvest`.

---

## Live vs lab (do not mix)

| Surface | What ops actually is |
| --- | --- |
| **Early access production** | `halo-web@1.1.2` commit **`136d15f`** at https://halo-gules-three.vercel.app. Rings 2 and 3 share this URL (Early access vs Family is **invite type**, not a third host). Grok-only, 4000-char, weekly **$1** + household **$30**. No daily-40, no burst, no Luna, no intent classify, no HarvestLock, no `ChromeMenu`. |
| **Working tree (this repo)** | Intent classify + miner INTENT, Luna routing, HarvestLock, `ask_hold`, 2000-char / 40-day / burst 8, `ChromeMenu`, parked AskShell, Finder `* 2.ts` clutter. **One `npm run deploy:early` ships all of it.** |
| **Lab** | `npm run deploy:lab` → Vercel **preview** URL. Camron only. `/preview` mixer is not the family product. |
| **CI** | `.github/workflows/test-harvest.yml` runs **`npm run test:harvest` only** (`tsx src/lib/v2-lib-check.ts`). No `build`. No live miner. No family review spend. |
| **HARVEST-OPS.md** | Canonical promote trail, but **stale in places**: still says fixture suites **3/3** (tree now has **9** suites), still says Keep is localStorage-only (cloud `halo_keep_state` shipped). |

**Trap:** `.env.example` lists `HALO_USE_LUNA=1` and `HALO_DAILY_MESSAGE_CAP=40`. Production `136d15f` does not run that tree. Promoting the working tree **without sliced env** would flip Luna (`lunaEnabled()` is true whenever `OPENAI_API_KEY` is set **and** `HALO_USE_LUNA !== "0"` — unset counts as on), tighten compose to 2000, and enforce daily-40. That is not “intent harvest shipped.” That is a bundle.

---

## Head scores — agree / disagree

| # | Category | Head | This lane | Why |
| --- | ---: | ---: | ---: | --- |
| **28 Testing / promote** | 7 | **6 process-vs-coverage split: discipline 8, coverage 5 → blend 6** | Ring fence, “Camron says promote,” KEPT-BOARD, harvest fixtures, and `deploy:lab` vs `deploy:early` are unusually adult. The **7 overclaims** what the gate actually proves: CI is harvest units only; live dump ≠ canned 8/8; no play / HarvestLock / morph tests; HARVEST-OPS is behind the tree. Family is protected by Camron, not by CI. |
| **24 Code health** | 4 | **Agree 4** (ops slice would be **3** if we scored “one command to prod”) | Finder `* 2.ts` (stale `ask-route 2.ts` missing `request-geo`), zombie `LearnReview` still mounted, dual `halo_learn_cards` vs Keep JSON, parked AskShell, uncommitted lab sitting next to `--prod` scripts. Discipline is high; the tree is a war room. |
| **19 Cost / abuse** | **5 live** (old Lane 11 brief said 7 — **use 5**) | **Agree 5 live / 7 lab-if-promoted-as-a-packet** | Live is weekly $1 + household $30. No daily-40, burst, inflight, or reserve. Lab `ask-guard` is real and **not** what family hits. Do not score lab brakes as live. |
| **26 Business / legal / scale** | 2 | **Agree 2** | Invite-only household, no Terms/Privacy live, no Stripe, no domain lock. Ops cannot raise this with a checklist. Honest bar: three uncoached family rounds, then legal page before friends-wave. |

**Disagree with the stale HEAD-PLANNER Lane 11 brief that listed Cost 7.** Head addendum already corrected to **5 live**. This plan uses 5.

**Disagree with treating canned family 8/8 or dry smoke 9/9 as promote-ready.** Those are necessary fixtures. Live `halo_harvest_turns` (50 rows, 2026-09-04, **pre-intent**) is the honest family set: 15 harvested / 28 chips, 23 `policy_skip`, 12 zero-card non-skips, socks in the dump.

---

## Further split (ops sub-scores, 1–10)

| Sub | Live | Lab tree | Notes |
| --- | ---: | ---: | --- |
| **Promote discipline / ring fence** | 8 | 8 | Three rings, `deploy:lab` default, `--prod` requires Camron magic words. This is the asset. Keep it. |
| **Fixture coverage (harvest)** | 7 | 8 | `v2-lib-check` now 9 suites: intent fallback, provider, guard, family skip/harvest, learn-mine, client dedup, open-score, local-day, save-offer. Strong for miner/policy. |
| **Live-traffic harvest QA** | 4 | 5 | Export exists; last dump is pre-intent. Canned 8/8 uses `fallbackAskIntent`, not live `classifyAskIntent`. No post-lab-deploy re-export gate. |
| **Non-harvest tests (play / lock / morph)** | 2 | 2 | No `HomeBubbles` unit tests, no HarvestLock fixtures, no morph tests. CI will not catch a play-math or lock-in skip regression. |
| **Duplicate / dead-file hygiene** | 3 | 3 | Seven `web/src/lib/* 2.ts`, `web/scripts/dev-lan 2.mjs`, inbox `* 2.md`. None imported (good). `tsconfig` `include: **/*.ts` still typechecks them. `ask-route 2.ts` is stale. |
| **Env / kill-switch hygiene** | 4 | 5 | Luna on if key present and flag ≠ `0`. `.env.example` defaults Luna on. Production env packet not written down next to HARVEST-OPS. |
| **Telemetry operability** | 6 | 6 | `halo_harvest_turns` + admin SQL + `harvest:export` work. Intent fields not stored. PII is full Q&A (Lane 7). Wipe-before-family is documented. |
| **Docs freshness (ops manuals)** | 4 | 4 | HARVEST-OPS still 3/3 suites and localStorage Keep. ROADMAP-VERSIONS still calendars 1.3–1.6 as this month’s work. Ship-checklist requires board edits that this plan-wave **forbids**. |

---

## What wife / parents actually hit (ops, not features)

**On live `/ask` today**

- They are on **production**, not this working tree. Hard-refresh Safari after any real promote.
- Cost brake they can feel: weekly $1 copy in Settings, then stop. They cannot hit daily-40 because it is not live.
- Harvest they get is **pre-intent**. Socks-as-a-chip already happened in Camron’s dump. Capitals sometimes harvest nothing.
- Header is still separate History / Library / Settings icons (1.1.2-mobile). Beads compete for width. No hamburger.
- No in-chat SEE/SAY before fly. First retrieval is **tomorrow**.
- Ops they never see: CI, KEPT-BOARD, `/preview`, Lab QA buttons (admin + localhost/LAN only).

**If someone ran `deploy:early` from this tree tomorrow without a packet**

Family would suddenly get: Luna on shallow chat (if `OPENAI_API_KEY` is on Vercel), 2000-char cap, daily 40, burst/inflight, HarvestLock (Skip and Done both fly today), hamburger, intent classify latency before stream. That is several product changes in one blast. **This is the half-baked-experiment failure mode.** Lab preview is the correct place for that mix.

---

## CI vs ship-checklist vs HARVEST-OPS (honesty)

| Gate | What it runs | What it proves | What it does not |
| --- | --- | --- | --- |
| **GitHub `test-harvest.yml`** | `npm run test:harvest` | Fallback intent, skip vs harvest on **canned** family rows, miner JSON validation, Luna routing **with env stub**, ask-guard numbers, open-score, local-day, save-offer detect | Live Grok classify/miner, answer truth, HarvestLock UX, play miss math, morph, Safari, env on Vercel |
| **Ship checklist (repo rule)** | `test:harvest` **and** `build`, desktop Chrome smoke, phone if layout/auth, KEPT-BOARD log | Local green + a human looked | Production env, wife account, live harvest quality |
| **HARVEST-OPS “before promote, run all three”** | `test:harvest`, `test:harvest:live:dry`, `test:harvest:live` | Dry 9/9 gates; live Nile+Rome **when key present** | Intent classify quality; socks on **real** photos; HarvestLock |
| **`test:harvest:family`** | Canned replies + **live Grok miner** (no Luna spend) | 8/8 on the pack (2026-09-06) | Classifier (uses fallback in the CI sibling); live user questions |
| **`harvest:export`** | Last 50 `halo_harvest_turns` | What actually chipped | Only as fresh as the last run (currently 2026-09-04, pre-intent) |

**CI stays `test:harvest` only.** Do not put live Grok miner in GitHub (spend + flaky + key in CI). Do not pretend CI is the promote gate.

**HARVEST-OPS refresh (later, docs):** suite count 9; Keep cloud; four promote packets below; live-vs-fixture section; Vercel env kill switches.

---

## What “done” means (four lab features)

A feature is **lab-done** when Camron can use it on `deploy:lab` without apology. It is **promote-done** only when its **packet** below is checked and Camron says **promote**. Shipping two packets in one `--prod` is allowed **only if both packets are checked**; hitchhikers are not.

### 1. Intent harvest — promote-done

**Lab-done today:** classify → INTENT miner → capital fallback; fixtures include socks skip + Utah/Maine; family canned miner 8/8; dry smoke 9/9.

**Not promote-done until:**

1. `npm run test:harvest` green (9/9 suites).
2. `test:harvest:live:dry` 9/9 and `test:harvest:live` Nile + Rome (HARVEST-OPS).
3. `test:harvest:family` 8/8 on current pack (miner, canned answers).
4. **Live traffic, not fixtures:** `deploy:lab`, Camron asks real questions including: weather (skip), capital (must chip), socks/photo or practical (skip), one how/why, one “should not be a curriculum dump.” Then `harvest:export`. Pass bar (from INTENT-HARVEST-1.2, ops-owned): **≥80% of closed primary asks get the primary chip**; **0** socks/practical chips; weather still skip; capital miss rate below the pre-intent dump (12 empty non-skips is the baseline to beat).
5. Lane 2 ship-blockers they already named must be closed or explicitly waived by Camron: `cardMatchesIntent` missing; intent-true **bypassing** `shouldSkipHarvest`; classify latency felt on send; telemetry does not store intent.
6. Hitchhikers **off** unless their packets are also done: `HALO_USE_LUNA=0` on the **production** env even if the code contains Luna; do not rely on “key missing.”
7. Manual QA (HARVEST-OPS + cove-rollout): Chrome desktop, Safari desktop, Safari iPhone on the **lab URL**. Harvest lands Keep not Home. z-index 120 untouched.
8. Camron says **promote**. Then `deploy:early`. Then KEPT-BOARD log (chief). Wife hard-refresh. Optional Atlas `session_close`.

**Kill switch if live quality regresses after promote:** revert the commit (not a flag today). Adding `HALO_INTENT_HARVEST=0` is a Lane 2 ticket, not a silent ops invent — recommend it before first promote so we are not stuck with revert-only.

### 2. HarvestLock — promote-done

**Lab-done today:** `HarvestLock` in `ChatThread`; SEE then SAY (open gist first, then closed); Skip and Done **both** call `releaseLock` → fly still happens. No fixture suite.

**Not promote-done until:**

1. Lane 4 recommendation is **promote as-is**, not redesign / “try it now” chip. Ops does not override that product call.
2. Human QA on lab URL + iPhone: lock appears after harvestable turn; Skip still flies to Keep; Done flies; reduced-motion still does not invent a second harvest language; z-index 120 untouched; morph 1080 untouched.
3. At least one fixture in `test:harvest` for lock **order** (open then closed) and “skip still releases” — coverage hole today. Lane 4 owns the test; this lane refuses promote without it.
4. First-session copy (Lane 10/5) exists or Camron waives: otherwise lock-in is another unexplained ritual (encoding 4 stays 4).
5. Hitchhikers off (Luna/caps) unless packed.
6. Camron + one family member complete lock-in **uncoached** on lab (or Camron stands over and still says ship). Head planner’s “three uncoached rounds” is the **Home play** bar; lock-in needs **one** uncoached pass before early access.
7. Camron says **promote**.

**Do not** promote lock-in because encoding scored 4. That is the reason to *try* it on lab, not to dump it on parents.

### 3. Luna — promote-done

**Lab-done today:** `pickAnswerProvider` + `lunaEnabled()`; fixtures in `ask-provider-check`; miner/classify stay Grok none. Board: **rotate the OpenAI key** (it was pasted in chat).

**Not promote-done until:**

1. Production Vercel env packet written and applied: `HALO_USE_LUNA=1` **only** when this packet ships; until then production **`HALO_USE_LUNA=0`**. Lab preview may keep `1`.
2. Key rotated; not in git; not in transcripts going to Atlas dumps if avoidable.
3. Lab smoke: same ask on Luna vs Grok for shallow chat + one file turn (must stay Grok) + one depth (must stay Grok). Camron judges answer quality — **there is no answer-truth harness**.
4. Cost: weekly $1 still binds; confirm Luna reserve path (`ask_hold`) on lab. Do not flip `HALO_USER_BUDGET_PERIOD=month` in the same promote.
5. Intent harvest packet **already live or shipping in the same promote**. Luna without better harvest saves money on junk answers that still chip badly. Head order: harvest precision **then** Luna.
6. `.env.example` should not teach production to default Luna on until this packet (docs ticket).
7. Camron says **promote**.

**Rollback:** set `HALO_USE_LUNA=0` on Vercel (this kill switch **already exists**). Fastest of the four.

### 4. ChromeMenu — promote-done

**Lab-done today:** hamburger in `HaloHeader`; History / Library / Settings behind Menu. Not on `136d15f`.

**Not promote-done until:**

1. Lane 6 signs the Safari gate: Keep beads readable; Menu opens History/Library/Settings; save-recipe flyer still has a Library target (`data-saves-pocket` is on the wrap — verify flyer after hamburger).
2. Cove-rollout matrix: Safari iPhone, Chrome desktop, Safari desktop. Desktop must not feel like “we hid the three buttons for no reason” unless Lane 5/6 want hamburger everywhere.
3. No iOS shell. No AskShell revive.
4. Hitchhikers off.
5. Camron says **promote**.

ChromeMenu is the **safest** of the four (chrome-only) but it still must not ride along with Luna/intent/lock unless those packets are ready.

---

## Master promote checklist (every `--prod`)

Print this. Do not run `deploy:early` until every line is true.

- [ ] Camron said **promote** / **early access** / **production** / **emergency** (cove-rollout). Not implied by “looks good on lab.”
- [ ] Packet list named: which of {intent, lock-in, Luna, hamburger, guards/caps} are **in** this ship. Everything else env-killed or not in the commit.
- [ ] `cd web && npm run test:harvest` green.
- [ ] `npm run build` green (ship-checklist; **not** in GitHub today).
- [ ] `test:harvest:live:dry` 9/9. Live miner if harvest code changed.
- [ ] Desktop Chrome on the changed paths.
- [ ] If auth, routing, header, harvest fly, or mobile layout: Safari iPhone on **`deploy:lab` URL** (LAN optional; lab URL preferred).
- [ ] Safari desktop + `/preview` Home/Chat/Login/Invite (cove-rollout). `/preview` mixer still hidden on production.
- [ ] Production env: `NEXT_PUBLIC_APP_LANE=family`; `HALO_USE_LUNA=0` unless Luna packet; compose/daily caps **intentionally** either live-legacy (4000, no daily-40) or lab-tight — written down, not accidental.
- [ ] Wife/parents: hard refresh after READY. No in-app tour (HARVEST-OPS: tell them in person/text).
- [ ] Chief updates KEPT-BOARD (implementation wave: chief-only). Optional Atlas dump.
- [ ] **Never** `npx vercel deploy --prod` from a dirty tree that still contains parked AskShell “just to try.” AskShell stays lab `/preview`.

Emergency hotfix (TZ, 500s, empty Home): same magic word **emergency**, smallest diff, still `test:harvest` + build unless Camron explicitly accepts skip.

---

## Fixture vs live traffic

```text
Fixtures (CI)     →  “the gates we wrote still hold”
Canned family     →  “miner + fallback intent agree with Camron’s 8 stories”
Live miner smoke  →  “Grok miner still chips Nile/Rome”
halo_harvest_turns→  “what family (or Camron-as-family) actually got”
```

**Promote harvest on the last line, not the first three.**

| Signal | Use for | Cadence |
| --- | --- | --- |
| `test:harvest` | PR / CI / every ship | Every push to `web/**` |
| Family pack dry (inside `test:harvest`) | Skip vs harvest regression | Same |
| `test:harvest:family` | Miner quality on canned replies | Before any harvest promote; not CI |
| `test:harvest:live` | Nile/Rome spend | Before harvest promote |
| `harvest:export` after **lab** week | Socks/capital/tangent/empty-nonskip rates | Before intent promote; again 3–7 days after |
| Wife “would I want this chip?” | Trust | After lab URL, before `--prod` |

**Do not** grow CI with live API. **Do** add HarvestLock / `finishRound` fixtures to `v2-lib-check` (still no network).

**Stale dump rule:** a 2026-09-04 export cannot bless a 2026-09-06 intent tree. Re-export on the lab URL that actually runs classify.

---

## Duplicate-file cleanup plan (do not execute this wave)

Finder copies. **No importer uses the spaced name** (grep clean). Runtime today is the unsuffixed file. Risk is typecheck drift + an agent editing the wrong path.

### Inventory (delete later, after chief go)

| Path | vs canonical | Risk |
| --- | --- | --- |
| `web/src/lib/ask-route 2.ts` | **Stale** — missing `request-geo` / `localeLine` | Highest. `next build` may typecheck this file via `include: **/*.ts`. |
| `web/src/lib/keep-cloud 2.ts` | Looks same header as `keep-cloud.ts` | Medium — Keep sync is load-bearing. |
| `web/src/lib/coarse-pointer 2.ts` | Same as canonical | Low |
| `web/src/lib/harvest-score 2.ts` | Same header as canonical | Low (preview mixer only) |
| `web/src/lib/harvest-lab-presets 2.ts` | (not diffed here) | Low |
| `web/src/lib/harvest-capture-fs 2.ts` | localhost capture | Low |
| `web/src/lib/keep-land 2.ts` | land boxes | Low but near harvest motion — do not “clean up” land math |
| `web/scripts/dev-lan 2.mjs` | LAN helper copy | Low; `package.json` points at `dev-lan.mjs` |
| `inbox/… 2.md` (five files) | notes | Delete or leave in inbox; never import |

### Execution order (implementation ticket, not now)

1. Confirm `rg " 2'" web/src` and `rg "from .* 2"` still empty.
2. `git rm` or delete the seven `web/src/lib/* 2.ts` + `dev-lan 2.mjs` only. Leave inbox to Camron.
3. Add gitignore:

   ```
   **/* 2.ts
   **/* 2.tsx
   **/* 2.mjs
   **/* 2.js
   ```

   Do **not** ignore all `* 2.md` repo-wide without Camron (inbox may want copies). Prefer ignoring `web/**/* 2.md` if needed.
4. Belt: `tsconfig.json` `exclude` those globs anyway.
5. `npm run test:harvest && npm run build`.
6. Do **not** combine this delete with a feature promote. Hygiene-only commit, lab deploy optional.

---

## Implementation-wave board protocol (no clobber)

**Problem:** eleven Composer tabs last-write-wins on `web/KEPT-BOARD.md`. Plan wave already forbids worker board edits. Implementation wave will be worse if workers “log as they go.”

### Roles

| Role | Writes | Reads |
| --- | --- | --- |
| **Chief** (one chat) | `web/KEPT-BOARD.md` **only writer** during a parallel wave | All `web/lane-plans/*.md`, all `web/lane-plans/status/*.md` |
| **Worker** (ticket chat) | Own `web/lane-plans/status/NN.md` every turn; own src files on the lock list | KEPT-BOARD (read-only), Sunday spec, own plan |
| **Camron** | Magic words: go / promote / stop | Board + lab URL |

Plan files (`01-ask.md` … `11-ops.md`) freeze after converge except a one-line “converged into T#” note if chief asks. Workers do not keep planning in those files during implement.

### Status file (one per lane, no merge conflict with the board)

Path: `web/lane-plans/status/NN.md`

```markdown
# Lane NN status
Updated: ISO-8601
Ticket: T3
Status: claimed | in_progress | blocked | done | idle
Files: (must be subset of board lock)
Blocker: none | (one sentence + waiting on whom)
Log:
- newest bullet
```

If two workers need `ChatThread.tsx`, they are **not parallel**. Chief sequences them. Worker who finds a missing lock **stops** and writes `blocked` — does not steal.

### Chief converge (after “Plans are in”)

1. Read all eleven `web/lane-plans/NN-*.md`.
2. Emit **max 8 implementation tickets** in KEPT-BOARD under **Implementation wave**: id, owner lane, files, frozen constraints, hitchhiker ban.
3. Set P1–P11 plan rows to `done` (plans exist) or delete them from the lane table so implement tickets are the only live rows.
4. Say go. No src before that.

### Worker paste (implementation)

```text
Ticket T#. Read web/KEPT-BOARD.md Implementation wave and web/HALO-V2-SUNDAY.md.
You own only the files listed for T#.
Do not edit web/KEPT-BOARD.md. Write web/lane-plans/status/NN.md every turn.
Do not promote. Do not deploy unless the ticket says deploy:lab.
Frozen: harvest z-index 120, morph 1080ms, Paper, seating, beads. AskShell parked.
```

### Chief “status” / “wrap”

1. Read every `web/lane-plans/status/*.md`.
2. Rewrite KEPT-BOARD locks + one 3–8 bullet log **in a single edit**.
3. Do not ask eleven workers to patch the board.

Ship-checklist “update KEPT-BOARD same turn” is **satisfied by the worker’s status file + chief wrap**, not by eleven board writes.

### What not to do

- Do not use git branches per lane as the coordination mechanism this weekend (solo tree, Camron merges by saying go).
- Do not put locks in Atlas; Atlas was down at review time and is the phone dump, not the desk.
- Do not revive extra Composer tabs that skip the status file.

---

## Top 5 implementation tickets (this lane, after chief go)

Human-fail tests in italics.

1. **Ops manuals match the tree** — Refresh `HARVEST-OPS.md`: 9 suites, Keep cloud, four packets + master checklist, live-vs-fixture, Vercel env (`HALO_USE_LUNA=0` on prod until Luna packet). *Fail if a new chat still thinks CI is 3/3 and Keep is localStorage-only.* Files: `web/HARVEST-OPS.md` (and a pointer from ROADMAP-VERSIONS that 1.2 is packets not a calendar dump).

2. **Live harvest gate before intent `--prod`** — Written procedure: lab deploy → scripted real asks → `harvest:export` → compare socks/capital/empty-nonskip to the 2026-09-04 baseline. Optional: store `intent` on `halo_harvest_turns` (Lane 7). *Fail if promote is argued from canned 8/8 alone.* Files: HARVEST-OPS section; maybe `web/reports/` template. No miner prompt edits (Lane 2).

3. **Finder-duplicate purge** — Delete `* 2.ts` / `dev-lan 2.mjs`; gitignore; tsconfig exclude; `test:harvest` + `build`. *Fail if `ask-route 2.ts` still sits in `web/src/lib` or if any import path contains ` 2`.* Hygiene-only commit. Not bundled with feature promote.

4. **CI honesty + lock/play fixtures** — Keep GitHub = `test:harvest` only. Add HarvestLock order/skip + `finishRound` miss-once fixtures into `v2-lib-check` (Lane 4/3 write tests; this lane requires them on the lock-in packet). Optionally add `npm run build` as a second CI job (no secrets). *Fail if lock-in can ship with zero unit coverage.*

5. **Production env ring fence** — Document + apply Vercel Production: `HALO_USE_LUNA=0`, `NEXT_PUBLIC_APP_LANE=family`, explicit compose/daily caps for **current** 1.1.2 vs **next** packet. Lab project/preview may differ. *Fail if promoting this working tree would silently enable Luna because a key exists.* Coordinate Lane 1/7. Rotate OpenAI key (already overdue).

---

## Handoffs

| To | What |
| --- | --- |
| **Lane 2 Harvest** | Live-vs-canned bar; `cardMatchesIntent` / skip-bypass / classify latency are **their** ship-blockers on the intent packet. Ops will not promote on 8/8. Recommend `HALO_INTENT_HARVEST` kill switch before first promote. |
| **Lane 4 Review** | HarvestLock Skip==Done==fly is a QA fact. Need a product call + one fixture. Ops will not promote lock-in without uncoached lab pass. |
| **Lane 1 Ask** | Luna packet after harvest; `lunaEnabled()` default-on; `.env.example` lies relative to live `136d15f`. Caps 2000/40 are hitchhikers on any promote of this tree. |
| **Lane 6 Mobile** | ChromeMenu packet owner. Safari matrix is shared. No TestFlight. |
| **Lane 7 Backend** | Vercel env, `ask_hold`, harvest_turns PII, optional intent columns, dual `halo_learn_cards`. Duplicate `* 2.ts` listed here too — one purge ticket. |
| **Lane 5 UI** | Do not revive AskShell in a promote. First-harvest copy is their packet, not a hitchhiker on intent. |
| **Lane 3 Keep** | Day cap 3 vs spec 2 is a **doc** bug; do not “fix” to 2 in a silent promote. Dual store is not an ops weekend delete. |
| **Lane 10 Product** | Three uncoached Home rounds remain the spread gate. Ops will not promote Teach-me/streaks/Stripe/iOS. |
| **Chief** | Only writer of KEPT-BOARD in the implement wave. Converge to ≤8 tickets. Status files under `web/lane-plans/status/`. |

---

## Do not do

- `vercel --prod` / `deploy:early` / promote / emergency unless Camron’s magic words.
- Deploy parked AskShell to family `/ask`.
- Put live Grok miner or `test:harvest:family` in GitHub Actions.
- Delete `* 2.ts` in the plan wave (this file is the plan; wait for go).
- Edit `web/KEPT-BOARD.md` from worker chats (including this one).
- Score lab `ask-guard` / Luna / daily-40 as what family has today.
- Bundle intent + Luna + lock-in + hamburger + 2000-char + daily-40 as “1.2.”
- Teach-me, streaks, Stripe, iOS TestFlight, public signup, Terms page as this month’s ops.
- Retune harvest z-index 120 or morph 1080ms.
- Pretend ROADMAP-VERSIONS 1.3–1.6 is the implementation queue.
- Claim the phone agent is current (Atlas was down at session start).

---

## Files this lane would touch later (not now)

`web/HARVEST-OPS.md`, `web/ROADMAP-VERSIONS.md` (pointer only), `.gitignore`, `web/tsconfig.json` (exclude belt), delete list above, `.github/workflows/test-harvest.yml` **only** if adding a no-secret `build` job, `web/.env.example` (Luna default honesty), `web/lane-plans/status/` (protocol), Vercel dashboard env (Camron).

Do **not** own: `learn-mine.ts`, `ask-intent.ts`, `HarvestLock.tsx` internals, `keep-memory.ts`, `ChromeMenu.tsx` pixels, `openai.ts` routing tables.
