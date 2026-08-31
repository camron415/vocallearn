# Lane A — Auth pages Paper unify (Composer)

**Goal:** Login + invite sign-up match V2 Paper (same voice as Settings / History / Home). No Opus. No liquid `WaterPane` on auth.

**Why now:** Camron hit `/login` from localhost `/ask` — still V1 glass/water. Blocks real-account QA before promote.

---

## Scope (in)

| Route | Component | Real page |
| --- | --- | --- |
| `/login` | `LoginForm.tsx` | yes |
| `/invite/[token]` | `InviteSetup.tsx` | yes |
| Shared shell | `AuthShell.tsx` | yes |
| Preview demo | `preview?view=login` / `view=join` | keep `demo` behavior |

## Out of scope

- Mixer / `/preview` chrome
- Harvest, Keep, play sheet
- Changing auth API or invite logic
- Admin `/admin` (Lane S)

---

## Visual target (copy Settings / MenuSheet)

Use existing Paper tokens from `LoopSkin.tsx`:

- `--paper-field` page background feel (body already has loop skin)
- `--paper-card` for the centered auth card
- `--paper-inset` for text fields (same as `.settings-page .settings-name-pane`)
- **Stone buttons** — match `.settings-page .stone-btn` / header stone pattern, not glass specular `GlassButton` for primary actions
- **No** `WaterPane`, `water__ambient`, `water__skin`, lens filters on the card
- Typography: `brand-mark`, `login-title`, `login-sub` — keep copy, tune color to `--halo-ink` / `--halo-muted`
- Card width: keep `min(430px, 100%)` — auth is narrower than 832px sheet; that's fine
- Light + dark parity (test both)

Reference implementations:

- `SettingsMenu.tsx` — plain `settings-name-pane` when paper (`!wet`)
- `MenuSheet.tsx` + `overlays.css` `.settings-page`
- `LoopSkin.tsx` — search `settings-page` and `stone-btn`

---

## Implementation checklist

1. **`AuthShell.tsx`**
   - Replace `WaterPane className="login-card"` with a plain `<div className="login-card auth-card">` (paper card surface).
   - Optional: minimal Cove wordmark only — no topbar on auth.

2. **`LoginForm.tsx` + `InviteSetup.tsx`**
   - Replace each `WaterPane variant="field"` wrapper with `<div className="settings-name-pane">` (same as Settings).
   - Primary CTA: stone button class (or extend `GlassButton` only if it already paper-dries on `data-home-skin=paper` — prefer explicit stone for auth).
   - Keep form logic, validation, `demo` guards unchanged.

3. **Paper skin on auth routes**
   - `halo-boot.ts`: treat `/login` and `/invite/*` like paper paths (set `data-home-skin=paper` before paint), OR add `src/app/login/layout.tsx` + `src/app/invite/[token]/layout.tsx` with inline boot snippet.
   - Do **not** break family `/ask` frozen Ours unless chief says promote — auth-only paper is enough for this lane.

4. **`LoopSkin.tsx` + `home.css`**
   - Add rules under `html[data-halo-loop="17"][data-home-skin="paper"]`:
     - `.auth-card` / `.login-card` — card fill, shadow, radius (match settings card)
     - `.login-stage` — field background
     - `.login-form .settings-name-pane` — inset fields
     - `.auth-card .stone-btn` / submit — match settings buttons
   - Remove / override `.login-card .water__ambient` glass shadow when paper.

5. **Preview**
   - `/preview?view=login` and `view=join` still render; demo errors unchanged.

---

## QA (Camron)

- [ ] http://localhost:3000/login — light + dark, no water shimmer on card or fields
- [ ] Real sign-in → `/ask`
- [ ] Valid invite link → join form matches login
- [ ] Invalid/expired invite error state still readable
- [ ] iPhone Safari safe-area padding on `.login-stage`

---

## Locks

```
AuthShell.tsx
LoginForm.tsx
InviteSetup.tsx
src/lib/halo-boot.ts (auth paper boot only)
src/components/LoopSkin.tsx (auth paper block)
src/app/styles/home.css (.login-* paper overrides)
```

Do not touch: `keep-memory.ts`, `HomeBubbles.tsx`, `harvest*`, `MenuSheet.tsx`, `api/chat`.

---

## Paste for worker tab

```
Lane A. Read web/KEPT-BOARD.md and web/V2-LANE-A-AUTH-PAPER.md. Claim lane A. Paper-unify /login and /invite sign-up (AuthShell, LoginForm, InviteSetup). No WaterPane on auth. Match Settings paper inset fields + stone buttons. Force paper skin on auth routes via halo-boot. LoopSkin + home.css auth block. Light/dark QA. Update board every turn.
```
