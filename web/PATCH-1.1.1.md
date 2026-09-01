# Patch 1.1.1 — Early access hotfix (week of 2026-08-31)

**Status:** Planned — not started  
**Target:** This week; can ship same day if scoped tight  
**Branch:** patch off post-1.1 promote

---

## Scope (four items — keep tight)

### 1. First due = next calendar day (local)

**Problem:** New harvest sets `dueAt = now + 24h` (rolling). Evening harvest → not due until next evening.

**Change:** First interval snaps to **next local calendar day, first Home visit**. Keep `PASS_GAP_DAYS` [1, 3, 7] after successful rounds unchanged.

**Files:** `keep-memory.ts` (`addKeepChip`, `nextDueAt` for `clears === 0`).

**Acceptance:** Harvest at 9pm → chips on Home next morning (first open). Cloud sync preserves `dueAt`.

---

### 2. Timezone — greeting + prompts

**Problem:** Greeting can SSR wrong hour (server UTC). Grok `clockLine` hardcoded `America/Denver`.

**Change:** Client-local greeting after mount. Store browser `Intl` timezone on profile; wire into `clockLine` + live lookups (weather, “today”).

**Acceptance:** Evening testers see “Good evening.” Weather ask uses their TZ in system prompt.

---

### 3. “You’re clear” only when actually clear

**Problem:** `dueCount === 0 && keptCount > 0` fires right after first harvest.

**Change:** “You’re clear” only after clearing today’s Home due. Fresh Keep → time greeting + *“N facts saved — review tomorrow.”*

**Files:** `AskLanding.tsx`, `keep-memory.ts` stats helper.

---

### 4. Saves — recipes, lists (header + chat chip)

**Problem:** `halo_recipes`, `/recipes`, `extractRecipe` exist but no V2 header link; users must type “save this recipe.”

**Change:**
- Header **Saves** entry (near ◎).
- **Chat action row** under last assistant bubble (same component learn-more will use in 1.2).
- If saveable → pill: **“Save this recipe”** / **“Save this list”** (detected label).
- Tap → extract → DB → **neutral flyer** to Saves (stone/paper orb — **not** kind colors).
- Detect: regex + optional cheap classify call; no button if unsure.

**MVP:** `recipe` | `list`. Extend `halo_recipes` with `kind` or new `halo_saves` table.

**Out of scope:** Teach-me, learn-more chips, harvest retuning.

---

## Explicitly out of scope

Tour, Luna, achievements, billing, native apps.

## Verify before ship

`npm run test:harvest` + `npm run build` · evening harvest → morning due · TZ · Saves tap-to-save · Keep sync
