"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { useLiquidEnabled } from "@/components/MotionProvider";
import { kindGlow, harvestStyleFromDom } from "@/lib/harvest-style";
import { applyHaloBoot } from "@/lib/halo-boot";
import {
  createWaterSurface,
  dropPebble,
  registerWater,
  splashWater,
  WATER_ACTION,
  WATER_BAR,
  WATER_FIELD,
  WATER_PANE,
  type WaterPreset,
  type WaterSurface as Surface,
} from "@/lib/water-edge";

/* ---------------------------------------------------------------------------
   The recents' water edge, on the big surfaces.

   The skin carries the material and is clipped to the live outline; the shade
   is a blurred copy of that outline, so nothing ever darkens the glass itself.
   Strokes ride the same path: a dip underneath, a rim all round, and a
   specular arc that gathers where the pointer touches.
   --------------------------------------------------------------------------- */

type Stop = { at: number; color: string; opacity: number };

type Tone = {
  preset: WaterPreset;
  shade: { color: string; width: number };
  dipWidth: number;
  rimWidth: number;
  specWidth: number;
  dip: Stop[];
  rim: Stop[];
  spec: Stop[];
};

const PANE: Tone = {
  preset: WATER_PANE,
  shade: { color: "rgba(0, 0, 0, 0.12)", width: 8 },
  dipWidth: 1.35,
  rimWidth: 1.35,
  specWidth: 1.4,
  dip: [
    { at: 0, color: "#2c333c", opacity: 0.42 },
    { at: 0.5, color: "#2c333c", opacity: 0.36 },
    { at: 1, color: "#2c333c", opacity: 0.42 },
  ],
  // white sheen on top of the slate hairline — the wet highlight
  rim: [
    { at: 0, color: "#ffffff", opacity: 0.55 },
    { at: 0.4, color: "#ffffff", opacity: 0.12 },
    { at: 1, color: "#ffffff", opacity: 0 },
  ],
  spec: [
    { at: 0, color: "#ffffff", opacity: 0.9 },
    { at: 0.55, color: "#ffffff", opacity: 0.34 },
    { at: 1, color: "#ffffff", opacity: 0 },
  ],
};

const ACTION: Tone = {
  preset: WATER_ACTION,
  shade: { color: "rgba(11, 26, 40, 0.42)", width: 7 },
  dipWidth: 1.2,
  rimWidth: 1,
  specWidth: 1.2,
  dip: [
    { at: 0, color: "#0b1a28", opacity: 0 },
    { at: 0.6, color: "#0b1a28", opacity: 0.2 },
    { at: 1, color: "#0b1a28", opacity: 0.55 },
  ],
  rim: [
    { at: 0, color: "#ffffff", opacity: 0.42 },
    { at: 0.4, color: "#ffffff", opacity: 0.12 },
    { at: 1, color: "#9fc6dd", opacity: 0.18 },
  ],
  spec: [
    { at: 0, color: "#eaf6ff", opacity: 0.85 },
    { at: 0.6, color: "#cfe8f7", opacity: 0.26 },
    { at: 1, color: "#ffffff", opacity: 0 },
  ],
};

const BAR: Tone = { ...PANE, preset: WATER_BAR };
const FIELD: Tone = { ...PANE, preset: WATER_FIELD };

const TONES = { pane: PANE, action: ACTION, bar: BAR, field: FIELD };

/** Ours water mounts only after we read the live skin. Paper never gets a
 *  water pane — Safari 26 glass on .water--pane .water__skin samples the page
 *  and CSS cannot paint over it. Default false so SSR/hydrate is a plain div.
 *  Trust URL/cookie/mixer before the SSR `ours` attribute, or a refresh
 *  remounts glass and Safari cannot paint over it. */

export function useOursWet() {
  const [wet, setWet] = useState(false);
  useLayoutEffect(() => {
    applyHaloBoot();
    function read() {
      const next =
        document.documentElement.getAttribute("data-home-skin") !== "paper";
      setWet((prev) => (prev === next ? prev : next));
    }
    read();
    const watch = new MutationObserver(read);
    watch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-home-skin"],
    });
    return () => watch.disconnect();
  }, []);
  return wet;
}

function stops(list: Stop[]) {
  return list.map((s) => (
    <stop
      key={s.at}
      offset={s.at}
      stopColor={s.color}
      stopOpacity={s.opacity}
    />
  ));
}

function useWaterSkin(tone: Tone, live: boolean) {
  const rootRef = useRef<HTMLElement | null>(null);
  const skinRef = useRef<HTMLSpanElement | null>(null);
  const gradRef = useRef<SVGRadialGradientElement | null>(null);
  const shadeRef = useRef<SVGPathElement | null>(null);
  const dipRef = useRef<SVGPathElement | null>(null);
  const rimRef = useRef<SVGPathElement | null>(null);
  const specRef = useRef<SVGPathElement | null>(null);
  const surfaceRef = useRef<Surface | null>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  useLayoutEffect(() => {
    if (!live) return;
    if (document.documentElement.getAttribute("data-home-skin") === "paper") {
      return;
    }
    const root = rootRef.current;
    const skin = skinRef.current;
    if (!root || !skin) return;

    const surface = createWaterSurface({
      root,
      skin,
      paths: [shadeRef.current, dipRef.current, rimRef.current, specRef.current],
      grad: gradRef.current,
      preset: tone.preset,
    });
    surfaceRef.current = surface;
    const release = registerWater(surface);

    return () => {
      release();
      surfaceRef.current = null;
    };
  }, [live, tone]);

  const splash = useCallback(() => {
    if (surfaceRef.current) splashWater(surfaceRef.current);
  }, []);

  const pebble = useCallback((clientX: number, clientY: number) => {
    if (surfaceRef.current) dropPebble(surfaceRef.current, clientX, clientY);
  }, []);

  const layers = (
    <>
      <span className="water__ambient" aria-hidden />
      {live ? (
        <svg className="water__shade" aria-hidden focusable="false">
          <path
            ref={shadeRef}
            className="water__stroke-shade"
            fill="none"
            stroke={tone.shade.color}
            strokeWidth={tone.shade.width}
          />
        </svg>
      ) : null}
      <span className="water__skin" ref={skinRef} aria-hidden />
      {live ? (
        <svg className="water__edge" aria-hidden focusable="false">
          <defs>
            <linearGradient id={`${uid}dip`} x1="0" y1="0" x2="0" y2="1">
              {stops(tone.dip)}
            </linearGradient>
            <linearGradient id={`${uid}rim`} x1="0.05" y1="0" x2="0.5" y2="1">
              {stops(tone.rim)}
            </linearGradient>
            <radialGradient
              ref={gradRef}
              id={`${uid}spec`}
              gradientUnits="userSpaceOnUse"
              r="120"
            >
              {stops(tone.spec)}
            </radialGradient>
          </defs>
          <path
            ref={dipRef}
            className="water__stroke-dip"
            fill="none"
            stroke={`url(#${uid}dip)`}
            strokeWidth={tone.dipWidth}
          />
          <path
            ref={rimRef}
            className="water__stroke-rim"
            fill="none"
            stroke={`url(#${uid}rim)`}
            strokeWidth={tone.rimWidth}
          />
          <path
            ref={specRef}
            className="water__stroke-spec"
            fill="none"
            stroke={`url(#${uid}spec)`}
            strokeWidth={tone.specWidth}
          />
        </svg>
      ) : null}
    </>
  );

  return { rootRef, layers, splash, pebble };
}

/** The hero composer, which is also the chat dock. Glass, wet at the edge. */
export function WaterPane({
  children,
  className = "",
  style,
  elementRef,
  listening = false,
  variant = "pane",
  as: Tag = "div",
  still = false,
  kind,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  elementRef?: RefObject<HTMLDivElement | null>;
  listening?: boolean;
  variant?: "pane" | "bar" | "field";
  as?: "div" | "header";
  /** Auth cards: always the still stadium, so the border stays readable. */
  still?: boolean;
  kind?: string;
}) {
  const ours = useOursWet();
  const live = useLiquidEnabled() && !still && ours;
  const tone = TONES[variant];
  const { rootRef, layers, splash, pebble } = useWaterSkin(tone, live);

  useEffect(() => {
    if (!listening || !live) return;
    splash();
    const id = window.setInterval(splash, 1100);
    return () => window.clearInterval(id);
  }, [listening, live, splash]);

  useEffect(() => {
    if (variant !== "bar") return;
    let clear = 0;
    function hit(event: Event) {
      const chip = (
        event as CustomEvent<{ kind?: string; x?: number; y?: number }>
      ).detail;
      const root = rootRef.current;
      if (!root) return;
      const box = root.getBoundingClientRect();
      const x = chip?.x ?? box.left + box.width * 0.58;
      const y = chip?.y ?? box.top + box.height * 0.5;
      const wake = harvestStyleFromDom().keep;
      if (wake !== "quiet") pebble(x, y);
      else splash();
      root.style.setProperty(
        "--keep-hit",
        kindGlow(chip?.kind || "meaning")
      );
      root.style.setProperty(
        "--keep-hit-x",
        `${Math.max(8, Math.min(92, ((x - box.left) / box.width) * 100))}%`
      );
      root.classList.toggle("is-keep-glow", wake === "glow");
      root.classList.add("is-keep-hit");
      window.clearTimeout(clear);
      clear = window.setTimeout(() => {
        root.classList.remove("is-keep-hit", "is-keep-glow");
      }, wake === "quiet" ? 420 : 860);
    }
    window.addEventListener("halo-keep-land", hit);
    return () => {
      window.removeEventListener("halo-keep-land", hit);
      window.clearTimeout(clear);
    };
  }, [variant, splash, pebble, rootRef]);

  return (
    <Tag
      ref={(el) => {
        rootRef.current = el;
        if (elementRef && Tag === "div") elementRef.current = el;
      }}
      data-keep-pond={variant === "bar" ? "true" : undefined}
      data-kind={kind || undefined}
      className={`water water--pane water--${variant}${live ? "" : " water--still"}${
        listening ? " is-listening" : ""
      } ${className}`}
      style={style}
      onPointerDown={splash}
    >
      {layers}
      <div className="water__content">{children}</div>
    </Tag>
  );
}

/** Home composer and chat dock. Paper is a plain stadium; Ours is WaterPane. */
export function ComposeStadium({
  children,
  className,
  style,
  elementRef,
  listening = false,
  kind,
}: {
  children: ReactNode;
  className: string;
  style?: CSSProperties;
  elementRef?: RefObject<HTMLDivElement | null>;
  listening?: boolean;
  kind?: string;
}) {
  const wet = useOursWet();
  if (!wet) {
    return (
      <div
        ref={elementRef}
        className={`${className} is-paper-dry${listening ? " is-listening" : ""}`.trim()}
        style={style}
        data-kind={kind || undefined}
      >
        {children}
      </div>
    );
  }
  return (
    <WaterPane
      className={className}
      style={style}
      elementRef={elementRef}
      listening={listening}
      kind={kind}
    >
      {children}
    </WaterPane>
  );
}

/** Home and chat header. Paper is a plain bar; Ours is WaterPane. */
export function ChromeBar({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const wet = useOursWet();
  if (!wet) {
    return (
      <header className={`${className} is-paper-dry`} data-keep-pond="true">
        <div className="water__content">{children}</div>
      </header>
    );
  }
  return (
    <WaterPane as="header" variant="bar" className={className}>
      {children}
    </WaterPane>
  );
}

/** Ask / Send. Same water, quieter, over ink instead of glass. */
export function WaterAction({
  children,
  disabled,
  type = "submit",
  onClick,
  className = "",
}: {
  children: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
}) {
  const wet = useOursWet();
  const live = useLiquidEnabled() && wet;
  const { rootRef, layers, splash } = useWaterSkin(TONES.action, live);

  return (
    <button
      ref={(el) => {
        rootRef.current = el;
      }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={wet ? splash : undefined}
      className={
        wet
          ? `water water--action${live ? "" : " water--still"} ${className}`
          : `${className} is-paper-dry`
      }
    >
      {wet ? layers : null}
      <span className="water__content">{children}</span>
    </button>
  );
}
