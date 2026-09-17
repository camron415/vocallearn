import type { AskIntent, AskKind } from "@/lib/ask-intent";
import type { ChipKind } from "@/lib/harvest";
import {
  cueRestates,
  findHarvestSpanVerbatim,
  harvestCueKey,
  parseChipKind,
} from "@/lib/harvest";
import type { ChipRecall } from "@/lib/chip-recall";

export type ChipDropReason =
  | "no_span"
  | "user_echo"
  | "ask_kind"
  | "citation_year"
  | "open_shape"
  | "no_primary";

export type InvariantChip = {
  prompt: string;
  promptB?: string;
  token: string;
  answer: string;
  span: string;
  kind: ChipKind;
  recall: ChipRecall;
  distractors: string[];
};

export type ChipDrop = {
  reason: ChipDropReason;
  token: string;
};

const QUESTION_OPEN =
  /^(give me|tell me|why did|why does|why do|how does|how do|how did|what is|what are|what was|when was|when did|where was|who (wrote|created|invented))\b/i;

const WH_SPAN = /^(who|what|when|where|why|how)\b/i;

export function splitAssistantHeadBody(reply: string): { head: string; body: string } {
  const text = reply.trim();
  if (!text) return { head: "", body: "" };
  const sentences = text.split(/(?<=[.!?])\s+/);
  let head = (sentences[0] || "").trim();
  if (sentences[1] && head.length + sentences[1].length < 480) {
    head = `${head} ${sentences[1]}`.trim();
  }
  if (head.length < 40 && sentences[2]) {
    head = `${head} ${sentences[2]}`.trim();
  }
  if (head.length > 700) head = head.slice(0, 700);
  const body = text.slice(head.length).trim();
  return { head, body };
}

export function ngrams(text: string, n: number): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < n) return [];
  const out: string[] = [];
  for (let i = 0; i + n <= words.length; i += 1) {
    out.push(words.slice(i, i + n).join(" "));
  }
  return out;
}

export function echoesUserPrompt(
  userText: string | undefined,
  chip: Pick<InvariantChip, "token" | "answer" | "span" | "prompt">
): boolean {
  const user = (userText ?? "").trim();
  const blob = `${chip.token} ${chip.answer} ${chip.span}`.trim();
  if (QUESTION_OPEN.test(chip.token) || QUESTION_OPEN.test(chip.answer)) {
    return true;
  }
  if (WH_SPAN.test(chip.span) && !/[.!?]$/.test(chip.span.trim())) {
    return true;
  }
  if (!user) return false;
  const userGrams = new Set(ngrams(user, 3));
  if (!userGrams.size) return false;
  for (const gram of ngrams(blob, 3)) {
    if (userGrams.has(gram)) return true;
  }
  return false;
}

function looksLikeYear(text: string): boolean {
  return /\b(1[0-9]{3}|20[0-2][0-9])\b/.test(text);
}

function looksLikeDate(text: string): boolean {
  if (looksLikeYear(text)) return true;
  return /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(
    text
  );
}

function looksLikePerson(text: string): boolean {
  const t = text.replace(/\*\*/g, "").trim();
  if (/\b(lord|sir|dr|saint|st\.)\b/i.test(t)) return true;
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z.'-]+){1,3}$/.test(t)) return true;
  return false;
}

export function kindFromContent(
  chip: Pick<InvariantChip, "token" | "answer" | "kind">
): ChipKind {
  const blob = `${chip.token} ${chip.answer}`;
  if (looksLikeDate(blob) && !looksLikePerson(chip.answer)) return "when";
  if (looksLikePerson(chip.answer) || looksLikePerson(chip.token)) return "who";
  if (/\d/.test(blob) && !looksLikeDate(blob) && contentWordCount(chip.answer) <= 4) {
    return chip.kind === "where" ? "where" : "meaning";
  }
  const derived = parseChipKind(chip.kind);
  if (derived === "who" && !looksLikePerson(chip.answer) && !looksLikePerson(chip.token)) {
    return "meaning";
  }
  return derived;
}

function contentWordCount(text: string) {
  return text
    .replace(/[^a-z0-9]+/gi, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

export function answerFitsAskKind(
  askKind: AskKind | null | undefined,
  chip: Pick<InvariantChip, "token" | "answer" | "recall" | "kind">
): boolean {
  if (!askKind) return true;
  if (chip.recall === "open") return askKind === "meaning" || askKind === null;
  const blob = `${chip.token} ${chip.answer}`;
  if (askKind === "when") return looksLikeDate(blob);
  if (askKind === "where") return !looksLikeDate(blob) && contentWordCount(chip.answer) <= 6;
  if (askKind === "who") {
    return (
      looksLikePerson(chip.answer) ||
      looksLikePerson(chip.token) ||
      /\b(no single|nobody|no one|not (a |one )?single|unknown)\b/i.test(
        `${chip.token} ${chip.answer}`
      )
    );
  }
  if (askKind === "number") return /\d/.test(blob);
  if (askKind === "meaning") {
    const n = contentWordCount(chip.answer);
    // Closed lookups are often one token ("Jupiter", "Nile"). Open gist still
    // needs a real phrase — otherwise "what is the largest planet" drops Keep.
    if (chip.recall === "closed") return n >= 1 && n <= 8;
    return n >= 2;
  }
  return true;
}

export function isCitationYear(
  chip: Pick<InvariantChip, "token" | "answer" | "span" | "kind" | "recall">,
  reply: string,
  userText?: string
): boolean {
  if (chip.recall === "open" || chip.kind !== "when") return false;
  const year = (chip.answer.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/) ||
    chip.token.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/))?.[0];
  if (!year) return false;
  const now = new Date().getFullYear();
  const n = Number(year);
  const askIsNow = /\b(this year|today|current|now|as of)\b/i.test(userText ?? "");
  if (!askIsNow && Math.abs(n - now) <= 1) return true;
  const escaped = year.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`\\bas of\\b[^.]{0,40}${escaped}`, "i").test(reply)) return true;
  if (new RegExp(`\\[[^\\]]*${escaped}[^\\]]*\\]`).test(reply)) return true;
  if (new RegExp(`\\]\\([^)]*${escaped}[^)]*\\)`).test(reply)) return true;
  return false;
}

export function openGistShapeOk(
  chip: Pick<InvariantChip, "token" | "answer" | "recall">
): boolean {
  if (chip.recall !== "open") return true;
  const words = chip.answer.trim().split(/\s+/).filter(Boolean);
  if (words.length < 12 || words.length > 24) return false;
  const topic = chip.token.trim().toLowerCase();
  if (!topic) return false;
  return chip.answer.toLowerCase().includes(topic);
}

export function resolveVerifiedSpan(
  reply: string,
  chip: Pick<InvariantChip, "span" | "token" | "answer">
): string | null {
  return findHarvestSpanVerbatim(reply, chip)?.text.slice(0, 120) ?? null;
}

function spanIndex(hay: string, span: string) {
  const at = hay.toLowerCase().indexOf(span.toLowerCase());
  return at < 0 ? 9999 : at;
}

/**
 * Main chip first (askKind fit). If no honest main, keep nothing — never sides-only.
 */
export function pickPrimaryThenSupports(
  chips: InvariantChip[],
  opts: {
    intent?: AskIntent;
    userText?: string;
    reply: string;
    maxCards: number;
  }
): { chips: InvariantChip[]; drops: ChipDrop[] } {
  const drops: ChipDrop[] = [];
  const { head } = splitAssistantHeadBody(opts.reply);
  const askKind = opts.intent?.harvest ? opts.intent.askKind : null;
  const scored = chips.map((chip, order) => ({
    chip,
    order,
    fits: answerFitsAskKind(askKind, chip),
    inHead: spanIndex(head, chip.span) < 9000,
    headAt: spanIndex(head, chip.span),
  }));

  const primaryPool = askKind
    ? scored.filter((row) => row.fits)
    : scored;
  primaryPool.sort((a, b) => {
    if (a.inHead !== b.inHead) return a.inHead ? -1 : 1;
    if (a.headAt !== b.headAt) return a.headAt - b.headAt;
    return a.order - b.order;
  });
  const primary = primaryPool[0];
  if (!primary) {
    for (const row of scored) {
      drops.push({ reason: "no_primary", token: row.chip.token });
    }
    return { chips: [], drops };
  }

  const usedCues = [harvestCueKey(primary.chip.prompt)];
  const out: InvariantChip[] = [primary.chip];
  for (const row of scored) {
    if (out.length >= opts.maxCards) break;
    if (row.chip === primary.chip) continue;
    const cue = harvestCueKey(row.chip.prompt);
    if (usedCues.some((have) => cueRestates(have, cue))) continue;
    if (row.chip.kind === primary.chip.kind && row.chip.recall === primary.chip.recall) {
      continue;
    }
    usedCues.push(cue);
    out.push(row.chip);
  }
  return { chips: out, drops };
}

export function filterChipInvariants(
  chip: InvariantChip,
  opts: { userText?: string; reply: string; asPrimary?: boolean; askKind?: AskKind | null }
): ChipDropReason | null {
  if (!resolveVerifiedSpan(opts.reply, chip)) return "no_span";
  if (echoesUserPrompt(opts.userText, chip)) return "user_echo";
  if (isCitationYear(chip, opts.reply, opts.userText)) return "citation_year";
  if (!openGistShapeOk(chip)) return "open_shape";
  if (opts.asPrimary && !answerFitsAskKind(opts.askKind, chip)) return "ask_kind";
  return null;
}

export function replyHasAskKindAtom(intent: AskIntent, reply: string): boolean {
  const text = reply.trim();
  if (text.length < 12) return false;
  if (!intent.askKind) return text.length >= 40;
  if (intent.askKind === "when") {
    return (
      /\b(1[0-9]{3}|20[0-2][0-9])\b/.test(text) ||
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(
        text
      )
    );
  }
  if (intent.askKind === "number") return /\d/.test(text);
  if (intent.askKind === "who") {
    return (
      /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/.test(text) ||
      /\b(no single|nobody|no one)\b/i.test(text)
    );
  }
  if (intent.askKind === "where") {
    return /[A-Z][a-z]{2,}/.test(text.replace(/\*\*/g, ""));
  }
  return text.length >= 40;
}

