import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LessonFlowState } from "@/engine/lesson-flow";

export type SessionEntryMode = "lesson" | "review";

export const DEFAULT_REVIEW_FACT_LIMIT = 15;

interface SessionState {
  isActive: boolean;
  lessonId: string | null;
  sessionMode: SessionEntryMode | null;
  queueLessonIds: string[];
  reviewStartIndex: number;
  reviewFactLimit: number;
  startedAt: string | null;
  flowState: LessonFlowState | null;
  currentFactId: string | null;
  startSession: (session: {
    lessonId: string;
    sessionMode: SessionEntryMode;
    queueLessonIds?: string[];
    reviewStartIndex?: number;
    reviewFactLimit?: number;
    flowState?: LessonFlowState | null;
    currentFactId?: string | null;
  }) => void;
  updateSession: (session: Partial<Pick<SessionState, "lessonId" | "sessionMode" | "queueLessonIds" | "reviewStartIndex" | "reviewFactLimit" | "flowState" | "currentFactId">>) => void;
  endSession: () => void;
  updateFlowState: (flowState: LessonFlowState) => void;
  setCurrentFact: (factId: string | null) => void;
}

export function buildSessionHref(
  lessonId: string,
  sessionMode: SessionEntryMode,
  options: {
    queueLessonIds?: string[];
    reviewStartIndex?: number;
    reviewFactLimit?: number;
  } = {}
): string {
  const {
    queueLessonIds = [],
    reviewStartIndex = 0,
    reviewFactLimit = DEFAULT_REVIEW_FACT_LIMIT,
  } = options;
  const params = [`mode=${sessionMode}`];

  if (sessionMode === "review" && queueLessonIds.length > 0) {
    params.push(`queue=${encodeURIComponent(queueLessonIds.join(","))}`);
  }

  if (sessionMode === "review") {
    if (reviewStartIndex > 0) {
      params.push(`reviewStart=${reviewStartIndex}`);
    }
    if (reviewFactLimit !== DEFAULT_REVIEW_FACT_LIMIT) {
      params.push(`reviewLimit=${reviewFactLimit}`);
    }
  }

  return `/session/${lessonId}?${params.join("&")}`;
}

const initialState = {
  isActive: false,
  lessonId: null,
  sessionMode: null,
  queueLessonIds: [],
  reviewStartIndex: 0,
  reviewFactLimit: DEFAULT_REVIEW_FACT_LIMIT,
  startedAt: null,
  flowState: null,
  currentFactId: null,
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      ...initialState,

      startSession: ({
        lessonId,
        sessionMode,
        queueLessonIds = [],
        reviewStartIndex = 0,
        reviewFactLimit = DEFAULT_REVIEW_FACT_LIMIT,
        flowState = null,
        currentFactId = null,
      }) =>
        set({
          isActive: true,
          lessonId,
          sessionMode,
          queueLessonIds,
          reviewStartIndex,
          reviewFactLimit,
          startedAt: new Date().toISOString(),
          flowState,
          currentFactId,
        }),

      updateSession: (session) => set((state) => ({ ...state, ...session })),

      endSession: () => set({ ...initialState }),

      updateFlowState: (flowState) => set({ flowState }),

      setCurrentFact: (currentFactId) => set({ currentFactId }),
    }),
    {
      name: "vocallearn-active-session",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isActive: state.isActive,
        lessonId: state.lessonId,
        sessionMode: state.sessionMode,
        queueLessonIds: state.queueLessonIds,
        reviewStartIndex: state.reviewStartIndex,
        reviewFactLimit: state.reviewFactLimit,
        startedAt: state.startedAt,
        flowState: state.flowState,
        currentFactId: state.currentFactId,
      }),
    }
  )
);
