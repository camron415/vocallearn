# Craft juice — motion, haptics, sound

**Status:** How Halo should *feel* finished. Juice is a **multiplier** ([`FUN-LOOP.md`](./FUN-LOOP.md)). Do not start a sound/haptic sprint to rescue a hitchy loop.  
**From:** Camron 2026-09-20 (after exhibit trophies).  
**Exhibits / gold objects:** [`ACHIEVEMENT-EXHIBITS.md`](./ACHIEVEMENT-EXHIBITS.md)  
**Sunday freeze:** `web/HALO-V2-SUNDAY.md` — morph `--travel` **1080ms**, harvest z-index **120**. Do not retune those to “add juice.”

Paste for a new tab: `Read docs/CRAFT-JUICE.md. Same mint: smooth motion first, then 3 haptics, then tiny earcons. Voice I/O is a separate track (legal stock TTS + cheap STT). Soft + OS reduced-motion always win. Agent order + locks: web/lane-plans/13-1.3-priority.md.`

---

## The mint (same workshop)

Apple’s Fitness medals feel like they came off **one press**. Halo should feel like it came off **one bench**: Paper stone, the same easings, the same three tap weights, the same quiet voices.

That is the opposite of a solo-dev pile: one whoosh on Send, a different bounce on the sheet, a system click on dictate, morph fighting a menu.

**House motion already exists.** Use it; don’t invent a fourth family.

| Token | Job | Today |
| --- | --- | --- |
| `--ease-travel` | Big moves (Home↔Chat, play sheet) | `cubic-bezier(0.33, 0.04, 0.2, 1)` · **1080ms** locked |
| `--ease-gel` | Land, pulse, clear | Soft settle |
| `--ease-glass` | Press / lift | Short |
| `--menu-grow` / `--menu-shrink` | Sheets | **520 / 380ms** — not 1080 |

Chrome (Send, hamburger, Copy) stays **snappy** (~100–180ms). Loop objects may stay juicy (morph, fly, 500/700 play hold). Do **not** add delay to hide a layout bug.

Settings **Full / Soft**: Soft skips morph, entrance fades, harvest arcs. **OS `prefers-reduced-motion` always wins.**

---

## What I’d prioritize (UX)

Leverage order from FUN-LOOP still holds: **structure > challenge > mastery feedback > collection > Ask voice > animation/haptics > badges.**

For *craft*, the order is:

1. **Same-mint smoothness** — glitches and mismatched transitions. This is what reads “real company.”  
2. **Punctuation on loop verbs** — one haptic (then one sound) on lock-in, gold, maybe Send.  
3. **Visual juice on objects we already have** — stone seat, gold fade, due loosen. Not new metaphors.  
4. **Voice I/O** — on-device dictate + licensed stock Listen (atom only). Not earcons.  
5. **Exhibit theater / trophy pour** — after [`ACHIEVEMENT-EXHIBITS.md`](./ACHIEVEMENT-EXHIBITS.md) is data.

Never: confetti every clear, haptic on every key, a second animation language, XP fanfare.

---

## Roadmap

### 0 — Workshop pass (now / 1.3 chrome)

Goal: **one motion, no hitch.** People forgive a quiet app. They do not forgive a stuttering one.

- Audit surfaces: Home↔Chat morph, play sheet, MenuSheet, lock-in → fly, Keep land, gold off dock, inspect open/close.  
- Map every duration to **instant / tap / travel / hold**. Kill one-off 420 vs 560 vs 720 that don’t mean anything.  
- Same element must not be animated in `home.css` **and** `LoopSkin` with different curves (that’s the “does nothing / fights itself” bug).  
- Morph ghost, sheet vs morph, harvest then layout jump: **fix the join**, don’t add a whoosh on top.  
- Phone + desktop should share the *curve*, even if path length differs.

This is the “full app” bar. Haptics will not hide a ghost composer.

**1.3 close:** this workshop pass is a **required checklist item** even while Bells ships juice. Other agents review [`docs/PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md) § 1.3 close checklist. Lane **15** owns the joins (QA debug). Do not drop it because haptics landed.

### 1 — Three haptic weights (iOS shell, after Trust / TestFlight)

Web can’t do this well. Capacitor + Taptic Engine, **only** when the verb already succeeded.

| Weight | When |
| --- | --- |
| **Light** | Header / Cove / menu chrome, Send, mic on/off, reply finished (`done`) |
| **Medium** | **Fact objects** — Home chip tap, chip hold, Keep bead, lock-in claim |
| **Success** | Gold pour (rare) |

Same mint: chips and beads are the main characters, so they share **medium**. Do not haptic typing, scroll, stream tokens, or play-sheet “correct” (Sunday: no sound there). Mixer choice pills (`capsule--choice`) stay quiet.

Miss = very soft, or silence. Don’t punish. No haptic on typing. Soft / reduce = off.

Three weights only. Same mint.

### 2 — Tiny sound palette (after haptics feel right)

Five stems max, **one timbre** (paper, wood, soft bell — not Duo brass).

- Lock-in seat  
- Gold (once, short)  
- Optional: Send (can stay haptic-only)

Honor the **silent switch**, in-app Soft, and reduce. **TTS / live dictate is a different track** — see [Voice I/O](#voice-io--listen--live-dictate) below. Do not mix earcons and the house speaking voice in one pack.

If a sound doesn’t map to a loop verb, it doesn’t ship.

### 3 — Object juice (still Paper)

Same beads, same ◎:

- Stone **seats** (you already fly).  
- Due cluster **loosens** (joints, not a new art system).  
- Gold **pours** on the body when exhibits exist; until then, current gold fade is enough.

No second bead language. No Lego. See exhibits doc.

### 4 — Later extras

Dictate earcon, play-hold tick, exhibit orbit in theater. Minigame **skins on SAY**, not a second loop.

---

## Feelings (honest)

Juice is how you stop looking like a personal project **after** the joins are clean. On a hitchy tree, extra bells read as amateur.

Halo already has more crafted motion than most chat apps (morph 1080, harvest fly, menu grow). The gap is **uniformity and reliability**, not a missing particle system.

Voice (human TTS + live dictate) is *presence*. A 30ms tap is *finish*. Do the tap first. Voice can follow once the shell exists — still after workshop smoothness.

---

## Voice I/O — Listen + live dictate

**Not a whoosh.** Same mint as Ask: fast, cheap, legal, one house voice. Camron 2026-09-20: quality in the ChatGPT/Grok-app class, **cost in the Luna-ask class**, no stolen/cloned celebrity or lab voices.

VocalLearn already prototyped this: xAI **Ara** TTS (`src/lib/voice.ts`, cached clips in `audio-clips.ts`) + `expo-speech-recognition`. Halo web today is `speechSynthesis` (Listen) and Safari `webkitSpeechRecognition` (Dictate) — the trashy path.

### Legal (non-negotiable)

- **Do** pick a **stock voice the vendor licenses for apps**, or commission an actor (work-for-hire) and clone **only** that take under the provider’s commercial ToS.  
- **Do not** clone ChatGPT / Grok / Siri / “Ara as Halo,” celebrities, YouTube teachers, or family members without a signed release.  
- “Our voice” = **one named Halo voice we picked and never change**, not “sounds like Scarlett.” OpenAI/xAI stock voices are fine to *use*; they are not ours to market as exclusive.  
- Open-source voices (Kokoro, Piper, etc.): only if **that checkpoint’s license** allows commercial playback.

### How cheap vs Luna

A reserved **Luna Ask** in our meter is about **$0.0012 text + ~$0.0007 classify ≈ $0.002** (`ask-guard`: 3200/500 Luna + 400/80 Grok). Camron target: **~+$0.001** (a tenth of a cent) for voice on that turn.

OpenAI `tts-1` at **$15 / 1M characters** is **not** that:

| Speak | Cost | vs +$0.001 target |
| --- | --- | --- |
| ~70 characters | $0.001 | hits — too short |
| Atom ~400 chars | **~$0.006** | ~6× over · ~3 Luna *text* slices, not ten |
| Full ~2k chars | ~$0.03 | ~30× over |

I misspoke if that landed as “ten Luna turns.” **Atom Listen on OpenAI-class TTS is about 3–6× a Luna text slice, or ~3× a reserved Luna Ask.** Full-answer speak is the expensive one.

**To actually hit +$0.001 on a 400-char atom** you need ~**$2.50 / 1M chars**, or **$0 on device**:

- **On-device Kokoro / Piper / similar** (Apache/MIT voices, Core ML / WhisperKit’s TTSKit) — marginal **$0**. Quality below ChatGPT Voice, far above Siri. Best fit for the target. App size / ANE heat is the cost.  
- **Self-host Kokoro on a GPU** — only cheaper than APIs at millions of chars/month; not for family scale.  
- **Cheaper APIs** — shop the ~1¢/minute commodity band; still usually a few × $0.001 unless the clip is short.  
- **Stay API but speak less** — first clause only (~150 chars ≈ $0.002 on `tts-1`). Closer, not quite a tenth.

**Do not default to OpenAI-class TTS for every Listen** if the budget is +$0.001. Use on-device house voice, or API only for the atom / cache.

| Job | 2026 ballpark | vs one Luna ask |
| --- | --- | --- |
| **Listen the atom** (~400 chars, OpenAI `tts-1` ~$15/1M chars) | ~$0.006 | a few Luna turns |
| Listen a 2k-char dump | ~$0.03 | tens of Luna turns — don’t default this |
| **On-device STT** (iOS `SFSpeechRecognizer` via Capacitor) | **$0** | — |
| **Streaming STT** (Deepgram Nova-3 ~$0.005–0.008/min) | ~$0.002 per 15s dictate | ~1–2 Luna turns |
| Groq Whisper batch | cheapest transcribe; **not** live partials | good for SAY file, bad for ChatGPT-style captions |
| Full duplex “talk to the model” (Realtime / Grok voice) | cents per minute | **not** Luna-cheap; premium / Teach-me later |

**Stay Luna-cheap:**

1. Default Listen = **first sentence / primary atom** (you already want that as the hero). Full article = second tap.  
2. Cache TTS of lock-in lines and repeated SAY cues (Ara clip pattern).  
3. Dictate: **on-device first** on the iOS shell (free, legal, good English). Cloud streaming only if live captions need to match ChatGPT.  
4. Same daily-40 / $1 week reserve — voice tokens count.

True **custom** (actor + clone) is a **one-time** cost, then higher per-char. For family free Ask, **one licensed stock voice + instructions** (`gpt-4o-mini-tts` style) is the cheap high-quality path. Custom mint later if the brand needs it.

### Live captions (~1s delay)

Safari Web Speech will not get you there. ChatGPT’s “it fixes itself after a second” is **not a smarter mic**. It is **partials, then a second pass** with the rest of the sentence (and often the chat). No free plugin magically upgrades `SFSpeechRecognizer` to that. You **stack** free pieces:

1. **Live partials** — Apple on-device (`SFSpeechRecognizer` / iOS 26 `SpeechAnalyzer`). $0. Feels instant, a bit dumb.  
2. **Hints** — `contextualStrings` (≤100 short phrases). VocalLearn already does this. Feed last topic, Keep tokens, names. $0.  
3. **Whole-utterance pass** — on pause, **WhisperKit** (open-source on-device Whisper) on the same audio. $0. This *is* “now that I heard the full sentence, rewrite it.”  
4. **Optional Luna tidy** — transcript + last user/assistant clip: “fix STT only.” ~+$0.0005–0.001. Conversation context. Skip if WhisperKit is enough.

Cloud streaming (Deepgram) only if that stack still loses to the Grok app. Groq Whisper is cheap **batch**, not live partials.

Do **not** start full voice-to-voice (interrupt, barge-in, Ara session) in the juice track. That is VocalLearn / Teach-me premium. Halo first: **mic → live text → same Ask harness → optional Listen on the atom.**

### Where it sits on the craft list

Agent lanes (do not steal Native / Auth / Composer files): [`web/lane-plans/13-1.3-priority.md`](../web/lane-plans/13-1.3-priority.md).

| Order | Track | Lane |
| --- | --- | --- |
| 0a | Workshop **sheets** (menus) | **14 parked** — already shipped |
| 0b | Workshop **joins** (morph/land) | **15** other tab — **required 1.3 close** |
| 1–2 | Three haptics + earcons (lock / gold) | **16 Bells** (this chat) |
| **2.5** | Atom Listen now; on-device dictate later | **16** Listen this turn; dictate after Native |
| 3 | Object juice | **21** late 1.3 |
| Later | Cloud live captions if needed; custom Halo voice; duplex tutor | 1.4 |

---

## Do not

- Retune `--travel` 1080 or harvest z 120 for “feel.”  
- Steal Native / Auth / Composer / Legal files. Bells = [`web/lane-plans/16-bells.md`](../web/lane-plans/16-bells.md). One-workshop stays on the 1.3 close checklist.  
- Add streaks/XP as the craft layer.  
- Generate a new whoosh per screen.
