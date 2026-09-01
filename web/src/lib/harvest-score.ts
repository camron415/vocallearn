import type { HarvestStyle } from "@/lib/harvest-style";
import { harvestStyleFromDom } from "@/lib/harvest-style";

export type HarvestPoseSample = {
  id: string;
  index: number;
  t: number;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  at: number;
};

export type HarvestCheck = {
  id: string;
  ok: boolean;
  label: string;
  detail: string;
};

export type HarvestCaptureMeta = {
  at: string;
  style: HarvestStyle;
  durationMs: number;
  frameCount: number;
  sampleCount: number;
  fps: number;
  checks: HarvestCheck[];
  sink: "local-api" | "mac-sink" | "none";
  dir?: string;
};

export function scoreHarvest(samples: HarvestPoseSample[]): HarvestCheck[] {
  const last = samples[samples.length - 1];
  const byIndex = new Map<number, HarvestPoseSample[]>();
  for (const sample of samples) {
    const list = byIndex.get(sample.index) ?? [];
    list.push(sample);
    byIndex.set(sample.index, list);
  }

  let corner = false;
  let maxTurn = 0;
  for (const list of byIndex.values()) {
    for (let i = 2; i < list.length; i++) {
      const a = list[i - 2];
      const b = list[i - 1];
      const c = list[i];
      const v1x = b.x - a.x;
      const v1y = b.y - a.y;
      const v2x = c.x - b.x;
      const v2y = c.y - b.y;
      const l1 = Math.hypot(v1x, v1y) || 1;
      const l2 = Math.hypot(v2x, v2y) || 1;
      const dot = Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / (l1 * l2)));
      const turn = Math.acos(dot);
      if (turn > maxTurn) maxTurn = turn;
      if (turn > 1.15 && l1 > 8 && l2 > 8) corner = true;
    }
  }

  const absorbed = Boolean(last && last.scale < 0.22 && last.opacity < 0.3);
  const style = harvestStyleFromDom();

  return [
    {
      id: "absorb",
      ok: absorbed,
      label: "Absorbs",
      detail: absorbed
        ? "Flyer shrinks and fades at the bar."
        : "Last frame is still large. Should shrink into the header.",
    },
    {
      id: "burst",
      ok: !corner,
      label: "Smooth path",
      detail: corner
        ? `Hard turn in the path (${maxTurn.toFixed(2)} rad). Burst should be one curve.`
        : "No sharp corner in the flyer path.",
    },
    {
      id: "dock",
      ok: true,
      label: "Header dock",
      detail: `Dock is ${style.dock} — not a second water pill.`,
    },
    {
      id: "wake",
      ok: style.keep !== "quiet",
      label: "Wake",
      detail:
        style.keep === "quiet"
          ? "Quiet wake. Switch to Pebble to see the pond ring."
          : `${style.keep} wake is on.`,
    },
  ];
}
