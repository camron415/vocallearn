"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function CollectFlights({
  token,
  reduced,
  onDone,
}: {
  token: string | null;
  reduced: boolean;
  onDone: (token: string) => void;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  const [portal, setPortal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    setPortal(document.body);
  }, []);

  useLayoutEffect(() => {
    done.current = false;
    if (!token) return;

    if (reduced) {
      onDoneRef.current(token);
      return;
    }

    let frame = 0;
    let wait = 0;
    const from = () => collectOrigin(token);
    const to = collectLand();

    const start = () => {
      const el = nodeRef.current;
      if (!el) {
        frame = window.requestAnimationFrame(start);
        return;
      }
      const origin = from();
      el.style.left = `${origin.x}px`;
      el.style.top = `${origin.y}px`;
      el.style.opacity = "1";
      el.style.transform = "translate(-50%, -50%) scale(1)";

      const began = performance.now();
      const duration = 980;
      const tick = (now: number) => {
        const t = Math.min(1, (now - began) / duration);
        const u = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
        const x = origin.x + (to.x - origin.x) * u;
        const y = origin.y + (to.y - origin.y) * u;
        const fade = t < 0.8 ? 1 : 1 - (t - 0.8) / 0.2;
        const scale = t < 0.8 ? 1 : 1 - 0.92 * ((t - 0.8) / 0.2);
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.opacity = String(fade);
        el.style.transform = `translate(-50%, -50%) scale(${scale})`;
        if (t < 1) {
          frame = window.requestAnimationFrame(tick);
          return;
        }
        if (!done.current) {
          done.current = true;
          onDoneRef.current(token);
        }
      };
      frame = window.requestAnimationFrame(tick);
    };

    wait = window.setTimeout(() => {
      frame = window.requestAnimationFrame(start);
    }, 80);

    return () => {
      window.clearTimeout(wait);
      window.cancelAnimationFrame(frame);
    };
  }, [token, reduced]);

  if (!portal) return null;

  return createPortal(
    <div
      ref={nodeRef}
      className="collect-fly"
      style={{
        opacity: 0,
        pointerEvents: "none",
      }}
      aria-hidden
    />,
    portal
  );
}

function collectOrigin(token: string) {
  const id =
    typeof CSS !== "undefined" && "escape" in CSS
      ? CSS.escape(token)
      : token.replace(/"/g, "");
  const mark =
    document.querySelector(`[data-save-origin="${id}"]`) ??
    document.querySelector(".save-offer:not(:disabled)") ??
    document.querySelector('[data-harvest-origin="true"] .msg');
  const box = mark?.getBoundingClientRect();
  if (box && box.height >= 2) {
    return {
      x: box.left + box.width * 0.5,
      y: box.top + box.height * 0.5,
    };
  }
  return { x: window.innerWidth * 0.5, y: window.innerHeight * 0.42 };
}

function collectLand() {
  const pocket = document.querySelector("[data-saves-pocket] .stone-btn");
  const box = pocket?.getBoundingClientRect();
  if (box && box.width >= 4) {
    return {
      x: box.left + box.width / 2,
      y: box.top + box.height / 2,
    };
  }
  return { x: window.innerWidth * 0.82, y: 36 };
}
