# Standup prep
**Date:** 2026-09-01T12:00:32.028Z · **Project:** vocallearn
**Analyst job:** aj-1788264014890-uwpp93

# Standup prep — Halo / VocalLearn
**Date:** 2026-09-01T12:00:32.028Z · **Manager:** Sloane

standup: active

## Since yesterday
- Shipped Halo v1.1 to early-access users with the full Cove/Keep learning loop live on the invite-only site.
- Polished the GitHub README and added recruiter-friendly screenshots so hiring teams see the real product first.
- Locked the V2 Sunday planning doc and reset the lab lane so A/B work can start clean.

## Roadmap position
- We're on Phase 1.75 for the web product; the next real outcome is confirming that plan is still active before adding priority labels.
- After that, the next visible step is tagging the ask-practice roadmap so Camron can pick the first small task by voice.

## Proposed today (P / S)
1. Confirm Phase 1.75 is still the active plan, then add simple priority labels to the roadmap — P1 — S2
2. Read the pricing and scaling doc so we have tier numbers ready if early-access users ask about cost — P2 — S1
3. Run a quick visual check on the preview page with the new Paper theme and 16 chips to see if the heat pass looks right from across the room — P3 — S1

## Decisions for Camron
Should we keep the current 5-out-of-10 gamification level, or move it up or down before we lock the next build?

## Auto queue (S0/S1)
- None today

## Mac only (do not read on phone)
Technical detail for Cursor / later review. Phone brief strips this section.

### Git snapshot
HEAD: 557c211

## Recent commits
557c211 Add canonical product roadmap and commit planning specs.
fc0c994 Polish GitHub portfolio for recruiters: README, screenshots, CI.
9015a3a Ship Halo v1.1 to early access: Paper UI and Cove/Keep loop.
e0a5bb3 Lock V2 Sunday planning and reset lane src for A/B workers.
84c76c9 Snapshot the Lab Paper Keep loop as the weekend V2 restore point.
6a6ecd8 Expand README with V1/V2 vision, learning loop, and recent builds.
4f61d3e Lead the README with Halo so GitHub matches the live product.
68308de Lab-only split of Cove CSS into owned files; preserve cascade; do not promote.
b7b497b Ship Cove web so early-access invites can go out.
c0cc60e Publish a recruiter-friendly README; archive engineering notes.

## Files changed recently
.cursor/rules/atlas-loop.mdc                       |    12 +
 .cursor/rules/cove-rollout.mdc                     |    27 +
 .cursor/rules/cursor-visual-qa.mdc                 |    26 +
 .cursor/rules/halo-loop.mdc                        |    22 +
 .cursor/rules/harvest-capture.mdc                  |    17 +
 .cursor/rules/home-mixer.mdc                       |    25 +
 .cursor/rules/kept-board.mdc                       |    20 +
 .cursor/rules/kept-v2-sunday.mdc                   |    16 +
 .github/copilot-instructions.md                    |    14 +-
 .github/workflows/test-harvest.yml                 |    34 +
 .gitignore                                         |     3 +
 LICENSE                                            |    10 +
 README.md                                          |   224 +-
 ROADMAP.md                                         |    10 +-
 app/(tabs)/_layout.tsx                             |     6 +-
 app/(tabs)/ask.tsx                                 |   179 +
 app/(tabs)/subjects.tsx                            |     3 +
 app/_layout.tsx                                    |     2 +
 app/ask/[id].tsx                                   |   178 +
 app/ask/approvals.tsx                              |   150 +
 app/lesson/[id].tsx                                |    17 +-
 docs/COVE_KEEP_VISION.md                           |   117 +
 docs/FOR_RECRUITERS.md                             |    46 +
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
 inbox/2026-08-19-standu

## Working tree
## halo-ui-streamline...origin/halo-ui-streamline
 M web/KEPT-BOARD.md
 M web/src/app/preview/page.tsx
 M web/src/lib/halo-boot.ts
 M web/src/lib/lab-preview.ts
 M web/src/lib/supabase/middleware.ts
?? "inbox/2026-08-10-ask-practice-roadmap 2.md"
?? "inbox/2026-08-13-halo-ui-overhaul-brief 2.md"
?? "inbox/2026-08-24-cursor-session-035436 2.md"
?? "inbox/2026-08-24-cursor-session-043739 2.md"
?? "inbox/2026-08-24-cursor-session-045428 2.md"
?? "inbox/2026-08-26-phone-discussion-halo-keep-vision-profitability- 2.md"
?? inbox/2026-08-31-standup-prep.md
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
Halo phase is active on the web branch (HEAD 557c211) with V2 Cove/Keep loop in Lab preview; Phase 1.75 is active per `docs/PHASE_1_75.md` references and confirmed in `inbox/2026-08-30-standup-prep.md`.

## Key findings
- **Git activity**: HEAD 557c211 ("Add canonical product roadmap and commit planning specs") after e0a5bb3 ("Lock V2 Sunday planning and reset lane src for A/B workers") and 84c76c9 ("Snapshot the Lab Paper Keep loop"); working tree shows 15 modified files on `halo-ui-streamline` branch ahead 5.
- **Canonical docs**: `inbox/2026-08-10-ask-practice-roadmap.md` defines Phase 0–3 as implemented with `app/ask/`, `app/ask/approvals.tsx`, `src/engine/fact-miner.ts` as priority implementation files; `docs/PHASE_1_75.md` is referenced but not loaded.
- **Priority implementation files**: `src/hooks/useSession.ts`, `src/stores/lesson-store.ts`, `src/engine/teaching-plan.ts`, `src/engine/fact-learning.ts`, `supabase/migrations/006_teaching_plans_and_learning_profiles.sql` contain the active session, teaching-plan inference, and learning-profile persistence logic.
- **Phase status**: `inbox/2026-08-30-standup-prep.md` explicitly states "Confirm Phase 1.75 is still the active plan" — Phase 1.75 is therefore active.
- **Halo Ask untouched**: `web/src/app/ask/page.tsx`, `web/src/components/AskLanding.tsx`, `web/src/lib/ask-turn.ts` remain the production Ask surface; no mobile Ask code touches these files.

## Risks or gaps
- **No P0-P3/S0-S3 tags** visible in `inbox/2026-08-10-ask-practice-roadmap.md`, `inbox/2026-08-10-halo-web-roadmap.md`, `HANDOFF.md`, or any `inbox/*.md`.
- **S0/S1 auto-queue logic absent** from `src/hooks/useSession.ts`, `src/stores/lesson-store.ts`, and `inbox/*.md` excerpts.
- **Phase doc visibility**: `docs/PHASE_1_75.md` must be inspected next to confirm whether Phase 1.75 is active.
- **Working tree** shows 15 modified files on branch `halo-ui-streamline` ahead of origin; risk of untracked-file anomalies.

## Suggested next steps
- Inspect `docs/PHASE_1_75.md` to confirm checked-off steps and active status.
- Add P0-P3/S0-S3 priority tags to `inbox/2026-08-10-ask-practice-roadmap.md` and `inbox/2026-08-10-halo-web-roadmap.md`.
- Review `src/hooks/useSession.ts` and `src/stores/lesson-store.ts` for S0/S1 auto-queue implementation gaps.
- Confirm Phase 1.75 remains the active plan before adding priority labels to the roadmap.
- Read `docs/HALO_PRICING_AND_SCALING.md` to prepare tier and cost numbers for any early-access discussion.
