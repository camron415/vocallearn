# For recruiters — Halo / VocalLearn

**Owner:** Camron Trost · Salt Lake City · https://github.com/camron415

---

## Open these (in order)

1. [README](../README.md) — full product overview
2. **Live site:** https://halo-gules-three.vercel.app/preview — no login; walk the learning loop in ~2 minutes (screenshots in README)
3. **Production:** https://halo-gules-three.vercel.app/ask — invite-only; same product family uses this daily
4. **Code:** `web/` (Halo) then `app/` (VocalLearn iOS)

---

## One paragraph

I built and operate **Halo**, a TypeScript/React/Next.js product that invited family and early-access users actually use in production. It is a private AI Ask chat — streaming Grok, history, dictation, invite-only auth, Postgres with row-level security, and Vercel deploys I patch after people depend on it. On top of Ask I shipped a **Cove / Keep** learning loop in v1.1: harvest facts from answers, store them as beads, drop due facts onto Home for review, and graduate mastered ones — the Duolingo-side-of-Quizlet layer, not another ChatGPT clone. In the same repo, **VocalLearn** is a React Native voice tutor I run on a real iPhone (Supabase, Grok, spaced repetition). Together this is full-stack application development — not a tutorial dump.

---

## What to look at (60 seconds)

| | |
| --- | --- |
| **No-login demo** | `/preview` → Mix → **Loop** → walk Ask → Harvest → Keep → Due → Clear → Mastered |
| **Production** | `/ask` if you have an account; otherwise `/preview` is the intended recruiter path |
| **The hook** | AI chat that turns answers into facts you bank, review when due, and graduate |
| **Engineering** | `web/src/lib/keep-memory.ts` (loop state + cloud sync), `web/src/lib/learn-mine.ts` (harvest miner), `web/src/components/HarvestFlights.tsx` (animation), `web/src/app/api/chat/route.ts` (server chat) |
| **Tests** | `cd web && npm run test:harvest` — harvest fixture suites |
| **Mobile** | `src/hooks/useSession.ts`, `src/engine/spaced-repetition.ts` — learning mechanics prototyped on device |

---

## Honest constraints

- Halo is **invite-only**. There is no public signup and no large consumer user count.
- Real usage is **early-access family** — small, high-trust cohort, not growth metrics.
- VocalLearn native is my research lab; Halo web is the live multi-user surface.
- I am the sole builder: product, design, frontend, backend, deploys, and post-launch patches.

---

## Keywords (grounded in this repo)

TypeScript · JavaScript · React · Next.js · React Native · Expo · HTML · CSS · Git · REST APIs · PostgreSQL · SQL · Supabase · Row Level Security · production deploy · Vercel · cloud · object-oriented TypeScript · AI integration (xAI/Grok) · streaming APIs · animation (Framer Motion) · invite-only auth · spaced repetition · voice (STT/TTS)
