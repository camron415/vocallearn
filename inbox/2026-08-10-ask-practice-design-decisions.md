# Atlas ↔ VocalLearn — design decisions (living)

**Updated:** 2026-08-10 after Camron design reply  
**Prior artifacts:**
- `2026-08-08-atlas-vocallearn-integration-brief.md`
- `2026-08-08-atlas-vocallearn-integration-transcript.txt`
- `2026-08-08-atlas-vocallearn-integration-events.json`

---

## Product shape (agreed)

**VocalLearn** = personal Ask chatbot (Atlas-flavored) **+** spaced-repetition Practice tutor.

**Not in VocalLearn (for now):**
- Standup / morning brief
- Project orchestration / career board tools
- Full “life OS” Atlas manager behavior

**Phone Atlas agent** stays a separate surface. VocalLearn Ask can *feel* like Atlas and later share summaries with it, but Ask is not the standup agent.

### App tabs (v1)
1. **Ask** — Grok-app-like: type or dictate→text, conversation list/history, continue threads  
2. **Learn / Practice** — existing session engine + approval queue for proposed facts  
3. (Existing tabs may remain; Ask is the net-new primary surface)

### Ask input modes
| Mode | Role |
|------|------|
| **Type** | Primary for many queries |
| **Dictate → text → send** | Primary “voice” habit (NOT realtime) |
| **Call button** | Rare; opens iPhone Phone app to hard-coded Atlas agent number (Camron-only for now) |

Realtime voice Ask inside the Expo app is **out of scope for v1**.

---

## Capture → Learn loop (agreed)

1. Every Ask conversation (and later phone-call transcripts) is stored in **VocalLearn/Supabase**, not relied on as xAI console history.
2. A **fact miner** reads transcripts and proposes candidate facts worth mastering (formulas, definitions, statistics, interview-worthy concepts — **not** one-off recipes/lookups).
3. **Dedup** (cheap model + DB similarity) runs **before** user approval.
4. **Approval queue** — Camron taps yes/no on each proposed fact.
5. Approved facts enter the existing Practice / SM-2 path.
6. First success metric: type a history/fact question → see proposed card → approve → get quizzed on it in Learn.

### User / scope
- **v1 user:** Camron only  
- **Privacy:** light for now; deeper redaction when multi-user  
- **Apple sideload 7-day rebuild:** live with it until product feels worth paid Apple account  
- **Curriculum spine (Career Prep / Junior Interview):** keep available; not the growth lever. Motivation should come from *your* approved chat-derived facts.

---

## Architecture lean (recommended — pending Camron confirm)

**Do not route everyday Ask through the xAI phone Agent / realtime stack.**

Use:
- **xAI Chat Completions (Grok)** from the VocalLearn app for Ask text turns  
- **Supabase** for conversations, messages, proposed_facts, approvals, progress  
- Optional **Atlas-flavored system prompt** (persona + light personal context packs), **without** standup tools  
- **Call button** = `tel:` deep link only; intake from calls = later (export/summary pipeline), same miner  
- **Fact mining** = async after turns (cheap model), not on every keystroke, not primarily on-device LLM for v1

Rationale: phone Agent is built for realtime voice + tools; Ask needs cheap text, history we own, and a clean extract→approve path. Copying full phone-agent instructions into Ask risks pulling standup/tool behavior into a chat product.

---

## Resolved 2026-08-10 (Camron)

1. **Architecture:** Chat Completions + Supabase Ask — confirmed.  
2. **Context:** light only at the start.  
3. **Mining:** always-on + dedup against Supabase facts before approval.  
4. **Approval UI:** dedicated tab/section.  
5. **Branding:** **Ask** (not Atlas in-app).  

Full phased plan: `inbox/2026-08-10-ask-practice-roadmap.md`.

---

## Explicit non-goals for first slice

- Multi-user / freemium  
- Browser extension capture of Google/other LLMs  
- In-app realtime voice Ask  
- Standup tools inside Ask  
- Full entertainment redesign of old courses  
- Perfect on-device private LLM for mining
