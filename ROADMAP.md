# VocalLearn — Vocal Spaced Repetition AI Learning App

## Current doc status

**Product vision & roadmap (canonical):** [`docs/PRODUCT_ROADMAP.md`](./docs/PRODUCT_ROADMAP.md)

**Start here for overview:** [`README.md`](./README.md) — live product, screenshots, recruiter summary.

This file is mostly historical VocalLearn native planning.

## Project Vision

A voice-powered learning app where users learn any subject by **speaking facts out loud**. Leverages the **production effect** (speaking aloud improves retention far beyond reading/listening) combined with **AI-powered spaced repetition** and a patient but firm AI tutor.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Mobile App** | React Native + Expo (SDK 52) | Cross-platform iOS/Android, fast iteration, OTA updates |
| **Navigation** | Expo Router (file-based) | Simple, scalable routing |
| **State Management** | Zustand | Lightweight, no boilerplate |
| **Database** | Supabase (PostgreSQL) | SQL power for spaced repetition queries, built-in auth, real-time, Row Level Security |
| **Auth** | Supabase Auth | Email/password + OAuth (Google, Apple) |
| **LLM API** | Grok API (xAI) | Already available, cost-effective |
| **Voice (STT)** | expo-speech-recognition + Whisper API fallback | On-device first, cloud fallback for accuracy |
| **Voice (TTS)** | expo-speech (on-device) | AI tutor speaks prompts and feedback |
| **Real-time Voice** | LiveKit (later phase) | Background voice sessions, AirPods support |
| **Push Notifications** | Expo Notifications | Scheduled/random lesson prompts |
| **Styling** | NativeWind (Tailwind for RN) | Rapid UI development |
| **Testing** | Jest + React Native Testing Library | Unit & integration tests |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  MOBILE APP                      │
│  (React Native / Expo)                           │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Lesson   │  │  Voice   │  │  Spaced Rep   │  │
│  │  Engine   │  │  Engine  │  │  Scheduler    │  │
│  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│       │              │               │           │
│  ┌────┴──────────────┴───────────────┴────────┐  │
│  │         State Manager (Zustand)            │  │
│  └────────────────────┬───────────────────────┘  │
│                       │                          │
└───────────────────────┼──────────────────────────┘
                        │
            ┌───────────┼───────────┐
            │           │           │
     ┌──────┴──┐  ┌─────┴────┐  ┌──┴──────┐
     │ Supabase│  │ Grok API │  │ Whisper  │
     │ (DB +   │  │ (AI      │  │ (STT     │
     │  Auth)  │  │  Tutor)  │  │ fallback)│
     └─────────┘  └──────────┘  └──────────┘
```

---

## Database Schema (Supabase/PostgreSQL)

### Core Tables

```sql
-- Users (extends Supabase auth.users)
profiles
  id              UUID PRIMARY KEY (references auth.users)
  display_name    TEXT
  preferred_mode  TEXT ('voice', 'write', 'both')
  notification_style TEXT ('random', 'scheduled', 'off')
  notification_times JSONB
  daily_goal_minutes INT DEFAULT 30
  streak_count    INT DEFAULT 0
  tier            TEXT DEFAULT 'free' ('free', 'premium')
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

-- Subjects (top-level categories)
subjects
  id              UUID PRIMARY KEY
  name            TEXT NOT NULL
  description     TEXT
  icon            TEXT
  is_community    BOOLEAN DEFAULT false
  created_by      UUID REFERENCES profiles
  created_at      TIMESTAMPTZ

-- Lessons (modules within a subject)
lessons
  id              UUID PRIMARY KEY
  subject_id      UUID REFERENCES subjects
  title           TEXT NOT NULL
  description     TEXT
  order_index     INT
  is_community    BOOLEAN DEFAULT false
  created_by      UUID REFERENCES profiles
  created_at      TIMESTAMPTZ

-- Facts (individual learnable items — the atomic unit)
facts
  id              UUID PRIMARY KEY
  lesson_id       UUID REFERENCES lessons
  content         TEXT NOT NULL          -- The fact itself
  explanation     TEXT                   -- Deeper context
  strictness      TEXT DEFAULT 'medium'  -- 'high', 'medium', 'low'
  order_index     INT
  tags            TEXT[]
  created_at      TIMESTAMPTZ

-- User progress on individual facts (spaced repetition state)
user_fact_progress
  id              UUID PRIMARY KEY
  user_id         UUID REFERENCES profiles
  fact_id         UUID REFERENCES facts
  ease_factor     FLOAT DEFAULT 2.5     -- SM-2 algorithm
  interval_days   FLOAT DEFAULT 0       -- Days until next review
  repetitions     INT DEFAULT 0
  next_review_at  TIMESTAMPTZ
  last_reviewed_at TIMESTAMPTZ
  mastery_level   INT DEFAULT 0         -- 0-5 scale
  times_correct   INT DEFAULT 0
  times_incorrect INT DEFAULT 0
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ
  UNIQUE(user_id, fact_id)

-- Session logs (track each study session)
session_logs
  id              UUID PRIMARY KEY
  user_id         UUID REFERENCES profiles
  lesson_id       UUID REFERENCES lessons
  mode            TEXT                   -- 'voice', 'write', 'both'
  started_at      TIMESTAMPTZ
  ended_at        TIMESTAMPTZ
  facts_reviewed  INT
  facts_correct   INT
  duration_seconds INT

-- Leaderboard entries (opt-in gamification)
leaderboard_entries
  id              UUID PRIMARY KEY
  user_id         UUID REFERENCES profiles
  subject_id      UUID REFERENCES subjects
  mastery_score   FLOAT
  facts_mastered  INT
  updated_at      TIMESTAMPTZ
  UNIQUE(user_id, subject_id)
```

---

## Spaced Repetition Algorithm (SM-2 Modified)

Each fact tracks: `ease_factor`, `interval_days`, `repetitions`.

After a user attempts a fact:
- **Quality score** (0-5) based on AI evaluation of their spoken/written response
- If quality >= 3 (correct): increase interval, increment repetitions
- If quality < 3 (incorrect): reset interval to 1, keep repetitions
- Within a 25-30 min session: review due facts first, then introduce new ones
- In-session micro-repetition: re-quiz missed facts before session ends

---

## AI Tutor Behavior (Grok API Prompt Design)

Every LLM call sends:
1. **System prompt**: Tutor personality (warm, firm, patient professor)
2. **Current lesson facts**: All 10-15 facts with their content & strictness level
3. **User mastery state**: Which facts they know, which they've missed
4. **Current fact being tested**: The specific fact + strictness
5. **User's response** (transcribed speech or typed text)

The AI evaluates meaning, not word-for-word (unless strictness=high for formulas).

### Modes:
- **Teach mode**: AI presents fact, user repeats/explains it back
- **Quiz mode**: AI asks about a fact, user recalls from memory
- **Answer mode**: User asks a genuine question, AI answers, then returns to lesson

---

## Folder Structure

```
vocalLearn/
├── app/                        # Expo Router screens
│   ├── (auth)/                 # Auth screens (login, register)
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                 # Main tab navigation
│   │   ├── _layout.tsx
│   │   ├── index.tsx           # Home / Dashboard
│   │   ├── learn.tsx           # Active lesson screen
│   │   ├── subjects.tsx        # Browse subjects
│   │   └── profile.tsx         # User profile & settings
│   ├── lesson/
│   │   └── [id].tsx            # Individual lesson view
│   ├── session/
│   │   └── [id].tsx            # Active learning session
│   ├── _layout.tsx             # Root layout
│   └── index.tsx               # Entry redirect
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Base UI (Button, Card, Input, etc.)
│   │   ├── lesson/             # Lesson-specific components
│   │   ├── voice/              # Voice UI (waveform, mic button)
│   │   └── session/            # Session components (progress, timer)
│   ├── lib/                    # Core libraries
│   │   ├── supabase.ts         # Supabase client init
│   │   ├── grok.ts             # Grok API wrapper
│   │   ├── voice.ts            # Speech-to-text / text-to-speech
│   │   └── notifications.ts   # Push notification setup
│   ├── engine/                 # Core logic engines
│   │   ├── spaced-repetition.ts  # SM-2 algorithm implementation
│   │   ├── lesson-flow.ts     # Lesson state machine (teach→quiz→review)
│   │   ├── tutor.ts           # AI tutor prompt builder & response parser
│   │   └── scoring.ts         # Response evaluation logic
│   ├── stores/                 # Zustand state stores
│   │   ├── auth-store.ts
│   │   ├── session-store.ts
│   │   ├── lesson-store.ts
│   │   └── settings-store.ts
│   ├── hooks/                  # Custom React hooks
│   │   ├── useVoice.ts
│   │   ├── useSession.ts
│   │   ├── useFacts.ts
│   │   └── useSpacedRepetition.ts
│   ├── types/                  # TypeScript types
│   │   ├── database.ts         # Supabase generated types
│   │   ├── lesson.ts
│   │   └── session.ts
│   ├── constants/              # App constants
│   │   ├── prompts.ts          # AI tutor system prompts
│   │   └── config.ts           # App configuration
│   └── utils/                  # Utility functions
│       ├── format.ts
│       └── time.ts
├── assets/                     # Images, fonts, sounds
├── supabase/                   # Supabase local config
│   ├── migrations/             # SQL migrations
│   └── seed.sql                # Seed data (finance basics lesson)
├── .env.local                  # Environment variables (gitignored)
├── .env.example                # Template for env vars
├── app.json                    # Expo config
├── package.json
├── tsconfig.json
├── tailwind.config.js          # NativeWind config
└── ROADMAP.md                  # This file
```

---

## Development Phases

### Phase 1 — Foundation (Weeks 1-2)
> Goal: Skeleton app with auth, navigation, and one hardcoded lesson

- [ ] Initialize Expo project with TypeScript
- [ ] Set up Expo Router with tab navigation
- [ ] Install & configure NativeWind (Tailwind CSS)
- [ ] Set up Supabase project (cloud)
- [ ] Implement auth flow (register, login, logout)
- [ ] Create database tables (profiles, subjects, lessons, facts)
- [ ] Seed database with "Finance Basics" subject (compound interest, etc.)
- [ ] Build Home screen (dashboard skeleton)
- [ ] Build Subjects browse screen
- [ ] Build Lesson detail screen (shows facts list)

### Phase 2 — Core Learning Loop (Weeks 3-4)
> Goal: User can do a full voice learning session with AI feedback

- [ ] Implement speech-to-text (expo-speech-recognition)
- [ ] Implement text-to-speech (expo-speech) for AI tutor voice
- [ ] Build Grok API integration (tutor prompt + response evaluation)
- [ ] Implement lesson state machine (teach → quiz → review cycle)
- [ ] Build active session screen with voice UI
- [ ] Implement SM-2 spaced repetition algorithm
- [ ] Track user_fact_progress in Supabase
- [ ] Build write-mode input as alternative to voice
- [ ] Session timer (25-30 min with break prompt)
- [ ] In-session micro-repetition of missed facts

### Phase 3 — Polish & Intelligence (Weeks 5-6)
> Goal: Smart scheduling, notifications, and refined AI behavior

- [ ] Implement "next review" scheduling across sessions
- [ ] Build smart session builder (prioritize due facts, mix in new ones)
- [ ] Push notifications (random or scheduled, user preference)
- [ ] Refine AI tutor prompts (strictness levels, personality tuning)
- [ ] Add "answer mode" — user asks questions mid-lesson
- [ ] Session summary screen (stats, facts reviewed, accuracy)
- [ ] Profile & settings screen (mode preference, notification style)
- [ ] Mastery indicators on lesson/subject screens

### Phase 4 — Gamification & Community (Weeks 7-8)
> Goal: Engagement features and user-generated content

- [ ] Mastery tracking visualization (progress bars, streaks)
- [ ] Daily streak system
- [ ] Opt-in leaderboards per subject
- [ ] User-created lessons (create subject → add lessons → add facts)
- [ ] Community lesson browsing (tagged, rated)
- [ ] Session history / analytics screen

### Phase 5 — Premium & Scale (Weeks 9-10)
> Goal: Monetization and production readiness

- [ ] Free tier limits (X minutes/day, limited subjects)
- [ ] Premium features: unlimited sessions, full recaps, deeper open-ended Q&A
- [ ] In-app purchase / subscription (RevenueCat or Expo IAP)
- [ ] Background audio support (learn while driving with AirPods)
- [ ] LiveKit integration for real-time background voice
- [ ] Performance optimization & offline support
- [ ] App Store / Play Store submission prep

### Phase 6 — Future (Months 3+)
- [ ] Fine-tune small open-source model (7B-8B) on tutor conversations
- [ ] Additional LLM providers (fallback, cost optimization)
- [ ] Web app companion
- [ ] Social features (study groups, challenges)
- [ ] Advanced analytics (learning velocity, optimal study times)

---

## Week 1 — Detailed Checklist

**Day 1-2: Project Setup**
- [ ] Create Expo project with TypeScript template
- [ ] Install dependencies (expo-router, nativewind, zustand, @supabase/supabase-js)
- [ ] Configure Expo Router file-based routing
- [ ] Configure NativeWind / Tailwind
- [ ] Set up .env with Supabase URL + anon key
- [ ] Create Supabase project at supabase.com
- [ ] Design & create database tables via Supabase dashboard or migrations

**Day 3-4: Auth & Navigation**
- [ ] Supabase client initialization
- [ ] Auth store (Zustand) — session management
- [ ] Login screen (email/password)
- [ ] Register screen
- [ ] Protected route layout (redirect if not authed)
- [ ] Tab navigation: Home, Subjects, Profile

**Day 5-7: Data & First Screens**
- [ ] Seed "Finance Basics" subject with 2 lessons, 10 facts each
- [ ] Subjects list screen — fetch & display from Supabase
- [ ] Lesson detail screen — show facts for a lesson
- [ ] Home dashboard — greeting, continue learning, daily progress
- [ ] Basic profile screen — display name, logout

---

## Environment Variables Needed

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GROK_API_KEY=your-grok-api-key
EXPO_PUBLIC_GROK_API_URL=https://api.x.ai/v1
```

---

## Key Design Decisions (from Grok Discussion)

1. **Bite-sized facts first** — big recaps are a premium feature
2. **Flexible wording, strict on meaning** — AI evaluates understanding, not exact words (unless strictness=high for formulas)
3. **User chooses notification style** — random vs scheduled
4. **Production effect + spaced repetition** as core science
5. **AI never decides strictness** — we tag it per fact in the database
6. **Every LLM call is stateless** — full lesson context + user state sent each time (no reliance on conversation memory)

---

## Getting Started Commands

```bash
# Create Expo project
npx create-expo-app@latest vocalLearn --template blank-typescript

# Install core dependencies
npx expo install expo-router expo-linking expo-constants expo-status-bar
npm install nativewind tailwindcss zustand @supabase/supabase-js
npm install react-native-url-polyfill @react-native-async-storage/async-storage

# Install voice dependencies (Phase 2)
npx expo install expo-speech expo-speech-recognition

# Install notification dependencies (Phase 3)
npx expo install expo-notifications expo-device
```

---

*This is a living document. Update as decisions are made and phases are completed.*
