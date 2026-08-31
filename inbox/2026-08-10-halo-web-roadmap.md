# Halo (working title) — family Ask website roadmap

**Date:** 2026-08-10 (updated 2026-08-12)  
**Status:** H3 physics/polish in progress; live at https://halo-gules-three.vercel.app  
**Working name:** Halo (replace when you pick a real name — not “VocalLearn”)

---

## Product (locked)

**Invite-only personal Ask chat for family/friends.**  
Text-first. Beautiful liquid-glass UI. Optional Learn later.  
Camron creates accounts. Max ~8 users. Not public.

**One-liner:** A private AI search/chat that feels as clean as Apple glass — and can grow into “quiz me later.”

---

## Locked decisions


| Topic | Choice |
|-------|--------|
| Surface | **Browser first** (desktop-optimized), mobile polish later |
| Stack | **Next.js** in `vocalLearn/web` for the site; reuse VocalLearn *learning ideas* when Practice lands (don’t block Ask on Expo web) |
| Auth | **Email + password** — Camron provisions every account |
| MVP scope | **Ask only** (chat + history + landing). Learn/Practice = phase after polish |
| Visual bar | Must look **incredible** — liquid glass + hover/physics are **required**, but **not** build step 1 |
| Motion | Full effects by default when hardware allows; **reduced mode** + settings toggle |
| Landing bubbles | MVP = **recent chats**; AI-suggested topics = later (cached, not every boot) |
| Models | Cheap/fast text models; target **family ~100 turns/week ≈ a few dollars** |
| Native app | Stays Camron’s VocalLearn lab — separate track |


---

## Notes from Camron testing (2026-08-12)

- Sign-in works on computer + phone; Ask history shared with VocalLearn (same Supabase) — good.
- Answers can differ slightly from the consumer Grok app (expected: Halo uses API model `GROK_CHAT_MODEL`, default `grok-4-fast-non-reasoning`, not the full Grok app stack with live search/UI reasoning).
- Credibility wishlist (keep simple): visible thinking status + optional Sources block when confident — started.
- Landing bubbles updating after questions — working as designed.

---

## Non-negotiables vs build order

**Non-negotiable (must ship before calling it “done” for family):**  
Liquid-glass look, soft bounce, cursor hover response, floating topic bubbles, reduce-motion fallback.

**Build order (still):**  
1. Boring reliable Ask + auth  
2. Glass visual system on real screens  
3. Landing bubble layout  
4. Hover / spring / light physics polish  
5. Learn (later)

---

## Phases

### H0 — Foundation ✅
- [x] Next.js app in-repo (`web/`)
- [x] Design tokens (glass mist palette, Fraunces + Manrope)
- [x] Supabase auth (email/password login)
- [x] Env wiring (same Supabase + Grok keys; Grok key server-only)
- [x] README: how Camron creates users
- [x] Vercel deploy (same account as Our Story Journey)

### H1 — Ask MVP ✅
- [x] Chat UI (new + continue)
- [x] Persist conversations/messages (`ask_*` tables — shared with mobile Ask)
- [x] Cheap Grok chat completions via `/api/chat`
- [x] Per-user daily message soft cap
- [x] Plain-text replies (no raw markdown asterisks)
- [x] Camron smoke-test: login → ask → history bubble → continue thread

### H2 — Glass shell ✅ (iterating)
- [x] Landing: greeting, “What’s on your mind?”, center compose
- [x] Recent-topic bubbles
- [x] Expand compose → conversation
- [x] Thinking status lines + motion intensity toggle
- [x] Stronger liquid-glass lighting / depth pass
- [x] Soft/Full toggle (auto Soft on weak hardware)

### H3 — Motion / physics polish ✅ started (keep refining)
- [x] Cursor proximity jiggle on bubbles
- [x] Spring open into chat / hero
- [x] Richer idle drift
- [x] Performance gate (downgrade blur/layers on weak devices)
- [ ] Optional: bubble collision soft-push between neighbors
- [ ] Optional: compose expand morph (shared layoutId)

**Vision correction (2026-08-12):** Bubbles must **stay anchored** (center fixed). “Physics” = water-droplet silhouette jiggle (organic border-radius morph + slight inflate/glow on approach), NOT sliding objects around the screen. Reworked toward droplet morph; keep iterating until it feels like liquid, not PowerPoint stretch.

### Credibility (light, ongoing)
- [x] Thinking labels while waiting
- [x] Prompt asks for optional plain Sources (no invented URLs)
- [x] Sources section styled in chat when present
- [ ] Later: real web search / citations if we want Grok-app parity (cost tradeoff)

### H4 — Soft Learn (after family likes Ask)
- [ ] Manual “Save for Practice” or light miner + approve
- [ ] Text quiz first (reuse VocalLearn SM-2 ideas)

### Deferred
- Public signup, ads, realtime voice, Atlas standup tools, AI topic suggestions every page load

---

## Success metrics

- **Internal:** you + wife use it for a week on real questions  
- **Family:** at least 2 others return on 3+ days without you prompting  
- **Cost:** stay under agreed monthly API budget (set after first week of usage logs)  
- **Feel:** someone says the UI looks impressive *without* being asked about design  

---

## Naming

Ship under `web/` and working title **Halo** until you choose. Candidates: short, calm, not “Learn”-coded (Halo, Drift, Clear, Pond).
