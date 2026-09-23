# Achievement exhibits (museum / trophies)

**Status:** Future vision. **Not 1.3** (lane **22** in [`web/lane-plans/13-1.3-priority.md`](../web/lane-plans/13-1.3-priority.md)). Do not build 3D, a trophy tab, or a curriculum DB from this file.  
**From:** Camron planning chats 2026-09-19–20.  
**Canonical index:** [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md)  
**Loop:** [`COVE_KEEP_VISION.md`](./COVE_KEEP_VISION.md) · juice vs lock-in: [`FUN-LOOP.md`](./FUN-LOOP.md)  
**Craft / haptics / sound:** [`CRAFT-JUICE.md`](./CRAFT-JUICE.md)

Paste for a new tab: `Read docs/ACHIEVEMENT-EXHIBITS.md. Exhibits are finite topic kits (5–8 slots), not one infinite brain. Stones are Keep beads. Body from a catalog. No Lego. No 3D this sprint.`

---

## Why this exists

XP, streaks, and progress bars are thin. Camron wants **progress you can see**: a topic becomes a small object, empty sockets show what’s left, gold means that *kit* is mastered — not a number going up.

This does **not** replace Ask → harvest → Keep beads → Home SAY → ◎. It is a **later skin on clusters**. Beads stay the daily language. Exhibits are what a *topic* looks like when you zoom out.

---

## Units (do not collapse these)

| Unit | What it is | Can “finish”? |
| --- | --- | --- |
| **Stone / bead** | One harvested fact (when / where / who / meaning) | Yes — rim → gold off dock |
| **Exhibit (kit)** | One topic they stayed on (e.g. American Civil War) | Yes — 5–8 slots filled + those beads mastered |
| **Cabinet / shelf** | Loose parent (`history`, `wars`) | No — only a place for **adjacent ghosts** |
| **Museum** | All their exhibits | Never complete. Curiosity is infinite. |

One chat can wander. **Do not** pour three wars into one statue. A hop to 1812 **starts a second exhibit** on the same shelf.

The “brain” is the **museum**, not a trophy. Gold is **this kit**, not “mind complete.”

---

## Soft syllabus (no global textbook)

You do not store the Civil War. The first time a topic is clearly that topic, **one cheap model pass** mints a kit:

> For a **concise** adult fluency kit, what **5–8 atoms** make this exhibit done? Spread kinds. Not 40 generals.

| Layer | Role | Rigid? |
| --- | --- | --- |
| **Slot kit (5–8)** | What “done enough” means | Soft — remint if they clearly changed topic |
| **Their asks** | What fills slots | Free |
| **Empty sockets** | Learn-more / “also in this kit” | Invitation, not homework |
| **2 adjacent ghosts** | Rev War, 1812 — gray on the same shelf | Look-ahead **one step**, not a degree tree |
| **Global curriculum** | Every standard war | **Out** — user curiosity stays the library |

“Comprehensive but concise” = the kit, not the field. 30 holes = Duo chore. 6 sockets = gold means something.

Store on **their Keep** (`topicKey`, parent tag, slot titles, filled chip ids). Not a school catalog.

Teach-me later can walk empty slots — still opt-in, still writes the same beads.

---

## What the object is (not Lego)

**Do not** use bricks, studs, gold bricks, minifigs, or the word Lego in product or art.

Closer analogues: Apple Fitness **3D medals you flick** (theater, not a flat PNG); Animal Crossing **museum sockets** (missing pieces are obvious); Soma/burr / kumiki as *grammar* only (few pieces, one volume); **intaglio / inlaid stone** as the look (Paper, jewelry, museum).

| Part | How it exists | Job |
| --- | --- | --- |
| **Plinth** | 3–5 pre-made Paper stands | Title, dates, `5/8` |
| **Body** | Closed set of ~16–24 silhouettes | Kind of exhibit, not a Wikipedia mesh |
| **Sockets** | 5–8 recesses on every body | The kit |
| **Stones** | **Existing Keep beads** | Kind color. No new chip geometry. |
| **Gold** | Metal pour / shader on the **body** | That exhibit mastered |

**Don’t generate a unique 3D mesh per topic.** Text-to-3D will emit flags, faces, slop, and IP (Lincoln, battle flags, famous bronzes).

Body catalog by **shelf**, not by page: tablet, arch, vessel, orb, compass, book-block, terrain loaf, wreath, generic bust (**no real face**). Civil War and Napoleonic can share **arch + a tiny owned mark**. Identity = **plinth title + mark**, not a generated battlefield.

Gray ghost = empty sockets (and empty adjacent plinths). Full = stones set. Mastered = cast goes gold; stones may keep a hint of kind so it doesn’t become a lump.

---

## Interaction

- **Shelf:** small ¾ still, name on the plinth.  
- **Theater:** tap → one-finger orbit, clamp so it doesn’t flip under the table (Fitness `nonAR` / web turntable). Incomplete is rotatable too.  
- **Not** a walkable 3D museum in chat or Home.

Chat stays fast Ask. Home stays due. Wow lives on **◎ / exhibit inspect**.

---

## House rules (same mint)

- One theater size (mental ~12cm cube). Shelf icons same scale.  
- Materials: Paper stone → kind inlay → gold. No neon rainbow.  
- No letters on the sculpture (type on the plinth).  
- No real people, flags, logos, copyrighted characters, religious icons as the body.  
- No weapons as the cute object. Wars = arch / tablet / wreath.  
- Always 5–8 sockets.  
- Motion: slow orbit. Soft / reduced-motion = still.

---

## Until this ships

A **titled clump of beads** is the honest prototype. Data first: `topicKey` → 5–8 slot titles → fill from chips → 2 neighbor prompts. Visual bust is juice after that.

Frozen craft still frozen: harvest z-index **120**, morph `--travel` **1080ms**, bead diameter, Home seating.

---

## Sentence to keep

**Curiosity lays the first stones. A tiny generated kit says what “Civil War, done” means. Gold is that kit, not the American past. The shelf can hint at the next room. The museum is infinite; each exhibit is not.**
