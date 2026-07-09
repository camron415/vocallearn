export interface SessionState {
  phase: "idle" | "listening" | "processing" | "speaking" | "waiting";
  currentFactIndex: number;
  totalFacts: number;
  correctCount: number;
  incorrectCount: number;
  startTime: number;
  elapsedSeconds: number;
}
