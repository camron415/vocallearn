import type { FactAssessment, FactLearningProfile, FactLearningOutcome } from "@/types/teaching";

export function createDefaultLearningProfile(): FactLearningProfile {
  return {
    lastOutcome: null,
    lastQualityScore: null,
    hintsUsedOnLastAttempt: 0,
    revealedOnLastAttempt: false,
    revealRepeatQuality: null,
    needsReteach: false,
    nextReteachStrategy: "reword_same_lens",
    outcomeCounts: {},
  };
}

export function mergeLearningProfile(
  existing: FactLearningProfile | null | undefined,
  assessment: FactAssessment
): FactLearningProfile {
  const profile = existing ?? createDefaultLearningProfile();
  const nextCount = (outcome: FactLearningOutcome): number =>
    (profile.outcomeCounts[outcome] ?? 0) + 1;

  return {
    lastOutcome: assessment.outcome,
    lastQualityScore: assessment.qualityScore,
    hintsUsedOnLastAttempt: assessment.hintsUsed,
    revealedOnLastAttempt: assessment.revealedAnswer,
    revealRepeatQuality: assessment.revealRepeatQuality,
    needsReteach: assessment.needsReteach,
    nextReteachStrategy: assessment.shouldUseAlternateLensNextReview
      ? "alternate_lens"
      : "reword_same_lens",
    outcomeCounts: {
      ...profile.outcomeCounts,
      [assessment.outcome]: nextCount(assessment.outcome),
    },
  };
}

export function getAssessmentSchedulingQuality(assessment: FactAssessment): number {
  if (assessment.revealedAnswer) return 0;

  switch (assessment.outcome) {
    case "correct_first_try":
      return Math.max(4, assessment.qualityScore);
    case "correct_with_missing_context":
      return 3;
    case "correct_after_hint_1":
      return 3;
    case "correct_after_hint_2":
      return 2;
    case "close_but_off":
      return 1;
    case "no_answer":
      return 0;
    case "revealed_repeat_strong":
    case "revealed_repeat_partial":
    case "revealed_repeat_failed":
      return 0;
    default:
      return Math.max(0, Math.min(5, assessment.qualityScore));
  }
}

export interface ProgressClampInput {
  intervalDays: number;
  repetitions: number;
  masteryLevel: number;
}

export function clampProgressAfterAssessment(
  progress: ProgressClampInput,
  assessment: FactAssessment
): ProgressClampInput {
  if (assessment.revealedAnswer || assessment.outcome === "no_answer") {
    return {
      intervalDays: 1,
      repetitions: 0,
      masteryLevel: Math.min(progress.masteryLevel, 1),
    };
  }

  if (assessment.outcome === "close_but_off") {
    return {
      intervalDays: 1,
      repetitions: 0,
      masteryLevel: Math.min(progress.masteryLevel, 1),
    };
  }

  if (assessment.outcome === "correct_after_hint_2") {
    return {
      intervalDays: Math.min(progress.intervalDays, 1),
      repetitions: Math.min(progress.repetitions, 1),
      masteryLevel: Math.min(progress.masteryLevel, 2),
    };
  }

  if (assessment.outcome === "correct_after_hint_1") {
    return {
      intervalDays: Math.min(progress.intervalDays, 2),
      repetitions: Math.min(progress.repetitions, 1),
      masteryLevel: Math.min(progress.masteryLevel, 3),
    };
  }

  if (assessment.outcome === "correct_with_missing_context") {
    return {
      intervalDays: Math.min(progress.intervalDays, 3),
      repetitions: progress.repetitions,
      masteryLevel: Math.min(progress.masteryLevel, 3),
    };
  }

  return progress;
}
