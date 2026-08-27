# Halo + VocalLearn

**Halo** is a live, invite-only web product that other people actually use. I own it end to end: TypeScript/React UI, APIs, Postgres, auth, production deploys, and the patches I ship after people start using it.

**VocalLearn** is the related iPhone lab in the same repo: a voice-first spaced-repetition tutor I built and run on a real device.

This is the project I want hiring teams to open first.

## For recruiters (60 seconds)

| | |
| --- | --- |
| **Live product** | [Halo Ask](https://halo-gules-three.vercel.app) — signed-in chat for invited users |
| **UI preview (no login)** | [halo-gules-three.vercel.app/preview](https://halo-gules-three.vercel.app/preview) |
| **What users do** | Ask questions, keep history, dictate, follow source links |
| **What I do after they use it** | Version-control the code, ship patches, redeploy production |
| **Stack** | TypeScript, React, Next.js, JavaScript, HTML/CSS, Git, REST-style APIs, PostgreSQL, Supabase, Vercel, xAI/Grok |
| **OOP / applications** | Typed object-oriented TypeScript across web + mobile — shipped applications, not coursework-only |

Halo is **invite-only** (no public self-serve signup). Family and early-access testers use the live site. I provision accounts, watch what breaks, and push updates.

## Halo (the live product)

Invite-only family Ask chat on the web. Desktop-first, production on Vercel.

- Production URL: https://halo-gules-three.vercel.app
- Real Ask (login): https://halo-gules-three.vercel.app/ask
- Preview (dummy UI, no login): https://halo-gules-three.vercel.app/preview
- Code: [`web/`](./web/) — Next.js + TypeScript
- Web notes: [`web/README.md`](./web/README.md)

**Engineering that matches a software-engineer screen**

- Shipped a production web application (build, deploy, iterate)
- Auth, Postgres, and row-level security so each user’s chats stay theirs
- Server route for chat; client UI for history, recents, composer, dictate
- Cost/latency trade-offs (daily message cap, cheaper model for everyday turns, search only when needed)
- Git history + production patches for people who already use the software

## VocalLearn (iPhone lab)

Voice-first spaced repetition. You get a short lesson, then speak the material back in your own words. An AI tutor scores **meaning** (not exact wording) and schedules reviews.

- React Native + Expo + TypeScript
- Supabase (auth, Postgres, RLS)
- xAI / Grok for tutoring and scoring
- On-device speech-to-text and text-to-speech
- Modified SM-2 review engine
- Shipped to a physical iPhone

**Loop:** lesson → teach → spoken recall → score → schedule. Hint ladder on misses (hint → reveal → forced repeat).

## Stack

- **Web:** React, Next.js, TypeScript, JavaScript, HTML/CSS
- **Mobile:** React Native, Expo, TypeScript
- **Data:** PostgreSQL, Supabase, SQL
- **APIs:** REST-style JSON, xAI/Grok
- **Ship:** Git, Vercel production deploys
- **Cloud:** Vercel + hosted Postgres (Supabase)

## Repo map

```text
web/          Halo — Next.js production web app (look here first)
app/          VocalLearn — Expo Router screens (auth, lessons, session)
src/engine/   Spaced repetition, teaching plans, tutor logic
src/hooks/    Session orchestration
src/lib/      Supabase, Grok, voice helpers
supabase/     Schema migrations
```

## For developers continuing the project

- [`web/README.md`](./web/README.md) — Halo local run, env, deploy
- [`HANDOFF.md`](./HANDOFF.md) — current engineering state
- [`docs/ENGINEERING_README.md`](./docs/ENGINEERING_README.md)
- [`docs/FOR_RECRUITERS.md`](./docs/FOR_RECRUITERS.md) — short hiring-facing summary
