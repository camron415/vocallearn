import type { ChipKind } from "@/lib/harvest";
import { homeStyleFromDom, keepHexPair } from "@/lib/home-style";

export type HarvestShape = "orb" | "drop" | "pill";
export type HarvestFlight = "burst" | "float" | "rise";
export type HarvestWake = "pebble" | "glow" | "quiet";
export type HarvestDock = "absorb" | "count" | "beads" | "words";

export type HarvestStyle = {
  shape: HarvestShape;
  flight: HarvestFlight;
  keep: HarvestWake;
  dock: HarvestDock;
};

const SHAPES: HarvestShape[] = ["orb", "drop", "pill"];
const FLIGHTS: HarvestFlight[] = ["burst", "float", "rise"];
const WAKES: HarvestWake[] = ["pebble", "glow", "quiet"];
const DOCKS: HarvestDock[] = ["absorb", "count", "beads", "words"];

export const HARVEST_STYLE_DEFAULT: HarvestStyle = {
  shape: "drop",
  flight: "burst",
  keep: "pebble",
  dock: "beads",
};

function wakeFrom(raw: string | null): HarvestWake {
  if (raw === "match") return "glow";
  if (WAKES.includes(raw as HarvestWake)) return raw as HarvestWake;
  return HARVEST_STYLE_DEFAULT.keep;
}

export function parseHarvestStyle(params: {
  get(name: string): string | null;
}): HarvestStyle {
  const shape = params.get("orb");
  const flight = params.get("fly");
  const dock = params.get("dock");
  return {
    shape: SHAPES.includes(shape as HarvestShape)
      ? (shape as HarvestShape)
      : HARVEST_STYLE_DEFAULT.shape,
    flight: FLIGHTS.includes(flight as HarvestFlight)
      ? (flight as HarvestFlight)
      : HARVEST_STYLE_DEFAULT.flight,
    keep: wakeFrom(params.get("keep")),
    dock: DOCKS.includes(dock as HarvestDock)
      ? (dock as HarvestDock)
      : HARVEST_STYLE_DEFAULT.dock,
  };
}

export function harvestStyleFromDom(): HarvestStyle {
  if (typeof document === "undefined") return HARVEST_STYLE_DEFAULT;
  const d = document.documentElement.dataset;
  const fake = {
    get(name: string) {
      if (name === "orb") return d.harvestOrb ?? null;
      if (name === "fly") return d.harvestFly ?? null;
      if (name === "keep") return d.harvestKeep ?? null;
      if (name === "dock") return d.harvestDock ?? null;
      return null;
    },
  };
  return parseHarvestStyle(fake);
}

export function writeHarvestStyle(style: HarvestStyle) {
  if (typeof document === "undefined") return;
  const d = document.documentElement.dataset;
  d.harvestOrb = style.shape;
  d.harvestFly = style.flight;
  d.harvestKeep = style.keep;
  d.harvestDock = style.dock;
}

const KIND_GLOW_FALLBACK: Record<ChipKind, string> = {
  when: "rgba(255, 168, 24, 0.62)",
  where: "rgba(0, 186, 198, 0.58)",
  who: "rgba(236, 78, 140, 0.58)",
  meaning: "rgba(46, 196, 86, 0.58)",
};

function hexToRgba(hex: string, alpha: number) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function kindGlow(kind?: string) {
  const k: ChipKind =
    kind === "when" || kind === "where" || kind === "who" || kind === "meaning"
      ? kind
      : "meaning";
  if (typeof document === "undefined") return KIND_GLOW_FALLBACK[k];
  const dark =
    document.documentElement.getAttribute("data-halo-theme") === "dark";
  return hexToRgba(keepHexPair(homeStyleFromDom().ink, k, dark).lo, 0.58);
}

export const KIND_GLOW: Record<string, string> = KIND_GLOW_FALLBACK;

export const MIXER_HELP = {
  shape: {
    drop: "Round water bead. Default.",
    orb: "Same circle, slightly larger type.",
    pill: "Elongated chip. Usually skip.",
  },
  flight: {
    burst: "Out, then the header pulls it in. Default.",
    float: "Soft lift. Less energy.",
    rise: "Almost straight up.",
  },
  wake: {
    pebble: "Pond ring from the hit, out to both ends.",
    glow: "Pebble plus a colored wash.",
    quiet: "Almost no header reaction.",
  },
  dock: {
    count: "A number in the header. Tap for Learn.",
    beads: "Tiny color dots. No extra water.",
    words: "Skip. Too much type in the header.",
    absorb: "Nothing stays. Wake only.",
  },
} as const;
