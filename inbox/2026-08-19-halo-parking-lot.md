# Halo parking lot — Atlas loop, cost, data, privacy, polish, legal

**Date:** 2026-08-19  
**Intent:** Store Camron’s thoughts. Act now only where waiting is expensive.  
**Live coding agenda unchanged:** Lab hybrid routing → Soft Learn. Do not promote.

---

## Judgment in one page

| Topic | When | Why |
|-------|------|-----|
| Agent loop (phone, managers, Cursor) | **Soon, docs only** | This is why Atlas sounded stuck on Aug 14. Not a Halo code slice. |
| Hybrid routing / 2–3× asks on $1 week | **Now (already P1)** | Confirmed by pricing. Unlocks Learn without blowing the cap. |
| Soft Learn + pre-recorded reviews | **Next Lab** | Cheap once generated. Fits the same $1. |
| Ads vs premium | **Park** | Ads cannot cover $1/week. Discuss before *public*, not before parents. |
| Where data lives + Supabase limits | **Park, with one watch** | Free tier is fine for a household. Real bill is xAI, not Postgres. |
| Admin vs true privacy vs xAI | **Honesty now, crypto later** | Product already hides chat text from Family activity. Dashboard/SQL can still read it. Every Ask goes to xAI. |
| On-device / local vault | **Park** | Web cannot honestly do this yet. |
| Dark mode, extra scenes, spice | **Park (P3)** | After Learn exists. Mist/Sky is enough. |
| Company / legal | **Triggers, not a project** | Invite-only family is small. Extended friends need a privacy page. Paid/public needs ToS. Under-13 is a stop. |

---

## 1. Atlas standup, managers, Cursor loop

**What’s broken:** VocalLearn’s manager (Sloane) still reports the language-learning app. Halo/Cove lives in the same repo but is not a first-class Atlas project. Phone Collection can lag (this week: Atlas missed the Aug 18 Cursor sync). Managers read git + old ROADMAP, not the last Cursor chat.

**What “good” looks like (company-shaped, still small):**

1. After every **Cursor** session that changed Halo: `sync atlas phone` (already a skill). Plain English note. No “we’ll remember.”
2. After every **phone** call: existing inbox summary. Cursor reads that file next time (this chat already does).
3. **Sloane / VocalLearn standup** talks Cove first: live URL, ring (Lab / Early / Family), last promote, cost, next Lab item. Language-learning VocalLearn is secondary until you reopen it.
4. Managers do **not** debug or code Halo. They flag drift and propose 1–3 Lab tasks. Coding stays Cursor on Lab.
5. Optional later: a scheduled Mac job that refreshes the Collection even if a chat forgot to sync.

**Do not build** a new orchestration platform this month. Rewrite Sloane’s policy + phone brief to name Cove. That is a short Atlas-docs pass when you want it — not today’s Halo deploy.

---

## 2. Cost: $1/week, 2–3× usage, Learn, ads, premium

**Current (confirmed Aug 2026 xAI list):**

- `web_search` = **$5 / 1,000 calls** = **0.5¢ per search**. Two searches = 1¢ before tokens.
- Grok 4.3 tokens ≈ **$1.25 / $2.50 per million** (input/output). A normal turn plus search text in context lands around **2–2.5¢** when search fires. Matches the call.
- Cap **$1 / user / week** ⇒ about **40 search-heavy asks / week** or **~160 / month**. Lab cap is $12.

**After hybrid (judgment):**

- Lookup (weather, news, scores): cheap model **without** search, or a free/cheap API. Grok 4.1 Fast-class rates (~$0.20 / $0.50 per million) make a short turn **well under 0.5¢**. Many lookups could be **tenths of a cent**.
- Blended household use (mix of lookups + real reasoning): **2× is conservative**. **3×** is realistic if most chips are lookups and 4.3+search is the minority.
- **Soft Learn reviews:** generate once (cheap miner + short cards). Replays cost **almost nothing** — same idea as a VocalLearn lesson already on disk. Daily review plus 2× asks still fits $1/week.

**Ads vs premium (park, but the math is already enough to decide direction):**

- $1/week = **~$4.30 / user / month** in model cost, plus Vercel (free-ish) and maybe later Supabase Pro ($25 org, not per user).
- Display ads on a quiet Ask site typically earn on the order of **$1–5 per 1,000 pageviews**. A person asking 40 times a week is not 40,000 pageviews. Ads on this product **do not cover** a dollar a week.
- Ads also fight the privacy story (third-party trackers on family questions).

**Direction to store:** subsidize immediate family. Before extended friends/public, charge a **simple Premium** (full Learn / VocalLearn-class lessons) and keep a **limited free Ask**. Do not plan on Google ads paying the Grok bill.

---

## 3. Database, limits, what is stored, trust

**Where it lives today (one Supabase project, shared with VocalLearn):**

| Data | Table / place | Who can see in the app |
|------|----------------|------------------------|
| Name, length, onboarded | `profiles` | That user; admin list of names |
| Lane / role | `halo_members` | That user; admin |
| Invites | `halo_invites` | Admin only |
| Chats | `ask_conversations`, `ask_messages` | Owner only in the app |
| Recipes + photos | `halo_recipes`, Storage | Owner |
| Usage events | `halo_events` | Admin counts; not chat text |
| Suggested chips | columns on `profiles` | Owner |
| VocalLearn lessons/facts | `lessons`, `facts`, progress | Separate product, same DB |

**Family activity** is counts only (asks, recipes, last active). No chat bodies in that UI. **Supabase dashboard + service role still bypass RLS.** You can read anyone’s messages in SQL. True “not even Camron” requires dropping that habit, no service-role reads of `ask_messages`, and later encryption. Do not promise that until it is true.

**What xAI sees:** whatever we send in the Ask request (trimmed history, attachments, the question). We cannot make xAI “not have” that without redacting or not sending it. Privacy vs ChatGPT is **not** currently a technical win on the model side — both send text to a lab. The win is **invite-only, no ads, no training-on-your-data claim we can actually honor, owner-only chat UI**.

**Supabase Free (typical 2026):** ~500 MB database, 1 GB files, 50k monthly logins, 5 GB egress, **pauses after ~7 days idle**, **no automatic backups**. A household will not hit MAU or 500 MB soon. Chat text is the volume that grows. Recipe photos eat the 1 GB first.

**Watch, don’t buy yet:** if the project might sit unused a week, Free can **pause** production. Daily family use avoids that. First paid infra that actually matters: **Pro (~$25/mo)** for no-pause + backups — worth it when friends depend on it, not before parents try Ask.

**On-device / extra private layer:** park. The site is a browser. “Local only” there is `localStorage` (lost on another device, not a vault). On-device models belong on the phone app later. A “don’t send this turn to xAI” / redact names-and-places filter is the honest web version, and it still stores the chat in Supabase unless we add a true private mode (no persist, no API). Cost of local models is user hardware + worse answers, not a cheaper xAI bill.

---

## 4. Visual spice

Park. Mist/Sky + water is the product. Dark mode, Learn/recipe scenes, extra animation: **P3 after Soft Learn is used**. Don’t let polish restart the Safari-physics loop on the live site.

---

## 5. Company / legal — when to care

| Trigger | What to do |
|---------|------------|
| Immediate family, you pay, invite-only | Keep going. Don’t invent a legal department. Be honest if asked: chats go to xAI; you see activity counts, not a chat feed. |
| Any user **under 13** | Stop. COPPA. Don’t invite kids on a general AI chat. |
| Extended family / friends | One-page privacy: what we store, what xAI gets, that you can see counts, how to delete. |
| Anyone **pays** | Terms, refund/cancel, “not medical/legal advice.” Stripe later. |
| **Public** or ads | Privacy policy, cookie/tracker rules, subprocessors (Vercel, Supabase, xAI). Ads make this worse. |
| EU users | GDPR access/delete. Same as “delete my chats” done well. |
| “More private than ChatGPT” in marketing | Not until architecture matches (and we still send text to xAI unless local). |

Holes to remember, not to panic: service-role bypass, no backups on Free, prompts include history, Vercel logs, no formal retention/delete-all yet.

---

## Do not start from this note

Dark mode, ads experiments, encryption-at-rest, on-device Grok, manager agents that write Halo code, legal counsel for a family beta.
