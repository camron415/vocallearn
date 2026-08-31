# Harvest ops — read this before promote & tuning

**Canonical reference** for harvest telemetry, QA, mobile testing, and post–early-access review.  
Spec: [`HALO-V2-SUNDAY.md`](./HALO-V2-SUNDAY.md) · Board: [`KEPT-BOARD.md`](./KEPT-BOARD.md) · Handoff: [`V2-CHIEF-HANDOFF.md`](./V2-CHIEF-HANDOFF.md)

---

## Telemetry (Supabase)

**Migration:** `supabase/migrations/014_halo_harvest_turns.sql` (run once in SQL editor).

Every Ask turn runs `mineLearnFromTurn` → logs to **`halo_harvest_turns`**:

| Column | Purpose |
| --- | --- |
| `user_text` | The question |
| `reply_text` | Full assistant answer (up to 12k chars) |
| `skipped` | Policy skip or mine error |
| `skip_reason` | `policy_skip`, `mine_error`, … |
| `cards` | JSON: kind, token, prompt, distractors, `learn_card_id` |
| `miner_raw` | Grok miner JSON (replay / fine-tune) |
| `kinds`, `card_count` | Quick aggregates |
| `conversation_id` | Links to chat |

**Who can read:** you (admin via `halo_is_admin()`). Users see only their own rows.

### Review queries

```sql
-- Recent harvests (tuning set)
SELECT created_at, left(user_text, 80) AS ask, card_count, kinds, cards
FROM halo_harvest_turns
WHERE NOT skipped
ORDER BY created_at DESC
LIMIT 50;

-- Skips (why didn't it harvest?)
SELECT created_at, left(user_text, 80) AS ask, skip_reason, length(reply_text) AS reply_len
FROM halo_harvest_turns
WHERE skipped
ORDER BY created_at DESC
LIMIT 30;

-- Kind mix over time
SELECT unnest(kinds) AS kind, count(*) 
FROM halo_harvest_turns 
WHERE NOT skipped AND created_at > now() - interval '14 days'
GROUP BY 1;
```

### Export locally

```bash
cd web
npm run harvest:export          # needs service role or run in Supabase dashboard
```

Or CSV from Supabase Table Editor → `halo_harvest_turns` → Export.

### Wipe telemetry (fresh start before family)

```sql
DELETE FROM halo_harvest_turns WHERE user_id = '<your-uuid>';
-- Or truncate for full reset (admin only):
-- TRUNCATE halo_harvest_turns;
```

---

## Automated tests

| Command | What |
| --- | --- |
| `npm run test:harvest` | Unit: policy gates, miner validation, dedup, open-score |
| `npm run test:harvest:live:dry` | Gate smoke only (no API spend) |
| `npm run test:harvest:live` | Gate + live Grok miner (needs `GROK_API_KEY`) |

**Before promote, run all three.** Dry should be 9/9; live should pass Nile + Rome miner cases.

### Manual QA checklist (real `/ask` account)

- [ ] Home → Ask → stream starts without second message
- [ ] Harvest flight lands in **Keep** header (not Home)
- [ ] Capital lookup → 1 chip; depth summary → 2–3 mixed kinds
- [ ] Hold chip → opens source chat with highlights
- [ ] **Settings → Lab QA** (localhost): Force due → chips on Home → play round (SEE then SAY)
- [ ] Day cap line after 3 rounds (reset via Lab QA)
- [ ] History list scrolls inside card
- [ ] No spellcheck pill stuck after submit
- [ ] Safari iPhone (see Mobile below)

---

## Lab QA (localhost admin)

**Settings → Lab QA** (admin only, localhost / LAN IP):

| Button | Effect |
| --- | --- |
| **Force due now** | All Keep chips → due on Home |
| **Reset rounds today** | Clears day cap (3 rounds/day) |
| **Clear Keep** | Wipes `halo-keep-v2` localStorage + day cap |
| **Clear all chats** | Deletes your `ask_conversations` (server) |

After chip testing: **Clear Keep** + **Clear all chats** for a clean slate before promote.

---

## Mobile debugging (iPhone Safari)

iPhone cannot open `localhost`. Use **http** only — not https.

### Step-by-step — LAN (same Wi‑Fi)

1. **Quit** any running `npm run preview` / `npm run dev` (Ctrl+C in that terminal).
2. On Mac:
   ```bash
   cd web
   npm run dev:lan
   ```
3. Wait until the terminal prints `✓ Mac can reach LAN URL` (or the ping URLs).
4. On iPhone: same Wi‑Fi as Mac. **Not** guest network. **VPN off**.
5. Safari → type exactly (use your IP from the terminal):
   ```
   http://192.168.1.126:3000/api/dev/ping
   ```
   You must see: `{"ok":true,"host":"192.168.1.126",...}`
6. If ping works → open `http://192.168.1.126:3000/login` → sign in → `/ask`.
7. **Settings → Lab QA** works on LAN IP too (not only localhost).

**If ping does not load** (spinner forever / “Safari can’t connect”):

| Check | Fix |
| --- | --- |
| Guest Wi‑Fi | Join the main home network on both devices |
| iPhone hotspot | Mac on hotspot often blocks reverse traffic — use deploy instead |
| Wrong IP | Terminal prints the right one; Mac IP can change after sleep |
| `npm run preview` still running | Only one server on port 3000; use `dev:lan` alone |
| Router AP isolation | Common on mesh/guest — **use deploy:lab** (below) |

### Step-by-step — Lab deploy (recommended before promote)

Works on any network. No LAN fiddling.

```bash
cd web
npm run deploy:lab
```

1. Copy the **preview URL** Vercel prints (e.g. `https://halo-….vercel.app`).
2. On iPhone Safari, open that URL + `/login`.
3. Sign in with your account → `/ask`.
4. Run the manual QA checklist above.
5. Repeat on wife’s account **after** you promote to early access.

This is the path for **wife smoke test** before `deploy:early`.

**QA matrix (cove-rollout):** Safari iPhone, Chrome desktop, Safari desktop, `/preview`.

---

## Promote trail (business steps)

1. Run tests (`test:harvest` ×3)
2. Camron QA on lab deploy URL (mobile + desktop)
3. Wife account smoke on lab deploy (not production yet)
4. `deploy:early` only when Camron says **promote** / **early access**
5. Note session in `KEPT-BOARD.md` + optional Atlas `session_close`
6. No in-app guide for V1 — tell family in person / text

**Do not** `vercel --prod` until early-access QA passes.

---

## Policy knobs (code)

| File | What |
| --- | --- |
| `src/lib/harvest-policy.ts` | `minReplyLength`, lookup exemptions, ephemeral skip |
| `src/lib/learn-mine.ts` | Miner prompt, `mineLearnFromTurn` |
| `src/lib/ask-route.ts` | `harvestAnswerHint` on depth asks |
| `src/lib/harvest-log.ts` | Turn logging |

---

## Known tuning notes (2026-08-30)

- **Capitals** → usually 1 `where` chip. Expected.
- **Depth summaries** (Revolutionary War) → 2–3 mixed kinds when reply names years, actors, treaties.
- **"Thirteen Colonies" as who** — miner follows "who fought"; may relabel to `where` in future pass.
- **Keep** = localStorage `halo-keep-v2`; **harvest turns** = Supabase; **learn cards** = `halo_learn_cards`.
