# Lane 8 — Library / Saves (plan only)

**Date:** 2026-09-06  
**Holder:** Lane 8 Library lead  
**Status:** plan — no `web/src`, no KEPT-BOARD, no deploy, no promote  
**Live assumed:** early access `136d15f` (Save-this-recipe shipped). Working-tree extras (ChromeMenu hamburger, intent skip on recipes) noted separately.

---

## Live vs lab I assumed

| Surface | What family gets |
| --- | --- |
| **Live `/ask` (136d15f)** | Stone **Save this recipe** pill after cooking answers. Tap → `POST /api/recipes` extract → `halo_recipes` row → stone flyer to Library. Typed “save this recipe” still works as a chat command (no duplicate pill). `/recipes` board: title, ingredients, steps, photo, remove. Header **Library** (not hamburger). |
| **This working tree** | Same save path. Compact header puts Library behind **ChromeMenu** (not live). Intent classify would skip harvesting recipes (`harvest=false` for recipes) — not on 136d15f. |
| **Lab `/preview`** | Mixer **Save pill** demo (`halo-save-offer-demo` + canned Baked Alaska). No extract. |

Harvest dump (2026-09-04, 50 turns): several real cooking asks (casserole, pastel de choclo, muffins, ravioli, garlic-butter pasta, eggs+nectarines). Miner did **not** land Keep chips on those (mix of `policy_skip` and empty `{"cards":[]}`). Save-offer is the intended collect for those turns.

---

## Head scores I own or share

| # | Category | Head | Mine | Verdict |
| --- | ---: | ---: | ---: | --- |
| 16 | Saves / recipes | 6 | **6** | Agree. Shipped and handy; not a reason to return. |
| 13 | Keep collection | 6 | **6** | Agree — but **not a Library score**. Beads are jewelry because they are not tappable. Fix is Keep inspect (Lane 5/3), not a Facts tab. |
| 2 | Simple AI / simple UI | 7 | **7** | Agree if Library stays recipes-only. A Facts tab or lists+facts shelf would drop this to 5. |
| 20 | Onboarding / empty Home | 3 | **3** | Agree for the product. Library’s own empty state is already clearer than Home (~6 locally). Do not pretend a recipe empty-state fixes first harvest. |

No category score I would move more than 0. I would **not** raise Saves to 7 until detect is tighter and Keep vs Library is named on screen. I would **not** drop it to 5: extract, photo, flyer, Postgres, and a real board exist.

---

## Further split (1–10)

| Sub | Score | Evidence |
| --- | ---: | --- |
| Detect precision | **5** | `detectSaveOffer` is regex, no extra model call (correct). Fixtures in `save-offer-check.ts` only cover Nile, weather, pasta+Baked Alaska, tiny reply, typed-save suppression. `RECIPE_ASK` includes `dinner`. `RECIPE_BODY` includes `cups?` (matches “World Cup”) plus chop/dice/oven. Any numbered list plus those words can offer. “How do I make carbonara?” depends on the body, not the ask. |
| Extract quality | **7** | `parseRecipeMarkdown` handles Ingredients / Instructions / numbered steps; strips `## Sources`; titles from bold/heading. Grok JSON fallback only if local parse fails. Family dump recipes (pasta, muffins) would parse locally. Failure copy exists (`Couldn't find a recipe in this chat to save.`). |
| Photo | **7** | Storage `halo-recipe-photos`, compress, signed URLs, HEIC accept, change/remove. Typed-save can attach an image in the same turn. Not the product; it works. |
| Lists | **1** | Unbuilt. `SaveOfferKind = "recipe"` only. Stream event kind is `"recipe"`. Typeahead seed *“Vacation packing list for a beach week?”* has nowhere to land. |
| Keep vs Library confusion | **4** | Nav label is **Library**; sheet title is Library; body says **Saved recipes**. Header beads are unlabeled Keep. Two collect verbs, two flyers, same z-index 120 (stone vs kind — correct). No sentence that says “this is not a fact.” Roadmap still says Keep = harvest **and** Saves into beads (stale). |
| Flyer target | **6** | `CollectFlights` stone orb, 980ms, z-index **120** (do not retune). Lands on `[data-saves-pocket] .stone-btn`. Desktop Library trigger is `GlassButton` (`stone-btn`) — OK. Compact ChromeMenu: first pocket is the **hamburger**, so the orb hits Menu, not Library. |
| Personal vs generic cookbook | **5** | Saves whatever Grok just wrote for *this* ask (eggs+nectarines is personal; “easy pasta” is generic). `conversation_id` is on the row; `HaloRecipe` type and `/recipes` select **omit** it. Board cannot open the source chat. No public cookbook, no import — good. |
| Second-Keep risk | **8** | Today Library is recipes-only. Backlog option 1 (Library = Recipes \| Facts) is the failure mode. Do not take it. |

---

## What wife/parents actually experience

1. Ask for a recipe (or “what’s for dinner”). Answer streams. **Maybe** a stone pill appears under the bubble. Ingredient/step lines get a quiet `--save-mark` wash (`answer--save-offer`) — not kind-colored harvest spans.
2. If they ignore the pill, nothing is stored. Correct: Library is opt-in.
3. Tap → Saving… → stone orb flies to Library (or hamburger on compact lab). Pill becomes **Saved ✓**.
4. Library sheet: one button **Open saved recipes**. `/recipes` is a separate page. Empty copy already teaches the pill.
5. They can add a photo of *their* dish and remove a card. They cannot see that this is distinct from the colored dots unless someone told them.
6. Typed “save this recipe” still saves without the pill (`isSaveRecipeCommand` → extract in `chat/route.ts`). Fine as a power path; most family will never discover it.

Keep facts can still appear on a cooking turn on **live** if the miner emits cards (ravioli/pasta in the dump were `skipped: false` with empty cards — lucky, not guaranteed). Lab intent says recipes are not harvest. That split is Lane 2’s job.

---

## Detect quality (MVP tighten)

**Keep regex.** Do not add a Grok call to *offer* the pill. Cost and latency are the point of `save-offer.ts`.

**Offer `recipe` only when all of:**

1. Ask looks like cooking **or** body has a real kitchen block (Ingredients heading, or ≥2 unit-bearing ingredient lines), **and**
2. Body has a steps block (numbered **or** Instructions/Directions/Method heading), **and**
3. Not a typed save command (already), **and**
4. Not a harvest-style closed lookup (Nile fixture already).

**Tighten `RECIPE_ASK`:** keep `recipe`, `cookbook`, `ingredients`, `meal idea`, `how (do I\|to) (make\|cook\|bake)`. Drop bare `dinner` as sufficient. `cook`/`bake` only with a dish or “how to”, not as a lone stem.

**Tighten `RECIPE_BODY`:** require kitchen units or headings (`tablespoon`, `teaspoon`, `preheat`, `ingredients`), not `cups?` alone (World Cup / “2 cups of tea” trivia).

**Add fixtures (human-failable):**

| Should offer | Should not |
| --- | --- |
| “Give me a simple tomato pasta recipe” + Baked Alaska / garlic-butter pasta dump | Nile harvest reply |
| “recipe for chicken caserole” + casserole dump | Weather |
| “What’s a simple dinner for tonight? I have eggs and nectarines” + that reply | “What’s for dinner?” + news-style numbered list |
| “How do I make carbonara?” + ingredients+steps body | “Who won the World Cup?” + numbered groups |
| | Packing list / salsa advice (until lists exist) |
| | Typed “save this recipe” |

**Lists detect:** write the regex in comments or a parked `detectSaveOffer` branch returning `"list"` — **do not emit** a pill until chief says lists are in. Packing seed stays Ask typeahead, not a Save.

---

## Lists MVP — **no** (this month)

| Question | Answer |
| --- | --- |
| Should lists exist in the product vision? | Yes, later — shopping / packing / steps without a dish. Same *opt-in* lane as recipes. |
| Ship a Lists section now? | **No.** |
| Save packing into `halo_recipes` as title + lines with no new UI? | **No** until recipe detect is tight and Keep vs Library copy is on screen. A silent second shape in the recipes table is how Library becomes a junk drawer. |
| Schema `kind` column? | Lane 7 later. Not this wave. |
| Teach-me / facts opt-in in Library? | **Never** as a Library feature. Facts stay auto Keep (Lane 2/3). |

Why no: Shared goal this wave is personal **memory** (harvest → encode → inspect). Lists do not help three uncoached family rounds. Prefix seed “Vacation packing list…” is a temptation, not a ticket.

---

## Copy so Keep vs Library is obvious

Do not rename Keep, Kept, or Library. Do not put facts in Library. Change **sentences**, not architecture.

**Library sheet** (`LibraryMenu.tsx`)

- Title stays `Library`.
- Label: `Saved recipes` (keep).
- Sub: replace the current how-to with two lines:

> Recipes you choose to save from chat — your pasta, not a cookbook.  
> The colored dots are **Keep**: facts Halo saved to quiz you later.

- Button: `Open saved recipes` (keep).

**Recipes empty** (`RecipesBoard.tsx`)

> No recipes yet. When Cove answers with a dish you actually want, tap **Save this recipe** under the reply. That is separate from Keep (the dots).

**After save pill** (`ChatThread` save row only)

- Idle: `Save this recipe` (keep — already distinct from harvest).
- Done: `Saved to Library` (not `Saved ✓` alone).

**Do not add** “Save these facts” on the same row. **Do not** kind-color recipe lines like harvest spans.

Handoff to Lane 10 for Home empty-state / first-harvest line. Lane 8 only owns Library + pill copy.

---

## Personal: their pasta, not a generic cookbook

What already makes it personal: opt-in; the card is *this chat’s* extract; photo of their plate.

What to add (small):

1. Select `conversation_id` on `/recipes`. Type it on `HaloRecipe`. Card action **Open chat** when the conversation still exists (`onOpenChat` is already passed into `RecipesBoard` and unused).
2. Do not fetch or merge a canonical recipe from the web on save. Keep extract-from-this-reply.
3. Do not add “more like this” / trending / family-shared cookbooks.

That is enough “their pasta.” A public cookbook would erase the product bet.

---

## Improvements vs related 1–10

| Score | Now | Later | Never |
| --- | --- | --- | --- |
| Saves 6 | Detect fixtures + copy + source-chat link | Lists as same-page `kind` after family proof | Facts shelf, opt-in harvest, cookbook import |
| Keep collection 6 | — (not us) | — | Beads in Library |
| Simple UI 7 | One pill, recipes-only Library | Bookmark icon if header crowding (Lane 6) | Mode picker, Recipes \| Facts tabs |
| Onboarding 3 | Library/pill sentences above | Lane 10 first-harvest line | Fake Nile recipes on a real account |

---

## How this lane helps “their questions,” cheaply enough to spread

Library is the **opt-in reuse** pocket: cook this again, not quiz this tomorrow. If it stays thin, Ask can answer dinner without polluting Keep. If it becomes a second Keep, family will not know which orb to trust, and Simple UI dies.

Cheap: regex offer, local parse first, Grok extract only on tap when markdown is messy. No second model call to *decide* to show the button.

Spread test: a parent saves the nectarine-egg dinner, finds it under Library a week later, and never looks for it in the dots.

---

## Top 5 implementation tickets (not now)

Human can fail each one. Files we may touch later: `save-offer.ts`, `save-offer-check.ts`, `recipes.ts`, `LibraryMenu.tsx`, `RecipesBoard.tsx`, `api/recipes/*`, plus the **save-offer row** in `ChatThread.tsx` and land selector in `CollectFlights.tsx` (saves motion only — do not touch harvest z-index 120).

### T8.1 — Detect precision + fixtures

- **Files:** `web/src/lib/save-offer.ts`, `web/src/lib/save-offer-check.ts`
- **Do:** Tighten ask/body rules as above. Add dump-based fixtures (pasta, casserole, nectarine dinner, World Cup, packing list, Nile).
- **Pass:** `npm run test:harvest` (save-offer suite). Human: pasta ask shows pill; capital/Nile/weather/World Cup/packing do not.
- **Fail:** Pill on a numbered news list, or missing on “how do I make carbonara?” with a normal kitchen reply.

### T8.2 — Keep vs Library copy

- **Files:** `LibraryMenu.tsx`, `RecipesBoard.tsx`, `ChatThread.tsx` (save row / `Saved to Library` only)
- **Do:** Copy block above. No new components.
- **Pass:** A new user can say, after one recipe save, where the recipe went vs what the dots are.
- **Fail:** Sheet still only says “Recipes you saved from chat” with no Keep contrast; pill still says only `Saved ✓`.

### T8.3 — Flyer lands on Library (or Menu that contains it)

- **Files:** `CollectFlights.tsx`, maybe `LibraryMenu.tsx` / `ChromeMenu.tsx` (`data-saves-pocket`)
- **Do:** Land on the Library trigger when it is visible; on compact, landing on the hamburger that opens Library is OK if that node is the pocket. Do **not** retune z-index 120 or harvest flights.
- **Pass:** Desktop orb hits Library. Phone (live, no hamburger) hits Library. Lab compact hits Menu pocket, not Cove/Keep.
- **Fail:** Orb dies at viewport `(0.82w, 36)` or hits a Keep bead.

### T8.4 — Source chat on the card (personal)

- **Files:** `web/src/lib/types.ts` (`conversation_id?`), `web/src/app/recipes/page.tsx` select, `RecipesBoard.tsx`
- **Do:** If `conversation_id` is set and still in `conversations`, show a text control that calls existing `onOpenChat`. Hide if chat was deleted (`ON DELETE SET NULL`).
- **Pass:** Save pasta from chat A; open Library; jump back to that thread.
- **Fail:** Dead button, or a new “facts” row.

### T8.5 — Extract fixtures from real family cooking replies

- **Files:** `recipes.ts` (only if parse bugs), `save-offer-check.ts` (parse cases)
- **Do:** Assert local parse on garlic-butter pasta, blueberry muffins, chicken casserole, Baked Alaska. No Grok in the test. Fix heading variants (`### Ingredients`, `What you’ll need`).
- **Pass:** Those four return a dish title + ≥2 ingredient lines + ≥2 steps without a model.
- **Fail:** Title `"Saved recipe"` for a bold dish name, or empty ingredients on a standard Grok card.

**Out of the five:** photo polish, lists, miner `save` field, recipe highlights as harvest marks.

---

## Handoffs

| Lane | Need |
| --- | --- |
| **2 Harvest** | Keep skipping recipes/how-to from Keep. Live dump already mostly empty; do not “improve” harvest by chipping garlic amounts. Intent prompt already says recipes = no harvest. |
| **3 Keep** | Do not read `halo_recipes` into Keep JSON. Overflow/inspect APIs are for beads, not recipes. |
| **5 UI** | Bead inspect stays under Keep / ◎. Lane 8 will not add a Facts grid. Paper tokens for `--save-mark` stay stone, not kind. ChatThread harvest highlights are yours; save-offer row is ours — split the file if both implement. |
| **6 Mobile** | Live iPhone still shows Library as its own header action (ChromeMenu not promoted). Compact lab: flyer → hamburger. Don’t hide Library behind Menu on live until flyer + copy land. |
| **7 Backend** | No `kind` column until lists are approved. `halo_recipes` + RLS is fine. Photo bucket stays private. |
| **10 Product** | First-harvest tour line is yours. We only supply Library/pill sentences. Defend: Library ≠ Keep. Stale roadmap line “Keep = harvest + Saves into beads” should be struck when you rewrite. |
| **1 Ask** | Typed `isSaveRecipeCommand` lives in `chat/route.ts`. Leave it. Do not add a model picker or Teach-me intercept on cooking. |
| **4 Review** | Play sheet never opens a recipe. |

---

## Do not do

- Implement anything this chat.
- Edit `web/src`, `app/`, `supabase/`, family `/ask`, `web/KEPT-BOARD.md`.
- Deploy or promote.
- Turn Library into a second Keep (Facts tab, gold shelf, achievements).
- Opt-in facts (`Save these facts`) — 8/10 loop change; parked in `LIBRARY-BACKLOG.md`.
- Lists UI or `kind` migration this wave.
- Recipe/list highlights as `harvest://kind` marks.
- Piggyback miner JSON `save` field until regex detect has dump fixtures.
- Public/shared cookbook, import, or “more recipes like this.”
- Retune harvest z-index **120** or morph `--travel` **1080ms**.
- Touch Keep beads, `keep-memory`, harvest miner, play sheet, AskShell.
- Rename Library to Keep or Keep to Library.

---

## Files I would touch (later, after chief converge)

`web/src/lib/save-offer.ts` · `save-offer-check.ts` · `recipes.ts` · `components/LibraryMenu.tsx` · `RecipesBoard.tsx` · `ChatThread.tsx` (save row) · `CollectFlights.tsx` (land node only) · `app/api/recipes/route.ts` (only if extract contract changes) · `app/recipes/page.tsx` · `lib/types.ts`

**Do not own:** `keep-memory.ts`, `learn-mine.ts`, `HomeBubbles.tsx`, `HarvestFlights.tsx` z-index, `KeepPocket.tsx`.

---

## Blocked on

- Chief convergence (max 8 implementation tickets across 11 lanes). ChatThread / CollectFlights overlap with Lane 5/6.
- Camron: lists are a **no** unless he overrides. Bead inspect vs Library facts was already an open question in `LIBRARY-BACKLOG.md` — this plan picks **beads, not Library**.

---

## Write-back (also in chat)

```text
LANE: 8 Library
SCORES I DISAGREE WITH: none (Saves 6, Keep collection 6, Simple UI 7, Onboarding 3 — Keep 6 is not ours to fix in Library)
FURTHER SPLIT: detect 5, extract 7, photo 7, lists 1, Keep-vs-Library copy 4, flyer 6, personal-vs-cookbook 5, second-Keep risk 8 (today we correctly avoid it)
TOP 5 TICKETS: T8.1 detect+fixtures; T8.2 Keep vs Library copy; T8.3 flyer land on Library/Menu; T8.4 source-chat on card; T8.5 parse fixtures from family cooking dumps
HANDOFFS: Lane 2 skip recipes from harvest; Lane 5 bead inspect not Facts tab; Lane 6 flyer vs hamburger; Lane 10 strike stale “Saves into Keep beads”; Lane 7 no kind column yet
DO NOT DO: Facts tab, opt-in facts, lists this month, cookbook, retune z-index 120, implement/promote, touch Keep/miner/play
```
