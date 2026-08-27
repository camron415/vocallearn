# Halo (web)

Invite-only family Ask chat with a Cove / Keep learning loop in Lab preview. Lives in `vocalLearn/web` — separate brand from VocalLearn native, shared Supabase + Grok.

Parent README: [`../README.md`](../README.md)

---

## Live URLs

| Surface | URL | Who |
| --- | --- | --- |
| **Production (V1 Ask)** | https://halo-gules-three.vercel.app | Early access + Family (invited users) |
| **Real Ask** | https://halo-gules-three.vercel.app/ask | Login required |
| **Lab preview (V2 loop)** | https://halo-gules-three.vercel.app/preview | Anyone — no login; dummy data |

Three rollout rings: **Lab** (Camron) → **Early access** (wife, parents) → **Family** (everyone else). Early access and Family share the live URL; the invite button is what differs.

---

## Version 1 — what's live

Signed-in users get the full Ask experience:

- Streaming Grok chat with conversation history
- Recent-topic bubbles on Home, expand-to-chat composer
- Dictation, thinking status, optional Sources
- Mist / Sky themes, Full / Soft motion (auto-downgrades on weak hardware)
- Invite onboarding, settings, per-user daily message cap
- Supabase auth + RLS, server-side Grok key

Code entry points: `src/app/ask/`, `src/app/api/chat/`, `src/components/AskLanding.tsx`, `src/components/ChatThread.tsx`

---

## Version 2 — Lab preview

The Cove / Keep loop is built and walkable at `/preview` (no login). Toggle screens in the top bar: **Home · Chat · Invite · Login**.

**Try the loop:** Mix → **Loop** in the left rail, then use Reset / Demo pack / Due now / Bank / Clear / Miss / Master to walk Ask → Harvest → Keep → Due → Home → Clear → Mastered.

**Visual lab:** Home style mixer (Paper vs Ours skin, palette, ink, lift, scatter). Harvest Shape/Flight/Wake/Dock are locked — do not retune without explicit ask.

**Film capture:** Mix → Start / Stop Replay records a take to `captures/home/latest/` (`npm run capture:sink`).

Product spec: [`HALO-LOOP.md`](./HALO-LOOP.md) · [`../docs/COVE_KEEP_VISION.md`](../docs/COVE_KEEP_VISION.md)

Key files: `src/lib/keep-memory.ts`, `src/components/HarvestFlights.tsx`, `src/components/HomeBubbles.tsx`, `src/components/PreviewSwitcher.tsx`, `src/lib/water-edge.ts`

---

## Run locally

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000.

**Preview (no login):** http://localhost:3000/preview

Env: copy `web/.env.local` from parent keys (see table below). Do not commit it.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Same project as VocalLearn |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `GROK_API_KEY` | Server-only xAI key |
| `GROK_API_URL` | Default `https://api.x.ai/v1` |
| `GROK_CHAT_MODEL` | Chat model (default `grok-4.3`) |
| `GROK_CHAT_REASONING` | Reasoning effort for everyday turns (`none`) |
| `GROK_CHAT_REASONING_SMART` | Effort for clearly hard turns (`low`) |
| `HALO_DAILY_MESSAGE_CAP` | Soft per-user daily user-message cap (default 40) |

---

## Deploy

```bash
npm run deploy:lab      # preview URL — Lab only (default)
npm run deploy:early    # production — only after QA or emergency
```

Do not ship Lab experiments with `--prod` unless Camron says **promote**, **early access**, **production**, or **emergency**.

QA before promote: Safari on iPhone, Chrome desktop, Safari desktop, plus `/preview` (Home, Chat, Invite, Login).

---

## Create invite accounts

1. Supabase Dashboard → Authentication → Users → Add user
2. Email + password (share privately)
3. `profiles` row is created by the existing `handle_new_user` trigger

No public signup UI.

---

## Roadmap

| Phase | Status |
| --- | --- |
| H0 Foundation | Done — Next.js, auth, Vercel |
| H1 Ask MVP | Done — chat, history, Grok, daily cap |
| H2 Glass shell | Done — landing, bubbles, compose expand |
| H3 Motion polish | In progress — droplet morph, water surface |
| H4 Cove / Keep loop | Built in Lab; promote to early access next |
| H5 Soft Learn | Planned — practice cards, calendar scheduler |

Full roadmap: [`../inbox/2026-08-10-halo-web-roadmap.md`](../inbox/2026-08-10-halo-web-roadmap.md)
