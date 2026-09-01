# Halo (web)

Invite-only family Ask chat with a Cove / Keep learning loop in Lab preview. Lives in `vocalLearn/web` — separate brand from VocalLearn native, shared Supabase + Grok.

Parent README: [`../README.md`](../README.md)

---

## Live URLs

| Surface | URL | Who |
| --- | --- | --- |
| **Production (v1.1)** | https://halo-gules-three.vercel.app | Early access + Family (invited users) |
| **Real Ask** | https://halo-gules-three.vercel.app/ask | Login required — Paper UI + Cove/Keep loop |
| **Lab preview** | https://halo-gules-three.vercel.app/preview | Anyone — mixer + dummy data |

Three rollout rings: **Lab** (Camron) → **Early access** (wife, parents) → **Family** (everyone else). Early access and Family share the live URL; the invite button is what differs.

---

## Version 1.1 — live (Early access)

Signed-in users get Paper UI and the full Cove / Keep loop on `/ask`:

- Everything in V1 Ask, plus harvest → Keep → due Home → play rounds → gold ◎
- Grok 4.3 with cheap routing (low reasoning default; search only when needed)
- Keep sync across phone and desktop (`halo_keep_state`)
- Mobile layout pass (iPhone Safari QA)

`/preview` remains the Lab mixer for Camron only.

## Version 1 — Ask foundation (superseded on `/ask`)

- Streaming Grok chat with conversation history
- Recent-topic bubbles on Home, expand-to-chat composer
- Dictation, thinking status, optional Sources
- Mist / Sky themes, Full / Soft motion (auto-downgrades on weak hardware)
- Invite onboarding, settings, per-user daily message cap
- Supabase auth + RLS, server-side Grok key

Code entry points: `src/app/ask/`, `src/app/api/chat/`, `src/components/AskLanding.tsx`, `src/components/ChatThread.tsx`

---

## Lab preview (`/preview`)

The Cove / Keep loop also runs here without login — same mechanics as production, plus mixer tools for development.

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

**iPhone on same Wi‑Fi:** see [`MOBILE-QA.md`](./MOBILE-QA.md) — `npm run dev:lan` then ping `http://<ip>:3000/api/dev/ping`.  
**Pre-promote mobile (recommended):** `npm run deploy:lab` → Vercel preview URL on phone.

See [`HARVEST-OPS.md`](./HARVEST-OPS.md) for harvest telemetry, Lab QA (Settings), and promote checklist.

Env: copy `web/.env.local` from parent keys (see table below). Do not commit it.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Same project as VocalLearn |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `GROK_API_KEY` | Server-only xAI key |
| `GROK_API_URL` | Default `https://api.x.ai/v1` |
| `GROK_CHAT_MODEL` | Chat model (default `grok-4.3` only — no build/fast variants) |
| `GROK_CHAT_REASONING` | Default reasoning effort (`low`) |
| `GROK_CHAT_REASONING_DEEP` | Effort when user asks why / explain / more (`medium`) |
| `HALO_DAILY_MESSAGE_CAP` | Soft per-user daily user-message cap (default 40) |

---

## Deploy

```bash
npm run deploy:lab      # preview URL — Lab only (default)
npm run deploy:early    # production — only after QA or emergency
```

**Solo QA (real `/ask`, not `/preview` mixer):** after `deploy:lab`, open the Vercel preview URL, log in as your admin account, and use `/ask`. Wife/parents stay on the production alias until `deploy:early`.

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
| H4 Cove / Keep loop | **Done** — v1.1 on production `/ask` |
| H5 Soft Learn | Planned — calendar scheduler, Luna tier |

Full roadmap: [`../docs/PRODUCT_ROADMAP.md`](../docs/PRODUCT_ROADMAP.md)
