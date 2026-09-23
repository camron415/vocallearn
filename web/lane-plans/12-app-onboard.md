# Lane 12 — App onboard (splash → login → Home)

**Status:** Handoff. 2026-09-17. Plan + later src. **Not** Native Wave 0 (Capacitor shell).  
**Chief:** this file is the paste for a new Composer tab. Update `web/KEPT-BOARD.md` every turn.

Paste for a new tab:

```
Lane Auth / 1.3 onboard. Read web/KEPT-BOARD.md, web/HALO-V2-SUNDAY.md, docs/IOS-FIT-AND-1.3.md, and web/lane-plans/12-app-onboard.md. Claim the lane. Update the board every turn.

Job: app launch → first-run (2–3 screens, once) → sign in / create account → /ask Home. Invite-only stays. Sign in with Apple + Google should feel like a real app.

Do not touch native/ios until Native Wave 0 has landed the Capacitor project. Do not wrap VocalLearn app/. Do not edit AskLanding, ChatThread, pending-turn, or /api/chat (Composer / 1.3 prompt owns those). Morph 1080 / harvest z 120 / Home seating / phone Follow-up dock frozen. No promote. Family /ask is 1.2.0 live — ship onboard UI so it works in Safari and in the WKWebView.
```

---

## Why this lane exists

Native Wave 0 is a **shell**: Xcode app, splash, status bar, WebView loads production Halo. Existing email/password login already works on the site.

Camron wants the **first session** to feel like Duolingo-class product, not a website bookmark:

1. App opens (native splash — Native lane)
2. First-run: 2–3 screens, once (Ask → Keep → Home due)
3. Sign in **or** create account (invite still required)
4. Sign in with Apple, Sign in with Google, email
5. Land on Home `/ask`

Name is **not locked** (Askly was a favorite; Keeply collided). Do not rename `APP_NAME` / Cove in the header this lane. Login copy can say the product without a final store name.

---

## Live vs this lane

| Surface | Today |
| --- | --- |
| Production | Paper `/login` email+password. Invite `/invite/[token]` name+email+password. No OAuth. `APP_NAME` = Cove |
| Native Wave 0 | WKWebView → `https://halo-gules-three.vercel.app` (same login) |
| Composer lane | Home→Chat send speed. **Out of this lane.** |

---

## Order (do not skip)

### Packet A — first-run + premium paper auth (web, Safari + WebView)

No Apple Developer, no native plugins.

- Detect native shell: `window.Capacitor` (injected) or a small `web/src/lib/native-shell.ts`. Optional `data-halo-native` on `<html>`.
- **First-run, once:** 2–3 screens (Ask / Keep beads / Home due). Persist `halo_onboarded_at` is already burned on invite join + first Home paint — do **not** use that flag for the slideshow. Use a new key e.g. `halo-app-tour-v1`. Never show again after dismiss. **No** what’s-new tour on every launch (Cove vision).
- Login: Sign in primary. Create account secondary → still needs invite (paste code **or** open invite link). Do not add public signup.
- Visual: same Paper as `AuthShell` / `LoginForm` / `InviteSetup`. Apple-style stacked buttons later; Packet A can reserve the slots (disabled or hidden) so Packet B drops in.
- After session: `location` `/ask` (already). Confirm Home greeting, not `/preview`.
- Works in Safari too (family on the site). Native-only chrome is extra, not a second product.

Success: Camron cold-opens the Xcode app (or Safari `/login`), sees first-run once, signs in with existing email, Home.

### Packet B — Sign in with Apple + Google (native + Supabase)

**Apple rule:** if Google is offered on iOS, **Sign in with Apple is required.**

Do **not** run Google OAuth inside WKWebView (will break / App Review). Use native session:

- Sign in with Apple: native plugin (`@capacitor/social-login` or community Apple Sign In) → identity token → `supabase.auth.signInWithIdToken({ provider: 'apple', token })`
- Google: native Google Sign-In plugin → id token → same Supabase `signInWithIdToken`
- Enable Apple + Google providers in Supabase. USB-dev bundle is `com.camrontrost.halo` (`app.halo.ios` was already taken). Paid-account store id can stay that later.
- Invited-only: after OAuth, account must already be a Halo profile **or** redeem an invite in the same session. Do **not** let a random Google account into `/api/chat`. Mirror `halo_invites` / profile check already on chat.
- Camron’s **paid** Apple Developer is required for the Apple capability. Packet A must ship without it.

Success: wife (invited) can tap Sign in with Apple in the TestFlight/Xcode app and land on Home. Uninvited Google user is refused with a clear line.

### Packet C — after sign-in (light)

- First Home: existing greeting + composer. Optional one quiet line if Keep is empty.
- Settings already has name / theme / sign out. Split **Account** vs **App** only if it stays one sheet language (`MenuSheet`). Do not invent a trophy cabinet.
- Out: streaks, Teach-me, Stripe, public App Store. STT/TTS is **not** this lane — [`web/lane-plans/13-1.3-priority.md`](./13-1.3-priority.md) lanes 18–20 after Composer + Native.

---

## Files you may touch

**Packet A:** `web/src/components/AuthShell.tsx`, `LoginForm.tsx`, `InviteSetup.tsx`, `web/src/app/login/`, `web/src/app/invite/`, new first-run component, `web/src/lib/native-shell.ts`, LoopSkin/auth CSS only as needed, `halo-boot` if auth routes need a native class.

**Packet B:** those plus Capacitor plugins in `native/` **after** Wave 0, Supabase dashboard (Camron), maybe `web/src/app/api/auth/*` for id-token. Info.plist URL schemes.

**Do not touch:** `native/ios` while Native Wave 0 is in_progress (chief). `app/` (Expo). `AskLanding.tsx`, `ChatThread.tsx`, `HomeBubbles` seating, harvest z 120, morph 1080, `keep-memory.ts` scheduler, `/api/chat`.

---

## Frozen

Harvest z-index **120** · morph `--travel` **1080ms** · bead diameter · Home seating · play sheet 832 / inner ~440 · phone Follow-up dock · `text-size-adjust: 100%` · no `user-scalable=no` · no VocalLearn restyle · no promote unless Camron says promote.

---

## Proof

1. Safari `/login` still works (email).
2. Xcode app: splash → first-run (first launch) → login → Home. Ask a fact. Keep still harvests.
3. Invite create-account still one-use.
4. Packet B: Apple + Google; uninvited OAuth does not get Ask.

`cd web && npm run test:harvest && npm run build` before done. Update KEPT-BOARD log (3–8 bullets). No `deploy:early`.

---

## Blocked on

- Native Wave 0 for Packet B plugins (`native/ios` must exist).
- Apple Developer Program for Sign in with Apple capability + TestFlight.
- Camron enabling Apple/Google on the Supabase project.
- Composer lane: do not fight send-path files.
