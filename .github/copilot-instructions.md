# VocalLearn — Project Instructions

## Project Overview

VocalLearn is a voice-powered spaced repetition AI learning app built with React Native / Expo. Users learn any subject by speaking facts out loud (production effect) with AI-tutored evaluation and SM-2 spaced repetition scheduling.

## Tech Stack

- **Framework**: React Native + Expo SDK 54, TypeScript
- **Routing**: Expo Router (file-based, `app/` directory)
- **State**: Zustand (stores in `src/stores/`)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **AI**: Grok API (xAI) — stateless calls, full lesson context sent each time
- **Voice**: expo-speech-recognition (STT) + expo-speech (TTS)
- **Styling**: Inline styles (NativeWind planned)

## Architecture

- `app/` — Expo Router screens (tabs, auth, lesson, session)
- `src/engine/` — Core logic: spaced repetition (SM-2), lesson flow state machine, AI tutor prompt builder, response scoring
- `src/lib/` — Service clients: Supabase, Grok API, voice engine, notifications
- `src/stores/` — Zustand state: auth, lessons, session, settings
- `src/types/` — TypeScript types including Supabase database types
- `src/constants/` — AI prompts, app config, color palette
- `supabase/` — SQL migrations and seed data

## Key Design Decisions

- **Bite-sized facts** are the atomic learning unit (10-15 per lesson)
- **AI evaluates meaning, not exact wording** (unless strictness=high for formulas/dates)
- **Every LLM call is stateless** — full lesson context + user mastery state sent each time
- **Strictness is tagged per fact** in the database, never decided by AI
- **Session flow**: INTRO → QUIZ (due facts) → TEACH (new facts) → REVIEW (missed facts) → COMPLETE

## Database

7 tables with Row Level Security: `profiles`, `subjects`, `lessons`, `facts`, `user_fact_progress`, `session_logs`, `leaderboard_entries`. Schema in `supabase/migrations/001_initial_schema.sql`. Seed data (Finance Basics) in `supabase/seed.sql`.

## Development Status

See `ROADMAP.md` for the full 6-phase plan. Check completed items there for current progress.

## Conventions

- Path alias: `@/` maps to `src/`
- Database types use snake_case (matching Supabase), app-layer engine types use camelCase
- Colors defined in `src/constants/config.ts` (dark theme: #16213e background, #1a1a2e surface, #e94560 primary)
- Environment variables prefixed with `EXPO_PUBLIC_` in `.env.local`

## Build & Run

```bash
npx expo start          # Start dev server (scan QR with Expo Go)
npx tsc --noEmit        # Type check
```

## AI Coding Guidelines (Karpathy Principles)

Behavioral rules to reduce common LLM coding mistakes. These apply to every task.

### 1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.
- State assumptions explicitly. If uncertain, ask rather than guess.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If 200 lines could be 50, rewrite it.

### 3. Surgical Changes
Touch only what you must. Clean up only your own mess.
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Remove imports/variables/functions that YOUR changes made unused, but don't remove pre-existing dead code unless asked.
- Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
Define success criteria. Loop until verified.
- Transform tasks into verifiable goals before starting.
- For multi-step tasks, state a brief plan with verification steps.
- Clarifying questions come before implementation, not after mistakes.
