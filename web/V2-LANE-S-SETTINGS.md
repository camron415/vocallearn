# Lane S — Settings + admin audit (Composer)

**Goal:** Confirm Camron’s admin Settings match V1 parity on Paper V2 before promote. Fix gaps only — no redesign.

**Why now:** Camron expects early-access invite, usage/cost, sign-out on his account after login. Login redirect exposed that auth is stale; Settings may also hide admin blocks or use wrong skin.

---

## What already exists (verify, don’t rebuild)

`SettingsMenu.tsx` (opened from header **Settings** on `/ask`):

| Feature | Code | Who sees it |
| --- | --- | --- |
| Display name | save via `/api/profile` | everyone |
| Answer length | `LengthPicks` | everyone |
| Motion + theme | `ChoicePicks` | everyone |
| Usage | `GET /api/profile` on open | everyone — **$ for admin**, **% for members** |
| Family invite | `POST /api/invite` lane `family` | `profile.isAdmin` |
| Early access invite | `POST /api/invite` lane `tester` | `profile.isAdmin` |
| Family activity | link → `/admin` | `profile.isAdmin` |
| Sign out | `supabase.auth.signOut()` → `/login` | everyone |

`HaloProfile.isAdmin` comes from `halo_members.role === 'admin'` in `halo-profile.ts`.

---

## Likely gaps to fix

1. **Paper skin on `/ask`**
   - `halo-boot.ts` forces `data-home-skin=ours` on non-preview paths today.
   - Settings paper rules in `LoopSkin.tsx` only apply when `data-home-skin=paper`.
   - **Decision for this lane:** either (a) default loop V2 `/ask` to paper in boot/layout, or (b) document that Camron must use `/preview?look=paper` until promote — **prefer (a) for promote path** if chief agrees in same PR.
   - `useOursWet()` → when paper, Settings already uses dry `settings-name-pane` (good).

2. **Settings trigger button**
   - Header still uses `GlassButton` for “Settings”. On paper, should match `stone-btn` like History (see `HaloHeader.tsx`).

3. **Admin section visibility**
   - If Camron logs in and **does not** see Invite block: debug `profile.isAdmin` on `AskLanding` → `HaloHeader` → `SettingsMenu`.
   - Ensure server `loadHaloProfile` runs on `/ask` page (it does in `ask/page.tsx`).

4. **`/admin` Family activity page**
   - `AdminBoard.tsx` still V1 glass (`ask-stage` + old recipe cards).
   - **Optional this lane:** paper-wrap list like History rows OR leave for post-promote if Camron drops Family activity from Settings.
   - Camron: “maybe not necessary” — **default: keep link, paper-light pass on admin list only if time**.

5. **Invite copy UX**
   - After generating invite, `invite-copy` block with Copy button — verify on paper (contrast, code wrap).

6. **Sign out placement**
   - Already bottom section. Ensure visible without scroll on common phone heights.

---

## Out of scope

- Login / invite pages (Lane A)
- New DB metrics dashboards (asks metadata stays in `halo_events` + `/admin`)
- Family activity redesign if Camron says drop the button

---

## QA (Camron admin account)

- [ ] Settings opens from `/ask` header — paper sheet, not glass
- [ ] Usage shows **$X of $Y this week · Lab** (admin + lab lane)
- [ ] Early access invite + Family invite both return copyable URLs
- [ ] Sign out works → paper login (after Lane A)
- [ ] Non-admin early-access test account: usage % only, **no** invite block

---

## Locks

```
SettingsMenu.tsx
HaloHeader.tsx (settings trigger only)
src/app/ask/page.tsx (profile pass-through — read only unless broken)
src/components/AdminBoard.tsx (optional paper pass)
src/lib/halo-boot.ts (coordinate with Lane A if touching paper default)
src/components/LoopSkin.tsx (settings invite-copy / stone-btn gaps only)
```

Do not touch: auth forms (Lane A), harvest, play sheet, keep-memory.

---

## Paste for worker tab

```
Lane S. Read web/KEPT-BOARD.md and web/V2-LANE-S-SETTINGS.md. Claim lane S. Audit SettingsMenu admin parity (invites, usage $, sign out). Fix paper skin on /ask if still ours. Stone Settings trigger in header. Optional light paper on /admin. Verify isAdmin wiring. Update board every turn. Do not edit Lane A auth files.
```
