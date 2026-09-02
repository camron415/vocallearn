import { guessTimeZone } from "@/lib/local-day";

export type LearnCard = {
  id: string;
  prompt: string;
  answer: string;
  hint?: string;
  demo?: boolean;
  kind?: "when" | "where" | "who" | "meaning";
  token?: string;
};

export type LearnToday = {
  doneToday: boolean;
  isDemo: boolean;
  streak: number;
  reviews: number;
  remaining: number;
  cards: LearnCard[];
};

/** History pack so Learn works before anyone has mined facts. */
export const DEMO_CARDS: LearnCard[] = [
  {
    id: "demo-1776",
    demo: true,
    prompt: "In what year did the United States declare independence?",
    answer: "1776",
    hint: "The Declaration of Independence, mid-1770s.",
    kind: "when",
    token: "1776",
  },
  {
    id: "demo-nile",
    demo: true,
    prompt: "What is usually named as the longest river in the world?",
    answer: "The Nile",
    hint: "It runs through Egypt.",
    kind: "who",
    token: "Nile",
  },
  {
    id: "demo-rome",
    demo: true,
    prompt: "Which city was the capital of the Roman Empire at its height in the west?",
    answer: "Rome",
    hint: "Same name as the civilization.",
    kind: "where",
    token: "Rome",
  },
];

export function todayStamp(now = new Date(), timeZone = guessTimeZone()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function yesterdayStamp(now = new Date()) {
  const d = new Date(now);
  d.setDate(d.getDate() - 1);
  return todayStamp(d);
}

export function nextStreak(
  lastDay: string | null | undefined,
  current: number,
  today = todayStamp()
) {
  if (lastDay === today) return current || 1;
  if (lastDay === yesterdayStamp()) return (current || 0) + 1;
  return 1;
}

function fold(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isLikelyDuplicate(candidate: string, existing: string[]) {
  const needle = fold(candidate);
  return existing.some((item) => {
    const hay = fold(item);
    if (hay === needle) return true;
    return hay.includes(needle) || needle.includes(hay);
  });
}

/** Demo cards have short answers — overlap is enough. Mined cards go through the model. */
export function gradeLocally(said: string, expected: string) {
  const a = fold(said);
  const b = fold(expected);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const at = new Set(a.split(" ").filter((w) => w.length > 2));
  const bt = new Set(b.split(" ").filter((w) => w.length > 2));
  if (!at.size || !bt.size) return false;
  let hit = 0;
  at.forEach((w) => {
    if (bt.has(w)) hit += 1;
  });
  return hit / Math.min(at.size, bt.size) >= 0.6;
}
