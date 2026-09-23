"use client";

import { useLayoutEffect } from "react";

/** LoopSkin is not Paper/Glass. It injects a <style> tag on every page so
 *  Safari still gets the loop look if it cached an old CSS file. Every rule
 *  is scoped with html[data-halo-loop="17"]. That string became a duplicate
 *  of Home/chat/play with !important. Play overlay pose belongs in
 *  ask-shell.css only — do not put top/transform/min-height for play here. */
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
  background-image: none;
  background-attachment: scroll;
}
html[data-halo-loop="17"] body {
  background: transparent;
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
  background: transparent !important;
  background-color: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}
html[data-halo-loop="17"] .msg-action.stone-btn {
  background: transparent !important;
  box-shadow: none !important;
  color: var(--halo-ink) !important;
  text-shadow: none !important;
  width: 2.15rem !important;
  height: 2.15rem !important;
  min-width: 2.15rem !important;
  min-height: 2.15rem !important;
  padding: 0 !important;
}
html[data-halo-loop="17"] .msg-action.stone-btn:hover:not(:disabled),
html[data-halo-loop="17"] .msg-action.stone-btn:focus-visible {
  background: rgba(0, 0, 0, 0.05) !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .msg-action.stone-btn:hover:not(:disabled),
html[data-halo-loop="17"][data-halo-theme="dark"] .msg-action.stone-btn:focus-visible {
  background: rgba(255, 255, 255, 0.08) !important;
}
html[data-halo-loop="17"] .recipe-card {
  color: var(--halo-ink) !important;
  background: var(--paper-card) !important;
  background-color: var(--paper-card) !important;
  box-shadow: var(--paper-card-shadow) !important;
}
html[data-halo-loop="17"] .recipe-card h2,
html[data-halo-loop="17"] .recipe-card pre {
  color: var(--halo-ink) !important;
}
html[data-halo-loop="17"] .recipe-card h3 {
  color: var(--halo-muted) !important;
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
  display: block !important;
  flex-wrap: nowrap !important;
  justify-content: unset !important;
  gap: 0 !important;
  max-width: min(28rem, 56vw) !important;
  overflow-x: auto !important;
  overscroll-behavior-x: contain !important;
  scrollbar-width: none !important;
}
html[data-halo-loop="17"] .keep-dock__row {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: var(--keep-gap) !important;
  min-width: 100% !important;
  width: max-content !important;
  padding-left: 0.4rem !important;
  box-sizing: border-box !important;
}
html[data-halo-loop="17"] .keep-dock--beads.is-fade-left {
  mask-image: linear-gradient(to right, transparent, #000 0.7rem, #000 100%) !important;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 0.7rem, #000 100%) !important;
}
html[data-halo-loop="17"] .keep-dock--beads.is-fade-right {
  mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 0.7rem), transparent) !important;
  -webkit-mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 0.7rem), transparent) !important;
}
html[data-halo-loop="17"] .keep-dock--beads.is-fade-left.is-fade-right {
  mask-image: linear-gradient(to right, transparent, #000 0.7rem, #000 calc(100% - 0.7rem), transparent) !important;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 0.7rem, #000 calc(100% - 0.7rem), transparent) !important;
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
  height: var(--keep-slot, 1.02rem) !important;
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
/* Family /ask in-hero play only. Lab overlay is .ask-shell-compose, not
   under .ask-stage. Do not set overlay top/transform/min-height here. */
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
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson.is-grown .compose-play:not(.is-gather) {
  opacity: 1;
}
html[data-halo-loop="17"] .ask-stage.is-playing .compose-play.is-gather {
  opacity: 0;
}
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson:not(.is-grown) .compose-play-col,
html[data-halo-loop="17"] .ask-stage.is-playing .compose-play.is-gather .compose-play-col {
  opacity: 0;
}
html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson.is-grown .compose-play:not(.is-gather) .compose-play-col {
  opacity: 1;
  transition: opacity 240ms var(--ease-travel, cubic-bezier(0.33, 0.04, 0.2, 1)) var(--travel, 1080ms);
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
  background: var(--play-kind) !important;
}
html[data-halo-loop="17"] .compose-play {
  --play-ink: color-mix(in srgb, var(--play-kind) 58%, #111 42%);
}
html[data-halo-loop="17"][data-halo-theme="dark"] .compose-play {
  --play-ink: var(--play-kind);
}
html[data-halo-loop="17"] .home-play-say {
  background: var(--paper-inset, #f2f1ee) !important;
  background-color: var(--paper-inset, #f2f1ee) !important;
  --say-line: color-mix(in srgb, var(--play-kind) 58%, #111 42%);
  caret-color: var(--say-line) !important;
  box-shadow: inset 0 -3px 0 var(--say-line) !important;
  resize: none !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  border-radius: 999px !important;
  field-sizing: fixed !important;
}
html[data-halo-loop="17"] .home-play-say::-webkit-resizer {
  display: none !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .home-play-say {
  background: var(--paper-inset, #3a3a3c) !important;
  background-color: var(--paper-inset, #3a3a3c) !important;
  --say-line: var(--play-kind);
}
html[data-halo-loop="17"] .stone-btn.home-play-say-go {
  background: transparent !important;
  box-shadow: none !important;
}
html[data-halo-loop="17"] .stone-btn.home-play-say-go:hover:not(:disabled),
html[data-halo-loop="17"] .stone-btn.home-play-say-go:focus-visible,
html[data-halo-loop="17"] .stone-btn.home-play-say-go:active:not(:disabled) {
  background: rgba(0, 0, 0, 0.05) !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .stone-btn.home-play-say-go:hover:not(:disabled),
html[data-halo-loop="17"][data-halo-theme="dark"] .stone-btn.home-play-say-go:focus-visible,
html[data-halo-loop="17"][data-halo-theme="dark"] .stone-btn.home-play-say-go:active:not(:disabled) {
  background: rgba(255, 255, 255, 0.08) !important;
}
@media (min-width: 641px) {
  html[data-halo-loop="17"] .home-play-say-row {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    width: 100% !important;
  }
  html[data-halo-loop="17"] .home-play-say {
    flex: 1 1 0 !important;
    width: 0 !important;
    min-width: 0 !important;
  }
  html[data-halo-loop="17"] .stone-btn.home-play-say-go {
    align-self: center !important;
    flex: 0 0 auto !important;
  }
}
html[data-halo-loop="17"] .compose-play-done.stone-btn {
  color: var(--halo-ink) !important;
}
html[data-halo-loop="17"] .compose-play-quote em {
  color: var(--play-ink) !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .compose-play-quote em {
  color: var(--play-kind) !important;
}
html[data-halo-loop="17"] .compose-play-dot.is-filled {
  background: var(--play-ink) !important;
}
html[data-halo-loop="17"] .compose-play-dot.is-current {
  box-shadow: inset 0 0 0 2px var(--play-ink) !important;
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
  color: var(--home-chip-ink, var(--halo-ink));
}
html[data-halo-loop="17"][data-halo-theme="dark"] .compose-play-kind {
  color: var(--play-kind);
}
html[data-halo-loop="17"] .harvest-lock__kicker {
  color: var(--home-chip-ink, var(--halo-ink)) !important;
  opacity: 0.78;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .harvest-lock__kicker {
  color: var(--play-kind) !important;
  opacity: 0.9;
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
html[data-halo-loop="17"][data-home-skin="paper"] {
  --bead-when: 255 217 120;
  --bead-where: 163 217 255;
  --bead-who: 251 207 232;
  --bead-meaning: 197 243 212;
}
html[data-halo-loop="17"] .harvest-span {
  padding: 0 0.12em !important;
  border-radius: 0.18em !important;
  box-decoration-break: slice !important;
  -webkit-box-decoration-break: slice !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .harvest-span--when {
  background: color-mix(in srgb, #ffd978 72%, transparent) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .harvest-span--where {
  background: color-mix(in srgb, #a3d9ff 72%, transparent) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .harvest-span--who {
  background: color-mix(in srgb, #fbcfe8 72%, transparent) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .harvest-span--meaning {
  background: color-mix(in srgb, #c5f3d4 72%, transparent) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] [data-harvest-lock] .harvest-span--when,
html[data-halo-loop="17"][data-home-skin="paper"] [data-harvest-lock] .harvest-span--when.is-lock-current {
  background: color-mix(in srgb, #ffd978 86%, transparent) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] [data-harvest-lock] .harvest-span--where,
html[data-halo-loop="17"][data-home-skin="paper"] [data-harvest-lock] .harvest-span--where.is-lock-current {
  background: color-mix(in srgb, #a3d9ff 86%, transparent) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] [data-harvest-lock] .harvest-span--who,
html[data-halo-loop="17"][data-home-skin="paper"] [data-harvest-lock] .harvest-span--who.is-lock-current {
  background: color-mix(in srgb, #fbcfe8 86%, transparent) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] [data-harvest-lock] .harvest-span--meaning,
html[data-halo-loop="17"][data-home-skin="paper"] [data-harvest-lock] .harvest-span--meaning.is-lock-current {
  background: color-mix(in srgb, #c5f3d4 86%, transparent) !important;
}
html[data-halo-loop="17"] .harvest-span .harvest-span,
html[data-halo-loop="17"] [data-harvest-lock] .harvest-span .harvest-span,
html[data-halo-loop="17"][data-home-skin="paper"] [data-harvest-lock] .harvest-span .harvest-span {
  background: transparent !important;
  padding: 0 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] .keep-bead--when { background: #ffd978 !important; }
html[data-halo-loop="17"][data-home-skin="paper"] .keep-bead--where { background: #a3d9ff !important; }
html[data-halo-loop="17"][data-home-skin="paper"] .keep-bead--who { background: #fbcfe8 !important; }
html[data-halo-loop="17"][data-home-skin="paper"] .keep-bead--meaning { background: #c5f3d4 !important; }
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose,
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
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose .water__skin,
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose .water__edge,
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose .water__ambient,
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose .water__shade,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .water__skin,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .water__edge,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .water__ambient,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .water__shade,
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose .action-btn .water__skin,
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose .action-btn .water__edge,
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose .action-btn .water__ambient,
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose .action-btn .water__shade,
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
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose .action-btn:not(.action-btn--icon),
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
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose .action-btn:not(.action-btn--icon):hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose .action-btn:not(.action-btn--icon):focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .action-btn:not(.action-btn--icon):hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .action-btn:not(.action-btn--icon):focus-visible {
  background: #48484a !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose .action-btn--icon,
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
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose .action-btn--icon:hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose .action-btn--icon:focus-visible,
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
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose-suggest,
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
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose-suggest li + li .compose-suggest-item,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .compose-suggest li + li .compose-suggest-item {
  border-top: 1px solid var(--paper-inset-border) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose-suggest-item,
html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .compose-suggest-item {
  background: transparent !important;
  color: #111111 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose-suggest-item:hover,
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose-suggest-item:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose-suggest-item.is-active,
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
  text-shadow: none !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] :is(.ask-hero, .ask-shell-compose) .compose,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock {
  background: var(--paper-card) !important;
  background-color: var(--paper-card) !important;
  border: 0 !important;
  box-shadow: var(--paper-card-shadow) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] :is(.ask-hero, .ask-shell-compose) .compose .action-btn:not(.action-btn--icon),
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock .action-btn:not(.action-btn--icon) {
  color: #111111 !important;
  background: #d8d8de !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] :is(.ask-hero, .ask-shell-compose) .compose .action-btn:not(.action-btn--icon):hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] :is(.ask-hero, .ask-shell-compose) .compose .action-btn:not(.action-btn--icon):focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock .action-btn:not(.action-btn--icon):hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock .action-btn:not(.action-btn--icon):focus-visible {
  background: #e8e8ed !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] :is(.ask-hero, .ask-shell-compose) .compose .action-btn--icon,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock .action-btn--icon {
  color: #f5f5f7 !important;
  background: transparent !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] :is(.ask-hero, .ask-shell-compose) .compose .action-btn--icon:hover:not(:disabled),
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] :is(.ask-hero, .ask-shell-compose) .compose .action-btn--icon:focus-visible,
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
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] :is(.ask-hero, .ask-shell-compose) .compose-suggest,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock .compose-suggest {
  background: var(--paper-card) !important;
  border: 0 !important;
  box-shadow: var(--paper-card-shadow) !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] :is(.ask-hero, .ask-shell-compose) .compose-suggest-item,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] .compose-dock .compose-suggest-item {
  background: transparent !important;
  color: #f5f5f7 !important;
}
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] :is(.ask-hero, .ask-shell-compose) .compose-suggest-item:hover,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] :is(.ask-hero, .ask-shell-compose) .compose-suggest-item:focus-visible,
html[data-halo-loop="17"][data-home-skin="paper"][data-halo-theme="dark"] :is(.ask-hero, .ask-shell-compose) .compose-suggest-item.is-active,
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
  html[data-halo-loop="17"][data-home-skin="paper"] :is(.ask-hero, .ask-shell-compose) .compose .water__skin,
  html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock .water__skin {
    -apple-visual-effect: none !important;
    display: none !important;
  }
}
@media (max-width: 720px) {
  html[data-halo-loop="17"] .keep-dock--beads {
    max-width: 100% !important;
    width: 100% !important;
    min-width: 0 !important;
    --keep-gap: 0.22rem !important;
    --keep-slot: 1.58rem;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }
  html[data-halo-loop="17"] .keep-dock__row {
    padding-left: 0.4rem !important;
  }
  html[data-halo-loop="17"] .keep-dock--beads.is-fade-left {
    mask-image: linear-gradient(to right, transparent, #000 0.55rem, #000 100%) !important;
    -webkit-mask-image: linear-gradient(to right, transparent, #000 0.55rem, #000 100%) !important;
  }
  html[data-halo-loop="17"] .keep-dock--beads.is-fade-right {
    mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 0.55rem), transparent) !important;
    -webkit-mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 0.55rem), transparent) !important;
  }
  html[data-halo-loop="17"] .keep-dock--beads.is-fade-left.is-fade-right {
    mask-image: linear-gradient(to right, transparent, #000 0.55rem, #000 calc(100% - 0.55rem), transparent) !important;
    -webkit-mask-image: linear-gradient(to right, transparent, #000 0.55rem, #000 calc(100% - 0.55rem), transparent) !important;
  }
  html[data-halo-loop="17"] .keep-pocket {
    max-width: min(12.2rem, 58vw) !important;
    min-width: 0 !important;
    overflow: hidden !important;
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
    font-size: 1.22rem !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-row {
    display: flex !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    gap: 0.28rem !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-form .field {
    flex: 1 1 auto !important;
    align-self: center !important;
    min-width: 0 !important;
    width: auto !important;
    field-sizing: fixed !important;
    padding-top: 0.58rem !important;
    padding-bottom: 0.58rem !important;
    line-height: 1.25 !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-actions {
    flex: 0 0 auto !important;
    width: auto !important;
    justify-content: flex-end !important;
    align-items: center !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-row.is-stacked,
  html[data-halo-loop="17"] .chat-stage .compose-row:focus-within,
  html[data-halo-loop="17"] .chat-stage .compose-row:has(.field:not(:placeholder-shown)),
  html[data-halo-loop="17"] .compose-dock .compose-row.is-stacked,
  html[data-halo-loop="17"] .compose-dock .compose-row:focus-within,
  html[data-halo-loop="17"] .compose-dock .compose-row:has(.field:not(:placeholder-shown)) {
    flex-wrap: wrap !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-row.is-stacked .field,
  html[data-halo-loop="17"] .chat-stage .compose-row:focus-within .field,
  html[data-halo-loop="17"] .chat-stage .compose-row:has(.field:not(:placeholder-shown)) .field,
  html[data-halo-loop="17"] .compose-dock .compose-row.is-stacked .field,
  html[data-halo-loop="17"] .compose-dock .compose-row:focus-within .field,
  html[data-halo-loop="17"] .compose-dock .compose-row:has(.field:not(:placeholder-shown)) .field {
    flex: 1 1 100% !important;
    width: 100% !important;
    max-width: none !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-row.is-stacked .compose-actions,
  html[data-halo-loop="17"] .chat-stage .compose-row:focus-within .compose-actions,
  html[data-halo-loop="17"] .chat-stage .compose-row:has(.field:not(:placeholder-shown)) .compose-actions,
  html[data-halo-loop="17"] .compose-dock .compose-row.is-stacked .compose-actions,
  html[data-halo-loop="17"] .compose-dock .compose-row:focus-within .compose-actions,
  html[data-halo-loop="17"] .compose-dock .compose-row:has(.field:not(:placeholder-shown)) .compose-actions {
    flex: 1 0 100% !important;
    width: 100% !important;
    justify-content: flex-end !important;
  }
  html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock {
    box-shadow: none !important;
    filter: none !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-dock,
  html[data-halo-loop="17"][data-home-skin="paper"] .chat-stage .compose-dock {
    position: relative !important;
    inset: auto !important;
    left: auto !important;
    right: auto !important;
    bottom: auto !important;
    z-index: 20 !important;
    justify-self: stretch !important;
    width: 100% !important;
    max-width: 100% !important;
    min-height: 0 !important;
    margin: 0 0 var(--chat-dock-lift, 0.75rem) !important;
    overflow: visible !important;
    border-radius: 28px !important;
    box-shadow: none !important;
    filter: none !important;
  }
  html[data-halo-loop="17"] .chat-stage::after {
    content: none !important;
    display: none !important;
    box-shadow: none !important;
  }
  html[data-halo-loop="17"] .gold-kept-panel,
  html[data-halo-loop="17"] .keep-inspect-panel {
    position: fixed !important;
    z-index: 50 !important;
    top: var(--inspect-panel-top, var(--kept-panel-top, 4.5rem)) !important;
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
  html[data-halo-loop="17"] .ask-stage.is-playing .ask-greeting,
  html[data-halo-loop="17"] .ask-stage.is-playing .home-day-cap {
    display: none !important;
  }
  html[data-halo-loop="17"] .ask-stage.is-playing .compose-stack:not(.compose-stack--phantom),
  html[data-halo-loop="17"] .ask-stage.is-playing .compose.is-play-lesson {
    width: 100% !important;
    max-width: 100% !important;
  }
  html[data-halo-loop="17"] .compose.is-play-lesson.is-grown .compose-play-col {
    margin-top: 0.5rem !important;
    margin-bottom: 1.15rem !important;
    gap: 0.85rem !important;
  }
  html[data-halo-loop="17"] .home-play-choices {
    grid-template-columns: 1fr !important;
    max-width: 20rem !important;
    margin: 0 auto !important;
  }
  html[data-halo-loop="17"] .home-play-choices .home-play-choice {
    min-height: 3.2rem !important;
    font-size: 1.15rem !important;
    padding: 0.78rem 0.95rem !important;
    border-radius: 1.15rem !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
    line-height: 1.28 !important;
  }
  html[data-halo-loop="17"] .home-play-say-row {
    flex-direction: column !important;
    align-items: stretch !important;
  }
  html[data-halo-loop="17"] .home-play-say {
    width: 100% !important;
    flex: 0 0 auto !important;
  }
  html[data-halo-loop="17"] .stone-btn.home-play-say-go {
    align-self: flex-end !important;
  }
  html[data-halo-loop="17"] .compose-play-prompt {
    font-size: 1.28rem !important;
    max-width: none !important;
    margin: 0 auto !important;
    padding: 0 0.35rem !important;
  }
  html[data-halo-loop="17"] .harvest-lock .compose-play-prompt {
    font-size: 1.22rem !important;
    line-height: 1.3 !important;
  }
  html[data-halo-loop="17"] .harvest-lock .home-play-choices:not(.home-play-choices--stack) {
    grid-template-columns: 1fr !important;
    max-width: 20rem !important;
    margin: 0 auto !important;
    width: 100% !important;
  }
  html[data-halo-loop="17"] .harvest-lock .home-play-choices .home-play-choice {
    min-height: 3.2rem !important;
    font-size: 1.12rem !important;
    padding: 0.78rem 0.95rem !important;
  }
  html[data-halo-loop="17"] .harvest-lock__body.compose-play-beat {
    padding: 0.68rem 0.9rem 0.72rem !important;
    gap: 0.55rem !important;
  }
  html[data-halo-loop="17"] .harvest-lock:has(.harvest-lock__say) {
    min-height: 0 !important;
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
  align-items: center !important;
  gap: 0.42rem !important;
  position: relative !important;
  min-width: 0 !important;
  margin: 0 !important;
}
html[data-halo-loop="17"] .gold-kept {
  position: relative !important;
  display: inline-flex !important;
  align-items: center !important;
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
html[data-halo-loop="17"] .keep-inspect-panel {
  background: var(--paper-card) !important;
  color: inherit !important;
  box-shadow: var(--paper-card-shadow) !important;
  border-radius: 16px !important;
  z-index: 40 !important;
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
html[data-halo-loop="17"] .home-bubbles.is-choosing .recent-slot {
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
  transition: none !important;
}
html[data-halo-loop="17"] .home-day-cap {
  top: var(--day-cap-y, 12%) !important;
  transform: translate(-50%, -100%) !important;
  background: color-mix(in srgb, var(--paper-field) 88%, transparent) !important;
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
html[data-halo-loop="17"] .login-oauth-btn {
  box-shadow: none !important;
}
html[data-halo-loop="17"] .login-google {
  background: var(--paper-card) !important;
  border: 1px solid var(--paper-inset-border) !important;
  color: var(--halo-ink) !important;
}
html[data-halo-loop="17"] .login-text-btn {
  color: var(--halo-ink-soft) !important;
}
html[data-halo-loop="17"][data-halo-theme="dark"] .login-google {
  color: #f5f5f7 !important;
}
html[data-halo-native][data-halo-loop="17"] .login-card.auth-card {
  background: transparent !important;
  box-shadow: none !important;
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
    padding: 0.34rem 0.56rem !important;
  }
  html[data-halo-loop="17"] .gold-kept-ring {
    font-size: 1.7rem !important;
  }
  html[data-halo-loop="17"] .gold-kept-n {
    font-size: 1.2rem !important;
  }
  html[data-halo-loop="17"] .topbar-action-icon {
    width: 1.4rem !important;
    height: 1.4rem !important;
  }
  html[data-halo-loop="17"] .topbar-actions .history-wrap .stone-btn {
    min-height: 2.35rem !important;
  }
  html[data-halo-loop="17"] .gold-kept-panel,
  html[data-halo-loop="17"] .keep-inspect-panel {
    position: fixed !important;
    z-index: 50 !important;
    top: var(--inspect-panel-top, var(--kept-panel-top, 4.5rem)) !important;
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
  html[data-halo-loop="17"] .ask-stage,
  html[data-halo-loop="17"] .chat-stage {
    padding: calc(0.5rem + env(safe-area-inset-top, 0px))
      max(12px, env(safe-area-inset-right, 0px))
      env(safe-area-inset-bottom, 0px)
      max(12px, env(safe-area-inset-left, 0px)) !important;
  }
  html[data-halo-loop="17"] .chat-stage {
    position: relative !important;
    top: auto !important;
    left: auto !important;
    right: auto !important;
    width: 100% !important;
    max-width: 100vw !important;
    box-sizing: border-box !important;
    min-height: 0 !important;
    height: calc(100dvh - var(--kb-inset, 0px)) !important;
    gap: 0 !important;
    grid-template-rows: auto minmax(0, 1fr) auto !important;
    --chat-dock-lift: 0.75rem !important;
    --chat-head-fade: 1.2rem !important;
  }
  html[data-halo-loop="17"] .ask-stage .topbar,
  html[data-halo-loop="17"] .chat-stage .topbar {
    position: relative !important;
    top: auto !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: calc(var(--water) + 0.28rem) calc(var(--water) + 0.32rem)
      calc(var(--water) + 0.28rem) calc(var(--water) + 0.55rem) !important;
  }
  html[data-halo-loop="17"] .chat-stage > .stage--page {
    position: relative !important;
  }
  html[data-halo-loop="17"] .chat-stage > .stage--page::before,
  html[data-halo-loop="17"] .chat-stage > .stage--page::after {
    content: "" !important;
    position: absolute !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 12 !important;
    pointer-events: none !important;
  }
  html[data-halo-loop="17"] .chat-stage > .stage--page::before {
    top: 0 !important;
    height: var(--chat-head-fade, 1.2rem) !important;
    background: linear-gradient(
      to bottom,
      var(--paper-field) 0%,
      color-mix(in srgb, var(--paper-field) 55%, transparent) 48%,
      transparent 100%
    ) !important;
  }
  html[data-halo-loop="17"] .chat-stage > .stage--page::after {
    bottom: 0 !important;
    height: 1.7rem !important;
    background: linear-gradient(
      to top,
      var(--paper-field) 0%,
      color-mix(in srgb, var(--paper-field) 62%, transparent) 46%,
      transparent 100%
    ) !important;
  }
  html[data-halo-loop="17"][data-halo-kb] .chat-stage {
    padding-bottom: 0 !important;
    --chat-dock-lift: 0.35rem !important;
  }
  html[data-halo-loop="17"][data-home-skin="paper"] .compose-dock {
    box-shadow: none !important;
    filter: none !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-dock,
  html[data-halo-loop="17"][data-home-skin="paper"] .chat-stage .compose-dock {
    position: relative !important;
    inset: auto !important;
    left: auto !important;
    right: auto !important;
    bottom: auto !important;
    z-index: 20 !important;
    justify-self: stretch !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 0 var(--chat-dock-lift, 0.75rem) !important;
    padding: 0.38rem 0.48rem 0.38rem 0.9rem !important;
    border-radius: 28px !important;
    box-shadow: none !important;
    filter: none !important;
  }
  html[data-halo-loop="17"] .ask-stage .topbar,
  html[data-halo-loop="17"] .chat-stage .topbar,
  html[data-halo-loop="17"][data-home-skin="paper"] .chat-stage .topbar {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
  }
  html[data-halo-loop="17"] .chat-stage .chat-scroll {
    padding-top: calc(1.15rem + var(--chat-head-fade, 1.2rem) + 0.2rem) !important;
  }
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
    display: flex !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    gap: 0.28rem !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-form .field {
    flex: 1 1 auto !important;
    align-self: center !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    field-sizing: fixed !important;
    padding-top: 0.58rem !important;
    padding-bottom: 0.58rem !important;
    line-height: 1.25 !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-actions {
    display: flex !important;
    flex-wrap: nowrap !important;
    flex: 0 0 auto !important;
    width: auto !important;
    max-width: none !important;
    justify-content: flex-end !important;
    align-items: center !important;
    gap: 0.18rem !important;
    box-sizing: border-box !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-row.is-stacked,
  html[data-halo-loop="17"] .chat-stage .compose-row:focus-within,
  html[data-halo-loop="17"] .chat-stage .compose-row:has(.field:not(:placeholder-shown)),
  html[data-halo-loop="17"] .compose-dock .compose-row.is-stacked,
  html[data-halo-loop="17"] .compose-dock .compose-row:focus-within,
  html[data-halo-loop="17"] .compose-dock .compose-row:has(.field:not(:placeholder-shown)) {
    flex-wrap: wrap !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-row.is-stacked .field,
  html[data-halo-loop="17"] .chat-stage .compose-row:focus-within .field,
  html[data-halo-loop="17"] .chat-stage .compose-row:has(.field:not(:placeholder-shown)) .field,
  html[data-halo-loop="17"] .compose-dock .compose-row.is-stacked .field,
  html[data-halo-loop="17"] .compose-dock .compose-row:focus-within .field,
  html[data-halo-loop="17"] .compose-dock .compose-row:has(.field:not(:placeholder-shown)) .field {
    flex: 1 1 100% !important;
    width: 100% !important;
    max-width: none !important;
  }
  html[data-halo-loop="17"] .chat-stage .compose-row.is-stacked .compose-actions,
  html[data-halo-loop="17"] .chat-stage .compose-row:focus-within .compose-actions,
  html[data-halo-loop="17"] .chat-stage .compose-row:has(.field:not(:placeholder-shown)) .compose-actions,
  html[data-halo-loop="17"] .compose-dock .compose-row.is-stacked .compose-actions,
  html[data-halo-loop="17"] .compose-dock .compose-row:focus-within .compose-actions,
  html[data-halo-loop="17"] .compose-dock .compose-row:has(.field:not(:placeholder-shown)) .compose-actions {
    flex: 1 0 100% !important;
    width: 100% !important;
    max-width: none !important;
    justify-content: flex-end !important;
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
  html[data-halo-loop="17"][data-halo-ask-shell="1"] .ask-shell--chat::after {
    content: none !important;
    display: none !important;
    box-shadow: none !important;
  }
  html[data-halo-loop="17"][data-halo-ask-shell="1"] .ask-shell--chat .ask-shell-compose {
    left: 12px !important;
    right: 12px !important;
    width: auto !important;
    transform: none !important;
    bottom: 0.75rem !important;
  }
  html[data-halo-loop="17"][data-halo-ask-shell="1"] .ask-shell--chat .compose-dock {
    position: relative !important;
    bottom: auto !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    border-radius: 28px !important;
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
