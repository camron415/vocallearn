# Atlas call notes — Halo product context

**Source:** `/Users/camrontrost/Downloads/voice-conversation-99057013-913e-4899-8962-8f643d7f9b66.json`  
**Date:** 2026-08-12  
**Note:** Most of this call was personal/career. Product-relevant excerpts only below. Do not treat Atlas standup as Halo product.

---

## Halo as Camron described it (collapsed)

Halo is a **simple, impressive frontend** over Grok/xAI — a personalized Ask agent that:

- Remembers past questions and interests
- Surfaces those on a “fun little screen”
- Lets people ask instead of going to Google
- Later nudges: “want to learn / practice this?”
- Can auto-recognize artifacts like **recipes** and save them for later
- Ships first to **family as a website**, as soon as possible (~a week)
- Must stay **cheap** (token caps, subsidize early, maybe paid later)
- UI must feel **Apple-inspired, clean, actually impressive** — not a cheap website
- Passion project first; profit later. Visible live product matters.

## Cost / model thinking from the call

- Most family users **type** (dictate optional). Text is cheap vs realtime voice.
- Don’t use the absolute cheapest model for anything that needs memory, connecting dots, or trust.
- **Tiered routing:** light model for simple turns; escalate when reasoning/search/depth is needed.
- Pre-generate / cache learning content where possible.
- Keep per-user memory **out of the giant prompt** — store it, inject a short pack.
- VocalLearn already proved latency vs cost tradeoffs for learning; reuse that thinking, don’t redo realtime voice first.

## OpenAI vs Anthropic takeaway (Camron)

Consumer “personal AI companion” didn’t print money at OpenAI scale. Halo should **not** try to be mass ChatGPT. Niche + sticky: memory, keep (recipes/lists), light learn. Family beachhead first.
