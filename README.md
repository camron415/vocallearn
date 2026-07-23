# VocalLearn

Voice-first spaced repetition learning app. You learn a short lesson, then speak the material back in your own words. An AI tutor scores meaning (not exact wording) and schedules reviews so facts stick.

Built as a real iOS app (Expo / React Native), not a tutorial demo.

## Stack

- **React Native** + **Expo** + **TypeScript**
- **Supabase** (auth, Postgres, RLS)
- **xAI / Grok** for tutoring and answer scoring
- On-device speech-to-text and text-to-speech
- Spaced repetition engine (modified SM-2)

## What I built

- Lesson → teach → spoken recall → score → schedule loop
- Hint ladder on wrong answers (hint → reveal → forced repeat)
- Progress and mastery tracking per fact
- Session UI tuned for voice (pinned question, latency/cost tradeoffs on live AI vs pre-recorded audio)

## Repo map

```text
app/          Expo Router screens (auth, lessons, session)
src/engine/   Spaced repetition, teaching plans, tutor logic
src/hooks/    Session orchestration
src/lib/      Supabase, Grok, voice helpers
supabase/     Schema migrations
```

## For recruiters

This is the strongest example of my front-end / product work: real mobile UI, state, APIs, and shipping to a physical iPhone.

## For developers continuing the project

Detailed build/install notes, handoff state, and debugging history live in:

- [`HANDOFF.md`](./HANDOFF.md)
- [`docs/ENGINEERING_README.md`](./docs/ENGINEERING_README.md)
