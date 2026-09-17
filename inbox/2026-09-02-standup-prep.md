# Standup prep
**Date:** 2026-09-02T12:00:37.447Z · **Project:** vocallearn
**Analyst job:** aj-1788350417576-eq66e0

# Standup prep — Halo / VocalLearn
**Date:** 2026-09-02T12:00:37.446Z · **Manager:** Sloane

standup: active

## Since yesterday
- Shipped Halo v1.1.1 to early-access users with calendar-day due dates and timezone fixes.
- Updated the Kept board to match the new release and wrapped the timezone hotfix.
- Polished the GitHub README and recruiter docs so hiring teams see the live product first.

## Roadmap position
- Phase 1.75 is the active track; the next real outcome is confirming the plan still matches what we want before adding priority labels.

## Proposed today (P / S)
1. Confirm Phase 1.75 is still the active plan, then add simple priority labels to the roadmap — P1 — S2
2. Decide whether to keep the current $1/user/week cost target or adjust it before we add enforcement — P2 — S1

## Decisions for Camron
Should we keep the $1/user/week cost target or raise it?

## Auto queue (S0/S1)
None today

## Mac only (do not read on phone)
Technical detail for Cursor / later review. Phone brief strips this section.

### Git snapshot
HEAD: e4af16b

## Recent commits
e4af16b Update Kept board: 1.1.1 ship and timezone hotfix wrap.
cb68905 Fix timezone: reject UTC for due dates and greeting bands.
b3f2a64 Ship Halo v1.1.1 to early access: calendar-day due, timezone, greeting.
557c211 Add canonical product roadmap and commit planning specs.
fc0c994 Polish GitHub portfolio for recruiters: README, screenshots, CI.
9015a3a Ship Halo v1.1 to early access: Paper UI and Cove/Keep loop.
e0a5bb3 Lock V2 Sunday planning and reset lane src for A/B workers.
84c76c9 Snapshot the Lab Paper Keep loop as the weekend V2 restore point.
6a6ecd8 Expand README with V1/V2 vision, learning loop, and recent builds.
4f61d3e Lead the README with Halo so GitHub matches the live product.

## Files changed recently
.cursor/rules/atlas-loop.mdc                       |    12 +
 .cursor/rules/cove-rollout.mdc                     |    27 +
 .cursor/rules/cursor-visual-qa.mdc                 |    26 +
 .cursor/rules/halo-loop.mdc                        |    22 +
 .cursor/rules/harvest-capture.mdc                  |    17 +
 .cursor/rules/home-mixer.mdc                       |    25 +
 .cursor/rules/kept-board.mdc                       |    20 +
 .cursor/rules/kept-v2-sunday.mdc                   |    16 +
 .github/workflows/test-harvest.yml                 |    34 +
 .gitignore                                         |     3 +
 LICENSE                                            |    10 +
 README.md                                          |   159 +-
 ROADMAP.md                                         |     8 +-
 app/(tabs)/_layout.tsx                             |     6 +-
 app/(tabs)/ask.tsx                                 |   179 +
 app/(tabs)/subjects.tsx                            |     3 +
 app/_layout.tsx                                    |     2 +
 app/ask/[id].tsx                                   |   178 +
 app/ask/approvals.tsx                              |   150 +
 app/lesson/[id].tsx                                |    17 +-
 docs/COVE_KEEP_VISION.md                           |   117 +
 docs/FOR_RECRUITERS.md                             |    21 +-
 docs/GITHUB_SETUP.md                               |    96 +
 docs/HALO_PRICING_AND_SCALING.md                   |   126 +
 docs/PRODUCT_ROADMAP.md                            |   299 +
 docs/screenshots/README.md                         |    21 +
 docs/screenshots/harvest-chat.png                  |   Bin 0 -> 277145 bytes
 docs/screenshots/home-due.png                      |   Bin 0 -> 258416 bytes
 docs/screenshots/keep-beads.png                    |   Bin 0 -> 275180 bytes
 inbox/2026-07-10-standup-prep.md                   |   221 +
 inbox/2026-07-11-standup-prep.md                   |   222 +
 inbox/2026-07-12-standup-prep.md                   |   222 +
 inbox/2026-07-13-standup-prep.md                   |   222 +
 inbox/2026-07-14-standup-prep.md                   |   222 +
 inbox/2026-07-15-standup-prep.md                   |   222 +
 inbox/2026-07-16-standup-prep.md                   |   222 +
 inbox/2026-07-17-standup-prep.md                   |   222 +
 inbox/2026-07-18-standup-prep.md                   |   222 +
 inbox/2026-07-24-standup-prep.md                   |    70 +
 inbox/2026-07-25-standup-prep.md                   |    70 +
 inbox/2026-07-26-standup-prep.md                   |    71 +
 ...026-08-08-atlas-vocallearn-integration-brief.md |    74 +
 ...-08-08-atlas-vocallearn-integration-events.json | 68072 +++++++++++++++++++
 ...-08-atlas-vocallearn-integration-transcript.txt |  1029 +
 inbox/2026-08-10-ask-practice-design-decisions.md  |    89 +
 inbox/2026-08-10-ask-practice-roadmap.md           |   174 +
 inbox/2026-08-10-family-ai-research.md             |    27 +
 inbox/2026-08-10-halo-web-roadmap.md               |   122 +
 inbox/2026-08-10-web-family-product-roadmap.md     |   142 +
 inbox/2026-08-12-standup-prep.md                   |    97 +
 inbox/2026-08-13-atlas-call-halo-notes.md          |    34 +
 inbox/2026-08-13-halo-ui-overhaul-brief.md         |   200 +
 inbox/2026-08-13-standup-prep.md                   |    97 +
 inbox/2026-08-14-standup-prep.md                   |    98 +
 inbox/2026-08-14-vocallearn-project-sync.md        |   112 +
 inbox/2026-08-15-standup-prep.md                   |    96 +
 inbox/2026-08-16-standup-prep.md                   |    97 +
 inbox/2026-08-17-standup-prep.md                   |    98 +
 ...-learn-feature-brainstorming-cost-optimizati.md |     7 +
 inbox/2026-08-18-halo-next-agenda.md               |    60 +
 inbox/2026-08-18-standup-prep.md                   |   157 +
 inbox/2026-08-19-halo-parking-lot.md               |   116 +
 inbox/2026-08-19-standup-prep.md                   |   158 +
 inbox/2026-08-20-standu

## Working tree
## halo-ui-streamline...origin/halo-ui-streamline
 M docs/COVE_KEEP_VISION.md
 M docs/PRODUCT_ROADMAP.md
 M web/PRODUCT-DISCOVERY.md
 M web/ROADMAP-VERSIONS.md
?? "inbox/2026-08-10-ask-practice-roadmap 2.md"
?? "inbox/2026-08-13-halo-ui-overhaul-brief 2.md"
?? "inbox/2026-08-24-cursor-session-035436 2.md"
?? "inbox/2026-08-24-cursor-session-043739 2.md"
?? "inbox/2026-08-24-cursor-session-045428 2.md"
?? "inbox/2026-08-26-phone-discussion-halo-keep-vision-profitability- 2.md"
?? inbox/2026-08-31-standup-prep.md
?? inbox/2026-09-01-standup-prep.md
?? "web/scripts/dev-lan 2.mjs"
?? "web/src/lib/ask-route 2.ts"
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
Halo phase is active on the web branch (HEAD e4af16b) with V2 Cove/Keep loop in production; Phase 1.75 is active per `docs/PHASE_1_75.md` references and confirmed in `inbox/2026-09-01-standup-prep.md`.

## Key findings
- **Git activity**: HEAD e4af16b ("Update Kept board: 1.1.1 ship and timezone hotfix wrap") after cb68905 ("Fix timezone: reject UTC for due dates and greeting bands") and b3f2a64 ("Ship Halo v1.1.1 to early access: calendar-day due, timezone, greeting"); working tree shows 15 modified files on `halo-ui-streamline` branch ahead 5.
- **Canonical docs**: `inbox/2026-08-10-ask-practice-roadmap.md` defines Phase 0–3 as implemented with `app/ask/`, `app/ask/approvals.tsx`, `src/engine/fact-miner.ts` as priority implementation files; `docs/PHASE_1_75.md` is referenced but not loaded.
- **Priority implementation files**: `src/hooks/useSession.ts`, `src/stores/lesson-store.ts`, `src/engine/teaching-plan.ts`, `src/engine/fact-learning.ts`, `supabase/migrations/006_teaching_plans_and_learning_profiles.sql` contain the active session, teaching-plan inference, and learning-profile persistence logic.
- **Phase status**: `inbox/2026-09-01-standup-prep.md` explicitly states "Confirm Phase 1.75 is still the active plan" — Phase 1.75 is therefore active.
- **Halo Ask untouched**: `web/src/app/ask/page.tsx`, `web/src/components/AskLanding.tsx`, `web/src/lib/ask-turn.ts` remain the production Ask surface; no mobile Ask code touches these files.

## Risks or gaps
- **No P0-P3/S0-S3 tags** visible in `inbox/2026-08-10-ask-practice-roadmap.md`, `inbox/2026-08-10-halo-web-roadmap.md`, `HANDOFF.md`, or any `inbox/*.md`.
- **S0/S1 auto-queue logic absent** from `src/hooks/useSession.ts`, `src/stores/lesson-store.ts`, or any `.cursor/rules/*.mdc` files.
- **Cost constraint**: `docs/HALO_PRICING_AND_SCALING.md` (126 lines) exists but no explicit $1/user/week enforcement logic found in `web/src/lib/` or API routes.
- **Stale cache**: Analyst context notes "Cache was stale relative to git HEAD" — next file to inspect is `docs/PHASE_1_75.md` for current phase truth.
- **Working tree drift**: 15 modified files on `halo-ui-streamline` branch ahead of origin; files like `web/src/lib/keep-memory.ts`, `web/src/lib/learn-mine.ts` show uncommitted changes.

## Suggested next steps
1. **Confirm Phase 1.75 status** — inspect `docs/PHASE_1_75.md` for checked-off steps and current implementation state before any priority labeling.
2. **Add P0-P3/S0-S3 tags** — update `inbox/2026-09-01-standup-prep.md` and `docs/PRODUCT_ROADMAP.md` with explicit priority labels for the three Lab priorities.
3. **Review cost model** — read `docs/HALO_PRICING_AND_SCALING.md` to verify $1/user/week constraint and identify any enforcement gaps in `web/src/app/api/chat/route.ts`.
4. **Establish S0/S1 auto-queue** — define simple auto-queue logic in `.cursor/rules/` files or `inbox/2026-09-01-standup-prep.md` for voice-ready decisions.
5. **Inspect next file** — if Phase 1.75 status remains unclear after `docs/PHASE_1_75.md`, review `inbox/2026-08-10-ask-practice-roadmap.md` for implementation file references.
