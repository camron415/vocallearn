# Cursor Start Prompt

Paste the prompt below into a new Cursor conversation.

```text
You are taking over work on the VocalLearn repo.

First, read these files in this order:
1. README.md
2. HANDOFF.md
3. .github/copilot-instructions.md
4. supabase/migrations/006_teaching_plans_and_learning_profiles.sql

Then inspect the current implementation surfaces most relevant to the handoff:
- src/hooks/useSession.ts
- app/session/[id].tsx
- src/stores/lesson-store.ts
- src/engine/teaching-plan.ts
- src/engine/fact-learning.ts
- src/engine/teach-copy.ts

After reading, give me a concise takeover summary with:
1. the current product goal
2. the current session/review architecture
3. the latest migration and what it changes
4. the current iPhone rebuild/install workflow
5. the most likely next debugging or implementation steps

Important project context:
- This is a React Native + Expo SDK 54 app using Expo Router, Zustand, Supabase, and xAI/Grok.
- Facts are the atomic learning unit.
- LLM calls are stateless and should use full lesson context plus mastery state.
- `teaching_plan` columns are optional overrides; old lessons can still use the new system through inference.
- The latest confirmed device issue was a stale build on the phone, and a fresh IPA install has now succeeded.
- If you need to work on phone release builds, prefer building into /tmp and installing the exported IPA with devicectl.

Do not start broad refactors. Start by grounding yourself in the docs and the named files above, then propose or make the smallest next useful change.
```