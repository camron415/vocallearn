# Halo version roadmap — 1.1 → 1.6

**This file is a quick reference.** The canonical source of truth is [`docs/PRODUCT_ROADMAP.md`](../docs/PRODUCT_ROADMAP.md) — update that file first when scope changes.

**Cadence:** ~2 weeks per release · **Updated:** 2026-09-17

| Version | Target | Theme |
| --- | --- | --- |
| **1.1** | 2026-08-30 | Early access — Paper + Cove/Keep (**shipped**) |
| **1.1.1** | Week of 2026-08-31 | Hotfix + **Saves** + calendar-day due (**shipped**) |
| **1.1.2** | 2026-09-02 | Library ≡ recipes, Save pill, recipe UX, morph hotfixes (**live early access**) |
| **1.1.2-mobile** | 2026-09-03 | iPhone header + recipes scroll hotfix (**shipped**) |
| **1.2** | 2026-09-17 | Luna + intent harvest + unbox + lock-in + phone Home (**shipped early access — current live**) |
| **1.3** | Early Oct | Streaks, achievements, grading, **Teach-me opt-in (thin)**, brand planned |
| **1.4** | Mid-Oct | **iOS TestFlight** (mobile priority), Stripe, Teach-me integrated |
| **1.5** | Nov | Polish, legal, public-ish, **Teach-me premium**, ~100 accounts |
| **1.6** | Dec | Android, minigames, full tutor depth |

**Trajectory (2026-09-01):** Slight adjustment — two-door Ask (instant vs opt-in learn), not a pivot. Detail in canonical doc § Trajectory adjustment.

**Fun loop (2026-09-07):** Juice is a multiplier. Lock-in + day-1 play + inspect in flight; no Spark/streaks/7-cap. [`docs/FUN-LOOP.md`](../docs/FUN-LOOP.md).

**iOS fit (2026-09-14):** Lock type scale (`-webkit-text-size-adjust: 100%`). Canonical phone = default Text Size + Standard Display Zoom. First-run Safari QA was confounded by larger text. 1.3 TestFlight is a candidate, not this table yet. [`docs/IOS-FIT-AND-1.3.md`](../docs/IOS-FIT-AND-1.3.md).

**Cue uniqueness (2026-09-16, lab, rides 1.2):** Keep identity = question cue, not the answer word. Jupiter one-word closed Keep — Camron live. `npm run test:ask:claims`. Parked: synonyms, lists. [`INTENT-HARVEST-1.2.md`](./INTENT-HARVEST-1.2.md) § Cue uniqueness.

**1.2 closeout (2026-09-17):** **Shipped** to early access + Family. Review sheet signed (light + dark, phone + desktop). Confirm list + signed play look: [`HARVEST-OPS.md`](./HARVEST-OPS.md) § 1.2 closeout.

## Detail specs

| Version | Doc |
| --- | --- |
| 1.1 shipped | [`RELEASE-1.1.md`](./RELEASE-1.1.md) |
| 1.1.1 | [`PATCH-1.1.1.md`](./PATCH-1.1.1.md) |
| 1.1.2-mobile | [`PATCH-1.1.2-MOBILE.md`](./PATCH-1.1.2-MOBILE.md) |
| 1.1.2 shipped | [`LIBRARY-BACKLOG.md`](./LIBRARY-BACKLOG.md) § Shipped · composer plan [`COMPOSER-MORPH-PLAN.md`](./COMPOSER-MORPH-PLAN.md) |
| 1.2 intent | [`INTENT-HARVEST-1.2.md`](./INTENT-HARVEST-1.2.md) · [`INTENT-HARVEST-RESEARCH.md`](./INTENT-HARVEST-RESEARCH.md) |
| 1.2 chat unbox | [`opus-locks/2026-09-07-chat-unbox.md`](./opus-locks/2026-09-07-chat-unbox.md) — **Camron lab QA 2026-09-07**. Inline bubble edit is **1.3+**. |
| Discovery | [`PRODUCT-DISCOVERY.md`](./PRODUCT-DISCOVERY.md) |
| iOS fit / 1.3 plan | [`docs/IOS-FIT-AND-1.3.md`](../docs/IOS-FIT-AND-1.3.md) — type scale lock + canonical phone QA |
| Fun / retention | [`docs/FUN-LOOP.md`](../docs/FUN-LOOP.md) |
