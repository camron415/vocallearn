import type { ChipKind } from "@/lib/harvest";

export type HomePalette = "glass" | "match" | "wash";
export type HomeLamp = "off" | "on";
export type HomeInk = "halo" | "citrus" | "gummy" | "dusk";
export type HomeSkin = "ours" | "paper";

const MIXER_KEY = "halo-home-mixer";
const MIXER_REV = 8;

export type HomeStyle = {
  palette: HomePalette;
  lamp: HomeLamp;
  ink: HomeInk;
  /** Ours = wet candy. Paper = xhulia chrome on Halo. */
  skin: HomeSkin;
  /** 0 = muted candy, 100 = brightest. */
  lift: number;
  /** 0 = siblings may sit nearer, 100 = extra gap so same-Ask facts scatter. */
  cluster: number;
  /** 0 = left/right gutters, 100 = orbit the greeting. */
  scatter: number;
  /** How many Keep facts to show on Home (1–16). Default 12. */
  keepCount: number;
};

const PALETTES: HomePalette[] = ["glass", "match", "wash"];
const LAMPS: HomeLamp[] = ["off", "on"];
const INKS: HomeInk[] = ["halo", "citrus", "gummy", "dusk"];
const SKINS: HomeSkin[] = ["ours", "paper"];

export const HOME_STYLE_DEFAULT: HomeStyle = {
  palette: "match",
  lamp: "off",
  ink: "citrus",
  skin: "ours",
  lift: 0,
  cluster: 42,
  scatter: 88,
  keepCount: 12,
};

function clampPct(raw: string | null, fallback: number) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function clampKeepCount(raw: string | number | null | undefined, fallback = 12) {
  const n = typeof raw === "number" ? raw : Number(raw);
  /* Missing mixer attr is null → Number(null) is 0. That used to clamp to 1
     and show a single Home seat on live /ask. */
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.max(1, Math.min(16, Math.round(n)));
}

export function parseHomeStyle(params: {
  get(name: string): string | null;
}): HomeStyle {
  const palette = params.get("tone");
  const lamp = params.get("lamp");
  const ink = params.get("ink");
  const skin = params.get("look");
  return {
    palette: PALETTES.includes(palette as HomePalette)
      ? (palette as HomePalette)
      : HOME_STYLE_DEFAULT.palette,
    lamp: LAMPS.includes(lamp as HomeLamp)
      ? (lamp as HomeLamp)
      : HOME_STYLE_DEFAULT.lamp,
    ink: INKS.includes(ink as HomeInk) ? (ink as HomeInk) : HOME_STYLE_DEFAULT.ink,
    skin: SKINS.includes(skin as HomeSkin)
      ? (skin as HomeSkin)
      : HOME_STYLE_DEFAULT.skin,
    lift: clampPct(params.get("lift"), HOME_STYLE_DEFAULT.lift),
    cluster: clampPct(params.get("clump"), HOME_STYLE_DEFAULT.cluster),
    scatter: clampPct(params.get("spread"), HOME_STYLE_DEFAULT.scatter),
    keepCount: clampKeepCount(params.get("chips"), HOME_STYLE_DEFAULT.keepCount),
  };
}

export function homeStyleFromDom(): HomeStyle {
  if (typeof document === "undefined") return HOME_STYLE_DEFAULT;
  const d = document.documentElement.dataset;
  const fake = {
    get(name: string) {
      if (name === "tone") return d.homeTone ?? null;
      if (name === "lamp") return d.homeLamp ?? null;
      if (name === "ink") return d.homeInk ?? null;
      if (name === "look") return d.homeSkin ?? null;
      if (name === "lift") return d.homeLift ?? null;
      if (name === "clump") return d.homeClump ?? null;
      if (name === "spread") return d.homeSpread ?? null;
      if (name === "chips") return d.homeChips ?? null;
      return null;
    },
  };
  return parseHomeStyle(fake);
}

export function writeHomeStyle(style: HomeStyle) {
  if (typeof document === "undefined") return;
  const d = document.documentElement.dataset;
  d.homeTone = style.palette;
  d.homeLamp = style.lamp;
  d.homeInk = style.ink;
  if (d.homeSkin !== style.skin) d.homeSkin = style.skin;
  d.homeLift = String(style.lift);
  d.homeClump = String(style.cluster);
  d.homeSpread = String(style.scatter);
  d.homeChips = String(style.keepCount);
  document.documentElement.style.setProperty("--home-lift", String(style.lift));
  document.documentElement.style.setProperty(
    "--keep-frost",
    String(((100 - style.lift) * 0.26 + 20) / 100)
  );
  const raw = JSON.stringify({ ...style, rev: MIXER_REV });
  try {
    window.sessionStorage.setItem(MIXER_KEY, raw);
  } catch {
    /* private browsing */
  }
  try {
    window.localStorage.setItem(MIXER_KEY, raw);
  } catch {
    /* private browsing */
  }
  try {
    document.cookie = `halo-preview-skin=${style.skin}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    /* cookie blocked */
  }
  window.dispatchEvent(new CustomEvent("halo-home-style", { detail: style }));
}

function mixerBlob(): (Partial<HomeStyle> & { rev?: number }) | null {
  if (typeof window === "undefined") return null;
  for (const store of [window.sessionStorage, window.localStorage]) {
    try {
      const raw = store.getItem(MIXER_KEY);
      if (!raw) continue;
      return JSON.parse(raw) as Partial<HomeStyle> & { rev?: number };
    } catch {
      /* ignore bad JSON */
    }
  }
  return null;
}

export function readStoredHomeStyle(): HomeStyle {
  if (typeof window === "undefined") return HOME_STYLE_DEFAULT;
  try {
    const parsed = mixerBlob();
    if (!parsed) return HOME_STYLE_DEFAULT;
    const scatter =
      parsed.rev == null || parsed.rev < MIXER_REV
        ? HOME_STYLE_DEFAULT.scatter
        : parsed.scatter;
    const cluster =
      parsed.rev == null || parsed.rev < MIXER_REV
        ? HOME_STYLE_DEFAULT.cluster
        : parsed.cluster;
    const keepCount =
      parsed.rev == null || parsed.rev < MIXER_REV
        ? HOME_STYLE_DEFAULT.keepCount
        : clampKeepCount(parsed.keepCount, HOME_STYLE_DEFAULT.keepCount);
    return parseHomeStyle({
      get(name) {
        if (name === "tone") return parsed.palette ?? null;
        if (name === "lamp") return parsed.lamp ?? null;
        if (name === "ink") return parsed.ink ?? null;
        if (name === "look") return parsed.skin ?? null;
        if (name === "lift")
          return parsed.lift == null ? null : String(parsed.lift);
        if (name === "clump")
          return cluster == null ? null : String(cluster);
        if (name === "spread")
          return scatter == null ? null : String(scatter);
        if (name === "chips") return String(keepCount);
        return null;
      },
    });
  } catch {
    return HOME_STYLE_DEFAULT;
  }
}

export const HOME_MIXER_HELP = {
  palette: {
    glass: "Pale kind color, wet glass. The old Home look.",
    match: "Candy fill. Same role as harvest highlights.",
    wash: "Even lighter. Kind is a tint, not a fill.",
  },
  lamp: {
    off: "No inner hotspot. Same as dark mode.",
    on: "Moving specular blob inside the chip.",
  },
  ink: {
    halo: "Current beads. Amber, teal, violet, mint.",
    citrus: "Mango, lagoon, raspberry, leaf. Punchier, not Google.",
    gummy: "High-chroma candy. Gold, aqua, orchid, lime.",
    dusk: "Jewel tones. Apricot, sky, iris, tide.",
  },
  skin: {
    ours: "Wet candy, water rim, stone header. What we have built.",
    paper: "Flat pastels. No liquid, no rims, ghost nav.",
  },
} as const;

/** Edge packing (scatter 0). */
export const HOME_GUTTER = {
  clusters: [
    { top: 8, x: 0.94 },
    { top: 16, x: -0.98 },
    { top: 58, x: -1.02 },
    { top: 76, x: 0.92 },
  ],
  asks: [
    { top: 38, x: -1.0 },
    { top: 16, x: 0.94 },
    { top: 86, x: -1.02 },
    { top: 92, x: 0.92 },
  ],
} as const;

/** Orbit the greeting (scatter 100). Asks stay off cluster seats. */
export const HOME_FIELD = {
  clusters: [
    { top: 14, x: 0.68 },
    { top: 8, x: -0.2 },
    { top: 38, x: -0.32 },
    { top: 30, x: 0.24 },
  ],
  asks: [
    { top: 10, x: 0.9 },
    { top: 42, x: -0.88 },
    { top: 68, x: 0.78 },
    { top: 24, x: -0.55 },
  ],
} as const;

export function mixHomePoint(
  a: { top: number; x: number },
  b: { top: number; x: number },
  t: number
) {
  const k = Math.max(0, Math.min(1, t));
  return {
    top: a.top + (b.top - a.top) * k,
    x: a.x + (b.x - a.x) * k,
  };
}

/** Fallback seats before pack. Four flanks, not two gutters. */
export function keepSeat(index: number, scatter: number) {
  const cols = 4;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const edge = [-0.84, -0.4, 0.4, 0.84];
  const filled = [-0.62, -0.22, 0.22, 0.62];
  const x = edge[col] + (filled[col] - edge[col]) * scatter;
  const top = 8 + row * 16;
  return { top, x };
}

/** Literal hex only. Safari drops rgb(var(--bead) / a) on a cold parse. */
export const KEEP_HEX: Record<
  HomeInk,
  Record<ChipKind, { hi: string; lo: string }>
> = {
  citrus: {
    when: { hi: "#ffc840", lo: "#ffa818" },
    where: { hi: "#40dce0", lo: "#00bac6" },
    who: { hi: "#ff7cac", lo: "#ec4e8c" },
    meaning: { hi: "#60e07c", lo: "#2ec456" },
  },
  halo: {
    when: { hi: "#c4a25a", lo: "#a88840" },
    where: { hi: "#6a9ea8", lo: "#4e7e88" },
    who: { hi: "#c496a4", lo: "#a67888" },
    meaning: { hi: "#7aa884", lo: "#5e8a68" },
  },
  gummy: {
    when: { hi: "#ffd656", lo: "#ffba28" },
    where: { hi: "#48ecf4", lo: "#00d0e4" },
    who: { hi: "#e894ff", lo: "#d260ff" },
    meaning: { hi: "#5cf094", lo: "#24d676" },
  },
  dusk: {
    when: { hi: "#ffba62", lo: "#ff9838" },
    where: { hi: "#6ec4f6", lo: "#38a4e6" },
    who: { hi: "#c48cff", lo: "#a85cff" },
    meaning: { hi: "#4ed6b0", lo: "#1cba96" },
  },
};

/** Halo only. Light needs more chroma/depth so chips don’t wash out on white. */
export const KEEP_HEX_LIGHT: Partial<
  Record<HomeInk, Record<ChipKind, { hi: string; lo: string }>>
> = {
  halo: {
    when: { hi: "#ffe07a", lo: "#f5c844" },
    where: { hi: "#6ae0e8", lo: "#3cd0d8" },
    who: { hi: "#ffa8bc", lo: "#f8789c" },
    meaning: { hi: "#9eeca8", lo: "#78dc88" },
  },
};

/** Xhulia paper stickers. Same fills in light and dark. Softer yellow/mint. */
export const PAPER_HEX: Record<ChipKind, { hi: string; lo: string }> = {
  when: { hi: "#ffd978", lo: "#ffd978" },
  where: { hi: "#a3d9ff", lo: "#a3d9ff" },
  who: { hi: "#fbcfe8", lo: "#fbcfe8" },
  meaning: { hi: "#c5f3d4", lo: "#c5f3d4" },
};

export function keepHexPair(
  ink: HomeInk,
  kind: ChipKind,
  dark: boolean
) {
  if (
    typeof document !== "undefined" &&
    document.documentElement.dataset.homeSkin === "paper"
  ) {
    return PAPER_HEX[kind];
  }
  const light = !dark ? KEEP_HEX_LIGHT[ink] : undefined;
  return (light ?? KEEP_HEX[ink])[kind];
}

export function isKeepCapsule(className: string) {
  return /\b(capsule--keep-album|is-ask-keep|is-kept)\b/.test(className);
}

export function paintKeepSurface(
  glass: HTMLElement | null,
  fill: SVGPathElement | null,
  kind: ChipKind | undefined,
  className: string
) {
  if (!glass) return;
  if (!kind || !isKeepCapsule(className)) {
    glass.style.removeProperty("background");
    glass.style.removeProperty("backdrop-filter");
    glass.style.removeProperty("-webkit-backdrop-filter");
    fill?.style.removeProperty("fill");
    return;
  }
  const d = document.documentElement.dataset;
  const ink = INKS.includes(d.homeInk as HomeInk)
    ? (d.homeInk as HomeInk)
    : "citrus";
  const dark = document.documentElement.getAttribute("data-halo-theme") === "dark";
  const pair = keepHexPair(ink, kind, dark);
  const paper = d.homeSkin === "paper";
  const wash = !paper && !dark && !KEEP_HEX_LIGHT[ink];
  const candy =
    pair.hi === pair.lo
      ? pair.hi
      : `linear-gradient(170deg, ${pair.hi}, ${pair.lo})`;
  const bg =
    dark || !wash
      ? candy
      : `linear-gradient(165deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08)), ${candy}`;
  glass.style.setProperty("background", bg, "important");
  glass.style.setProperty("backdrop-filter", "none", "important");
  glass.style.setProperty("-webkit-backdrop-filter", "none", "important");
  fill?.style.setProperty("fill", dark ? pair.lo : pair.hi, "important");
}
