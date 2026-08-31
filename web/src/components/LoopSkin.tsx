"use client";

import { useLayoutEffect } from "react";

/** Rides with JS so Safari can ignore a cached CSS chunk and still get the loop. */
const LOOP_CSS = `
html[data-halo-loop="17"] {
  --paper-field: #fafaf9;
  --paper-card: #e8e6e2;
  --paper-card-border: transparent;
  --paper-card-shadow: 0 8px 28px rgba(0, 0, 0, 0.07);
  --paper-inset: #f2f1ee;
  --paper-inset-border: rgba(0, 0, 0, 0.05);
  --paper-action: #d6d2ca;
  --paper-action-hover: #cac6be;
  /* Recessed fill for surfaces that get no hairline (chat user bubble).
     Light: darker than the field so it reads without an outline.
     Dark: the inset value already carries enough separation. */
  --paper-sunk: #ecebe7;
  --paper-field-input: #171719;
  background: var(--paper-field);
  background-color: var(--paper-field);
}
html[data-halo-loop="17"][data-halo-theme="dark"] {
  --paper-field: #0e0e10;
  --paper-card: #2c2c2e;
  --paper-card-border: transparent;
  --paper-card-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
  --paper-inset: #3a3a3c;
  --paper-inset-border: rgba(255, 255, 255, 0.06);
  --paper-action: #48484a;
  --paper-action-hover: #545456;
  --paper-sunk: #3a3a3c;
  --paper-field-input: #171719;
}
html[data-halo-loop="17"] .ask-stage,
html[data-halo-loop="17"] .chat-stage,
html[data-halo-loop="17"] .chat-scroll {
  background: var(--paper-field);
}
html[data-halo-loop="17"] .chat-scroll .msg.msg--user {
  background: var(--paper-sunk) !important;
  background-color: var(--paper-sunk) !important;
  border: 0 !important;
  box-shadow: none !important;
}
html[data-halo-loop="17"] .msg--assistant,
html[data-halo-loop="17"] .msg--live {
  background: var(--paper-card) !important;
  background-color: var(--paper-card) !important;
  border: 0 !important;
  box-shadow: none !important;
}
html[data-halo-loop="17"] .work-thinking {
  max-height: none !important;
  overflow: visible !important;
}
html[data-halo-loop="17"] .work-thinking::after {
  content: none !important;
  display: none !important;
  background: none !important;
}
html[data-halo-loop="17"] .keep-pocket {
  overflow: visible !important;
}
html[data-halo-loop="17"] .keep-dock--beads {
  --keep-n: 12;
  --keep-gap: 0.22rem;
  --keep-slot: 1.02rem;
  flex-wrap: nowrap !important;
  justify-content: flex-end !important;
  gap: var(--keep-gap) !important;
  max-width: min(28rem, 56vw) !important;
  overflow-x: hidden !important;
  padding-left: 0.4rem !important;
  scrollbar-width: none !important;
}
html[data-halo-loop="17"] .keep-dock--beads.is-clipped {
  mask-image: linear-gradient(to right, transparent, #000 0.7rem, #000 100%) !important;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 0.7rem, #000 100%) !important;
}
html[data-halo-loop="17"] .keep-dock--beads::-webkit-scrollbar {
  display: none !important;
  height: 0 !important;
}
html[data-halo-loop="17"] .keep-dock--beads .keep-bead,
html[data-halo-loop="17"] .keep-bead.keep-bead--dock {
  width: var(--keep-slot, 1.02rem) !important;
  height: var(--keep-slot, 1.02rem) !important;
  flex: 0 0 auto !important;
}
html[data-halo-loop="17"] .keep-land {
  width: 0 !important;
  height: 1.02rem !important;
  flex: 0 0 auto !important;
  pointer-events: none;
  visibility: hidden;
}
html[data-halo-loop="17"] .keep-bead--rank-0 {
  box-shadow: none !important;
}
html[data-halo-loop="17"] .keep-bead--rank-1 {
  box-shadow: inset 0 0 0 3px #A0703C !important;
}
html[data-halo-loop="17"] .keep-bead--rank-2 {
  box-shadow: inset 0 0 0 3px #8C97A0 !important;
}
html[data-halo-loop="17"] .keep-bead--rank-3,
html[data-halo-loop="17"] .keep-bead--master {
  box-shadow: inset 0 0 0 3px #B98A1E !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .keep-bead--rank-1 {
  box-shadow: inset 0 0 0 3px #A0703C !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .keep-bead--rank-2 {
  box-shadow: inset 0 0 0 3px #8C97A0 !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .keep-bead--rank-3,
html[data-halo-loop="17"][data-halo-theme="dark"] .keep-bead--master {
  box-shadow: inset 0 0 0 3px #B98A1E !important;
}
html[data-halo-loop="17"] .keep-master-n {
  display: none !important;
}
html[data-halo-loop="17"] .ask-greeting.is-clear {
  animation: halo-clear-rise 1.6s var(--ease-gel, cubic-bezier(0.22, 0.61, 0.36, 1)) both !important;
}
@keyframes halo-clear-rise {
  from {
    opacity: 0.32;
    transform: translate3d(0, 8px, 0);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
html[data-halo-loop="17"] .ask-stage.is-playing .ask-hero,
html[data-halo-loop="17"][data-halo-play="1"] .compose-stack,
html[data-halo-loop="17"] .ask-stage.is-playing .compose-stack,
html[data-halo-loop="17"] .ask-stage.is-playing .compose {
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
}
html[data-halo-loop="17"][data-halo-play="1"] .ask-greeting {
  height: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson {
  overflow: hidden;
  max-height: 3.6rem;
  border-radius: 1.85rem !important;
  padding: 0.38rem 0.9rem !important;
  width: 100% !important;
  max-width: none !important;
  transition:
    max-height var(--travel, 1080ms) var(--ease-travel, cubic-bezier(0.33, 0.04, 0.2, 1)),
    padding var(--travel, 1080ms) var(--ease-travel, cubic-bezier(0.33, 0.04, 0.2, 1)),
    background-color var(--travel, 1080ms) var(--ease-travel, cubic-bezier(0.33, 0.04, 0.2, 1));
}
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson.is-grown {
  max-height: 42rem;
  padding: 0 !important;
  background: var(--paper-card) !important;
  border: 0 !important;
  box-shadow: var(--paper-card-shadow) !important;
}
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson:not(.is-grown) .compose-play {
  opacity: 0;
}
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson.is-grown .compose-play {
  opacity: 1;
  transition: opacity 360ms var(--ease-travel, cubic-bezier(0.33, 0.04, 0.2, 1)) 420ms;
}
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson .water__layers,
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson .capsule__glass,
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson .capsule__fill,
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson .capsule__shade,
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson .capsule__edge {
  display: none !important;
  opacity: 0 !important;
}
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson[data-kind="when"],
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson[data-kind="where"],
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson[data-kind="who"],
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson[data-kind="meaning"] {
  background: var(--paper-card) !important;
  border: 0 !important;
  box-shadow: var(--paper-card-shadow) !important;
}
html[data-halo-loop="17"] .compose-play-band {
  background: color-mix(in srgb, var(--play-kind) 18%, var(--paper-card)) !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .compose-play-band {
  background: color-mix(in srgb, var(--play-kind) 22%, var(--paper-card)) !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .ask-stage.is-playing .compose.is-play-lesson.is-grown,
html[data-halo-loop="17"][data-halo-theme="dark"] .ask-stage.is-playing .compose.is-play-lesson[data-kind="when"],
html[data-halo-loop="17"][data-halo-theme="dark"] .ask-stage.is-playing .compose.is-play-lesson[data-kind="where"],
html[data-halo-loop="17"][data-halo-theme="dark"] .ask-stage.is-playing .compose.is-play-lesson[data-kind="who"],
html[data-halo-loop="17"][data-halo-theme="dark"] .ask-stage.is-playing .compose.is-play-lesson[data-kind="meaning"] {
  background: var(--paper-card) !important;
  border: 0 !important;
  box-shadow: var(--paper-card-shadow) !important;
}
html[data-halo-loop="17"] .compose-play-head {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
}
html[data-halo-loop="17"] .compose-play-kind {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--play-kind);
}
html[data-halo-loop="17"][data-halo-theme="dark"] .compose-play-kind {
  color: var(--play-kind);
}
html[data-halo-loop="17"] .compose-play-bar,
html[data-halo-loop="17"] .compose-play-ink {
  display: none !important;
}
html[data-halo-loop="17"] .home-play-choice {
  background: var(--paper-inset) !important;
  background-color: var(--paper-inset) !important;
  background-image: none !important;
  border: 1px solid var(--paper-inset-border) !important;
  color: #111111 !important;
  isolation: isolate;
}
html[data-halo-loop="17"] .home-play-choice .capsule__label {
  color: #111111 !important;
}
html[data-halo-loop="17"] .home-play-choice .capsule__glass,
html[data-halo-loop="17"] .home-play-choice .capsule__fill,
html[data-halo-loop="17"] .home-play-choice .capsule__shade,
html[data-halo-loop="17"] .home-play-choice .capsule__edge {
  display: none !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .home-play-choice {
  background: var(--paper-inset) !important;
  border-color: var(--paper-inset-border) !important;
  color: #f5f5f7 !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .home-play-choice .capsule__label {
  color: #f5f5f7 !important;
}
html[data-halo-loop="17"] .home-play-choice.is-ok {
  background: color-mix(in srgb, var(--play-kind) 22%, var(--paper-inset)) !important;
  box-shadow: inset 0 0 0 2px var(--play-kind) !important;
  font-weight: 600 !important;
  color: #111111 !important;
  opacity: 1 !important;
  pointer-events: none !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .home-play-choice.is-ok {
  background: color-mix(in srgb, var(--play-kind) 28%, var(--paper-inset)) !important;
  color: #f5f5f7 !important;
}
html[data-halo-loop="17"] .home-play-choice.is-dim {
  opacity: 0.35 !important;
  pointer-events: none !important;
}
html[data-halo-loop="17"] .home-play-choice.is-locked {
  opacity: 0.4 !important;
  pointer-events: none !important;
}
html[data-halo-loop="17"] .capsule--harvest .capsule__label,
html[data-halo-loop="17"] .loop-flight.is-bank {
  font-size: 0 !important;
  color: transparent !important;
}
html[data-halo-loop="17"] .capsule--harvest .capsule__label {
  display: none !important;
}
html[data-halo-loop="17"] .capsule--harvest .capsule__glass,
html[data-halo-loop="17"] .capsule--harvest .capsule__shade,
html[data-halo-loop="17"] .capsule--harvest .capsule__edge,
html[data-halo-loop="17"] .capsule--harvest .capsule__fill {
  display: none !important;
}
html[data-halo-loop="17"] .capsule--harvest.capsule--kind-when { background: #ffd978 !important; }
html[data-halo-loop="17"] .capsule--harvest.capsule--kind-where { background: #a3d9ff !important; }
html[data-halo-loop="17"] .capsule--harvest.capsule--kind-who { background: #fbcfe8 !important; }
html[data-halo-loop="17"] .capsule--harvest.capsule--kind-meaning { background: #c5f3d4 !important; }
html[data-halo-loop="17"] .harvest-fly {
  overflow: visible !important;
}
html[data-halo-loop="17"] .harvest-fly .capsule--harvest {
  max-width: none !important;
  animation: none !important;
}
html[data-halo-loop="17"] .harvest-fly .capsule--harvest-orb,
html[data-halo-loop="17"] .harvest-fly .capsule--harvest-drop {
  width: 2.85rem !important;
  height: 2.85rem !important;
  min-width: 2.85rem !important;
  padding: 0 !important;
  border-radius: 999px !important;
}
html[data-halo-loop="17"] .harvest-fly .capsule--harvest-orb {
  width: 3.05rem !important;
  height: 3.05rem !important;
  min-width: 3.05rem !important;
}
html[data-halo-loop="17"] .harvest-fly .capsule--harvest-pill {
  width: auto !important;
  height: auto !important;
  min-width: 0 !important;
  padding: 0.5rem 1.05rem !important;
  border-radius: 999px !important;
}
html[data-halo-loop="17"] .loop-flight.is-bank.loop-flight--when { background: #ffd978 !important; }
html[data-halo-loop="17"] .loop-flight.is-bank.loop-flight--where { background: #a3d9ff !important; }
html[data-halo-loop="17"] .loop-flight.is-bank.loop-flight--who { background: #fbcfe8 !important; }
html[data-halo-loop="17"] .loop-flight.is-bank.loop-flight--meaning { background: #c5f3d4 !important; }
html[data-halo-loop="17"][data-halo-play="1"][data-home-skin="paper"] .recent-slot.is-recede .capsule__glass,
html[data-halo-loop="17"][data-halo-play="1"][data-home-skin="paper"] .recent-slot.is-recede .capsule__fill,
html[data-halo-loop="17"][data-halo-play="1"][data-home-skin="paper"] .recent-slot.is-recede .capsule__shade {
  display: none !important;
  opacity: 0 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .chat-stage .topbar {
  background: none !important;
  box-shadow: none !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .chat-stage .topbar .water__skin,
html[data-halo-loop="17"][data-home-skin="paper"] .chat-stage .topbar .water__edge,
html[data-halo-loop="17"][data-home-skin="paper"] .chat-stage .topbar .water__ambient,
html[data-halo-loop="17"][data-home-skin="paper"] .chat-stage .topbar .water__shade {
  display: none !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .keep-bead--rank-0 {
  box-shadow: none !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .keep-bead--rank-1 {
  box-shadow: inset 0 0 0 3px #A0703C !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .keep-bead--rank-2 {
  box-shadow: inset 0 0 0 3px #8C97A0 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .keep-bead--rank-3,
html[data-halo-loop="17"][data-home-skin="paper"] .keep-bead--master {
  box-shadow: inset 0 0 0 3px #B98A1E !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .keep-bead--rank-1 {
  box-shadow: inset 0 0 0 3px #A0703C !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .keep-bead--rank-2 {
  box-shadow: inset 0 0 0 3px #8C97A0 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .keep-bead--rank-3,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .keep-bead--master {
  box-shadow: inset 0 0 0 3px #B98A1E !important;
}
html[data-halo-loop="17"] .keep-bead--band {
  margin-left: 0.38rem !important;
}
html[data-halo-loop="17"][data-halo-cleared="1"] .keep-dock--beads {
  animation: halo-keep-clear 1.1s var(--ease-gel, cubic-bezier(0.22, 0.61, 0.36, 1)) both !important;
}
@keyframes halo-keep-clear {
  from { opacity: 0.35; }
  to { opacity: 1; }
}
html[data-halo-loop="17"][data-home-skin="paper"] .keep-bead--when { background: #ffd978 !important; }
html[data-halo-loop="17"][data-home-skin="paper"] .keep-bead--where { background: #a3d9ff !important; }
html[data-halo-loop="17"][data-home-skin="paper"] .keep-bead--who { background: #fbcfe8 !important; }
html[data-halo-loop="17"][data-home-skin="paper"] .keep-bead--meaning { background: #c5f3d4 !important; }
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock {
  --water: 0;
  border-radius: 28px !important;
  padding: 0.38rem 0.48rem 0.38rem 0.9rem !important;
  background: var(--paper-card) !important;
  background-color: var(--paper-card) !important;
  border: 0 !important;
  box-shadow: var(--paper-card-shadow) !important;
  filter: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  width: var(--halo-chat) !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  animation: none !important;
  opacity: 1 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero {
  grid-template-columns: minmax(0, var(--halo-chat)) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock {
  margin-left: auto !important;
  margin-right: auto !important;
  justify-self: center !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose .water__skin,
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose .water__edge,
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose .water__ambient,
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose .water__shade,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .water__skin,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .water__edge,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .water__ambient,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .water__shade,
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose .action-btn .water__skin,
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose .action-btn .water__edge,
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose .action-btn .water__ambient,
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose .action-btn .water__shade,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .action-btn .water__skin,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .action-btn .water__edge,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .action-btn .water__ambient,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .action-btn .water__shade {
  display: none !important;
  opacity: 0 !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  -apple-visual-effect: none !important;
  box-shadow: none !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .ask-stage .topbar .stone-btn,
html[data-halo-loop="17"][data-home-skin="paper"] .chat-stage .topbar .stone-btn {
  background: transparent !important;
  color: #111111 !important;
  box-shadow: none !important;
  transition: background 180ms var(--ease-gel, cubic-bezier(0.22, 0.61, 0.36, 1)) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .ask-stage .topbar .stone-btn:hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"] .ask-stage .topbar .stone-btn:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"] .chat-stage .topbar .stone-btn:hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"] .chat-stage .topbar .stone-btn:focus-visible {
  background: rgba(0, 0, 0, 0.05) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose .action-btn:not(.action-btn--icon),
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .action-btn:not(.action-btn--icon) {
  color: #ffffff !important;
  background: #636366 !important;
  box-shadow: none !important;
  filter: none !important;
  border: 0 !important;
  border-radius: 999px !important;
  padding: 0.52rem 1.05rem !important;
  transition: background 180ms var(--ease-gel, cubic-bezier(0.22, 0.61, 0.36, 1)) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose .action-btn:not(.action-btn--icon):hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose .action-btn:not(.action-btn--icon):focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .action-btn:not(.action-btn--icon):hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .action-btn:not(.action-btn--icon):focus-visible {
  background: #48484a !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose .action-btn--icon,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .action-btn--icon {
  width: 2.35rem !important;
  height: 2.35rem !important;
  min-width: 2.35rem !important;
  min-height: 2.35rem !important;
  padding: 0 !important;
  aspect-ratio: 1 !important;
  flex-shrink: 0 !important;
  overflow: hidden !important;
  color: #111111 !important;
  background: transparent !important;
  box-shadow: none !important;
  border-radius: 999px !important;
  display: grid !important;
  place-items: center !important;
  transition: background 180ms var(--ease-gel, cubic-bezier(0.22, 0.61, 0.36, 1)) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose .action-btn--icon:hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose .action-btn--icon:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .action-btn--icon:hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .action-btn--icon:focus-visible {
  background: rgba(0, 0, 0, 0.05) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .compose-stack.is-open {
  border-radius: 28px !important;
  box-shadow: none !important;
  overflow: visible !important;
  filter: drop-shadow(0 8px 28px rgba(0, 0, 0, 0.07)) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-stack.is-open {
  filter: drop-shadow(0 8px 28px rgba(0, 0, 0, 0.45)) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .compose-stack.is-open .compose,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-stack.is-open .compose-dock {
  border-radius: 28px 28px 0 0 !important;
  box-shadow: none !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .compose-stack.is-open .compose-suggest {
  border-radius: 0 0 28px 28px !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose-suggest,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .compose-suggest {
  top: 100% !important;
  margin-top: 0 !important;
  border-radius: 0 !important;
  background: var(--paper-card) !important;
  border: 0 !important;
  box-shadow: none !important;
  overflow: hidden !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .compose-stack.is-open .compose-suggest {
  border-top: 1px solid var(--paper-inset-border) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose-suggest li + li .compose-suggest-item,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .compose-suggest li + li .compose-suggest-item {
  border-top: 1px solid var(--paper-inset-border) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose-suggest-item,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .compose-suggest-item {
  background: transparent !important;
  color: #111111 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose-suggest-item:hover,
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose-suggest-item:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose-suggest-item.is-active,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .compose-suggest-item:hover,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .compose-suggest-item:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .compose-suggest-item.is-active {
  background: var(--paper-inset) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .settings-page .settings-name-pane {
  --water: 0;
  background: var(--paper-inset) !important;
  background-color: var(--paper-inset) !important;
  border: 1px solid var(--paper-inset-border) !important;
  border-radius: 999px !important;
  box-shadow: none !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .settings-page .settings-name-pane .field,
html[data-halo-loop="17"][data-home-skin="paper"] .settings-page .settings-name-pane .field:focus {
  color: #111111 !important;
  -webkit-text-fill-color: #111111 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .settings-page .stone-btn {
  background: var(--paper-action) !important;
  color: #111111 !important;
  box-shadow: none !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .settings-page .stone-btn:hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"] .settings-page .stone-btn:focus-visible {
  background: var(--paper-action-hover) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice {
  background: var(--paper-action) !important;
  background-color: var(--paper-action) !important;
  border: 0 !important;
  color: #111111 !important;
  box-shadow: none !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice:hover,
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice:focus,
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice:active {
  background: var(--paper-action-hover) !important;
  background-color: var(--paper-action-hover) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice.capsule--picked,
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice.capsule--picked:hover,
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice.capsule--picked:focus,
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice.capsule--picked:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice.capsule--picked:active {
  background: #171719 !important;
  background-color: #171719 !important;
  color: #ffffff !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice .capsule__label {
  color: inherit !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .ask-hero .compose,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock {
  background: var(--paper-card) !important;
  background-color: var(--paper-card) !important;
  border: 0 !important;
  box-shadow: var(--paper-card-shadow) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .ask-hero .compose .action-btn:not(.action-btn--icon),
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock .action-btn:not(.action-btn--icon) {
  color: #111111 !important;
  background: #d8d8de !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .ask-hero .compose .action-btn:not(.action-btn--icon):hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .ask-hero .compose .action-btn:not(.action-btn--icon):focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock .action-btn:not(.action-btn--icon):hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock .action-btn:not(.action-btn--icon):focus-visible {
  background: #e8e8ed !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .ask-hero .compose .action-btn--icon,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock .action-btn--icon {
  color: #f5f5f7 !important;
  background: transparent !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .ask-hero .compose .action-btn--icon:hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .ask-hero .compose .action-btn--icon:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock .action-btn--icon:hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock .action-btn--icon:focus-visible {
  background: rgba(255, 255, 255, 0.08) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .ask-stage .topbar .stone-btn,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .chat-stage .topbar .stone-btn {
  background: transparent !important;
  color: #f5f5f7 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .ask-stage .topbar .stone-btn:hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .ask-stage .topbar .stone-btn:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .chat-stage .topbar .stone-btn:hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .chat-stage .topbar .stone-btn:focus-visible {
  background: rgba(255, 255, 255, 0.08) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .chat-stage .topbar .brand-mark,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .chat-stage .topbar .stone-btn {
  color: #f5f5f7 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .ask-hero .compose-suggest,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock .compose-suggest {
  background: var(--paper-card) !important;
  border: 0 !important;
  box-shadow: var(--paper-card-shadow) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .ask-hero .compose-suggest-item,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock .compose-suggest-item {
  background: transparent !important;
  color: #f5f5f7 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .ask-hero .compose-suggest-item:hover,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .ask-hero .compose-suggest-item:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .ask-hero .compose-suggest-item.is-active,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock .compose-suggest-item:hover,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock .compose-suggest-item:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock .compose-suggest-item.is-active {
  background: var(--paper-inset) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .settings-page .settings-name-pane {
  background: var(--paper-inset) !important;
  background-color: var(--paper-inset) !important;
  border-color: var(--paper-inset-border) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .settings-page .settings-name-pane .field,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .settings-page .settings-name-pane .field:focus {
  color: #f5f5f7 !important;
  -webkit-text-fill-color: #f5f5f7 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .settings-page .stone-btn {
  background: var(--paper-action) !important;
  color: #f5f5f7 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .settings-page .stone-btn:hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .settings-page .stone-btn:focus-visible {
  background: var(--paper-action-hover) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice {
  background: var(--paper-action) !important;
  background-color: var(--paper-action) !important;
  border-color: transparent !important;
  color: #f5f5f7 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice:hover,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice:focus,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice:active {
  background: var(--paper-action-hover) !important;
  background-color: var(--paper-action-hover) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice.capsule--picked,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice.capsule--picked:hover,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice.capsule--picked:focus,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice.capsule--picked:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice.capsule--picked:active {
  background: #f3f2f0 !important;
  background-color: #f3f2f0 !important;
  color: #111111 !important;
}
@supports (-apple-visual-effect: -apple-system-glass-material) {
  html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose .water__skin,
  html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .water__skin {
    -apple-visual-effect: none !important;
    display: none !important;
  }
}
@media (max-width: 720px) {
  html[data-halo-loop="17"] .keep-dock--beads {
    max-width: 100% !important;
    --keep-gap: 0.22rem !important;
  }
  html[data-halo-loop="17"] .keep-dock--beads.is-clipped {
    mask-image: linear-gradient(to right, transparent, #000 1.15rem, #000 100%) !important;
    -webkit-mask-image: linear-gradient(to right, transparent, #000 1.15rem, #000 100%) !important;
  }
  html[data-halo-loop="17"] .keep-pocket {
    max-width: min(6rem, 32vw) !important;
    min-width: 0 !important;
  }
  html[data-halo-loop="17"] .ask-stage .topbar > .water__content,
  html[data-halo-loop="17"] .chat-stage .topbar > .water__content {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) auto !important;
    align-items: center !important;
    justify-content: stretch !important;
    gap: 0.35rem !important;
  }
  html[data-halo-loop="17"] .brand-row {
    justify-self: start !important;
    align-items: center !important;
  }
  html[data-halo-loop="17"] .topbar-title {
    justify-self: start !important;
    margin-right: 0 !important;
    min-width: 0 !important;
  }
  html[data-halo-loop="17"] .topbar-actions {
    justify-self: end !important;
  }
  html[data-halo-loop="17"] .brand-mark--sm {
    display: block !important;
    font-size: 0.95rem !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-row {
    flex-wrap: wrap !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-form .field {
    flex: 1 1 100% !important;
    min-width: 0 !important;
    width: 100% !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-actions {
    flex: 1 0 auto !important;
    width: 100% !important;
    justify-content: flex-end !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-dock {
    width: 100% !important;
    max-width: 100% !important;
    min-height: 0 !important;
    overflow: visible !important;
  }
  html[data-halo-loop="17"] .gold-kept-panel {
    position: fixed !important;
    z-index: 50 !important;
    top: var(--kept-panel-top, 4.5rem) !important;
    left: max(0.75rem, env(safe-area-inset-left)) !important;
    right: max(0.75rem, env(safe-area-inset-right)) !important;
    width: auto !important;
    max-width: none !important;
    box-sizing: border-box !important;
  }
  html[data-halo-loop="17"] .gold-kept-prompt,
  html[data-halo-loop="17"] .gold-kept-meta {
    overflow-wrap: anywhere !important;
    word-break: break-word !important;
    max-width: 100% !important;
  }
}
@media (max-width: 640px) {
  html[data-halo-loop="17"] .ask-stage.is-playing .compose-stack,
  html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson {
    width: 100% !important;
    max-width: 100% !important;
  }
  html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson.is-grown {
    padding: 0 !important;
    max-height: min(42rem, calc(100dvh - 4.75rem)) !important;
  }
  html[data-halo-loop="17"] .home-play-choices {
    grid-template-columns: 1fr !important;
    max-width: 20rem !important;
    margin: 0 auto !important;
  }
  html[data-halo-loop="17"] .home-play-choices .home-play-choice {
    min-height: 2.85rem !important;
    font-size: 1.05rem !important;
    padding: 0.7rem 0.9rem !important;
    border-radius: 1.15rem !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
    line-height: 1.28 !important;
  }
  html[data-halo-loop="17"] .compose-play-prompt {
    font-size: 1.22rem !important;
    max-width: none !important;
    margin: 0 auto !important;
    padding: 0 0.35rem !important;
  }
}
html[data-halo-loop="17"] .keep-bead.is-leaving-gold {
  opacity: 0 !important;
  transition: opacity 260ms ease !important;
  pointer-events: none !important;
}
html[data-halo-loop="17"] .ask-stage .topbar,
html[data-halo-loop="17"] .chat-stage .topbar,
html[data-halo-loop="17"] .topbar > .water__content {
  overflow: visible !important;
}
html[data-halo-loop="17"] .brand-row {
  display: inline-flex !important;
  align-items: baseline !important;
  gap: 0.42rem !important;
  position: relative !important;
  min-width: 0 !important;
  margin: 0 !important;
}
html[data-halo-loop="17"] .gold-kept {
  position: relative !important;
  display: inline-flex !important;
  align-items: baseline !important;
  flex: 0 0 auto !important;
}
html[data-halo-loop="17"] .gold-kept-badge {
  display: inline-flex !important;
  align-items: baseline !important;
  gap: 0.22rem !important;
  margin: 0 !important;
  padding: 0.22rem 0.42rem !important;
  border: 0 !important;
  border-radius: 999px !important;
  background: transparent !important;
  color: #B98A1E !important;
  font: inherit !important;
  line-height: 1 !important;
  cursor: pointer !important;
  transform-origin: center center !important;
  transition: background 180ms ease, opacity 260ms ease !important;
}
html[data-halo-loop="17"] .gold-kept-badge:hover:not(:disabled),
html[data-halo-loop="17"] .gold-kept-badge:focus-visible {
  background: var(--halo-stone) !important;
  outline: none !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .gold-kept-badge:hover:not(:disabled),
html[data-halo-loop="17"][data-halo-theme="dark"] .gold-kept-badge:focus-visible {
  background: var(--halo-stone-hover) !important;
}
html[data-halo-loop="17"] .gold-kept-badge.is-empty {
  opacity: 0.3 !important;
}
html[data-halo-loop="17"] .gold-kept-badge.is-pulse {
  animation: halo-gold-pulse 520ms ease !important;
}
@keyframes halo-gold-pulse {
  0% { transform: scale(1); filter: none; }
  40% { transform: scale(1.18); filter: drop-shadow(0 0 8px rgba(185, 138, 30, 0.55)); }
  100% { transform: scale(1); filter: none; }
}
html[data-halo-loop="17"] .gold-kept-ring {
  font-size: 1.12rem !important;
  font-weight: 500 !important;
}
html[data-halo-loop="17"] .gold-kept-n {
  font-size: 0.92rem !important;
  font-weight: 600 !important;
  font-variant-numeric: tabular-nums !important;
  letter-spacing: 0.01em !important;
}
html[data-halo-loop="17"] .gold-kept-panel {
  position: absolute !important;
  top: calc(100% + 0.55rem) !important;
  left: 0 !important;
  z-index: 40 !important;
  width: var(--halo-chat) !important;
  max-width: min(var(--halo-chat), calc(100vw - 2rem)) !important;
  padding: 0.85rem 1.05rem 0.7rem !important;
  text-align: left !important;
  background: var(--paper-card) !important;
  border: 0 !important;
  border-radius: 16px !important;
  box-shadow: var(--paper-card-shadow) !important;
  pointer-events: auto !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .gold-kept-panel {
  background: var(--paper-card) !important;
  color: #f5f5f7 !important;
}
html[data-halo-loop="17"] .gold-kept-head {
  margin: 0 0 0.28rem !important;
  font-size: 1.02rem !important;
  font-weight: 600 !important;
  letter-spacing: -0.01em !important;
}
html[data-halo-loop="17"] .gold-kept-summary {
  margin: 0 0 0.7rem !important;
  font-size: 0.82rem !important;
  font-weight: 450 !important;
  color: rgba(17,17,17,0.52) !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .gold-kept-summary {
  color: rgba(245,245,247,0.52) !important;
}
html[data-halo-loop="17"] .gold-kept-list {
  max-height: 40vh !important;
  overflow-y: auto !important;
}
html[data-halo-loop="17"] .gold-kept-row {
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  gap: 0.18rem !important;
  margin-top: 0.35rem !important;
  padding: 0.55rem 0.65rem !important;
  border: 1px solid var(--paper-inset-border) !important;
  border-radius: 12px !important;
  background: var(--paper-inset) !important;
  pointer-events: none !important;
}
html[data-halo-loop="17"] .gold-kept-row + .gold-kept-row {
  margin-top: 0.45rem !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .gold-kept-row {
  border-color: var(--paper-inset-border) !important;
}
html[data-halo-loop="17"] .gold-kept-prompt {
  color: rgba(17,17,17,0.88) !important;
  font-size: 0.92rem !important;
  font-weight: 500 !important;
  line-height: 1.3 !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
  max-width: 100% !important;
}
html[data-halo-loop="17"] .gold-kept-meta {
  color: rgba(17,17,17,0.5) !important;
  font-size: 0.8rem !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
  max-width: 100% !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .gold-kept-prompt {
  color: rgba(245,245,247,0.9) !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .gold-kept-meta {
  color: rgba(245,245,247,0.5) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .home-bubbles .keep-album__slot[data-hue="when"] .capsule {
  box-shadow: 0 0 0 1px color-mix(in srgb, #ffd978 40%, transparent) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .home-bubbles .keep-album__slot[data-hue="where"] .capsule {
  box-shadow: 0 0 0 1px color-mix(in srgb, #a3d9ff 40%, transparent) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .home-bubbles .keep-album__slot[data-hue="who"] .capsule {
  box-shadow: 0 0 0 1px color-mix(in srgb, #fbcfe8 40%, transparent) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .home-bubbles .keep-album__slot[data-hue="meaning"] .capsule {
  box-shadow: 0 0 0 1px color-mix(in srgb, #c5f3d4 40%, transparent) !important;
}
html[data-halo-loop="17"] .history-overlay:not(.learn-stage) {
  align-items: center !important;
  padding: 1.25rem 1rem !important;
  background: var(--paper-field) !important;
}
html[data-halo-loop="17"] .history-page {
  width: min(var(--halo-chat), 100%) !important;
  max-height: min(88dvh, 52rem) !important;
  height: auto !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  margin: auto !important;
  padding: 1.15rem 1.25rem 1.4rem !important;
  background: var(--paper-card) !important;
  border: 0 !important;
  border-radius: 20px !important;
  box-shadow: var(--paper-card-shadow) !important;
}
html[data-halo-loop="17"] .history-page.settings-page {
  overflow: auto !important;
  display: block !important;
}
html[data-halo-loop="17"] .history-page-head .stone-btn {
  flex: 0 0 auto !important;
  margin-left: auto !important;
  background: var(--paper-action) !important;
  color: #111111 !important;
  box-shadow: none !important;
}
html[data-halo-loop="17"] .history-page-head .stone-btn:hover:not(:disabled),
html[data-halo-loop="17"] .history-page-head .stone-btn:focus-visible {
  background: var(--paper-action-hover) !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .history-page-head .stone-btn {
  color: #f5f5f7 !important;
}
html[data-halo-loop="17"] .menu-block .history-list {
  gap: 0 !important;
  padding: 0 !important;
  border-radius: 1rem !important;
  overflow: hidden !important;
  overflow-y: auto !important;
  background: var(--paper-inset) !important;
}
html[data-halo-loop="17"] .history-page:not(.settings-page) .menu-block {
  flex: 1 !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column !important;
}
html[data-halo-loop="17"] .history-page:not(.settings-page) .menu-block .history-list {
  flex: 1 !important;
  min-height: 0 !important;
}
html[data-halo-loop="17"] .menu-block .history-row + .history-row {
  border-top: 1px solid var(--paper-inset-border) !important;
}
html[data-halo-loop="17"] .history-item {
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  transition: background-color 120ms var(--ease-gel, cubic-bezier(0.22, 0.61, 0.36, 1)) !important;
}
html[data-halo-loop="17"] .history-item:hover,
html[data-halo-loop="17"] .history-item:focus-visible {
  background: color-mix(in srgb, var(--halo-ink) 6%, var(--paper-inset)) !important;
  transform: none !important;
}
html[data-halo-loop="17"] .history-item.is-current,
html[data-halo-loop="17"] .history-item.is-picked {
  background: color-mix(in srgb, var(--halo-ink) 12%, var(--paper-inset)) !important;
}
html[data-halo-loop="17"] .settings-page .field-label {
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase !important;
  color: color-mix(in srgb, var(--halo-ink) 55%, transparent) !important;
}
html[data-halo-loop="17"] .history-overlay.menu-veil {
  background: color-mix(in srgb, var(--paper-field) 94%, transparent) !important;
  -webkit-backdrop-filter: blur(6px) !important;
  backdrop-filter: blur(6px) !important;
}
html[data-halo-loop="17"] .menu-sheet .history-page-title,
html[data-halo-loop="17"] .menu-sheet.settings-page .history-page-title {
  font-size: clamp(1.5rem, 2.6vw, 1.8rem) !important;
}
html[data-halo-loop="17"] .menu-sheet[data-grow="seed"],
html[data-halo-loop="17"] .menu-sheet[data-grow="closing"] {
  overflow: hidden !important;
  box-shadow: none !important;
}
/* The composer hands its pill to the sheet and steps back out of the way. */
html[data-halo-loop="17"][data-halo-sheet="1"]:not([data-halo-play="1"]) .ask-hero .compose,
html[data-halo-loop="17"][data-halo-sheet="1"]:not([data-halo-play="1"]) .compose-dock {
  opacity: 0 !important;
  transition: opacity 240ms var(--ease-travel, cubic-bezier(0.33, 0.04, 0.2, 1)) !important;
  pointer-events: none !important;
}
html[data-halo-loop="17"] .compose-play-dots {
  justify-content: center !important;
}
html[data-halo-loop="17"] .home-day-cap {
  top: 22% !important;
}
html[data-halo-loop="17"] .login-stage {
  background: var(--paper-field);
}
html[data-halo-loop="17"] .login-card.auth-card {
  background: var(--paper-card) !important;
  background-color: var(--paper-card) !important;
  border: 0 !important;
  border-radius: 28px !important;
  box-shadow: var(--paper-card-shadow) !important;
}
html[data-halo-loop="17"] .login-card .water__ambient,
html[data-halo-loop="17"] .login-card .water__skin,
html[data-halo-loop="17"] .login-card .water__edge,
html[data-halo-loop="17"] .login-card .water__shade {
  display: none !important;
}
html[data-halo-loop="17"] .login-card .brand-mark {
  color: var(--halo-ink);
  text-shadow: none;
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}
html[data-halo-loop="17"] .login-title {
  color: var(--halo-ink);
}
html[data-halo-loop="17"] .login-sub,
html[data-halo-loop="17"] .login-hint {
  color: var(--halo-muted);
}
html[data-halo-loop="17"] .login-form .field-label {
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase !important;
  color: color-mix(in srgb, var(--halo-ink) 55%, transparent) !important;
}
html[data-halo-loop="17"] .login-form .settings-name-pane {
  --water: 0;
  background: var(--paper-inset) !important;
  background-color: var(--paper-inset) !important;
  border: 1px solid var(--paper-inset-border) !important;
  border-radius: 999px !important;
  box-shadow: none !important;
}
html[data-halo-loop="17"] .login-form .settings-name-pane .field,
html[data-halo-loop="17"] .login-form .settings-name-pane .field:focus {
  color: #111111 !important;
  -webkit-text-fill-color: #111111 !important;
  background: transparent !important;
  box-shadow: none !important;
}
html[data-halo-loop="17"] .auth-card .stone-btn {
  background: var(--paper-action) !important;
  color: #111111 !important;
  box-shadow: none !important;
  border-radius: 999px !important;
}
html[data-halo-loop="17"] .auth-card .stone-btn:hover:not(:disabled),
html[data-halo-loop="17"] .auth-card .stone-btn:focus-visible {
  background: var(--paper-action-hover) !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .login-form .settings-name-pane {
  background: var(--paper-inset) !important;
  border-color: var(--paper-inset-border) !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .login-form .settings-name-pane .field,
html[data-halo-loop="17"][data-halo-theme="dark"] .login-form .settings-name-pane .field:focus {
  color: #f5f5f7 !important;
  -webkit-text-fill-color: #f5f5f7 !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .auth-card .stone-btn {
  background: var(--paper-action) !important;
  color: #f5f5f7 !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .auth-card .stone-btn:hover:not(:disabled),
html[data-halo-loop="17"][data-halo-theme="dark"] .auth-card .stone-btn:focus-visible {
  background: var(--paper-action-hover) !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .login-card .brand-mark,
html[data-halo-loop="17"][data-halo-theme="dark"] .login-title {
  color: #f5f5f7;
  text-shadow: none;
}
@media (max-width: 720px) {
  html[data-halo-loop="17"] .brand-row {
    justify-self: start !important;
    align-items: center !important;
  }
  html[data-halo-loop="17"] .gold-kept {
    align-items: center !important;
  }
  html[data-halo-loop="17"] .gold-kept-badge {
    align-items: center !important;
  }
  html[data-halo-loop="17"] .gold-kept-panel {
    position: fixed !important;
    z-index: 50 !important;
    top: var(--kept-panel-top, 4.5rem) !important;
    left: max(0.75rem, env(safe-area-inset-left)) !important;
    right: max(0.75rem, env(safe-area-inset-right)) !important;
    width: auto !important;
    max-width: none !important;
    box-sizing: border-box !important;
  }
  html[data-halo-loop="17"] .gold-kept-prompt,
  html[data-halo-loop="17"] .gold-kept-meta {
    overflow-wrap: anywhere !important;
    word-break: break-word !important;
    max-width: 100% !important;
  }
  html[data-halo-loop="17"] .chat-stage {
    width: 100% !important;
    max-width: 100vw !important;
    box-sizing: border-box !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose,
  html[data-halo-loop="17"] .chat-stage .compose-dock,
  html[data-halo-loop="17"] .chat-stage .compose-form,
  html[data-halo-loop="17"] .chat-stage .compose-row,
  html[data-halo-loop="17"] .chat-stage .chat-scroll,
  html[data-halo-loop="17"] .chat-stage .msg-wrap {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-row {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) !important;
    gap: 0.35rem !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-form .field {
    flex: unset !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-actions {
    display: flex !important;
    flex-wrap: nowrap !important;
    flex: unset !important;
    width: 100% !important;
    max-width: 100% !important;
    justify-content: flex-end !important;
    gap: 0.22rem !important;
    box-sizing: border-box !important;
  }
  html[data-halo-loop="17"] .chat-stage .action-btn--icon {
    min-width: 2.45rem !important;
    padding-left: 0.55rem !important;
    padding-right: 0.55rem !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-actions .action-btn:not(.action-btn--icon) {
    flex: 0 0 auto !important;
    padding-left: 0.8rem !important;
    padding-right: 0.8rem !important;
  }
  html[data-halo-loop="17"] .chat-stage .msg {
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }
}
`;

export function LoopSkin() {
  useLayoutEffect(() => {
    document.documentElement.dataset.haloLoop = "17";
    delete document.documentElement.dataset.haloPlay;
  }, []);
  return <style data-halo-loop-skin="17">{LOOP_CSS}</style>;
}
