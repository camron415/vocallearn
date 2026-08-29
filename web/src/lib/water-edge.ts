/* ---------------------------------------------------------------------------
   Water edge.

   One engine for every wet surface: the recent capsules, the composer, the
   Ask/Send button. The silhouette is a rounded rectangle (a stadium when the
   radius is half the height) and its centre never moves. All of the liquid
   lives in the last few pixels of the outline: the edge leans toward the
   pointer like a meniscus, inflates a hair, lights up at the contact point,
   and when the pointer leaves the surface springs past rest once — the way a
   drop settles after you take some water away.

   Surfaces share a single pointer listener and a single frame loop.
   --------------------------------------------------------------------------- */

import { isQuietHeat, type ChipHeat } from "@/lib/chip-heat";

export type WaterPreset = {
  /** px of headroom kept around the resting shape, so the edge has somewhere to go */
  inset: number;
  /** fixed outline sample count; 0 samples by arc length instead */
  samples: number;
  /** px between samples when `samples` is 0 */
  spacing: number;
  /** corner radius; null = stadium (radius is half the height) */
  radius: number | null;
  /** px from the edge where the surface starts to notice the pointer */
  reach: number;
  /** px spread of the meniscus crest along the outline */
  sigma: number;
  /** px the edge can lean toward the pointer */
  meniscus: number;
  /** px of uniform swell at full attention */
  inflate: number;
  /** px idle ripple */
  breath: number;
  /** px band inside the edge over which the lean becomes an all-round swell */
  insideBand: number;
  springK: number;
  dampRatio: number;
  tapGain: number;
  tapKick: number;
  /** px the edge may sink inward */
  pushIn: number;
  /** px kept between the furthest push and the element box */
  headroom: number;
  glowGain: number;
  /** resting height fraction of the specular highlight */
  specRestY: number;
  specEase: number;
  gradScale: number;
  gradMin: number;
  /** Catmull-Rom divisor; 6 is the chip look. Higher = tighter, less overshoot. */
  curve: number;
  /** 4th-harmonic idle ripple. On long stadiums this pinches the shoulders. */
  wrinkle: number;
};

const BASE: WaterPreset = {
  inset: 9,
  samples: 0,
  spacing: 13,
  radius: null,
  reach: 96,
  sigma: 42,
  meniscus: 6,
  inflate: 1,
  breath: 0.5,
  insideBand: 14,
  springK: 210,
  dampRatio: 0.42,
  tapGain: 1.6,
  tapKick: 9,
  pushIn: 2.6,
  headroom: 1.6,
  glowGain: 1,
  specRestY: 0.3,
  specEase: 0.2,
  gradScale: 0.62,
  gradMin: 28,
  curve: 6,
  wrinkle: 0.22,
};

/** Recent chips. Longer pills need denser samples and no 4-lobe wrinkle,
 *  or the idle flow pinches in right before each end-cap. */
export const WATER_CHIP: WaterPreset = {
  ...BASE,
  samples: 0,
  spacing: 7,
  curve: 12,
  breath: 0,
  wrinkle: 0,
  meniscus: 3.6,
};

/** Due: no idle boil — cursor lean and tap only. Fill stays unclipped. */
export const WATER_CHIP_HOT: WaterPreset = {
  ...WATER_CHIP,
  inset: 0,
  headroom: 0,
  breath: 0,
  wrinkle: 0,
  meniscus: 9.4,
  inflate: 2.6,
  reach: 160,
  tapGain: 2.6,
  tapKick: 16,
  springK: 124,
  dampRatio: 0.26,
  sigma: 28,
  glowGain: 1.35,
};

/** Due soon: same stillness at rest, milder cursor lean. */
export const WATER_CHIP_WARM: WaterPreset = {
  ...WATER_CHIP,
  inset: 0,
  headroom: 0,
  breath: 0,
  wrinkle: 0,
  meniscus: 5.2,
  inflate: 1.1,
  reach: 96,
  tapGain: 1.5,
  tapKick: 9,
  glowGain: 0.72,
};

/** Rest / just-harvested: silhouette stays, no idle, no cursor lean. */
export const WATER_CHIP_QUIET: WaterPreset = {
  ...WATER_CHIP,
  inset: 0,
  headroom: 0,
  breath: 0,
  wrinkle: 0,
  meniscus: 0,
  inflate: 0,
  reach: 0,
  tapGain: 0,
  tapKick: 0,
  glowGain: 0.12,
};

/** Harvest flight: the drop is being yanked, so the edge keeps sloshing. */
export const WATER_FLIGHT: WaterPreset = {
  ...WATER_CHIP,
  breath: 2.6,
  wrinkle: 0.62,
  meniscus: 9,
  inflate: 2.4,
  tapGain: 2.6,
  tapKick: 16,
  springK: 128,
  dampRatio: 0.26,
  sigma: 26,
  reach: 120,
};

/** Settings name field: stadium, denser samples so wide pills stay round. */
export const WATER_FIELD: WaterPreset = {
  ...WATER_CHIP,
  inset: 8,
  samples: 0,
  spacing: 6,
  curve: 10,
  breath: 1.15,
  wrinkle: 0,
};

/** The composer / dock: same water, wider crest because the pane is wider. */
export const WATER_PANE: WaterPreset = {
  ...BASE,
  inset: 12,
  radius: 30,
  spacing: 12,
  reach: 108,
  sigma: 92,
  meniscus: 5,
  inflate: 0.8,
  breath: 1.05,
  // wide, so a pane this big swells in a broad crest instead of pulling to a
  // point the way a chip does
  insideBand: 55,
  springK: 190,
  glowGain: 0.72,
  gradScale: 0.3,
  gradMin: 150,
};

/** Header bar: a long stadium, same water as the composer, stretched wide. */
export const WATER_BAR: WaterPreset = {
  ...WATER_PANE,
  inset: 11,
  radius: null,
  insideBand: 42,
  sigma: 78,
  breath: 0.95,
};

/** Ask / Send: a stadium pill. Tiny edge lean only — small buttons + a
 *  strong meniscus read as random curves thrown off the control. */
export const WATER_ACTION: WaterPreset = {
  ...BASE,
  inset: 6,
  spacing: 5,
  reach: 44,
  sigma: 18,
  meniscus: 1.15,
  inflate: 0.18,
  breath: 0,
  insideBand: 12,
  springK: 260,
  tapGain: 0.8,
  tapKick: 4,
  pushIn: 0.7,
  headroom: 2.4,
  glowGain: 1,
  specRestY: 0.28,
  gradScale: 0.7,
  gradMin: 34,
  curve: 14,
};

export function waterPresetForHeat(heat: ChipHeat | undefined): WaterPreset {
  if (heat === "hot") return WATER_CHIP_HOT;
  if (heat === "warm") return WATER_CHIP_WARM;
  if (isQuietHeat(heat)) return WATER_CHIP_QUIET;
  return WATER_CHIP;
}

const MAX_SAMPLES = 180;

export type WaterSurface = {
  root: HTMLElement;
  skin: HTMLElement;
  /** every path that draws the outline: shade, dip, rim, spec */
  paths: (SVGPathElement | null)[];
  grad: SVGRadialGradientElement | null;
  preset: WaterPreset;
  phase: number;
  energy: number;
  vel: number;
  tap: number;
  /** field centre in element coords — frozen on leave so the dip stays put */
  fx: number;
  fy: number;
  specX: number;
  specY: number;
  buf: Float64Array;
  rect: DOMRect | null;
  w: number;
  h: number;
  asleep: boolean;
  /** extra attention used when the drop is flying, not being pointed at */
  force: number;
  ripples: WaterRipple[];
  heat: ChipHeat;
};

export type WaterRipple = {
  x: number;
  y: number;
  t0: number;
  speed: number;
  life: number;
  amp: number;
  band: number;
};

export function createWaterSurface(init: {
  root: HTMLElement;
  skin: HTMLElement;
  paths: (SVGPathElement | null)[];
  grad: SVGRadialGradientElement | null;
  preset: WaterPreset;
  phase?: number;
  heat?: ChipHeat;
}): WaterSurface {
  const heat = init.heat ?? "warm";
  return {
    root: init.root,
    skin: init.skin,
    paths: init.paths,
    grad: init.grad,
    preset: init.preset,
    phase: init.phase ?? 0,
    energy: 0,
    vel: 0,
    tap: 0,
    fx: -9999,
    fy: -9999,
    specX: 0,
    specY: 0,
    buf: new Float64Array(MAX_SAMPLES * 2),
    rect: null,
    w: 0,
    h: 0,
    asleep: false,
    force: 0,
    ripples: [],
    heat,
  };
}

/** A drop landing: inner illumination spreading out, then settle. */
export function splashWater(surface: WaterSurface, force = false) {
  if (isQuietHeat(surface.heat) && !force) return;
  surface.tap = 1;
  surface.vel += (isQuietHeat(surface.heat) ? WATER_CHIP.tapKick : surface.preset.tapKick);
  surface.asleep = false;
  start();
}

/** A pebble in the pond: a ring that runs out to both ends, then dies. */
export function dropPebble(
  surface: WaterSurface,
  clientX: number,
  clientY: number,
  force = false
) {
  if (isQuietHeat(surface.heat) && !force) return;
  const box = surface.root.getBoundingClientRect();
  const lw = surface.root.offsetWidth || box.width;
  const lh = surface.root.offsetHeight || box.height;
  if (box.width < 4 || lw < 4) return;
  const x = ((clientX - box.left) / box.width) * lw;
  const y = ((clientY - box.top) / box.height) * lh;
  const now = performance.now();
  const hot = surface.heat === "hot" || force;
  surface.ripples.push(
    {
      x,
      y,
      t0: now,
      speed: hot ? 0.72 : 0.78,
      life: hot ? 1520 : 820,
      amp: hot ? 10.4 : 7.2,
      band: hot ? 30 : 26,
    },
    {
      x,
      y,
      t0: now + (hot ? 160 : 110),
      speed: hot ? 0.54 : 0.62,
      life: hot ? 1380 : 760,
      amp: hot ? 6.2 : 4.4,
      band: hot ? 34 : 30,
    }
  );
  surface.tap = 1;
  surface.vel +=
    (isQuietHeat(surface.heat) ? WATER_CHIP.tapKick : surface.preset.tapKick) * 0.7;
  surface.asleep = false;
  start();
}

/** Snap back to rest so a hold-grow silhouette cannot freeze at max size. */
export function restWater(surface: WaterSurface) {
  surface.energy = 0;
  surface.vel = 0;
  surface.tap = 0;
  surface.force = 0;
  surface.ripples.length = 0;
  surface.asleep = false;
}

/** Keep the meniscus racing around the rim while a chip is magnetized. */
export function tumbleWater(surface: WaterSurface, time: number) {
  const w = surface.w || surface.rect?.width || 88;
  const h = surface.h || surface.rect?.height || 40;
  const ang = time * 2.4;
  surface.fx = w * (0.5 + Math.cos(ang) * 0.4);
  surface.fy = h * (0.5 + Math.sin(ang * 1.35) * 0.34);
  surface.force = 1;
  surface.tap = Math.max(surface.tap, 0.82);
  surface.vel += surface.preset.tapKick * 0.22;
  surface.asleep = false;
}

const round = (n: number) => Math.round(n * 10) / 10;

/** Signed distance to a rounded rectangle; negative inside. */
function sdRoundRect(
  px: number,
  py: number,
  cx: number,
  cy: number,
  hx: number,
  hy: number,
  r: number
) {
  const qx = Math.abs(px - cx) - (hx - r);
  const qy = Math.abs(py - cy) - (hy - r);
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    r
  );
}

/** Closed Catmull-Rom through the sampled outline — smooth, no corners. */
function toPath(pts: Float64Array, n: number, curve: number) {
  const k = Math.max(6, curve);
  let d = `M${round(pts[0])} ${round(pts[1])}`;
  for (let i = 0; i < n; i++) {
    const i0 = ((i - 1 + n) % n) * 2;
    const i1 = i * 2;
    const i2 = ((i + 1) % n) * 2;
    const i3 = ((i + 2) % n) * 2;
    const c1x = pts[i1] + (pts[i2] - pts[i0]) / k;
    const c1y = pts[i1 + 1] + (pts[i2 + 1] - pts[i0 + 1]) / k;
    const c2x = pts[i2] - (pts[i3] - pts[i1]) / k;
    const c2y = pts[i2 + 1] - (pts[i3 + 1] - pts[i1 + 1]) / k;
    d += `C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(
      pts[i2]
    )} ${round(pts[i2 + 1])}`;
  }
  return `${d}Z`;
}

const pointer = { x: -9999, y: -9999, live: false };

function shape(s: WaterSurface, time: number, breathing: boolean, nowMs: number) {
  const box = s.rect;
  const lw = s.root.offsetWidth;
  const lh = s.root.offsetHeight;
  if (lw < 8 || lh < 8) return;

  const p = s.preset;
  const w = lw - p.inset * 2;
  const h = lh - p.inset * 2;
  if (w < 6 || h < 6) return;

  const r = p.radius == null ? h / 2 : Math.min(p.radius, w / 2, h / 2);
  const runX = Math.max(0, w - 2 * r);
  const runY = Math.max(0, h - 2 * r);
  const arc = (Math.PI / 2) * r;
  // clockwise from the top edge: run, corner, run, corner, …
  const b1 = runX;
  const b2 = b1 + arc;
  const b3 = b2 + runY;
  const b4 = b3 + arc;
  const b5 = b4 + runX;
  const b6 = b5 + arc;
  const b7 = b6 + runY;
  const perim = b7 + arc;

  const left = p.inset;
  const top = p.inset;
  const x0 = left + r;
  const x1 = left + w - r;
  const y0 = top + r;
  const y1 = top + h - r;
  const cx = left + w / 2;
  const cy = top + h / 2;

  // How much attention the surface is paying to the pointer right now.
  let target = 0;
  if (s.force > 0.02) {
    target = s.force;
    s.force *= 0.88;
  }
  const listen = pointer.live && !isQuietHeat(s.heat);
  if (listen && box && box.width > 0.5) {
    const lx = (pointer.x - box.left) * (lw / box.width);
    const ly = (pointer.y - box.top) * (lh / box.height);
    const outside = Math.max(0, sdRoundRect(lx, ly, cx, cy, w / 2, h / 2, r));
    if (outside < p.reach) {
      target = Math.max(target, (1 - outside / p.reach) ** 1.6);
      s.fx = lx;
      s.fy = ly;
    }
  }

  const dt = 1 / 60;
  const damp = 2 * Math.sqrt(p.springK) * p.dampRatio;
  s.vel += (-p.springK * (s.energy - target) - damp * s.vel) * dt;
  s.energy += s.vel * dt;
  s.tap *= s.heat === "hot" ? 0.945 : 0.9;
  if (s.tap < 0.002) s.tap = 0;

  s.ripples = s.ripples.filter((wave) => nowMs - wave.t0 < wave.life + 40);
  const rippling = s.ripples.length > 0;

  const alive = breathing && p.breath > 0;
  if (
    !alive &&
    !rippling &&
    target === 0 &&
    s.force < 0.02 &&
    s.tap === 0 &&
    Math.abs(s.energy) < 6e-4 &&
    Math.abs(s.vel) < 6e-3
  ) {
    s.energy = 0;
    s.vel = 0;
    if (s.asleep && s.w === lw && s.h === lh) return;
    s.asleep = true;
  } else {
    s.asleep = false;
  }
  s.w = lw;
  s.h = lh;

  const n = p.samples
    ? p.samples
    : Math.min(
        MAX_SAMPLES,
        Math.max(44, Math.round(perim / p.spacing / 2) * 2)
      );

  const energy = s.energy;
  const amp = p.meniscus * energy;
  const swell = p.inflate * energy;
  const insideness = Math.max(
    0,
    Math.min(
      1,
      1 - sdRoundRect(s.fx, s.fy, cx, cy, w / 2, h / 2, r) / p.insideBand
    )
  );
  const breath = alive ? p.breath : 0;
  const sigma2 = 2 * p.sigma * p.sigma;
  const maxOut = p.inset - p.headroom;
  const pts = s.buf;

  let bestDist = Infinity;
  let bestX = lw / 2;
  let bestY = lh * p.specRestY;

  for (let i = 0; i < n; i++) {
    const t = (i / n) * perim;
    let x: number;
    let y: number;
    let nx: number;
    let ny: number;

    if (t < b1) {
      x = x0 + t;
      y = top;
      nx = 0;
      ny = -1;
    } else if (t < b2) {
      const a = -Math.PI / 2 + (t - b1) / r;
      nx = Math.cos(a);
      ny = Math.sin(a);
      x = x1 + r * nx;
      y = y0 + r * ny;
    } else if (t < b3) {
      x = left + w;
      y = y0 + (t - b2);
      nx = 1;
      ny = 0;
    } else if (t < b4) {
      const a = (t - b3) / r;
      nx = Math.cos(a);
      ny = Math.sin(a);
      x = x1 + r * nx;
      y = y1 + r * ny;
    } else if (t < b5) {
      x = x1 - (t - b4);
      y = top + h;
      nx = 0;
      ny = 1;
    } else if (t < b6) {
      const a = Math.PI / 2 + (t - b5) / r;
      nx = Math.cos(a);
      ny = Math.sin(a);
      x = x0 + r * nx;
      y = y1 + r * ny;
    } else if (t < b7) {
      x = left;
      y = y1 - (t - b6);
      nx = -1;
      ny = 0;
    } else {
      const a = Math.PI + (t - b7) / r;
      nx = Math.cos(a);
      ny = Math.sin(a);
      x = x0 + r * nx;
      y = y0 + r * ny;
    }

    const u = i / n;
    // One slow lap around the silhouette, plus a quieter second harmonic.
    // High-frequency wrinkles at rest read as noise, not water.
    let push =
      breath *
      (Math.sin(u * Math.PI * 2 + time * 0.62 + s.phase) * 0.85 +
        Math.sin(u * Math.PI * 4 - time * 0.28 + s.phase * 1.4) * p.wrinkle);

    if (amp !== 0 || s.tap !== 0) {
      const dx = s.fx - x;
      const dy = s.fy - y;
      const dist = Math.hypot(dx, dy) || 0.001;
      if (dist < bestDist) {
        bestDist = dist;
        bestX = x;
        bestY = y;
      }
      const falloff = Math.exp(-(dist * dist) / sigma2);
      const outward = (nx * dx + ny * dy) / dist;
      // Facing the pointer leans out; under the pointer the whole edge swells.
      const facing = Math.max(0, outward) * (1 - insideness) + insideness;
      push += amp * falloff * facing + p.tapGain * s.tap * falloff;
    }

    push += swell;
    if (rippling) {
      for (let r = 0; r < s.ripples.length; r++) {
        const wave = s.ripples[r];
        const elapsed = nowMs - wave.t0;
        if (elapsed < 0 || elapsed > wave.life) continue;
        const fade = 1 - elapsed / wave.life;
        const radius = elapsed * wave.speed;
        const dist = Math.hypot(x - wave.x, y - wave.y);
        const ring = Math.abs(dist - radius);
        const fall = Math.exp(-(ring * ring) / (2 * wave.band * wave.band));
        push += wave.amp * fade * fade * fall;
      }
    }
    if (push > maxOut) push = maxOut;
    else if (push < -p.pushIn) push = -p.pushIn;

    // Keep the silhouette inside the element. Catmull-Rom on a small pill
    // otherwise overshoots and the outline looks thrown across the page.
    pts[i * 2] = Math.min(lw - 0.4, Math.max(0.4, x + nx * push));
    pts[i * 2 + 1] = Math.min(lh - 0.4, Math.max(0.4, y + ny * push));
  }

  const d = toPath(pts, n, p.curve);
  const clip = `path("${d}")`;
  s.skin.style.setProperty("clip-path", clip);
  s.skin.style.setProperty("-webkit-clip-path", clip);
  for (let i = 0; i < s.paths.length; i++) {
    s.paths[i]?.setAttribute("d", d);
  }

  // Light gathers where the pointer touches. At rest it crawls slowly
  // around the rim so the surface still feels wet with the mouse idle.
  const restX = lw / 2;
  const restY = lh * p.specRestY;
  const pull = Math.max(0, Math.min(1, Math.abs(energy)));
  let wantX = bestDist === Infinity ? restX : bestX;
  let wantY = bestDist === Infinity ? restY : bestY;
  if (alive && pull < 0.08 && p.breath > 0) {
    const a = time * 0.38 + s.phase;
    wantX = restX + Math.cos(a) * Math.min(34, lw * 0.2);
    wantY = restY + Math.sin(a) * Math.min(9, lh * 0.14);
  }
  const destX = pull >= 0.08 ? restX + (wantX - restX) * pull : wantX;
  const destY = pull >= 0.08 ? restY + (wantY - restY) * pull : wantY;
  s.specX += (destX - s.specX) * p.specEase;
  s.specY += (destY - s.specY) * p.specEase;

  if (s.grad) {
    s.grad.setAttribute("cx", s.specX.toFixed(1));
    s.grad.setAttribute("cy", s.specY.toFixed(1));
    s.grad.setAttribute(
      "r",
      Math.max(p.gradMin, lw * p.gradScale).toFixed(1)
    );
  }

  const glow = (Math.max(0, Math.min(1, energy)) * p.glowGain).toFixed(3);
  const tap = s.tap.toFixed(3);
  const specX = `${((s.specX / lw) * 100).toFixed(1)}%`;
  const specY = `${((s.specY / lh) * 100).toFixed(1)}%`;
  // Write on root and skin. Skin is what paints; --glow is registered +
  // inherited, but a leftover stylesheet `--glow: 0` on .water/.capsule can
  // make getComputedStyle(root) look dead while the outline is still moving.
  for (const el of [s.root, s.skin]) {
    el.style.setProperty("--glow", glow);
    el.style.setProperty("--tap", tap);
    el.style.setProperty("--spec-x", specX);
    el.style.setProperty("--spec-y", specY);
  }
}

const surfaces = new Set<WaterSurface>();
let frame = 0;
let running = false;
let listening = false;
let breathing = true;
let slow = 0;
let last = 0;

function clearPaintVars(s: WaterSurface) {
  for (const el of [s.root, s.skin]) {
    el.style.removeProperty("--glow");
    el.style.removeProperty("--tap");
    el.style.removeProperty("--spec-x");
    el.style.removeProperty("--spec-y");
  }
  s.skin.style.removeProperty("clip-path");
  s.skin.style.removeProperty("-webkit-clip-path");
}

function wakeAll() {
  surfaces.forEach((s) => {
    if (isQuietHeat(s.heat) && !s.ripples.length) return;
    s.asleep = false;
  });
}

function onMove(e: PointerEvent) {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  // Finger-scroll should not drag every chip. Press-and-hold still leans
  // because pointerdown sets live; only mouse/pen keep following moves.
  pointer.live = e.pointerType !== "touch";
  if (!pointer.live) return;
  // Soft → Full remounts every surface. The loop can die in that gap, and
  // `pointer.live` is false until a real move. Wake + start here so the
  // first hover after a motion toggle is enough.
  wakeAll();
  start();
}

function onDown(e: PointerEvent) {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  if (e.pointerType === "touch") pointer.live = true;
  wakeAll();
  start();
}

function onUp(e: PointerEvent) {
  if (e.pointerType === "touch") pointer.live = false;
}

function onOut() {
  pointer.live = false;
}

function tick(now: number) {
  if (!running || surfaces.size === 0) {
    running = false;
    frame = 0;
    return;
  }

  const cost = now - last;
  last = now;
  // If the machine is struggling, stop the idle ripple and only react.
  if (cost > 32) {
    if (++slow > 48) breathing = false;
  } else if (slow > 0) {
    slow -= 1;
    if (slow < 12) breathing = true;
  }

  const time = now / 1000;
  surfaces.forEach((s) => {
    const idleQuiet =
      isQuietHeat(s.heat) &&
      s.asleep &&
      s.ripples.length === 0 &&
      s.force < 0.02 &&
      s.tap === 0;
    if (idleQuiet) return;
    s.rect = s.root.getBoundingClientRect();
    shape(s, time, breathing, now);
  });

  if (!running || surfaces.size === 0) {
    running = false;
    frame = 0;
    return;
  }
  frame = requestAnimationFrame(tick);
}

function start() {
  if (surfaces.size === 0) return;
  if (running) return;
  running = true;
  last = performance.now();
  frame = requestAnimationFrame(tick);
}

function stop() {
  running = false;
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
}

function onVisibility() {
  stop();
  if (!document.hidden) start();
}

export function registerWater(surface: WaterSurface) {
  surface.asleep = false;
  surfaces.add(surface);

  if (!listening) {
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    window.addEventListener("blur", onOut);
    document.addEventListener("pointerleave", onOut);
    document.addEventListener("visibilitychange", onVisibility);
    listening = true;
  }
  start();

  return () => {
    surfaces.delete(surface);
    clearPaintVars(surface);
    if (surfaces.size > 0) return;
    stop();
    pointer.live = false;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    window.removeEventListener("blur", onOut);
    document.removeEventListener("pointerleave", onOut);
    document.removeEventListener("visibilitychange", onVisibility);
    listening = false;
  };
}

export function rippleWaterRoot(
  root: HTMLElement | null,
  clientX: number,
  clientY: number,
  force = false
) {
  if (!root) return;
  surfaces.forEach((surface) => {
    if (surface.root !== root) return;
    dropPebble(surface, clientX, clientY, force);
    splashWater(surface, force);
  });
}

export function setWaterHeat(surface: WaterSurface, heat: ChipHeat) {
  surface.heat = heat;
  if (surface.preset === WATER_FLIGHT) return;
  surface.preset = waterPresetForHeat(heat);
  if (isQuietHeat(heat)) restWater(surface);
  surface.asleep = false;
  start();
}
