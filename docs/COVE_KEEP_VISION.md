# Cove — Keep vision (facts, Home, mastery)

**Updated:** 2026-08-25  
**Track:** Lab only. Do not promote. Early access Ask stays the frozen family site.  
**Audience:** Camron, Lab UI agents. VocalLearn native is a side project, not this product.

Cove is a placeholder name. Paper is the current Lab look. This file is the product loop for harvested facts — not a request to reskin as a video game.

---

## Position (do not slide off this)

Sit **Duolingo-side of Quizlet**, not a full game.

- **Ask is the front door.** Search/chat stays first. Keep/Learn is optional juice on top of real answers.
- **Quizlet** is too dry (cards in a folder, no journey).
- **Duolingo** is the analog: habit loop, light scores, collection — still obviously a learning tool.
- **Full RPG / medieval kingdom / combat** is out. “Keep” is the metaphor. The UI stays Paper Cove. Copy may say Keep, due, mastered. No HP, maps, swords, or genre chrome.

Games convert and retain; they also pick a player tribe. We have no audience yet. Do not pick “students” vs “curious AI people” vs “gamers” until family actually uses Ask + a due drop. Until then: Ask-first for everyone, daily tidy for people who tap chips.

**Fine-tune / Fable-5 brute-force overhaul:** not the plan. Frozen spec + Lab slices + Camron taste. **Dev:** Composer 2.5 for lanes/planning; Grok 4.6 only for hard blocks (thin brief). **Ask (post-V2):** Luna default, Grok 4.3 + search when needed — see `web/V2-CHIEF-HANDOFF.md`.

---

## Kinds (colors mean type, not mood)

Existing four. Do not add a fifth rainbow.

| Kind | Typical facts |
| --- | --- |
| **when** | dates, years, durations |
| **where** | places |
| **who** | names, things-as-names |
| **meaning** | definitions, “what it is” |

---

## Lifespan of one fact

**1. Empty Home (first session, or a day with nothing due)**  
Paper Home. Composer, Cove, header buttons. No beads, no seats, no demo Nile on a real account. Ask is the only job.

**2. Ask → harvest**  
In the answer, spans light up by kind. Chips **fly up** into the Keep row. Header is **not** a pond: no ripple, no glass body, no water hit. Short travel + optional land glow. Full-width Keep row (not the old ~60% bar) so beads can accumulate.

**3. Chat header = the Keep**  
Beads in **discovery order**. New bead docks on one consistent side; older beads shift toward the Cove wordmark. Target ~30 visible. Overflow later (`+N` or a Keep sheet) — do not fake infinite dots. Same visit: beads **stay in the Keep**. Going Home mid-session does **not** drop them.

**4. Next session when something is due**  
Not “every Home navigation.” Prefer **calendar day** (user timezone) plus a due scheduler, not RPG respawn. **Due** beads leave the Keep and take Home **seats**. Clusters sit together. Cap how many drop in a day (about 8–12 on Home) even if the Keep holds more. Not due = stay in Keep.

**5. Review**  
Tap a chip or a cluster; review the group with the existing Learn cards. Finish → those beads **fly back** to the Keep with a **level mark** (ring, fill, or quieter treatment — not a new art system).

**6. Clear the field**  
No due chips left on Home: Keep is calm, Home is empty again, plus a **small** clear-the-day moment. Paper wants quiet delight, not confetti every morning. Save bigger juice for first clear or a mastery. Then they can Ask; new harvest is **new**, not due until the scheduler says so.

**7. Mastery**  
After about **3–4** good reviews, the fact **leaves the daily Keep row** and lives in a **Mastered** list. Not deleted. Not on Home. Not fighting the 30. Later: counts by kind (“strong on places”).

---

## Three states in the Keep row

If 30 beads are one candy row, it is noise. Only:

1. **Waiting** — stored, not due  
2. **Due** — will drop / is on Home  
3. **Leveled** — reviewed, back, marked  

**Mastered** is a fourth life-stage **off** that row.

---

## Header / Paper

Paper hid the bar so it is not an object. A strip of beads *is* the Keep. Keep the bar itself invisible: **Cove + buttons + beads**, no pond, no border revival, no water-edge harvest splash. Do not retune `.harvest-fly` to sit under menus (it stays above, z-index 120 in `home.css`).

---

## Cleared Home vs empty Home

| | Look |
| --- | --- |
| Never harvested / nothing due | Boring Paper Ask |
| Due day | Seats fill from Keep — that *is* the event |
| Cleared day | Empty again + a lasting but quiet skin until new due facts (or midnight) |

Preview may fake a full field. Real accounts do not start with toy chips.

---

## Must not (Lab agents)

- Promote / Early access deploy / `vercel --prod`
- Medieval or video-game reskin
- Drop beads on Home in the **same** visit as the Ask that created them
- Bring back header water ripple as the Keep target
- Put mastered facts in the same 30 as new/due
- Confetti on every clear
- What’s-new tour (other branch: `cove-whats-new`)
- VocalLearn app restyle; it stays a side project

---

## Build order when this becomes a ticket

1. Full-width Keep row + fly with no pond (Paper).  
2. Same-visit: Home stays empty of those beads.  
3. Next-day due drop into seats (cap the day’s set).  
4. Review → fly back + level mark.  
5. Clear-the-day quiet state.  
6. Mastered vault + kind stats.  
7. Overflow at 30.

Do one slice per pass. Camron taste on `/preview` before the next slice.
