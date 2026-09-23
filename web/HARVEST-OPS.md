# Harvest ops — read this before promote & tuning

**Canonical reference** for harvest telemetry, QA, mobile testing, and post–early-access review.  
Spec: [`HALO-V2-SUNDAY.md`](./HALO-V2-SUNDAY.md) · Board: [`KEPT-BOARD.md`](./KEPT-BOARD.md) · Handoff: [`V2-CHIEF-HANDOFF.md`](./V2-CHIEF-HANDOFF.md)

---

## Telemetry (Supabase)

**Migrations:** `014_halo_harvest_turns.sql` (telemetry). `017_halo_events_hold_update.sql` (users can UPDATE own `halo_events` so `ask_hold` actually releases). Run 017 in SQL editor before promoting cost-guard packets.

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

-- Remembered ask, miner returned nothing (auto flag)
SELECT created_at, meta->>'userText' AS ask, meta->>'job', meta->>'askKind', meta->>'skipReason'
FROM halo_events
WHERE kind = 'harvest_miss'
ORDER BY created_at DESC
LIMIT 30;

-- User tapped Don't keep this
SELECT created_at, meta->>'conversationId', meta->'dropped', meta->>'chips'
FROM halo_events
WHERE kind = 'harvest_lock'
  AND coalesce((meta->>'reject')::boolean, false)
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
| `npm run test:harvest` | Unit: policy gates, miner validation, cue uniqueness, open-score |
| `npm run test:ask:claims` | Dry discovery A/B (24 cases): remember vs skip, short asks, Jupiter family |
| `npm run test:harvest:live:dry` | Gate smoke only (no API spend) |
| `npm run test:harvest:live` | Gate + live Grok miner (needs `GROK_API_KEY`) |

**Before promote, run `test:harvest` (includes claims) + build.** Cue uniqueness must stay: do not restore token/answer `knownFactKeys` blocking. Camron lab 2026-09-16: “largest planet” harvests Jupiter. Spec: [`INTENT-HARVEST-1.2.md`](./INTENT-HARVEST-1.2.md) § Cue uniqueness.

### 1.3 close checklist

Do not mark 1.3 done without this. Full list: [`docs/PRODUCT_ROADMAP.md`](../docs/PRODUCT_ROADMAP.md) § 1.3 close checklist.

- [ ] **One workshop** — morph / harvest land / duration mint. Lane 15. Not covered by bells. Frozen 1080 / z 120.
- [ ] Bells: lock-in + gold juice; Listen = first sentence. Lane 16.

### 1.2 closeout (2026-09-17)

Live `/ask` is **1.2.0** (promoted 2026-09-17). Early access and Family share https://halo-gules-three.vercel.app.

**Camron signed the confirm list 2026-09-17** (login, recipes bookmark-fill, Settings, harvest, skip, unbox, morph, seats, Luna/Grok). Save-recipe flyer not required — filled bookmark + Library is enough. Composer ghost blip and thinking-stream UX parked (not 1.2).

**Review sheet signed 2026-09-17** (Camron, light + dark, Safari iPhone + Chrome desktop). Play leftovers closed. Camron said **promote** the same afternoon — `deploy:early` + Luna env flip.

Signed look (do not reopen unless he files a Replay):

- Keyboard left as-is (no auto-activate).
- Mobile SAY: `--paper-inset` bar, Check below the field.
- Desktop SAY: stadium pill (`appearance: none`, no resize grip). Check stays on the right (≥641). Idle Check is ghost (card/transparent); hover darkens like Library/History/Settings.
- Light dots, SAY line, and caret use `--play-ink` (`color-mix` kind 58% + `#111` 42%). Dark uses candy `--play-kind`.
- Recap **Done**: stone fill, `--halo-ink` text (not kind-matched).
- Miss “Not quite” hit (`em`): same as the dots — darker `--play-ink` on light (desktop light was washing in candy `--play-kind`); candy `--play-kind` on dark.
- Overlay pose, morph `--travel` 1080ms, harvest z-index 120, Home seating frozen.

Parked post-1.2 (not a promote blocker): miss reveal sometimes the term, sometimes the full sentence (`quoteParts` wraps `span`/`token` inside `answer`); composer ghost; thinking-stream UX.

Sliced packets from earlier in the sprint (harvest, H1, inspect, lock-in, hamburger, cost guards, Luna) shipped together as **1.2.0**.

**Vercel env on 1.2 (production + preview):**

| Var | Set to |
| --- | --- |
| `HALO_USE_LUNA` | `1`. **Unset + `OPENAI_API_KEY` also turns Luna on** — do not leave it blank; `0` is the kill switch. |
| `OPENAI_API_KEY` | Present |
| `GPT_LUNA_MODEL` | `gpt-4.1-mini` unless Camron picks another |
| `GROK_*` | Unchanged |

Migration **017** (hold UPDATE) already ran. `web/package.json` is **1.2.0**.

**Camron visual confirm** (Safari iPhone, default Text Size + Standard zoom, **and** Chrome desktop). Signed, then promoted. Historical list:

1. **Login / invite** — Paper card, keyboard doesn’t crush it, submit works. (No 1.2 restyle; 60-second glance.)
2. **Recipes / Library** — open a saved recipe, scroll, back. Same Paper as 1.1.2.
3. **Settings** — Light / Dark / Full / Soft still apply. History sheet scrolls.
4. **Empty Home** — greeting + Ask only.
5. **Remember ask** — `what is the largest planet` → Jupiter marks + lock-in + fly to Keep. Line: `Kept — these come back tomorrow.`
6. **Skip Keep** — `hi`, weather, “best ice cream in SLC” (answer + maybe search, **no** Keep).
7. **Recipe ask** — carbonara → **Save** pill, not Keep beads. Library shows it.
8. **Unbox** — Copy / Listen / Save icons; user Copy / Edit. Phone Follow-up: idle one full-width row; type → buttons drop to row 2.
9. **Morph** — Home Ask → chat in 1080ms; Cove back.
10. **Bead inspect** — tap a Keep bead; gold ◎ inspect doesn’t stack with it.
11. **Phone Home seats** — due field is scattered, not piled. Mix 12 shows ~8 + extras in Keep.
12. **Desktop Home** — 16-seat constellation still looks like before (not the phone map).
13. **Luna vs Grok** — small fact ask feels fast (Luna). “current Nintendo news” / attach a file uses Grok. Sources when search ran.
14. **Don't keep this** — drops junk; no extra why-form.

**Not 1.2 — don’t fail the release if missing:** Learn-more chips, Teach-me, tour slides, same-day due drop, TestFlight, Save flyer, thinking-stream rewrite, composer ghost, miss reveal term vs full sentence.

### Older sliced packets (already in lab)

Each originally needed its own promote. They are now one 1.2 tree:

1. Intent harvest + H1
2. Bead inspect
3. Thin lock-in
4. ChromeMenu + fly-trust + mic
5. Cost guards (017 applied)
6. Luna (env flip on promote)

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

**Canonical visual settings** (2026-09-14): default **Text Size**, **Standard** Display Zoom, Bold Text off, Safari Aa 100%, portrait. Larger Text made headers clip and stages scroll; agents assumed default. Detail: [`docs/IOS-FIT-AND-1.3.md`](../docs/IOS-FIT-AND-1.3.md). Do not shrink beads or Home seats. Keep `-webkit-text-size-adjust: 100%`.

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
| `src/lib/ask-intent.ts` | Classify harvest yes/no + answer guide (Grok none) |
| `src/lib/ask-provider.ts` | Luna vs Grok answer routing |
| `src/lib/openai.ts` | Luna chat (max output tokens, no tools) |
| `src/lib/harvest-policy.ts` | `minReplyLength`, lookup exemptions, ephemeral skip |
| `src/lib/learn-mine.ts` | Miner prompt, INTENT block, `mineLearnFromTurn` |
| `src/lib/ask-route.ts` | Tools/effort routing; answer shape is now `intentAnswerGuide` |
| `src/lib/ask-route.ts` | `harvestAnswerHint` on depth asks |
| `src/lib/harvest-log.ts` | Turn logging |

---

## Known tuning notes (2026-08-30)

- **Capitals** → usually 1 `where` chip. Expected.
- **Depth summaries** (Revolutionary War) → 2–3 mixed kinds when reply names years, actors, treaties.
- **"Thirteen Colonies" as who** — miner follows "who fought"; may relabel to `where` in future pass.
- **Keep** = localStorage `halo-keep-v2`; **harvest turns** = Supabase; **learn cards** = `halo_learn_cards`.
