# Halo — product vision & roadmap

**Canonical planning doc.** When product direction, version scope, or open decisions change, update **this file first**, then link out to detail specs.

**Owner:** Camron Trost  
**Last updated:** 2026-08-31  
**Live product:** https://halo-gules-three.vercel.app (v1.1 shipped 2026-08-30)

---

## How to use this file

| You need… | Start here |
| --- | --- |
| Vision & positioning | [§ Vision](#vision) |
| What shipped | [§ Shipped — v1.1](#shipped--v11) |
| Version plan (1.1.1 → 1.6) | [§ Version roadmap](#version-roadmap) |
| Save / Learn-more / Teach-me | [§ Discovery layer](#discovery-layer) |
| Intent harvest (1.2) | [§ Intent harvest](#intent-harvest-12) |
| Header / Saves UX | [§ Navigation](#navigation--saves) |
| Open decisions | [§ Open decisions](#open-decisions) |
| Explicitly deferred | [§ Deferred](#deferred) |
| Deep specs | [§ Related docs](#related-docs) |

**Cadence:** ~2 weeks per release. **Rings:** Lab (Camron) → Early access (wife, parents) → Family (siblings+) → Friends (1.2+) → Public-ish (1.5).

---

## Vision

### One-liner

**Halo** is invite-only family Ask that turns great answers into facts you **bank, review when due, and graduate** — Duolingo-side of Quizlet, not another ChatGPT clone.

### Positioning (do not slide off this)

- **Ask is the front door.** Search/chat stays first. Keep/Learn is optional juice on real answers.
- **Not a video game.** Gamification ~5/10: light collection, mastery rings, clear-the-day — still obviously a learning tool. No HP, maps, combat chrome.
- **Not write-only AI.** Most chat apps: ask → read → forget. Halo adds a daily tidy for people who want to remember.
- **Reading = free discovery.** Teach-me = premium. Review loop = everyone.

### Product pillars

| Pillar | What it is |
| --- | --- |
| **Ask** | Streaming Grok chat, history, dictation, cost-aware routing |
| **Discover** | Read answer · Learn-more chips · Teach-me lesson (premium) |
| **Keep** | Harvest facts + Saves (recipes/lists) into header beads |
| **Review** | Due chips on Home → cluster rounds (SEE then SAY) |
| **Remember** | Mastery (bronze → silver → gold → ◎), streaks, achievements |

### VocalLearn native (same repo)

React Native voice tutor on a physical iPhone — where spaced repetition, lesson frames, and semantic grading were prototyped. **Halo web is the live multi-user product.** Native remains the research lab for voice-first mechanics until iOS shell (1.4).

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
| **1.1.1** | Week of 2026-08-31 | Hotfix + **Saves** | Planned |
| **1.2** | Mid-Sep | Luna + **intent harvest** + light tour | Planned |
| **1.3** | Early Oct | Streaks, achievements, grading, T&S draft, brand chosen | Planned |
| **1.4** | Mid-Oct | iOS TestFlight, domain, Stripe, notifications | Planned |
| **1.5** | Nov | Polish, legal, public-ish, ~100 accounts | Planned |
| **1.6** | Dec | Android, minigames, Teach-me depth | Planned |

### 1.1.1 — Hotfix + Saves

Detail: [`web/PATCH-1.1.1.md`](../web/PATCH-1.1.1.md)

| # | Item |
| --- | --- |
| 1 | **Calendar-day first due** — harvest tonight → due tomorrow morning (local), not rolling +24h |
| 2 | **Timezone** — client greeting; profile/browser TZ in prompts + `clockLine` (not hardcoded Denver) |
| 3 | **“You’re clear”** — only after clearing today’s Home due; fresh harvest → “N facts saved — review tomorrow” |
| 4 | **Saves** — chat action row + header icon + neutral flyer; recipe/list detect |

**Out of scope:** Luna, tour, teach-me, learn-more, harvest retuning.

### 1.2 — Luna + intent harvest

| Item | Detail |
| --- | --- |
| **Luna routing** | Cheap default; Grok+search for depth/files/missed feeds |
| **Intent harvest** | Primary answer always harvested (closed); 0–2 supporting facts same topic, mixed kinds |
| **Telemetry** | Weekly `halo_harvest_turns` review → fixtures |
| **Light tour** | Ask → fly → “Review tomorrow” |
| **Tool metering** | Search calls in spend math |
| **Audience** | Friends wave when harvest quality holds |

Detail: [`web/INTENT-HARVEST-1.2.md`](../web/INTENT-HARVEST-1.2.md) · research: [`web/INTENT-HARVEST-RESEARCH.md`](../web/INTENT-HARVEST-RESEARCH.md)

### 1.3 — Habit + trust

- Streaks (clear-the-day or “≥1 round” — fair day-cap UX)
- Day-cap cooldown (Duolingo-style optional extra round)
- Light achievements (◎, first gold, streak milestones)
- Grading nuance (paraphrase per kind)
- Terms + Privacy draft; **brand name chosen** (domain in 1.4)
- Referral tracking (month-free credit OK manual)

### 1.4 — Money + iOS

- TestFlight — Capacitor/WebView shell around production web
- Domain + brand live; Stripe Family/Plus
- Push notifications (streak/review reminders)
- Learn-more chips if not in 1.2

### 1.5 — Scale

- ~100 accounts; harvest + review production quality
- Legal live; public signup or open waitlist
- Teach-me GA (premium)

### 1.6 — Expand

- Android if demand; extra minigames; voice premium polish

---

## Discovery layer

Three chat actions under the last assistant bubble. Same pill row, shared component.

| Action | When | Cost | Ships |
| --- | --- | --- | --- |
| **Save this …** | Recipe, list, packing list detected | Low | **1.1.1** |
| **Learn more …** | 2–3 curiosity chips from thread | Low | **1.2–1.3** |
| **Teach me this** | Depth ask (battle, concept) | High (lesson + facts) | **1.4–1.5** premium |

All paths that produce facts → same **Keep → due → Home → review** pipeline.

Detail: [`web/PRODUCT-DISCOVERY.md`](../web/PRODUCT-DISCOVERY.md)

### Chat action row (layout)

```
┌─────────────────────────────────────┐
│  Assistant answer…                 │
│  [harvest highlight spans]         │
└─────────────────────────────────────┘
  [ Save this recipe ]     ← 1.1.1
  [ Learn more: … ]        ← 1.2+
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

---

## Deferred

| Item | When / why |
| --- | --- |
| Public signup | 1.5+ after legal + quality bar |
| Full RPG gamification | Out of positioning |
| Realtime voice in web | Parked; native lab first |
| GPT Luna before 1.2 | Deferred per planning |
| Achievements / sound | 1.3+ |
| Billing | 1.4 |
| Full product tour | Light tour 1.2; full later |
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
| [`docs/HALO_PRICING_AND_SCALING.md`](./HALO_PRICING_AND_SCALING.md) | Pricing tiers (future) |

---

## Changelog (planning)

| Date | Change |
| --- | --- |
| 2026-08-31 | Canonical doc created from planning session: roadmap 1.1.1–1.6, discovery layer, intent harvest, Saves/header UX, open decisions |
| 2026-08-30 | v1.1 shipped to early access (Cove/Keep on production `/ask`) |
| 2026-08-28 | V2 Sunday spec locked (Paper, Keep loop, play sheet) |

---

*Update this file when scope or direction changes. Detail specs can live in `web/*.md`; this file is the index and source of truth.*
