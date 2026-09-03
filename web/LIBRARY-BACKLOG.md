# Library & Keep UX — parking lot

**Date:** 2026-09-02  
**Context:** Camron feedback after 1.1.2 Library ≡ shipped (recipes-only for now).  
**Canonical loop names:** product **Kept** · bank **Keep** · site **Halo / Cove**. “Library” is a nav label, not a rename of Keep.

---

## Shipped tonight (1.1.2)

- Library ≡ → **Saved recipes** only (`/recipes`). Motion stays in **Settings** only.
- Invite redirect + `/demo` + middleware (separate).
- **Save this recipe** pill under cooking answers. Detect is regex (no extra call). Tap extracts + stores. Stone flyer to Library. Preview mixer **Save pill** for UI with no extract. Live extract on signed-in `/ask`.

---

## Tonight — reasonable (small, unified)

| Item | Effort | Notes |
| --- | --- | --- |
| Library = recipes only | Done | No fake “facts library” until designed |
| Wire **Soft** to harvest flights | ~1 line | Today flights skip only on OS `prefers-reduced-motion`, not in-app Soft — copy in Settings was overstated |
| Settings Motion copy fix | Trivial | Say “morphs, entrances, glass” not “harvest flights” until wired |

---

## Postpone — needs design (1.2+)

### Library as full shelf

**Problem:** “Library” implies recipes **and** harvested facts. Keep beads already show in-progress facts; ◎ shows gold. A third list risks duplication.

**Options (pick one later):**

1. **Library = two tabs:** Recipes \| Facts (read-only grid of Keep + gold, grouped by rank).
2. **Keep beads tap → panel** (same data as header, no new page) — fixes “beads do nothing” without a Library facts page.
3. **◎ badge absorbs gold shelf**; Library only for Saves (recipes/lists) long term.

**UI ideas parked (not tonight):**

- Facts grid: 2-column chips, flip for prompt/answer — nice but new component.
- Recipe page transition animation — polish pass.
- Unify chip visual language (beads vs Home due vs library card).

### Beads not clickable

**Expectation:** first tap on header bead should do *something* (panel with fact detail, or open source chat).

**Minimal v1:** tap bead → small read-only row (prompt + answer + rank), same Kept panel pattern as gold ◎.

**Defer:** full flip animation, editing, delete-from-bead.

### First review on harvest (not wait until tomorrow)

**Problem:** harvest → Keep → wait until next calendar day feels long for encoding.

**Product options (need spec):**

- **Micro-round on land:** one SEE beat immediately after harvest (optional dismiss).
- **Same-day first due:** first interval = “today” for one round only, then calendar 1d/3d/7d.
- **“Try it now” chip** on harvest flyer (1.2 intent UI).

**Touches:** `keep-memory.ts`, harvest land flow, maybe day-cap rules. **Not a tonight hotfix** — schedule 1.2 or 1.1.3 with Camron sign-off.

### Achievements / gold in Library

◎ badge + future achievements may live together. Do not move gold into Library until navigation model is chosen (see options above).

---

## Naming cheat sheet

| User sees | Means |
| --- | --- |
| Keep (header beads) | In progress — not due |
| Home chips | Due today |
| ◎ N | Gold / mastered |
| Library ≡ | Saves (recipes for now) |
| Settings | Account, theme, motion, usage, admin |

---

## Open question for Camron

Before building a facts view: **tap bead → panel** vs **Library facts tab** — which is the primary “show me what I’ve harvested” path?

---

## Design lead — two collection lanes (2026-09-02)

Do **not** merge Keep facts and Library saves. Same *chat action language* later; different destinations.

| Lane | What | When | Destination | Motion |
| --- | --- | --- | --- | --- |
| **Keep** | Closed facts worth reviewing | Auto after stream (V2 lock) | Header beads → Home when due | Kind-colored harvest fly |
| **Library** | Things you might cook / pack / reuse | **Opt-in** pill under the answer | Library ≡ → recipes (then lists) | Neutral stone flyer |

**Why facts stay auto tonight:** the round is the product. Opt-in facts = pending chips, no fly until tap, empty Home if people ignore the pill, wife/parents already live on auto-harvest. That’s 1.2 intent (skip junk), not “save these facts” on every turn.

**Library org (simple):**
1. **Recipes** — kitchen cards (`halo_recipes` already exists).
2. **Lists** — shopping / packing / steps without a dish. Same page later, `kind` column. Tonight: detect list, save into recipes as title + line items if we ship the pill; don’t invent a second UI.
3. **Not in Library:** weather, news, gold facts, achievements.

**Chat pill:** one stone button under the last assistant bubble. Copy `Save this recipe` / `Save this list`. After save: check / “Saved” + disabled. No second Grok turn to *offer* the button — regex (or miner `save` field later). Extract on tap reuses `extractRecipe`.

**Highlights on recipes:** nice unity, not tonight. Fact highlights are kind-colored spans tied to chips. Recipe marks would be a second highlighter (ingredients vs steps) with no play chips. Easy to look half-finished.

### Difficulty (whole vision vs tonight)

| Slice | Score | Why |
| --- | --- | --- |
| Detect + `Save this recipe` pill + extract on tap + Saved state | **4** | Spec already in PATCH-1.1.1; extract + DB exist |
| Neutral flyer to Library button | **5** | Reuse flight code; must not retune harvest z-index 120 |
| Lists as first-class (`kind`, Library sections) | **6** | Schema + RecipesBoard split |
| Recipe/list highlights in the bubble | **6** | New mark type, not harvest://kind |
| Piggyback miner JSON instead of regex | **5–6** | Miner is fact-shaped; extra field + fixtures |
| Facts opt-in (`Save these facts`) | **8** | Core loop change; pending harvest; early-access behavior |

**Tonight if Camron says go:** score ~4–5 — recipe pill only. Lists/highlights/opt-in facts parked.
