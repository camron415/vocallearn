"use client";

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { GlassButton } from "@/components/Glass";

/** v1-style History/Settings on touch — full overlay, no morph veil. */
export function SimpleSheet({
  open,
  onClose,
  onEscape,
  title,
  titleId,
  cardClassName,
  dim = false,
  plainDone = false,
  onExited,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onEscape?: () => void;
  title: string;
  titleId: string;
  cardClassName?: string;
  dim?: boolean;
  plainDone?: boolean;
  onExited?: () => void;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [present, setPresent] = useState(false);
  const [entered, setEntered] = useState(false);
  const openedAt = useRef(0);
  const onExitedRef = useRef(onExited);
  const pageRef = useRef<HTMLDivElement>(null);
  onExitedRef.current = onExited;
  const drag = useRef<{
    x: number;
    y: number;
    id: number;
    axis: "x" | "y" | null;
  } | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) openedAt.current = Date.now();
  }, [open]);

  const alive = open || (dim && present);

  useLayoutEffect(() => {
    if (!dim) return;
    if (open) {
      setPresent(true);
      let second = 0;
      const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => setEntered(true));
      });
      return () => {
        cancelAnimationFrame(first);
        cancelAnimationFrame(second);
      };
    }
    const page = pageRef.current;
    const dragged =
      !!page &&
      page.style.transform.includes("translateX") &&
      !page.style.transform.includes("(0");
    if (dragged && page) {
      page.style.transition = "transform 220ms cubic-bezier(0.32, 0.72, 0, 1)";
      requestAnimationFrame(() => {
        page.style.transform = "translateX(100%)";
      });
      return;
    }
    if (page) {
      page.style.transition = "";
      page.style.transform = "";
    }
    setEntered(false);
  }, [open, dim]);

  useEffect(() => {
    if (!dim || open || !present) return;
    const page = pageRef.current;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setPresent(false);
      onExitedRef.current?.();
    };
    const timer = window.setTimeout(finish, 260);
    function onEnd(event: TransitionEvent) {
      if (event.target !== page || event.propertyName !== "transform") return;
      finish();
    }
    page?.addEventListener("transitionend", onEnd);
    return () => {
      window.clearTimeout(timer);
      page?.removeEventListener("transitionend", onEnd);
    };
  }, [dim, open, present]);

  useEffect(() => {
    if (!dim || !alive) return;
    document.documentElement.dataset.haloPhoneMenu = "1";
    return () => {
      delete document.documentElement.dataset.haloPhoneMenu;
    };
  }, [dim, alive]);

  useEffect(() => {
    if (!alive) return;
    document.documentElement.dataset.haloSheet = "1";
    return () => {
      // Another sheet may have opened in the same tap (Menu → History).
      // Do not clear the flag out from under it.
      if (document.querySelector(".history-overlay")) return;
      delete document.documentElement.dataset.haloSheet;
    };
  }, [alive]);

  useEffect(() => {
    if (!alive) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (onEscape) onEscape();
      else onClose();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("halo-cove-home", onClose);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("halo-cove-home", onClose);
      document.body.style.overflow = prev;
    };
  }, [alive, onClose, onEscape]);

  if (!mounted) return null;
  if (!dim && !open) return null;
  if (dim && !open && !present) return null;

  function onSheetPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!dim || event.button !== 0) return;
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
      axis: null,
    };
  }

  function onSheetPointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!dim || !start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      start.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (start.axis !== "x") return;
    const page = pageRef.current;
    if (!page) return;
    page.style.transition = "none";
    page.style.transform = `translateX(${Math.max(0, dx)}px)`;
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    drag.current = null;
    const page = pageRef.current;
    if (!dim || !start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const dismiss = start.axis === "x" && dx > 56 && Math.abs(dx) > Math.abs(dy);
    if (page && !dismiss) {
      page.style.transition = "transform 220ms cubic-bezier(0.32, 0.72, 0, 1)";
      page.style.transform = "translateX(0)";
    }
    if (dismiss) onClose();
  }

  return createPortal(
    <div
      className={`history-overlay${dim ? " phone-menu" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onPointerDown={(event) => {
        if (Date.now() - openedAt.current < 480) return;
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={pageRef}
        className={`history-page${dim ? " phone-menu-sheet" : ""}${
          dim && entered ? " is-in" : ""
        }${cardClassName ? ` ${cardClassName}` : ""}`}
        onPointerDown={onSheetPointerDown}
        onPointerMove={onSheetPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="history-page-head">
          <h1 id={titleId} className={`history-page-title${dim || plainDone ? " sr-only" : ""}`}>
            {title}
          </h1>
          {dim ? null : plainDone ? (
            <button type="button" className="phone-menu-done" onClick={onClose}>
              Done
            </button>
          ) : (
            <GlassButton onClick={onClose}>Close</GlassButton>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
