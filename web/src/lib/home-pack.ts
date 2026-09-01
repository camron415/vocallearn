/**
 * Home constellation packing.
 *
 * Designed seats for n = 1..16 (not free scatter). Kind/heat assignment +
 * measured chip sizes. Soft settle only fixes overlaps; it does not re-scatter.
 * Seats stay fixed when composer suggestions open (Duolingo seat-map rule).
 */

import type { ChipHeat } from "@/lib/chip-heat";

export type HomeBox = {
  id: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
  hue?: string;
  heat?: ChipHeat;
};

export type HomeWall = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type KeepSeat = {
  id: string;
  x: number;
  y: number;
  band: "top" | "side" | "low";
};

type Spot = {
  fx: number;
  fy: number;
  /** Relative clearance for long chips (1 = roomiest). */
  room: number;
  band: KeepSeat["band"];
  /** Prefer hot / warm chips here. */
  belt: boolean;
};

type Body = HomeBox;

/** Laptop-sized Home is the “looks right” frame. Grow on big monitors, shrink on small. */
const DESIGN_W = 1440;
const DESIGN_H = 900;
/** Match `motion.css` phone breakpoint. Dice seats live above greeting/composer. */
export const PHONE_HOME_MAX_W = 720;

export function isPhoneHomeView(view: { w: number }) {
  return view.w <= PHONE_HOME_MAX_W;
}

export function keepFieldScale(view: { w: number; h: number }) {
  const s = Math.min(view.w / DESIGN_W, view.h / DESIGN_H);
  return Math.min(1.28, Math.max(0.84, s));
}

/**
 * Large screens hug the bezels. Small screens get a little inset so
 * chips don’t clip. Sparse counts still sit off the exact pixel corner.
 */
export function keepPlayableInset(count: number, view: { w: number; h: number }) {
  const short = Math.min(view.w, view.h);
  const size = short >= 1200 ? 0.018 : short >= 900 ? 0.032 : 0.05;
  const sparse =
    count <= 2 ? 0.06 : count <= 4 ? 0.045 : count <= 7 ? 0.028 : 0;
  return Math.min(0.12, size + sparse);
}

/**
 * 16 seats — near-corners first so the field never reads as a heart ring.
 * Exact pixel corners stay empty; near-corner bands get chips.
 * Center band under the composer is a permanent suggest corridor (no seats).
 * Seats never move when suggestions open.
 */
const MASTER: Spot[] = [
  // Near-corner anchors (break the heart silhouette)
  { fx: 0.08, fy: 0.09, room: 0.95, band: "top", belt: true }, // 0 top-left
  { fx: 0.92, fy: 0.09, room: 0.95, band: "top", belt: true }, // 1 top-right
  { fx: 0.07, fy: 0.93, room: 1, band: "low", belt: false }, // 2 bottom-left
  { fx: 0.93, fy: 0.93, room: 1, band: "low", belt: false }, // 3 bottom-right
  // Outer mid flanks
  { fx: 0.07, fy: 0.38, room: 0.95, band: "side", belt: true }, // 4
  { fx: 0.93, fy: 0.37, room: 0.95, band: "side", belt: true }, // 5
  // Top span (wide, not clustered on center)
  { fx: 0.28, fy: 0.08, room: 0.8, band: "top", belt: true }, // 6
  { fx: 0.72, fy: 0.08, room: 0.8, band: "top", belt: true }, // 7
  // Upper flanks (fill the “lobes” without hugging center)
  { fx: 0.16, fy: 0.21, room: 0.85, band: "top", belt: true }, // 8
  { fx: 0.84, fy: 0.2, room: 0.85, band: "top", belt: true }, // 9
  // Mid-high outer
  { fx: 0.08, fy: 0.26, room: 0.9, band: "side", belt: true }, // 10
  { fx: 0.92, fy: 0.25, room: 0.9, band: "side", belt: true }, // 11
  // Lower outer flanks — below suggest, out at the edge
  { fx: 0.08, fy: 0.74, room: 0.9, band: "side", belt: false }, // 12
  { fx: 0.92, fy: 0.73, room: 0.9, band: "side", belt: false }, // 13
  // Soft low outer
  { fx: 0.3, fy: 0.93, room: 0.95, band: "low", belt: false }, // 14
  { fx: 0.7, fy: 0.93, room: 0.95, band: "low", belt: false }, // 15
];

/** Progressive picks. Corners + low soft first so heart bottom never pinches. */
const PICK: number[][] = [
  [],
  [0],
  [0, 1],
  [0, 1, 2],
  [0, 1, 2, 3],
  [0, 1, 2, 3, 4],
  [0, 1, 2, 3, 4, 5],
  [0, 1, 2, 3, 4, 5, 6],
  [0, 1, 2, 3, 4, 5, 6, 7],
  [0, 1, 2, 3, 4, 5, 6, 7, 14],
  [0, 1, 2, 3, 4, 5, 6, 7, 14, 15],
  [0, 1, 2, 3, 4, 5, 6, 7, 14, 15, 8],
  [0, 1, 2, 3, 4, 5, 6, 7, 14, 15, 8, 9],
  [0, 1, 2, 3, 4, 5, 6, 7, 14, 15, 8, 9, 10],
  [0, 1, 2, 3, 4, 5, 6, 7, 14, 15, 8, 9, 10, 11],
  [0, 1, 2, 3, 4, 5, 6, 7, 14, 15, 8, 9, 10, 11, 12],
  [0, 1, 2, 3, 4, 5, 6, 7, 14, 15, 8, 9, 10, 11, 12, 13],
];

/**
 * Phone-only seats. All in the upper band so chips sit above greeting +
 * composer (dice-5: two-one-two). Never fy > 0.40 — those hid behind the dock.
 */
const PHONE_MASTER: Spot[] = [
  { fx: 0.24, fy: 0.08, room: 0.9, band: "top", belt: true },
  { fx: 0.76, fy: 0.08, room: 0.9, band: "top", belt: true },
  { fx: 0.5, fy: 0.18, room: 0.85, band: "top", belt: true },
  { fx: 0.28, fy: 0.3, room: 0.9, band: "top", belt: true },
  { fx: 0.72, fy: 0.3, room: 0.9, band: "top", belt: true },
  { fx: 0.12, fy: 0.16, room: 0.75, band: "top", belt: true },
  { fx: 0.88, fy: 0.16, room: 0.75, band: "top", belt: true },
  { fx: 0.5, fy: 0.4, room: 0.7, band: "top", belt: false },
  { fx: 0.18, fy: 0.38, room: 0.7, band: "top", belt: false },
  { fx: 0.82, fy: 0.38, room: 0.7, band: "top", belt: false },
];

const PHONE_PICK: number[][] = [
  [],
  [2],
  [0, 1],
  [0, 1, 2],
  [0, 1, 3, 4],
  [0, 1, 2, 3, 4],
  [0, 1, 2, 3, 4, 5],
  [0, 1, 2, 3, 4, 5, 6],
  [0, 1, 2, 3, 4, 5, 6, 7],
  [0, 1, 2, 3, 4, 5, 6, 7, 8],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
];

function hit(a: HomeWall, b: HomeWall, gap: number) {
  return (
    a.x < b.x + b.w + gap &&
    a.x + a.w + gap > b.x &&
    a.y < b.y + b.h + gap &&
    a.y + a.h + gap > b.y
  );
}

function shove(a: Body, b: HomeWall, gap: number, inherit: number) {
  if (!hit(a, b, gap)) return;
  const acx = a.x + a.w / 2;
  const acy = a.y + a.h / 2;
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;
  const overlapX = a.w / 2 + b.w / 2 + gap - Math.abs(acx - bcx);
  const overlapY = a.h / 2 + b.h / 2 + gap - Math.abs(acy - bcy);
  if (overlapX < overlapY) {
    const dir = acx < bcx ? -1 : 1;
    a.x += dir * overlapX * inherit;
  } else {
    const dir = acy < bcy ? -1 : 1;
    a.y += dir * overlapY * inherit;
  }
}

function clampBody(body: Body, view: { w: number; h: number }, pad: number) {
  body.x = Math.min(Math.max(pad, body.x), Math.max(pad, view.w - body.w - pad));
  body.y = Math.min(Math.max(pad, body.y), Math.max(pad, view.h - body.h - pad));
}

function hash32(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function unit(seed: string) {
  return (hash32(seed) % 1000) / 1000;
}

/** Cap chip CSS width so a long fact cannot spill a neighbor seat. */
export function keepChipMaxRem(count: number) {
  if (count >= 14) return 18;
  if (count >= 10) return 19;
  if (count >= 7) return 20;
  return 22;
}

/**
 * Home display cap. Miner can store the full token; Home shows a seat-safe line.
 */
export const CHIP_LABEL_MAX = 28;

export function formatChipLabel(token: string, max = CHIP_LABEL_MAX) {
  const text = token.trim().replace(/\s+/g, " ");
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

/** Deterministic order that avoids same-kind runs (not a seating map). */
export function mixKeepOrder<T extends { id: string; kind: string }>(chips: T[]) {
  const items = [...chips].sort((a, b) => hash32(a.id) - hash32(b.id));
  for (let i = 1; i < items.length; i++) {
    if (items[i].kind !== items[i - 1].kind) continue;
    const swap = items.findIndex(
      (chip, j) => j > i && chip.kind !== items[i - 1].kind
    );
    if (swap < 0) continue;
    const hold = items[i];
    items[i] = items[swap];
    items[swap] = hold;
  }
  return items;
}

function heatRank(heat?: ChipHeat) {
  if (heat === "hot") return 3;
  if (heat === "warm") return 2;
  if (heat === "rest") return 1;
  return 0;
}

function spotsForCount(n: number, phone: boolean): Spot[] {
  if (phone) {
    const count = Math.max(0, Math.min(PHONE_MASTER.length, Math.round(n)));
    const pick = PHONE_PICK[count] ?? PHONE_PICK[PHONE_PICK.length - 1];
    return pick.map((i) => PHONE_MASTER[i]).filter(Boolean);
  }
  const count = Math.max(0, Math.min(16, Math.round(n)));
  const pick = PICK[count] ?? PICK[16];
  return pick.map((i) => MASTER[i]).filter(Boolean);
}

function clearOfWalls(
  cx: number,
  cy: number,
  w: number,
  h: number,
  walls: HomeWall[],
  pad: number
) {
  let x = cx - w / 2;
  let y = cy - h / 2;
  const box = { x, y, w, h, id: "", group: "" };
  for (let n = 0; n < 10; n++) {
    let moved = false;
    for (const wall of walls) {
      if (!hit(box, wall, pad)) continue;
      shove(box, wall, pad, 1);
      moved = true;
    }
    if (!moved) break;
  }
  return { cx: box.x + w / 2, cy: box.y + h / 2 };
}

/**
 * Place chips on the designed constellation for this count.
 * Scatter is ignored (kept in the signature so callers do not break).
 */
export function seedKeepField(
  chips: {
    id: string;
    w: number;
    h: number;
    hue?: string;
    heat?: ChipHeat;
  }[],
  view: { w: number; h: number },
  walls: HomeWall[],
  _scatter?: number
): KeepSeat[] {
  if (!chips.length) return [];
  const phone = isPhoneHomeView(view);
  const pad = 10;
  const inset = phone ? 0.04 : keepPlayableInset(chips.length, view);
  const spots = spotsForCount(chips.length, phone);
  const centers = spots.map((spot, i) => {
    const fx = inset + spot.fx * (1 - 2 * inset);
    const fy = inset + spot.fy * (1 - 2 * inset);
    // Tiny jitter only — seats must stay recognizable. Phone dice stays put.
    const jx = phone ? 0 : (unit(`jx${i}${spot.fx}`) - 0.5) * 0.01;
    const jy = phone ? 0 : (unit(`jy${i}${spot.fy}`) - 0.5) * 0.008;
    return {
      ...spot,
      cx: (fx + jx) * view.w,
      cy: (fy + jy) * view.h,
    };
  });

  type Placed = KeepSeat & {
    hue?: string;
    heat?: ChipHeat;
    cx: number;
    cy: number;
    w: number;
    h: number;
    room: number;
  };

  const unused = [...chips];
  const out: Placed[] = [];
  const sparse = chips.length <= 8;

  // At low n, keep PICK order so progressive corners stay intentional.
  const seatOrder = centers.map((seat, index) => ({ seat, index }));
  if (!sparse) {
    seatOrder.sort((a, b) => {
      const belt = Number(b.seat.belt) - Number(a.seat.belt);
      if (belt) return belt;
      return b.seat.room - a.seat.room;
    });
  }

  for (const { seat } of seatOrder) {
    if (!unused.length) break;
    let best = 0;
    let bestScore = -Infinity;
    const usedHues = new Set(
      out.map((placed) => placed.hue).filter(Boolean) as string[]
    );
    for (let i = 0; i < unused.length; i++) {
      const chip = unused[i];
      const area = chip.w * chip.h;
      let score = seat.room * 14 + unit(`pick${chip.id}${seat.fx}`) * 2;
      score += heatRank(chip.heat) * (seat.belt ? 6 : -2);
      score += (area / 4000) * seat.room * 4;
      if (chip.hue && !usedHues.has(chip.hue) && sparse) score += 14;
      const long = chip.w > 150;
      for (const placed of out) {
        const d = Math.hypot(seat.cx - placed.cx, seat.cy - placed.cy);
        if (chip.hue && chip.hue === placed.hue) {
          if (d < 360) score -= (360 - d) / 8;
          if (sparse) score -= 16;
        }
        if (d < 100) score -= 12;
        const placedLong = placed.w > 150;
        if (d < 220 && long === placedLong) score -= 18;
        if (d < 220 && long !== placedLong) score += 8;
      }
      const cleared = clearOfWalls(seat.cx, seat.cy, chip.w, chip.h, walls, 12);
      const drift = Math.hypot(cleared.cx - seat.cx, cleared.cy - seat.cy);
      score -= drift / 20;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    const chip = unused.splice(best, 1)[0];
    const cleared = clearOfWalls(seat.cx, seat.cy, chip.w, chip.h, walls, 12);
    const x = Math.min(
      Math.max(pad, cleared.cx - chip.w / 2),
      Math.max(pad, view.w - chip.w - pad)
    );
    const y = Math.min(
      Math.max(pad, cleared.cy - chip.h / 2),
      Math.max(pad, view.h - chip.h - pad)
    );
    out.push({
      id: chip.id,
      x,
      y,
      band: seat.band,
      hue: chip.hue,
      heat: chip.heat,
      cx: x + chip.w / 2,
      cy: y + chip.h / 2,
      w: chip.w,
      h: chip.h,
      room: seat.room,
    });
  }

  for (const chip of unused) {
    const cx = pad + unit(`fx${chip.id}`) * (view.w - pad * 2);
    const cy = phone ? view.h * 0.22 : view.h * 0.45;
    const cleared = clearOfWalls(cx, cy, chip.w, chip.h, walls, 12);
    out.push({
      id: chip.id,
      x: cleared.cx - chip.w / 2,
      y: cleared.cy - chip.h / 2,
      band: "side",
      hue: chip.hue,
      heat: chip.heat,
      cx: cleared.cx,
      cy: cleared.cy,
      w: chip.w,
      h: chip.h,
      room: 0.4,
    });
  }

  return out.map(({ id, x, y, band }) => ({ id, x, y, band }));
}

/**
 * Soft overlap fix only. Seat map stays put — tiny nudges, no re-scatter.
 */
export function packHomeChips(
  boxes: HomeBox[],
  walls: HomeWall[],
  view: { w: number; h: number },
  opts?: { outerGap?: number; clusterSpread?: number; shoveLargeWalls?: boolean }
): HomeBox[] {
  if (!boxes.length) return boxes;
  const outerGap = opts?.outerGap ?? 10;
  const pad = 8;
  const bodies: Body[] = boxes.map((box) => ({ ...box }));

  for (let n = 0; n < 5; n++) {
    const inherit = n < 2 ? 0.28 : 0.14;
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const sameHue = Boolean(
          bodies[i].hue && bodies[i].hue === bodies[j].hue
        );
        const gap = outerGap + (sameHue ? 6 : 0);
        shove(bodies[i], bodies[j], gap, inherit);
        shove(bodies[j], bodies[i], gap, inherit);
      }
      // Greeting/topbar only on desktop — compose is a corridor the seats
      // already avoid. Phone dice sits above the hero; shove the composer wall.
      for (const wall of walls) {
        if (
          !opts?.shoveLargeWalls &&
          wall.h > view.h * 0.2 &&
          wall.w > view.w * 0.4
        ) {
          continue;
        }
        shove(bodies[i], wall, outerGap + 4, inherit);
      }
      clampBody(bodies[i], view, pad);
      if (opts?.shoveLargeWalls) {
        bodies[i].y = Math.min(
          bodies[i].y,
          Math.max(pad, view.h * 0.42 - bodies[i].h)
        );
      }
    }
  }

  return bodies;
}
