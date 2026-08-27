# For recruiters — Halo / VocalLearn

**Owner:** Camron Trost · Salt Lake City · https://github.com/camron415

---

## Open these (in order)

1. [README](../README.md) — full product overview (V1 live + V2 preview)
2. **Live site:** https://halo-gules-three.vercel.app
3. **UI preview (no login):** https://halo-gules-three.vercel.app/preview — this is the V2 demo from my resume
4. **Code:** `web/` (Halo) then `app/` (VocalLearn iOS)

---

## One paragraph

I built and operate **Halo**, a TypeScript/React/Next.js product that invited family and early-access users actually use in production. Version 1 is a private AI Ask chat — history, dictation, liquid-glass UI, invite-only auth, Postgres with row-level security, and Vercel deploys I patch after people depend on it. Version 2 (visible in the `/preview` demo) adds a Cove / Keep learning loop: harvest facts from answers, store them as beads, drop due facts onto Home for review, and graduate mastered ones — the Duolingo-side-of-Quizlet layer on top of Ask. In the same repo, **VocalLearn** is a React Native voice tutor I run on a real iPhone (Supabase, Grok, spaced repetition). Together this is full-stack application development — not a tutorial dump.

---

## What to look at (60 seconds)

| | |
| --- | --- |
| **V1 (live)** | Log in at `/ask` if you have an account, or browse `/preview` → Login for the auth flow |
| **V2 (resume demo)** | `/preview` → Mix → **Loop** → walk Ask → Harvest → Keep → Due → Clear → Mastered |
| **The hook** | AI chat that turns answers into facts you bank, review when due, and graduate — Duolingo-side of Quizlet, not another ChatGPT clone |
| **Engineering** | `web/src/lib/keep-memory.ts` (loop state), `web/src/components/HarvestFlights.tsx` (harvest animation), `web/src/app/api/chat/route.ts` (server chat) |
| **Mobile** | `src/hooks/useSession.ts`, `src/engine/spaced-repetition.ts` — where the learning mechanics were first prototyped |

---

## Honest constraints

- Halo is **invite-only**. There is no public signup and no large consumer user count.
- V2 (Cove / Keep loop) is in **Lab preview** — walkable at `/preview`, not yet on the live early-access site.
- VocalLearn native is my research lab; Halo web is the live multi-user surface.
- I am the sole builder: product, design, frontend, backend, deploys, and post-launch patches.

---

## Keywords (grounded in this repo)

TypeScript · JavaScript · React · Next.js · React Native · Expo · HTML · CSS · Git · REST APIs · PostgreSQL · SQL · Supabase · Row Level Security · production deploy · Vercel · cloud · object-oriented TypeScript · AI integration (xAI/Grok) · streaming APIs · animation (Framer Motion) · invite-only auth · spaced repetition · voice (STT/TTS)
