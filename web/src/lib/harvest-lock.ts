import { isOpenRecall } from "@/lib/chip-recall";
import type { ChipKind, HarvestChip } from "@/lib/harvest";
import { clozeForChip } from "@/lib/open-cloze";

export const LOCK_IN_SEE_KICKER = "Tap to keep it";
export const LOCK_IN_SAY_KICKER = "Say it to keep it";
/** @deprecated Use lockInKicker(mode). Kept as the SAY line. */
export const LOCK_IN_KICKER = LOCK_IN_SAY_KICKER;

export type HarvestLockMode = "see" | "say";
export type HarvestLockOutcome = "claimed" | "skip" | "drop";

export type HarvestLockChipLog = {
  chipId: string;
  kind: ChipKind;
  token: string;
  prompt: string;
  mode: HarvestLockMode;
  outcome: HarvestLockOutcome;
  misses: number;
};

export type HarvestLockFinish = {
  keep: HarvestChip[];
  dropped: HarvestChip[];
  outcomes: HarvestLockChipLog[];
};

export type HarvestLockLive = {
  claimedIds: string[];
  droppedIds: string[];
  remainingIds: string[];
};

export function lockPlayMode(chip: HarvestChip): HarvestLockMode {
  if (!isOpenRecall(chip)) return "see";
  return clozeForChip(chip, 1, "see") ? "see" : "say";
}

export function lockInKicker(mode: HarvestLockMode) {
  return mode === "see" ? LOCK_IN_SEE_KICKER : LOCK_IN_SAY_KICKER;
}

/** Long answers (Golden Rule) stack like phone play. Short closed tokens stay a 2×2 grid. */
export function lockChoicesStack(picks: string[]) {
  if (picks.length <= 1) return true;
  return picks.some((pick) => pick.trim().length > 36);
}

export function lockChipLog(
  chip: HarvestChip,
  outcome: HarvestLockOutcome,
  misses = 0
): HarvestLockChipLog {
  return {
    chipId: chip.id,
    kind: chip.kind,
    token: chip.token.slice(0, 120),
    prompt: chip.prompt.slice(0, 160),
    mode: lockPlayMode(chip),
    outcome,
    misses,
  };
}
