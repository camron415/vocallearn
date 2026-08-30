# V2 chief handoff — 2026-08-29

Camron planning session (Composer 2.5). Pick up here.

## Paste into chief chat

```
Chief — V2 Kept loop. Read web/V2-CHIEF-HANDOFF.md, web/KEPT-BOARD.md, web/HALO-V2-SUNDAY.md.

Status: Opus Lab lock done 2026-08-28. No code until Camron says go. Lanes A/B/Chief idle.

This session (planning only, no ship work):
- Model tiering: Composer 2.5 for planning/status/voice cleanup; Grok 4.6 only for implementation with thin prompts. Opus rare, refined brief only.
- Cut expensive pre-loads: alwaysApply rules (cursor-visual-qa, halo-loop, kept-board, cove-rollout, atlas-loop) burn ~1M tokens/turn on premium models. Planning chats must not trigger Visual QA. Workers get one-liner: "Lane X. Read KEPT-BOARD + HALO-V2-SUNDAY. Claim. Update board." — not full contract re-paste.
- Post-Sunday Ask cost (NOT blocking V2): default GPT-5.6 Luna, tools OFF; Grok 4.3 + search only for files/depth/missed live feeds. Luna search is 2× Grok ($10 vs $5 per 1k calls) — savings are token + no-search, not cheaper search. Track tool invocations separately (limits.ts is token-only today).
- Voice: dump transcripts in Composer 2.5 → brief → paste brief to premium tab. Full pipeline later.
- GrokBot / Chinese APIs / local weights: defer. Composer + existing Halo routing enough for now.

When Camron says go: claim lanes on KEPT-BOARD, dispatch A/B workers, chief owns rims/gold/badge/stomp/distractors. Mix proof before done.

What do you need from Camron before go?
```

## V2 ship (unchanged)

Spec: `web/HALO-V2-SUNDAY.md`. Board: `web/KEPT-BOARD.md`.

| Lane | Owns |
| --- | --- |
| A | `keep-memory.ts` — round index, day cap 2, gold off dock |
| B | `HomeBubbles.tsx` + play CSS — SEE/SAY, miss, dots, end |
| Chief | Keep rims, gold badge, Chat stomp, distractors |
| Camron | Replay Mix proof, Safari, promote |

Frozen: harvest z-index 120, morph 1080ms, sheet 832px, inner 440px, Home seating, bead diameter.

## Cursor model tiers

| Tier | Model | Use |
| --- | --- | --- |
| Planning | Composer 2.5 | Status, handoffs, voice→brief, board updates |
| Workers | Composer 2.5 Fast | Lane implementation against spec |
| Hard | Grok 4.6 | Spec conflicts, ship blockers — **prepped brief only** |
| Rare | Opus 5 | Same as Grok 4.6, shorter |

## Rules token diet

`alwaysApply: true` today (small, keep):

- `halo-loop.mdc`, `kept-board.mdc`, `cove-rollout.mdc`, `atlas-loop.mdc` — short; workers need loop + board

**Fixed 2026-08-29:** `cursor-visual-qa.mdc` → `alwaysApply: false` + globs (CSS, components, captures). **Does not load on Lane A / planning / backend turns.**

`kept-v2-sunday.mdc` — glob-only (`keep-memory`, `HomeBubbles`, etc.), not every turn.

Workers: one-liner paste only. Read `HALO-V2-SUNDAY.md` + `KEPT-BOARD.md`. Do not re-paste Visual QA or Opus locks.

Post-ship: audit whether `atlas-loop` / `cove-rollout` can leave alwaysApply on planning chats.

## Post-Sunday: Ask `/` cost (not V2 scope)

Family already compares Halo to ChatGPT **Luna** — good default voice.

```
Ask route (future)
├─ Luna, tools OFF — chat, lookups with free live feeds (weather/news/markets/sports/etc.)
├─ Grok 4.3, search ON — files, depth, prices/products, feeds missed
└─ Meter: tokens + tool calls ($5/1k search Grok; $10/1k OpenAI)
```

~70% Luna-no-search + 30% Grok ≈ **3–4× more asks** per $1/week cap vs all-Grok+search.

Wiring: abstract `callGrokChat` → provider router, `OPENAI_API_KEY`, env `GPT_LUNA_MODEL=gpt-5.6-luna`. After Sunday.

## Deferred

GrokBot swarms, Chinese model APIs for Cursor, local open-weight, voice pipeline app, rule-file surgery (post-ship audit of `alwaysApply`).
