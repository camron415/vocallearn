/**
 * SM-2 Spaced Repetition Algorithm (Modified)
 *
 * Based on the SuperMemo SM-2 algorithm with modifications for
 * in-session micro-repetition and voice-based learning.
 */

export interface FactProgress {
  easeFactor: number;   // Starts at 2.5, minimum 1.3
  intervalDays: number; // Days until next review
  repetitions: number;  // Consecutive correct answers
  nextReviewAt: Date;
  lastReviewedAt: Date;
  masteryLevel: number; // 0-5 scale
  timesCorrect: number;
  timesIncorrect: number;
}

export interface ReviewResult {
  quality: number; // 0-5 quality score from AI evaluation
}

export type FactMemoryState = "new" | "learning" | "review" | "solid" | "at_risk" | "mastered";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calculate the next review state after a user attempts a fact.
 *
 * Quality scores:
 * 5 - Perfect response, no hesitation
 * 4 - Correct with minor hesitation
 * 3 - Correct but with significant effort
 * 2 - Incorrect, but close / partially correct
 * 1 - Incorrect, remembered something
 * 0 - Complete blank / wrong
 */
export function calculateNextReview(
  current: FactProgress,
  result: ReviewResult
): FactProgress {
  const { quality } = result;
  let { easeFactor, intervalDays, repetitions, timesCorrect, timesIncorrect } = current;
  const now = new Date();
  const elapsedDays = Math.max(0, (now.getTime() - current.lastReviewedAt.getTime()) / DAY_MS);
  const effectiveQuality = applyDelayPenalty(quality, intervalDays, elapsedDays);

  if (effectiveQuality >= 3) {
    // Correct response
    timesCorrect += 1;

    intervalDays = getSuccessInterval(repetitions, intervalDays, easeFactor, effectiveQuality);
    repetitions += 1;
  } else {
    // Incorrect response preserves some spacing for facts that were previously stable.
    timesIncorrect += 1;
    intervalDays = getFailureInterval(repetitions, intervalDays);
    repetitions = 0;
  }

  // Update ease factor (never below 1.3)
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - effectiveQuality) * (0.08 + (5 - effectiveQuality) * 0.02))
  );

  // Calculate mastery level (0-5)
  const masteryLevel = calculateMastery(timesCorrect, timesIncorrect, repetitions);

  const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    easeFactor,
    intervalDays,
    repetitions,
    nextReviewAt,
    lastReviewedAt: now,
    masteryLevel,
    timesCorrect,
    timesIncorrect,
  };
}

function applyDelayPenalty(quality: number, intervalDays: number, elapsedDays: number): number {
  if (quality < 3) return quality;

  const scheduledDays = Math.max(1, intervalDays);
  const overdueDays = Math.max(0, elapsedDays - scheduledDays);

  if (overdueDays >= scheduledDays * 2) {
    return Math.max(3, quality - 2);
  }

  if (overdueDays >= scheduledDays) {
    return Math.max(3, quality - 1);
  }

  return quality;
}

function getSuccessInterval(
  repetitions: number,
  intervalDays: number,
  easeFactor: number,
  effectiveQuality: number
): number {
  if (repetitions === 0) return 1;
  if (repetitions === 1) return effectiveQuality >= 4 ? 3 : 2;
  if (repetitions === 2) return effectiveQuality >= 4 ? 7 : 5;

  const growthFactor = effectiveQuality >= 4 ? easeFactor : Math.max(1.4, easeFactor - 0.35);
  return Math.max(2, Math.round(intervalDays * growthFactor));
}

function getFailureInterval(repetitions: number, intervalDays: number): number {
  if (repetitions >= 5) {
    return Math.max(3, Math.round(intervalDays * 0.35));
  }

  if (repetitions >= 2) {
    return Math.max(2, Math.round(intervalDays * 0.25));
  }

  return 1;
}

function calculateMastery(correct: number, incorrect: number, repetitions: number): number {
  const total = correct + incorrect;
  if (total === 0) return 0;

  const accuracy = correct / total;
  const streakBonus = Math.min(repetitions / 5, 1); // Max bonus at 5 consecutive

  // Weighted: 60% accuracy, 40% streak
  const score = accuracy * 0.6 + streakBonus * 0.4;

  return Math.min(5, Math.round(score * 5));
}

export function getFactMemoryState(
  progress: FactProgress | null,
  now = new Date()
): FactMemoryState {
  if (!progress) return "new";

  const totalAttempts = progress.timesCorrect + progress.timesIncorrect;
  if (totalAttempts === 0) return "new";

  if (progress.nextReviewAt <= now) return "at_risk";
  if (progress.masteryLevel >= 5 && progress.repetitions >= 6 && progress.intervalDays >= 21) {
    return "mastered";
  }
  if (progress.masteryLevel >= 4 && progress.repetitions >= 4 && progress.intervalDays >= 10) {
    return "solid";
  }
  if (progress.repetitions >= 2) return "review";
  return "learning";
}

/**
 * Get facts that are due for review (nextReviewAt <= now).
 * Sorted by priority: overdue first, then by lowest mastery.
 */
export function sortFactsByPriority(
  facts: Array<{ id: string; progress: FactProgress | null }>
): string[] {
  const now = new Date();
  const stateRank: Record<FactMemoryState, number> = {
    at_risk: 0,
    learning: 1,
    review: 2,
    solid: 3,
    mastered: 4,
    new: 5,
  };

  return facts
    .sort((a, b) => {
      // New facts (no progress) come after due reviews but before future reviews
      if (!a.progress && !b.progress) return 0;
      if (!a.progress) return 1;
      if (!b.progress) return -1;

      const aOverdue = a.progress.nextReviewAt <= now;
      const bOverdue = b.progress.nextReviewAt <= now;

      // Due facts first
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // Among due facts, lowest mastery first
      if (aOverdue && bOverdue) {
        const stateDiff =
          stateRank[getFactMemoryState(a.progress, now)] -
          stateRank[getFactMemoryState(b.progress, now)];

        if (stateDiff !== 0) return stateDiff;

        const overdueDiff = b.progress.nextReviewAt.getTime() - a.progress.nextReviewAt.getTime();
        if (overdueDiff !== 0) return overdueDiff;

        return a.progress.masteryLevel - b.progress.masteryLevel;
      }

      // Among future facts, soonest first
      return a.progress.nextReviewAt.getTime() - b.progress.nextReviewAt.getTime();
    })
    .map((f) => f.id);
}

/**
 * Default progress for a new fact (never reviewed).
 */
export function createDefaultProgress(): FactProgress {
  return {
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    nextReviewAt: new Date(), // Due immediately
    lastReviewedAt: new Date(),
    masteryLevel: 0,
    timesCorrect: 0,
    timesIncorrect: 0,
  };
}
