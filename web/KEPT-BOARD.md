# Kept board

Shared desk for weekend V2. Not Atlas. Not Slack. One file every lane updates.

**Chief** is the Composer chat that wrote this board. Workers report here by editing this file. Separate chats do not message the chief; the chief reads this file (and can search other chats if Camron asks).

**Spec:** `web/HALO-V2-SUNDAY.md` (Opus Lab lock, 2026-08-28). This board is status only.

**Harvest ops (telemetry, QA, mobile, promote):** [`web/HARVEST-OPS.md`](./HARVEST-OPS.md) — read before tuning or early access.

Updated: 2026-09-02T22:45-06:00  
By: Chief (1.1.2 hotfix: recipes dark + save speed + morph)

## Lanes

| Lane | Status | Holder | Files | Last |
| --- | --- | --- | --- | --- |
| A Auth paper | done | tab A | `AuthShell`, `LoginForm`, `InviteSetup`, `halo-boot`, `LoopSkin` auth | 13:52 |
| S Settings audit | **done** | this tab | unlocked | 13:48 |
| B Round GUI | idle | — | unlocked | 22:02 |
| Chief | **done** | this chat | recipe dark, manila list wash, local parse save, morph ghost/draft | 22:45 |
| M Menu+chat unify | done | this chat | unlocked | 12:35 |
| Camron | **done** | — | v1.1 live at halo-gules-three.vercel.app — wife/parents hard refresh + Early access invite | 19:10 |
| Chief QA fixes | done | prior chat | unlocked | 14:28 |
| QA-2 | done | prior chat | unlocked | 17:30 |
| QA-3 | done | this chat | unlocked | 18:08 |
| H Harvest polish | **done** | this chat | unlocked | 18:35 |

Status: `idle` · `claimed` · `in_progress` · `blocked` · `done`

## Locks

- Chief 1.1.2 hotfix — unlocked. Morph `--travel` 1080ms and harvest z-index 120 untouched.
- Lane H — unlocked.
- Lane A — unlocked.
- Lane S — unlocked.
- Chief QA — unlocked.
- QA-2 — unlocked.
- QA-3 — unlocked.

## Blockers

None.

## Log (newest first)

- 2026-09-02 chief — **Morph dead-air shipped** (`057a948`). Chat route prefetched during travel; thread arrival fade 1080→360ms (was reading as a blank screen); `is-arrive-fast` settles greeting + chips in 340ms when coming from chat instead of a second full travel. `--travel` still 1.08s, harvest z 120 untouched. Open: model call still starts on chat mount, not during travel.
- 2026-09-02 chief — **Morph hotfix shipped** (`73eacb5`). Travel starts with Enter (parallel prepareOnly); no home→chat ghost overlap; chat→home travel restored; chips wait for composer; save highlight `fit-content`.
- 2026-09-02 chief — Camron asked Saves-from-chat + opt-in facts. **Unity:** Keep auto-harvest stays; Library is opt-in recipes/lists. **Tonight if go:** Save-this-recipe pill (~4/10). Opt-in facts 8/10 — 1.2. Detail in `LIBRARY-BACKLOG.md`.
- 2026-09-02 chief — Library trimmed: recipes only; Motion removed from Library. Soft now skips harvest flights (was OS-only). Parking lot: `web/LIBRARY-BACKLOG.md`.
- 2026-09-01 chief — **Night closed.** 1.1.1 on early access: `b3f2a64` + TZ hotfix `cb68905` live at halo-gules-three.vercel.app. Camron confirmed Good evening + Settings trim. Migration 016 run. Chips with early UTC-midnight due repair on next load; Camron will review tomorrow. **Next:** Saves (1.1.1 item 4) or 1.2 when ready. Docs roadmap edits still uncommitted locally.
- 2026-09-01 chief — **TZ hotfix** `cb68905`: reject UTC for due/greeting; morning from 5am; repair UTC-midnight dueAt on hydrate. Deployed prod same night after Camron saw Good morning at 10pm.
- 2026-09-01 chief — **1.1.1 LIVE early access** `b3f2a64` → prod READY. Migration 016 on prod. Saves parked.
- 2026-09-01 chief — **1.1.1 tonight plan (no code yet).** Waiting Camron go. Three slices: (1) first due = next local calendar day in `keep-memory.ts` `addKeepChip`; (2) IANA TZ on profile + Vercel geo headers for clock/weather (not raw IP); (3) greeting = local time-of-day unless today’s due field was actually cleared. Saves (item 4) parked. PASS_GAP 1/3/7 unchanged. No promote.
- 2026-09-01 chief — **Roadmap locked (docs only):** `docs/PRODUCT_ROADMAP.md` § Trajectory adjustment — two-door Ask, intent qualify, Teach-me thin 1.3 / integrated 1.4 / premium 1.5, iOS 1.4 after Safari QA. Updated `web/PRODUCT-DISCOVERY.md`, `docs/COVE_KEEP_VISION.md`, `web/ROADMAP-VERSIONS.md`. No new files. No code.
- 2026-09-01 chief — Vision weigh-in only (no code). Camron Atlas call + notes + Gemini Socratic thread vs `docs/PRODUCT_ROADMAP.md`. Signal: casual Ask harvest is the real tension; wife 24h wait already 1.1.1. Do **not** pivot to K-12 curriculum/textbook library. Slight adjustment candidate: Ask still answers; Teach-me / Socratic as opt-in second door (maybe pull toward 1.3, not 1.6). 1.1.1 Saves + calendar due unchanged. Sunday freeze (no XP/streaks in V2) still holds.
- 2026-08-31 chief — **Portfolio `/preview`:** hide lab mixer on production; `?mixer=1` or localhost still shows `PreviewSwitcher`. Default `/preview` skin **paper** (middleware + halo-boot). `noindex`. **Deployed** prod `halo-gules-three.vercel.app`.
- 2026-08-31 chief — Camron planning: header has no room for “Lists” text; recommend **bookmark icon** or **Library `≡` drawer** (Recipes + Lists), Cove not duplicate ← Home on chat; Save flyer lands on icon. Wrote `web/INTENT-HARVEST-RESEARCH.md` — memory science (4-chunk WM, retrieval practice, spacing), closed-only play, intent pipeline (classify → miner → validator → fallback), 3–5 chip budget by answer length, kind diversity, telemetry tuning. 1.1.1 Saves + 1.2 intent unchanged. No code.
- 2026-08-30 promote — v1.1.0 commit `9015a3a` pushed `halo-ui-streamline`. `npx vercel deploy --prod` → **https://halo-gules-three.vercel.app** READY. Migrations 014+015 on prod (Camron). Next: Early access invites; wife/parents hard refresh Safari. Harvest polish shipped. H1: `findHarvestNeedle` (exact → case → markdown-stripped → fact key / digits) in `harvestMarkdown` + `splitHarvestText`; miner keeps cards via token/answer if span misses; prompt nudges capital + population. H2: flyers fall back to last assistant bubble; silent instant only for reduced motion. Tests 3/3. Untouched: z-index 120, morph 1080, beads, seating, Keep sync.
- 2026-08-30 chief — Camron sign-off except harvest: capital asks inconsistent; Jakarta/largest-city got beads, no highlights, no flyers. Diagnosed: strict `indexOf` in `harvestMarkdown` + `spanInReply`; `HarvestFlights` silent instant after 36 frames. Wrote `web/V2-LANE-HARVEST-POLISH.md` — H1 fuzzy match + miner nudge, H2 flyer fallback from assistant bubble. Speed/mobile/sync OK. Untouched: z-index 120, morph 1080.
- 2026-08-30 QA-3 — Phone dice-5 seats above greeting/composer (`home-pack` PHONE_MASTER, composer wall). Chat: wrap + 100% width chain, composer grid so Attach/Dictate/Send sit on a second row. Cove + ◎ left-aligned with History/Settings. Kept panel `position:fixed` inset + wrap. Keep sync: `halo_keep_state` + `GET/PUT /api/keep` + debounce push on persist. Need Camron to run migration 015. Untouched: harvest 120, morph 1080, bead diameter, desktop 16-seat map.
- 2026-08-30 QA-2 — Reverted visualViewport stage pin (`--app-top` / `--app-height`). Keyboard sets `--kb-inset` only; pad Home/Chat/play. Stages use `100dvh`, `top: 0`. Chat: wrap + 12px inline, `width: auto` bubbles. Phone History/Settings icon-only. Typeahead 2 rows above field. Play SAY: preventScroll focus, scroll into play card. Untouched: harvest 120, morph 1080, bead diameter, seating.
- 2026-08-30 QA-2 — Mobile pass 3 (recording + extra QA). Keyboard: `data-halo-kb` from visualViewport; ask-stage fixed like chat so iOS doesn't crush SAY/composer; no idle suggest on phone (first tap focuses); typeahead stacks above field. Chat: grid `minmax(0,1fr)` + break-word so answers wrap. Harvest burst clamped to viewport; land box clamped. Ghost on Chat→Home cleared when auto-soft skips morph (gray stadium). Play miss: sheet scrolls inside, extra bottom buffer, shorter pills. Header beads: keep full diameter, pocket ~3 visible, stronger left fade. Keep still localStorage — not synced. Camron hard-refresh iPhone.
- 2026-08-30 QA-2 — Camron mobile QA pass 2. Harvest fly skipped on iPhone: auto-soft set `reduced` and ChatThread skipped flights — now only `prefers-reduced-motion`. Play pills: single column, rounded rect (not egg ovals), centered; play sheet vertically centered on phone. Chat: restore horizontal padding, kill scrollbar-gutter clip. Home: one-tap composer focus; `ask-stage` overflow hidden; hero lifts when suggest open (no page scroll). Due chips slightly larger on phone. Camron retest harvest fly in chat + composer tap + play WHO/MEANING.
- 2026-08-30 QA-2 — Claimed. Camron retest: history scroll + Keep wipe good; resume still needs `?`; capital of Maine no harvest; white thinking panel still there. Next: retry resume after remount (do not abort same-id cleanup), exempt lookup replies from minReplyLength 40, remove `.work-thinking::after` on paper.
- 2026-08-30 chief — QA bugs shipped. Resume: keep `halo-ask-live` until stream ok; abort no longer eats the generating lock. Hold: `askId` on harvest, live `/ask/{uuid}` not `"1"`/`/preview`. History: card `overflow:hidden`, list scrolls. Thinking fade uses `--paper-card`. Harvest: closed facts (capital/counts) no longer skipped; weather/news still skip; miner prompt keeps closed facts; min ask 8 chars. Keep store `halo-keep-v2` (empty start). Live Home cap 16; mixer `chips` null no longer clamps to 1. Harvest still lands Keep until due. Tests: 3/3 harvest fixtures, 8/8 dry smoke. Untouched: z-index 120, morph 1080ms, pack algorithm.
- 2026-08-30 chief — Camron screen recording (~115s) frame review. Confirmed: chat resume fails ~8s after morph (needs `?`); hold → preview Nile + Mix; history card scroll; work-thinking `#fff` gradient; play round 2 dots = 1 due chip; day-cap line at end. Harvest: lookup skip blocks Spain; fresh harvest stays Keep until due. Next: fix resume + hold routing + history overflow + thinking CSS; decide harvest policy for closed lookups on real `/ask`.
- 2026-08-30 A — Done. `/login` + `/invite` paper: no WaterPane, inset fields, stone submit. `halo-boot` forces `data-home-skin=paper` on those routes only (`isAuthPaperPath`). LoopSkin auth card/field/button + dark parity. HTML 200: login, preview login/join, invalid invite. Browser MCP down — Camron still needs light/dark eyes. Unlocked.
- 2026-08-30 S — **Fix:** `/ask` was still V1 glass because `halo-boot` forced `data-home-skin=ours` on every non-preview route (and re-applied on `pageshow`). Now all signed-in routes default paper; only `/preview` mixer can pick Ours. Layout SSR default flipped to paper. Hard refresh `/ask` to see V2. Paper on `/ask` without taking halo-boot: middleware `x-halo-home-skin=paper` off-preview; `APP_PAPER_INLINE` + `AppPaperSkin` after boot (halo-boot still snaps /ask to Ours). Settings: dry inset name field, admin invites + Family activity, usage $, **Sign out for everyone**. Invite URL uses paper inset. `/admin` inset list. `isAdmin` already wired Ask + Chat. Unblocked a 500: duplicate `PREVIEW_SKIN_COOKIE` in halo-boot (A mid-edit) — A should keep one export. Next: Camron Settings QA after A lands.
- 2026-08-30 chief — **Pre-promote gaps:** login + invite still V1 glass (`WaterPane` in `AuthShell`). Worker briefs: `web/V2-LANE-A-AUTH-PAPER.md` (Lane A), `web/V2-LANE-S-SETTINGS.md` (Lane S). Settings **already has** admin invites, usage $, sign-out — S lane audits paper skin + `isAdmin` wiring. Camron QA order: A → S → `deploy:lab` → `/ask`. Harvest smoke 11/11 green.
- 2026-08-30 chief — Preview **Harvest lab** in mixer (Chat screen): Canned / Live Nile / Skip weather / Live Rome / Re-visit / Reset. `POST /api/dev/harvest-mine` localhost only. Highlights + flights via `halo-harvest-live` event. `npm run test:harvest:live` (gate + Grok miner), `test:harvest:live:dry` (gate only). Reports in `web/reports/harvest-smoke-latest.md`. `mineLearnFromReply` for API-free miner tests. 11 cases: 8 ephemeral gates, Nile cluster, Rome, Nile dedup. `harvest-policy.ts` (V2 closed-only, lookup skip, ephemeral reply guard). `learn-mine.ts` exports `shouldSkipHarvest`, `parseMinerJson`, `cardsFromMinerJson`, `sameShapeAsAnswer`. Fixtures: 6 ephemeral API types, Nile cluster, dedup, distractor shape, open rejection. `harvest-client-fixtures` for re-flight dedup. `npm run test:harvest` → 3/3 suites pass. `flights?` on lookup regex. Typeahead = whole-string prefix only; `prefix-seeds.json` (~3/letter). Light paper tokens unchanged.
- 2026-08-30 M — Menu + chat Paper unify shipped in Lab. New `MenuSheet.tsx` = one shell + one motion for History and Settings, growing from whichever composer is on screen (Home Ask composer, Chat follow-up dock); dock-first anchor query so both entries share the code path. New tokens `--menu-grow` 520ms / `--menu-shrink` 380ms on the play-sheet easing — play sheet and morph stay 1080ms. `data-halo-sheet` fades the source composer out on grow, back in at the start of the shrink; veil is field at 94% + blur so the field stays readable behind. Added `--paper-sunk` (`#ECEBE7` / `#3A3A3C`) for the chat user bubble. Lock: `opus-locks/2026-08-30-menu-chat-unify.md`.
- 2026-08-30 chief — Opus follow-up: fill-first paper ladder. Card = `#F3F2F0`/`#2C2C2E` + shadow, no outline. Inset hairline both modes (`0.05` / `0.06`). User bubble inset no border; AI bubble card no border; highlights untouched. History/Settings = centered 832px card, Close in-header, section labels match play-sheet kind type, History rows stone hover, segmented stone / `#171719`. Verified History + Settings light/dark and Chat light. Untouched: harvest 120, `--travel` 1080ms, seating, beads, rims, stone hex tokens.

## Blockers

None.

## Log (newest first)

- 2026-08-29 chief — Opus Brief 4 implemented: `--paper-field` / `--paper-card` / `--paper-inset` in LoopSkin; play card/pill flip; band `color-mix` off bead + card; History/Settings/composer/chat assistant wired; Kept panel card + inset rows. Lock: `opus-locks/2026-08-29-visual-unify.md`. Build green. Camron: replay same 8 screenshots light/dark.
 Fixed broken dark-mode rule in home.css (orphan `}`). TS: AskLanding null guard, HarvestFlights `flight.chip.id`, excluded lane C/D lib-check files from tsconfig. Preview should load. Camron: re-run replay suite (partial credit + bank flight + r2/r3). End card always `You did good.`; passed above failed; Banked / Still working only when mixed; passed full + bead band +1 at 60ms row / 200ms band; failed 55% no flight. Done → batch `LoopFlights` bank then A’s `finishRound([{id, passed}])`. Miss-once = fail (stay Home). SAY shuffled vs SEE; per-chip `roundIndex` so r3-fail plays r1 SEE+cue. Dots centered in play CSS. Day-cap line when `recordRoundOpen(clusterId)` false. No keep-memory. Unlocked HomeBubbles + home.css. Mix proof is Camron Replay — browser tool was down here.
- 2026-08-29 A — Done. Per-chip `finishRound([{id, passed}])` splits cluster; failed stay Home; r3 fail → `clears` 0 / r1. `DAY_ROUND_CAP` 3. `recordRoundOpen(clusterId)`: first same-cluster remainder re-tap is free; further consume. `isRemainderFreeTap` / `roundOpenWasFree` / `canOpenRound(clusterId)`. `roundsLifetime` on dismiss except free retry; on `readLoopStats`. Legacy `finishRound(ids, "clean"|"miss")` still works. Unlocked keep-memory.
- 2026-08-29 chief — Kept panel = `Kept` + summary + prompt/answer/kind (~40vh). Larger ◎ and dock beads. Light play sheet white + 1px edge (LoopSkin). Day-cap `top: 22%`. Dots centered (LoopSkin). Re-harvest flies only new facts. Nile token `4,130 miles`. Waiting A `roundsLifetime` on `readLoopStats`. Did not touch keep-memory / HomeBubbles / home.css.
- 2026-08-29 A — Claimed keep-memory. Per-chip finishRound split, day cap 3, remainder-free first re-tap, roundsLifetime on dismiss (not free retry), r3 fail → r1. No GUI.
- 2026-08-29 chief — Camron amend: day cap 3, 1st remainder retry free, r3→r1+bronze visual. A/B prompts issued; chief waits go.
- 2026-08-29 chief — Camron partial-credit lock: per-fact pass/fail, cluster split, end-card bead rows + band + bank flight; failed chips stay Home; re-round = missed only, still SEE+SAY. Docs: `V2-PARTIAL-CREDIT-LOCK.md`, `V2-OPUS-BRIEFS.md` (one Opus call for edge cases, not per CSS fix).
- 2026-08-29 B — Done. Same 832px sheet, inner 440. SEE-all then SAY-all (r3 = two SAY prompts). Dots with SEE|SAY gap. Miss: `Not quite —` + quote, retry same fact, no red. Correct hold 500/700. End `You did good.` + Done. SAY underline, Enter only, r1 cue `N—— —— ——`. Wired A’s `roundIndex` / `recordRoundOpen` / `finishRound`. Play-sheet LoopSkin: body `#FCFCFB`, no full wash, no red miss. Unlocked HomeBubbles + home.css. Mix proof is Camron Replay — browser tool was down here.
- 2026-08-29 chief — Rims are 3px inset metals (`#A0703C` / `#8C97A0` / `#B98A1E`) on LoopSkin + Paper. Keep dock hides gold; badge `◎ N` right of Cove opens a static Kept panel (Esc / outside). Chat + header skip re-harvest of due/gold facts; miner dedupes token/answer; Nile miles distractors are all miles. Home due chips get a 1px kind outline in LoopSkin (seats untouched). Next: Mix gold fade + Safari rims once B’s round lands. Preview is up at localhost:3000/preview.
- 2026-08-29 A — Done. `roundIndex` from clears (not lateness). Clean round → 1d/3d/7d; clean r3 → gold, `sortKeepBeads` drops them. Miss keeps cluster due today, no index bump. `recordRoundOpen` day cap 2 (third tap false). Home cap 16. Harvest merge + cluster bank do not demote Home due. Mix: Tutorial → Due now → Clear ×3 for gold off dock; Miss stays; Demo pack → Due now = 16; Master then Due now stays off Home; Bank undoes. B: `roundIndex`, `recordRoundOpen`, `finishRound(ids, "clean"|"miss")`. Unlocked keep-memory.
- 2026-08-29 A — Claimed keep-memory. Round index, clean-round 1d/3d/7d, day cap 2, gold off dock, harvest merge must not demote due. No GUI.
- 2026-08-29 B — Claimed. Round GUI: SEE-all then SAY-all, miss reteach, dots, end card, inner 440. No keep-memory.
- 2026-08-29 chief — Planning snapshot committed; lane src reset to `84c76c9` (`keep-memory`, `HomeBubbles`, `home.css`, `harvest`, `learn-mine`). Chief C/D libs left untracked. Camron spawning A/B tabs next.
- 2026-08-29 planning — Arcs parked. r3 = two different SAY prompts (not duplicate). Grading normalizer in spec. A/B paste ready. Commit planning before go recommended. Luna post-V2.
- 2026-08-29 planning — Cost/model handoff in `web/V2-CHIEF-HANDOFF.md`. Post-Sunday Luna tier noted in Sunday spec. Still waiting **go**. No lane claims.
- 2026-08-28 chief — Opus Lab lock written to `HALO-V2-SUNDAY.md` and lane packets. Sheet 832px + inner 440px. Gold badge not tappable list. No code until go.
- 2026-08-28 chief — Opus F is the candidate lock. Conflicts to resolve: sheet width (morph = composer width, not 440px); Home two-arcs vs frozen field. Camron still in that Opus chat.
