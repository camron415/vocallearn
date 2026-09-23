# Halo — product vision & roadmap

**Canonical planning doc.** When product direction, version scope, or open decisions change, update **this file first**, then link out to detail specs.

**Owner:** Camron Trost  
**Last updated:** 2026-09-20  
**Live product:** https://halo-gules-three.vercel.app (**v1.2.0** — early access + Family `/ask`)  
**Lab:** localhost / LAN `/preview` mixer. Same 1.2 tree as live.

---

## How to use this file

| You need… | Start here |
| --- | --- |
| Vision & positioning | [§ Vision](#vision) |
| Trajectory (2026-09-01) | [§ Trajectory adjustment](#trajectory-adjustment-2026-09-01) |
| Fun / retention (2026-09-07) | [`docs/FUN-LOOP.md`](./FUN-LOOP.md) |
| Keith 2026 (same science, don’t copy the course OS) | [`docs/KEITH-AI-LEARNING-GUIDE.md`](./KEITH-AI-LEARNING-GUIDE.md) |
| 1.3 agent lanes (2026-09-20) | [`web/lane-plans/13-1.3-priority.md`](../web/lane-plans/13-1.3-priority.md) |
| 1.3 close checklist | [§ 1.3 close checklist](#13-close-checklist-review-before-calling-13-done) |
| What shipped | [§ Shipped — v1.1](#shipped--v11) |
| Version plan (1.1.1 → 1.6) | [§ Version roadmap](#version-roadmap) |
| Save / Learn-more / Teach-me | [§ Discovery layer](#discovery-layer) |
| Intent harvest (1.2) | [§ Intent harvest](#intent-harvest-12) |
| Header / Saves UX | [§ Navigation](#navigation--saves) |
| Open decisions | [§ Open decisions](#open-decisions) |
| Explicitly deferred | [§ Deferred](#deferred) |
| Deep specs | [§ Related docs](#related-docs) |

**Cadence:** ~2 weeks per release. **Rings:** Lab (Camron) → Early access (wife, parents) → Family (siblings+) → Friends (1.2+) → Public-ish (1.5).

**Fun / retention (2026-09-07):** Juice is a multiplier, not the product. Same-visit lock-in + day-1 play + inspect shipped in 1.2; juice stays light. Detail: [`docs/FUN-LOOP.md`](./FUN-LOOP.md).

**1.3 (2026-09-17 / 20):** Invite-only **iOS app** (Capacitor around live Halo). Public brand candidate **Keeply**. Craft + Voice I/O lanes (do not overlap Native / Auth / Composer): [`web/lane-plans/13-1.3-priority.md`](../web/lane-plans/13-1.3-priority.md). Streaks / Teach-me stay later.

---

## Vision

### One-liner

**Halo** is invite-only family Ask that **answers you**, then — when the question is worth it — helps you **earn the memory** (not just receive it): bank facts, review when due, graduate. Duolingo-side of Quizlet, not another ChatGPT clone.

### Positioning (do not slide off this)

- **Ask is the front door.** Search/chat stays first. Keep/Learn is optional juice on real answers.
- **Two doors, not one mode.** Lookup and throwaway questions get **instant answers** (harvest optional or skipped). Depth / study-worthy questions get the **same answer plus an opt-in learning path** — click now, deeper integration later. **Not** Socratic intercept on every send.
- **Not a video game.** Gamification ~5/10: light collection, mastery rings, clear-the-day — still obviously a learning tool. No HP, maps, combat chrome.
- **Not write-only AI.** Most chat apps: ask → read → forget. Halo adds encoding *when you choose it* and a daily tidy for people who tap chips.
- **Reading = free discovery.** Thin Teach-me opt-in → full lesson depth premium. Review loop = everyone.
- **Not Duolingo’s content factory.** User curiosity + JIT lessons = the library. No pre-built curriculum maps for every subject.
- **Same science as serious AI-and-learning teaching; not their product.** Keith 2026 (BYU student guide) independently lands on retrieval, spacing, generation, and “Oracle has a place.” Halo already ships the family protocol. Do **not** import Socratic-on-every-send, a syllabus OS, or a 58-skill plugin. [`docs/KEITH-AI-LEARNING-GUIDE.md`](./KEITH-AI-LEARNING-GUIDE.md).

### Product pillars

| Pillar | What it is |
| --- | --- |
| **Ask** | Streaming Grok chat, history, dictation, cost-aware routing |
| **Discover** | Read answer · Learn-more chips · Teach-me lesson (premium) |
| **Keep** | Harvest facts + Saves (recipes/lists) into header beads |
| **Review** | Due chips on Home → cluster rounds (SEE then SAY) |
| **Remember** | Mastery (bronze → silver → gold → ◎), streaks, achievements |

### VocalLearn native (same repo)

React Native voice tutor on a physical iPhone — where spaced repetition, lesson frames, and semantic grading were prototyped. **Halo web is the live multi-user product.** The VocalLearn Expo app stays a voice lab. **1.3 iOS is a Capacitor shell around Halo web**, not a port of `app/`.

---

## Trajectory adjustment (2026-09-01)

**Status:** Slight adjustment — **not** a pivot. Early-access feedback (wife/parents on v1.1) + planning conversations (Atlas, Gemini) confirm the Keep loop is the right engine; the gap is **when learning starts** and **which questions deserve it**.

### What we learned

| Signal | Response |
| --- | --- |
| Rolling ~24h wait before review feels weird | Already **1.1.1**: calendar-day first due + clearer copy (“review tomorrow”) |
| Most casual AI questions aren’t worth studying | **Intent harvest (1.2)** + skip weather/news/throwaway; UI should not invite junk asks |
| Reading an answer ≠ encoding it | **Teach-me / interactive climb** for depth asks — opt-in click first, not withhold every answer |
| Duolingo-scale libraries are impossible at startup | **JIT from user questions** — facts and lesson arcs generated on demand, indexed per user in Keep |
| Mobile is a selling point | **1.3 iOS TestFlight** — Safari QA on the canonical phone passed with 1.2 |

### Intent qualification (product rule)

```
user asks
    → classify intent (lookup | transient | depth | save | skip)
    → lookup / transient     → full answer immediately; harvest closed fact if worth it; no Teach-me
    → depth / study-worthy   → full answer + [Teach me this] (when shipped); facts → Keep
    → recipe / list          → answer + [Save this …] (1.1.1)
    → weather / news / junk  → answer; skip harvest
```

**Never:** lock the answer behind Socratic steps by default. **Optional later:** “Just the facts” hatch on depth asks if we add a guided climb.

### What we are **not** building (still out)

- K-12 textbook / district curriculum library or global shared lesson DB
- Socratic intercept on every chat send (XP bars, cheat tokens, streak-as-core in V2)
- Scanning copyrighted pages into a reusable global corpus
- Competing head-on with Duolingo language trees or Quizlet’s pre-made decks
- University AI-study OS (syllabus projects, paper/problem-set coaches, 58 Claude skills) — Keith 2026 confirmed the science, not this shape. [`docs/KEITH-AI-LEARNING-GUIDE.md`](./KEITH-AI-LEARNING-GUIDE.md)

### Phased learning tools

| Phase | UX | Ships |
| --- | --- | --- |
| **Now** | Answer + harvest + tomorrow review | **v1.1** |
| **Click opt-in** | Chat action row: Save, Learn-more, **Teach me this** (depth only) | 1.1.1–1.3 |
| **Integrated** | Lesson opens on play sheet; encoding before/at review; voice on mobile | 1.3–1.4 |
| **Premium depth** | Full tutor sessions, metering, unlimited lessons | 1.4–1.5 |

Detail: [`web/PRODUCT-DISCOVERY.md`](../web/PRODUCT-DISCOVERY.md)

---

## Shipped — v1.1

**Date:** 2026-08-30 · **Git:** `9015a3a` · **Package:** `halo-web@1.1.0`

Full manifest: [`web/RELEASE-1.1.md`](../web/RELEASE-1.1.md)

| Area | Shipped |
| --- | --- |
| **Ask** | Grok 4.3 streaming, history, Home↔Chat morph, dictation, daily cap (~40), cheap routing (lookup vs depth) |
| **Paper UI** | Production skin on `/ask`, login, invite, Settings, History, Chat, play sheet; mobile QA pass |
| **Cove / Keep loop** | Harvest → Keep beads → due Home (16 cap) → play rounds → gold ◎ |
| **Review** | SEE-all then SAY-all, partial credit, miss reteach, day cap 3 rounds |
| **Sync** | Keep cloud sync (`halo_keep_state`, `/api/keep`) phone ↔ desktop |
| **Ops** | Admin invites, usage $, harvest telemetry (`halo_harvest_turns`) |
| **Lab** | `/preview` mixer stays Camron-only tuning bench |

**Migrations on prod:** `014_halo_harvest_turns`, `015_halo_keep_state`

---

## Version roadmap

| Version | Target | Theme | Status |
| --- | --- | --- | --- |
| **1.1** | 2026-08-30 | Paper + Cove/Keep on production | **Shipped** |
| **1.1.1** | Week of 2026-08-31 | Hotfix + **Saves** | **Shipped** |
| **1.1.2** | 2026-09-02 | Library ≡ recipes, Save pill, morph hotfixes | **Shipped** |
| **1.1.2-mobile** | 2026-09-03 | iPhone header + recipes scroll | **Shipped** (superseded by 1.2) |
| **1.2** | 2026-09-17 | Luna + intent harvest + unbox + lock-in + phone Home | **Shipped** (live `/ask`) |
| **1.3** | Early–mid Oct | **Keeply iOS** — Capacitor around live Halo, TestFlight, onboard, same-mint juice, on-device Voice I/O | Planned |
| **1.4** | Mid–late Oct | Stripe, push, Sign in with Apple/Google, Teach-me thin if the loop is sticky | Planned |
| **1.5** | Nov | Polish, legal, public-ish, ~100 accounts, Teach-me premium GA | Planned |
| **1.6** | Dec | Android, minigames, full tutor depth + voice polish | Planned |

### 1.1.1 — Hotfix + Saves

Detail: [`web/PATCH-1.1.1.md`](../web/PATCH-1.1.1.md)

| # | Item |
| --- | --- |
| 1 | **Calendar-day first due** — harvest tonight → due tomorrow morning (local), not rolling +24h |
| 2 | **Timezone** — client greeting; profile/browser TZ in prompts + `clockLine` (not hardcoded Denver) |
| 3 | **“You’re clear”** — only after clearing today’s Home due; fresh harvest → “N facts saved — review tomorrow” |
| 4 | **Saves** — chat action row + header icon + neutral flyer; recipe/list detect |

**Out of scope:** Luna, tour, teach-me, learn-more, harvest retuning.

### 1.2 — Luna + intent harvest (shipped 2026-09-17)

**Live on early access + Family `/ask`.** Review sheet signed 2026-09-17 (light + dark, phone + desktop). Camron said **promote** the same day.

| Item | Status |
| --- | --- |
| **Luna routing** | On production: `HALO_USE_LUNA=1` + `OPENAI_API_KEY`. Cheap default (gpt-4.1-mini); Grok + search for files, web, long depth. Unset + key also turns Luna on — do not leave prod blank. |
| **Intent harvest** | Classify job ⟂ freshness + `askKind`. Primary chip + 0–2 supports. Cue uniqueness (question, not the answer word). One-word closed names Keep. Camron live: “largest planet” → Jupiter. Dry `test:ask:claims` 24/24. Live buckets **28/28 routing · 11/11 primary** (2026-09-15). |
| **Chat unbox** | Assistant on the paper field; icon-only Copy · Listen · Save / Copy · Edit. **Camron lab QA 2026-09-07.** |
| **Collect lock-in** | Kind marks + “Say it to keep it” under the answer + fly. Play sheet **Camron signed 2026-09-17** (SAY stadium, Check ghost, Done ink, miss hit `--play-ink` on light). |
| **Phone Home seats** | Portrait constellation (≤8 visible, extras wait in Keep). Camron signed 2026-09-17. Desktop 16 MASTER unchanged. |
| **Phone chrome** | Header inset + beads, Follow-up dock (signed 2026-09-12), Keep both-end fade. |
| **H1 (was “light tour”)** | `Kept — these come back tomorrow.` after first harvest. **No** what’s-new slideshow (Cove vision bans it). |
| **Mobile QA** | Canonical iPhone = default Text Size + Standard zoom. Type scale locked. Safari + Chrome signed with the confirm list. |
| **Telemetry** | `halo_harvest_turns` + `harvest_miss` + Don't-keep `reject`. Migration **017** already applied. |

**Explicitly not 1.2:** Learn-more, Teach-me, tour slides, follow-up Keep rewrite, Packet C, AskShell, synonym/list merge, streaks, miss reveal term vs sentence. **iOS is 1.3.**

**What family feels vs 1.1.2:** Luna on shallow asks, classify wait before stream, smarter Keep (and less junk Keep), lock-in quiz, unbox actions, phone Home that isn’t a pile, signed Follow-up dock. Same Paper login / recipes / invite — no restyle.

Detail: [`web/INTENT-HARVEST-1.2.md`](../web/INTENT-HARVEST-1.2.md) · QA: [`web/HARVEST-OPS.md`](../web/HARVEST-OPS.md) § 1.2 closeout

### 1.3 — Keeply iOS (invite-only)

Safari gate is met (1.2 signed at default Text Size + Standard zoom). Detail: [`docs/IOS-FIT-AND-1.3.md`](./IOS-FIT-AND-1.3.md). **Agent order + file locks:** [`web/lane-plans/13-1.3-priority.md`](../web/lane-plans/13-1.3-priority.md). Craft mint: [`docs/CRAFT-JUICE.md`](./CRAFT-JUICE.md).

**Stack:** Capacitor + WKWebView **navigating to live Halo** (same Vercel app, same APIs). Do not rebuild in React Native. Do not wrap VocalLearn `app/`.

**Distribution:** TestFlight email invites only. Not searchable App Store. Halo invite still required to create an account.

| Wave | What | Lane | Gate |
| --- | --- | --- | --- |
| **0** | Xcode on Camron’s phone — splash, status bar, safe area, load Halo | **Native** (live) | USB; free Apple ID |
| **1** | First-run + invite create-account + paper login; Apple/Google later | **Auth onboard** (live) | Before wife TestFlight |
| **1b** | Send path + Home↔Chat morph film | **Composer / QA** (live) | Camron signs iPhone lab |
| **1c** | Terms + Privacy in Settings | **13** — legal tab claims | Store / TestFlight copy |
| **1d** | Menu sheets | **14 parked** — already shipped | Only if Camron films a hitch |
| **2** | Paid Apple Developer + first TestFlight | **Native** | Wife / early testers |
| **3a** | Same-mint **joins** (ghost, land, duration map) | **15** — other tab (QA debug). **Required on 1.3 close checklist** | One LoopSkin owner |
| **3b** | Three haptics + tiny earcons + atom Listen | **16 Bells** (this juice chat) | Soft / reduce = off; play sheet silent |
| **3e** | Domain on Vercel (desktop + app) | Native / Camron | After phones |

**Brand (working):** **Keeply** for the app people see. Loop words stay Cove / Keep / Home. Code names (`Halo*`, `APP_NAME = "Cove"`) do not rename in Wave 0.

**Name collision (do not ignore):** two iOS apps already list as Keeply (photo vault; AI link organizer). `keeply.com` is a Finnish lead-blanket company. Phonetic neighbor **Keepy** is a kids-memory app. Exact App Store name “Keeply” is likely blocked; buy a **free** domain (`.ai` / `.app` / `.co`) — do not expect `keeply.com`. Pick a listing name before App Store Connect (Keeply Ask, etc.) or a cleaner unique word.

**Parked in 1.3:** Teach-me, streaks/XP, Stripe, public signup, **cloud / duplex** STT-TTS, OpenAI-class Listen on every turn, Harvest/Home seating retunes, morph 1080, harvest z 120, exhibit 3D theater.

**Do not double-book:** Native owns `native/` + `--halo-native-bottom`. Auth owns Login/Invite/first-run. Composer owns AskLanding / ChatThread / pending-turn. Legal tab claims **13**. Do not spawn **14**. **Bells (16)** is this juice chat — not LoopSkin.

### 1.3 close checklist (review before calling 1.3 done)

Other agents: **do not ship 1.3 without looking at this list.** Juice (haptics / ticks / Listen) is not a substitute for the joins.

- [ ] **One workshop** — Home↔Chat morph, harvest land, sheet vs travel, no layout jump after fly. Same mint: instant / tap / travel / hold. Lane **15** (QA / Composer). See [`CRAFT-JUICE.md`](./CRAFT-JUICE.md) § 0. Frozen: morph **1080**, harvest z **120**, Home seats, phone dock.
- [ ] Wave 0 shell + Trust on Camron’s phone
- [ ] First-run / login signed (Auth)
- [ ] Legal pages linked
- [ ] Lock-in + gold juice (haptics / earcons); Soft + reduce off
- [ ] Listen speaks the **atom**, not the whole article
- [ ] TestFlight only when Native + Camron say go

**Not this close:** Teach-me, streaks, exhibit 3D, duplex tutor, cloned voices.

### 1.4 — Money + native plugins

- Sign in with Apple (required if Google is offered on iOS) + optional Google — invited accounts only
- Stripe Family/Plus when people actually return
- Push for due / “you’re clear”
- Teach-me thin / Learn-more only if uncoached rounds are happening
- Duplex tutor / custom actor clone / Deepgram only if on-device dictate (1.3 lanes 18–19) lost to the Grok app

### 1.5 — Scale

- ~100 accounts; harvest + review production quality
- Legal live; public signup or open waitlist
- **Teach-me premium GA** — metering, tier limits, full lesson depth

### 1.6 — Expand

- Android if demand; extra minigames; full tutor depth + voice premium polish

---

## Discovery layer

Three chat actions under the last assistant bubble. Same pill row, shared component.

| Action | When | Cost | Ships |
| --- | --- | --- | --- |
| **Save this …** | Recipe, list, packing list detected | Low | **1.1.1** |
| **Learn more …** | 2–3 curiosity chips from thread | Low | **1.3** (was listed 1.2; not in this lab tree) |
| **Teach me this** | Depth ask (battle, concept) — **not** lookups | High (lesson + facts) | **Thin 1.3** · integrated **1.4** · premium **1.5** |

All paths that produce facts → same **Keep → due → Home → review** pipeline. **Click opt-in first**; deeper Socratic / visual lesson integration in later releases — never default-withhold on every ask.

Detail: [`web/PRODUCT-DISCOVERY.md`](../web/PRODUCT-DISCOVERY.md)

### Chat action row (layout)

```
┌─────────────────────────────────────┐
│  Assistant answer…                 │
│  [harvest highlight spans]         │
└─────────────────────────────────────┘
  [ Save this recipe ]     ← 1.1.1
  [ Learn more: … ]        ← 1.3
  [ Teach me this ]        ← 1.3+ (depth asks only)
```

- Style: paper inset pills (same as suggest chips). **Save uses neutral stone — not kind colors.**
- Flight: parametrize harvest flights → `data-saves-pocket` target.

---

## Navigation & Saves

**Problem:** Header is Cove + Keep beads + History + Settings. No room for a text label (“Lists”, “Recipes”).

**Decision (1.1.1):**

| Choice | Rationale |
| --- | --- |
| **Bookmark icon** (or Library `≡` drawer later) | One symbol scales; no header crowding on iPhone |
| **Cove on Home** | Optional scroll-to-top; not required 1.1.1 |
| **Cove on Chat** | Do **not** duplicate ← Home |
| **Save flyer** | Lands on bookmark icon; neutral orb, not when/where/who/meaning |

**Later (1.3+):** Library `≡` drawer for Saves, achievements, help — if more than one “document” feature.

---

## Intent harvest (1.2)

### Two jobs (measure separately)

| Job | Owner | Success |
| --- | --- | --- |
| **Answer accuracy** | Ask route + Grok/Luna | Reply correctly answers the question |
| **Harvest selection** | Miner + policy + intent | Chips = direct answer + tight support only |

### Rules (priority)

1. **Primary fact (mandatory)** — closed question → ≥1 card with direct answer (capital, date, count, name).
2. **Supporting cluster (0–2)** — same `topicKey`, different kinds when possible, flashcard-title test.
3. **No tangents** — skip facts that don’t help answer the user’s question.
4. **Chip budget** — short lookup 1–2; medium 2–3; long depth 3–4 (hard cap **5**).
5. **Closed-only for play** through 1.3; open facts logged or Teach-me later.
6. **Cue uniqueness (lab 2026-09-16, rides with 1.2 promote)** — a Keep fact is the folded **question cue**, not the answer token. Same answer + different question = two chips (Jupiter family). Restated cue = one chip. Token-only “already have Jupiter” blocking is gone. Closed one-word names Keep. Classify `remember` may harvest a short follow-up. Tests: `npm run test:ask:claims` (24/24) · Camron live 2026-09-16. Parked post-1.2: synonym twins, list/set grading, >400-card peek. Spec: [`web/INTENT-HARVEST-1.2.md`](../web/INTENT-HARVEST-1.2.md) § Cue uniqueness.

### Pipeline (build order)

```
userText → resolveHarvestIntent()     // regex + optional mini-model
         → miner (INTENT block)      // JSON cards
         → validator                  // closed, span, dedupe, kinds
         → deterministic fallback     // capital/population if miner returns []
```

### Success metrics (1.2)

| Metric | Target |
| --- | --- |
| Closed lookup gets ≥1 correct chip | ≥90% |
| Tangent chips (human label) | <10% |
| Zero-card on closed lookup | <5% |
| Kind diversity when 2+ chips | ≥70% mixed |

---

## Open decisions

| # | Question | Leading option |
| --- | --- | --- |
| 1 | Header symbol | Bookmark icon now; Library `≡` when more shelf items |
| 2 | Lists MVP scope | Shopping + packing lists; any list type later |
| 3 | Capital harvest fallback | Yes — regex when miner returns `[]` on high-confidence lookups |
| 4 | Max chips per turn | 3 default; 4–5 only for depth asks after validation |
| 5 | Open facts in Keep | Display/log only; closed-only play through 1.3 |
| 6 | Teach-me default vs opt-in | **Opt-in click only** — no Socratic intercept on every send |
| 7 | iOS shell timing | **1.3** — Capacitor around live Halo; Safari QA passed with 1.2 |
| 8 | Public brand / domain | **Keeply** working name. Exact App Store “Keeply” taken. Domain ≠ `keeply.com` (Finnish industrial). Free TLD + listing modifier TBD |

---

## Deferred

| Item | When / why |
| --- | --- |
| Public signup | 1.5+ after legal + quality bar |
| Full RPG gamification | Out of positioning |
| K-12 textbook / district curriculum library | Out — user JIT + private Keep only |
| Global shared lesson DB / semantic curriculum merge | Out — per-user Keep is the library |
| Socratic intercept on every Ask | Out — depth opt-in only |
| Realtime voice in web | Parked; **on-device** dictate + atom Listen are 1.3 lanes 18–20 after Native + Composer unlock. Duplex / cloud streaming is 1.4+ |
| GPT Luna on production | **Shipped in 1.2** — `HALO_USE_LUNA=1` + `OPENAI_API_KEY` on Vercel |
| Achievements / sound | Light haptics/audio in 1.3 Wave 3 (lanes 16–17); no streak cabinet. [`docs/FUN-LOOP.md`](./FUN-LOOP.md) · [`docs/CRAFT-JUICE.md`](./CRAFT-JUICE.md) |
| Spark-only harvest / 7-bead dock / family ticker | Out — [`docs/FUN-LOOP.md`](./FUN-LOOP.md) |
| Billing | 1.4 |
| Full product tour | Out — H1 line is the 1.2 “tour”; no what’s-new slides |
| Inline in-bubble user edit | **1.3+** — Edit chip today prefills Follow up; do not edit the same bubble in place yet |
| Promote Lab experiments | Only on explicit **promote** from Camron |

### Frozen (do not break without Replay)

Harvest z-index 120 · morph `--travel` 1080ms · bead diameter · Home seating · play sheet 832px / inner ~440px. Spec: [`web/HALO-V2-SUNDAY.md`](../web/HALO-V2-SUNDAY.md)

---

## Engineering & ops

| Topic | Doc |
| --- | --- |
| Loop spec (weekend V2) | [`web/HALO-V2-SUNDAY.md`](../web/HALO-V2-SUNDAY.md) |
| Harvest QA / promote | [`web/HARVEST-OPS.md`](../web/HARVEST-OPS.md) |
| Coordination board | [`web/KEPT-BOARD.md`](../web/KEPT-BOARD.md) |
| Local run / deploy | [`web/README.md`](../web/README.md) |
| Recruiter / GitHub | [`docs/GITHUB_SETUP.md`](./GITHUB_SETUP.md) |

**Deploy default:** `npm run deploy:lab` (preview). Production only on **promote** / **early access** / **emergency**.

**Tests:** `cd web && npm run test:harvest` (CI on push).

---

## Related docs

| File | Contents |
| --- | --- |
| [`web/RELEASE-1.1.md`](../web/RELEASE-1.1.md) | v1.1 ship manifest |
| [`web/PATCH-1.1.1.md`](../web/PATCH-1.1.1.md) | Next patch scope |
| [`web/PRODUCT-DISCOVERY.md`](../web/PRODUCT-DISCOVERY.md) | Save / Learn-more / Teach-me |
| [`web/INTENT-HARVEST-1.2.md`](../web/INTENT-HARVEST-1.2.md) | Intent harvest rules |
| [`web/INTENT-HARVEST-RESEARCH.md`](../web/INTENT-HARVEST-RESEARCH.md) | Memory science + miner architecture |
| [`docs/COVE_KEEP_VISION.md`](./COVE_KEEP_VISION.md) | Loop vision (kinds, seats, mastery) |
| [`docs/FUN-LOOP.md`](./FUN-LOOP.md) | Retention / QA burnout — juice vs lock-in; what not to build |
| [`docs/HALO_PRICING_AND_SCALING.md`](./HALO_PRICING_AND_SCALING.md) | Pricing tiers (future) |
| [`docs/WESLEY_FOUNDER_ADVICE.md`](./WESLEY_FOUNDER_ADVICE.md) | 2026-09-12 DSP-owner conversation — users, pay test, no kids pivot, follow-up |
| [`docs/KEITH-AI-LEARNING-GUIDE.md`](./KEITH-AI-LEARNING-GUIDE.md) | 2026-09-20 BYU student AI guide — same retrieval science; do not copy the course OS |
| [`docs/IOS-FIT-AND-1.3.md`](./IOS-FIT-AND-1.3.md) | Type scale lock + **1.3 Keeply iOS** (TestFlight, Capacitor, brand collision) |
| [`docs/ACHIEVEMENT-EXHIBITS.md`](./ACHIEVEMENT-EXHIBITS.md) | Future: topic kits, socketed trophies, museum shelf — not 1.3 |
| [`docs/CRAFT-JUICE.md`](./CRAFT-JUICE.md) | Same-mint motion, then haptics, then a tiny sound palette, then Voice I/O |
| [`web/lane-plans/13-1.3-priority.md`](../web/lane-plans/13-1.3-priority.md) | **1.3 agent order** + file locks vs Native / Auth / Composer |
| [`web/lane-plans/16-bells.md`](../web/lane-plans/16-bells.md) | Bells lane: haptics, earcons, atom Listen |

---

## Changelog (planning)

| Date | Change |
| --- | --- |
| 2026-09-20 | **Bells lane 16 claimed.** Lock/gold juice + atom Listen. **1.3 close checklist** keeps one-workshop (lane 15) required. [`web/lane-plans/16-bells.md`](../web/lane-plans/16-bells.md). |
| 2026-09-20 | **Keith 2026 aside.** BYU student AI guide confirms retrieval / spacing / two-door; do not copy Socratic intercept or a university skill OS. [`docs/KEITH-AI-LEARNING-GUIDE.md`](./KEITH-AI-LEARNING-GUIDE.md). |
| 2026-09-20 | **1.3 craft/voice lanes queued.** Smooth sheets → joins → 3 haptics → earcons → on-device dictate → atom Listen. Spawn 13+14 now; 15–20 wait Native/Auth/Composer. [`web/lane-plans/13-1.3-priority.md`](../web/lane-plans/13-1.3-priority.md). |
| 2026-09-20 | Exhibit trophies + craft juice vision (not 1.3 build). [`ACHIEVEMENT-EXHIBITS.md`](./ACHIEVEMENT-EXHIBITS.md) · [`CRAFT-JUICE.md`](./CRAFT-JUICE.md) |
| 2026-09-17 | **1.3 locked as Keeply iOS.** Capacitor around live Halo; TestFlight invites only; Wave 0 before paid Apple account. Keeply is the working public name — exact App Store “Keeply” already taken; `keeply.com` is Finnish industrial. Streaks/Teach-me stay later. [`IOS-FIT-AND-1.3.md`](./IOS-FIT-AND-1.3.md). |
| 2026-09-17 | **1.2 promoted** to early access + Family (`halo-gules-three.vercel.app`). Luna env flip on Vercel. Confirm list + review sheet already signed. |
| 2026-09-17 | **Camron signed 1.2 confirm list.** Bookmark Save + Library is enough (no flyer). Parked: composer ghost, thinking-stream UX. |
| 2026-09-17 | **1.2 lab-ready closeout.** Lab tree has Luna + intent harvest + unbox + lock-in + phone seats + H1. Live stays 1.1.2-mobile until **promote**. Review motion polish is the last visual. Learn-more / Teach-me / tour slides / TestFlight stay later. Camron confirm list in [`web/HARVEST-OPS.md`](../web/HARVEST-OPS.md) § 1.2 closeout. |
| 2026-09-16 | **Cue uniqueness lock (lab, rides 1.2).** Identity = question cue, not answer word. Jupiter one-word closed Keep — Camron live “largest planet.” `test:ask:claims` 24/24. Parked: synonyms, lists. [`web/INTENT-HARVEST-1.2.md`](../web/INTENT-HARVEST-1.2.md) § Cue uniqueness. **No promote until Camron says promote.** |
| 2026-09-14 | iOS Text Size / Display Zoom: lock type scale; QA at default. 1.3 TestFlight candidate not yet rewritten here. [`docs/IOS-FIT-AND-1.3.md`](./IOS-FIT-AND-1.3.md) |
| 2026-09-12 | Founder conversation with DSP owner Wesley: more non-family users, then willingness-to-pay test. **Not** a K-12 pivot. Handoff: [`docs/WESLEY_FOUNDER_ADVICE.md`](./WESLEY_FOUNDER_ADVICE.md) |
| 2026-09-07 | Chat unbox + icon action row **Camron lab QA**. Inline in-bubble user edit parked to **1.3+**. Collect lock-in + Safari iPhone still on 1.2 sprint close. Fun-loop: juice is multiplier. [`docs/FUN-LOOP.md`](./FUN-LOOP.md) |
| 2026-09-01 | Trajectory adjustment: two-door Ask (instant vs opt-in learn), intent qualification, Teach-me thin **1.3** / integrated **1.4** / premium **1.5**, mobile iOS priority at **1.4** with web QA gate; explicit out-of-scope (curriculum library, Socratic everything) |
| 2026-08-31 | Canonical doc created from planning session: roadmap 1.1.1–1.6, discovery layer, intent harvest, Saves/header UX, open decisions |
| 2026-08-30 | v1.1 shipped to early access (Cove/Keep on production `/ask`) |
| 2026-08-28 | V2 Sunday spec locked (Paper, Keep loop, play sheet) |

---

*Update this file when scope or direction changes. Detail specs can live in `web/*.md`; this file is the index and source of truth.*
