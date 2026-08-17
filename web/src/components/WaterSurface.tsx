"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { useLiquidEnabled } from "@/components/MotionProvider";
import {
  createWaterSurface,
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

  const layers = (
    <>
      <span className="water__ambient" aria-hidden />
      {live ? (
        <svg className="water__shade" aria-hidden focusable="false">
          <path
            ref={shadeRef}
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
            fill="none"
            stroke={`url(#${uid}dip)`}
            strokeWidth={tone.dipWidth}
          />
          <path
            ref={rimRef}
            fill="none"
            stroke={`url(#${uid}rim)`}
            strokeWidth={tone.rimWidth}
          />
          <path
            ref={specRef}
            fill="none"
            stroke={`url(#${uid}spec)`}
            strokeWidth={tone.specWidth}
          />
        </svg>
      ) : null}
    </>
  );

  return { rootRef, layers, splash };
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
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  elementRef?: RefObject<HTMLDivElement | null>;
  listening?: boolean;
  variant?: "pane" | "bar" | "field";
  as?: "div" | "header";
}) {
  const live = useLiquidEnabled();
  const tone = TONES[variant];
  const { rootRef, layers, splash } = useWaterSkin(tone, live);

  useEffect(() => {
    if (!listening || !live) return;
    splash();
    const id = window.setInterval(splash, 1100);
    return () => window.clearInterval(id);
  }, [listening, live, splash]);

  return (
    <Tag
      ref={(el) => {
        rootRef.current = el;
        if (elementRef && Tag === "div") elementRef.current = el;
      }}
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
  const live = useLiquidEnabled();
  const { rootRef, layers, splash } = useWaterSkin(TONES.action, live);

  return (
    <button
      ref={(el) => {
        rootRef.current = el;
      }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={splash}
      className={`water water--action${live ? "" : " water--still"} ${className}`}
    >
      {layers}
      <span className="water__content">{children}</span>
    </button>
  );
}
