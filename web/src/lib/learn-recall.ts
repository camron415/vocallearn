import type { LearnCard } from "@/lib/learn";
import { gradeLocally } from "@/lib/learn";

/** Ported from VocalLearn `useSession` — same “I don’t know / help / just tell me” signals. */
const DONT_KNOW_PATTERNS = [
  /^i (don'?t|do not) know/i,
  /^(no idea|not sure|idk|dunno)/i,
  /^i('m| am) not sure/i,
  /^i (can'?t|cannot) remember/i,
  /^i forgot/i,
  /^(pass|skip|blank|nothing)$/i,
  /^i('m| am) (lost|confused|stuck)/i,
  /^(what|huh|eh)\??$/i,
];

const HELP_REQUEST_PATTERNS = [
  /\bhint\b/i,
  /^help$/i,
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
];

const ANSWER_REQUEST_PATTERNS = [
  /\bwhat('?s| is) the answer\b/i,
  /\btell me the answer\b/i,
  /\bgive me the answer\b/i,
  /\bjust tell me\b/i,
  /\bwhat is it\b/i,
];

export type RecallKind = "blank" | "dontknow" | "hint" | "answer" | "attempt";
export type AssistPhase = "recall" | "hint1" | "hint2" | "reveal";
export type CardBead = "pending" | "ok" | "miss";

export const IDLE_HINT_MS = 10_000;

export function classifyRecall(text: string): RecallKind {
  const t = text.trim();
  if (!t) return "blank";
  if (DONT_KNOW_PATTERNS.some((p) => p.test(t))) return "dontknow";
  if (ANSWER_REQUEST_PATTERNS.some((p) => p.test(t))) return "answer";
  if (HELP_REQUEST_PATTERNS.some((p) => p.test(t))) return "hint";
  return "attempt";
}

export function wantsAssist(kind: RecallKind) {
  return kind === "blank" || kind === "dontknow" || kind === "hint" || kind === "answer";
}

export function nextAssistPhase(phase: AssistPhase): AssistPhase {
  if (phase === "recall") return "hint1";
  if (phase === "hint1") return "hint2";
  return "reveal";
}

export function hintsUsedForPhase(phase: AssistPhase): 0 | 1 | 2 {
  if (phase === "recall") return 0;
  if (phase === "hint1") return 1;
  return 2;
}

function firstContentWord(answer: string) {
  const words = answer
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !["the", "a", "an"].includes(w));
  return words[0] ?? answer.trim()[0] ?? "";
}

export function strongerHint(answer: string) {
  const word = firstContentWord(answer);
  if (!word) return "Stronger hint: say the shortest version you remember.";
  return `Stronger hint: it starts with “${word[0]!.toUpperCase()}”.`;
}

export function assistCopy(card: LearnCard, phase: AssistPhase) {
  if (phase === "hint1") {
    return card.hint?.trim() || "Think about the key name or number, then try again.";
  }
  if (phase === "hint2") return strongerHint(card.answer);
  if (phase === "reveal") {
    return `Here’s the answer: ${card.answer}. Type it once, then we’ll move on.`;
  }
  return null;
}

/**
 * SM-2-shaped 0–5 from VocalLearn:
 * 5 clean first try, 4 first try with hesitation, 3 effort / after a hint,
 * 1 close but off, 0 blank / don’t know / revealed.
 * Delay is think-time on the card, not overdue-review days.
 */
export function recallQuality(opts: {
  correct: boolean;
  hintsUsed: number;
  delayMs: number;
  revealed: boolean;
  kind?: RecallKind;
}) {
  if (opts.revealed) return 0;
  if (!opts.correct) {
    if (opts.kind === "blank" || opts.kind === "dontknow") return 0;
    return 1;
  }
  if (opts.hintsUsed >= 1) return 3;
  if (opts.delayMs > 20_000) return 3;
  if (opts.delayMs > 8_000) return 4;
  return 5;
}

export function correctFeedback(opts: {
  quality: number;
  hintsUsed: number;
  revealed: boolean;
  repeatOk?: boolean;
}) {
  if (opts.revealed) {
    return opts.repeatOk === false
      ? "That’s alright. We’ll see this again."
      : "Good. We’ll come back to this.";
  }
  if (opts.hintsUsed >= 2) return "There it is. We’ll see this again.";
  if (opts.hintsUsed === 1) return "Got it.";
  if (opts.quality <= 3) return "That’s it — you had it.";
  return "That’s it.";
}

export function missNudge() {
  return "Not quite.";
}

/** True when model feedback restates the expected answer (we keep that off until reveal). */
export function feedbackLeaksAnswer(feedback: string, expected: string) {
  const f = feedback
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const e = expected
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!f || !e) return false;
  if (f.includes(e)) return true;
  const words = e.split(" ").filter((w) => w.length > 3);
  return words.length > 0 && words.every((w) => f.includes(w));
}

export function localRepeatOk(said: string, expected: string) {
  return gradeLocally(said, expected);
}
