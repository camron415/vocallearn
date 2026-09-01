# Halo / Cove — next agenda (from Atlas call + this chat)

**Date:** 2026-08-18  
**Sources:** Atlas inbox summary `vocalLearn/inbox/2026-08-18-halo-learn-feature-brainstorming-cost-optimizati.md`; Camron follow-up in Cursor.  
**Live site:** frozen at Early access except promote/emergency. New work = Lab only.

No formal product decisions were locked on the call. This is the working agenda.

---

## What I pulled

**Ask is MVP-ready** for the household. Wife is Early access; parents get Early access; siblings later get Family invites.

**Cost:** Everyday Ask currently runs Grok 4.3 with `web_search` on (up to 2 tool calls) unless a path opts out (recipes already do). Atlas flagged web search as the expensive piece: about **$5 / 1k calls** plus tokens, so a weather-style question can land around **2–2.5¢**. The idea is a hybrid, like the big chat apps: route the **top 10 live lookups** off search/4.3, keep 4.3 for real reasoning.

Top 10 from the call: weather, stocks, news, sports, crypto, currency, flights, traffic, movies, local events.

Cheaper path: dedicated free/cheap APIs, or a small non-reasoning model (Grok 4.1 Fast / Build 0.1 — names as discussed; confirm current xAI IDs before wiring).

**Learn (soft, first):** not full VocalLearn lessons. A tiny daily review of **2–3 specific facts the person actually asked yesterday**. Miner on **opted-in** chats only. No guessing broader topics. Skip transient lookups (weather etc.). Privacy: RLS so even admin SQL should not casually read someone else’s facts.

**Learn (later):** predicted topics, full lessons, custom lessons people create. Soft Learn should feel good enough that they *want* that.

**Feel:** low friction, engaging, a little smarter after two minutes — streaks/animations only after the loop works.

**Not this week:** fine-tunes. For ~8 family users, routing + cheaper models beats training. Treat “fine-tune” as prompt/routing unless Camron explicitly wants an xAI fine-tune job.

---

## Recommended order (Lab)

1. **Hybrid Ask routing** — stop paying 4.3 + search for weather/news/stocks-style chips.
2. **Soft Learn MVP** — opt-in, miner, 2–3 fact review, RLS.
3. **Direct APIs** for the top lookups that still need live data after (1).
4. **Learn feel** — streaks, short praise, water-consistent UI.
5. **Full Learn** — topics, lessons, custom curriculum (VocalLearn engine on web).

(1) before (2) because home chips already invite the expensive queries, and the miner would add *more* model calls on an unfixed bill.

---

## Soft Learn shape (proposed, not built)

- Settings: “Use my chats to quiz me” — default **off**.
- After enough opted-in turns: miner (cheap model) proposes stable facts only.
- Next day on Home: 2–3 quiet review cards (or one after the greeting). Tap to answer; short yes/almost feedback; done.
- No approval queue in v1 if the miner is strict; add yes/no later if junk slips through.
- Full lessons stay a later tease, not a second app.

---

## Open questions

1. Learn opt-in: one Settings toggle, or per chat?
2. Where does the 2–3 review live: Home, after greeting, or a small Learn tab?
3. Cost v1: cheaper model and **no** search, or real weather/news APIs (keys + upkeep)?
4. Ship cost routing to Early access before Learn exists, since people are already asking live questions?

Later thoughts (Atlas loop, ads/premium, Supabase, privacy, dark mode, legal) are stored in `inbox/2026-08-19-halo-parking-lot.md`. Coding order above does not change.
