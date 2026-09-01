# Halo / Cove — pricing, costs, and scaling plans

**Updated:** 2026-08-21  
**Audience:** Camron, Cursor agents, Atlas phone (Sloane), overnight managers  
**Product:** Halo (family Ask website) + planned Soft Learn / Premium; VocalLearn native is separate brand.

---

## What exists today (baseline for monetization)

| Layer | Status |
| --- | --- |
| **Halo Ask** | Invite-only web chat — history, recents, dictate, sources, mist/sky UI, live on Vercel |
| **AI** | Grok 4.3 + web search (capped); hybrid routing planned for cheap lookups |
| **Backend** | Supabase auth, RLS, chats, invites, usage events, recipes |
| **Cost controls** | ~40 msgs/day cap; **$1/user/week** API budget modeled |
| **Users** | ~4 family → target 10 early access → path to 100 |
| **Roadmap** | Soft Learn (quiz yesterday’s facts) → full Learn on web |
| **Ads** | **Do not plan on ads** — they don’t cover Grok cost and hurt privacy story |

---

## Comparable consumer pricing (2026)

| Product | Model | Typical price |
| --- | --- | --- |
| ChatGPT Plus / Claude Pro / Perplexity Pro | Subscription | **$20/mo** |
| Duolingo Super | Gamified subscription | **~$7–13/mo** |
| Character.AI+ | Premium | **~$10/mo** |
| Notion AI / add-ons | Bundled | **~$8–10/mo** |

**Pattern:** Regular people understand **$5–10/mo** (“cheaper than ChatGPT”) or **$10–15/mo** with Learn/streaks. **$20/mo** only if niche is clearly better than generic chat. **Avoid pay-per-token** for consumers.

---

## Recommended Halo pricing (when charging)

### Free (subsidized at launch)

- ~15–20 asks/week; lookup routing only (weather/news chips)
- No Soft Learn, or 1 review card/day as teaser
- Goal: useful without ~$4+/mo API burn per user

### Plus — **$7–9/mo** (or **$59–79/yr**)

- Higher/unlimited asks with smart hybrid routing
- Full Soft Learn, streaks, recipes polish
- Pitch: personal AI that learns from *your* questions (not generic ChatGPT)

### Family — **$18–25/mo**

- 4–8 seats, one payer (natural unit for households)
- Best lever for revenue per account

### Gems / streak boosts (later, secondary)

- Streak freezes, bonus reviews, “extra asks this week”
- **$2–5** one-offs — upside only, not core model

---

## Cost per user (API + infra)

From Aug 2026 xAI modeling + `inbox/2026-08-19-halo-parking-lot.md`:

| User type | Monthly API cost (with hybrid routing) |
| --- | --- |
| Light free (lookup-heavy) | ~$0.30–0.80 |
| Average free (capped) | ~$1–1.50 |
| Heavy premium (unlimited-ish) | ~$2–4 |
| **Avoid:** 4.3 + search on everything | ~**$4.30/mo** per heavy user |

**Infra at ~100 users:** Vercel usually fine; Supabase Free until Pro (**~$25/mo**) for no-pause + backups when friends depend on it.

**Margin target per paying user:** ~**$6–8/mo** after API if price is ~$10 and hybrid routing works.

---

## Revenue expectations per 100 users

Assume **100 registered**, **~60–70 weekly active**. Freemium conversion typically **2–5%**; tight friends/family network can reach **10–15%**.

| Scenario | Revenue | Costs (API + infra) | Net (approx.) |
| --- | --- | --- | --- |
| **5% × $8/mo** | $40 | $100–120 | **-$60 to -$80** |
| **10% × $9/mo** | $90 | $90–110 | **-$20 to $0** |
| **12% × $9/mo** (healthy niche) | $108 | $80–100 | **$0–30** |
| **8 households × $20/mo** | $160 | $90–130 | **$30–70** |
| **20% × $10 + some family plans** | $200–220 | $110–150 | **$50–110** |
| **Ceiling:** 100% × $8 (unrealistic) | $800 | $200–350 | **$425–575** |

**Realistic at 100 users:** **break-even to ~$100/mo profit** — validates product; not a salary yet.

**Scale reference:**

- **500 users** (same conversion) → ~**$250–500/mo** profit possible
- **1,000+ engaged households** → **$1k+/mo** side business + strong resume story

---

## Career / resume value (independent of profit)

At **~100 weekly actives**, even **break-even** or small MRR is a major junior-tier differentiator:

- Full-stack + auth + LLM ops + optional billing
- Cite: weekly actives, MRR, cost per active user, hybrid routing

Does **not** automatically skip to $100k mid-level; strongly improves **junior/associate** odds and product-company interviews.

---

## Build order before public paid tiers

1. **Hybrid Ask routing** — cheap lookups off 4.3+search (unlocks 2–3× usage on same $1/week)
2. **Soft Learn MVP** — premium hook (Duolingo-style habit)
3. **Family plan** billing when extended friends join
4. **Legal triggers:** under-13 = stop; paid users = Terms; public = full privacy policy

---

## Agent notes

- **Do not** recommend Google ads to fund Grok.
- **Do not** promise “more private than ChatGPT” on the model side until architecture matches (text still goes to xAI).
- For pricing questions, use **this file** + `inbox/2026-08-19-halo-parking-lot.md` (cost/legal detail).
- Live product sync: `atlas/inbox/2026-08-14-vocallearn-project-sync.md` (or latest vocalLearn inbox).
