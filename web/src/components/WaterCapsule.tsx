"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useLiquidEnabled, usePaperLook } from "@/components/MotionProvider";
import { paintKeepSurface } from "@/lib/home-style";
import { isQuietHeat, type ChipHeat } from "@/lib/chip-heat";
import {
  createWaterSurface,
  dropPebble,
  registerWater,
  splashWater,
  tumbleWater,
  WATER_FLIGHT,
  waterPresetForHeat,
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
  kind,
  agitated = false,
  onHold,
  still = false,
  heat = "warm",
}: {
  children?: ReactNode;
  phase?: number;
  selected?: boolean;
  className?: string;
  title?: string;
  style?: CSSProperties;
  onClick?: (el: HTMLButtonElement | null) => void;
  kind?: "when" | "where" | "who" | "meaning";
  agitated?: boolean;
  onHold?: (el: HTMLButtonElement | null) => void;
  still?: boolean;
  heat?: ChipHeat;
}) {
  const paper = usePaperLook();
  const keepChip =
    /\b(capsule--keep-album|is-ask-keep|is-kept)\b/.test(className) &&
    !className.includes("capsule--harvest");
  const paperChip =
    paper &&
    (keepChip ||
      className.includes("capsule--choice") ||
      className.includes("home-play-choice") ||
      className.includes("capsule--harvest"));
  const paperChoice = paper && className.includes("capsule--choice");
  const harvestFlyer = className.includes("capsule--harvest");
  const liquid = useLiquidEnabled() && !still && !paperChip && !harvestFlyer;
  const rootRef = useRef<HTMLButtonElement>(null);
  const glassRef = useRef<HTMLSpanElement>(null);
  const shadeRef = useRef<SVGPathElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  const rimRef = useRef<SVGPathElement>(null);
  const dipRef = useRef<SVGPathElement>(null);
  const gradRef = useRef<SVGRadialGradientElement>(null);
  const surfaceRef = useRef<WaterSurface | null>(null);
  const holdTimer = useRef(0);
  const held = useRef(false);
  const [landed, setLanded] = useState(false);
  const settledRef = useRef(false);
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
      preset: agitated ? WATER_FLIGHT : waterPresetForHeat(heat),
      phase: phase * 1.9,
      heat: agitated ? "hot" : heat,
    });
    surfaceRef.current = surface;
    const release = registerWater(surface);
    if (agitated) {
      splashWater(surface);
      tumbleWater(surface, 0);
    }
    const tick = agitated
      ? window.setInterval(() => tumbleWater(surface, performance.now() / 1000), 70)
      : 0;

    return () => {
      if (tick) window.clearInterval(tick);
      release();
      surfaceRef.current = null;
    };
  }, [liquid, phase, agitated, heat]);

  function markSettled() {
    settledRef.current = true;
    rootRef.current?.classList.add("is-settled");
    setLanded(true);
  }

  useEffect(() => {
    const id = window.setTimeout(() => markSettled(), 1600);
    return () => window.clearTimeout(id);
  }, []);

  useLayoutEffect(() => {
    if (!className.includes("is-ask-keep") && !className.includes("is-kept")) return;
    markSettled();
  }, [className, kind]);

  useLayoutEffect(() => {
    function paint() {
      paintKeepSurface(glassRef.current, fillRef.current, kind, className);
    }
    paint();
    window.addEventListener("halo-home-style", paint);
    const watch = new MutationObserver(paint);
    watch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-home-ink", "data-home-skin", "data-halo-theme"],
    });
    return () => {
      window.removeEventListener("halo-home-style", paint);
      watch.disconnect();
    };
  }, [kind, className, liquid]);

  const splash = useCallback(() => {
    if (surfaceRef.current) splashWater(surfaceRef.current);
  }, []);

  function wake(clientX: number, clientY: number) {
    if (isQuietHeat(heat)) return;
    splash();
    if (surfaceRef.current) dropPebble(surfaceRef.current, clientX, clientY);
  }

  function clearHold() {
    window.clearTimeout(holdTimer.current);
  }

  return (
    <button
      ref={rootRef}
      type="button"
      title={title}
      aria-pressed={selected}
      onPointerDown={(event) => {
        held.current = false;
        wake(event.clientX, event.clientY);
        if (!onHold) return;
        clearHold();
        holdTimer.current = window.setTimeout(() => {
          held.current = true;
          markSettled();
          onHold(rootRef.current);
        }, 520);
      }}
      onPointerUp={clearHold}
      onPointerCancel={clearHold}
      onPointerLeave={clearHold}
      onClick={(event) => {
        if (held.current) {
          event.preventDefault();
          held.current = false;
          return;
        }
        onClick?.(rootRef.current);
      }}
      className={`capsule ${liquid || paperChip ? "" : "capsule--still"} ${
        selected ? "capsule--picked" : ""
      } ${kind ? `capsule--kind-${kind}` : ""} ${
        settledRef.current || landed ? "is-settled" : ""
      } ${className}`}
      data-heat={heat}
      style={style}
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        if (!event.animationName.toLowerCase().includes("drop-in")) return;
        markSettled();
      }}
    >
      {liquid ? (
        <svg className="capsule__shade" aria-hidden focusable="false">
          <path
            ref={shadeRef}
            className="capsule__stroke-shade"
            fill="none"
            stroke="rgba(0, 0, 0, 0.12)"
            strokeWidth="5"
          />
        </svg>
      ) : null}
      {paperChoice || harvestFlyer ? null : (
        <span className="capsule__glass" ref={glassRef} aria-hidden />
      )}
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
            className="capsule__stroke-dip"
            fill="none"
            stroke="rgba(44, 51, 60, 0.42)"
            strokeWidth="1.4"
          />
          <path
            ref={rimRef}
            className="capsule__stroke-rim"
            fill="none"
            stroke={`url(#${rimId})`}
            strokeWidth="1.2"
          />
        </svg>
      ) : null}
      {harvestFlyer ? null : (
        <span className="capsule__label">{children}</span>
      )}
    </button>
  );
}
