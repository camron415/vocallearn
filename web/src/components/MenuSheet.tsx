"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GlassButton } from "@/components/Glass";

/** One sheet for History and Settings, on Home and in Chat.
 *  The card grows out of whichever composer is on screen — Ask hero on Home,
 *  follow-up dock in Chat — so both entries share one motion. Play sheet
 *  `--travel` (1080ms) is untouched; menus run on the shorter menu tokens. */

const GROW_MS = 520;
const SHRINK_MS = 380;
const EASE = "cubic-bezier(0.33, 0.04, 0.2, 1)";

type Pin = { top: number; left: number; width: number };

/** Chat dock first: in Chat both selectors can match, and the dock is the
 *  anchor the eye is on. */
function composerRect(): DOMRect | null {
  const el =
    document.querySelector<HTMLElement>(".compose-dock") ??
    document.querySelector<HTMLElement>(".ask-hero .compose") ??
    document.querySelector<HTMLElement>(".compose");
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return rect.height > 0 && rect.width > 0 ? rect : null;
}

function set(el: HTMLElement, prop: string, value: string) {
  // LoopSkin ships the Paper card with `!important` for Safari, so inline
  // animation values have to carry the same weight.
  el.style.setProperty(prop, value, "important");
}

function clear(el: HTMLElement, props: string[]) {
  for (const prop of props) el.style.removeProperty(prop);
}

function translateY(el: HTMLElement): number {
  const raw = getComputedStyle(el).transform;
  if (!raw || raw === "none") return 0;
  const match = /matrix\((?:[^,]+,){5}\s*([-\d.]+)\)/.exec(raw);
  if (match) return Number(match[1]) || 0;
  const match3d = /matrix3d\((?:[^,]+,){13}\s*([-\d.]+)/.exec(raw);
  return match3d ? Number(match3d[1]) || 0 : 0;
}

function calmMotion(): boolean {
  if (document.documentElement.dataset.haloMotion === "soft") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function skipMenuMorph() {
  if (calmMotion()) return true;
  return (
    window.matchMedia("(max-width: 720px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

const MORPHED = ["position", "top", "left", "width", "height", "margin", "transform", "border-radius", "background-color", "overflow", "transition"];

export function MenuSheet({
  open,
  onClose,
  onEscape,
  title,
  titleId,
  cardClassName,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onEscape?: () => void;
  title: string;
  titleId: string;
  cardClassName?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [live, setLive] = useState(false);
  const [closing, setClosing] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const veilRef = useRef<HTMLDivElement | null>(null);
  const pinRef = useRef<Pin | null>(null);
  const liveRef = useRef(false);
  const openedAt = useRef(0);
  const instantRef = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => setMounted(true), []);

  const wait = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useLayoutEffect(() => {
    if (open) {
      liveRef.current = true;
      instantRef.current = skipMenuMorph();
      openedAt.current = Date.now();
      setClosing(false);
      setLive(true);
      return;
    }
    if (liveRef.current) setClosing(true);
  }, [open]);

  /** Grow: pill at the composer → card at rest. */
  useLayoutEffect(() => {
    if (!live) return;
    const card = cardRef.current;
    const veil = veilRef.current;
    if (!card || !veil) return;

    document.documentElement.dataset.haloSheet = "1";

    if (instantRef.current) {
      veil.dataset.state = "open";
      card.dataset.grow = "open";
      return;
    }

    const rest = card.getBoundingClientRect();
    const from = composerRect();
    if (!from) {
      const plain = requestAnimationFrame(() => {
        veil.dataset.state = "open";
        card.dataset.grow = "open";
      });
      return () => cancelAnimationFrame(plain);
    }

    const pin: Pin = { top: rest.top, left: rest.left, width: rest.width };
    pinRef.current = pin;

    card.dataset.grow = "seed";
    clear(card, MORPHED);
    set(card, "transition", "none");
    set(card, "position", "fixed");
    set(card, "top", `${pin.top}px`);
    set(card, "left", `${pin.left}px`);
    set(card, "width", `${pin.width}px`);
    set(card, "margin", "0");
    set(card, "overflow", "hidden");
    set(card, "height", `${from.height}px`);
    set(card, "transform", `translateY(${Math.round(from.top - rest.top)}px)`);
    set(card, "border-radius", "28px");
    set(card, "background-color", "var(--paper-inset, #fcfcfb)");
    void card.getBoundingClientRect();

    const raf = requestAnimationFrame(() => {
      veil.dataset.state = "open";
      set(
        card,
        "transition",
        `height ${GROW_MS}ms ${EASE}, transform ${GROW_MS}ms ${EASE}, border-radius ${GROW_MS}ms ${EASE}, background-color ${GROW_MS}ms ${EASE}, box-shadow ${GROW_MS}ms ${EASE}`
      );
      set(card, "height", `${Math.round(rest.height)}px`);
      set(card, "transform", "translateY(0px)");
      set(card, "border-radius", "20px");
      set(card, "background-color", "var(--paper-card, #f3f2f0)");
      card.dataset.grow = "open";
    });

    /** Hand layout back to the stylesheet so the card can scroll and reflow. */
    const settle = (e?: TransitionEvent) => {
      if (e && (e.target !== card || e.propertyName !== "height")) return;
      card.removeEventListener("transitionend", settle);
      clear(card, MORPHED);
      pinRef.current = null;
    };
    card.addEventListener("transitionend", settle);
    wait(settle, GROW_MS + 120);

    return () => {
      cancelAnimationFrame(raf);
      card.removeEventListener("transitionend", settle);
    };
    // Runs once per open; `closing` drives the reverse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  /** Shrink: back down into the composer it came from. */
  useLayoutEffect(() => {
    if (!closing || !live) return;
    const card = cardRef.current;
    const veil = veilRef.current;

    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];

    // Dropped at the top of the shrink so the composer fades back in while the
    // sheet is still on its way down to it.
    delete document.documentElement.dataset.haloSheet;

    const finish = () => {
      liveRef.current = false;
      pinRef.current = null;
      if (card) clear(card, MORPHED);
      setLive(false);
      setClosing(false);
    };

    if (veil) veil.dataset.state = "closing";
    if (!card || instantRef.current || calmMotion()) {
      wait(finish, 200);
      return;
    }

    card.dataset.grow = "closing";
    const to = composerRect();
    const rect = card.getBoundingClientRect();
    const ty = translateY(card);
    const layoutTop = pinRef.current ? pinRef.current.top : rect.top - ty;
    const pin: Pin = pinRef.current ?? {
      top: layoutTop,
      left: rect.left,
      width: rect.width,
    };

    set(card, "transition", "none");
    set(card, "position", "fixed");
    set(card, "top", `${pin.top}px`);
    set(card, "left", `${pin.left}px`);
    set(card, "width", `${pin.width}px`);
    set(card, "margin", "0");
    set(card, "overflow", "hidden");
    set(card, "height", `${Math.round(rect.height)}px`);
    set(card, "transform", `translateY(${Math.round(ty)}px)`);
    void card.getBoundingClientRect();

    requestAnimationFrame(() => {
      set(
        card,
        "transition",
        `height ${SHRINK_MS}ms ${EASE}, transform ${SHRINK_MS}ms ${EASE}, border-radius ${SHRINK_MS}ms ${EASE}, background-color ${SHRINK_MS}ms ${EASE}, box-shadow ${SHRINK_MS}ms ${EASE}`
      );
      set(card, "height", `${to ? to.height : 56}px`);
      set(card, "transform", `translateY(${Math.round((to ? to.top : pin.top) - pin.top)}px)`);
      set(card, "border-radius", "28px");
      set(card, "background-color", "var(--paper-inset, #fcfcfb)");
    });

    wait(finish, SHRINK_MS + 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing]);

  useEffect(() => {
    if (!live) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (onEscape) onEscape();
      else onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [live, onClose, onEscape]);

  useEffect(
    () => () => {
      for (const id of timers.current) window.clearTimeout(id);
      delete document.documentElement.dataset.haloSheet;
    },
    []
  );

  if (!mounted || !live) return null;

  return createPortal(
    <div
      ref={veilRef}
      className="history-overlay menu-veil"
      data-state={instantRef.current ? "open" : "seed"}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onPointerDown={(e) => {
        if (Date.now() - openedAt.current < 480) return;
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        className={`history-page menu-sheet${cardClassName ? ` ${cardClassName}` : ""}`}
        data-grow={instantRef.current ? "open" : "seed"}
      >
        <div className="history-page-head">
          <h1 id={titleId} className="history-page-title">
            {title}
          </h1>
          <GlassButton onClick={onClose}>Close</GlassButton>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
