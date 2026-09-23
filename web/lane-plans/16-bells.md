# Lane 16 — Bells (haptics, earcons, Listen, dictate)

**Status:** in_progress. This chat. 2026-09-20.  
**Spec:** [`docs/CRAFT-JUICE.md`](../../docs/CRAFT-JUICE.md)  
**Do not touch:** `native/` (Xcode), AskLanding / ChatThread / pending-turn / AskShell (Composer), LoopSkin joins (lane **15**). Morph 1080 / harvest z 120 frozen. **No promote.**

---

## Listen is a sentence, not a second

**Listen atom** = speak the **first sentence** of the reply (or the first ~400 characters), not “play audio for one second.”

Example canned Nile: *“The Nile is usually named as the longest river in the world.”* — then it stops. Tap Listen again to hear the rest. Full-article speak is the expensive path; we do not default to it.

That is **not** the same as on-device **dictate** (mic → text). Dictate is packet 5–6.

---

## Haptic mint (priority 1)

Three weights. Soft / OS reduce = off. No buzz on type.

| Weight | Objects (facts) | Chrome / Ask |
| --- | --- | --- |
| Light | — | Cove, History/Settings/Library, Send, mic, `done` |
| Medium | Home chip tap, chip hold, Keep bead, lock-in claim | — |
| Success | Gold pour | — |

**Wired now:** WaterCapsule fact chips (not mixer choices / harvest flyers), Keep beads, header GlassButtons + Cove, compose-form Send (capture, no ChatThread edit), mic WaterAction, lock-in, gold pulse.

**Composer later:** `window.dispatchEvent(new CustomEvent("halo-juice", { detail: "done" }))` when the stream finishes. Do not fire per token.

Earcons stay lock + gold only.

---

## Priority

| # | Packet | Status |
| --- | --- | --- |
| 1 | Object + chrome haptics (chips, beads, header, Send, mic) | **this turn** |
| 2 | Listen first **sentence** (second tap = rest) | shipped |
| 3 | Reply-finished `done` haptic | wait Composer one-liner |
| 4 | `@capacitor/haptics` in `native/` | Native lane |
| 5 | Dictate v1 — on-device STT + Keep hints | after Native speech plugin |
| 6 | Dictate v2 — WhisperKit on pause | after 5 |

Play-sheet correct stays silent. **No promote.**
