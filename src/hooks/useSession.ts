import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useLessonStore } from "@/stores/lesson-store";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import {
  createInitialFlowState,
  getNextAction,
  markFactResult,
  markGreetingDone,
  markOverviewDone,
  markRecapDone,
  markTeachDone,
  type LessonFlowState,
  type LessonPhase,
} from "@/engine/lesson-flow";
import { calculateNextReview, createDefaultProgress, type FactProgress } from "@/engine/spaced-repetition";
import {
  clampProgressAfterAssessment,
  createDefaultLearningProfile,
  getAssessmentSchedulingQuality,
  mergeLearningProfile,
} from "@/engine/fact-learning";
import { scoreResponse } from "@/engine/scoring";
import { callGrok, callTutorGrok, type GrokMessage } from "@/lib/grok";
import {
  speak,
  speakFromPcmBase64,
  stopSpeaking,
  prefetchSpeak,
  prefetchSpeakAndWait,
} from "@/lib/voice";
import {
  stopActiveClip,
} from "@/lib/audio-clips";
import {
  buildPredictionQuestion,
  buildProductionPrompt,
  buildQuizPrompt,
  getShortCorrectValidation,
  predictionIsOnTrack,
  SHORT_VALIDATION_FALLBACKS,
} from "@/engine/session-prompts";
import { inferLessonTeachingPlan } from "@/engine/teaching-plan";
import { buildRecallHint, buildRevealPrompt, buildReviewPrompt, buildTeachScript } from "@/engine/teach-copy";
import { buildFastTurnSystemMessage, buildSessionSystemMessage } from "@/engine/tutor";
import { logInteraction } from "@/lib/session-logger";
import { cleanSttText } from "@/utils/stt-cleanup";
import type { Fact, UserFactProgress } from "@/types/lesson";
import type { FactAssessment, FactLearningProfile, LessonTeachingPlan } from "@/types/teaching";

// Variety pools — picked randomly so the tutor never feels scripted
const GREETING_OPENERS = [
  "Hey! Great to see you.",
  "Good to have you back!",
  "Hey, welcome back!",
  "Alright, let's get into it.",
  "Great, you showed up!",
  "Good to see you making time for this.",
  "Let's do this!",
  "Ready to learn? Let's go.",
];

// Named greeting openers — used when we know the user's first name
const NAMED_GREETING_OPENERS: ((name: string) => string)[] = [
  (n) => `Hey ${n}! Great to see you.`,
  (n) => `Good to have you back, ${n}!`,
  (n) => `${n}! Great to see you.`,
  (n) => `Hey ${n}, ready to learn?`,
  (n) => `Welcome back, ${n}!`,
  (n) => `${n}, good to see you making time for this.`,
  (n) => `Alright ${n}, let's get into it.`,
  (n) => `${n}! Let's do this.`,
  (n) => `Hey ${n} — good to see you here.`,
  (n) => `${n}, you showed up. Let's go.`,
];

const GREETING_CLOSERS = [
  "Ready? Here we go!",
  "Alright, let's jump in.",
  "Let's get started.",
  "Let's do this.",
  "Okay, here we go.",
  "Here we go!",
];

const OVERVIEW_BRIDGES = [
  "I'll walk you through the key ideas first, then we'll check what stuck.",
  "We'll go through the highlights, then I'll quiz you on what you picked up.",
  "Let me break it down for you, then we'll test your recall.",
  "I'll hit the main points, then we'll see what lands.",
  "We'll cover the essentials, then put your memory to work.",
  "Let me walk you through it, then we'll see what you've got.",
];

const RECAP_OPENERS = [
  "Nice work today!",
  "Great effort today!",
  "Solid session!",
  "That's a wrap!",
  "Good work today!",
  "You put in the work — respect.",
  "Okay, great session.",
];

const GREETING_OVERVIEW_HANDOFF_MS = 300;

// Post-fact checkin lines — short and varied so repeated checkins stay unobtrusive
const TEACH_CHECKIN_LINES = [
  "Any questions, or should we keep going?",
  "Questions, or are we moving on?",
  "Want to ask anything, or next one?",
  "Any questions, or shall we continue?",
  "Ask now, or we'll keep going.",
  "Questions on that, or ready for the next one?",
  "Need anything clarified, or should I move on?",
  "Anything you want to ask before we continue?",
];

// Bridge phrases connecting explanation to fact — varied so it doesn't feel robotic
const TEACH_FACT_BRIDGES = [
  "So here's what you need to know: ",
  "Bottom line: ",
  "Here's the key idea: ",
  "And the thing to hold onto: ",
  "Here's what matters: ",
];

// Patterns that signal the user doesn't know / is confused
const DONT_KNOW_PATTERNS = [
  /^i (don'?t|do not) know/i,
  /^(no idea|not sure|idk|dunno)/i,
  /^i('m| am) not sure/i,
  /^i (can'?t|cannot) remember/i,
  /^i forgot/i,
  /^(pass|skip|blank|nothing)/i,
  /^i('m| am) (lost|confused|stuck)/i,
  /^(what|huh|eh)\??$/i,
];

const HELP_REQUEST_PATTERNS = [
  /\brepeat (that|it|this)?\b/i,
  /\bsay (that|it|this) again\b/i,
  /\bone more time\b/i,
  /\bgo over (that|it|this)\b/i,
  /\bbreak (that|it|this) down\b/i,
  /\bclarify\b/i,
  /\bgive me some help\b/i,
  /\bwhat (is|was) (this|that) fact called\b/i,
  /\bwhat was that\b/i,
  /\bmore detail\b/i,
  /\bslower\b/i,
];

const ANSWER_REQUEST_PATTERNS = [
  /\bwhat('?s| is) the answer\b/i,
  /\btell me the answer\b/i,
  /\bgive me the answer\b/i,
  /\bjust tell me\b/i,
  /\bwhat is it\b/i,
];

// Words/phrases that clearly mean "yes, move on" — MUST be the COMPLETE utterance.
// Adding $ prevents "Okay so I had a question..." from matching and auto-advancing.
// Only unambiguous "no questions / move on" signals.
// Removed single-word ambiguous signals (yes, okay, ok, sure, good, ready, etc.) —
// iOS STT fires these as isFinal mid-sentence ("okay so my question is...").
// Multi-word advance phrases ("let's move on", "can we continue") are safe to add
// because they are rarely the start of a longer sentence.
const ADVANCE_SIGNALS = /^(got\s*it|i\s*got\s*it|no\s*questions?|no\s*thanks?|no\s*more(\s*questions?)?|not\s*really|none|nope|move\s*on|let'?s\s+move\s+on|can\s+we\s+move\s+on|should\s+we\s+move\s+on|keep\s*going|let'?s\s+keep\s+going|continue|let'?s\s+continue|can\s+we\s+continue|next|all\s*good|i'?m\s*good|that'?s?\s*all|all\s*set)\s*[.!?]*\s*$/i;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getLessonTitleText(lesson?: { title?: string | null } | null): string {
  const title = lesson?.title?.trim();
  return title && title.length > 0 ? title : "today's lesson";
}

function buildGreetingText(
  lesson: { title?: string | null } | null | undefined,
  firstName: string | null,
  hasNew: boolean,
  hasReview: boolean
): string {
  const nameGreet = firstName
    ? pick(NAMED_GREETING_OPENERS)(firstName)
    : pick(GREETING_OPENERS);
  let greeting = `${nameGreet} Today we're diving into ${getLessonTitleText(lesson)}.`;

  if (hasNew && hasReview) {
    greeting += " We've got some new material to cover and a few things to brush up on.";
  } else if (hasNew) {
    greeting += " I've got some great stuff to walk you through.";
  } else if (hasReview) {
    greeting += " Let's see how well you remember what we covered before.";
  }

  greeting += ` ${pick(GREETING_CLOSERS)}`;
  return greeting;
}

function buildOverviewText(lesson?: { title?: string | null; description?: string | null } | null): string {
  let overview = `Let me give you a quick overview of ${getLessonTitleText(lesson)}. `;
  if (lesson?.description) overview += lesson.description + " ";
  overview += pick(OVERVIEW_BRIDGES);
  return overview;
}

// Verbal celebration lines for streak milestones — spoken by tutor in the moment
const STREAK_MILESTONE_LINES: Record<number, string[]> = {
  3: [
    "Three in a row — you're on fire!",
    "Hat trick! Three straight correct.",
    "Three for three — nice momentum!",
    "That's three consecutive — keep it going!",
    "Three in a row. I like what I'm seeing.",
  ],
  5: [
    "Five straight! That's a real streak.",
    "Five in a row — you are locked in!",
    "Five for five — momentum is real.",
    "Five consecutive. You're making this look easy.",
    "Halfway to ten — let's keep rolling!",
  ],
  10: [
    "Ten in a row! That is incredible.",
    "Ten straight — you are absolutely locked in.",
    "Ten for ten — elite performance today.",
    "Ten consecutive. I am genuinely impressed.",
    "A streak of ten. Remember this feeling.",
  ],
};

// Prediction acknowledgment lines — bridge between student's guess and the actual teach
// Used when the student's prediction was NOT on track (corrective/neutral tone)
const PREDICT_ACK_LINES = [
  "Interesting — here's how it actually works.",
  "Let's sharpen that up — here's the full picture.",
  "Not quite — here's the real story.",
  "Let's reset it — here's what's going on.",
  "Okay — let me walk you through it.",
  "Here's the more accurate picture.",
  "Good start — let me fill in the gaps.",
  "Let's make it concrete.",
  "You're circling it — here's the detail.",
  "Different angle — here's the real deal.",
  "Not far off — here's the precise picture.",
  "Let's pin it down.",
];

// Acknowledgment when the student's prediction was substantially correct
const PREDICT_ACK_CORRECT = [
  "That's right — let me fill in the complete picture.",
  "Exactly — here's the full version.",
  "You've got the core idea — here's the detail.",
  "Yes! Let me walk you through it completely.",
  "Spot on — here's how it all fits together.",
  "Right on track — let me round it out.",
];

const CLARIFICATION_RETRY_PROMPT = "If you're ready, try saying the answer back in your own words.";
const FEEDBACK_SOUND_LEAD_MS = 180;

export interface SessionStats {
  correctCount: number;
  incorrectCount: number;
  totalReviewed: number;
  elapsedSeconds: number;
}

export interface UseSessionReturn {
  phase: LessonPhase;
  currentFact: Fact | null;
  activeQuestion: string | null;
  tutorMessage: string;
  feedback: string | null;
  feedbackScore: number | null;
  stats: SessionStats;
  streak: number;
  perfectChunkJustCompleted: boolean;
  isProcessing: boolean;
  isComplete: boolean;
  isSpeaking: boolean;
  isAwaitingResponse: boolean;
  isTeachCheckin: boolean;
  totalFacts: number;
  reviewFactCount: number;
  reviewSegmentStart: number;
  reviewSegmentEnd: number;
  hasNextReviewSegment: boolean;
  nextReviewSegmentStart: number;
  sessionLogId: string | null;
  submitResponse: (text: string, sttLatencyMs?: number) => Promise<void>;
  notifySpeechDetected: () => void;
  skipFact: () => void;
  endSession: () => Promise<void>;
}

export type SessionEntryMode = "lesson" | "review";

interface UseSessionOptions {
  reviewStartIndex?: number;
  reviewFactLimit?: number;
}

export function useSession(
  lessonId: string,
  sessionMode: SessionEntryMode = "lesson",
  options: UseSessionOptions = {}
): UseSessionReturn {
  const session = useAuthStore((s) => s.session);
  const firstName = useAuthStore((s) => s.firstName);
  const lessonPace = useSettingsStore((s) => s.lessonPace);
  const currentLesson = useLessonStore((s) => s.currentLesson);
  const currentFacts = useLessonStore((s) => s.currentFacts);
  const userProgress = useLessonStore((s) => s.userProgress);
  const fetchLessonWithFacts = useLessonStore((s) => s.fetchLessonWithFacts);
  const fetchUserProgress = useLessonStore((s) => s.fetchUserProgress);
  const recordCompletion = useLessonStore((s) => s.recordCompletion);

  const [flowState, setFlowState] = useState<LessonFlowState | null>(null);
  const [currentFact, setCurrentFact] = useState<Fact | null>(null);
  const [phase, setPhase] = useState<LessonPhase>("intro");
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [tutorMessage, setTutorMessage] = useState("Loading lesson...");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [totalFacts, setTotalFacts] = useState(0);
  const [sessionDataReady, setSessionDataReady] = useState(false);
  const reviewStartIndex = Math.max(0, options.reviewStartIndex ?? 0);
  const reviewFactLimit = Math.max(1, options.reviewFactLimit ?? 15);
  const reviewFactCount = sessionMode === "review" ? currentFacts.length : 0;
  const reviewSegmentStart = sessionMode === "review" ? Math.min(reviewStartIndex, reviewFactCount) : 0;
  const reviewSegmentEnd = sessionMode === "review"
    ? Math.min(reviewFactCount, reviewSegmentStart + reviewFactLimit)
    : 0;
  const hasNextReviewSegment = sessionMode === "review" && reviewSegmentEnd < reviewFactCount;
  const nextReviewSegmentStart = hasNextReviewSegment ? reviewSegmentEnd : reviewSegmentStart;
  const [stats, setStats] = useState<SessionStats>({
    correctCount: 0,
    incorrectCount: 0,
    totalReviewed: 0,
    elapsedSeconds: 0,
  });

  const sessionLogId = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartTime = useRef<number>(Date.now());
  const flowInitializedRef = useRef(false);
  const sessionFinalizedRef = useRef(false);
  const advancingRef = useRef(false);
  const clarifyFactRef = useRef<Fact | null>(null);
  const clarifyCountRef = useRef(0);
  const skipInFlightFactRef = useRef<string | null>(null);

  // ── Logging / timing refs ─────────────────────────────────────────────────
  // TTS latency captured via the onPlaybackStart callback in speak()
  const lastTtsLatencyRef = useRef<number | undefined>(undefined);
  // Grok latency and filler clip captured inside askWithAck via refs (avoids return-type change)
  const lastGrokLatencyRef = useRef<number | undefined>(undefined);
  const lastAckClipKeyRef = useRef<string | undefined>(undefined);
  const lastAckClipTextRef = useRef<string | undefined>(undefined);
  const lastTokenUsagePromptRef = useRef<number | undefined>(undefined);
  const lastTokenUsageCompletionRef = useRef<number | undefined>(undefined);
  const lastRealtimeFirstAudioMsRef = useRef<number | undefined>(undefined);
  const lastRealtimeResponseDoneMsRef = useRef<number | undefined>(undefined);
  // Timestamp when isAwaitingResponse was last set true — lets us measure how
  // long the user took to respond (tutor finished → submitResponse called)
  const awaitingResponseStartRef = useRef<number | undefined>(undefined);
  // Session-level aggregates updated as interactions are logged, flushed on endSession
  const sessionGrokLatenciesRef = useRef<number[]>([]);
  const sessionEvalScoresRef = useRef<number[]>([]);
  const sessionGrokCallsRef = useRef(0);
  const sessionQuestionsRef = useRef(0);
  // Predict-before-reveal — set when tutor is waiting for a prediction answer
  const predictFactRef = useRef<Fact | null>(null);
  const predictFlowStateRef = useRef<LessonFlowState | null>(null);
  // Teach checkin state — post-fact question window
  const teachCheckinRef = useRef(false);
  const pendingTeachAdvanceRef = useRef<LessonFlowState | null>(null);
  const checkinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // How many Q&A exchanges have happened in the current checkin window.
  // Capped at MAX_CHECKIN_EXCHANGES — on the last exchange the AI bridges to the next fact.
  const checkinExchangeCountRef = useRef(0);
  const checkinSourceRef = useRef<"teach" | "prediction">("teach");
  // How many facts have been taught since the session started.
  // Checkin Q&A window only opens every CHECKIN_EVERY_N_FACTS facts — otherwise
  // we speak the checkin line but auto-advance after a short pause (no open Q&A).
  const factsTeachedRef = useRef(0);
  // Delay-before-advance: when ADVANCE_SIGNALS matches, we wait 2s before actually
  // advancing. If the user continues speaking (iOS STT fragmented "okay so my question
  // is..." into "okay" then new session), the pending advance is cancelled and the
  // follow-up speech is handled normally.
  const pendingCheckinAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guard against double-firing the same quiz prompt (race condition with orphaned timers).
  // Stores the factId currently awaiting a quiz answer; cleared when answer is processed.
  const quizPromptSentRef = useRef<string | null>(null);
  // Secondary guard: set true when quiz prompt audio has fired, false when an answer
  // (correct, incorrect, or skip) is fully processed. Prevents stale clarify-state
  // intercepts from clearing quizPromptSentRef and re-triggering the prompt.
  const isAwaitingQuizAnswerRef = useRef(false);
  // The exact quiz question string last spoken — passed to scoreResponse so the model
  // grades against what was actually asked, not the full fact text.
  const currentQuizQuestionRef = useRef<string | null>(null);
  const recallAssistRef = useRef<Map<string, { hintsUsed: 0 | 1 | 2; revealedAnswer: boolean }>>(new Map());
  const persistedIncorrectFactIdsRef = useRef<Set<string>>(new Set());
  const [isTeachCheckin, setIsTeachCheckin] = useState(false);
  const [streak, setStreak] = useState(0);
  const streakRef = useRef(0); // mirrors streak state; readable in stale-closure callbacks
  const [perfectChunkJustCompleted, setPerfectChunkJustCompleted] = useState(false);
  const pendingTutorAudioRef = useRef<{
    text: string;
    audioDataBase64?: string;
    sampleRate?: number;
    streamPlaybackPromise?: Promise<void>;
  } | null>(null);
  const lastTeachCheckinLineRef = useRef<string | null>(null);
  // Pre-generated content cache: factId → script/prompt string
  const teachScriptCache = useRef<Map<string, string>>(new Map());
  const quizPromptCache = useRef<Map<string, string>>(new Map());
  // Pre-computed linear phase texts (so we can prefetch audio during data load)
  const greetingTextRef = useRef<string>("");
  const overviewTextRef = useRef<string>("");
  // Recent conversation history for conversational tutor turns.
  // Kept intentionally short so voice turns stay responsive.
  const conversationHistoryRef = useRef<GrokMessage[]>([]);
  // Snapshot of current session context for focused system message construction.
  // Updated via useEffect whenever facts/progress/currentFact/phase change.
  const sessionContextRef = useRef<{
    facts: Fact[];
    progress: Map<string, UserFactProgress>;
    currentFact: Fact | null;
    phase: LessonPhase;
  }>({ facts: [], progress: new Map(), currentFact: null, phase: "intro" });

  const MAX_CLARIFY_EXCHANGES = 2;
  // Max Q&A exchanges per checkin window before AI bridges to next fact
  const MAX_CHECKIN_EXCHANGES = 2;
  const MAX_PREDICTION_CHECKIN_EXCHANGES = 4;
  // Open full Q&A checkin window every N facts (others get checkin line but auto-advance)
  const CHECKIN_EVERY_N_FACTS = 3;

  const getLessonTeachingPlan = useCallback((fact: Fact): LessonTeachingPlan => {
    if (currentLesson?.teaching_plan) {
      return currentLesson.teaching_plan;
    }

    return inferLessonTeachingPlan(
      currentLesson ?? {
        id: fact.lesson_id,
        subject_id: "",
        module_id: null,
        title: "Lesson",
        description: null,
        order_index: fact.order_index,
        unlock_threshold: 0.7,
        is_community: false,
        created_by: null,
        created_at: "",
      },
      currentFacts.length > 0 ? currentFacts : [fact]
    );
  }, [currentFacts, currentLesson]);

  const resetSessionForLoad = () => {
    flowInitializedRef.current = false;
    sessionFinalizedRef.current = false;
    advancingRef.current = false;
    sessionLogId.current = null;
    sessionStartTime.current = Date.now();

    if (checkinTimeoutRef.current) {
      clearTimeout(checkinTimeoutRef.current);
      checkinTimeoutRef.current = null;
    }

    if (pendingCheckinAdvanceRef.current) {
      clearTimeout(pendingCheckinAdvanceRef.current);
      pendingCheckinAdvanceRef.current = null;
    }

    clarifyFactRef.current = null;
    clarifyCountRef.current = 0;
    skipInFlightFactRef.current = null;
    lastTtsLatencyRef.current = undefined;
    lastGrokLatencyRef.current = undefined;
    lastAckClipKeyRef.current = undefined;
    lastAckClipTextRef.current = undefined;
    lastTokenUsagePromptRef.current = undefined;
    lastTokenUsageCompletionRef.current = undefined;
    lastRealtimeFirstAudioMsRef.current = undefined;
    lastRealtimeResponseDoneMsRef.current = undefined;
    awaitingResponseStartRef.current = undefined;
    sessionGrokLatenciesRef.current = [];
    sessionEvalScoresRef.current = [];
    sessionGrokCallsRef.current = 0;
    sessionQuestionsRef.current = 0;
    predictFactRef.current = null;
    predictFlowStateRef.current = null;
    teachCheckinRef.current = false;
    pendingTeachAdvanceRef.current = null;
    checkinExchangeCountRef.current = 0;
    checkinSourceRef.current = "teach";
    factsTeachedRef.current = 0;
    quizPromptSentRef.current = null;
    isAwaitingQuizAnswerRef.current = false;
    currentQuizQuestionRef.current = null;
    setActiveQuestion(null);
    streakRef.current = 0;
    pendingTutorAudioRef.current = null;
    lastTeachCheckinLineRef.current = null;
    teachScriptCache.current.clear();
    quizPromptCache.current.clear();
    greetingTextRef.current = "";
    overviewTextRef.current = "";
    conversationHistoryRef.current = [];
    recallAssistRef.current.clear();
    persistedIncorrectFactIdsRef.current.clear();

    setFlowState(null);
    setCurrentFact(null);
    setPhase("intro");
    setTutorMessage("Loading lesson...");
    setFeedback(null);
    setFeedbackScore(null);
    setIsProcessing(false);
    setIsComplete(false);
    setIsSpeaking(false);
    setIsAwaitingResponse(false);
    setIsTeachCheckin(false);
    setTotalFacts(0);
    setSessionDataReady(false);
    setStats({
      correctCount: 0,
      incorrectCount: 0,
      totalReviewed: 0,
      elapsedSeconds: 0,
    });
    setStreak(0);
    setPerfectChunkJustCompleted(false);
  };

  useEffect(() => {
    let cancelled = false;

    resetSessionForLoad();
    void stopSpeaking();
    stopActiveClip();

    void initSession().finally(() => {
      if (!cancelled) {
        setSessionDataReady(true);
      }
    });

    return () => {
      cancelled = true;
      if (checkinTimeoutRef.current) clearTimeout(checkinTimeoutRef.current);
      if (pendingCheckinAdvanceRef.current) clearTimeout(pendingCheckinAdvanceRef.current);
      void stopSpeaking();
      stopActiveClip();
    };
  }, [lessonId, sessionMode]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        elapsedSeconds: Math.floor((Date.now() - sessionStartTime.current) / 1000),
      }));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Track when the tutor finishes speaking and the mic opens — used to measure
  // how long the user takes to respond (userResponseDelayMs).
  useEffect(() => {
    if (isAwaitingResponse) {
      awaitingResponseStartRef.current = Date.now();
    }
  }, [isAwaitingResponse]);

  // Keep sessionContextRef in sync so askWithAck can build the system message
  // without stale closures (refs are stable across renders without triggering re-renders).
  useEffect(() => {
    sessionContextRef.current = { facts: currentFacts, progress: userProgress, currentFact, phase };
  }, [currentFacts, userProgress, currentFact, phase]);

  const appendHistory = (role: "user" | "assistant", content: string) => {
    conversationHistoryRef.current.push({ role, content });
    // Cap history at 8 messages (~4 exchanges) to keep question turns fast
    // without losing the immediate local context needed for follow-ups.
    if (conversationHistoryRef.current.length > 8) {
      conversationHistoryRef.current = conversationHistoryRef.current.slice(-8);
    }
  };

  const initSession = async () => {
    await fetchLessonWithFacts(lessonId);
    await fetchUserProgress(lessonId);
  };

  // Initialize flow once facts and progress are loaded (only once per lesson/mode)
  useEffect(() => {
    if (!sessionDataReady || !currentLesson || currentLesson.id !== lessonId || currentFacts.length === 0 || flowInitializedRef.current) return;
    flowInitializedRef.current = true;

    const now = new Date();
    const dueFacts: string[] = [];
    const allFacts = currentFacts.map((fact) => fact.id);

    currentFacts.forEach((fact) => {
      const progress = userProgress.get(fact.id);
      if (progress && new Date(progress.next_review_at) <= now) {
        dueFacts.push(fact.id);
      }
    });

    const reviewFactIds = sessionMode === "review"
      ? allFacts.slice(reviewSegmentStart, reviewSegmentEnd)
      : [];
    const factsToQuiz = sessionMode === "review" ? reviewFactIds : [];
  const factsToTeach = sessionMode === "review" ? [] : allFacts;
  setTotalFacts(sessionMode === "review" ? factsToQuiz.length : factsToQuiz.length + factsToTeach.length);

    // Pre-generate all teach scripts and quiz prompts into cache
    // so advanceToNextFact reads from memory, not computed inline
    for (const fact of currentFacts) {
      const teach = buildTeachScript(fact, currentLesson, currentLesson?.teaching_plan ?? null);
      teachScriptCache.current.set(fact.id, teach);

      // Quiz prompt (due-fact style)
      quizPromptCache.current.set(fact.id, buildQuizPrompt(fact));
    }

    // Pre-compute greeting and overview text so we can prefetch their audio now
    const lesson = currentLesson;
    const hasNew = factsToTeach.length > 0;
    const hasReview = factsToQuiz.length > 0;
    const name = useAuthStore.getState().firstName;
    greetingTextRef.current = buildGreetingText(lesson, name, hasNew, hasReview);
    overviewTextRef.current = buildOverviewText(lesson);

    // Pre-fetch audio for all deterministic listen-only phases immediately.
    // These fire concurrently in the background so by the time each phase
    // is reached, the audio is already downloaded and ready to play.
    prefetchSpeak(greetingTextRef.current);
    prefetchSpeak(overviewTextRef.current);
    for (const checkinLine of TEACH_CHECKIN_LINES) {
      prefetchSpeak(checkinLine);
    }
    prefetchSpeak(CLARIFICATION_RETRY_PROMPT);
    for (const shortValidation of SHORT_VALIDATION_FALLBACKS) {
      prefetchSpeak(shortValidation);
    }
    for (const predictAckLine of PREDICT_ACK_LINES) {
      prefetchSpeak(predictAckLine);
    }
    for (const predictAckLine of PREDICT_ACK_CORRECT) {
      prefetchSpeak(predictAckLine);
    }
    prefetchSpeak("No problem.");
    for (const factId of factsToTeach) {
      const script = teachScriptCache.current.get(factId);
      if (script) prefetchSpeak(script);
    }

    const initial = createInitialFlowState(factsToTeach, factsToQuiz);
    if (sessionMode === "review") {
      initial.greetingDone = true;
      initial.overviewDone = true;
      if (factsToQuiz.length === 0) {
        initial.recapDone = true;
      }
    }
    setFlowState(initial);
    createSessionLog();
  }, [currentLesson, currentFacts, userProgress, lessonId, sessionMode, sessionDataReady, reviewSegmentStart, reviewSegmentEnd]);

  // Advance when flowState changes
  useEffect(() => {
    if (!flowState) return;
    advanceToNextFact(flowState);
  }, [flowState]);

  useEffect(() => {
    skipInFlightFactRef.current = null;
  }, [phase, currentFact?.id]);

  const createSessionLog = async () => {
    if (!session?.user?.id) return;
    try {
      const { data } = await supabase
        .from("session_logs")
        .insert({
          user_id: session.user.id,
          lesson_id: lessonId,
          mode: "voice",
          started_at: new Date().toISOString(),
          facts_reviewed: 0,
          facts_correct: 0,
        })
        .select("id")
        .single();
      if (data) sessionLogId.current = data.id;
    } catch (e) {
      console.error("Failed to create session log:", e);
    }
  };

  const advanceToNextFact = async (state: LessonFlowState) => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    clearPendingTeachTurnState();

    const next = getNextAction(state);
    setPhase(next.phase);
    setFeedback(null);
    setFeedbackScore(null);
    setIsAwaitingResponse(false);

    if (next.phase === "complete") {
      await finalizeSession();
      setIsComplete(true);
      setCurrentFact(null);
      setTutorMessage("Great session! Let's review how you did.");
      advancingRef.current = false;
      return;
    }

    if (next.phase === "greeting") {
      setCurrentFact(null);
      // Use the pre-computed greeting text (built at init so audio was pre-fetched)
      const greeting = greetingTextRef.current || buildGreetingText(
        currentLesson ?? useLessonStore.getState().currentLesson,
        useAuthStore.getState().firstName,
        state.factsToTeach.length > 0,
        state.factsToQuiz.length > 0
      );

      setTutorMessage(greeting);
      // While greeting TTS plays, pre-fetch the overview audio if not already done
      if (overviewTextRef.current) prefetchSpeak(overviewTextRef.current);
      await speakText(greeting);
      appendHistory("assistant", greeting);

      await new Promise((resolve) => setTimeout(resolve, GREETING_OVERVIEW_HANDOFF_MS));

      // Auto-advance past greeting
      const advancedState = markGreetingDone(state);
      advancingRef.current = false;
      setFlowState(advancedState);
      return;
    }

    if (next.phase === "recap") {
      setCurrentFact(null);
      const correct = state.factsCorrect.length;
      const reviewed = stats.totalReviewed;

      let recap = `${pick(RECAP_OPENERS)} `;
      if (reviewed === 0) {
        recap = "Session complete!";
      } else if (correct === reviewed && reviewed > 0) {
        recap += `You nailed every single one — perfect session!`;
      } else if (correct > 0) {
        recap += `You got ${correct} out of ${reviewed} correct.`;
        if (state.factsMissed.length > 0) {
          recap += ` We'll revisit the tricky ones next time.`;
        }
      } else {
        recap += `We covered ${reviewed} facts. Keep at it and you'll get them!`;
      }

      setTutorMessage(recap);
      await speakText(recap);
      appendHistory("assistant", recap);

      const recapState = markRecapDone(state);
      advancingRef.current = false;
      setFlowState(recapState);
      return;
    }

    // Overview — brief topic intro, then auto-advance
    if (next.phase === "overview") {
      setCurrentFact(null);
      const overview = overviewTextRef.current || buildOverviewText(
        currentLesson ?? useLessonStore.getState().currentLesson
      );

      setTutorMessage(overview);
      await speakText(overview);
      appendHistory("assistant", overview);

      const advancedState = markOverviewDone(state);
      advancingRef.current = false;
      setFlowState(advancedState);
      return;
    }

    if (next.factId) {
      const fact = currentFacts.find((f) => f.id === next.factId) ?? null;
      setCurrentFact(fact);

      if (fact) {
        if (next.phase === "teach") {
          // Predict-before-reveal: for the first fact of every chunk, ask a prediction
          // question and wait for the student's spoken guess. submitResponse handles
          // the acknowledgment + actual teach when predictFactRef is set.
          const isFirstInChunk = state.chunkQuizQueue.length === 0;
          if (isFirstInChunk) {
            // Clear all stale teach/checkin timers before entering prediction mode.
            // Otherwise an older timeout can silently steal the turn from the user.
            clearPendingTeachTurnState();

            const predictQ = buildPredictionQuestion(fact);
            setTutorMessage(predictQ);
            await speakText(predictQ);
            appendHistory("assistant", predictQ);
            predictFactRef.current = fact;
            predictFlowStateRef.current = state;
            advancingRef.current = false;
            setIsAwaitingResponse(true);
            return;
          }

          // Listen-only — read from pre-generated cache
          const teachScript = teachScriptCache.current.get(fact.id) ?? fact.content;

          setTutorMessage(teachScript);

          // While this teach audio plays, prefetch the next content so it's
          // ready instantly when we advance (eliminates the 7-second TTS gap)
          const nextState = markTeachDone(state, fact.id);
          const nextAction = getNextAction(nextState);
          if (nextAction.factId) {
            const nextFact = currentFacts.find((f) => f.id === nextAction.factId);
            if (nextFact) {
              if (nextAction.phase === "quiz" && nextState.chunkQuizQueue.includes(nextFact.id)) {
                // Mini-quiz: prefetch chunk opener prompt
                const posInChunk = nextState.chunkQuizIndex;
                const prefix = posInChunk === 0 ? "OK, let's see what you caught! " : "";
                prefetchSpeak(`${prefix}${nextFact.content} — can you say that back to me?`);
              } else if (nextAction.phase === "quiz") {
                const p = quizPromptCache.current.get(nextFact.id) ?? buildQuizPrompt(nextFact);
                prefetchSpeak(p);
              } else if (nextAction.phase === "teach") {
                const s = teachScriptCache.current.get(nextFact.id) ?? nextFact.content;
                prefetchSpeak(s);
              }
            }
          }

          await speakText(teachScript);
          appendHistory("assistant", teachScript);
          // Log teach interaction
          if (sessionLogId.current && session?.user?.id) {
            logInteraction({
              sessionLogId: sessionLogId.current,
              userId: session.user.id,
              lessonId,
              interactionType: "teach",
              factId: fact.id,
              factContent: fact.content,
              phase: "teach",
              tutorMessage: teachScript,
              ttsLatencyMs: lastTtsLatencyRef.current,
            });
          }

          // Compute the next state now (before checkin timeout fires)
          const advancedState = markTeachDone(state, fact.id);
          pendingTeachAdvanceRef.current = advancedState;

          // Decide whether this fact gets a full Q&A checkin window or just a short pause.
          // Every 3rd fact: full checkin (speaks line, opens Q&A, 8s silence timer).
          // Other facts: no checkin line spoken, auto-advance after 2s so user can interrupt.
          factsTeachedRef.current += 1;
          const isCheckinFact = factsTeachedRef.current % teachCheckinEveryNFacts === 0;

          if (isCheckinFact) {
            checkinExchangeCountRef.current = 0;
            checkinSourceRef.current = "teach";
            teachCheckinRef.current = true;
            setIsTeachCheckin(true);

            // Post-fact checkin — only speak a scripted line if the teach script
            // didn't already invite engagement.
            if (!endsWithQuestion(teachScript)) {
              const checkinLine = getTeachCheckinLine();
              setTutorMessage(checkinLine);
              await speakText(checkinLine);
              appendHistory("assistant", checkinLine);
            }

            // Auto-advance after 8s silence if no response.
            if (checkinTimeoutRef.current) clearTimeout(checkinTimeoutRef.current);
            checkinTimeoutRef.current = setTimeout(() => {
              if (teachCheckinRef.current && pendingTeachAdvanceRef.current) {
                if (sessionLogId.current && session?.user?.id) {
                  logInteraction({
                    sessionLogId: sessionLogId.current,
                    userId: session.user.id,
                    lessonId,
                    interactionType: "teach_checkin_timeout",
                    factId: fact.id,
                    factContent: fact.content,
                    phase: "teach",
                  });
                }
                teachCheckinRef.current = false;
                setIsTeachCheckin(false);
                setIsAwaitingResponse(false);
                const next = pendingTeachAdvanceRef.current;
                pendingTeachAdvanceRef.current = null;
                setFlowState(next);
              }
            }, teachCheckinTimeoutMs);

            advancingRef.current = false;
            setIsAwaitingResponse(true);
          } else {
            // Non-checkin fact: auto-advance after a brief pause.
            // Do NOT open the mic — STT would set the audio session to playAndRecord,
            // which races with the next Ara TTS call and drops the voice to device TTS.
            advancingRef.current = false;
            checkinTimeoutRef.current = setTimeout(() => {
              if (pendingTeachAdvanceRef.current) {
                const next = pendingTeachAdvanceRef.current;
                pendingTeachAdvanceRef.current = null;
                setFlowState(next);
              }
            }, nonCheckinAdvanceDelayMs);
          }
          return;
        } else if (next.phase === "quiz") {
          // Check if this is a mini-quiz (just taught) or due-fact review
          const isMiniQuiz = state.chunkQuizQueue.includes(fact.id);
          let prompt: string;
          if (isMiniQuiz) {
            const posInChunk = state.chunkQuizIndex;
            const chunkTotal = state.chunkQuizQueue.length;
            const isLastInChunk = posInChunk === chunkTotal - 1;

            if (posInChunk === 0) {
              // First quiz of chunk — recall cue using concept name, NOT full fact content
              const recallQ = buildQuizPrompt(fact);
              prompt = `OK, let's see what you caught! ${recallQ}`;
            } else if (isLastInChunk) {
              // Last quiz of chunk — production prompt with explicit context.
              prompt = `Last one - ${buildProductionPrompt(fact)}`;
            } else {
              // Middle of chunk — concept-based recall cue, not full fact
              prompt = buildQuizPrompt(fact);
            }
          } else {
            // Due-fact review — add a hook before the first one
            const isFirstDueFact = state.quizIndex === 0;
            const basePrompt = quizPromptCache.current.get(fact.id) ?? buildQuizPrompt(fact);
            if (isFirstDueFact) {
              const hook = "Now let's check what you already know. ";
              prompt = hook + basePrompt;
            } else {
              prompt = basePrompt;
            }
          }

          if (
            quizPromptSentRef.current === fact.id ||
            isAwaitingQuizAnswerRef.current ||
            (phase === "quiz" && currentFact?.id === fact.id && currentQuizQuestionRef.current === prompt && isAwaitingResponse)
          ) {
            advancingRef.current = false;
            return;
          }

          quizPromptSentRef.current = fact.id;
          isAwaitingQuizAnswerRef.current = true;
          currentQuizQuestionRef.current = prompt;
          setActiveQuestion(prompt);
          setTutorMessage(prompt);
          await speakText(prompt);
          appendHistory("assistant", prompt);
          // Log quiz prompt interaction
          if (sessionLogId.current && session?.user?.id) {
            logInteraction({
              sessionLogId: sessionLogId.current,
              userId: session.user.id,
              lessonId,
              interactionType: "quiz_prompt",
              factId: fact.id,
              factContent: fact.content,
              phase: next.phase,
              tutorMessage: prompt,
              ttsLatencyMs: lastTtsLatencyRef.current,
            });
          }
        } else if (next.phase === "review") {
          const hint = buildReviewPrompt(
            fact,
            getLessonTeachingPlan(fact),
            userProgress.get(fact.id)?.learning_profile ?? createDefaultLearningProfile()
          );
          currentQuizQuestionRef.current = hint;
          setActiveQuestion(hint);
          setTutorMessage(hint);
          await speakText(hint);
          appendHistory("assistant", hint);
          // Log review prompt interaction
          if (sessionLogId.current && session?.user?.id) {
            logInteraction({
              sessionLogId: sessionLogId.current,
              userId: session.user.id,
              lessonId,
              interactionType: "review_prompt",
              factId: fact.id,
              factContent: fact.content,
              phase: "review",
              tutorMessage: hint,
              ttsLatencyMs: lastTtsLatencyRef.current,
            });
          }
        }
        setIsAwaitingResponse(true);
      }
    }
    advancingRef.current = false;
  };

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    setIsAwaitingResponse(false);
    lastTtsLatencyRef.current = undefined;
    try {
      try {
        const pendingTutorAudio = pendingTutorAudioRef.current;
        if (pendingTutorAudio && pendingTutorAudio.text === text) {
          pendingTutorAudioRef.current = null;
          if (pendingTutorAudio.streamPlaybackPromise) {
            lastTtsLatencyRef.current = 0;
            await pendingTutorAudio.streamPlaybackPromise;
            return;
          }
          if (pendingTutorAudio.audioDataBase64 && pendingTutorAudio.sampleRate) {
            await speakFromPcmBase64(
              pendingTutorAudio.audioDataBase64,
              pendingTutorAudio.sampleRate,
              (ms) => { lastTtsLatencyRef.current = ms; }
            );
            return;
          }
          return;
        }
        await speak(text, (ms) => { lastTtsLatencyRef.current = ms; });
      } catch (error) {
        console.warn("Primary speakText path failed, retrying with fresh speech call:", error);
        pendingTutorAudioRef.current = null;
        try {
          await stopSpeaking();
        } catch {}
        try {
          await speak(text, (ms) => { lastTtsLatencyRef.current = ms; });
        } catch (fallbackError) {
          console.warn("Fallback speakText path failed; continuing without blocking the session:", fallbackError);
        }
      }
    } finally {
      setIsSpeaking(false);
    }
  };

  const isQuestion = (text: string): boolean => {
    const t = text.toLowerCase().trim();
    return (
      t.includes("?") ||
      // Classic question-word openers
      /^(who|what|why|how|when|where|which|can you|could you|tell me|explain|what's|whats)\b/.test(t) ||
      // Confirmation-seeking endings: "that's the patient, right" / "so HM is..."
      /\b(right|correct|isn't it|is it|was it|weren't they|does that|is that)\s*$/.test(t) ||
      // Implicit question openers: "so X" / "does that mean" / "is that why"
      /^(so |does that|is that|was that|are those|do you mean|meaning |wait |hang on)/i.test(t) ||
      // Confusion / deeper curiosity signals — always treat as questions in checkin
      /^(i'?m (confused|not sure|lost|unclear)|i don'?t (get|understand|follow|see)|but (why|how|what|when|is)|what about|tell me more|can you (clarify|go over|explain)|more about|is it (because|related|why)|does this (mean|apply|affect)|so if|and if|but if)/i.test(t)
    );
  };

  const isDontKnow = (text: string): boolean =>
    DONT_KNOW_PATTERNS.some((p) => p.test(text.trim()));

  const isHelpRequest = (text: string): boolean =>
    HELP_REQUEST_PATTERNS.some((pattern) => pattern.test(text.trim()));

  const isAnswerRequest = (text: string): boolean =>
    ANSWER_REQUEST_PATTERNS.some((pattern) => pattern.test(text.trim()));

  const endsWithQuestion = (text: string): boolean =>
    /\?\s*["']*\s*$/.test(text.trim());

  const getTeachCheckinLine = (): string => {
    const availableLines = lastTeachCheckinLineRef.current
      ? TEACH_CHECKIN_LINES.filter((line) => line !== lastTeachCheckinLineRef.current)
      : TEACH_CHECKIN_LINES;
    const nextLine = pick(availableLines.length > 0 ? availableLines : TEACH_CHECKIN_LINES);
    lastTeachCheckinLineRef.current = nextLine;
    return nextLine;
  };

  const speakCheckinFollowUp = async (): Promise<string> => {
    const followUpLine = getTeachCheckinLine();
    setTutorMessage(followUpLine);
    await speakText(followUpLine);
    appendHistory("assistant", followUpLine);
    return followUpLine;
  };

  const formatCorrectFeedback = (feedbackText: string, score: number): string => {
    const firstSentence = feedbackText
      .trim()
      .split(/(?<=[.!?])\s+/)[0]
      ?.replace(/^['"]+|['"]+$/g, "")
      .trim();

    if (!firstSentence) return getShortCorrectValidation();

    const normalized = /[.!?]$/.test(firstSentence) ? firstSentence : `${firstSentence}.`;
    const words = normalized.match(/[A-Za-z0-9']+/g) ?? [];
    const maxWords = score >= 4 ? 8 : 28;
    const maxLength = score >= 4 ? 72 : 220;

    if (normalized.includes("?")) {
      return score >= 4
        ? getShortCorrectValidation()
        : "You're on the right track. Add the missing key detail.";
    }

    if (score >= 4 && (words.length > maxWords || normalized.length > maxLength)) {
      return getShortCorrectValidation();
    }

    return normalized;
  };

  const clearCurrentQuestion = () => {
    quizPromptSentRef.current = null;
    isAwaitingQuizAnswerRef.current = false;
    currentQuizQuestionRef.current = null;
    setActiveQuestion(null);
  };

  const getLearningProfile = (factId: string): FactLearningProfile =>
    userProgress.get(factId)?.learning_profile ?? createDefaultLearningProfile();

  const buildCorrectAssessment = (score: number, hintsUsed: 0 | 1 | 2): FactAssessment => ({
    outcome:
      hintsUsed === 0
        ? score >= 4
          ? "correct_first_try"
          : "correct_with_missing_context"
        : hintsUsed === 1
          ? "correct_after_hint_1"
          : "correct_after_hint_2",
    qualityScore: score,
    wasCorrectForFlow: true,
    hintsUsed,
    revealedAnswer: false,
    revealRepeatQuality: null,
    needsReteach: hintsUsed === 2 || score === 3,
    shouldUseAlternateLensNextReview: false,
  });

  const buildFailedAssessment = (outcome: "close_but_off" | "no_answer"): FactAssessment => ({
    outcome,
    qualityScore: outcome === "close_but_off" ? 1 : 0,
    wasCorrectForFlow: false,
    hintsUsed: 2,
    revealedAnswer: false,
    revealRepeatQuality: null,
    needsReteach: true,
    shouldUseAlternateLensNextReview: false,
  });

  const buildRevealRepeatAssessment = (
    repeatScore: number,
    priorProfile: FactLearningProfile
  ): FactAssessment => {
    const normalizedRepeatScore = Math.max(0, Math.min(5, Math.round(repeatScore))) as 0 | 1 | 2 | 3 | 4 | 5;

    return {
    outcome:
      normalizedRepeatScore >= 4
        ? "revealed_repeat_strong"
        : normalizedRepeatScore >= 2
          ? "revealed_repeat_partial"
          : "revealed_repeat_failed",
    qualityScore: 0,
    wasCorrectForFlow: false,
    hintsUsed: 2,
    revealedAnswer: true,
    revealRepeatQuality: normalizedRepeatScore,
    needsReteach: true,
    shouldUseAlternateLensNextReview: priorProfile.needsReteach,
    };
  };

  const advanceWithIncorrectResult = (state: LessonFlowState, factId: string): LessonFlowState => {
    recallAssistRef.current.delete(factId);
    setStats((prev) => ({
      ...prev,
      totalReviewed: prev.totalReviewed + 1,
      incorrectCount: prev.incorrectCount + 1,
    }));
    streakRef.current = 0;
    setStreak(0);
    return markFactResult(state, factId, false);
  };

  const persistIncorrectOutcomeOnce = async (factId: string) => {
    if (persistedIncorrectFactIdsRef.current.has(factId)) return;
    persistedIncorrectFactIdsRef.current.add(factId);
    await persistFactProgress(factId, buildFailedAssessment("no_answer"));
  };

  const notifySpeechDetected = useCallback(() => {
    if (checkinTimeoutRef.current) {
      clearTimeout(checkinTimeoutRef.current);
      checkinTimeoutRef.current = null;
    }

    if (pendingCheckinAdvanceRef.current) {
      clearTimeout(pendingCheckinAdvanceRef.current);
      pendingCheckinAdvanceRef.current = null;
    }
  }, []);

  const handleRecallAssistRequest = async (
    fact: Fact,
    state: LessonFlowState,
    rawUserText: string,
    userText: string,
    requestKind: "help" | "dontknow",
    interactionType: "user_question" | "clarification_question" | "dont_know",
    userResponseDelayMs?: number,
    sttLatencyMs?: number,
    logMeta?: { evalScore?: number; isCorrect?: boolean }
  ) => {
    const assistState = recallAssistRef.current.get(fact.id) ?? { hintsUsed: 0 as 0 | 1 | 2, revealedAnswer: false };
    let response: string;
    const lessonPlan = getLessonTeachingPlan(fact);
    const learningProfile = getLearningProfile(fact.id);

    if (assistState.hintsUsed < 2) {
      assistState.hintsUsed = (assistState.hintsUsed + 1) as 1 | 2;
      response = buildRecallHint(fact, assistState.hintsUsed, lessonPlan, learningProfile);
    } else {
      assistState.revealedAnswer = true;
      response = buildRevealPrompt(fact);
    }

    clarifyFactRef.current = fact;
    recallAssistRef.current.set(fact.id, assistState);

    setFeedbackScore(null);
    setFeedback(response);
    setTutorMessage(response);
    await speakText(response);
    appendHistory("user", userText);
    appendHistory("assistant", response);

    if (sessionLogId.current && session?.user?.id) {
      if (interactionType === "user_question" || interactionType === "clarification_question") {
        sessionQuestionsRef.current += 1;
      }

      logInteraction({
        sessionLogId: sessionLogId.current,
        userId: session.user.id,
        lessonId,
        interactionType,
        factId: fact.id,
        factContent: fact.content,
        phase: phase,
        tutorMessage: response,
        userTranscriptRaw: rawUserText,
        userTranscriptClean: userText,
        evalScore: logMeta?.evalScore,
        isCorrect: logMeta?.isCorrect,
        ttsLatencyMs: lastTtsLatencyRef.current,
        userResponseDelayMs,
        sttLatencyMs,
      });
    }

    setIsAwaitingResponse(true);
  };

  const nonCheckinAdvanceDelayMs = lessonPace === "slower" ? 2200 : 800;
  const teachCheckinTimeoutMs = lessonPace === "slower" ? 11000 : 8000;
  const followUpSilenceTimeoutMs = lessonPace === "slower" ? 9000 : 8000;
  const followUpBridgeTimeoutMs = lessonPace === "slower" ? 6000 : 5000;
  const teachCheckinEveryNFacts = lessonPace === "slower" ? 2 : CHECKIN_EVERY_N_FACTS;
  const advanceGraceDelayMs = lessonPace === "slower" ? 3200 : 2000;
  const predictionAdvanceGraceDelayMs = lessonPace === "slower" ? 4500 : 4000;

  const buildCheckinTransitionInstruction = (nextState: LessonFlowState | null): string => {
    const nextAction = nextState ? getNextAction(nextState) : null;
    if (!nextAction) {
      return "[Keep your answer brief. End with a natural spoken transition to what comes next. Do not end with a question or invitation for reply.]";
    }

    if (nextAction.phase === "quiz") {
      const isMiniQuiz = Boolean(nextState && nextAction.factId && nextState.chunkQuizQueue.includes(nextAction.factId));
      return isMiniQuiz
        ? "[Keep your answer brief. End with a natural spoken transition that tells the student a quick quiz is next on what they just learned. Do not end with a question or invitation for reply.]"
        : "[Keep your answer brief. End with a natural spoken transition that tells the student a review question is next. Do not end with a question or invitation for reply.]";
    }

    if (nextAction.phase === "review") {
      return "[Keep your answer brief. End with a natural spoken transition that says you'll revisit a tricky idea next. Do not end with a question or invitation for reply.]";
    }

    if (nextAction.phase === "recap") {
      return "[Keep your answer brief. End with a natural spoken transition that wraps up the lesson. Do not end with a question or invitation for reply.]";
    }

    return "[Keep your answer brief. End with a natural spoken transition to the next concept. Do not end with a question or invitation for reply.]";
  };

  // Calls Grok with focused lesson context + recent conversation history. When the
  // realtime tutor returns audio, the next speakText() consumes it directly;
  // otherwise we fall back to the existing two-step prefetch path.
  const askWithAck = async (
    userMessage: string,
    opts?: { maxTokens?: number; temperature?: number; clipPool?: "question" | "dontknow" | "neutral" }
  ): Promise<string> => {
    lastAckClipKeyRef.current = undefined;
    lastAckClipTextRef.current = undefined;

    // Append user message to history before calling Grok so the AI sees it
    appendHistory("user", userMessage);
    const { currentFact: ctxFact, phase: ctxPhase } = sessionContextRef.current;
    const systemMsg = buildFastTurnSystemMessage(ctxFact, ctxPhase);
    const recentHistory = conversationHistoryRef.current.slice(-4);

    const t0 = Date.now();
    const response = await callTutorGrok(
      [{ role: "system", content: systemMsg }, ...recentHistory],
      { maxTokens: opts?.maxTokens, temperature: opts?.temperature }
    );
    lastGrokLatencyRef.current = Date.now() - t0;
    lastTokenUsagePromptRef.current = response.usage?.prompt_tokens;
    lastTokenUsageCompletionRef.current = response.usage?.completion_tokens;
    lastRealtimeFirstAudioMsRef.current = response.firstAudioDeltaMs;
    lastRealtimeResponseDoneMsRef.current = response.responseDoneDeltaMs;
    sessionGrokCallsRef.current += 1;
    sessionGrokLatenciesRef.current.push(lastGrokLatencyRef.current);

    if (response.streamPlaybackPromise) {
      pendingTutorAudioRef.current = {
        text: response.content,
        streamPlaybackPromise: response.streamPlaybackPromise,
      };
    } else if (response.audioDataBase64 && response.sampleRate) {
      pendingTutorAudioRef.current = {
        text: response.content,
        audioDataBase64: response.audioDataBase64,
        sampleRate: response.sampleRate,
      };
    } else {
      pendingTutorAudioRef.current = null;
      await prefetchSpeakAndWait(response.content).catch(() => {
        // Fallback to the existing lazy prefetch path if the awaited prefetch fails.
        prefetchSpeak(response.content);
      });
    }

    // Append AI response to history so future calls see the full conversation
    appendHistory("assistant", response.content);
    return response.content;
  };

  const clearAiTurnMetrics = () => {
    lastGrokLatencyRef.current = undefined;
    lastAckClipKeyRef.current = undefined;
    lastAckClipTextRef.current = undefined;
    lastTokenUsagePromptRef.current = undefined;
    lastTokenUsageCompletionRef.current = undefined;
    lastRealtimeFirstAudioMsRef.current = undefined;
    lastRealtimeResponseDoneMsRef.current = undefined;
  };

  const buildRealtimeMetrics = () => ({
    realtimeFirstAudioMs: lastRealtimeFirstAudioMsRef.current,
    realtimeResponseDoneMs: lastRealtimeResponseDoneMsRef.current,
  });

  const clearPendingTeachTurnState = () => {
    if (checkinTimeoutRef.current) {
      clearTimeout(checkinTimeoutRef.current);
      checkinTimeoutRef.current = null;
    }
    if (pendingCheckinAdvanceRef.current) {
      clearTimeout(pendingCheckinAdvanceRef.current);
      pendingCheckinAdvanceRef.current = null;
    }
    pendingTeachAdvanceRef.current = null;
    teachCheckinRef.current = false;
    setIsTeachCheckin(false);
  };

  const replaceLastAssistantHistory = (content: string) => {
    const history = conversationHistoryRef.current;
    if (history.length === 0) return;

    const last = history[history.length - 1];
    if (last.role === "assistant") {
      history[history.length - 1] = { role: "assistant", content };
    }
  };

  const buildForcedTransitionLine = (nextState: LessonFlowState | null): string => {
    const nextAction = nextState ? getNextAction(nextState) : null;
    if (!nextAction) return "We'll keep going.";

    if (nextAction.phase === "quiz") {
      const isMiniQuiz = Boolean(nextState && nextAction.factId && nextState.chunkQuizQueue.includes(nextAction.factId));
      return isMiniQuiz ? "A quick quiz is next." : "A review question is next.";
    }

    if (nextAction.phase === "review") return "We'll revisit a tricky idea next.";
    if (nextAction.phase === "recap") return "We'll wrap up the lesson next.";
    return "Next, we'll move to the next idea.";
  };

  const closeNonInteractiveTurn = (text: string, nextState: LessonFlowState | null = null): string => {
    const trimmed = text.trim();
    if (!endsWithQuestion(trimmed)) return trimmed;

    const withoutQuestion = trimmed.replace(/[?!]+\s*$/, ".").trim();
    return `${withoutQuestion} ${buildForcedTransitionLine(nextState)}`.trim();
  };

  // Generates a 1-sentence "aha!" synthesis connecting all facts just quizzed in the chunk.
  // Called after the last mini-quiz answer. Uses sessionContextRef for stable fact lookup.
  const doChunkSynthesis = async (state: LessonFlowState) => {
    const facts = sessionContextRef.current.facts;
    const chunkFacts = state.chunkQuizQueue
      .map((id) => facts.find((f) => f.id === id))
      .filter(Boolean) as Fact[];
    if (chunkFacts.length < 2) return;
    const factSummaries = chunkFacts
      .map((f) => `"${f.content.split(/[.!?]/)[0].substring(0, 60).trim()}"`)
      .join("; ");
    const synthesisPrompt = `[SYNTHESIS MOMENT] We just covered ${chunkFacts.length} connected concepts: ${factSummaries}. In ONE sentence (15–25 words), say something insightful connecting them — a "so that's why..." or "and that's how these fit together" moment. Spoken voice, no lists, no meta-commentary.`;
    try {
      const rawSynthesis = await askWithAck(synthesisPrompt, {
        maxTokens: 70,
        temperature: 0.8,
        clipPool: "neutral",
      });
      const synthesis = closeNonInteractiveTurn(rawSynthesis);
      if (synthesis !== rawSynthesis) replaceLastAssistantHistory(synthesis);
      setTutorMessage(synthesis);
      await speakText(synthesis);
    } catch {
      // Synthesis is an enhancement; silent fail keeps the session moving
    }
  };

  const submitResponse = useCallback(
    async (rawUserText: string, sttLatencyMs?: number) => {
      if (!flowState || isProcessing || advancingRef.current) return;
      // Clean STT artifacts before any scoring or question detection
      const userText = cleanSttText(rawUserText);
      // Capture how long the user took to respond (tutor finished → mic input arrived)
      const userResponseDelayMs = awaitingResponseStartRef.current
        ? Date.now() - awaitingResponseStartRef.current
        : undefined;
      awaitingResponseStartRef.current = undefined;

      // ── Predict-before-reveal mode ────────────────────────────────────────────────────
      // Student just gave their prediction guess. Acknowledge it, then deliver the teach.
      if (predictFactRef.current && predictFlowStateRef.current) {
        const predictFact = predictFactRef.current;
        const predictState = predictFlowStateRef.current;
        predictFactRef.current = null;
        predictFlowStateRef.current = null;
        setIsProcessing(true);
        setIsAwaitingResponse(false);
        try {
          // If the user skipped the prediction ("I don't know", "move on", etc.),
          // deliver the cached teach script directly — no Grok call, no filler clip.
          // Otherwise, pick a bridge based on whether the prediction was correct
          // (positive ack) or off-track (gentle correction), then deliver the teach.
          const teachScript = teachScriptCache.current.get(predictFact.id) ?? predictFact.content;
          let bridgeText: string | null = null;
          let reaction: string;
          if (ADVANCE_SIGNALS.test(userText.trim())) {
            bridgeText = "No problem.";
            reaction = `${bridgeText} ${teachScript}`;
            appendHistory("user", userText);
            appendHistory("assistant", reaction);
            clearAiTurnMetrics();
          } else {
            if (isDontKnow(userText)) {
              bridgeText = "No problem.";
            } else if (predictionIsOnTrack(userText, predictFact.content)) {
              bridgeText = pick(PREDICT_ACK_CORRECT);
            } else {
              bridgeText = pick(PREDICT_ACK_LINES);
            }
            reaction = `${bridgeText} ${teachScript}`;
            appendHistory("user", userText);
            appendHistory("assistant", reaction);
            clearAiTurnMetrics();
          }
          setTutorMessage(reaction);
          const teachPrefetch = prefetchSpeakAndWait(teachScript);
          if (bridgeText) {
            await prefetchSpeakAndWait(bridgeText);
            await speakText(bridgeText);
            await teachPrefetch;
            await speakText(teachScript);
          } else {
            await teachPrefetch;
            await speakText(teachScript);
          }
          if (sessionLogId.current && session?.user?.id) {
            logInteraction({
              sessionLogId: sessionLogId.current,
              userId: session.user.id,
              lessonId,
              interactionType: "teach",
              factId: predictFact.id,
              factContent: predictFact.content,
              phase: "teach",
              fillerClipKey: lastAckClipKeyRef.current,
              fillerClipText: lastAckClipTextRef.current,
              tutorMessage: reaction,
              userTranscriptRaw: rawUserText,
              userTranscriptClean: userText,
              grokLatencyMs: lastGrokLatencyRef.current,
                ...buildRealtimeMetrics(),
              ttsLatencyMs: lastTtsLatencyRef.current,
              tokenUsagePrompt: lastTokenUsagePromptRef.current,
              tokenUsageCompletion: lastTokenUsageCompletionRef.current,
            });
          }
          // Post-teach checkin window
          const advancedState = markTeachDone(predictState, predictFact.id);
          pendingTeachAdvanceRef.current = advancedState;
          checkinExchangeCountRef.current = 0;
          checkinSourceRef.current = "prediction";
          teachCheckinRef.current = true;
          setIsTeachCheckin(true);
          // Only speak a scripted checkin if the reaction didn't already end with a question.
          if (!endsWithQuestion(reaction)) {
            const checkinLine = getTeachCheckinLine();
            setTutorMessage(checkinLine);
            await speakText(checkinLine);
            appendHistory("assistant", checkinLine);
          }
          if (checkinTimeoutRef.current) clearTimeout(checkinTimeoutRef.current);
          checkinTimeoutRef.current = setTimeout(() => {
            if (teachCheckinRef.current && pendingTeachAdvanceRef.current) {
              if (sessionLogId.current && session?.user?.id) {
                logInteraction({
                  sessionLogId: sessionLogId.current,
                  userId: session.user.id,
                  lessonId,
                  interactionType: "teach_checkin_timeout",
                  factId: predictFact.id,
                  factContent: predictFact.content,
                  phase: "teach",
                });
              }
              teachCheckinRef.current = false;
              setIsTeachCheckin(false);
              setIsAwaitingResponse(false);
              const next = pendingTeachAdvanceRef.current;
              pendingTeachAdvanceRef.current = null;
              setFlowState(next);
            }
          }, teachCheckinTimeoutMs);
          setIsAwaitingResponse(true);
        } catch {
          setIsAwaitingResponse(true);
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      // ── Teach checkin mode (post-fact question window) ───────────────────────────────
      if (teachCheckinRef.current && currentFact) {
        if (checkinTimeoutRef.current) clearTimeout(checkinTimeoutRef.current);
        // Cancel any pending delay-advance — new speech arrived, so the user is
        // still engaged (handles iOS STT fragmentation: "okay" fires as isFinal,
        // pendingCheckinAdvanceRef starts, then "so my question is..." arrives here).
        if (pendingCheckinAdvanceRef.current) {
          clearTimeout(pendingCheckinAdvanceRef.current);
          pendingCheckinAdvanceRef.current = null;
        }
        if (isQuestion(userText) && !ADVANCE_SIGNALS.test(userText.trim())) {
          setIsProcessing(true);
          setIsAwaitingResponse(false);
          try {
            checkinExchangeCountRef.current += 1;
            const maxExchanges = checkinSourceRef.current === "prediction"
              ? MAX_PREDICTION_CHECKIN_EXCHANGES
              : MAX_CHECKIN_EXCHANGES;
            const isLastExchange = checkinExchangeCountRef.current >= maxExchanges;
            const grokMessage = isLastExchange
              ? `${userText}\n\n${buildCheckinTransitionInstruction(pendingTeachAdvanceRef.current)}`
              : userText;
            const rawAnswer = await askWithAck(grokMessage, {
              maxTokens: 180,
              temperature: 0.5,
              clipPool: "question",
            });
            const answer = isLastExchange
              ? closeNonInteractiveTurn(rawAnswer, pendingTeachAdvanceRef.current)
              : rawAnswer;
            if (answer !== rawAnswer) replaceLastAssistantHistory(answer);
            setFeedback(answer);
            setTutorMessage(answer);
            await speakText(answer);
            // Log teach checkin question interaction
            if (sessionLogId.current && session?.user?.id) {
              sessionQuestionsRef.current += 1;
              logInteraction({
                sessionLogId: sessionLogId.current,
                userId: session.user.id,
                lessonId,
                interactionType: "teach_checkin_question",
                factId: currentFact.id,
                factContent: currentFact.content,
                phase: "teach",
                fillerClipKey: lastAckClipKeyRef.current,
                fillerClipText: lastAckClipTextRef.current,
                tutorMessage: answer,
                userTranscriptRaw: rawUserText,
                userTranscriptClean: userText,
                grokLatencyMs: lastGrokLatencyRef.current,
                ...buildRealtimeMetrics(),
                ttsLatencyMs: lastTtsLatencyRef.current,
                userResponseDelayMs,
              sttLatencyMs,
              tokenUsagePrompt: lastTokenUsagePromptRef.current,
              tokenUsageCompletion: lastTokenUsageCompletionRef.current,
              });
            }
            if (isLastExchange) {
              // Exchange cap reached — auto-advance now, don't re-open mic
              teachCheckinRef.current = false;
              setIsTeachCheckin(false);
              setIsAwaitingResponse(false);
              const nextState = pendingTeachAdvanceRef.current;
              pendingTeachAdvanceRef.current = null;
              if (nextState) setFlowState(nextState);
            } else {
              const promptedForMore = !endsWithQuestion(answer);
              if (promptedForMore) {
                await speakCheckinFollowUp();
              }
              // Re-arm auto-advance timeout — advance after 8s silence
              if (checkinTimeoutRef.current) clearTimeout(checkinTimeoutRef.current);
              checkinTimeoutRef.current = setTimeout(() => {
                if (teachCheckinRef.current && pendingTeachAdvanceRef.current) {
                  if (sessionLogId.current && session?.user?.id) {
                    logInteraction({
                      sessionLogId: sessionLogId.current,
                      userId: session.user.id,
                      lessonId,
                      interactionType: "teach_checkin_timeout",
                      factId: currentFact.id,
                      factContent: currentFact.content,
                      phase: "teach",
                    });
                  }
                  teachCheckinRef.current = false;
                  setIsTeachCheckin(false);
                  setIsAwaitingResponse(false);
                  const nextState = pendingTeachAdvanceRef.current;
                  pendingTeachAdvanceRef.current = null;
                  setFlowState(nextState);
                }
              }, endsWithQuestion(answer) || promptedForMore ? followUpSilenceTimeoutMs : followUpBridgeTimeoutMs);
              // Stay in checkin — allow follow-up question
              setIsAwaitingResponse(true);
            }
          } catch {
            setIsAwaitingResponse(true);
          } finally {
            setIsProcessing(false);
          }
        } else if (ADVANCE_SIGNALS.test(userText.trim())) {
          // Delay briefly before advancing — prediction checkins get a longer grace
          // window because STT often splits "okay so my question is..." into an early
          // advance signal plus the real follow-up. Only advance if the user stays silent.
          const capturedFact = currentFact;
          const capturedUserText = userText;
          const capturedRawUserText = rawUserText;
          const capturedDelay = userResponseDelayMs;
          const capturedLatency = sttLatencyMs;
          const advanceDelayMs = checkinSourceRef.current === "prediction"
            ? predictionAdvanceGraceDelayMs
            : advanceGraceDelayMs;
          pendingCheckinAdvanceRef.current = setTimeout(() => {
            pendingCheckinAdvanceRef.current = null;
            if (!teachCheckinRef.current || !pendingTeachAdvanceRef.current) return;
            if (sessionLogId.current && session?.user?.id && capturedFact) {
              logInteraction({
                sessionLogId: sessionLogId.current,
                userId: session.user.id,
                lessonId,
                interactionType: "teach_checkin_advance",
                factId: capturedFact.id,
                factContent: capturedFact.content,
                phase: "teach",
                userTranscriptRaw: capturedRawUserText,
                userTranscriptClean: capturedUserText,
                userResponseDelayMs: capturedDelay,
                sttLatencyMs: capturedLatency,
              });
            }
            teachCheckinRef.current = false;
            setIsTeachCheckin(false);
            setIsAwaitingResponse(false);
            appendHistory("user", capturedUserText);
            const next = pendingTeachAdvanceRef.current;
            pendingTeachAdvanceRef.current = null;
            setFlowState(next);
          }, advanceDelayMs);
          // Keep mic alive — if user continues speaking, advance will be cancelled above
          setIsAwaitingResponse(true);
        } else {
          // Ambiguous input ("So H.M.", "wait...", partial sentences) —
          // DON'T advance. Pass to tutor to interpret charitably as a question.
          // This prevents premature advance when STT flushes a mid-sentence pause.
          setIsProcessing(true);
          setIsAwaitingResponse(false);
          try {
            checkinExchangeCountRef.current += 1;
            const maxExchanges = checkinSourceRef.current === "prediction"
              ? MAX_PREDICTION_CHECKIN_EXCHANGES
              : MAX_CHECKIN_EXCHANGES;
            const isLastExchange = checkinExchangeCountRef.current >= maxExchanges;
            const grokMessage = isLastExchange
              ? `${userText}\n\n${buildCheckinTransitionInstruction(pendingTeachAdvanceRef.current)}`
              : userText;
            const rawAnswer = await askWithAck(grokMessage, { maxTokens: 160, temperature: 0.6, clipPool: "neutral" });
            const answer = isLastExchange
              ? closeNonInteractiveTurn(rawAnswer, pendingTeachAdvanceRef.current)
              : rawAnswer;
            if (answer !== rawAnswer) replaceLastAssistantHistory(answer);
            setFeedback(answer);
            setTutorMessage(answer);
            await speakText(answer);
            // Log ambiguous teach checkin input (treated as implicit question)
            if (sessionLogId.current && session?.user?.id) {
              sessionQuestionsRef.current += 1;
              logInteraction({
                sessionLogId: sessionLogId.current,
                userId: session.user.id,
                lessonId,
                interactionType: "teach_checkin_question",
                factId: currentFact.id,
                factContent: currentFact.content,
                phase: "teach",
                fillerClipKey: lastAckClipKeyRef.current,
                fillerClipText: lastAckClipTextRef.current,
                tutorMessage: answer,
                userTranscriptRaw: rawUserText,
                userTranscriptClean: userText,
                grokLatencyMs: lastGrokLatencyRef.current,
                ...buildRealtimeMetrics(),
                ttsLatencyMs: lastTtsLatencyRef.current,
                userResponseDelayMs,
              sttLatencyMs,
              tokenUsagePrompt: lastTokenUsagePromptRef.current,
              tokenUsageCompletion: lastTokenUsageCompletionRef.current,
              });
            }
            if (isLastExchange) {
              // Exchange cap reached — auto-advance, don't re-open mic
              teachCheckinRef.current = false;
              setIsTeachCheckin(false);
              setIsAwaitingResponse(false);
              const nextState = pendingTeachAdvanceRef.current;
              pendingTeachAdvanceRef.current = null;
              if (nextState) setFlowState(nextState);
            } else {
              const promptedForMore = !endsWithQuestion(answer);
              if (promptedForMore) {
                await speakCheckinFollowUp();
              }
              // Re-arm auto-advance timeout so silence after answer doesn't freeze
              if (checkinTimeoutRef.current) clearTimeout(checkinTimeoutRef.current);
              checkinTimeoutRef.current = setTimeout(() => {
                if (teachCheckinRef.current && pendingTeachAdvanceRef.current) {
                  if (sessionLogId.current && session?.user?.id) {
                    logInteraction({
                      sessionLogId: sessionLogId.current,
                      userId: session.user.id,
                      lessonId,
                      interactionType: "teach_checkin_timeout",
                      factId: currentFact.id,
                      factContent: currentFact.content,
                      phase: "teach",
                    });
                  }
                  teachCheckinRef.current = false;
                  setIsTeachCheckin(false);
                  setIsAwaitingResponse(false);
                  const nextState = pendingTeachAdvanceRef.current;
                  pendingTeachAdvanceRef.current = null;
                  setFlowState(nextState);
                }
              }, endsWithQuestion(answer) || promptedForMore ? followUpSilenceTimeoutMs : followUpBridgeTimeoutMs);
              // Stay in checkin — re-open mic for follow-up
              setIsAwaitingResponse(true);
            }
          } catch {
            setIsAwaitingResponse(true);
          } finally {
            setIsProcessing(false);
          }
        }
        return;
      }
      // ── Clarification mode (after wrong answer) ──────────────────────────
      // Safety: if clarify state is for a DIFFERENT fact than the current one,
      // the skip advanced past it without clearing it — clear it now so it
      // cannot intercept this fact's answer, reset quizPromptSentRef, and re-fire the prompt.
      if (clarifyFactRef.current && clarifyFactRef.current.id !== currentFact?.id) {
        clarifyFactRef.current = null;
        clarifyCountRef.current = 0;
        if (currentFact?.id) {
          recallAssistRef.current.delete(currentFact.id);
        }
      }
      if (clarifyFactRef.current) {
        const fact = clarifyFactRef.current;
        const assistState = recallAssistRef.current.get(fact.id) ?? { hintsUsed: 0 as 0 | 1 | 2, revealedAnswer: false };

        if (assistState.revealedAnswer) {
          setIsProcessing(true);
          setIsAwaitingResponse(false);
          try {
            const priorProfile = getLearningProfile(fact.id);
            const repeatResult = await scoreResponse(fact, userText, currentQuizQuestionRef.current ?? undefined);
            const repeatAssessment = buildRevealRepeatAssessment(repeatResult.score, priorProfile);
            const closingMessage = repeatResult.score >= 4 ? "Good. We'll revisit that soon." : "Okay. We'll come back to that one soon.";

            setFeedbackScore(0);
            setFeedback(closingMessage);
            setTutorMessage(closingMessage);
            await speakText(closingMessage);

            if (sessionLogId.current && session?.user?.id) {
              logInteraction({
                sessionLogId: sessionLogId.current,
                userId: session.user.id,
                lessonId,
                interactionType: "user_answer",
                factId: fact.id,
                factContent: fact.content,
                phase,
                tutorMessage: closingMessage,
                userTranscriptRaw: rawUserText,
                userTranscriptClean: userText,
                evalScore: repeatResult.score,
                isCorrect: false,
                userResponseDelayMs,
                sttLatencyMs,
              });
            }

            await persistFactProgress(fact.id, repeatAssessment);
            clarifyFactRef.current = null;
            clarifyCountRef.current = 0;
            recallAssistRef.current.delete(fact.id);
            clearCurrentQuestion();
            const newFlowState = advanceWithIncorrectResult(flowState, fact.id);
            await new Promise((resolve) => setTimeout(resolve, 200));
            setFlowState(newFlowState);
          } finally {
            setIsProcessing(false);
          }
          return;
        }

        if (isHelpRequest(userText) || isDontKnow(userText) || isAnswerRequest(userText)) {
          setIsProcessing(true);
          setIsAwaitingResponse(false);
          try {
            await handleRecallAssistRequest(
              fact,
              flowState,
              rawUserText,
              userText,
              isDontKnow(userText) ? "dontknow" : "help",
              isDontKnow(userText) ? "dont_know" : "clarification_question",
              userResponseDelayMs,
              sttLatencyMs
            );
          } finally {
            setIsProcessing(false);
          }
          return;
        }

        if (isQuestion(userText) && clarifyCountRef.current < MAX_CLARIFY_EXCHANGES) {
          setIsProcessing(true);
          setIsAwaitingResponse(false);
          try {
            clarifyCountRef.current += 1;
            const answer = await askWithAck(userText, {
              maxTokens: 180,
              temperature: 0.5,
              clipPool: "question",
            });
            // Clear the red score from the wrong answer — clarification is a neutral Q&A exchange
            setFeedbackScore(null);
            setFeedback(answer);
            setTutorMessage(answer);
            await speakText(answer);
            // Log clarification question interaction
            if (sessionLogId.current && session?.user?.id) {
              sessionQuestionsRef.current += 1;
              logInteraction({
                sessionLogId: sessionLogId.current,
                userId: session.user.id,
                lessonId,
                interactionType: "clarification_question",
                factId: fact.id,
                factContent: fact.content,
                phase: "quiz",
                fillerClipKey: lastAckClipKeyRef.current,
                fillerClipText: lastAckClipTextRef.current,
                tutorMessage: answer,
                userTranscriptRaw: rawUserText,
                userTranscriptClean: userText,
                grokLatencyMs: lastGrokLatencyRef.current,
                ...buildRealtimeMetrics(),
                ttsLatencyMs: lastTtsLatencyRef.current,
                userResponseDelayMs,
              sttLatencyMs,
              tokenUsagePrompt: lastTokenUsagePromptRef.current,
              tokenUsageCompletion: lastTokenUsageCompletionRef.current,
              });
            }

            if (clarifyCountRef.current < MAX_CLARIFY_EXCHANGES) {
              setTutorMessage(CLARIFICATION_RETRY_PROMPT);
              await speakText(CLARIFICATION_RETRY_PROMPT);
              appendHistory("assistant", CLARIFICATION_RETRY_PROMPT);
              setIsAwaitingResponse(true);
            } else {
              const msg = "Let's keep going — we'll come back to this one.";
              setTutorMessage(msg);
              await speakText(msg);
              await persistIncorrectOutcomeOnce(fact.id);
              clarifyFactRef.current = null;
              clarifyCountRef.current = 0;
              recallAssistRef.current.delete(fact.id);
              clearCurrentQuestion();
              const newFlowState = advanceWithIncorrectResult(flowState, fact.id);
              await new Promise((resolve) => setTimeout(resolve, 200));
              setFlowState(newFlowState);
            }
          } catch {
            void persistIncorrectOutcomeOnce(fact.id);
            clarifyFactRef.current = null;
            clarifyCountRef.current = 0;
            recallAssistRef.current.delete(fact.id);
            clearCurrentQuestion();
            setFlowState(advanceWithIncorrectResult(flowState, fact.id));
          } finally {
            setIsProcessing(false);
          }
          return;
        }

        setIsProcessing(true);
        setIsAwaitingResponse(false);
        try {
          const retryResult = await scoreResponse(fact, userText, currentQuizQuestionRef.current ?? undefined);
          sessionEvalScoresRef.current.push(retryResult.score);
          setFeedbackScore(retryResult.score);

          if (retryResult.isCorrect) {
            const correctMsg = formatCorrectFeedback(retryResult.feedback, retryResult.score);
            const assessment = buildCorrectAssessment(retryResult.score, assistState.hintsUsed);

            setFeedback(correctMsg);
            setTutorMessage(correctMsg);
            await speakText(correctMsg);

            if (sessionLogId.current && session?.user?.id) {
              logInteraction({
                sessionLogId: sessionLogId.current,
                userId: session.user.id,
                lessonId,
                interactionType: "user_answer",
                factId: fact.id,
                factContent: fact.content,
                phase,
                tutorMessage: correctMsg,
                userTranscriptRaw: rawUserText,
                userTranscriptClean: userText,
                evalScore: retryResult.score,
                isCorrect: true,
                userResponseDelayMs,
                sttLatencyMs,
              });
            }

            const newFlowState = markFactResult(flowState, fact.id, true);
            setStats((prev) => ({
              ...prev,
              totalReviewed: prev.totalReviewed + 1,
              correctCount: prev.correctCount + 1,
            }));
            const newStreak = streakRef.current + 1;
            streakRef.current = newStreak;
            setStreak(newStreak);
            await persistFactProgress(fact.id, assessment);
            clarifyFactRef.current = null;
            clarifyCountRef.current = 0;
            recallAssistRef.current.delete(fact.id);
            clearCurrentQuestion();
            await new Promise((resolve) => setTimeout(resolve, 200));
            setFlowState(newFlowState);
          } else {
            await handleRecallAssistRequest(
              fact,
              flowState,
              rawUserText,
              userText,
              isDontKnow(userText) ? "dontknow" : "help",
              "clarification_question",
              userResponseDelayMs,
              sttLatencyMs,
              { evalScore: retryResult.score, isCorrect: false }
            );
          }
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      if (!currentFact) return;

      if (isHelpRequest(userText) || isDontKnow(userText) || isAnswerRequest(userText)) {
        setIsProcessing(true);
        setIsAwaitingResponse(false);
        try {
          clarifyFactRef.current = currentFact;
          await handleRecallAssistRequest(
            currentFact,
            flowState,
            rawUserText,
            userText,
            isDontKnow(userText) ? "dontknow" : "help",
            isDontKnow(userText) ? "dont_know" : "user_question",
            userResponseDelayMs,
            sttLatencyMs
          );
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      // ── Always-on question detection ───────────────────────────────────
      // User can ask a question at any point during quiz/review listening
      if (isQuestion(userText)) {
        setIsProcessing(true);
        setIsAwaitingResponse(false);
        try {
          const answer = await askWithAck(userText, {
            maxTokens: 180,
            temperature: 0.5,
            clipPool: "question",
          });
          setFeedback(answer);
          setTutorMessage(answer);
          await speakText(answer);
          // Log quiz-mode question interaction
          if (sessionLogId.current && session?.user?.id) {
            sessionQuestionsRef.current += 1;
            logInteraction({
              sessionLogId: sessionLogId.current,
              userId: session.user.id,
              lessonId,
              interactionType: "user_question",
              factId: currentFact.id,
              factContent: currentFact.content,
              phase: phase,
              fillerClipKey: lastAckClipKeyRef.current,
              fillerClipText: lastAckClipTextRef.current,
              tutorMessage: answer,
              userTranscriptRaw: rawUserText,
              userTranscriptClean: userText,
              grokLatencyMs: lastGrokLatencyRef.current,
                ...buildRealtimeMetrics(),
              ...buildRealtimeMetrics(),
              ttsLatencyMs: lastTtsLatencyRef.current,
              userResponseDelayMs,
              sttLatencyMs,
              tokenUsagePrompt: lastTokenUsagePromptRef.current,
              tokenUsageCompletion: lastTokenUsageCompletionRef.current,
            });
          }
          // Re-await response — the quiz question is still open
          setIsAwaitingResponse(true);
        } catch {
          setIsAwaitingResponse(true);
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      // ── Normal response scoring ───────────────────────────────────────────
      setIsProcessing(true);
      setIsAwaitingResponse(false);
      setFeedback(null);

      try {
        // Always use Grok for natural, context-aware feedback.
        // Pass the quiz question so the model grades against what was asked,
        // not the full fact text (fixes short-answer underscoring).
        let scoringGrokMs: number | undefined;
        const t0 = Date.now();
        const result = await scoreResponse(currentFact, userText, currentQuizQuestionRef.current ?? undefined);
        scoringGrokMs = Date.now() - t0;
        lastTokenUsagePromptRef.current = result.tokenUsagePrompt;
        lastTokenUsageCompletionRef.current = result.tokenUsageCompletion;
        sessionGrokCallsRef.current += 1;
        sessionGrokLatenciesRef.current.push(scoringGrokMs);

        setFeedbackScore(result.score);
        sessionEvalScoresRef.current.push(result.score);

        if (result.isCorrect) {
          const correctMsg = formatCorrectFeedback(result.feedback, result.score);
          const assessment = buildCorrectAssessment(result.score, 0);
          setFeedback(correctMsg);
          setTutorMessage(correctMsg);
          await new Promise((resolve) => setTimeout(resolve, FEEDBACK_SOUND_LEAD_MS));
          await speakText(correctMsg);
          appendHistory("user", userText);
          appendHistory("assistant", correctMsg);
          recallAssistRef.current.delete(currentFact.id);
          persistedIncorrectFactIdsRef.current.delete(currentFact.id);
          // Log correct answer interaction
          if (sessionLogId.current && session?.user?.id) {
            logInteraction({
              sessionLogId: sessionLogId.current,
              userId: session.user.id,
              lessonId,
              interactionType: "user_answer",
              factId: currentFact.id,
              factContent: currentFact.content,
              phase: phase,
              tutorMessage: correctMsg,
              userTranscriptRaw: rawUserText,
              userTranscriptClean: userText,
              evalScore: result.score,
              isCorrect: true,
              grokLatencyMs: scoringGrokMs,
              ttsLatencyMs: lastTtsLatencyRef.current,
              userResponseDelayMs,
              sttLatencyMs,
              tokenUsagePrompt: lastTokenUsagePromptRef.current,
              tokenUsageCompletion: lastTokenUsageCompletionRef.current,
            });
          }
          const newFlowState = markFactResult(flowState, currentFact.id, true);
          setStats((prev) => ({
            ...prev,
            totalReviewed: prev.totalReviewed + 1,
            correctCount: prev.correctCount + 1,
          }));
          const newStreak = streakRef.current + 1;
          streakRef.current = newStreak;
          setStreak(newStreak);
          // Streak milestone — brief spoken celebration at 3, 5, 10 in a row
          if (newStreak === 3 || newStreak === 5 || newStreak === 10) {
            const milestoneMsg = pick(STREAK_MILESTONE_LINES[newStreak]);
            setTutorMessage(milestoneMsg);
            await speakText(milestoneMsg);
            appendHistory("assistant", milestoneMsg);
          }
          // Chunk synthesis + perfect chunk detection
          const isLastChunkFact =
            flowState.chunkQuizQueue.length > 0 &&
            flowState.chunkQuizIndex === flowState.chunkQuizQueue.length - 1 &&
            flowState.chunkQuizQueue[flowState.chunkQuizIndex] === currentFact.id;
          if (isLastChunkFact && flowState.chunkQuizQueue.length >= 2) {
            // Perfect chunk = every fact in this chunk mini-quiz was answered correctly
            const perfectChunk = flowState.chunkQuizQueue.every(
              (id) => newFlowState.factsCorrect.includes(id)
            );
            if (perfectChunk) {
              setPerfectChunkJustCompleted(true);
              setTimeout(() => setPerfectChunkJustCompleted(false), 3000);
            }
            await doChunkSynthesis(flowState);
          }
          await persistFactProgress(currentFact.id, assessment);
          await new Promise((resolve) => setTimeout(resolve, 200));
          clearCurrentQuestion();
          setFlowState(newFlowState);
        } else {
          const fact = currentFact;
          clarifyFactRef.current = fact;
          clarifyCountRef.current = 0;
          setStreak(0);
          streakRef.current = 0;

          await handleRecallAssistRequest(
            fact,
            flowState,
            rawUserText,
            userText,
            isDontKnow(userText) ? "dontknow" : "help",
            "user_question",
            userResponseDelayMs,
            sttLatencyMs,
            { evalScore: result.score, isCorrect: false }
          );
        }
      } catch (error) {
        console.error("Failed to score quiz response; keeping the same question open:", error);
        const retryMessage = "I had trouble checking that. Say it one more time.";
        setFeedbackScore(null);
        setFeedback(retryMessage);
        setTutorMessage(retryMessage);
        await speakText(retryMessage);
        if (sessionLogId.current && session?.user?.id) {
          logInteraction({
            sessionLogId: sessionLogId.current,
            userId: session.user.id,
            lessonId,
            interactionType: "user_answer",
            factId: currentFact.id,
            factContent: currentFact.content,
            phase: phase,
            tutorMessage: retryMessage,
            userTranscriptRaw: rawUserText,
            userTranscriptClean: userText,
            userResponseDelayMs,
            sttLatencyMs,
          });
        }
        setIsAwaitingResponse(true);
      } finally {
        setIsProcessing(false);
      }
    },
    [currentFact, flowState]
  );

  const persistFactProgress = async (factId: string, assessment: FactAssessment) => {
    if (!session?.user?.id) return;

    try {
      const existingProgress = userProgress.get(factId);
      const learningProfile = mergeLearningProfile(existingProgress?.learning_profile, assessment);

      const currentProgress: FactProgress = existingProgress
        ? {
            easeFactor: existingProgress.ease_factor,
            intervalDays: existingProgress.interval_days,
            repetitions: existingProgress.repetitions,
            nextReviewAt: new Date(existingProgress.next_review_at),
            lastReviewedAt: new Date(existingProgress.last_reviewed_at),
            masteryLevel: existingProgress.mastery_level,
            timesCorrect: existingProgress.times_correct,
            timesIncorrect: existingProgress.times_incorrect,
          }
        : createDefaultProgress();

      const nextReview = calculateNextReview(currentProgress, { quality: getAssessmentSchedulingQuality(assessment) });
      const clamped = clampProgressAfterAssessment(nextReview, assessment);

      await supabase.from("user_fact_progress").upsert(
        {
          user_id: session.user.id,
          fact_id: factId,
          ease_factor: nextReview.easeFactor,
          interval_days: clamped.intervalDays,
          repetitions: clamped.repetitions,
          next_review_at: new Date(nextReview.lastReviewedAt.getTime() + clamped.intervalDays * 24 * 60 * 60 * 1000).toISOString(),
          last_reviewed_at: nextReview.lastReviewedAt.toISOString(),
          mastery_level: clamped.masteryLevel,
          times_correct: nextReview.timesCorrect,
          times_incorrect: nextReview.timesIncorrect,
          learning_profile: learningProfile as unknown as Record<string, unknown>,
        },
        { onConflict: "user_id,fact_id" }
      );
    } catch (e) {
      console.error("Failed to persist progress:", e);
    }
  };

  const skipFact = useCallback(() => {
    if (!flowState || !currentFact) return;
    if (skipInFlightFactRef.current === currentFact.id) return;
    skipInFlightFactRef.current = currentFact.id;
    setIsAwaitingResponse(false);
    clearPendingTeachTurnState();
    // Clear stale per-turn state so it cannot bleed into the next quiz or predict turn.
    // Without this, a wrong-answer clarify fact from the previous question intercepts the
    // first response for the next question, resets quizPromptSentRef, and re-fires the prompt.
    clarifyFactRef.current = null;
    clarifyCountRef.current = 0;
    predictFactRef.current = null;
    predictFlowStateRef.current = null;
    recallAssistRef.current.delete(currentFact.id);
    clearCurrentQuestion();
    // Log skip interaction
    if (sessionLogId.current && session?.user?.id) {
      logInteraction({
        sessionLogId: sessionLogId.current,
        userId: session.user.id,
        lessonId,
        interactionType: "skip",
        factId: currentFact.id,
        factContent: currentFact.content,
        phase: phase,
      });
    }
    void persistIncorrectOutcomeOnce(currentFact.id);
    const newFlowState = advanceWithIncorrectResult(flowState, currentFact.id);
    setFlowState(newFlowState);
  }, [flowState, currentFact, lessonId, phase, session]);

  const finalizeSession = useCallback(async () => {
    if (sessionFinalizedRef.current) return;
    sessionFinalizedRef.current = true;

    if (timerRef.current) clearInterval(timerRef.current);
    stopSpeaking();

    if (sessionLogId.current && session?.user?.id) {
      try {
        // Compute session-level aggregates from logged interaction data
        const grokLatencies = sessionGrokLatenciesRef.current;
        const evalScores = sessionEvalScoresRef.current;
        const avgGrokLatencyMs = grokLatencies.length > 0
          ? Math.round(grokLatencies.reduce((a, b) => a + b, 0) / grokLatencies.length)
          : null;
        const avgEvalScore = evalScores.length > 0
          ? evalScores.reduce((a, b) => a + b, 0) / evalScores.length
          : null;

        await supabase
          .from("session_logs")
          .update({
            ended_at: new Date().toISOString(),
            facts_reviewed: stats.totalReviewed,
            facts_correct: stats.correctCount,
            duration_seconds: stats.elapsedSeconds,
            avg_eval_score: avgEvalScore,
            avg_grok_latency_ms: avgGrokLatencyMs,
            total_grok_calls: sessionGrokCallsRef.current,
            total_questions_asked: sessionQuestionsRef.current,
          })
          .eq("id", sessionLogId.current);
      } catch (e) {
        console.error("Failed to update session log:", e);
      }
    }

    if (stats.totalReviewed > 0) {
      await recordCompletion(lessonId, stats.totalReviewed, stats.correctCount, stats.elapsedSeconds);
    }
  }, [stats, session?.user?.id, lessonId, recordCompletion]);

  const endSession = useCallback(async () => {
    await finalizeSession();
  }, [finalizeSession]);

  return {
    phase,
    currentFact,
    activeQuestion,
    tutorMessage,
    feedback,
    feedbackScore,
    stats,
    streak,
    perfectChunkJustCompleted,
    isProcessing,
    isComplete,
    isSpeaking,
    isAwaitingResponse,
    isTeachCheckin,
    totalFacts,
    reviewFactCount,
    reviewSegmentStart,
    reviewSegmentEnd,
    hasNextReviewSegment,
    nextReviewSegmentStart,
    sessionLogId: sessionLogId.current,
    submitResponse,
    notifySpeechDetected,
    skipFact,
    endSession,
  };
}
