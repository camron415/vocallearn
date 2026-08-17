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
};

/** Recent chips. Hover numbers stay as signed off; breath is the idle rest. */
export const WATER_CHIP: WaterPreset = { ...BASE, samples: 46, breath: 1.55 };

/** Settings name field: stadium, inset must match CSS --water. */
export const WATER_FIELD: WaterPreset = {
  ...WATER_CHIP,
  inset: 8,
  samples: 40,
  breath: 1.15,
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
  inset: 8,
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
};

export function createWaterSurface(init: {
  root: HTMLElement;
  skin: HTMLElement;
  paths: (SVGPathElement | null)[];
  grad: SVGRadialGradientElement | null;
  preset: WaterPreset;
  phase?: number;
}): WaterSurface {
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
  };
}

/** A drop landing: inner illumination spreading out, then settle. */
export function splashWater(surface: WaterSurface) {
  surface.tap = 1;
  surface.vel += surface.preset.tapKick;
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

function shape(s: WaterSurface, time: number, breathing: boolean) {
  const rect = s.rect;
  if (!rect || rect.width < 8 || rect.height < 8) return;

  const p = s.preset;
  const w = rect.width - p.inset * 2;
  const h = rect.height - p.inset * 2;
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
  if (pointer.live) {
    const lx = pointer.x - rect.left;
    const ly = pointer.y - rect.top;
    const outside = Math.max(0, sdRoundRect(lx, ly, cx, cy, w / 2, h / 2, r));
    if (outside < p.reach) {
      target = (1 - outside / p.reach) ** 1.6;
      s.fx = lx;
      s.fy = ly;
    }
  }

  const dt = 1 / 60;
  const damp = 2 * Math.sqrt(p.springK) * p.dampRatio;
  s.vel += (-p.springK * (s.energy - target) - damp * s.vel) * dt;
  s.energy += s.vel * dt;
  s.tap *= 0.9;
  if (s.tap < 0.002) s.tap = 0;

  const alive = breathing && p.breath > 0;
  if (
    !alive &&
    target === 0 &&
    s.tap === 0 &&
    Math.abs(s.energy) < 6e-4 &&
    Math.abs(s.vel) < 6e-3
  ) {
    s.energy = 0;
    s.vel = 0;
    // Resting and unchanged: the outline is already on screen.
    if (s.asleep && s.w === rect.width && s.h === rect.height) return;
    s.asleep = true;
  } else {
    s.asleep = false;
  }
  s.w = rect.width;
  s.h = rect.height;

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
  let bestX = rect.width / 2;
  let bestY = rect.height * p.specRestY;

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
        Math.sin(u * Math.PI * 4 - time * 0.28 + s.phase * 1.4) * 0.22);

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
    if (push > maxOut) push = maxOut;
    else if (push < -p.pushIn) push = -p.pushIn;

    // Keep the silhouette inside the element. Catmull-Rom on a small pill
    // otherwise overshoots and the outline looks thrown across the page.
    pts[i * 2] = Math.min(rect.width - 0.4, Math.max(0.4, x + nx * push));
    pts[i * 2 + 1] = Math.min(rect.height - 0.4, Math.max(0.4, y + ny * push));
  }

  const d = toPath(pts, n, p.curve);
  s.skin.style.clipPath = `path("${d}")`;
  for (let i = 0; i < s.paths.length; i++) {
    s.paths[i]?.setAttribute("d", d);
  }

  // Light gathers where the pointer touches. At rest it crawls slowly
  // around the rim so the surface still feels wet with the mouse idle.
  const restX = rect.width / 2;
  const restY = rect.height * p.specRestY;
  const pull = Math.max(0, Math.min(1, Math.abs(energy)));
  let wantX = bestDist === Infinity ? restX : bestX;
  let wantY = bestDist === Infinity ? restY : bestY;
  if (alive && pull < 0.08 && p.breath > 0) {
    const a = time * 0.38 + s.phase;
    wantX = restX + Math.cos(a) * Math.min(34, rect.width * 0.2);
    wantY = restY + Math.sin(a) * Math.min(9, rect.height * 0.14);
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
      Math.max(p.gradMin, rect.width * p.gradScale).toFixed(1)
    );
  }

  const glow = (Math.max(0, Math.min(1, energy)) * p.glowGain).toFixed(3);
  const tap = s.tap.toFixed(3);
  const specX = `${((s.specX / rect.width) * 100).toFixed(1)}%`;
  const specY = `${((s.specY / rect.height) * 100).toFixed(1)}%`;
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
}

function wakeAll() {
  surfaces.forEach((s) => {
    s.asleep = false;
  });
}

function onMove(e: PointerEvent) {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.live = e.pointerType !== "touch";
  if (!pointer.live) return;
  // Soft → Full remounts every surface. The loop can die in that gap, and
  // `pointer.live` is false until a real move. Wake + start here so the
  // first hover after a motion toggle is enough.
  wakeAll();
  start();
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
  if (cost > 26) {
    if (++slow > 30) breathing = false;
  } else if (slow > 0) {
    slow -= 1;
  }

  const time = now / 1000;
  // Read every rect first, then write — no layout thrash.
  surfaces.forEach((s) => {
    s.rect = s.root.getBoundingClientRect();
  });
  surfaces.forEach((s) => shape(s, time, breathing));

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
    window.removeEventListener("blur", onOut);
    document.removeEventListener("pointerleave", onOut);
    document.removeEventListener("visibilitychange", onVisibility);
    listening = false;
  };
}
