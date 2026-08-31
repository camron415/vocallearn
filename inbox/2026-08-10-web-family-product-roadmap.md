# Product direction: VocalLearn web wedge (family test → profitable)

**Date:** 2026-08-10  
**Status:** strategy draft for Camron — decide before building website  
**Related:** family notes in `2026-08-10-family-ai-research.md`; mobile Ask→Practice stays your personal lab

---

## One-sentence product

**A personal Ask chat that remembers what you cared about and can quiz you later — text-first, cheap models, optional Practice.**

Not: another ChatGPT clone.  
Not: a course library.  
Not: realtime voice agent (that stays expensive / later / you-only).

---

## What we’re actually building (scope lock)

| In | Out (for family test) |
|----|------------------------|
| Website Ask (type + dictate→text) | Native iOS for family |
| Conversation history they own | Standup / Atlas project tools |
| Soft “Save / quiz me later” on good answers | Always-on aggressive mining spam |
| Tiny Practice loop (approve → quiz) | Full lesson curriculum UX |
| Cheap text models + hard usage caps | Realtime voice chat |
| Login + per-user data in Supabase | Multi-tenant enterprise |

**Positioning for everyday people:**  
“Chat that helps you look things up *and* keeps the useful bits so you don’t forget” — closer to Jesse/Alex habits than Mom/Dad’s pure Google (Mom/Dad may only try Ask once).

---

## Why family feedback pointed here

- **Jesse** already chats for everything and likes personality → text Ask with a fun, consistent voice wins; Snap My AI is mostly **in-app text chat** (plus multimodal), not “phone call realtime tutor.”
- **Alex** wants better answers + context follow-ups → memory + clarifying questions matter more than spaced repetition on day 1.
- **Parents** live in Google → they are not the ICP for v1; don’t design the product around converting them first.

**ICP for first 10 testers:** people who already open a chatbot weekly (Jesse/Alex types), not people who only Google.

---

## Consumer models vs what you run

| Surface | What users feel | Typical economics |
|---------|-----------------|-------------------|
| Snap My AI | Fun, chatty, free-in-app | Subsidized by Snap ads/subs; partners (e.g. Gemini) at wholesale scale |
| Instagram / Meta AI | Free, light | Ads + scale deals |
| Google AI Overview / Gemini free | Free, capped | Ads + upgrade to Advanced |
| ChatGPT free | Free, rate-limited, falls back to smaller models | Plus subscription |

So yes: what family uses is **cheap or free-to-them**, often **mid/small models with caps**, sometimes big models in short bursts. They are not paying your xAI bill.

**Implication:** your family test product must use **fast/cheap text models**, short contexts, and **hard daily message limits** — or you eat the cost.

Voice realtime = different product, different price. Do not put that in front of family.

---

## How SaaS companies fund tokens

1. **Freemium with caps** — free: N messages/day; paid: higher cap + better model  
2. **Soft upsell** — free stays useful; pay for memory length, Practice, personality packs, fewer limits  
3. **Seat / subscription** — $8–20/mo consumer AI is normal; you don’t need ads day one  
4. **Bring your own key (BYOK)** — power users paste their own API key (great for friends who want unlimited; bad for casual family)  
5. **Never** unlimited free on your dime

**Family alpha (you pay):** invite-only, e.g. 20–40 Ask messages/day/person, cheap model only, no voice. Cap invites to 5–10 people. Track cost per user/day.

**Path to profitable:**

```text
Invite alpha (you subsidize, capped)
  → prove weekly return usage
  → paid “Plus” for unlimited / better model / Practice reminders
  → website first; app later when Apple account + demand exist
```

Rough mental math (order-of-magnitude): if cheap chat is ~$0.01–0.05 per short exchange, 30 msgs/day × 10 users ≈ a few dollars/day. Realtime voice can be dollars **per hour**. That’s why text-first is non-negotiable for family.

---

## Lean roadmap (no scope creep)

### Phase W0 — Decide (this doc)
- [ ] Lock one-sentence product above  
- [ ] Agree: website Ask first; native app = Camron lab only for now  
- [ ] Agree: family alpha is capped + invite-only  

### Phase W1 — Family website MVP (2–3 focused builds)
1. Simple web app (Expo web or Next — pick one stack later)  
2. Auth (Supabase)  
3. Ask chat: text + browser speech-to-text if easy  
4. History  
5. Soft button: **Save for Practice** (manual) — not aggressive auto-mine at first for family  
6. Optional tiny Practice page: quiz saved facts in text mode (no voice required)  
7. Per-user daily message counter + soft “limit reached”  

**Success metric:** ≥3 family/friends return on 3+ different days and send you one sentence of feedback.

### Phase W2 — Personalization lite (only if W1 succeeds)
- Short onboarding: name, tone (helpful / funny), 1–2 interests  
- System prompt uses that  
- Still cheap model  

### Phase W3 — Monetization experiment
- Plus tier OR BYOK  
- Higher limits / better model  
- Email digests: “3 facts you saved this week — quiz?”  

### Explicitly deferred
- Realtime voice for family  
- Atlas standup tools  
- Browser extension capturing Google  
- Native iOS distribution to family  
- Ads  
- “Privacy-first local LLM” as launch claim  

---

## Parallel tracks (don’t mix them)

| Track | Audience | Goal |
|-------|----------|------|
| **A. Mobile VocalLearn** | You | Keep improving Ask→Practice as your lab |
| **B. Web family wedge** | Jesse/Alex-type testers | Validate retention + cost before scaling |

Same Supabase/project DNA is fine; **don’t block B on polishing A’s lesson tutor.**

---

## Decisions needed from Camron

1. Confirm product sentence (or rewrite in one line).  
2. Family MVP: **manual Save for Practice** first, or keep **always-on miner + approve** like mobile?  
3. Stack preference for web: **Expo web** (reuse RN) vs **separate Next.js** site?  
4. Family alpha budget ceiling: e.g. max $X/month on API while testing?  
5. Brand on web: still **VocalLearn**, or a simpler consumer name for Ask?

Once those five are answered, next step is a one-page W1 build checklist — then build.
