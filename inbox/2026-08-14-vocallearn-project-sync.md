# VocalLearn + Halo project sync — July through August 14, 2026

**Project:** VocalLearn (iPhone tutor) and Halo (family Ask website)  
**Manager on phone:** Sloane  
**Status as of:** 2026-08-14 afternoon  
**Source:** This Cursor chat (Halo UI + usability, Aug 13–14) plus VocalLearn inbox briefs from Aug 8–13. Overnight managers and the phone agent cannot see raw Cursor chats unless they are written here and synced.

---

## Current state (speak this)

Two products, one repo, shared Supabase and Grok. They are **not** the same brand.

**Halo** is the live family product: invite-only Ask chat on the desktop web. Camron provisions email/password accounts. Live site is the Vercel Halo project. Mist glass UI is signed off as clean and simple. Chat actually works: history, sources as links, dictate, cheap Grok with today’s date and web search.

**VocalLearn** is still Camron’s personal iPhone lab: spoken spaced-repetition tutor. Ask → propose fact → approve → Practice quiz is designed and partly coded, **not** proven on device yet.

Do not invent Learn courses, Keep shelves, or public signup. Native app stays separate from Halo.

---

## Architecture (what exists now)

| Surface | Role |
| --- | --- |
| VocalLearn iPhone (Expo) | Voice tutor + Ask tab scaffolding. Camron only. |
| Halo website (`web/` in the same repo) | Family Ask. Desktop-first. Live on Vercel. |
| Shared Supabase | Same project as the phone app. `ask_conversations` / `ask_messages` power Halo and will power mobile Ask. |
| Grok | Halo uses grok-4.3 via the Responses API, with web search (max 2 calls) and a clock line (America/Denver). Everyday turns: no extra reasoning. Hard turns: low reasoning. |

Git HEAD is still **July 23**. Almost all August Ask + Halo work is in the working tree, not committed.

---

## Chronology

### July 8–23 — VocalLearn app baseline
- Shipped the Expo Router voice-session app with Supabase and Grok.
- Recruiter-friendly README; engineering notes archived.
- Teaching plans and learning profiles (migration 006) already in the tutor: hint → hint → reveal → repeat once; facts stay the atomic unit.
- Last git commit on this repo: July 23.

### August 8 — Product split with Atlas
- VocalLearn is **Ask + Practice**, not standup or career OS. Phone Atlas stays a separate call.
- Ask uses Grok chat completions, not the phone Agent API.
- Capture loop agreed: store chats → cheap fact miner → dedup → yes/no approval → existing SM-2 Practice.
- v1 user: Camron only on the phone app. Realtime in-app voice Ask is out of scope.

### August 10 — Ask scaffolding + Halo roadmap
- Mobile Ask tab, ask store, fact miner, proposed-facts migration 007 exist as uncommitted work.
- Halo website started in-repo: Next.js, Tailwind, Framer, same Supabase.
- Locked for Halo: browser first, invite-only, Ask-only MVP, liquid glass required, cheap models, family around 8 people, native app stays the lab.
- Learn / Keep / payments / Gmail are later. Do not build them in Halo yet.

### August 12 — Halo live, first real tests
- Halo is live on Vercel. Sign-in works on computer and phone. Chat history shares the same Ask tables as the app.
- Visual lock: recents are **anchored capsules** (centers stay put). Water lives in the **edge**, not wandering ovals.
- Answers can differ from the consumer Grok app (expected: API path, not the full Grok app stack).

### August 13 — Halo UI overhaul (this chat)
- Mist is the **default** wallpaper (Apple paper white). Sky is opt-in via Scene.
- Motion: Full / Soft. No night mode.
- One glass language: login, header, recents, composer, Ask/Send. Chat is a dock; landing composer is the same object.
- Water engine on recents, composer, and Ask/Send. Slate hairline so physics shows on white mist (white-on-white was a real failure).
- Camron (and his wife) signed off the mist look: clean, simple, not too crazy.
- Preview page exists for dummy UI without login; real Ask is `/ask` after login.

### August 13–14 — Halo made actually usable
- Chat type scaled up for reading.
- Your bubbles: Apple stone gray (`#e8e8ed`). Halo stays white. Dark ink bubbles were rejected.
- **History** is a full opaque sheet over the page (not a tiny transparent header menu). Titles wrap.
- Recents chips stay short on purpose so they don’t hit the composer; History is the full list.
- Composer grows with long prompts.
- **Dictate:** mic next to Ask/Send. Browser speech-to-text. While listening, the composer uses the same water splash as the pills. Enter still sends.
- Sources: blue label, divider, clickable links in a new tab. Preview always shows the treatment.
- OBJ dashed-square leftover (object-replacement glyph) is stripped on display, including old threads.
- Thanksgiving 2025 miss: no “today is” clock and no web search. Retired `grok-4-fast-*` slugs now redirect to grok-4.3. Fix: inject date, enable search (cap 2), stay on grok-4.3 — not grok-4.6. Two simple questions a day ≈ tens of cents per month.
- Prompt: never invent prices or specs; if search didn’t confirm a number, say so. Shopping links inside the paragraph deferred.
- Daily user-message cap remains 40.

---

## Decisions that still stand

1. Halo = family website. VocalLearn native = Camron’s lab. Separate brands.
2. Halo MVP is Ask only. Do not invent Learn, Keep, or public signup.
3. Camron provisions every Halo account (email + password).
4. Mist default; Sky optional. Motion Full/Soft. No night mode.
5. Default model grok-4.3, reasoning off, search when needed, date always injected. Step up reasoning only for clearly hard turns.
6. Ask → Practice on the phone is the next *native* proof, not Halo’s job.
7. Cursor work must be synced (`refresh-phone-knowledge`) or Sloane / the phone agent stay blind to Halo.

---

## Open / next (VocalLearn + Halo)

- Family-test Halo on the live site (history, dictate, a dated question, a price question).
- Native: prove one loop — Ask a fact, approve it, get a spoken quiz in Practice. Schema/code exist; device smoke-test does not.
- Commit the uncommitted Ask + `web/` work when Camron asks (nothing August is on git yet).
- Recents: keep chips short; later maybe a 4-word generated title. Not blocking.
- Inline shopping links in the answer body: later, not now.
- iPhone 7-day Apple signing remains a separate native-app track.

---

## How the loop stays current

**Cursor → phone + overnight:** this file + `refresh-phone-knowledge`.

**Phone → Cursor:** call saves land in project inboxes. Read today’s inbox before assuming the phone knew nothing.

**This file** is the VocalLearn/Halo rollup for morning meetings and for Sloane / Atlas alignment. Atlas platform and Career Dashboard are covered in their own syncs — do not mix them here.
