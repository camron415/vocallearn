import { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import * as Haptics from "expo-haptics";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "@/hooks/useSession";
import { buildSessionHref, DEFAULT_REVIEW_FACT_LIMIT, useSessionStore } from "@/stores/session-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useAuthStore } from "@/stores/auth-store";
import { COLORS } from "@/constants/config";
import { BugReportModal } from "@/components/session/BugReportModal";
import { buildReviewQueueParam, parseReviewQueueParam } from "@/lib/review-dashboard";
import type { Fact } from "@/types/lesson";
import {
  speak,
  startListening,
  stopListening,
  resetAudioForPlayback,
  setBackgroundAudio,
  setLessonPace as setVoiceLessonPace,
  useSpeechRecognitionEvent,
} from "@/lib/voice";
import { initSounds, cleanupSounds, playSound } from "@/lib/sounds";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SESSION_KEEP_AWAKE_TAG = "vocallearn-session";

// Voice commands for hands-free mode
const VOICE_COMMANDS: Record<string, string> = {
  skip: "skip",
  "skip it": "skip",
  "next one": "skip",
  "move on": "skip",
  repeat: "repeat",
  "say that again": "repeat",
  "one more time": "repeat",
  stop: "stop",
  "end session": "stop",
  "i'm done": "stop",
};

function detectVoiceCommand(text: string): string | null {
  const normalized = text.toLowerCase().trim();
  return VOICE_COMMANDS[normalized] ?? null;
}

function parsePositiveIntParam(value: string | string[] | undefined, fallback: number): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

const FACT_VOCAB_HINTS: Array<{ pattern: RegExp; phrases: string[] }> = [
  {
    pattern: /\bfew[- ]shot\b/i,
    phrases: [
      "few-shot",
      "few shot",
      "few-shot prompting",
      "few shot prompting",
      "example inputs and outputs",
      "input output pairs",
    ],
  },
  {
    pattern: /chain[- ]of[- ]thought|step[- ]by[- ]step/i,
    phrases: [
      "chain of thought",
      "chain-of-thought",
      "think step by step",
      "step by step",
    ],
  },
  {
    pattern: /prompt injection/i,
    phrases: ["prompt injection", "malicious instructions", "jailbreak prompt"],
  },
  {
    pattern: /context injection/i,
    phrases: ["context injection", "retrieved context", "grounding context"],
  },
];

function buildSpeechContextHints(fact: Fact | null): string[] {
  if (!fact) return [];

  const hints = new Set<string>();

  fact.tags?.forEach((tag) => {
    const trimmed = tag.trim();
    if (!trimmed) return;

    hints.add(trimmed);
    const spaced = trimmed.replace(/[_-]+/g, " ");
    if (spaced !== trimmed) {
      hints.add(spaced);
    }
  });

  FACT_VOCAB_HINTS.forEach(({ pattern, phrases }) => {
    const matchesFact = pattern.test(fact.content) || Boolean(fact.tags?.some((tag) => pattern.test(tag)));
    if (!matchesFact) return;

    phrases.forEach((phrase) => hints.add(phrase));
  });

  const quotedPhrases = fact.content.match(/"([^"]+)"/g) ?? [];
  quotedPhrases.forEach((phrase) => hints.add(phrase.replaceAll('"', "")));

  return Array.from(hints).filter((hint) => hint.length > 1).slice(0, 12);
}

const PHASE_CONFIG = {
  greeting: { icon: "hand-left" as const, label: "Welcome", color: COLORS.success, bg: COLORS.successMuted },
  overview: { icon: "book" as const, label: "Overview", color: COLORS.blue, bg: "rgba(0, 122, 255, 0.10)" },
  teach: { icon: "bulb" as const, label: "Learning", color: COLORS.blue, bg: "rgba(0, 122, 255, 0.10)" },
  quiz: { icon: "help-circle" as const, label: "Quiz Time", color: COLORS.primary, bg: COLORS.primaryMuted },
  review: { icon: "refresh" as const, label: "Review", color: COLORS.warning, bg: COLORS.warningMuted },
  recap: { icon: "trophy" as const, label: "Recap", color: COLORS.success, bg: COLORS.successMuted },
  intro: { icon: "hourglass" as const, label: "Loading", color: COLORS.textSecondary, bg: COLORS.bgElevated },
  complete: { icon: "checkmark-circle" as const, label: "Done", color: COLORS.success, bg: COLORS.successMuted },
};

// Phases where the user just listens (no mic needed)
const LISTEN_ONLY_PHASES = new Set(["greeting", "overview", "teach", "recap"]);
const LISTEN_WATCHDOG_MS = 12000;

const CONFETTI_COLORS = [
  "#FF6B6B", "#34C759", "#FF9500", "#007AFF",
  "#AF52DE", "#FFD700", "#FF2D55", "#5AC8FA",
];

type ConfettiParticle = {
  tx: Animated.Value;
  ty: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
  angle: number;
  distance: number;
  isSquare: boolean;
};

function ConfettiBurst({ trigger }: { trigger: number }) {
  const particlesRef = useRef<ConfettiParticle[] | null>(null);
  if (!particlesRef.current) {
    particlesRef.current = Array.from({ length: 28 }).map((_, i) => ({
      tx: new Animated.Value(0),
      ty: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      angle: (i / 28) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
      distance: 55 + Math.random() * 110,
      isSquare: i % 3 === 0,
    }));
  }
  const particles = particlesRef.current;

  useEffect(() => {
    if (trigger === 0) return;
    particles.forEach((p, i) => {
      p.tx.setValue(0);
      p.ty.setValue(0);
      p.opacity.setValue(0);
      p.scale.setValue(0);
      const dx = Math.cos(p.angle) * p.distance;
      const dy = Math.sin(p.angle) * p.distance - 60;
      const delay = i % 4 === 0 ? 0 : i % 4 === 1 ? 40 : i % 4 === 2 ? 80 : 120;
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(p.tx, { toValue: dx, useNativeDriver: true, speed: 5, bounciness: 2 }),
          Animated.spring(p.ty, { toValue: dy, useNativeDriver: true, speed: 5, bounciness: 2 }),
          Animated.spring(p.scale, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 10 }),
          Animated.sequence([
            Animated.timing(p.opacity, { toValue: 1, duration: 60, useNativeDriver: true }),
            Animated.delay(600),
            Animated.timing(p.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]),
        ]).start();
      }, delay);
    });
  }, [trigger]);

  if (trigger === 0) return null;

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 201, alignItems: "center", justifyContent: "center" }}
    >
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            width: p.isSquare ? 9 : 7,
            height: p.isSquare ? 9 : 7,
            borderRadius: p.isSquare ? 2 : 4,
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: [{ translateX: p.tx }, { translateY: p.ty }, { scale: p.scale }],
          }}
        />
      ))}
    </View>
  );
}

export default function SessionScreen() {
  const { id, mode, queue, reviewStart, reviewLimit } = useLocalSearchParams<{
    id: string;
    mode?: string | string[];
    queue?: string | string[];
    reviewStart?: string | string[];
    reviewLimit?: string | string[];
  }>();
  const router = useRouter();
  const sessionMode = Array.isArray(mode) ? mode[0] : mode;
  const reviewQueueLessonIds = useMemo(() => parseReviewQueueParam(queue), [queue]);
  const reviewStartIndex = parsePositiveIntParam(reviewStart, 0);
  const reviewFactLimit = parsePositiveIntParam(reviewLimit, DEFAULT_REVIEW_FACT_LIMIT) || DEFAULT_REVIEW_FACT_LIMIT;
  const currentQueueIndex = reviewQueueLessonIds.indexOf(id!);
  const remainingQueueLessonIds =
    currentQueueIndex >= 0 ? reviewQueueLessonIds.slice(currentQueueIndex + 1) : [];
  const nextQueueLessonId = remainingQueueLessonIds[0] ?? null;
  const startStoredSession = useSessionStore((s) => s.startSession);
  const updateStoredSession = useSessionStore((s) => s.updateSession);
  const clearStoredSession = useSessionStore((s) => s.endSession);
  const {
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
    totalFacts,
    reviewFactCount,
    reviewSegmentStart,
    reviewSegmentEnd,
    hasNextReviewSegment,
    nextReviewSegmentStart,
    sessionLogId,
    submitResponse,
    notifySpeechDetected,
    skipFact,
    endSession,
    isTeachCheckin,
  } = useSession(id!, sessionMode === "review" ? "review" : "lesson", {
    reviewStartIndex,
    reviewFactLimit,
  });

  const handsFreeMode = useSettingsStore((s) => s.handsFreeMode);
  const backgroundAudioEnabled = useSettingsStore((s) => s.backgroundAudioEnabled);
  const lessonPace = useSettingsStore((s) => s.lessonPace);
  const authSession = useAuthStore((s) => s.session);
  const speechContextHints = useMemo(() => buildSpeechContextHints(currentFact), [currentFact]);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscriptRaw] = useState("");
  const transcriptRef = useRef("");
  const setTranscript = (t: string) => { transcriptRef.current = t; setTranscriptRaw(t); };
  const [writeMode, setWriteMode] = useState(false);
  const [writeInput, setWriteInput] = useState("");
  const [showBugReport, setShowBugReport] = useState(false);
  const [isTouchLockActive, setIsTouchLockActive] = useState(false);
  const [unlockHoldProgress, setUnlockHoldProgress] = useState(0);

  // Timestamp when the mic stops — used to compute STT processing latency
  // (mic-stop → final transcript fires). Measured across 'end' and 'result' events.
  const micStopTimeRef = useRef<number | undefined>(undefined);
  // Prevents double-submit when iOS fires 'end' after 'result' with isFinal
  const submittedForCurrentListenRef = useRef(false);
  // Grace period timer for short isFinal results (< 4 words) during teach checkin.
  // iOS STT fires isFinal on 0.5s pauses mid-sentence — this holds the result for
  // 1.5s so if the user continues speaking, we cancel and process the longer utterance.
  const sttGraceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // If iOS stops recognition without ever producing a final result, the last partial
  // transcript can be clipped mid-sentence. Allow one automatic retry for short
  // leftovers before we trust that partial and submit it.
  const partialFallbackRetryRef = useRef(0);
  // Ref copies of hook values for use inside speech recognition event handlers
  // (closures capture stale values; refs always reflect latest render)
  const isAwaitingResponseRef = useRef(isAwaitingResponse);
  const isProcessingRef = useRef(isProcessing);
  const isSpeakingRef = useRef(isSpeaking);
  const isTeachCheckinRef = useRef(isTeachCheckin);
  const optionalListenSettledRef = useRef(false);
  const listenWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenStartInFlightRef = useRef(false);
  const ignoreRecognitionEndUntilRef = useRef(0);
  const unlockHoldTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlockProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unlockHoldStartedAtRef = useRef<number | null>(null);

  // Animations
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const flashColor = useRef("#34C759");
  const micPulse = useRef(new Animated.Value(1)).current;
  const phaseSlide = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  // Progress bar spring (pixel width, useNativeDriver: false)
  const progressBarWidth = useRef(new Animated.Value(0)).current;
  // Session complete entrance
  const completeScale = useRef(new Animated.Value(0)).current;
  const completeFade = useRef(new Animated.Value(0)).current;
  const completeSlide = useRef(new Animated.Value(24)).current;
  const statsSlide = useRef(new Animated.Value(32)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const feedbackSlide = useRef(new Animated.Value(50)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const loadingPulse = useRef(new Animated.Value(1)).current;
  const streakScale = useRef(new Animated.Value(0)).current;

  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [completeCelebration, setCompleteCelebration] = useState(0);

  const clearUnlockHoldTimers = () => {
    if (unlockHoldTimeoutRef.current) {
      clearTimeout(unlockHoldTimeoutRef.current);
      unlockHoldTimeoutRef.current = null;
    }

    if (unlockProgressIntervalRef.current) {
      clearInterval(unlockProgressIntervalRef.current);
      unlockProgressIntervalRef.current = null;
    }

    unlockHoldStartedAtRef.current = null;
  };

  const cancelUnlockHold = () => {
    clearUnlockHoldTimers();
    setUnlockHoldProgress(0);
  };

  const activateTouchLock = () => {
    cancelUnlockHold();
    setShowBugReport(false);
    setIsTouchLockActive(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const beginUnlockHold = () => {
    clearUnlockHoldTimers();
    unlockHoldStartedAtRef.current = Date.now();
    setUnlockHoldProgress(0.02);

    unlockProgressIntervalRef.current = setInterval(() => {
      if (!unlockHoldStartedAtRef.current) return;
      const elapsed = Date.now() - unlockHoldStartedAtRef.current;
      setUnlockHoldProgress(Math.min(1, elapsed / 3000));
    }, 100);

    unlockHoldTimeoutRef.current = setTimeout(() => {
      clearUnlockHoldTimers();
      setUnlockHoldProgress(0);
      setIsTouchLockActive(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 3000);
  };

  // Minimum loading display time — ensures the screen is visible long enough
  // to feel intentional (data often loads in < 300ms which is too fast)
  const [minLoadingDone, setMinLoadingDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinLoadingDone(true), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    activateKeepAwakeAsync(SESSION_KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(SESSION_KEEP_AWAKE_TAG).catch(() => {});
    };
  }, []);

  useEffect(() => () => clearUnlockHoldTimers(), []);

  // Pre-load UI sounds once on mount, clean up on unmount
  useEffect(() => {
    initSounds();
    return () => { cleanupSounds(); };
  }, []);

  // Loading screen pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(loadingPulse, { toValue: 1.18, duration: 1100, useNativeDriver: true }),
        Animated.timing(loadingPulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Mic breathing animation
  useEffect(() => {
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(micPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      micPulse.setValue(1);
    }
  }, [isListening]);

  // Phase transition animation
  useEffect(() => {
    phaseSlide.setValue(-20);
    Animated.spring(phaseSlide, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  }, [phase]);

  // Feedback animation — slide in + flash
  useEffect(() => {
    if (feedbackScore !== null) {
      const isCorrect = feedbackScore >= 3;
      flashColor.current = isCorrect ? COLORS.success : COLORS.error;

      // Haptic — tiered by score quality, plus matching sound chime
      if (feedbackScore === 5) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        playSound("perfect");
      } else if (feedbackScore >= 3) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        playSound("correct");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        playSound("wrong");
      }

      // Screen flash
      flashOpacity.setValue(0.15);
      Animated.timing(flashOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start();

      // Card scale pop
      Animated.sequence([
        Animated.spring(cardScale, { toValue: isCorrect ? 1.03 : 0.98, useNativeDriver: true, speed: 50 }),
        Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
      ]).start();

      // Feedback slide in
      feedbackSlide.setValue(30);
      feedbackOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(feedbackSlide, { toValue: 0, useNativeDriver: true, speed: 20 }),
        Animated.timing(feedbackOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [feedbackScore]);

  // Sync background audio setting with voice engine
  useEffect(() => {
    setBackgroundAudio(backgroundAudioEnabled);
    return () => setBackgroundAudio(false);
  }, [backgroundAudioEnabled]);

  useEffect(() => {
    setVoiceLessonPace(lessonPace);
  }, [lessonPace]);

  // Confetti burst on perfect chunk
  useEffect(() => {
    if (perfectChunkJustCompleted) {
      setConfettiTrigger((n) => n + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [perfectChunkJustCompleted]);

  // Confetti + entrance animations + haptic + sound on session complete
  useEffect(() => {
    if (isComplete) {
      cancelUnlockHold();
      setIsTouchLockActive(false);

      // Reset entrance values
      completeScale.setValue(0);
      completeFade.setValue(0);
      completeSlide.setValue(24);
      statsSlide.setValue(32);
      buttonFade.setValue(0);

      // Staggered entrance: trophy → title/subtitle → stats → button
      Animated.spring(completeScale, {
        toValue: 1, useNativeDriver: true, speed: 18, bounciness: 14,
      }).start();
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(completeFade, { toValue: 1, duration: 340, useNativeDriver: true }),
          Animated.spring(completeSlide, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }),
        ]).start();
      }, 140);
      setTimeout(() => {
        Animated.spring(statsSlide, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 4 }).start();
      }, 320);
      setTimeout(() => {
        Animated.timing(buttonFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      }, 520);

      // Triple haptic pulse: Light → Medium → Heavy
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 80);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 180);

      playSound("session_complete");

      // Confetti for good accuracy
      if (stats.totalReviewed > 0 && stats.correctCount / stats.totalReviewed >= 0.6) {
        setTimeout(() => setCompleteCelebration((n) => n + 1), 400);
      }
    }
  }, [isComplete]);

  // Streak badge pop-in animation — springs in when streak first reaches 2,
  // then stays visible and just updates the number.
  const prevStreakRef = useRef(streak);
  useEffect(() => {
    if (streak >= 2 && prevStreakRef.current < 2) {
      // First time hitting streak — pop in
      streakScale.setValue(0);
      Animated.spring(streakScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 14 }).start();
    } else if (streak < 2) {
      // Streak broken — fade out
      Animated.timing(streakScale, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    } else if (streak >= 2 && prevStreakRef.current >= 2) {
      // Streak increased — quick bounce
      Animated.sequence([
        Animated.spring(streakScale, { toValue: 1.3, useNativeDriver: true, speed: 40 }),
        Animated.spring(streakScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
      ]).start();
    }
    prevStreakRef.current = streak;
  }, [streak]);

  // Progress bar spring: animate width to new pixel value on each advance
  useEffect(() => {
    const pct = totalFacts > 0 ? Math.min(100, (stats.totalReviewed / totalFacts) * 100) : 0;
    Animated.spring(progressBarWidth, {
      toValue: (SCREEN_WIDTH - 40) * (pct / 100),
      useNativeDriver: false,
      speed: 14,
      bounciness: 4,
    }).start();
  }, [stats.totalReviewed, totalFacts]);

  // Keep refs in sync with latest hook values — done inline during render (not via
  // useEffect) so event handlers always see the current value without a stale window.
  isAwaitingResponseRef.current = isAwaitingResponse;
  isProcessingRef.current = isProcessing;
  isSpeakingRef.current = isSpeaking;
  isTeachCheckinRef.current = isTeachCheckin;

  // Clear the user's transcript bubble whenever we move to a new fact or phase
  // so the previous response doesn't linger on screen into the next question
  useEffect(() => {
    setTranscript("");
    partialFallbackRetryRef.current = 0;
    optionalListenSettledRef.current = false;
  }, [phase, currentFact]);

  useEffect(() => {
    if (!isAwaitingResponse || !isTeachCheckin) {
      optionalListenSettledRef.current = false;
    }
  }, [isAwaitingResponse, isTeachCheckin]);

  const clearListenWatchdog = () => {
    if (listenWatchdogRef.current) {
      clearTimeout(listenWatchdogRef.current);
      listenWatchdogRef.current = null;
    }
  };

  const beginListeningStart = () => {
    listenStartInFlightRef.current = true;
    ignoreRecognitionEndUntilRef.current = Date.now() + 750;
  };

  const finishListeningStart = () => {
    listenStartInFlightRef.current = false;
  };

  const armListenWatchdog = () => {
    clearListenWatchdog();
    listenWatchdogRef.current = setTimeout(() => {
      listenWatchdogRef.current = null;
      setIsListening(false);
      stopListening().catch(() => {});
    }, LISTEN_WATCHDOG_MS);
  };

  useEffect(() => () => clearListenWatchdog(), []);

  // Auto-listen when tutor finishes speaking
  useEffect(() => {
    if (
      isAwaitingResponse &&
      !writeMode &&
      !isProcessing &&
      !isListening &&
      !listenStartInFlightRef.current &&
      !(isTeachCheckin && optionalListenSettledRef.current)
    ) {
      const timer = setTimeout(async () => {
        try {
          setTranscript("");
          submittedForCurrentListenRef.current = false;
          beginListeningStart();
          await startListening({
            language: "en-US",
            continuous: false,
            contextualStrings: speechContextHints,
          });
          setIsListening(true);
          finishListeningStart();
          armListenWatchdog();
          // Subtle haptic + chime — confirms mic is live without being intrusive
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          playSound("mic_open");
        } catch {
          finishListeningStart();
          clearListenWatchdog();
          setWriteMode(true);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isAwaitingResponse, writeMode, isProcessing, isListening, isTeachCheckin]);

  useSpeechRecognitionEvent("result", (event) => {
    finishListeningStart();
    ignoreRecognitionEndUntilRef.current = 0;
    armListenWatchdog();
    const text = event.results[0]?.transcript ?? "";
    if (text.trim()) {
      notifySpeechDetected();
      optionalListenSettledRef.current = false;
    }
    setTranscript(text);
    if (event.isFinal) {
      if (!isAwaitingResponseRef.current || isProcessingRef.current || isSpeakingRef.current) {
        clearListenWatchdog();
        partialFallbackRetryRef.current = 0;
        setTranscript("");
        setIsListening(false);
        stopListening().catch(() => {});
        return;
      }

      clearListenWatchdog();
      setIsListening(false);
      const trimmed = text.trim();
      if (!trimmed) return;

      // Compute STT latency: mic-stop → final transcript received
      const sttLatencyMs = micStopTimeRef.current
        ? Date.now() - micStopTimeRef.current
        : undefined;
      micStopTimeRef.current = undefined;

      // Cancel any pending grace timer — a longer/new isFinal supersedes it
      if (sttGraceTimerRef.current) {
        clearTimeout(sttGraceTimerRef.current);
        sttGraceTimerRef.current = null;
      }

      if (handsFreeMode) {
        const command = detectVoiceCommand(trimmed);
        if (command === "skip") {
          setTranscript("");
          skipFact();
          return;
        }
        if (command === "repeat") {
          setTranscript("");
          if (tutorMessage) speak(tutorMessage);
          return;
        }
        if (command === "stop") {
          setTranscript("");
          endSession().then(() => router.back());
          return;
        }
      }

      setTranscript(""); // clear immediately so it doesn't linger during processing
      submittedForCurrentListenRef.current = true;

      // Grace period: during teach checkin, short isFinal results (< 4 words) may be
      // mid-sentence — iOS fires isFinal on 0.5s pauses. Hold for 1.5s; if the user
      // continues speaking, the next STT session will cancel this and process the full text.
      const wordCount = trimmed.split(/\s+/).length;
      partialFallbackRetryRef.current = 0;
      if (isTeachCheckin && wordCount < 4) {
        sttGraceTimerRef.current = setTimeout(() => {
          sttGraceTimerRef.current = null;
          submitResponse(trimmed, sttLatencyMs);
        }, 1500);
      } else {
        submitResponse(trimmed, sttLatencyMs);
      }
    } else {
      // Non-final partial result — user is still speaking, cancel any grace timer
      if (sttGraceTimerRef.current) {
        clearTimeout(sttGraceTimerRef.current);
        sttGraceTimerRef.current = null;
        submittedForCurrentListenRef.current = false;
      }
    }
  });

  useSpeechRecognitionEvent("end", () => {
    if (
      !transcriptRef.current.trim() &&
      (listenStartInFlightRef.current || Date.now() < ignoreRecognitionEndUntilRef.current)
    ) {
      return;
    }

    if (!isAwaitingResponseRef.current || isProcessingRef.current || isSpeakingRef.current) {
      finishListeningStart();
      ignoreRecognitionEndUntilRef.current = 0;
      clearListenWatchdog();
      micStopTimeRef.current = undefined;
      setIsListening(false);
      setTranscript("");
      return;
    }

    finishListeningStart();
    ignoreRecognitionEndUntilRef.current = 0;
    clearListenWatchdog();
    micStopTimeRef.current = Date.now();
    setIsListening(false);
    resetAudioForPlayback();
    if (!transcriptRef.current.trim() && isTeachCheckinRef.current) {
      optionalListenSettledRef.current = true;
      return;
    }
    // iOS hard-stops STT at ~5s without firing isFinal — recover by submitting
    // the last partial transcript if we're still awaiting a response
    if (
      !submittedForCurrentListenRef.current &&
      !sttGraceTimerRef.current &&
      isAwaitingResponseRef.current &&
      transcriptRef.current.trim() &&
      !isProcessingRef.current
    ) {
      const t = transcriptRef.current.trim();
      const command = handsFreeMode ? detectVoiceCommand(t) : null;
      if (!command && partialFallbackRetryRef.current === 0) {
        partialFallbackRetryRef.current = 1;
        setTranscript("");
        return;
      }
      partialFallbackRetryRef.current = 0;
      setTranscript("");
      submittedForCurrentListenRef.current = true;
      submitResponse(t);
    }
  });

  useSpeechRecognitionEvent("error", () => {
    finishListeningStart();
    ignoreRecognitionEndUntilRef.current = 0;
    clearListenWatchdog();
    setIsListening(false);
  });

  const toggleListening = async () => {
    if (listenStartInFlightRef.current) return;

    if (isListening) {
      clearListenWatchdog();
      await stopListening();
      setIsListening(false);
    } else {
      setTranscript("");
      optionalListenSettledRef.current = false;
      try {
        beginListeningStart();
        await startListening({
          language: "en-US",
          continuous: false,
          contextualStrings: speechContextHints,
        });
        setIsListening(true);
        finishListeningStart();
        armListenWatchdog();
      } catch {
        finishListeningStart();
        clearListenWatchdog();
        setWriteMode(true);
      }
    }
  };

  const handleWriteSubmit = () => {
    if (writeInput.trim()) {
      submitResponse(writeInput.trim());
      setWriteInput("");
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = totalFacts > 0 ? Math.min(100, (stats.totalReviewed / totalFacts) * 100) : 0;
  const phaseInfo = PHASE_CONFIG[phase] ?? PHASE_CONFIG.intro;
  const unlockSecondsRemaining = Math.max(1, Math.ceil((1 - unlockHoldProgress) * 3));
  const reviewQueueParam = buildReviewQueueParam(remainingQueueLessonIds);
  const goToNextReviewSegment = () => {
    if (hasNextReviewSegment) {
      router.replace(
        buildSessionHref(id!, "review", {
          queueLessonIds: reviewQueueLessonIds,
          reviewStartIndex: nextReviewSegmentStart,
          reviewFactLimit,
        })
      );
      return;
    }

    if (!nextQueueLessonId || !reviewQueueParam) return;
    router.replace(
      buildSessionHref(nextQueueLessonId, "review", {
        queueLessonIds: remainingQueueLessonIds,
        reviewFactLimit,
      })
    );
  };

  useEffect(() => {
    startStoredSession({
      lessonId: id!,
      sessionMode: sessionMode === "review" ? "review" : "lesson",
      queueLessonIds: reviewQueueLessonIds,
      reviewStartIndex,
      reviewFactLimit,
    });
  }, [id, reviewFactLimit, reviewQueueLessonIds, reviewStartIndex, sessionMode, startStoredSession]);

  useEffect(() => {
    if (!isComplete) return;

    if (hasNextReviewSegment) {
      updateStoredSession({
        lessonId: id!,
        sessionMode: "review",
        queueLessonIds: reviewQueueLessonIds,
        reviewStartIndex: nextReviewSegmentStart,
        reviewFactLimit,
      });
      return;
    }

    if (nextQueueLessonId) {
      updateStoredSession({
        lessonId: nextQueueLessonId,
        sessionMode: "review",
        queueLessonIds: remainingQueueLessonIds,
        reviewStartIndex: 0,
        reviewFactLimit,
      });
      return;
    }

    clearStoredSession();
  }, [
    clearStoredSession,
    hasNextReviewSegment,
    id,
    isComplete,
    nextQueueLessonId,
    nextReviewSegmentStart,
    remainingQueueLessonIds,
    reviewFactLimit,
    reviewQueueLessonIds,
    updateStoredSession,
  ]);

  // Loading screen — shown while data loads AND for a minimum 2.5 seconds
  // so the transition feels intentional rather than a flash
  if (phase === "intro" || !minLoadingDone) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          {/* Pulsing background glow */}
          <Animated.View
            style={{
              position: "absolute",
              width: 144,
              height: 144,
              borderRadius: 72,
              backgroundColor: COLORS.primaryMuted,
              transform: [{ scale: loadingPulse }],
            }}
          />
          {/* Icon circle */}
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: COLORS.bgElevated,
              borderWidth: 1.5,
              borderColor: COLORS.borderLight,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 36,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 44 }}>🎓</Text>
          </View>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 22,
              fontWeight: "700",
              letterSpacing: -0.5,
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            Your tutor is getting ready
          </Text>
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 15,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            Setting up today's lesson{"\n"}and loading your content...
          </Text>
          <View style={{ marginTop: 32 }}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ position: "absolute", bottom: 0, padding: 16 }}
          >
            <Text style={{ color: COLORS.textTertiary, fontSize: 14 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


  if (isComplete) {
    const accuracy =
      stats.totalReviewed > 0
        ? Math.round((stats.correctCount / stats.totalReviewed) * 100)
        : 0;

    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Animated.View
          style={{
            width: 100, height: 100, borderRadius: 50,
            backgroundColor: COLORS.successMuted,
            justifyContent: "center", alignItems: "center",
            transform: [{ scale: completeScale }],
          }}
        >
          <Ionicons name="trophy" size={52} color={COLORS.success} />
        </Animated.View>
      <ConfettiBurst trigger={completeCelebration} />
      <Animated.View style={{ alignItems: "center", opacity: completeFade, transform: [{ translateY: completeSlide }] }}>
        <Text
          style={{
            color: COLORS.text,
            fontSize: 28,
            fontWeight: "800",
            marginTop: 20,
            letterSpacing: -0.5,
          }}
        >
          Great Work!
        </Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 15, marginTop: 6 }}>
          {accuracy >= 80 ? "You crushed it!" : accuracy >= 50 ? "Keep practicing — you're improving!" : "Every session makes you stronger."}
        </Text>
      </Animated.View>

        <Animated.View
          style={{
            backgroundColor: COLORS.bgElevated,
            borderRadius: 20,
            padding: 28,
            marginTop: 32,
            width: "100%",
            borderWidth: 1,
            borderColor: COLORS.borderLight,
            transform: [{ translateY: statsSlide }],
            opacity: completeFade,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: COLORS.success, fontSize: 36, fontWeight: "800" }}>
                {stats.correctCount}
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: "500" }}>Correct</Text>
            </View>
            <View style={{ width: 1, backgroundColor: COLORS.borderLight }} />
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: COLORS.error, fontSize: 36, fontWeight: "800" }}>
                {stats.incorrectCount}
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: "500" }}>Missed</Text>
            </View>
            <View style={{ width: 1, backgroundColor: COLORS.borderLight }} />
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: COLORS.text, fontSize: 36, fontWeight: "800" }}>
                {accuracy}%
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: "500" }}>Accuracy</Text>
            </View>
          </View>

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: COLORS.borderLight,
              marginTop: 20,
              paddingTop: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
              {formatTime(stats.elapsedSeconds)} · {stats.totalReviewed} facts reviewed
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={{ width: "100%", opacity: buttonFade }}>
          {hasNextReviewSegment ? (
            <>
              <View
                style={{
                  backgroundColor: COLORS.bgElevated,
                  borderRadius: 16,
                  padding: 16,
                  marginTop: 24,
                  borderWidth: 1,
                  borderColor: COLORS.borderLight,
                }}
              >
                <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: "700" }}>
                  This lesson review has {reviewFactCount - reviewSegmentEnd} fact{reviewFactCount - reviewSegmentEnd !== 1 ? "s" : ""} left
                </Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 6, lineHeight: 19 }}>
                  You just finished facts {reviewSegmentStart + 1}-{reviewSegmentEnd} of {reviewFactCount}. Continue to review the next batch.
                </Text>
              </View>

              <TouchableOpacity
                onPress={goToNextReviewSegment}
                activeOpacity={0.8}
                style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: 16,
                  padding: 18,
                  marginTop: 20,
                  width: "100%",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Ionicons name="layers" size={20} color="#fff" />
                <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "700" }}>
                  Continue Review
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  clearStoredSession();
                  router.back();
                }}
                activeOpacity={0.8}
                style={{
                  backgroundColor: COLORS.bgElevated,
                  borderRadius: 16,
                  padding: 18,
                  marginTop: 12,
                  width: "100%",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: COLORS.borderLight,
                }}
              >
                <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "700" }}>
                  Done for now
                </Text>
              </TouchableOpacity>
            </>
          ) : nextQueueLessonId ? (
            <>
              <View
                style={{
                  backgroundColor: COLORS.bgElevated,
                  borderRadius: 16,
                  padding: 16,
                  marginTop: 24,
                  borderWidth: 1,
                  borderColor: COLORS.borderLight,
                }}
              >
                <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: "700" }}>
                  Review queue still has {remainingQueueLessonIds.length} lesson{remainingQueueLessonIds.length !== 1 ? "s" : ""} left
                </Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 6, lineHeight: 19 }}>
                  Keep going to clear the next due lesson without jumping back through the tabs.
                </Text>
              </View>

              <TouchableOpacity
                onPress={goToNextReviewSegment}
                activeOpacity={0.8}
                style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: 16,
                  padding: 18,
                  marginTop: 20,
                  width: "100%",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Ionicons name="arrow-forward" size={20} color="#fff" />
                <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "700" }}>
                  Next Review
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  clearStoredSession();
                  router.back();
                }}
                activeOpacity={0.8}
                style={{
                  backgroundColor: COLORS.bgElevated,
                  borderRadius: 16,
                  padding: 18,
                  marginTop: 12,
                  width: "100%",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: COLORS.borderLight,
                }}
              >
                <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "700" }}>
                  Done for now
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => {
                clearStoredSession();
                router.back();
              }}
              activeOpacity={0.8}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 16,
                padding: 18,
                marginTop: 32,
                width: "100%",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "700" }}>
                Done
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: COLORS.bg }}
    >
      <ConfettiBurst trigger={confettiTrigger} />
      {/* Screen flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: flashColor.current,
          opacity: flashOpacity,
          zIndex: 100,
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <TouchableOpacity
              onPress={async () => { await endSession(); router.back(); }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
              <Text style={{ color: COLORS.textSecondary, fontSize: 15, fontWeight: "500" }}>
                {formatTime(stats.elapsedSeconds)}
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              {/* Streak fire badge */}
              <Animated.View
                style={{
                  transform: [{ scale: streakScale }],
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Text style={{ fontSize: 14 }}>🔥</Text>
                <Text style={{ color: COLORS.warning, fontSize: 15, fontWeight: "800" }}>
                  {streak}
                </Text>
              </Animated.View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success }} />
                <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: "700" }}>
                  {stats.correctCount}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error }} />
                <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: "700" }}>
                  {stats.incorrectCount}
                </Text>
              </View>

              <TouchableOpacity
                onPress={activateTouchLock}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: isTouchLockActive ? COLORS.primaryMuted : COLORS.bgElevated,
                  borderWidth: 1,
                  borderColor: isTouchLockActive ? COLORS.primary : COLORS.borderLight,
                }}
              >
                <Ionicons
                  name={isTouchLockActive ? "lock-closed" : "lock-open-outline"}
                  size={14}
                  color={isTouchLockActive ? COLORS.primary : COLORS.textSecondary}
                />
                <Text
                  style={{
                    color: isTouchLockActive ? COLORS.primary : COLORS.textSecondary,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {isTouchLockActive ? "Locked" : "Lock"}
                </Text>
              </TouchableOpacity>

              {/* Bug report button */}
              <TouchableOpacity
                onPress={() => setShowBugReport(true)}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              >
                <Ionicons name="bug" size={18} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress bar — thicker, rounded, animated-feeling */}
          <View
            style={{
              height: 6,
              backgroundColor: COLORS.bgElevated,
              borderRadius: 3,
              marginTop: 12,
              overflow: "hidden",
            }}
          >
            <Animated.View
              style={{
                height: "100%",
                backgroundColor: phaseInfo.color,
                width: progressBarWidth,
                borderRadius: 3,
              }}
            />
          </View>
        </View>

        {/* Main content area */}
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>

          {/* Phase indicator — compact inline */}
          <Animated.View style={{ transform: [{ translateY: phaseSlide }], flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <View style={{
              width: 26, height: 26, borderRadius: 13,
              backgroundColor: phaseInfo.bg,
              justifyContent: "center", alignItems: "center",
            }}>
              <Ionicons name={phaseInfo.icon} size={13} color={phaseInfo.color} />
            </View>
            <Text style={{ color: phaseInfo.color, fontSize: 12, fontWeight: "700", letterSpacing: 0.5 }}>
              {phaseInfo.label.toUpperCase()}
            </Text>
            <Text style={{ color: COLORS.textTertiary, fontSize: 12 }}>
              {stats.totalReviewed}/{totalFacts}
            </Text>
          </Animated.View>

          {/* Fact progress dots — show when there are ≤12 facts to track */}
          {totalFacts > 0 && totalFacts <= 12 && (
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5, marginBottom: 10 }}>
              {Array.from({ length: totalFacts }).map((_, i) => {
                const isDone = i < stats.totalReviewed;
                const isCurrent = i === stats.totalReviewed;
                return (
                  <View
                    key={i}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 3.5,
                      backgroundColor: isDone
                        ? phaseInfo.color
                        : isCurrent
                          ? COLORS.primary
                          : COLORS.bgTertiary,
                      borderWidth: isCurrent ? 1.5 : 0,
                      borderColor: COLORS.primary,
                      opacity: isDone ? 1 : isCurrent ? 1 : 0.5,
                    }}
                  />
                );
              })}
            </View>
          )}

          {activeQuestion ? (
            <View
              style={{
                backgroundColor: COLORS.bgElevated,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLORS.primaryMuted,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: COLORS.primary, fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 6 }}>
                CURRENT QUESTION
              </Text>
              <Text style={{ color: COLORS.text, fontSize: 15, lineHeight: 22, fontWeight: "600" }}>
                {activeQuestion}
              </Text>
            </View>
          ) : null}

          {/* Tutor message card — scrollable for long messages */}
          <Animated.View
            style={{
              transform: [{ scale: cardScale }],
              backgroundColor: COLORS.bgElevated,
              borderRadius: 16,
              borderLeftWidth: 3,
              borderLeftColor: phaseInfo.color,
              flex: 1,
              maxHeight: feedback ? 160 : undefined,
            }}
          >
            {isSpeaking && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingTop: 10 }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.primary }} />
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, opacity: 0.5 }} />
                <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.primary, opacity: 0.3 }} />
                <Text style={{ color: COLORS.primary, fontSize: 10, fontWeight: "600", letterSpacing: 0.5, marginLeft: 2 }}>
                  SPEAKING
                </Text>
              </View>
            )}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 14, paddingTop: isSpeaking ? 6 : 14 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={{ color: COLORS.text, fontSize: 15, lineHeight: 23 }}>
                {tutorMessage}
              </Text>
            </ScrollView>
          </Animated.View>

          {/* User response / listening / feedback — compact bottom section */}
          <View style={{ marginTop: 10, gap: 8 }}>
            {/* Transcript */}
            {transcript ? (
              <View
                style={{
                  alignSelf: "flex-end",
                  maxWidth: "80%",
                  backgroundColor: COLORS.primary,
                  borderRadius: 14,
                  borderBottomRightRadius: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 14, lineHeight: 20 }}>
                  {transcript}
                </Text>
              </View>
            ) : null}

            {/* Listening indicator — compact inline */}
            {isListening && !transcript && (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Animated.View style={{ transform: [{ scale: micPulse }] }}>
                  <Ionicons name="mic" size={16} color={COLORS.primary} />
                </Animated.View>
                <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: "500" }}>
                  Listening...
                </Text>
              </View>
            )}

            {/* Feedback — compact */}
            {feedback && (
              <Animated.View
                style={{
                  transform: [{ translateY: feedbackSlide }],
                  opacity: feedbackOpacity,
                  borderRadius: 12,
                  padding: 12,
                  backgroundColor:
                    feedbackScore !== null && feedbackScore >= 3 ? COLORS.successMuted : COLORS.errorMuted,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons
                    name={feedbackScore !== null && feedbackScore >= 3 ? "checkmark-circle" : "close-circle"}
                    size={18}
                    color={feedbackScore !== null && feedbackScore >= 3 ? COLORS.success : COLORS.error}
                  />
                  <Text
                    style={{
                      color: feedbackScore !== null && feedbackScore >= 3 ? COLORS.success : COLORS.error,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {feedbackScore !== null && feedbackScore >= 3 ? "Nice!" : "Not quite"}
                  </Text>
                </View>
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 13,
                    lineHeight: 19,
                    marginTop: 4,
                    marginLeft: 24,
                  }}
                >
                  {feedback}
                </Text>
              </Animated.View>
            )}
          </View>
        </View>

        {/* Input area — pinned at bottom */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 16, paddingTop: 12 }}>
          {LISTEN_ONLY_PHASES.has(phase) && !isTeachCheckin && !isAwaitingResponse && !isProcessing ? (
            <View style={{ alignItems: "center", paddingVertical: 16, gap: 4 }}>
              <Ionicons name="headset-outline" size={22} color={COLORS.blue} />
              <Text style={{ color: COLORS.blue, fontSize: 13, fontWeight: "500" }}>
                Just listen...
              </Text>
            </View>
          ) : isProcessing ? (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={{ color: COLORS.textSecondary, fontSize: 14, fontWeight: "500" }}>
                Thinking...
              </Text>
            </View>
          ) : writeMode ? (
            <View>
              <TextInput
                value={writeInput}
                onChangeText={setWriteInput}
                placeholder="Type your answer..."
                placeholderTextColor={COLORS.textTertiary}
                multiline
                style={{
                  backgroundColor: COLORS.bgElevated,
                  borderRadius: 14,
                  padding: 14,
                  color: COLORS.text,
                  fontSize: 15,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  maxHeight: 100,
                  textAlignVertical: "top",
                }}
              />
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => setWriteMode(false)}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 12,
                    padding: 14,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons name="mic" size={16} color={COLORS.textSecondary} />
                  <Text style={{ color: COLORS.textSecondary, fontSize: 14, fontWeight: "600" }}>Voice</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleWriteSubmit}
                  style={{
                    flex: 2,
                    backgroundColor: COLORS.primary,
                    borderRadius: 12,
                    padding: 14,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "700" }}>
                    Submit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 }}>
              <TouchableOpacity
                onPress={() => setWriteMode(true)}
                style={{ alignItems: "center", padding: 8 }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgElevated, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: COLORS.borderLight }}>
                  <Ionicons name="create-outline" size={20} color={COLORS.textSecondary} />
                </View>
                <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 4, fontWeight: "500" }}>Type</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={toggleListening}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 34,
                    backgroundColor: isListening ? COLORS.error : COLORS.primary,
                    justifyContent: "center",
                    alignItems: "center",
                    transform: [{ scale: isListening ? micPulse : 1 }],
                    shadowColor: isListening ? COLORS.error : COLORS.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: isListening ? 16 : 8,
                  }}
                >
                  <Ionicons
                    name={isListening ? "stop" : "mic"}
                    size={28}
                    color="#ffffff"
                  />
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={skipFact}
                style={{ alignItems: "center", padding: 8 }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgElevated, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: COLORS.borderLight }}>
                  <Ionicons name="play-skip-forward" size={20} color={COLORS.textSecondary} />
                </View>
                <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 4, fontWeight: "500" }}>Skip</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>

      {isTouchLockActive && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(8, 10, 18, 0.84)",
            zIndex: 220,
          }}
        >
          <SafeAreaView style={{ flex: 1, justifyContent: "center", padding: 24 }}>
            <View
              style={{
                backgroundColor: COLORS.bg,
                borderRadius: 24,
                padding: 24,
                borderWidth: 1,
                borderColor: COLORS.borderLight,
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: COLORS.primaryMuted,
                  alignItems: "center",
                  justifyContent: "center",
                  alignSelf: "center",
                }}
              >
                <Ionicons name="lock-closed" size={28} color={COLORS.primary} />
              </View>

              <View style={{ gap: 8 }}>
                <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "800", textAlign: "center" }}>
                  Touch lock is on
                </Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 15, lineHeight: 22, textAlign: "center" }}>
                  The lesson will keep talking and listening, but accidental touches are blocked while your phone is in your pocket.
                </Text>
                <Text style={{ color: COLORS.textTertiary, fontSize: 13, lineHeight: 20, textAlign: "center" }}>
                  The screen stays awake during the session. {handsFreeMode ? "Voice commands still work: skip, repeat, stop." : "Unlock when you need the controls again."}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={1}
                onPressIn={beginUnlockHold}
                onPressOut={cancelUnlockHold}
                style={{
                  marginTop: 8,
                  borderRadius: 18,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: COLORS.borderLight,
                  backgroundColor: COLORS.bgElevated,
                }}
              >
                <View style={{ paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14, alignItems: "center", gap: 6 }}>
                  <Ionicons name="hand-right" size={20} color={COLORS.primary} />
                  <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "700" }}>
                    {unlockHoldProgress > 0 ? `Keep holding... ${unlockSecondsRemaining}` : "Hold 3 seconds to unlock"}
                  </Text>
                  <Text style={{ color: COLORS.textTertiary, fontSize: 12, textAlign: "center" }}>
                    Releasing early keeps the screen locked.
                  </Text>
                </View>
                <View style={{ height: 6, backgroundColor: COLORS.bgTertiary }}>
                  <View
                    style={{
                      height: "100%",
                      width: `${Math.round(unlockHoldProgress * 100)}%`,
                      backgroundColor: COLORS.primary,
                    }}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      )}

      <BugReportModal
        visible={showBugReport}
        onClose={() => setShowBugReport(false)}
        sessionLogId={sessionLogId}
        userId={authSession?.user?.id}
        lessonId={id!}
        phase={phase}
        factContent={currentFact?.content ?? null}
      />
    </KeyboardAvoidingView>
  );
}
