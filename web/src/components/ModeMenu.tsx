"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { GlassButton } from "@/components/Glass";

const MODES = [
  { id: "ask", label: "Ask", href: "/ask", soon: false },
  { id: "recipes", label: "Recipes", href: "/recipes", soon: false },
  { id: "learn", label: "Learn", href: "", soon: true },
] as const;

export function ModeMenu({ demo = false }: { demo?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const current =
    pathname.startsWith("/recipes")
      ? "Recipes"
      : pathname.startsWith("/ask")
        ? "Ask"
        : "Ask";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const menu = open ? (
    <div
      className="mode-overlay"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="mode-sheet" role="menu" aria-label="Modes">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            role="menuitem"
            className={`history-item${current === mode.label ? " is-current" : ""}`}
            disabled={mode.soon}
            onClick={() => {
              if (mode.soon) return;
              setOpen(false);
              if (demo) return;
              router.push(mode.href);
            }}
          >
            {mode.label}
            {mode.soon ? <span className="mode-soon">Coming soon</span> : null}
          </button>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div className="history-wrap">
      <GlassButton title="Switch mode" onClick={() => setOpen((v) => !v)}>
        {current}
      </GlassButton>
      {mounted && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
