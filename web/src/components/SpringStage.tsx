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

export function captureComposeMorph(el: HTMLElement | null) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  handoff = { top: rect.top, left: rect.left, at: Date.now() };
}

const MORPH_MS = 820;

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
    if (!el || !from || !allowed.current) return;
    if (Date.now() - from.at > 3000) {
      handoff = null;
      return;
    }

    const rect = el.getBoundingClientRect();
    const dx = from.left - rect.left;
    const dy = from.top - rect.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
      handoff = null;
      return;
    }

    // Carried over, so it must not also play the arrival animation — it is
    // already on screen, just standing somewhere else. This rides a data
    // attribute rather than a class: the dock re-renders while it travels,
    // and React owns className.
    el.dataset.morph = "carried";
    el.style.setProperty("--morph-x", `${dx.toFixed(1)}px`);
    el.style.setProperty("--morph-y", `${dy.toFixed(1)}px`);

    let cleared = 0;
    const raf = requestAnimationFrame(() => {
      // Spent only once the travel is under way, so a remount cannot swallow
      // the handoff and drop the dock straight into place.
      handoff = null;
      el.dataset.morph = "moving";
      el.style.setProperty("--morph-x", "0px");
      el.style.setProperty("--morph-y", "0px");
      cleared = window.setTimeout(() => {
        delete el.dataset.morph;
        el.style.removeProperty("--morph-x");
        el.style.removeProperty("--morph-y");
      }, MORPH_MS + 60);
    });

    return () => {
      cancelAnimationFrame(raf);
      if (cleared) window.clearTimeout(cleared);
      delete el.dataset.morph;
      el.style.removeProperty("--morph-x");
      el.style.removeProperty("--morph-y");
    };
  }, [ref]);
}
