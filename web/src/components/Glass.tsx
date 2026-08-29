"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { useEffectiveMotion } from "@/components/MotionProvider";

export type GlassVariant = "panel" | "bar" | "pill";

const REST_X = 50;
const REST_Y = 0;

export function glassClass(
  variant: GlassVariant = "panel",
  lit = false,
  className = ""
) {
  return [
    "glass",
    `glass--${variant}`,
    lit ? "glass--lit" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Specular highlight that travels to the contact point and lags slightly, so
 * light feels heavy instead of snapping. Writes CSS variables directly — no
 * React state on pointermove.
 */
export function useSpecular<T extends HTMLElement>(enabled: boolean) {
  const own = useRef<T | null>(null);
  const state = useRef({ x: REST_X, y: REST_Y, tx: REST_X, ty: REST_Y, raf: 0 });
  const start = useRef(() => {});

  useEffect(() => {
    const s = state.current;
    const tick = () => {
      s.raf = 0;
      const el = own.current;
      if (!el) return;

      s.x += (s.tx - s.x) * 0.18;
      s.y += (s.ty - s.y) * 0.18;
      el.style.setProperty("--spec-x", `${s.x.toFixed(2)}%`);
      el.style.setProperty("--spec-y", `${s.y.toFixed(2)}%`);

      if (Math.abs(s.tx - s.x) > 0.15 || Math.abs(s.ty - s.y) > 0.15) {
        s.raf = requestAnimationFrame(tick);
      }
    };

    start.current = () => {
      if (!s.raf) s.raf = requestAnimationFrame(tick);
    };

    return () => {
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<T>) => {
      if (!enabled) return;
      const el = event.currentTarget;
      own.current = el;
      const rect = el.getBoundingClientRect();
      state.current.tx = ((event.clientX - rect.left) / rect.width) * 100;
      state.current.ty = ((event.clientY - rect.top) / rect.height) * 100;
      start.current();
    },
    [enabled]
  );

  const onPointerLeave = useCallback((event: ReactPointerEvent<T>) => {
    own.current = event.currentTarget;
    state.current.tx = REST_X;
    state.current.ty = REST_Y;
    start.current();
  }, []);

  return { onPointerMove, onPointerLeave };
}

type GlassProps = {
  children: ReactNode;
  className?: string;
  variant?: GlassVariant;
  lit?: boolean;
  as?: "div" | "header" | "section" | "aside";
  style?: CSSProperties;
  elementRef?: RefObject<HTMLDivElement | null>;
};

export function Glass({
  children,
  className = "",
  variant = "panel",
  lit = false,
  as: Tag = "div",
  style,
  elementRef,
}: GlassProps) {
  const full = useEffectiveMotion() === "full";
  const { onPointerMove, onPointerLeave } = useSpecular<HTMLDivElement>(full);

  return (
    <Tag
      ref={elementRef}
      className={glassClass(variant, lit, className)}
      style={style}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </Tag>
  );
}

/** Kept for callers that only need a plain surface. */
export function GlassPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Glass className={className}>{children}</Glass>;
}

export function GlassButton({
  children,
  onClick,
  className = "",
  title,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  title?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`stone-btn ${className}`}
    >
      {children}
    </button>
  );
}

const THINKING_LINES = [
  "Thinking…",
  "Checking details…",
  "Putting it together…",
];

export function ThinkingDots({
  label,
  phrases = false,
}: {
  label?: string;
  phrases?: boolean;
}) {
  const soft = useEffectiveMotion() === "reduced";
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (soft || !phrases) return;
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % THINKING_LINES.length);
    }, 1700);
    return () => window.clearInterval(id);
  }, [soft, phrases]);

  const caption =
    label || (phrases ? (soft ? "Thinking…" : THINKING_LINES[lineIndex]) : null);

  return (
    <div
      className="thinking-row"
      aria-live="polite"
      aria-label={caption || "Working"}
    >
      <div className="thinking-dots" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      {caption ? <span className="thinking-label">{caption}</span> : null}
    </div>
  );
}
