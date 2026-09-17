# Standup prep
**Date:** 2026-09-03T12:00:44.048Z · **Project:** vocallearn
**Analyst job:** aj-1788436820123-dljk7x

# Standup prep — Halo / VocalLearn
**Date:** 2026-09-03T12:00:44.048Z · **Manager:** Sloane

standup: active

## Since yesterday
- Shipped 1.1.2-mobile hotfix for iPhone header crowding and recipes scroll.
- Closed the night on the Kept board after the mobile release.
- Started Grok streaming during the Home-to-Chat travel transition.

## Roadmap position
- Phase 1.75 is the active track; we are polishing the Ask surface and Cove/Keep loop for early-access users.
- Next real outcome is confirming the Phase 1.75 checklist is still the plan before any further work.

## Proposed today (P / S)
1. Confirm Phase 1.75 is still the active plan, then add simple priority labels to the roadmap — P1 — S2
2. Run a quick voice-only demo of the mobile header and scroll fixes on the live site — P2 — S1
3. Decide whether to keep the AskShell lab proof parked or move it to the auto-queue — P3 — S3

## Decisions for Camron
Do we keep the AskShell lab proof parked for now, or move it to the auto-queue?

## Auto queue (S0/S1)
None today

## Mac only (do not read on phone)
Technical detail for Cursor / later review. Phone brief strips this section.

### Git snapshot
HEAD: d3bc163

## Recent commits
d3bc163 Close night on Kept board after 1.1.2-mobile ship.
136d15f Ship 1.1.2-mobile: iPhone header and recipes scroll hotfix.
513a344 Start Grok during the Home→Chat travel.
9362640 Restore the Home↔Chat morph: travel, cover, swap.
63c632c Fix sequential morph blank: one FLIP, ghost cover.
ab2db9b Log the morph dead-air fix on the Kept board.
057a948 Cut the dead air on both morph legs.
73eacb5 Hotfix morph timing: start travel immediately, fix overlap.
eab43b2 Hotfix v1.1.2: recipe dark mode, instant save, morph polish.
623b1bc Ship Halo v1.1.2: Library saves, recipe pill, and demo routes.

## Files changed recently
web/KEPT-BOARD.md                   | 14 ++++----
 web/PATCH-1.1.2-MOBILE.md           | 22 ++++++++++++
 web/ROADMAP-VERSIONS.md             | 18 ++++++----
 web/package.json                    |  2 +-
 web/src/app/styles/chat.css         |  2 ++
 web/src/app/styles/home.css         |  5 +++
 web/src/app/styles/motion.css       | 28 +++++++++++++--
 web/src/app/styles/overlays.css     | 15 ++++++++
 web/src/components/AskLanding.tsx   | 48 +++++++++++++++++---------
 web/src/components/ChatThread.tsx   | 68 ++++++++++++++++++++++++++-----------
 web/src/components/HistoryMenu.tsx  |  4 ++-
 web/src/components/LoopSkin.tsx     |  3 +-
 web/src/components/RecipesBoard.tsx |  2 +-
 web/src/components/SettingsMenu.tsx |  4 +--
 web/src/components/SpringStage.tsx  | 59 ++++++++++++++++++--------------
 web/src/lib/pending-turn.ts         | 48 ++++++++++++++++++++++++++
 16 files changed, 261 insertions(+), 81 deletions(-)

## Working tree
## halo-ui-streamline...origin/halo-ui-streamline
 M README.md
 M docs/COVE_KEEP_VISION.md
 M docs/FOR_RECRUITERS.md
 M docs/PRODUCT_ROADMAP.md
 M web/PRODUCT-DISCOVERY.md
 M web/README.md
 M web/src/app/globals.css
 M web/src/components/AskLanding.tsx
 M web/src/components/ChatThread.tsx
?? "inbox/2026-08-10-ask-practice-roadmap 2.md"
?? "inbox/2026-08-13-halo-ui-overhaul-brief 2.md"
?? "inbox/2026-08-24-cursor-session-035436 2.md"
?? "inbox/2026-08-24-cursor-session-043739 2.md"
?? "inbox/2026-08-24-cursor-session-045428 2.md"
?? "inbox/2026-08-26-phone-discussion-halo-keep-vision-profitability- 2.md"
?? inbox/2026-08-31-standup-prep.md
?? inbox/2026-09-01-standup-prep.md
?? inbox/2026-09-02-standup-prep.md
?? inbox/2026-09-03-cursor-session.md
?? web/COMPOSER-MORPH-PLAN.md
?? "web/scripts/dev-lan 2.mjs"
?? web/src/app/ask/layout.tsx
?? web/src/app/preview/layout.tsx
?? web/src/app/styles/ask-shell.css
?? web/src/components/AskShell.tsx
?? "web/src/lib/ask-route 2.ts"
?? web/src/lib/ask-shell.ts
?? "web/src/lib/coarse-pointer 2.ts"
?? "web/src/lib/harvest-capture-fs 2.ts"
?? "web/src/lib/harvest-lab-presets 2.ts"
?? "web/src/lib/harvest-score 2.ts"
?? "web/src/lib/keep-cloud 2.ts"
?? "web/src/lib/keep-land 2.ts"

### Test status
_Tests not run (set ATLAS_MANAGER_RUN_TESTS=1 to enable)._

### Analyst findings
## Headline
Halo Ask surface remains the sole live shipping surface; Phase 1.75 is active per canonical docs; P0-P3/S0-S3 tags and read-only production constraint are not yet enforced in roadmap or inbox files.

## Key findings
- **Git activity**: HEAD d3bc163 ("Close night on Kept board after 1.1.2-mobile ship") after 136d15f ("Ship 1.1.2-mobile: iPhone header and recipes scroll hotfix") and 513a344 ("Start Grok during the Home→Chat travel"); 16 files changed, 261 insertions, 81 deletions.
- **Canonical docs**: `inbox/2026-08-10-ask-practice-roadmap.md` and `inbox/2026-08-10-halo-web-roadmap.md` define Ask as the front door and production surface; `docs/PHASE_1_75.md` is referenced in multiple standup briefs as the active track.
- **Priority implementation files**: `web/src/components/AskLanding.tsx`, `web/src/components/ChatThread.tsx`, `web/src/lib/ask-route.ts`, `web/src/app/ask/layout.tsx` contain the live Ask surface; `web/src/lib/keep-memory.ts`, `web/src/lib/learn-mine.ts`, `web/src/components/HarvestFlights.tsx` implement the Cove/Keep loop on top of Ask.
- **Phase status**: `inbox/2026-09-02-standup-prep.md` and `inbox/2026-09-01-standup-prep.md` explicitly state "Phase 1.75 is the active track" and "Phase 1.75 is active per `docs/PHASE_1_75.md` references".
- **Cost target**: `docs/HALO_PRICING_AND_SCALING.md` and `inbox/2026-08-26-phone-discussion-halo-keep-vision-profitability- 2.md` reference the ~$1/user/week target; no instrumentation or enforcement code is visible in recent commits.

## Risks or gaps
- No P0-P3/S0-S3 priority tags exist in `docs/PRODUCT_ROADMAP.md`, `web/ROADMAP-VERSIONS.md`, or any inbox file; `inbox/2026-09-02-standup-prep.md` proposes adding them but the change is not yet committed.
- Read-only constraint preventing edits to Halo production source is not codified; working tree shows direct modifications to `web/src/components/AskLanding.tsx` and `web/src/components/ChatThread.tsx` on the `halo-ui-streamline` branch.
- Cost tracking for Grok calls is absent; `docs/HALO_PRICING_AND_SCALING.md` exists but no per-user instrumentation or weekly cap enforcement is present in `web/src/app/api/chat/route.ts` or related files.
- Uncommitted files in working tree (`web/src/lib/ask-route 2.ts`, `web/src/lib/keep-cloud 2.ts`, etc.) indicate parallel experimental work that could drift from the single Ask surface.
- No S0/S1 auto-queue logic is implemented; standup briefs list "None today" for the auto queue section.

## Suggested next steps
1. Inspect `docs/PHASE_1_75.md` to confirm the exact checklist of implemented steps and extract the current priority definitions.
2. Review `docs/PRODUCT_ROADMAP.md` and `web/ROADMAP-VERSIONS.md` to locate the section where P0-P3/S0-S3 labels should be added and verify the $1/user/week cost target is stated.
3. Check `web/src/app/api/chat/route.ts` and `web/src/lib/keep-memory.ts` for any existing usage counters or cost logging that could serve as the enforcement hook.
4. Scan the uncommitted files list (`inbox/2026-08-24-cursor-session-*.md`, `web/src/lib/ask-route 2.ts`, etc.) to determine whether any represent production-bound changes that must be rejected or merged under the read-only rule.
5. Prepare a one-page addendum for the next planning session that codifies the read-only constraint language and the P0-P3/S0-S3 tagging convention before any further commits land on the Ask surface.
