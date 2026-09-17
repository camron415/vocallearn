/** Local cloze for open gists. No extra model call. */

const STOP = new Set([
  "the",
  "a",
  "an",
  "of",
  "in",
  "to",
  "and",
  "or",
  "for",
  "that",
  "this",
  "with",
  "from",
  "are",
  "was",
  "were",
  "be",
  "is",
  "it",
  "as",
  "on",
  "at",
  "by",
  "into",
  "their",
  "they",
  "them",
  "how",
  "what",
  "when",
  "where",
  "who",
  "why",
  "its",
  "than",
  "then",
  "also",
  "just",
  "not",
  "but",
  "can",
  "may",
  "does",
  "did",
  "has",
  "have",
  "had",
  "you",
  "your",
]);

const FALLBACK_WRONG = [
  "oxygen",
  "soil",
  "gravity",
  "amazon",
  "rome",
  "nitrogen",
  "sugar",
  "memory",
  "helium",
  "velvet",
  "echo",
  "marble",
  "copper",
  "orbit",
  "canyon",
  "pepper",
];

export type ClozeWord = {
  raw: string;
  fold: string;
  start: number;
  end: number;
};

export type ClozeChoice = {
  id: string;
  label: string;
  correct: boolean;
};

export type OpenCloze = {
  stem: string;
  keys: string[];
  choices: ClozeChoice[];
};

export const CLOZE_BOTH_PLACEHOLDER = "Both missing words";

export function foldClozeWord(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function wordsOf(text: string): ClozeWord[] {
  const words: ClozeWord[] = [];
  const re = /[A-Za-z0-9]+(?:['’-]?[A-Za-z0-9]+)*/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    words.push({
      raw: match[0],
      fold: foldClozeWord(match[0]),
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return words;
}

export function contentWords(text: string): ClozeWord[] {
  return wordsOf(text).filter(
    (word) => word.fold.length >= 4 && !STOP.has(word.fold)
  );
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function pickKeys(answer: string, count: number, skipFold?: string): ClozeWord[] {
  const ranked = contentWords(answer)
    .slice()
    .sort((a, b) => b.fold.length - a.fold.length || a.start - b.start);
  const unique: ClozeWord[] = [];
  const seen = new Set<string>(skipFold ? [skipFold] : []);
  for (const word of ranked) {
    if (seen.has(word.fold)) continue;
    seen.add(word.fold);
    unique.push(word);
    if (unique.length >= count) break;
  }
  if (!unique.length && skipFold) return pickKeys(answer, count);
  return unique.sort((a, b) => a.start - b.start);
}

function applyBlanks(answer: string, keys: ClozeWord[]): string {
  let out = answer;
  const ordered = [...keys].sort((a, b) => b.start - a.start);
  for (const key of ordered) {
    out = `${out.slice(0, key.start)}____${out.slice(key.end)}`;
  }
  return out;
}

function isClozeFakeLabel(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return false;
  if (trimmed.length > 28) return false;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length > 2) return false;
  return true;
}

function distractorsFor(
  key: ClozeWord,
  answer: string,
  extra: string[]
): string[] {
  const fromAnswer = new Set(wordsOf(answer).map((word) => word.fold));
  const seen = new Set([key.fold, ...fromAnswer]);
  const out: string[] = [];
  const pool = [...extra.filter(isClozeFakeLabel), ...FALLBACK_WRONG];
  for (const label of pool) {
    const fold = foldClozeWord(label);
    if (!fold || fold.length < 3 || seen.has(fold)) continue;
    seen.add(fold);
    out.push(label);
    if (out.length >= 3) break;
  }
  return out;
}

function wordHit(saidFold: string, keyFold: string) {
  if (!saidFold || !keyFold) return false;
  if (saidFold === keyFold) return true;
  if (keyFold.length >= 4 && saidFold.includes(keyFold)) return true;
  if (saidFold.length >= 4 && keyFold.includes(saidFold)) return true;
  return false;
}

/** r1 = one blank (easiest long word). r2 SEE = a different word. r2 SAY = two blanks. */
export function clozeForChip(
  chip: { answer: string; token?: string; distractors?: string[] },
  round: 1 | 2 | 3,
  face: "see" | "say"
): OpenCloze | null {
  const two = round >= 2 && face === "say";
  const skipLongest = round >= 2 && face === "see";
  const longest = skipLongest ? pickKeys(chip.answer, 1)[0]?.fold : undefined;
  const keys = pickKeys(chip.answer, two ? 2 : 1, longest);
  if (!keys.length) return null;
  const primary = keys[0];
  const extras = [...(chip.distractors ?? []), chip.token ?? ""];
  const wrong = distractorsFor(primary, chip.answer, extras);
  return {
    stem: applyBlanks(chip.answer, keys),
    keys: keys.map((key) => key.raw),
    choices: shuffle([
      { id: "ok", label: primary.raw, correct: true },
      ...wrong.map((label, i) => ({
        id: `w${i}-${foldClozeWord(label)}`,
        label,
        correct: false,
      })),
    ]),
  };
}

export function gradeClozeSaid(said: string, keys: string[]): boolean {
  const tokens = said
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map(foldClozeWord)
    .filter(Boolean);
  if (!keys.length || !tokens.length) return false;
  return keys.every((key) => {
    const want = foldClozeWord(key);
    return tokens.some((token) => wordHit(token, want));
  });
}
