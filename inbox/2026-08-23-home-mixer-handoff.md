# Handoff — Home mixer (2026-08-23)

Cursor froze mid-turn. Code is on disk in this repo. Chat UI lost the last assistant message. The five-minute dictation in the *other* chat is gone unless that chat still has a draft; this file is the backup for **this** Home-mixer thread.

## Paste this into a new Cursor chat

Work in `vocalLearn`. Read `inbox/2026-08-23-home-mixer-handoff.md` and `.cursor/rules/home-mixer.mdc`. Continue Home mixer QA: palettes (Glass/Match/Wash), inner light off by default, Clump + Scatter sliders, Replay film to `web/captures/home/latest`. Harvest chat animation is locked. Lab-only deploys. Do not freeze Home water. After I Replay, read the filmstrip. Local preview: `cd web && npm run dev` → http://localhost:3000/preview and `npm run capture:sink`.

## What we were building

Home-only mixer on `/preview` (Chat tab still has harvest Shape/Flight/Wake/Dock).

- Tone: Glass (default, pale), Match (harvest highlights), Wash (paler)
- Inner light: Off default — kills the light-mode hotspot dark mode already lost
- Clump slider: tightness inside a cluster
- Scatter slider: gutters vs orbiting the greeting (blank above/below composer)
- Replay + Film → `web/captures/home/latest/` (needs `cd web && npm run capture:sink`)

## Files (already in the working tree, not necessarily committed)

- `web/src/lib/home-style.ts`
- `web/src/components/HomeBubbles.tsx`
- `web/src/components/HomeCapture.tsx`
- `web/src/components/PreviewSwitcher.tsx`
- `web/src/lib/harvest-capture-fs.ts`
- `web/scripts/harvest-sink.mjs`
- `web/src/app/globals.css` (Home palettes, lamp, scatter transform)
- `.cursor/rules/home-mixer.mdc`

## Set in stone (do not regress)

- Harvest in-chat flight is good enough; leave it
- Kind colors: who purple, where teal, meaning green, when amber
- Related facts clump; no constellation lines
- One header bead per kind, not stacks
- White click = ask; white hold = Keep; color click = Learn; color hold = source
- Do not `still` Home/header water (that killed liquid physics)
- Lab-only deploys unless Camron says promote / early access / production / emergency
- Live Early-access stays https://halo-gules-three.vercel.app

## How to run

```bash
cd web && npm run dev
# other terminal:
cd web && npm run capture:sink
```

Open http://localhost:3000/preview — Hide Mix, then Show Mix. Home tab: Tone / Inner light / Clump / Scatter / Replay.

## Context / RAM

This thread was extremely long; Cursor and Safari together blew RAM. Prefer a **new chat** with this file. Cursor does keep agent transcripts, but they are not a reliable UI restore after refresh. The durable record is: git + this inbox note + capture filmstrips.
