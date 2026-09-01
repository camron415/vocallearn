"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
  children,
}: {
  open: boolean;
  onClose: () => void;
  onEscape?: () => void;
  title: string;
  titleId: string;
  cardClassName?: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const openedAt = useRef(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) openedAt.current = Date.now();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
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
  }, [open, onClose, onEscape]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="history-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onPointerDown={(event) => {
        if (Date.now() - openedAt.current < 480) return;
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`history-page${cardClassName ? ` ${cardClassName}` : ""}`}>
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
