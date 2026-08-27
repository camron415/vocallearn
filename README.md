# Halo + VocalLearn

**Halo** is a live, invite-only web product that real people use today. I own it end to end — TypeScript/React UI, APIs, Postgres, auth, production deploys, and the patches I ship after family and early-access testers start depending on it.

**VocalLearn** is the related iPhone lab in the same repo: a voice-first spaced-repetition tutor I built and run on a physical device.

This is the project I want hiring teams to open first.

---

## Quick links

| | |
| --- | --- |
| **Live product (V1)** | [halo-gules-three.vercel.app](https://halo-gules-three.vercel.app) — signed-in Ask for invited users |
| **UI preview (no login)** | [halo-gules-three.vercel.app/preview](https://halo-gules-three.vercel.app/preview) — full V2 loop + motion lab |
| **Code** | [`web/`](./web/) (Halo) · [`app/`](./app/) (VocalLearn iOS) |
| **Stack** | TypeScript, React, Next.js, React Native, PostgreSQL, Supabase, Vercel, xAI/Grok |
| **Recruiter summary** | [`docs/FOR_RECRUITERS.md`](./docs/FOR_RECRUITERS.md) |

Halo is **invite-only** (no public signup). I provision accounts, watch what breaks, and push production updates.

---

## The idea

Most AI chat apps are write-only — you ask, you read, you forget. Halo starts as a beautiful private Ask (like a family Grok), then grows into something that helps you **actually remember** what you learned.

**Positioning:** Duolingo-side of Quizlet, not a video game. Ask stays the front door. The learning layer is optional juice on top of real answers — a daily tidy for people who want it, not a separate study app bolted on.

**Gamification level:** about 5 out of 10. Light collection, mastery rings, a clear-the-day moment — still obviously a learning tool, not an RPG. No HP, maps, or combat chrome.

---

## V1 vs V2 at a glance

| | **V1 — Halo Ask** | **V2 — Cove / Keep loop** |
| --- | --- | --- |
| **Status** | Live in production | Built in Lab preview (`/preview`) |
| **Who uses it** | Early-access + family (invited) | Anyone can walk the demo — no login |
| **Core job** | Ask questions, keep history, pick up threads | Turn answers into facts you review and master |
| **Learning loop** | Not yet — Ask only | Full Ask → Harvest → Keep → Due → Clear → Mastered |
| **Resume demo** | The live site | The `/preview` loop (Mix → **Loop**) |

V1 is the product people depend on today. V2 is where the differentiated learning mechanics live — already built and walkable, waiting to promote to early access after motion polish.

---

## Version 1 — Halo Ask (live today)

What early-access and family users actually use on the web.

**Product:** A private AI search and chat that feels as clean as liquid glass. Ask real questions, get streaming Grok replies, keep conversation history, and return to recent topics from floating bubbles on Home.

**Live URLs**

- Production: https://halo-gules-three.vercel.app
- Real Ask (login): https://halo-gules-three.vercel.app/ask
- Preview shell (no login): https://halo-gules-three.vercel.app/preview

**What's shipped**

- Invite-only auth — email/password accounts I create in Supabase; invite links for onboarding
- Ask chat with streaming Grok replies, conversation history, and recent-topic bubbles on Home
- Dictation, thinking status, optional Sources block when the model is confident
- Mist / Sky visual themes and Full / Soft motion toggle (auto-downgrades on weak hardware)
- Liquid-glass UI — water-surface lighting, droplet morph on hover, spring open into chat
- Per-user daily message cap (~40/day) and cost-aware model routing
- Row-level security so each user's chats stay theirs
- Production deploys on Vercel with Git-versioned patches after real usage

**What V1 deliberately does not include yet:** harvesting facts from answers, spaced review, or the Keep/Home loop. That is all V2.

**Rollout rings**

| Ring | Who | Surface |
| --- | --- | --- |
| Lab | Camron | Preview deploys only |
| Early access | Wife, parents | Live URL |
| Family | Siblings and extended family | Same live URL; different invite type |

---

## Version 2 — Cove / Keep loop (Lab preview)

The learning layer. Turn a great answer into facts you bank, review when due, and graduate when mastered.

**Status:** Built and walkable in the Lab preview (`/preview`). Not yet promoted to the live early-access site. **This is the version shown in my resume demo** — a working preview of where the product is headed.

**Try it:** open `/preview` → left rail **Mix → Loop** → use Reset, Demo pack, Due now, Bank, Clear, Miss, and Master to walk the full cycle without an account.

### Three seats (where facts live)

| Seat | Meaning | What the user sees |
| --- | --- | --- |
| **Keep** | Not due — banked for later | Header beads, one per fact, cap 30 |
| **Home** | Due — ready to review today | Field of chips to clear (up to 16 seats) |
| **Mastered** | Done — graduated | Count in the header shelf, off the daily field |

Facts harvested from an Ask land in **Keep**, not on Home. They only appear on Home when the scheduler marks them due. The whole library never floods the field at once.

### The daily loop

```
  Ask a question
       ↓
  Harvest — key spans light up in the answer (who / where / when / meaning)
       ↓
  Keep — facts fly into header beads; same Ask stays a cluster
       ↓
  Due — scheduler drops a cluster onto Home as chips
       ↓
  Clear — tap a chip; review its cluster (same conversation context)
       ↓
  Ok → bead flies back to Keep with a mastery mark (bronze → silver → gold)
  Miss → stays due; round continues
       ↓
  Mastered — three successful clears → fact leaves the daily row
       ↓
  You're clear — Home empty, Keep calm, quiet celebration
```

**Fact kinds** — color means type, not mood:

| Kind | Color role | Typical facts |
| --- | --- | --- |
| **who** | names, people | "Herodotus", "the pharaoh" |
| **where** | places | "Egypt", "the Mediterranean" |
| **when** | dates, durations | "4,130 miles", "ancient period" |
| **meaning** | definitions | "the gift of the Nile" |

Related facts from the same Ask **clump** on Home. Tap one chip to play the whole cluster.

**Mastery shelf** — Keep beads sort gold → silver → bronze → new (left to right). Rank shows as a metal ring on the kind color — not gray bands, not bigger beads. New harvests dock on the right of the new band.

**Design rules that matter**

- Ask is always the front door — Home with nothing due is just a clean composer and greeting
- Harvest in one visit does **not** drop beads onto Home; they bank in Keep first
- Gamification stays light: clear-the-day copy + a Keep pulse, not confetti every morning
- Full RPG / medieval kingdom aesthetic is explicitly out — "Keep" is the metaphor

### Recently built (V2)

Concrete work shipped in the last few weeks:

- **Full loop in Lab** — Ask → Harvest → Keep → Due → Home → Clear → Mastered, walkable end to end
- **Persisted Keep** — `keep-memory.ts` stores beads, clears, mastery rank, and cluster grouping in browser state
- **Harvest flights** — facts animate from chat answer into the Keep row; composer morphs between Home and chat
- **Home = due only** — pocket/header is Keep only; no library clutter on the field
- **Mastery clear** — cluster review with ok/miss grading; three clears → mastered shelf
- **Full-clear moment** — "You're clear" greeting + Keep pulse when Home is empty and facts are banked
- **Paper vs Ours skins** — flat pastel Paper look and wet liquid-glass Ours look, switchable in the Home mixer
- **Home style mixer** — palette, ink, lift, scatter, inner light — tunable without code changes
- **Water physics** — surface lighting, droplet border-radius morph on cursor proximity, spring stage transitions
- **Lab harness** — PreviewSwitcher with Loop mode, demo pack, Due now shortcut, Replay + film capture for visual QA
- **Invite + auth preview** — full onboarding flow previewable without a real account

### Still in progress

- Bubble collision soft-push and compose expand morph (motion polish)
- Real calendar-day due scheduler (Lab uses "Due now" for testing)
- Promoting the loop from Lab preview to the live early-access site
- Soft Learn practice mode with AI-generated variations on harvested facts
- Daily habit nudges and streaks
- Overflow handling when Keep exceeds 30 beads

Product spec: [`web/HALO-LOOP.md`](./web/HALO-LOOP.md) · [`docs/COVE_KEEP_VISION.md`](./docs/COVE_KEEP_VISION.md)

---

## VocalLearn — iPhone lab (native)

Voice-first spaced repetition, separate from the Halo web product but sharing Supabase and Grok. This is where I prototyped the core learning mechanics that V2 adapts for the web.

**Loop:** lesson → teach → spoken recall → AI scores meaning (not exact wording) → SM-2 schedules the next review.

**What's built**

- React Native + Expo app shipped to a physical iPhone
- On-device speech-to-text and text-to-speech
- Modified SM-2 review engine with per-fact strictness
- Teaching plans with inferred lesson frames and per-fact copy
- Hint ladder on misses: hint 1 → hint 2 → reveal → forced repeat
- Supabase auth, Postgres, and row-level security

The web Cove loop is where active product work lives today. VocalLearn native is the research lab for voice-first learning mechanics.

---

## Stack

| Layer | Technology |
| --- | --- |
| **Web UI** | React 19, Next.js 16, TypeScript, Tailwind CSS, Framer Motion |
| **Mobile** | React Native, Expo SDK 54, Expo Router, Zustand |
| **Data** | PostgreSQL, Supabase (auth, RLS, migrations) |
| **AI** | xAI Grok (streaming chat, semantic scoring) |
| **Ship** | Git, Vercel (web), Xcode archive (iOS) |

---

## Repo map

```text
web/              Halo — Next.js production web app (start here)
  src/app/        Routes: /ask, /preview, /login, /invite
  src/components/ UI: glass shell, harvest, Keep, Home bubbles
  src/lib/        Grok client, Keep memory, harvest scoring
app/              VocalLearn — Expo Router screens
src/engine/       Spaced repetition, teaching plans, tutor logic
src/hooks/        Session orchestration
supabase/         Schema migrations
docs/             Product vision, pricing, recruiter notes
```

---

## Roadmap (high level)

| Phase | Goal |
| --- | --- |
| **Now** | Finish V2 motion polish; promote Cove loop to early access |
| **Next** | Calendar-day due scheduler; Soft Learn practice cards |
| **Later** | Pricing tiers (Free / Plus / Family); invite-for-a-month referral; daily habit |
| **Parked** | Public signup, ads, realtime voice, full RPG gamification |

Details: [`inbox/2026-08-10-halo-web-roadmap.md`](./inbox/2026-08-10-halo-web-roadmap.md) · [`docs/HALO_PRICING_AND_SCALING.md`](./docs/HALO_PRICING_AND_SCALING.md)

---

## For developers

- [`web/README.md`](./web/README.md) — local run, env vars, deploy commands
- [`HANDOFF.md`](./HANDOFF.md) — current engineering state (VocalLearn native)
- [`docs/ENGINEERING_README.md`](./docs/ENGINEERING_README.md) — deeper technical notes

## For recruiters

- [`docs/FOR_RECRUITERS.md`](./docs/FOR_RECRUITERS.md) — 60-second summary, honest constraints, keywords
