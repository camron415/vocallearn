"use client";

import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";

export function SpringStage({
  children,
  variant = "page",
}: {
  children: ReactNode;
  variant?: "page" | "hero";
}) {
  return <div className={`stage stage--${variant}`}>{children}</div>;
}

/**
 * Landing compose and chat dock are the same floating object. The composer
 * records where it was standing, and the dock springs from that spot on the
 * next screen instead of the page swapping under you.
 */
type Handoff = { top: number; left: number; at: number };

let handoff: Handoff | null = null;
/** Last Home composer pose so chat→home can ride the dock up the same path. */
let heroPose: Handoff | null = null;

export function captureComposeMorph(el: HTMLElement | null) {
  if (!el) return;
  if (el.classList.contains("is-play-lesson")) return;
  const rect = el.getBoundingClientRect();
  handoff = { top: rect.top, left: rect.left, at: Date.now() };
}

export function rememberHeroCompose(el: HTMLElement | null) {
  if (!el) return;
  if (el.classList.contains("is-play-lesson")) return;
  const rect = el.getBoundingClientRect();
  heroPose = { top: rect.top, left: rect.left, at: Date.now() };
}

export function clearComposeGhost() {
  if (typeof document === "undefined") return;
  document.querySelector("[data-compose-ghost]")?.remove();
}

/** Covers the one-frame hole when Chat unmounts and Home mounts. */
export function pinComposeGhost(el: HTMLElement | null) {
  if (typeof document === "undefined" || !el) return;
  clearComposeGhost();
  const rect = el.getBoundingClientRect();
  const clone = el.cloneNode(true) as HTMLElement;
  clone.dataset.composeGhost = "1";
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  clone.querySelectorAll("textarea, input, button, select").forEach((node) => {
    const field = node as HTMLTextAreaElement | HTMLInputElement | HTMLButtonElement;
    field.tabIndex = -1;
    if ("readOnly" in field) field.readOnly = true;
    if ("disabled" in field) field.disabled = true;
  });
  clone.setAttribute("aria-hidden", "true");
  clone.style.cssText = [
    "position:fixed",
    `left:${rect.left}px`,
    `top:${rect.top}px`,
    `width:${rect.width}px`,
    `height:${rect.height}px`,
    "margin:0",
    "z-index:24",
    "pointer-events:none",
    "transform:none",
    "transition:none",
  ].join(";");
  document.body.appendChild(clone);
  window.setTimeout(clearComposeGhost, MORPH_MS + 80);
}

export function clearComposeHandoff() {
  handoff = null;
  heroPose = null;
  if (typeof document === "undefined") return;
  delete document.documentElement.dataset.haloMorph;
  delete document.documentElement.dataset.haloPlay;
  clearComposeGhost();
}

const MORPH_MS = 1080;
const EASE = "cubic-bezier(0.33, 0.04, 0.2, 1)";

export const COMPOSE_TRAVEL_MS = MORPH_MS;

let morphGen = 0;

if (typeof window !== "undefined") {
  window.addEventListener("pageshow", () => {
    handoff = null;
    heroPose = null;
    morphGen += 1;
    delete document.documentElement.dataset.haloMorph;
    delete document.documentElement.dataset.haloPlay;
    clearComposeGhost();
  });
}

function clearMorph(el: HTMLElement) {
  delete el.dataset.morph;
  el.style.removeProperty("transition");
  el.style.removeProperty("transform");
  el.style.removeProperty("--morph-x");
  el.style.removeProperty("--morph-y");
  delete document.documentElement.dataset.haloMorph;
}

/** FLIP: write the from pose, flush layout, then ease to the to pose. */
function flipCompose(
  el: HTMLElement,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
) {
  const gen = ++morphGen;
  el.dataset.morph = "moving";
  document.documentElement.dataset.haloMorph = "1";
  el.style.transition = "none";
  el.style.transform = `translate(${fromX.toFixed(1)}px, ${fromY.toFixed(1)}px)`;
  void el.getBoundingClientRect();
  el.style.transition = `transform ${MORPH_MS}ms ${EASE}`;
  el.style.transform = `translate(${toX.toFixed(1)}px, ${toY.toFixed(1)}px)`;
  return gen;
}

/** Ride the Home composer down to where the chat dock will sit. */
export function travelComposeTowardDock(el: HTMLElement | null) {
  if (!el) return;
  if (el.classList.contains("is-play-lesson")) return;
  const rect = el.getBoundingClientRect();
  const water = parseFloat(getComputedStyle(el).getPropertyValue("--water")) || 12;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const destTop =
    window.innerHeight - 1.5 * rem - (0.95 * rem - water) - rect.height;
  const dy = destTop - rect.top;
  if (Math.abs(dy) < 8) return;
  flipCompose(el, 0, 0, 0, dy);
}

/** Ride the chat dock up to where the Home composer sits. */
export function travelComposeTowardHero(el: HTMLElement | null) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const dest = heroPose;
  const fresh = Boolean(dest && Date.now() - dest.at < 120000);
  const destTop = fresh && dest ? dest.top : window.innerHeight / 2 + 8;
  const destLeft = fresh && dest ? dest.left : rect.left;
  const dx = destLeft - rect.left;
  const dy = destTop - rect.top;
  if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
  flipCompose(el, 0, 0, dx, dy);
}

export function useComposeMorph(
  ref: RefObject<HTMLDivElement | null>,
  enabled: boolean
) {
  // Read at mount time only: a later motion-setting change must not tear a
  // travel that is already under way.
  const allowed = useRef(enabled);
  allowed.current = enabled;

  // Runs before paint so the dock never shows up at its final spot first.
  useLayoutEffect(() => {
    const from = handoff;
    const el = ref.current;
    if (!el || !from || !allowed.current) {
      // iPhone auto-soft skips morph. Still drop the Chat→Home ghost or
      // a stadium-sized gray sheet sits on Home forever.
      clearComposeGhost();
      if (!allowed.current) handoff = null;
      return;
    }
    if (Date.now() - from.at > 3000) {
      handoff = null;
      clearComposeGhost();
      return;
    }

    const rect = el.getBoundingClientRect();
    const dx = from.left - rect.left;
    const dy = from.top - rect.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
      handoff = null;
      clearComposeGhost();
      return;
    }

    // Carried over, so it must not also play the arrival animation — it is
    // already on screen, just standing somewhere else.
    const gen = flipCompose(el, dx, dy, 0, 0);
    clearComposeGhost();
    const cleared = window.setTimeout(() => {
      if (gen !== morphGen) return;
      handoff = null;
      clearMorph(el);
    }, MORPH_MS + 60);

    return () => {
      window.clearTimeout(cleared);
      if (gen === morphGen) clearMorph(el);
    };
  }, [ref]);
}
