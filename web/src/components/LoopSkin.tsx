"use client";

import { useLayoutEffect } from "react";

/** Rides with JS so Safari can ignore a cached CSS chunk and still get the loop. */
const LOOP_CSS = `
html[data-halo-loop="17"] .keep-dock--beads {
  --keep-n: 12;
  --keep-gap: 0.22rem;
  --keep-slot: 0.82rem;
  flex-wrap: nowrap !important;
  justify-content: flex-end !important;
  gap: var(--keep-gap) !important;
  max-width: min(28rem, 56vw) !important;
  overflow-x: hidden !important;
  scrollbar-width: none !important;
}
html[data-halo-loop="17"] .keep-dock--beads::-webkit-scrollbar {
  display: none !important;
  height: 0 !important;
}
html[data-halo-loop="17"] .keep-dock--beads .keep-bead,
html[data-halo-loop="17"] .keep-bead.keep-bead--dock {
  width: var(--keep-slot, 0.82rem) !important;
  height: var(--keep-slot, 0.82rem) !important;
  flex: 0 0 auto !important;
}
html[data-halo-loop="17"] .keep-land {
  width: 0 !important;
  height: 0.82rem !important;
  flex: 0 0 auto !important;
  pointer-events: none;
  visibility: hidden;
}
html[data-halo-loop="17"] .keep-bead--rank-1 {
  box-shadow: 0 0 0 1.5px #b08d57 !important;
}
html[data-halo-loop="17"] .keep-bead--rank-2 {
  box-shadow: 0 0 0 1.5px #c5c8ce !important;
}
html[data-halo-loop="17"] .keep-bead--rank-3,
html[data-halo-loop="17"] .keep-bead--master {
  box-shadow: 0 0 0 1.5px #d4a84b !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .keep-bead--rank-1 {
  box-shadow: 0 0 0 1.5px #c9a36a !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .keep-bead--rank-2 {
  box-shadow: 0 0 0 1.5px #d8dce4 !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .keep-bead--rank-3,
html[data-halo-loop="17"][data-halo-theme="dark"] .keep-bead--master {
  box-shadow: 0 0 0 1.5px #e8c56a !important;
}
html[data-halo-loop="17"] .keep-master-n {
  flex: 0 0 auto !important;
  margin-right: 0.12rem !important;
  font-size: 0.68rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em !important;
  color: var(--halo-ink) !important;
  opacity: 0.48 !important;
  line-height: 1 !important;
  font-variant-numeric: tabular-nums !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .keep-master-n {
  color: #f5f5f7 !important;
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
  padding: 1.25rem 1.1rem 1.35rem !important;
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
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson[data-kind="when"] {
  background: color-mix(in srgb, #ffd978 30%, #e8e8ed) !important;
}
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson[data-kind="where"] {
  background: color-mix(in srgb, #a3d9ff 30%, #e8e8ed) !important;
}
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson[data-kind="who"] {
  background: color-mix(in srgb, #fbcfe8 30%, #e8e8ed) !important;
}
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson[data-kind="meaning"] {
  background: color-mix(in srgb, #c5f3d4 30%, #e8e8ed) !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .ask-stage.is-playing .compose.is-play-lesson[data-kind="when"] {
  background: color-mix(in srgb, #ffd978 24%, #2c2c2e) !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .ask-stage.is-playing .compose.is-play-lesson[data-kind="where"] {
  background: color-mix(in srgb, #a3d9ff 24%, #2c2c2e) !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .ask-stage.is-playing .compose.is-play-lesson[data-kind="who"] {
  background: color-mix(in srgb, #fbcfe8 24%, #2c2c2e) !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .ask-stage.is-playing .compose.is-play-lesson[data-kind="meaning"] {
  background: color-mix(in srgb, #c5f3d4 24%, #2c2c2e) !important;
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
  justify-self: start;
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(17, 17, 17, 0.48);
}
html[data-halo-loop="17"][data-halo-theme="dark"] .compose-play-kind {
  color: rgba(245, 245, 247, 0.52);
}
html[data-halo-loop="17"] .compose-play-bar {
  height: 0.42rem;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(17, 17, 17, 0.16) !important;
}
html[data-halo-loop="17"] .compose-play-ink {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #111111 !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .compose-play-bar {
  background: rgba(245, 245, 247, 0.22) !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .compose-play-ink {
  background: #f5f5f7 !important;
}
html[data-halo-loop="17"] .home-play-choice {
  background: #ffffff !important;
  background-color: #ffffff !important;
  background-image: none !important;
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
  background: #3a3a3c !important;
  color: #f5f5f7 !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .home-play-choice .capsule__label {
  color: #f5f5f7 !important;
}
html[data-halo-loop="17"] .home-play-choice.is-ok,
html[data-halo-loop="17"] .home-play-choice.is-ok .capsule__label {
  background: transparent !important;
  background-color: transparent !important;
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  opacity: 0 !important;
  box-shadow: none !important;
  pointer-events: none !important;
}
html[data-halo-loop="17"] .home-play-choice.is-fall {
  animation: halo-play-choice-fall 480ms var(--ease-travel, cubic-bezier(0.33, 0.04, 0.2, 1)) both !important;
  pointer-events: none !important;
}
@keyframes halo-play-choice-fall {
  from {
    opacity: 1;
    transform: none;
  }
  to {
    opacity: 0;
    transform: scale(0.28);
  }
}
html[data-halo-loop="17"] .home-play-choice.is-miss,
html[data-halo-loop="17"] .home-play-choice.is-miss .capsule__label {
  background: #e85d6a !important;
  color: #ffffff !important;
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
  box-shadow: 0 0 0 1.5px #b08d57 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .keep-bead--rank-2 {
  box-shadow: 0 0 0 1.5px #c5c8ce !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .keep-bead--rank-3,
html[data-halo-loop="17"][data-home-skin="paper"] .keep-bead--master {
  box-shadow: 0 0 0 1.5px #d4a84b !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .keep-bead--rank-1 {
  box-shadow: 0 0 0 1.5px #c9a36a !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .keep-bead--rank-2 {
  box-shadow: 0 0 0 1.5px #d8dce4 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .keep-bead--rank-3,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .keep-bead--master {
  box-shadow: 0 0 0 1.5px #e8c56a !important;
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
  background: #e8e8ed !important;
  background-color: #e8e8ed !important;
  box-shadow: none !important;
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
html[data-halo-loop="17"][data-home-skin="paper"] .compose-stack.is-open .compose,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-stack.is-open .compose-dock {
  border-radius: 28px !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose-suggest,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .compose-suggest {
  top: calc(100% + 0.75rem) !important;
  border-radius: 1.15rem !important;
  background: #e8e8ed !important;
  overflow: hidden !important;
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
  background: #ffffff !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .settings-page .settings-name-pane {
  --water: 0;
  background: #e8e8ed !important;
  background-color: #e8e8ed !important;
  border-radius: 999px !important;
  box-shadow: none !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .settings-page .settings-name-pane .field,
html[data-halo-loop="17"][data-home-skin="paper"] .settings-page .settings-name-pane .field:focus {
  color: #111111 !important;
  -webkit-text-fill-color: #111111 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .settings-page .stone-btn {
  background: #e8e8ed !important;
  color: #111111 !important;
  box-shadow: none !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice {
  background: #e8e8ed !important;
  background-color: #e8e8ed !important;
  color: #111111 !important;
  box-shadow: none !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice:hover,
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice:focus,
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice:active {
  background: #d8d8de !important;
  background-color: #d8d8de !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice.capsule--picked,
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice.capsule--picked:hover,
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice.capsule--picked:focus,
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice.capsule--picked:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice.capsule--picked:active {
  background: #111111 !important;
  background-color: #111111 !important;
  color: #ffffff !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .capsule--choice .capsule__label {
  color: inherit !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .ask-hero .compose,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock {
  background: #2c2c2e !important;
  background-color: #2c2c2e !important;
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
  background: #2c2c2e !important;
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
  background: #3a3a3c !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .settings-page .settings-name-pane {
  background: #3a3a3c !important;
  background-color: #3a3a3c !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .settings-page .settings-name-pane .field,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .settings-page .settings-name-pane .field:focus {
  color: #f5f5f7 !important;
  -webkit-text-fill-color: #f5f5f7 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .settings-page .stone-btn {
  background: #3a3a3c !important;
  color: #f5f5f7 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice {
  background: #2c2c2e !important;
  background-color: #2c2c2e !important;
  color: #f5f5f7 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice:hover,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice:focus,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice:active {
  background: #3a3a3c !important;
  background-color: #3a3a3c !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice.capsule--picked,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice.capsule--picked:hover,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice.capsule--picked:focus,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice.capsule--picked:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .capsule--choice.capsule--picked:active {
  background: #f5f5f7 !important;
  background-color: #f5f5f7 !important;
  color: #111111 !important;
}
@supports (-apple-visual-effect: -apple-system-glass-material) {
  html[data-halo-loop="17"][data-home-skin="paper"] .ask-hero .compose .water__skin,
  html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .water__skin {
    -apple-visual-effect: none !important;
    display: none !important;
  }
}
@media (max-width: 640px) {
  html[data-halo-loop="17"] .ask-stage.is-playing .compose-stack,
  html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson {
    width: calc(100vw - 1.25rem) !important;
    max-width: calc(100vw - 1.25rem) !important;
  }
  html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson.is-grown {
    padding: 1.05rem 0.9rem 1.15rem !important;
    max-height: 36rem;
  }
  html[data-halo-loop="17"] .home-play-choices .home-play-choice {
    min-height: 3.75rem !important;
    font-size: 1.05rem !important;
    padding: 0.85rem 0.95rem !important;
  }
  html[data-halo-loop="17"] .compose-play-prompt {
    font-size: 1.32rem !important;
    max-width: 16ch !important;
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
