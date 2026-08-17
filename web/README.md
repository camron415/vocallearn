# Halo (working title)

Invite-only family Ask chat. Lives in `vocalLearn/web` — separate brand from VocalLearn, shared Supabase + Grok.

## Live URL

**Production:** https://halo-gules-three.vercel.app  

Same Vercel account as Our Story Journey (`personal-f999` / project `halo`).

Redeploy from `web/`:

```bash
npx vercel --prod --yes
```

## Run locally

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**UI preview (no login):** [https://halo-gules-three.vercel.app/preview](https://halo-gules-three.vercel.app/preview) — dummy recents + chat dock. Toggle **Scene: Mist / Sky** and **Motion: Full / Soft** in the top bar.

**Real Ask (login):** [https://halo-gules-three.vercel.app/ask](https://halo-gules-three.vercel.app/ask)

Env: `web/.env.local` (copied from parent Expo keys). Do not commit it.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Same project as VocalLearn |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `GROK_API_KEY` | Server-only xAI key |
| `GROK_API_URL` | Default `https://api.x.ai/v1` |
| `GROK_CHAT_MODEL` | Chat model (default `grok-4.3`) |
| `GROK_CHAT_REASONING` | Reasoning effort for everyday turns (`none`) |
| `GROK_CHAT_REASONING_SMART` | Effort for clearly hard turns (`low`) |
| `HALO_DAILY_MESSAGE_CAP` | Soft per-user daily user-message cap (default 40) |

## Create invite accounts

1. Supabase Dashboard → Authentication → Users → Add user  
2. Email + password (tell them privately)  
3. `profiles` row is created by the existing `handle_new_user` trigger  

No public signup UI.

## Roadmap

See `../inbox/2026-08-10-halo-web-roadmap.md`.

Phases: H0 foundation → H1 Ask MVP → H2 glass landing → **H3 physics/hover (required)** → H4 Learn later.
