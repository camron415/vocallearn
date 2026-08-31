# Halo UI overhaul brief

**Date:** 2026-08-13  
**Status:** research + prompt pack only — **do not implement until Camron starts a dedicated overhaul session**  
**Live site:** https://halo-gules-three.vercel.app  
**Code:** `vocalLearn/web/` (Next.js 16, Tailwind 4, Framer Motion, Supabase)

This file is the handoff for a high-capability frontend model (recommended: **Claude Opus 5 thinking high**).

---

## Product north star (UI only for this job)

Invite-only family Ask. Desktop-first. Must look **sincerely impressive**.

Feel: Apple Liquid Glass quality — translucent, light-bending, quiet, premium — **not a clone of iOS 26**, not 2018 glassmorphism (white rectangle + blur + fat border).

Camron’s words to honor:

- Super simple, clean, user-friendly
- Fun / slightly addictive, not chaotic
- Objects should feel like **water / glass**, not PowerPoint stretch
- Bubbles **stay anchored** (center almost fixed)
- Edges jiggle like a water droplet (width/height curve, organic)
- Cursor/touch: extra drop added → inflate + light up; leave → surface settles
- Capsules / rounded rectangles for chips, **not** random ovals
- Same material language **across the whole site** (login, landing, chat, compose, buttons) — not one gimmick on the home bubbles

Non-goals for this overhaul: Learn courses, Keep shelves, payments, Gmail/OpenClaw.

---

## Honest diagnosis of current Halo

What we already have: mist background, blur panels, Framer springs, motion Soft/Full toggle, thinking labels, optional Sources.

What’s wrong (Camron-confirmed):

1. **Wrong physics metaphor.** First pass *moved* bubbles around the screen. Second pass morphed them into **ovals**. He wanted **anchored capsules** whose **silhouette** behaves like water.
2. **Wrong glass quality.** Current look is “frosted card.” Apple’s bar is **lensing** (bend/concentrate light), specular highlight that travels, adaptive tint, quiet resting state that **energizes on interaction**.
3. **Not systemic.** Glass/physics is mostly landing bubbles. Login, chat bubbles, compose dock, ghost buttons don’t share one material.
4. **Clunky computer motion.** Uniform `scaleX/scaleY` and sliding `x/y` read as transform handles, not liquid.

---

## What Apple actually does (quality bar)

Sources:

- [WWDC25-219 Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/)
- [Apple Newsroom — Liquid Glass](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/)
- [WWDC25-323 Build a SwiftUI app with the new design](https://developer.apple.com/videos/play/wwdc2025/323/)

Apple’s material is **not** `backdrop-filter: blur()`. It is a **layered meta-material**:

| Layer | What it does | Halo translation |
|-------|----------------|------------------|
| **Lensing** | Bends/concentrates light at edges so the pane is visible *because of optics*, not a heavy fill | Displacement / IOR shader or SVG displacement on backdrop; brighter edge, not a 1px white stroke as the whole identity |
| **Specular** | Highlight travels with geometry / motion / interaction | Moving sheen tied to pointer or device tilt (subtle) |
| **Adaptive tint** | Samples what’s behind; small chrome can flip light/dark for legibility | CSS isn’t true sampling; approximate with richer wallpaper + slightly higher saturate + text vibrancy |
| **Shadow intelligence** | Stronger over busy/text, weaker over flat light | Two shadow recipes: over photo vs over empty mist |
| **Gel flex** | Instant energize on touch; rest is quiet | Interaction-only motion; idle almost still |
| **Morphing plane** | One floating chrome layer that shape-shifts between states | Landing compose → chat should feel like the **same glass object opening**, not a page swap |
| **Reserved for chrome** | Glass is navigation/controls. Content stays content. **No glass-on-glass** | Chat messages: user = solid ink; assistant = *thin* glass or no glass. Don’t stack blur cards. |
| **Regular vs Clear** | Regular = adaptive anywhere. Clear = only over rich media + dimming | Halo landing can be Clear-ish over the mist field; chat chrome Regular |
| **A11y** | Reduced transparency, increased contrast, reduced motion | We already have Motion Soft — extend to frostier glass + no elastic |

Apple also says: materialize by **modulating lensing**, not fading in like a cheap opacity tween.

We **cannot** ship Apple’s private renderer on the web except Safari’s `-apple-visual-effect: -apple-system-glass-material` (progressive enhancement). Everywhere else we **approximate the principles**.

---

## Web techniques ranked (what is actually possible)

Detailed writeup: [Liquid Glass on the Web: 6 ways (CSS + SVG)](https://dev.to/devyatov/liquid-glass-on-the-web-6-ways-to-build-it-with-css-and-svg-3m07)

### A. Material / glass (look)

1. **Baseline (ship everywhere):** `backdrop-filter: blur() saturate(180%+)`; fill ~6–12% white, **not** 40–60%; inner highlight; hairline border; saturate is what stops “dirty plastic.”
2. **Feathered edge:** `mask-image` so blur fades — real glass doesn’t hard-clip.
3. **True-ish refraction:** SVG `feDisplacementMap` (noise or **radial/edge displacement map**, not random Perlin as the whole look). Chromium can put SVG filters *inside* `backdrop-filter`; Safari/Firefox often need fallback. Detect engine; never rely on `@supports` for this (Safari lies).
4. **Safari native:** `-apple-visual-effect: -apple-system-glass-material` when available.
5. **Hero-quality (landing only):** small WebGL quad with Snell’s-law IOR refraction. Pause offscreen, cap FPS, Soft mode disables. **Not** for every button.

**Recommended Halo stack:**  
Design-token glass (A1+A2) on **all chrome** → displacement glass on landing capsules in Chromium → native Apple material in Safari → WebGL **only** if CSS still feels fake after that, and only on the landing field.

### B. Water edge physics (feel) — this is the hard part

Camron wants **2D surface tension on a capsule**, not metaballs sliding around.

Truth: full Navier–Stokes water in the DOM is the wrong tool (expensive, hard to keep text readable, looks like a game).

Better ladder:

| Level | Technique | Feel | Risk |
|-------|-----------|------|------|
| 1 | Organic **8-value border-radius** morph, **tiny** squash (1–3%), center locked | Droplet idle | Can look oval/blob if overdone (we already failed this) |
| 2 | Extra **satellite blobs** + SVG goo (`feGaussianBlur` + `feColorMatrix` threshold) only at the **edge**, not the whole chip | Cursor “adds a drop,” merge/split | Gooey menus; text must sit *above* the filter |
| 3 | **SDF / metaball shader** on a canvas *behind* the label; HTML text stays sharp | Closest to real water meniscus | Implementation complexity; Soft fallback |
| 4 | Full SPH / NS fluid | Overkill | Don’t |

**Shape constraint:** resting silhouette = **stadium / capsule** (continuous corner radius), not amoeba. Water motion lives in the **last 4–8px of the outline**.

**Interaction model (locked):**

- Position: pinned. Max translation **0–2px**.
- Idle: almost still; optional 1px “breath.”
- Pointer within ~80px: edge **leans toward** cursor (meniscus), slight inflate, sheen moves to contact point, brightness up.
- Leave: 200–400ms underdamped settle (one overshoot), not a slide home from across the screen.
- Tap: inner illumination spreading out (Apple’s “energize with light”), then settle.

Gooey/metaball refs (edge technique, not product copies):

- [Lucas Bebber gooey SVG filter](https://css-tricks.com/gooey-effect/)
- [Codrops Three.js droplet metaballs](https://tympanus.net/codrops/2025/06/09/how-to-create-interactive-droplet-like-metaballs-with-three-js-and-glsl/)

### C. Motion system (whole site)

Use one spring language (high stiffness, enough damping to not feel toy-like):

- Page/chrome morph: landing compose **is** the chat dock (shared layout / FLIP)
- Messages: new ones only; don’t animate history
- Buttons: scale 0.98–1.03 max; sheen, not bounce across the page
- Honor `prefers-reduced-motion` and existing Soft toggle
- Weak hardware: drop displacement + goo; keep static glass

---

## Whole-site surfaces to unify

1. Login card  
2. Top bar / ghost buttons  
3. Landing greeting + **capsule** recents (not ovals)  
4. Center compose (the hero glass object)  
5. Chat stage + docked composer  
6. Assistant thinking row  
7. Optional Sources block (quiet, not a second glass card)

Wallpaper should stay a **lit environment** (soft photo-like gradients / caustics), because glass with nothing behind it looks like a gray sticker.

---

## Recommended model for the overhaul

**Primary: Claude Opus 5 thinking high** (`claude-opus-5-thinking-high` in Cursor)

Why: this job is taste + translating fuzzy visual language + a coherent design system across many files. Opus 5 is the best available Cursor model for that. (“Fable 5” ≈ Opus 5.)

**Runner-up:** GPT-5.6 (`gpt-5.6-sol-medium`) if Opus 5 is unavailable — stronger at mechanical completeness, slightly less “design director.”

**Do not use for the overhaul:** cheaper/faster coding models (they already produced the sliding-then-oval miss). Use them for later polish tickets *after* the system exists.

**How to run it:** new Agent chat, pick Opus 5, paste the prompt below, attach this file + `web/src/app/globals.css` + `web/src/components/*`. Ask Camron to stay on **desktop** for the first review.

---

## Prompt to paste into the Opus 5 session

```
You are doing a frontend design-system overhaul of Halo (vocalLearn/web).

Read first:
- inbox/2026-08-13-halo-ui-overhaul-brief.md (source of truth)
- web/src/app/globals.css
- web/src/components/BubbleField.tsx, Glass.tsx, AskLanding.tsx, ChatThread.tsx, LoginForm.tsx, MotionProvider.tsx

Do not invent product features. Do not touch Learn/Keep/auth/API except if CSS/class names require it.

Goal: Apple Liquid Glass QUALITY (lensing, specular, quiet rest, energize on interaction, one floating chrome plane) on every surface — inspired, not cloned.

Locked physics:
- Recents are CAPSULES (stadium), not ovals/amoebas.
- Centers stay put (≤2px drift).
- Water lives in the EDGE: organic curve, meniscus toward pointer, slight inflate + light, settle on leave.
- No sliding objects around the screen. No PowerPoint squash.

Implementation order:
1. Glass tokens + shared <Glass> used by login, topbar, compose, chat dock.
2. Capsule recents + pointer meniscus (CSS/SVG first; WebGL only if still fake).
3. Compose→chat as the same object opening (spring / shared layout).
4. Soft/reduced-motion/Safari fallbacks. Chromium can be the beauty path.

Success: Camron on desktop says the glass looks expensive AND the chips feel like water at the edge without leaving their spots.

Ship to the existing Vercel project when visually done (personal-f999/halo, alias halo-gules-three.vercel.app) only if env/deploy flow is already known — otherwise stop at local quality.
```

---

## Suggested review checklist (Camron, desktop, Motion: Full)

- [ ] Login card looks like the same material as compose  
- [ ] Recents are pill/capsule, not eggs  
- [ ] They do not wander  
- [ ] Cursor near edge = wet deform + light, not a jump  
- [ ] Chat still readable (no goo on text)  
- [ ] Soft mode still pretty, just still  
- [ ] Phone: acceptable, not the beauty target yet
