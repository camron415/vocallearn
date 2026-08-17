"use client";

import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useLiquidEnabled } from "@/components/MotionProvider";
import {
  createWaterSurface,
  registerWater,
  splashWater,
  WATER_CHIP,
  type WaterSurface,
} from "@/lib/water-edge";

export function WaterCapsule({
  children,
  phase = 0,
  selected = false,
  className = "",
  title,
  style,
  onClick,
}: {
  children: ReactNode;
  phase?: number;
  selected?: boolean;
  className?: string;
  title?: string;
  style?: CSSProperties;
  onClick?: (el: HTMLButtonElement | null) => void;
}) {
  const liquid = useLiquidEnabled();
  const rootRef = useRef<HTMLButtonElement>(null);
  const glassRef = useRef<HTMLSpanElement>(null);
  const shadeRef = useRef<SVGPathElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  const rimRef = useRef<SVGPathElement>(null);
  const dipRef = useRef<SVGPathElement>(null);
  const gradRef = useRef<SVGRadialGradientElement>(null);
  const surfaceRef = useRef<WaterSurface | null>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const rimId = `halo-cap-rim-${uid}`;
  const dipId = `halo-cap-dip-${uid}`;

  useLayoutEffect(() => {
    if (!liquid) return;
    const root = rootRef.current;
    const skin = glassRef.current;
    if (!root || !skin) return;

    const surface = createWaterSurface({
      root,
      skin,
      paths: [fillRef.current, shadeRef.current, dipRef.current, rimRef.current],
      grad: gradRef.current,
      preset: WATER_CHIP,
      phase: phase * 1.9,
    });
    surfaceRef.current = surface;
    const release = registerWater(surface);

    return () => {
      release();
      surfaceRef.current = null;
    };
  }, [liquid, phase]);

  const splash = useCallback(() => {
    if (surfaceRef.current) splashWater(surfaceRef.current);
  }, []);

  return (
    <button
      ref={rootRef}
      type="button"
      title={title}
      aria-pressed={selected}
      onClick={() => onClick?.(rootRef.current)}
      onPointerDown={splash}
      className={`capsule ${liquid ? "" : "capsule--still"} ${
        selected ? "capsule--picked" : ""
      } ${className}`}
      style={style}
    >
      {liquid ? (
        <svg className="capsule__shade" aria-hidden focusable="false">
          <path
            ref={shadeRef}
            fill="none"
            stroke="rgba(0, 0, 0, 0.12)"
            strokeWidth="5"
          />
        </svg>
      ) : null}
      <span className="capsule__glass" ref={glassRef} aria-hidden />
      {liquid ? (
        <svg className="capsule__edge" aria-hidden focusable="false">
          <defs>
            <radialGradient
              ref={gradRef}
              id={rimId}
              gradientUnits="userSpaceOnUse"
              r="60"
            >
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.42" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.22" />
            </radialGradient>
            <linearGradient id={dipId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2c333c" stopOpacity="0.32" />
              <stop offset="0.5" stopColor="#2c333c" stopOpacity="0.26" />
              <stop offset="1" stopColor="#2c333c" stopOpacity="0.32" />
            </linearGradient>
          </defs>
          <path ref={fillRef} className="capsule__fill" />
          <path
            ref={dipRef}
            fill="none"
            stroke="rgba(44, 51, 60, 0.42)"
            strokeWidth="1.4"
          />
          <path
            ref={rimRef}
            fill="none"
            stroke={`url(#${rimId})`}
            strokeWidth="1.2"
          />
        </svg>
      ) : null}
      <span className="capsule__label">{children}</span>
    </button>
  );
}
