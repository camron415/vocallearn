# Discovery layer — Saves, Learn-more, Teach-me

**Status:** Planning (2026-08-31)  
**Context:** VocalLearn voice lessons → Halo adaptation

---

## Three chat actions (below the answer)

| Action | When | Cost | Ships |
| --- | --- | --- | --- |
| **Save this …** | Recipe, list, packing list, etc. detected in reply | Low (one extract call) | **1.1.1** |
| **Learn more …** | 2–3 curiosity chips from same thread | Low (no extra search or 0–1) | **1.2–1.3** |
| **Teach me this** | Topic-worthy ask (not one-line fact) | High (lesson run + facts) | **1.4–1.5** premium |

All reuse the same **fact pipeline** after discovery: chips → Keep → calendar review → Home.

---

## Save (1.1.1)

**UX:** Same row as future learn-more buttons — see **Chat action row** below.  
**Copy:** “Save this recipe” / “Save this list” (dynamic from detect).  
**Tap:** extract → DB → **neutral flyer** to header Saves (stone/paper capsule — **not** when/where/who/meaning colors).  
**Backend:** Extend `halo_recipes` with `kind` or `halo_saves`. Reuse `extractRecipe` → `extractSave`.

---

## Chat action row (shared UI — 1.1.1 foundation)

One component under the **last assistant bubble** in `ChatThread`:

```
┌─────────────────────────────────────┐
│  Assistant answer…                 │
│  [highlighted harvest spans]       │
└─────────────────────────────────────┘
  [ Save this recipe ]  ← 1.1.1 when detect.save
  [ Learn more: … ]     ← 1.2+ (hidden until then)
```

- **Style:** Same as `harvest-more` / compose suggest pills — paper inset, stone hover. **No kind color** on save (unlike harvest beads).
- **Placement:** Below bubble, above composer; max 1 save chip + later max 3 learn-more.
- **Flight:** Parametrize `HarvestFlights` → `CollectFlights` with `targetSelector: [data-saves-pocket]` and neutral `WaterCapsule` (or icon-only orb).

**Detect save (MVP):** After stream `done`, cheap check:
- Regex on user+reply: recipe/cook/ingredients/steps, or list/shopping/packing.
- If ambiguous, one `effort:none` classify call: `{ "save": "recipe"|"list"|null, "title": "…" }`.
- If `null`, no button (no false positives).

**Not harvest:** Saves never create play chips in 1.1.1.

---

## Learn-more (1.2–1.3)

**UX:** 2–3 buttons: “Key events after this battle”, “Who led the Union side”, etc. — generated from user question + answer.  
**Behavior:** Prefill composer or send as follow-up turn (same thread).  
**Harvest:** Follow-up turns still run intent harvest; primary + cluster facts from the *thread* intent.

---

## Teach-me (1.4–1.5 premium)

**UX:** “Teach me this” on depth asks (Civil War battle, how photosynthesis works). Opens lesson sheet (VocalLearn structure): segments, prompts, optional voice, production-effect beats.  
**Output:** Lesson completes → miner extracts **lesson facts** → same chips as harvest → Keep. User already *did* discovery interactively; review still scheduled for later.  
**Premium:** 1–2 free lessons/month on free tier; unlimited on Plus. Meter lesson tokens separately.  
**Code reuse:** VocalLearn `app/` lesson flow, grading, segment types — port logic into web play sheet or dedicated `/lesson/[id]` route.

---

## Why this order

1. **Saves** — small, loved, proves “collect without typing”  
2. **Learn-more** — cheap engagement, trains “curiosity thread”  
3. **Teach-me** — differentiator, expensive, needs harvest quality first  

Reading the chat answer = free discovery. Teach-me = paid/enhanced discovery. Review loop = retention for everyone.
