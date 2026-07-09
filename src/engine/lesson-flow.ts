/**
 * Lesson Flow State Machine
 *
 * Chunked learning with mini-quizzes:
 * GREETING → OVERVIEW → [TEACH chunk of 3 → MINI-QUIZ] × N → QUIZ (due facts) → REVIEW → RECAP → COMPLETE
 *
 * Teach phase is listen-only (no user recall). Quiz tests recall.
 */

export type LessonPhase = "intro" | "greeting" | "overview" | "teach" | "quiz" | "review" | "recap" | "complete";

export const MAX_REVIEW_ATTEMPTS = 2;
export const CHUNK_SIZE = 3;

export interface FlowAction {
  phase: LessonPhase;
  factId?: string;
  requiresResponse: boolean;
}

export interface LessonFlowState {
  // New facts — chunked teaching
  factsToTeach: string[];
  teachIndex: number;
  chunkQuizQueue: string[];   // facts taught in current chunk, pending quiz
  chunkQuizIndex: number;     // position in current mini-quiz
  lastChunkFacts: string[];   // fact IDs from the most recently completed chunk (for synthesis)

  // Due facts — returning review
  factsToQuiz: string[];
  quizIndex: number;

  // Results
  factsCorrect: string[];
  factsMissed: string[];
  reviewAttempts: Record<string, number>;

  // Phase flags
  greetingDone: boolean;
  overviewDone: boolean;
  recapDone: boolean;

  durationMinutes: number;
}

export function createInitialFlowState(
  factsToTeach: string[],
  factsToQuiz: string[],
  durationMinutes: number = 15
): LessonFlowState {
  return {
    factsToTeach,
    factsToQuiz,
    teachIndex: 0,
    chunkQuizQueue: [],
    chunkQuizIndex: 0,
    lastChunkFacts: [],
    quizIndex: 0,
    factsCorrect: [],
    factsMissed: [],
    reviewAttempts: {},
    greetingDone: false,
    overviewDone: false,
    recapDone: false,
    durationMinutes,
  };
}

export function getNextAction(state: LessonFlowState): FlowAction {
  // 1. Greeting
  if (!state.greetingDone) {
    return { phase: "greeting", requiresResponse: false };
  }

  // 2. Overview (only if there are new facts)
  if (!state.overviewDone && state.factsToTeach.length > 0) {
    return { phase: "overview", requiresResponse: false };
  }

  // 3. Chunk-based teaching + mini-quizzes
  const chunkIsFull = state.chunkQuizQueue.length >= CHUNK_SIZE;
  const allTaught = state.teachIndex >= state.factsToTeach.length;
  const hasPendingQuiz = state.chunkQuizIndex < state.chunkQuizQueue.length;

  // Mini-quiz: chunk is full, or all facts taught and some still unquizzed
  if (hasPendingQuiz && (chunkIsFull || allTaught)) {
    return {
      phase: "quiz",
      factId: state.chunkQuizQueue[state.chunkQuizIndex],
      requiresResponse: true,
    };
  }

  // Still have facts to teach
  if (state.teachIndex < state.factsToTeach.length) {
    return {
      phase: "teach",
      factId: state.factsToTeach[state.teachIndex],
      requiresResponse: false,
    };
  }

  // 4. Quiz due facts (previously learned, now due for review)
  if (state.quizIndex < state.factsToQuiz.length) {
    return {
      phase: "quiz",
      factId: state.factsToQuiz[state.quizIndex],
      requiresResponse: true,
    };
  }

  // 5. Review missed facts (with attempt cap)
  const reviewable = state.factsMissed.filter(
    (id) => (state.reviewAttempts[id] ?? 0) < MAX_REVIEW_ATTEMPTS
  );
  if (reviewable.length > 0) {
    return {
      phase: "review",
      factId: reviewable[0],
      requiresResponse: true,
    };
  }

  // 6. Recap
  if (!state.recapDone) {
    return { phase: "recap", requiresResponse: false };
  }

  // 7. Complete
  return { phase: "complete", requiresResponse: false };
}

export function markGreetingDone(state: LessonFlowState): LessonFlowState {
  return { ...state, greetingDone: true };
}

export function markOverviewDone(state: LessonFlowState): LessonFlowState {
  return { ...state, overviewDone: true };
}

export function markTeachDone(state: LessonFlowState, factId: string): LessonFlowState {
  return {
    ...state,
    teachIndex: state.teachIndex + 1,
    chunkQuizQueue: [...state.chunkQuizQueue, factId],
  };
}

export function markRecapDone(state: LessonFlowState): LessonFlowState {
  return { ...state, recapDone: true };
}

export function markFactResult(
  state: LessonFlowState,
  factId: string,
  correct: boolean
): LessonFlowState {
  const newState = { ...state, reviewAttempts: { ...state.reviewAttempts } };

  if (correct) {
    newState.factsCorrect = [...state.factsCorrect, factId];
    newState.factsMissed = state.factsMissed.filter((id) => id !== factId);
  } else {
    const attempts = (state.reviewAttempts[factId] ?? 0) + 1;
    newState.reviewAttempts[factId] = attempts;

    if (attempts >= MAX_REVIEW_ATTEMPTS) {
      newState.factsMissed = state.factsMissed.filter((id) => id !== factId);
    } else if (!state.factsMissed.includes(factId)) {
      newState.factsMissed = [...state.factsMissed, factId];
    } else {
      newState.factsMissed = [...state.factsMissed.filter((id) => id !== factId), factId];
    }
  }

  // Advance the appropriate index
  if (
    state.chunkQuizIndex < state.chunkQuizQueue.length &&
    state.chunkQuizQueue[state.chunkQuizIndex] === factId
  ) {
    newState.chunkQuizIndex = state.chunkQuizIndex + 1;
    // Mini-quiz complete — save completed chunk facts, then reset for next chunk
    if (newState.chunkQuizIndex >= state.chunkQuizQueue.length) {
      newState.lastChunkFacts = [...state.chunkQuizQueue];
      newState.chunkQuizQueue = [];
      newState.chunkQuizIndex = 0;
    }
  } else if (
    state.quizIndex < state.factsToQuiz.length &&
    state.factsToQuiz[state.quizIndex] === factId
  ) {
    newState.quizIndex = state.quizIndex + 1;
  }

  return newState;
}
