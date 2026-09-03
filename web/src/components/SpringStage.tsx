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

/**
 * One-frame cover while the live composer unmounts. A painted stadium — not a
 * DOM clone — so a transformed field never double-prints or blinks.
 */
export function pinComposeGhost(el: HTMLElement | null) {
  if (typeof document === "undefined" || !el) return;
  clearComposeGhost();
  const rect = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const ghost = document.createElement("div");
  ghost.dataset.composeGhost = "1";
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.cssText = [
    "position:fixed",
    `left:${rect.left}px`,
    `top:${rect.top}px`,
    `width:${rect.width}px`,
    `height:${rect.height}px`,
    `border-radius:${cs.borderRadius}`,
    `background:${cs.backgroundColor}`,
    "z-index:24",
    "pointer-events:none",
  ].join(";");
  document.body.appendChild(ghost);
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
  el.style.removeProperty("visibility");
  el.style.removeProperty("--morph-x");
  el.style.removeProperty("--morph-y");
  delete document.documentElement.dataset.haloMorph;
}

/** Undo a leave travel when prepare fails after the composer already moved. */
export function resetComposeTravel(el: HTMLElement | null) {
  if (!el) return;
  clearMorph(el);
  clearComposeGhost();
  clearComposeHandoff();
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
  const allowed = useRef(enabled);
  allowed.current = enabled;

  useLayoutEffect(() => {
    const from = handoff;
    const el = ref.current;
    if (!el || !from || !allowed.current) {
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
      // Drop the cover on the next frame, after this composer has painted.
      window.requestAnimationFrame(clearComposeGhost);
      return;
    }

    const gen = flipCompose(el, dx, dy, 0, 0);
    window.requestAnimationFrame(clearComposeGhost);
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
