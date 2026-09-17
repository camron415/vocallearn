# Discovery layer — Saves, Learn-more, Teach-me

**Status:** Planning (updated 2026-09-01)  
**Context:** VocalLearn voice lessons → Halo adaptation  
**Canonical index:** [`docs/PRODUCT_ROADMAP.md`](../docs/PRODUCT_ROADMAP.md) § Trajectory adjustment

---

## Principle (2026-09-01)

**Two doors, not one mode.** Most asks get a normal answer. Learning tools are **opt-in clicks** on the questions that deserve them — not Socratic intercept on every send.

| Intent | Answer | Discovery actions |
| --- | --- | --- |
| Lookup (capital, count, date) | Immediate | Harvest closed fact; no Teach-me |
| Transient (weather, news, small chat) | Immediate | Skip harvest |
| Depth (how/why, concept, battle, homework struggle) | Immediate | Offer **Teach me this** when shipped |
| Recipe / list | Immediate | **Save this …** (1.1.1) |

Later: more integrated lesson flow on play sheet + mobile voice — still opt-in from depth asks.

---

## Three chat actions (below the answer)

| Action | When | Cost | Ships |
| --- | --- | --- | --- |
| **Save this …** | Recipe, list, packing list, etc. detected in reply | Low (one extract call) | **1.1.1** |
| **Learn more …** | 2–3 curiosity chips from same thread | Low (no extra search or 0–1) | **1.3** |
| **Teach me this** | Depth ask only (not one-line lookup) | High (lesson + facts) | **Thin 1.3** · integrated **1.4** · premium **1.5** |

All paths that produce facts → same **fact pipeline**: chips → Keep → calendar review → Home.

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
  Assistant answer (field type, no card)…
  [highlighted harvest spans]
  [ Copy ] [ Listen ] [ Save ]   ← icons only, one row; Save when detect.save
  [ Learn more: … ]     ← 1.3
  [ Teach me this ]       ← 1.3+ depth asks only
```

- **Style:** Icon-only, one nowrap row, header stone wash. **No kind color** on save (unlike harvest beads).
- **User Edit today:** prefills Follow up. **Later (1.3+):** edit the same bubble in place.
- **Placement:** Below the assistant answer, above composer; max 1 save chip + later max 3 learn-more + 1 teach-me.
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

## Teach-me (1.3 thin → 1.5 premium)

**When to show:** Depth / study-worthy asks only. **Hide** on lookups, weather, recipes (use Save), and throwaway chat.

**UX (phased):**

| Release | Experience |
| --- | --- |
| **1.3 thin** | `[ Teach me this ]` pill → short interactive climb on **existing play sheet** (SEE/SAY beats, not a new UI shell) |
| **1.4 integrated** | Lesson feels native in chat + sheet; optional voice on mobile shell |
| **1.5 premium** | Full VocalLearn-style depth; metering; tier limits |

**Output:** Lesson completes → miner extracts **lesson facts** → same chips as harvest → Keep. User already *did* encoding interactively; calendar review still schedules for later.

**Premium (1.5):** 1–2 free lessons/month on free tier; unlimited on Plus. Meter lesson tokens separately.

**Code reuse:** VocalLearn `app/` lesson flow, grading, segment types — port logic into web play sheet or dedicated `/lesson/[id]` route.

**Not in scope:** Withholding the answer until Socratic steps complete; global curriculum maps; storing copyrighted textbook pages for reuse.

---

## Why this order

1. **Saves** — small, loved, proves “collect without typing”  
2. **Intent harvest (1.2)** — only harvest what’s worth remembering  
3. **Learn-more** — cheap engagement, trains “curiosity thread”  
4. **Teach-me click (1.3)** — encoding for depth asks; reuses play sheet  
5. **Mobile shell (1.4)** — selling point once Safari QA is solid  
6. **Teach-me premium (1.5)** — full tutor depth when harvest + thin lesson prove out  

Reading the chat answer = free discovery. Thin Teach-me = free opt-in encoding. Full tutor = paid/enhanced discovery. Review loop = retention for everyone.
