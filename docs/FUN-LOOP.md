# Halo — fun loop (retention, QA burnout)

**Status:** Product lock from 2026-09-07 Camron chat (Composer + Gemini + Grok Fast + ChatGPT).  
**Canonical index:** [`docs/PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md)  
**Loop objects:** [`docs/COVE_KEEP_VISION.md`](./COVE_KEEP_VISION.md) · Sunday freeze: [`web/HALO-V2-SUNDAY.md`](../web/HALO-V2-SUNDAY.md)

Not a request to reskin as a game. Not a juice sprint. Not a promote.

---

## Why this file exists

Early-access family barely uses live Halo. Camron is burning out on harvest/classify QA. The question: what would make the product fun enough that **he** wants to iterate, and family would actually open it?

**North-star test:** after five minutes, do I voluntarily want to clear **one more** fact? Not: harvest accuracy, animation polish, XP, streak.

---

## Consensus (all four perspectives)

Juice (haptics, sounds, badges, points, micro-animations) is a **multiplier**. It does not create the loop. Stacking it on a delayed, impersonal harvest is polishing a ghost town.

The game is:

**Ask → a clean fact → retrieve it (SEE/SAY) → it becomes yours (rim / ◎).**

The return hook is a **small tray of unfinished beads** plus a quiet **clear 2**, not a streak.

Native (haptics, instant mic, push) **amplifies** a loop that already works on the website. It does not rescue a bland site.

---

## What is already in flight (do not re-recommend as missing)

Lab / current sprint (2026-09-07):

- Instant **day-1 review** (not wait-until-tomorrow as the only play).
- **Tappable Keep beads** (inspect).
- Same-visit **lock-in** (say it back, then fly) is the intended close.

Live early access still largely: Ask → maybe harvest fly → empty Home until next calendar day.

H1 copy in code is still `Kept — these come back tomorrow.` If day-1 play ships, that line is wrong.

---

## Adjusted plan (what we actually do)

### P0 — finish the current sprint, then dogfood

1. Same-visit lock-in + day-1 review. Skip must not feel like the default. Fly after saying it. **Collect craft (in lab):** marks stay kind-colored during the quiz; lock-in uses Home play (tap MC or type/speak); fly after claim or skip-save. Drop is how junk leaves Keep.
2. Bead inspect as a toy: fact + why it’s there. Add **Drop** on that panel (`removeKeepChip` exists; inspect has no discard yet).
3. Rewrite H1 so it matches day-1 play.

**Still this 1.2 sprint (do not drop):** Safari iPhone / mobile web QA of collect → Keep → Home play before promote. Due-drop (Keep → Home seats) plays when they **see Home** — do not force-route from chat this pass; later reopen may land Home first.

### P0 adjacent — same week, no new metaphor

4. Three outcomes on a harvested fact: **Lock in** / **Save without saying** / **Drop**. Auto-harvest stays. Junk is discard, not a month of classifier work.
5. Soften unfair round fail (miss then correct still counting as fail). That kills “one more.”
6. **Play-the-product QA:** Mix / seeded Home, ~8–10 real facts, SEE→SAY→rim until Camron wants another. Stop using classify edge cases as the main QA loop.

### P1 — after “want one more” is yes

7. Ask voice: shorter, specific; “don’t lose that” only when a chip is real. Prompt work, not a persona reskin.
8. Home as **Clear 2**, not a streak. Day cap + empty field after the day. Gold ◎ stays the long score.

### Not this month

Spark-only harvest (kill auto-harvest) · 7-bead magazine dock · family live ticker · XP / streaks / confetti · haptic/sound systems · trophy-cabinet tab · extra minigame types · native as a retention rescue.

---

## Rejected ideas (and why)

| Idea | From | Why out |
| --- | --- | --- |
| Kill auto-harvest; only a Spark button | Gemini | Ask is the front door. Spark turns Halo into save-to-Anki. Agency is **earning** the bead (lock-in), not making capture optional-only. |
| Dock of exactly 7 | Gemini | Cap 30 is already scarcity. Seven slots make Keep a bottleneck, not a collection. |
| Ghost-rim art system | Gemini | Keep the Zeigarnik psychology (unfilled lock-in). Do not invent a second bead language. |
| Family ticker of others’ docks | Gemini | Empty social if nobody uses the app. Cooperative later, after the loop is fun alone. |
| Generated trophy-cabinet titles | Gemini | ◎ + inspect is enough. A monument tab is juice. |
| Streaks / XP / hearts / leagues | All, plus Sunday spec | Obligation, not curiosity. Gamification stays ~5–7. Rim is the score. |

**Keep from Gemini:** unfinished objects create tension (lock-in + Keep as tray), discard feels good, native for push/mic/haptics.

**Keep from Grok / ChatGPT:** AI proposes, human claims (keep/drop); round is the game; product must be its own QA harness.

---

## Positioning (do not slide)

Sit Duolingo-side of Quizlet. Ask first. Auto-harvest when the question is worth it. User curiosity is the library. Paper Cove. No RPG chrome.

Hybrid harvest: **AI proposes → human claims or drops → retrieval teaches → memory persists.**

Leverage order:

**Game structure > challenge quality > mastery feedback > collection design > Ask voice > animation/haptics > badges/points**

---

## For the main agent

- Beat 1 collect is in lab. Lock-in now matches Home play (tap MC or type/speak) and flies after claim. Next if go: **H1 copy** + **due-drop on Home visit** + inspect Drop if lock Drop isn’t enough. **Safari iPhone / mobile web QA stays on 1.2 before sprint close.** Do not touch harvest z-index 120, morph `--travel` 1080ms, or promote.
- Do not start a juice, Spark, 7-cap, or social ticker sprint.
- Family `/ask` stays frozen until promote.

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-09-07 | File created from Camron fun/addiction chat + four-model synthesis |
| 2026-09-07 | Beat 1 collect in lab. Due-drop on Home (no force-nav). Safari iPhone still 1.2 sprint close. |
| 2026-09-07 | Lock-in uses Home play UI; flyer after claim; Drop + harvest_lock telemetry. |
