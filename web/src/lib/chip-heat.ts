export type ChipHeat = "hot" | "warm" | "rest" | "locked";

export function isQuietHeat(heat: ChipHeat | undefined) {
  return heat === "rest" || heat === "locked";
}

export function isPlayableHeat(heat: ChipHeat | undefined) {
  return heat === "hot" || heat === "warm" || heat == null;
}
