/**
 * VocalLearn Automated Test Runner
 *
 * Tests all pure engine functions + AI scoring quality.
 * Writes JSON reports to debug-logs/test-runs/.
 *
 * Usage (via run-tests.sh):
 *   ./scripts/run-tests.sh            # Run all tests once (including API)
 *   ./scripts/run-tests.sh --no-api   # Skip Grok API scoring tests
 *   ./scripts/run-tests.sh --loop     # Loop unit tests overnight (no API)
 */

import * as fs from "fs";
import * as path from "path";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
  data?: Record<string, unknown>;
}

interface SuiteResult {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  durationMs: number;
}

interface RunReport {
  runId: string;
  timestamp: string;
  mode: string;
  loopIteration: number;
  totalPassed: number;
  totalFailed: number;
  durationMs: number;
  suites: SuiteResult[];
}

// ── Assertion helpers ─────────────────────────────────────────────────────────

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, label?: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label ?? "assertEqual"}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`
    );
  }
}

function assertInRange(value: number, min: number, max: number, label?: string): void {
  if (value < min || value > max) {
    throw new Error(
      `${label ?? "assertInRange"}: got ${value}, expected [${min}, ${max}]`
    );
  }
}

function assertGte(actual: number, expected: number, label?: string): void {
  if (actual < expected) {
    throw new Error(`${label ?? "assertGte"}: got ${actual}, expected >= ${expected}`);
  }
}

function assertLte(actual: number, expected: number, label?: string): void {
  if (actual > expected) {
    throw new Error(`${label ?? "assertLte"}: got ${actual}, expected <= ${expected}`);
  }
}

// ── Console colors ────────────────────────────────────────────────────────────

const C = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
};

// ── Test runner core ──────────────────────────────────────────────────────────

type TestFn = () => unknown | Promise<unknown>;

async function runSuite(
  name: string,
  tests: Array<{ name: string; fn: TestFn }>
): Promise<SuiteResult> {
  console.log(C.bold(C.cyan(`\n── ${name} ─────────────────────────────`)));
  const results: TestResult[] = [];
  const suiteStart = Date.now();

  for (const test of tests) {
    const t0 = Date.now();
    let passed = false;
    let error: string | undefined;
    let data: Record<string, unknown> | undefined;

    try {
      const result = await test.fn();
      if (result && typeof result === "object") data = result as Record<string, unknown>;
      passed = true;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }

    const durationMs = Date.now() - t0;
    const icon = passed ? C.green("✓") : C.red("✗");
    const errStr = error ? C.red(` — ${error}`) : "";
    console.log(`  ${icon} ${test.name}${errStr} ${C.dim(`(${durationMs}ms)`)}`);

    results.push({ name: test.name, passed, error, durationMs, data });
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  const durationMs = Date.now() - suiteStart;
  const summary = `${passed}/${results.length} passed`;
  console.log(failed === 0 ? C.green(`  ${summary}`) : C.red(`  ${summary}`));

  return { name, tests: results, passed, failed, durationMs };
}

// ── Sleep helper ──────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ════════════════════════════════════════════════════════════════════════════
// SUITE 1: SM-2 Spaced Repetition
// ════════════════════════════════════════════════════════════════════════════

import { calculateNextReview, getFactMemoryState, sortFactsByPriority } from "@/engine/spaced-repetition";
import type { FactProgress } from "@/engine/spaced-repetition";

function freshProgress(): FactProgress {
  const now = new Date();
  return {
    easeFactor: 2.5,
    intervalDays: 1,
    repetitions: 0,
    nextReviewAt: now,
    lastReviewedAt: now,
    masteryLevel: 0,
    timesCorrect: 0,
    timesIncorrect: 0,
  };
}

function buildSm2Suite() {
  return [
    {
      name: "Quality 5 on fresh fact → rep=1, interval=1, EF≈2.6",
      fn: () => {
        const r = calculateNextReview(freshProgress(), { quality: 5 });
        assertEqual(r.repetitions, 1, "reps");
        assertEqual(r.intervalDays, 1, "interval");
        assertInRange(r.easeFactor, 2.59, 2.61, "EF");
        assertInRange(r.timesCorrect, 1, 1, "timesCorrect");
        assertEqual(r.timesIncorrect, 0, "timesIncorrect");
      },
    },
    {
      name: "Quality 4 on fresh fact → rep=1, interval=1, EF≈2.5",
      fn: () => {
        const r = calculateNextReview(freshProgress(), { quality: 4 });
        assertEqual(r.repetitions, 1, "reps");
        assertEqual(r.intervalDays, 1, "interval");
        assertInRange(r.easeFactor, 2.49, 2.51, "EF");
      },
    },
    {
      name: "Quality 3 on fresh fact → rep=1, interval=1, EF decreases slightly",
      fn: () => {
        const r = calculateNextReview(freshProgress(), { quality: 3 });
        assertEqual(r.repetitions, 1, "reps");
        assertEqual(r.intervalDays, 1, "interval");
        assertInRange(r.easeFactor, 2.35, 2.37, "EF");
      },
    },
    {
      name: "Quality 2 (incorrect) on fresh fact → rep=0, interval=1",
      fn: () => {
        const r = calculateNextReview(freshProgress(), { quality: 2 });
        assertEqual(r.repetitions, 0, "reps should reset");
        assertEqual(r.intervalDays, 1, "interval");
        assertEqual(r.timesIncorrect, 1, "timesIncorrect");
        assertEqual(r.timesCorrect, 0, "timesCorrect");
      },
    },
    {
      name: "Quality 0 on fresh fact → rep=0, interval=1, EF≈1.7",
      fn: () => {
        const r = calculateNextReview(freshProgress(), { quality: 0 });
        assertEqual(r.repetitions, 0, "reps");
        assertEqual(r.intervalDays, 1, "interval");
        assertInRange(r.easeFactor, 1.69, 1.71, "EF");
        assertEqual(r.timesIncorrect, 1, "timesIncorrect");
      },
    },
    {
      name: "Two quality-5 reviews → interval=3 on second",
      fn: () => {
        const p1 = calculateNextReview(freshProgress(), { quality: 5 });
        const p2 = calculateNextReview(p1, { quality: 5 });
        assertEqual(p2.repetitions, 2, "reps");
        assertEqual(p2.intervalDays, 3, "interval=3 on rep 2");
      },
    },
    {
      name: "Three quality-5 reviews → interval=7 on third",
      fn: () => {
        const p1 = calculateNextReview(freshProgress(), { quality: 5 });
        const p2 = calculateNextReview(p1, { quality: 5 });
        const p3 = calculateNextReview(p2, { quality: 5 });
        assertEqual(p3.repetitions, 3, "reps");
        assertEqual(p3.intervalDays, 7, "interval");
      },
    },
    {
      name: "EF never drops below 1.3",
      fn: () => {
        let p = freshProgress();
        for (let i = 0; i < 20; i++) {
          p = calculateNextReview(p, { quality: 0 });
        }
        assertGte(p.easeFactor, 1.3, "EF floor");
      },
    },
    {
      name: "Interval always >= 1",
      fn: () => {
        let p = freshProgress();
        for (let i = 0; i < 20; i++) {
          p = calculateNextReview(p, { quality: 0 });
          assertGte(p.intervalDays, 1, `interval after ${i + 1} failures`);
        }
      },
    },
    {
      name: "masteryLevel always in [0, 5]",
      fn: () => {
        let p = freshProgress();
        for (let q = 0; q <= 5; q++) {
          for (let i = 0; i < 10; i++) {
            p = calculateNextReview(freshProgress(), { quality: q });
            assertInRange(p.masteryLevel, 0, 5, `mastery at quality ${q}`);
          }
        }
      },
    },
    {
      name: "Well-learned fact (rep≥5) + quality 0 → interval shrinks but does not fully reset",
      fn: () => {
        let p = freshProgress();
        // Build up to rep=5 with quality 5
        for (let i = 0; i < 5; i++) {
          p = calculateNextReview(p, { quality: 5 });
        }
        const intervalBefore = p.intervalDays;
        const repsBefore = p.repetitions;
        assertGte(repsBefore, 5, "reps before");
        assertGte(intervalBefore, 10, "interval before (should be significant)");

        const r = calculateNextReview(p, { quality: 0 });
        assertEqual(r.repetitions, 0, "reps reset");
        const expected = Math.max(3, Math.round(intervalBefore * 0.35));
        assertEqual(r.intervalDays, expected, "smart interval reduction");
        // Crucially, it should NOT be 1 (dumb reset)
        assertGte(r.intervalDays, 3, "interval >= 3 for well-learned fact");
      },
    },
    {
      name: "Moderately-learned fact (rep≥3) + quality 0 → interval drops to a short relearn step",
      fn: () => {
        let p = freshProgress();
        for (let i = 0; i < 3; i++) {
          p = calculateNextReview(p, { quality: 5 });
        }
        const intervalBefore = p.intervalDays;
        const r = calculateNextReview(p, { quality: 0 });
        const expected = Math.max(2, Math.round(intervalBefore * 0.25));
        assertEqual(r.intervalDays, expected, "25% reduction for rep≥3");
      },
    },
    {
      name: "Late correct recall is rewarded conservatively when the review is very overdue",
      fn: () => {
        const twentyOneDaysAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const p: FactProgress = {
          ...freshProgress(),
          easeFactor: 2.7,
          intervalDays: 7,
          repetitions: 3,
          nextReviewAt: oneWeekAgo,
          lastReviewedAt: twentyOneDaysAgo,
          masteryLevel: 3,
          timesCorrect: 3,
          timesIncorrect: 0,
        };

        const r = calculateNextReview(p, { quality: 5 });
        assertEqual(r.repetitions, 4, "reps increment");
        assertEqual(r.intervalDays, 16, "overdue success should not explode the interval");
        assertLte(r.easeFactor, 2.61, "ease factor reflects overdue penalty");
      },
    },
    {
      name: "Mastery increases with consecutive correct answers",
      fn: () => {
        let p = freshProgress();
        const m0 = p.masteryLevel;
        for (let i = 0; i < 5; i++) {
          p = calculateNextReview(p, { quality: 5 });
        }
        assertGte(p.masteryLevel, m0, "mastery should increase");
        assertGte(p.masteryLevel, 3, "mastery >= 3 after 5 perfect reviews");
      },
    },
    {
      name: "sortFactsByPriority: overdue facts come before new facts",
      fn: () => {
        const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();

        const facts = [
          {
            id: "new-fact",
            progress: null, // new fact
          },
          {
            id: "future-fact",
            progress: {
              ...freshProgress(),
              nextReviewAt: future,
              lastReviewedAt: past,
            },
          },
          {
            id: "overdue-fact",
            progress: {
              ...freshProgress(),
              nextReviewAt: past,
              lastReviewedAt: past,
              masteryLevel: 2,
            },
          },
        ];

        const sorted = sortFactsByPriority(facts);
        // overdue should come before new, which should come before future
        const overdueIdx = sorted.indexOf("overdue-fact");
        const newIdx = sorted.indexOf("new-fact");
        assert(overdueIdx < newIdx, "overdue before new");
      },
    },
    {
      name: "Memory states reflect urgency and long-term stability",
      fn: () => {
        const now = new Date();
        const overdue = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        const future = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

        assertEqual(getFactMemoryState(null, now), "new", "null progress state");
        assertEqual(
          getFactMemoryState({
            ...freshProgress(),
            repetitions: 1,
            timesCorrect: 1,
            nextReviewAt: future,
          }, now),
          "learning",
          "freshly learned state"
        );
        assertEqual(
          getFactMemoryState({
            ...freshProgress(),
            repetitions: 3,
            intervalDays: 7,
            masteryLevel: 3,
            timesCorrect: 3,
            nextReviewAt: future,
          }, now),
          "review",
          "review state"
        );
        assertEqual(
          getFactMemoryState({
            ...freshProgress(),
            repetitions: 5,
            intervalDays: 14,
            masteryLevel: 4,
            timesCorrect: 8,
            nextReviewAt: future,
          }, now),
          "solid",
          "solid state"
        );
        assertEqual(
          getFactMemoryState({
            ...freshProgress(),
            repetitions: 6,
            intervalDays: 30,
            masteryLevel: 5,
            timesCorrect: 10,
            nextReviewAt: future,
          }, now),
          "mastered",
          "mastered state"
        );
        assertEqual(
          getFactMemoryState({
            ...freshProgress(),
            repetitions: 4,
            intervalDays: 7,
            masteryLevel: 4,
            timesCorrect: 6,
            nextReviewAt: overdue,
          }, now),
          "at_risk",
          "overdue state"
        );
      },
    },
    {
      name: "All quality scores produce valid output (exhaustive invariants)",
      fn: () => {
        const qualities = [0, 1, 2, 3, 4, 5];
        const startReps = [0, 1, 2, 3, 5, 10];
        const startEFs = [1.3, 2.0, 2.5, 3.0];

        for (const q of qualities) {
          for (const reps of startReps) {
            for (const ef of startEFs) {
              const p: FactProgress = {
                ...freshProgress(),
                repetitions: reps,
                easeFactor: ef,
                intervalDays: reps === 0 ? 1 : reps <= 1 ? 6 : 30,
              };
              const r = calculateNextReview(p, { quality: q });

              // Universal invariants
              assertGte(r.easeFactor, 1.3, `EF floor at q=${q},reps=${reps},ef=${ef}`);
              assertGte(r.intervalDays, 1, `interval>=1 at q=${q},reps=${reps}`);
              assertInRange(r.masteryLevel, 0, 5, `mastery at q=${q},reps=${reps}`);

              if (q >= 3) {
                assertGte(r.timesCorrect, p.timesCorrect + 1, `timesCorrect at q=${q}`);
              } else {
                assertEqual(r.repetitions, 0, `reps reset at q=${q},reps=${reps}`);
                assertGte(r.timesIncorrect, p.timesIncorrect + 1, `timesIncorrect at q=${q}`);
              }
            }
          }
        }
      },
    },
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// SUITE 2: Lesson Flow State Machine
// ════════════════════════════════════════════════════════════════════════════

import {
  createInitialFlowState,
  getNextAction,
  markGreetingDone,
  markOverviewDone,
  markTeachDone,
  markRecapDone,
  markFactResult,
  MAX_REVIEW_ATTEMPTS,
  CHUNK_SIZE,
} from "@/engine/lesson-flow";
import type { LessonFlowState } from "@/engine/lesson-flow";

/** Drive the state machine to completion and return the ordered phase sequence. */
function simulateSession(
  factsToTeach: string[],
  factsToQuiz: string[],
  /** Return true = correct answer, false = wrong */
  onQuiz: (factId: string, attempt: number) => boolean,
  maxIter = 300
): { phases: string[]; completed: boolean; error?: string } {
  let state = createInitialFlowState(factsToTeach, factsToQuiz);
  const phases: string[] = [];
  const attemptCounts: Record<string, number> = {};

  for (let i = 0; i < maxIter; i++) {
    const action = getNextAction(state);
    const label = action.factId ? `${action.phase}(${action.factId})` : action.phase;
    phases.push(label);

    if (action.phase === "complete") return { phases, completed: true };

    if (action.phase === "greeting") {
      state = markGreetingDone(state);
    } else if (action.phase === "overview") {
      state = markOverviewDone(state);
    } else if (action.phase === "teach" && action.factId) {
      state = markTeachDone(state, action.factId);
    } else if (action.phase === "recap") {
      state = markRecapDone(state);
    } else if ((action.phase === "quiz" || action.phase === "review") && action.factId) {
      attemptCounts[action.factId] = (attemptCounts[action.factId] ?? 0) + 1;
      const correct = onQuiz(action.factId, attemptCounts[action.factId]);
      state = markFactResult(state, action.factId, correct);
    }
  }

  return { phases, completed: false, error: `Did not complete after ${maxIter} iterations` };
}

function buildFlowSuite() {
  return [
    {
      name: "Empty session (0 teach, 0 quiz) → greeting → recap → complete",
      fn: () => {
        const r = simulateSession([], [], () => true);
        assert(r.completed, r.error ?? "not completed");
        assert(r.phases.includes("greeting"), "greeting visited");
        assert(r.phases.includes("recap"), "recap visited");
        assertEqual(r.phases[r.phases.length - 1], "complete", "ends complete");
        assert(!r.phases.includes("overview"), "no overview for 0 new facts");
      },
    },
    {
      name: "1 teach fact → overview appears, teach before quiz",
      fn: () => {
        const r = simulateSession(["f1"], [], () => true);
        assert(r.completed, r.error ?? "not completed");
        assert(r.phases.includes("overview"), "overview visited");
        const teachIdx = r.phases.indexOf("teach(f1)");
        const quizIdx = r.phases.indexOf("quiz(f1)");
        assert(teachIdx >= 0, "teach visited");
        assert(quizIdx >= 0, "quiz visited");
        assert(teachIdx < quizIdx, "teach before quiz");
      },
    },
    {
      name: `${CHUNK_SIZE} teach facts → mini-quiz fires after full chunk`,
      fn: () => {
        const facts = Array.from({ length: CHUNK_SIZE }, (_, i) => `f${i}`);
        const r = simulateSession(facts, [], () => true);
        assert(r.completed, r.error ?? "not completed");
        // All facts should be taught and quizzed
        for (const f of facts) {
          assert(r.phases.some((p) => p === `teach(${f})`), `teach(${f}) visited`);
          assert(r.phases.some((p) => p === `quiz(${f})`), `quiz(${f}) visited`);
        }
        // All teaches should happen before the first quiz
        const lastTeachIdx = Math.max(...facts.map((f) => r.phases.lastIndexOf(`teach(${f})`)));
        const firstQuizIdx = Math.min(...facts.map((f) => r.phases.indexOf(`quiz(${f})`)));
        assert(lastTeachIdx < firstQuizIdx, "all teaches complete before mini-quiz starts");
      },
    },
    {
      name: "4 teach facts → first chunk quizzed before 4th fact is taught",
      fn: () => {
        const r = simulateSession(["f0", "f1", "f2", "f3"], [], () => true);
        assert(r.completed, r.error ?? "not completed");
        // f3 is taught in the 2nd chunk, so quiz(f0/f1/f2) should appear before teach(f3)
        const quizF2Idx = r.phases.indexOf("quiz(f2)");
        const teachF3Idx = r.phases.indexOf("teach(f3)");
        assert(quizF2Idx >= 0 && teachF3Idx >= 0, "both phases present");
        assert(quizF2Idx < teachF3Idx, "chunk quiz completes before 4th fact is taught");
      },
    },
    {
      name: "Quiz-only session (no new facts) → no overview, direct quiz",
      fn: () => {
        const r = simulateSession([], ["q1", "q2"], () => true);
        assert(r.completed, r.error ?? "not completed");
        assert(!r.phases.includes("overview"), "no overview");
        assert(!r.phases.some((p) => p.startsWith("teach")), "no teach phase");
        assert(r.phases.includes("quiz(q1)"), "q1 quizzed");
        assert(r.phases.includes("quiz(q2)"), "q2 quizzed");
      },
    },
    {
      name: "Incorrect quiz answer → fact enters review",
      fn: () => {
        const r = simulateSession([], ["q1"], () => false); // always wrong
        assert(r.completed, r.error ?? "not completed");
        assert(r.phases.some((p) => p === "review(q1)"), "q1 enters review");
      },
    },
    {
      name: `Review attempt cap: after ${MAX_REVIEW_ATTEMPTS} misses, fact is dropped and session completes`,
      fn: () => {
        const r = simulateSession([], ["q1"], () => false);
        assert(r.completed, r.error ?? "not completed");
        const reviewCount = r.phases.filter((p) => p === "review(q1)").length;
        assertLte(reviewCount, MAX_REVIEW_ATTEMPTS, `review capped at ${MAX_REVIEW_ATTEMPTS}`);
      },
    },
    {
      name: "Correct answer on review removes fact from missed list",
      fn: () => {
        let firstAttempt = true;
        const r = simulateSession([], ["q1"], () => {
          if (firstAttempt) { firstAttempt = false; return false; } // fail quiz
          return true; // pass review
        });
        assert(r.completed, r.error ?? "not completed");
        // Should have exactly 1 review attempt since it was correct on review
        const reviewCount = r.phases.filter((p) => p === "review(q1)").length;
        assertEqual(reviewCount, 1, "exactly 1 review (correct on review stops retries)");
      },
    },
    {
      name: "Mixed session: 5 teach + 3 quiz + some missed → always completes",
      fn: () => {
        let callCount = 0;
        const r = simulateSession(
          ["t1", "t2", "t3", "t4", "t5"],
          ["q1", "q2", "q3"],
          () => { callCount++; return callCount % 3 !== 0; } // every 3rd wrong
        );
        assert(r.completed, r.error ?? "not completed");
        assert(r.phases[r.phases.length - 1] === "complete", "ends on complete");
      },
    },
    {
      name: "1000 random sessions — state machine always terminates",
      fn: () => {
        const rng = mulberry32(42); // deterministic RNG

        for (let i = 0; i < 1000; i++) {
          const numTeach = Math.floor(rng() * 10);
          const numQuiz = Math.floor(rng() * 5);
          const teach = Array.from({ length: numTeach }, (_, j) => `t${j}`);
          const quiz = Array.from({ length: numQuiz }, (_, j) => `q${j}`);

          const r = simulateSession(teach, quiz, () => rng() > 0.5);
          assert(
            r.completed,
            `Session ${i} did not complete (teach=${numTeach}, quiz=${numQuiz}): ${r.error}`
          );
        }
      },
    },
    {
      name: "Phase order invariant: greeting always first, complete always last",
      fn: () => {
        const rng = mulberry32(99);
        for (let i = 0; i < 200; i++) {
          const numTeach = Math.floor(rng() * 6);
          const numQuiz = Math.floor(rng() * 4);
          const teach = Array.from({ length: numTeach }, (_, j) => `t${j}`);
          const quiz = Array.from({ length: numQuiz }, (_, j) => `q${j}`);
          const r = simulateSession(teach, quiz, () => rng() > 0.4);

          if (!r.completed) continue;
          assertEqual(r.phases[0], "greeting", `session ${i}: first phase`);
          assertEqual(r.phases[r.phases.length - 1], "complete", `session ${i}: last phase`);
        }
      },
    },
  ];
}

/** Deterministic 32-bit PRNG (mulberry32) — seeded so tests are reproducible. */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ════════════════════════════════════════════════════════════════════════════
// SUITE 3: STT Cleanup
// ════════════════════════════════════════════════════════════════════════════

import { cleanSttText } from "@/utils/stt-cleanup";

function buildSttSuite() {
  return [
    {
      name: "Empty string returns unchanged",
      fn: () => {
        assertEqual(cleanSttText(""), "", "empty");
        assertEqual(cleanSttText("   "), "   ", "whitespace");
      },
    },
    {
      name: "Filler words are stripped",
      fn: () => {
        const result = cleanSttText("um compound interest uh basically grows exponentially");
        assert(!result.includes("um"), "no 'um'");
        assert(!result.includes("uh"), "no 'uh'");
        assert(!result.includes("basically"), "no 'basically'");
        assert(result.includes("compound interest"), "content preserved");
      },
    },
    {
      name: "'you know' and 'like' fillers removed",
      fn: () => {
        const result = cleanSttText("you know like compound interest is important");
        assert(!result.includes("you know"), "no 'you know'");
        assert(result.includes("compound interest"), "content preserved");
      },
    },
    {
      name: "Spoken punctuation converted to symbols",
      fn: () => {
        const result = cleanSttText("compound interest comma it grows exponentially period");
        assert(result.includes(","), "comma inserted");
        assert(result.includes("."), "period inserted");
        assert(!result.toLowerCase().includes("comma"), "word 'comma' removed");
        assert(!result.toLowerCase().includes("period"), "word 'period' removed");
      },
    },
    {
      name: "Ebbinghaus phonetic substitution",
      fn: () => {
        const variants = [
          "ebb in house",
          "ebbinghaus",
          "ebing house",
        ];
        for (const v of variants) {
          const result = cleanSttText(`the ${v} forgetting curve`);
          assert(
            result.toLowerCase().includes("ebbinghaus"),
            `'${v}' should become 'Ebbinghaus': got '${result}'`
          );
        }
      },
    },
    {
      name: "Number word → digit (single digits)",
      fn: () => {
        const result = cleanSttText("the answer is five percent");
        assert(result.includes("5"), `'five' → '5': got '${result}'`);
      },
    },
    {
      name: "Year number words → digits",
      fn: () => {
        const result = cleanSttText("Ebbinghaus published in nineteen eighty five");
        // "nineteen eighty five" isn't in the list, but "nineteen eighty" → 1980
        // Let's test what IS in the list
        const r2 = cleanSttText("research from nineteen eighty");
        assert(r2.includes("1980"), `'nineteen eighty' → '1980': got '${r2}'`);
      },
    },
    {
      name: "APY/APR acronyms normalized (regex matches 'apy' and 'annual percentage yield')",
      fn: () => {
        // The regex covers: apy, a.p.y, a.p.y., annual percentage yield
        // It does NOT cover "a p y" (spaced letters) — that's a known gap, tested separately below
        const r1 = cleanSttText("the apy is six percent");
        assert(r1.toUpperCase().includes("APY"), `'apy' → APY: got '${r1}'`);
        const r2 = cleanSttText("the annual percentage yield is higher");
        assert(r2.toUpperCase().includes("APY"), `'annual percentage yield' → APY: got '${r2}'`);
      },
    },
    {
      name: "KNOWN GAP: 'a p y' (spaced letters) is NOT matched by current regex",
      fn: () => {
        // STT sometimes outputs "a p y" with spaces. The current regex doesn't cover this.
        // This test documents the known gap (it verifies the gap exists — not a failure).
        const result = cleanSttText("the a p y is six percent");
        // If this ever starts returning "APY", the gap has been fixed and this test can be removed.
        assert(
          !result.toUpperCase().includes("APY"),
          `Unexpected: spaced 'a p y' now matches — update the test`
        );
      },
    },
    {
      name: "Clean text is not mangled (idempotent-ish)",
      fn: () => {
        const clean = "The compound interest grows exponentially over time.";
        const result = cleanSttText(clean);
        // Should preserve core content even if minor formatting changes
        assert(result.includes("compound interest"), "content preserved");
        assert(result.includes("exponentially"), "content preserved");
      },
    },
    {
      name: "Multiple fillers in sequence are all stripped",
      fn: () => {
        const result = cleanSttText("um uh you know like basically compound interest");
        const words = result.trim().split(/\s+/);
        // After stripping, should start with compound or something meaningful
        const fillers = ["um", "uh", "like", "basically"];
        for (const f of fillers) {
          assert(!words.includes(f), `filler '${f}' should be gone`);
        }
        assert(result.includes("compound interest"), "content preserved");
      },
    },
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// SUITE 4: Prompt Building
// ════════════════════════════════════════════════════════════════════════════

import { buildEvaluationPrompt, buildSessionSystemMessage, parseEvaluation } from "@/engine/tutor";
import type { Fact } from "@/types/lesson";
import type { UserFactProgress } from "@/types/lesson";

const SAMPLE_FACT: Fact = {
  id: "fact-abc123",
  lesson_id: "lesson-1",
  content: "Compound interest earns interest on both principal and previously accumulated interest",
  explanation: "Unlike simple interest, compound interest snowballs over time",
  strictness: "low",
  order_index: 0,
  tags: null,
  created_at: "2024-01-01",
};

const SAMPLE_FACT_HIGH: Fact = {
  ...SAMPLE_FACT,
  id: "fact-def456",
  content: "Ebbinghaus found that humans forget approximately 50% of new information within 20 minutes",
  strictness: "high",
};

function buildPromptSuite() {
  return [
    {
      name: "buildEvaluationPrompt: contains fact content",
      fn: () => {
        const msgs = buildEvaluationPrompt(SAMPLE_FACT, "my answer");
        const fullText = msgs.map((m) => m.content).join(" ");
        assert(
          fullText.includes(SAMPLE_FACT.content),
          "Fact content should appear in prompt"
        );
      },
    },
    {
      name: "buildEvaluationPrompt: LOW strictness guide in prompt",
      fn: () => {
        const msgs = buildEvaluationPrompt(SAMPLE_FACT, "my answer");
        const fullText = msgs.map((m) => m.content).join(" ").toUpperCase();
        assert(fullText.includes("LOW"), "LOW strictness guide");
      },
    },
    {
      name: "buildEvaluationPrompt: HIGH strictness guide in prompt",
      fn: () => {
        const msgs = buildEvaluationPrompt(SAMPLE_FACT_HIGH, "my answer");
        const fullText = msgs.map((m) => m.content).join(" ").toUpperCase();
        assert(fullText.includes("HIGH"), "HIGH strictness guide");
      },
    },
    {
      name: "buildEvaluationPrompt: user answer appears in user message",
      fn: () => {
        const answer = "this is my specific answer XYZ";
        const msgs = buildEvaluationPrompt(SAMPLE_FACT, answer);
        const userMsg = msgs.find((m) => m.role === "user");
        assert(userMsg !== undefined, "user message exists");
        assert(userMsg!.content.includes(answer), "answer in user message");
      },
    },
    {
      name: "buildEvaluationPrompt: has system + user messages",
      fn: () => {
        const msgs = buildEvaluationPrompt(SAMPLE_FACT, "answer");
        assert(msgs.length >= 2, "at least 2 messages");
        assert(msgs.some((m) => m.role === "system"), "has system message");
        assert(msgs.some((m) => m.role === "user"), "has user message");
      },
    },
    {
      name: "buildSessionSystemMessage: includes all facts",
      fn: () => {
        const facts = [SAMPLE_FACT, SAMPLE_FACT_HIGH];
        const progress = new Map<string, UserFactProgress>();
        const msg = buildSessionSystemMessage(facts, progress, SAMPLE_FACT, "teach");
        assert(
          msg.includes(SAMPLE_FACT.content.substring(0, 30)),
          "first fact in system message"
        );
        assert(
          msg.includes(SAMPLE_FACT_HIGH.content.substring(0, 30)),
          "second fact in system message"
        );
      },
    },
    {
      name: "buildSessionSystemMessage: includes phase",
      fn: () => {
        const msg = buildSessionSystemMessage([SAMPLE_FACT], new Map(), SAMPLE_FACT, "quiz");
        assert(msg.toLowerCase().includes("quiz"), "phase in message");
      },
    },
    {
      name: "Depth technique is deterministic (same factId → same technique)",
      fn: () => {
        const msg1 = buildSessionSystemMessage([SAMPLE_FACT], new Map(), SAMPLE_FACT, "teach");
        const msg2 = buildSessionSystemMessage([SAMPLE_FACT], new Map(), SAMPLE_FACT, "teach");
        assertEqual(msg1, msg2, "deterministic system message");
      },
    },
    {
      name: "Depth technique varies across different fact IDs",
      fn: () => {
        const factIds = ["aaa", "bbb", "ccc", "ddd", "eee", "fff", "ggg"];
        const techniques = factIds.map((id) => {
          const f = { ...SAMPLE_FACT, id };
          return buildSessionSystemMessage([f], new Map(), f, "teach");
        });
        // At least some messages should differ (7 facts with 7 techniques → should not all be same)
        const unique = new Set(techniques);
        assert(unique.size > 1, "depth techniques should vary across fact IDs");
      },
    },
    {
      name: "parseEvaluation: parses valid JSON correctly",
      fn: () => {
        const raw = '{"score": 4, "feedback": "Great job!", "isCorrect": true}';
        const result = parseEvaluation(raw);
        assertEqual(result.score, 4, "score");
        assertEqual(result.feedback, "Great job!", "feedback");
        assertEqual(result.isCorrect, true, "isCorrect");
      },
    },
    {
      name: "parseEvaluation: handles markdown code fences",
      fn: () => {
        const raw = '```json\n{"score": 3, "feedback": "Close!", "isCorrect": true}\n```';
        const result = parseEvaluation(raw);
        assertEqual(result.score, 3, "score");
        assertEqual(result.isCorrect, true, "isCorrect");
      },
    },
    {
      name: "parseEvaluation: score clamped to [0, 5]",
      fn: () => {
        const r1 = parseEvaluation('{"score": 99, "feedback": "x", "isCorrect": true}');
        assertLte(r1.score, 5, "score clamped at 5");
        const r2 = parseEvaluation('{"score": -5, "feedback": "x", "isCorrect": false}');
        assertGte(r2.score, 0, "score clamped at 0");
      },
    },
    {
      name: "parseEvaluation: returns safe fallback on malformed JSON",
      fn: () => {
        const r = parseEvaluation("this is not json at all {broken");
        assertInRange(r.score, 0, 5, "fallback score in range");
        assert(r.feedback.length > 0, "fallback feedback not empty");
      },
    },
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// SUITE 5: AI Scoring (Grok API)
// ════════════════════════════════════════════════════════════════════════════

import { scoreResponse } from "@/engine/scoring";

interface ScoringCase {
  description: string;
  fact: Fact;
  answer: string;
  expectCorrect: boolean;
  expectScoreMin: number;
  expectScoreMax: number;
}

const LOW_FACT: Fact = {
  id: "test-low-1",
  lesson_id: "test",
  content:
    "Compound interest earns interest on both the principal and previously accumulated interest, causing exponential growth",
  explanation:
    "Unlike simple interest which only earns on principal, compound interest snowballs over time",
  strictness: "low",
  order_index: 0,
  tags: null,
  created_at: "2024-01-01",
};

const MEDIUM_FACT: Fact = {
  id: "test-medium-1",
  lesson_id: "test",
  content:
    "The Rule of 72 estimates how long it takes an investment to double: divide 72 by the annual interest rate",
  explanation: "At 6% annual rate: 72/6 = 12 years to double. At 9%: 72/9 = 8 years.",
  strictness: "medium",
  order_index: 1,
  tags: null,
  created_at: "2024-01-01",
};

const HIGH_FACT: Fact = {
  id: "test-high-1",
  lesson_id: "test",
  content:
    "Ebbinghaus found that humans forget approximately 50% of new information within 20 minutes",
  explanation:
    "Hermann Ebbinghaus conducted self-experiments in 1885 discovering the forgetting curve",
  strictness: "high",
  order_index: 2,
  tags: null,
  created_at: "2024-01-01",
};

const SCORING_CASES: ScoringCase[] = [
  // ── Low strictness (compound interest) ───────────────────────────────────
  {
    description: "[LOW] Perfect paraphrase → correct",
    fact: LOW_FACT,
    answer:
      "compound interest means you earn interest on your interest, so it grows faster and faster over time",
    expectCorrect: true,
    expectScoreMin: 3,
    expectScoreMax: 5,
  },
  {
    description: "[LOW] Brief correct answer → correct",
    fact: LOW_FACT,
    answer: "it earns interest on both the principal and past interest",
    expectCorrect: true,
    expectScoreMin: 3,
    expectScoreMax: 5,
  },
  {
    description: "[LOW] STT-like answer with fillers → should still score",
    fact: LOW_FACT,
    answer: "um compound interest basically earns interest on interest",
    expectCorrect: true,
    expectScoreMin: 3,
    expectScoreMax: 5,
  },
  {
    description: "[LOW] Too vague → incorrect",
    fact: LOW_FACT,
    answer: "it's about earning money on savings",
    expectCorrect: false,
    expectScoreMin: 0,
    expectScoreMax: 2,
  },
  {
    description: "[LOW] Wrong concept → incorrect",
    fact: LOW_FACT,
    answer: "simple interest is better than compound interest",
    expectCorrect: false,
    expectScoreMin: 0,
    expectScoreMax: 2,
  },
  {
    description: "[LOW] 'I don't know' → incorrect, score 0-1",
    fact: LOW_FACT,
    answer: "I don't know",
    expectCorrect: false,
    expectScoreMin: 0,
    expectScoreMax: 1,
  },
  {
    description: "[LOW] Off-topic → incorrect",
    fact: LOW_FACT,
    answer: "the weather today is sunny and warm",
    expectCorrect: false,
    expectScoreMin: 0,
    expectScoreMax: 1,
  },

  // ── Medium strictness (Rule of 72) ────────────────────────────────────────
  {
    description: "[MEDIUM] Perfect answer → correct",
    fact: MEDIUM_FACT,
    answer:
      "you divide 72 by the annual interest rate to find out how many years it takes to double your investment",
    expectCorrect: true,
    expectScoreMin: 4,
    expectScoreMax: 5,
  },
  {
    description: "[MEDIUM] Correct with number words → correct",
    fact: MEDIUM_FACT,
    answer:
      "the rule of seventy two says divide seventy two by the interest rate to get doubling time",
    expectCorrect: true,
    expectScoreMin: 3,
    expectScoreMax: 5,
  },
  {
    description: "[MEDIUM] Partial — captures key idea → borderline/correct",
    fact: MEDIUM_FACT,
    answer: "rule of 72 is about how long to double your investment",
    expectCorrect: true,
    expectScoreMin: 2,
    expectScoreMax: 4,
  },
  {
    description: "[MEDIUM] Wrong operation (multiply vs divide) → incorrect",
    fact: MEDIUM_FACT,
    answer: "you multiply 72 by the annual interest rate to get doubling time",
    expectCorrect: false,
    expectScoreMin: 0,
    expectScoreMax: 2,
  },
  {
    description: "[MEDIUM] Wrong number (70 vs 72) → incorrect (numbers must be right in medium)",
    fact: MEDIUM_FACT,
    answer: "the rule of 70 divides 70 by the interest rate",
    expectCorrect: false,
    expectScoreMin: 0,
    expectScoreMax: 2,
  },
  {
    description: "[MEDIUM] 'I don't remember' → incorrect",
    fact: MEDIUM_FACT,
    answer: "I don't remember this one",
    expectCorrect: false,
    expectScoreMin: 0,
    expectScoreMax: 1,
  },

  // ── High strictness (Ebbinghaus) ──────────────────────────────────────────
  {
    description: "[HIGH] Near-verbatim → correct",
    fact: HIGH_FACT,
    answer:
      "Ebbinghaus found that humans forget approximately fifty percent of new information within twenty minutes",
    expectCorrect: true,
    expectScoreMin: 4,
    expectScoreMax: 5,
  },
  {
    description: "[HIGH] Correct paraphrase with exact numbers → correct",
    fact: HIGH_FACT,
    answer:
      "the forgetting curve shows that we lose about 50% of information in just 20 minutes",
    expectCorrect: true,
    expectScoreMin: 3,
    expectScoreMax: 5,
  },
  {
    description: "[HIGH] Missing numbers → incorrect for high strictness",
    fact: HIGH_FACT,
    answer: "Ebbinghaus showed that people forget information over time after learning",
    expectCorrect: false,
    expectScoreMin: 0,
    expectScoreMax: 2,
  },
  {
    description: "[HIGH] Wrong percentage (70% vs 50%) → incorrect",
    fact: HIGH_FACT,
    answer: "Ebbinghaus found we forget 70 percent of new information in 20 minutes",
    expectCorrect: false,
    expectScoreMin: 0,
    expectScoreMax: 2,
  },
  {
    description: "[HIGH] Wrong time (1 hour vs 20 minutes) → incorrect",
    fact: HIGH_FACT,
    answer: "Ebbinghaus found we forget 50 percent of new information within an hour",
    expectCorrect: false,
    expectScoreMin: 0,
    expectScoreMax: 2,
  },
  {
    description: "[HIGH] 'I have no idea' → incorrect, score 0",
    fact: HIGH_FACT,
    answer: "I have no idea",
    expectCorrect: false,
    expectScoreMin: 0,
    expectScoreMax: 1,
  },

  // ── Edge cases ────────────────────────────────────────────────────────────
  {
    description: "[EDGE] Empty string → auto-returns score=0 without API call",
    fact: LOW_FACT,
    answer: "",
    expectCorrect: false,
    expectScoreMin: 0,
    expectScoreMax: 0,
  },
  {
    description: "[EDGE] Whitespace only → auto-returns score=0",
    fact: LOW_FACT,
    answer: "   ",
    expectCorrect: false,
    expectScoreMin: 0,
    expectScoreMax: 0,
  },
];

async function buildScoringTests(apiDelay: number): Promise<Array<{ name: string; fn: TestFn }>> {
  return SCORING_CASES.map((tc, idx) => ({
    name: tc.description,
    fn: async () => {
      // Add delay between API calls to avoid rate limiting (skip for non-API edge cases)
      const isApiCall = tc.answer.trim().length > 0;
      if (isApiCall && idx > 0) await sleep(apiDelay);

      const result = await scoreResponse(tc.fact, tc.answer);

      assert(
        result.isCorrect === tc.expectCorrect,
        `isCorrect: got ${result.isCorrect}, expected ${tc.expectCorrect}. score=${result.score}. feedback="${result.feedback}"`
      );
      assertInRange(
        result.score,
        tc.expectScoreMin,
        tc.expectScoreMax,
        `score [${tc.expectScoreMin}–${tc.expectScoreMax}]`
      );
    },
  }));
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

async function runAllTests(options: {
  includeApi: boolean;
  apiDelay: number;
  loopIteration: number;
}): Promise<RunReport> {
  const { includeApi, apiDelay, loopIteration } = options;
  const runId = `run-${Date.now()}`;
  const t0 = Date.now();

  const suites: SuiteResult[] = [];

  // Suite 1: SM-2
  suites.push(await runSuite("SM-2 Spaced Repetition", buildSm2Suite()));

  // Suite 2: Lesson Flow
  suites.push(await runSuite("Lesson Flow State Machine", buildFlowSuite()));

  // Suite 3: STT Cleanup
  suites.push(await runSuite("STT Cleanup", buildSttSuite()));

  // Suite 4: Prompt Building
  suites.push(await runSuite("Prompt Building", buildPromptSuite()));

  // Suite 5: AI Scoring (optional)
  if (includeApi) {
    const scoringTests = await buildScoringTests(apiDelay);
    suites.push(await runSuite("AI Scoring (Grok API)", scoringTests));
  }

  const totalPassed = suites.reduce((s, r) => s + r.passed, 0);
  const totalFailed = suites.reduce((s, r) => s + r.failed, 0);
  const durationMs = Date.now() - t0;

  return {
    runId,
    timestamp: new Date().toISOString(),
    mode: includeApi ? "full" : "unit-only",
    loopIteration,
    totalPassed,
    totalFailed,
    durationMs,
    suites,
  };
}

function printSummary(report: RunReport) {
  const { totalPassed, totalFailed, durationMs } = report;
  const total = totalPassed + totalFailed;
  console.log("\n" + C.bold("═══════════════════════════════════════"));
  if (totalFailed === 0) {
    console.log(C.bold(C.green(`  ✓ ALL ${total} TESTS PASSED (${durationMs}ms)`)));
  } else {
    console.log(
      C.bold(C.red(`  ✗ ${totalFailed} FAILED, ${totalPassed} passed (${total} total, ${durationMs}ms)`))
    );
    console.log(C.yellow("\n  Failed tests:"));
    for (const suite of report.suites) {
      for (const t of suite.tests) {
        if (!t.passed) {
          console.log(C.red(`    • [${suite.name}] ${t.name}`));
          console.log(C.dim(`      ${t.error}`));
        }
      }
    }
  }
  console.log(C.bold("═══════════════════════════════════════") + "\n");
}

function writeReport(report: RunReport, outputDir: string) {
  fs.mkdirSync(outputDir, { recursive: true });
  const filename = `${report.runId}.json`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(C.dim(`  Report saved: ${filepath}`));
}

async function main() {
  const args = process.argv.slice(2);
  const noApi = args.includes("--no-api");
  const loop = args.includes("--loop");
  const includeApi = !noApi && !loop; // loop mode skips API to avoid cost
  const apiDelay = 350; // ms between Grok calls

  const outputDir = path.join(process.cwd(), "debug-logs", "test-runs");

  console.log(C.bold("\n🧪 VocalLearn Test Runner"));
  console.log(C.dim(`   mode: ${loop ? "loop (unit-only)" : includeApi ? "full (unit + API)" : "unit-only"}`));
  if (loop) {
    console.log(C.dim("   Ctrl+C to stop overnight run\n"));
  }

  let iteration = 0;
  let totalPassedAll = 0;
  let totalFailedAll = 0;

  do {
    iteration++;
    if (loop) {
      console.log(C.bold(C.cyan(`\n[Iteration ${iteration}]`)));
    }

    const report = await runAllTests({ includeApi, apiDelay, loopIteration: iteration });
    printSummary(report);
    writeReport(report, outputDir);

    totalPassedAll += report.totalPassed;
    totalFailedAll += report.totalFailed;

    if (loop) {
      console.log(
        C.dim(
          `  Cumulative: ${totalPassedAll} passed, ${totalFailedAll} failed across ${iteration} runs`
        )
      );
      console.log(C.dim("  Sleeping 60s before next run…"));
      await sleep(60_000);
    }
  } while (loop);

  // Exit with non-zero code if any tests failed (useful for CI)
  if (totalFailedAll > 0) process.exit(1);
}

main().catch((err) => {
  console.error(C.red("\nFatal error:"), err);
  process.exit(1);
});
