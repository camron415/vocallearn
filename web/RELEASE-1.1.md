# Halo v1.1 — Early access (shipped 2026-08-30)

**Production:** https://halo-gules-three.vercel.app  
**Git:** `9015a3a` on `halo-ui-streamline` · `halo-web@1.1.0`  
**Rings live:** Early access + Family (same URL; invite type differs)

---

## Included

### Ask
- Streaming Grok **4.3** chat, history, Home → Chat morph, attachments, dictation
- **Cheap routing:** lookup turns (capital, population, weather, etc.) → reasoning `none`, search off, free live feeds when available; normal chat → `low` + 1 search; depth/files → `medium` + up to 2 searches
- Daily message cap (`HALO_DAILY_MESSAGE_CAP`, default 40)
- Usage metering in `halo_events` (token cost; tool calls logged, not yet in cap math)

### Paper UI
- Paper skin on all signed-in routes (`/ask`, login, invite, Settings, History, Chat, play sheet)
- Auth pages match Settings (inset fields, stone buttons)
- Light + dark parity
- Mobile layout pass (dice-5 Home seats, chat wrap, composer grid, Cove + ◎ header, Kept panel)

### Cove / Keep loop
- Ask → harvest → **Keep** header beads → due on **Home** (16 cap) → play round
- SEE-all then SAY-all; partial credit; miss reteach; end card
- Gold off dock → ◎ badge + Kept panel
- Harvest: fuzzy highlights, flyer fallback from answer bubble
- Hold chip → source chat
- **Keep cloud sync** (`halo_keep_state` + `/api/keep`) — phone ↔ desktop
- Day round cap: **3** rounds/day

### Ops
- Admin: Early access + Family invites, usage $
- Harvest telemetry (`halo_harvest_turns`)
- Lab QA tools (localhost/LAN admin only)
- `/preview` mixer stays Lab-only

### Supabase (run on prod)
- `014_halo_harvest_turns.sql`
- `015_halo_keep_state.sql`

---

## Not included (deferred)

| Feature | Notes |
| --- | --- |
| GPT Luna tier | Post–1.1; see `V2-CHIEF-HANDOFF.md` |
| Tour / onboarding guide | Skipped for 1.1 |
| Achievements / XP / streaks | Spec says loop is the game; gamification ~5/10 only |
| Sound / haptics / confetti | Out of scope |
| Open/gist facts in play | Closed facts only (V2 policy) |
| Billing / Stripe / premium tier | Not wired |
| Referral credits | Discussed, not built |
| Full lessons / AI tutor curriculum | Roadmap |
| Tool-call spend in weekly cap | Tokens only today |
| Dictate on SAY-b (round 3) | Post-V2 unless free |
| Replay film / shelf history | Lab only |

---

## Known minor issues (patch candidates)

- Harvest miner still ~50/50 on some capital phrasing (tuning via `halo_harvest_turns`)
- Sunday spec says day cap 2; code uses 3 (intentional for QA)
- `HALO-V2-SUNDAY.md` day-cap line text may not match 3-round cap

---

## Tests at ship

- `npm run test:harvest` — 3/3
- `npm run test:harvest:live:dry` — 9/9
- `npm run build` — pass
- Camron QA: desktop + iPhone Safari, multi-account, Keep sync, harvest fly

---

## What 1.2 is for (planning — not committed)

See chief discussion Aug 2026. Candidates: Luna routing, harvest quality from telemetry, closed-fact tightening, light achievements, small polish. **No billing until habit + harvest quality prove out on real users.**
