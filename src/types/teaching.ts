export type TeachingFrameType =
  | "analogy"
  | "checklist"
  | "map"
  | "pipeline"
  | "contrast"
  | "story"
  | "operating_model";

export type FactComplexity = "simple" | "moderate" | "dense" | "high_precision";

export type HintStrategy =
  | "context_then_contrast"
  | "analogy_then_context"
  | "checklist_then_contrast"
  | "mechanism_then_example"
  | "contrast_then_example";

export type ReteachStrategy = "reword_same_lens" | "alternate_lens";

export interface LessonTeachingPlan {
  frameType: TeachingFrameType;
  frameLabel: string;
  frameDescription: string;
  frameKeywords: string[];
}

export interface FactTeachingPlan {
  complexity: FactComplexity;
  teachingPasses: 1 | 2;
  hintStrategy: HintStrategy;
  initialReteachStrategy: ReteachStrategy;
  memoryHooks: string[];
  expectedRecallDepth: "core_meaning" | "key_distinction" | "precise_wording";
}

export type FactLearningOutcome =
  | "correct_first_try"
  | "correct_with_missing_context"
  | "close_but_off"
  | "correct_after_hint_1"
  | "correct_after_hint_2"
  | "revealed_repeat_strong"
  | "revealed_repeat_partial"
  | "revealed_repeat_failed"
  | "no_answer";

export interface FactAssessment {
  outcome: FactLearningOutcome;
  qualityScore: number;
  wasCorrectForFlow: boolean;
  hintsUsed: 0 | 1 | 2;
  revealedAnswer: boolean;
  revealRepeatQuality: 0 | 1 | 2 | 3 | 4 | 5 | null;
  needsReteach: boolean;
  shouldUseAlternateLensNextReview: boolean;
}

export interface FactLearningProfile {
  lastOutcome: FactLearningOutcome | null;
  lastQualityScore: number | null;
  hintsUsedOnLastAttempt: 0 | 1 | 2;
  revealedOnLastAttempt: boolean;
  revealRepeatQuality: number | null;
  needsReteach: boolean;
  nextReteachStrategy: ReteachStrategy;
  outcomeCounts: Partial<Record<FactLearningOutcome, number>>;
}
