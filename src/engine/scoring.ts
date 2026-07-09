import { callGrokScoring } from "@/lib/grok";
import { buildEvaluationPrompt, parseEvaluation } from "./tutor";
import type { Fact } from "@/types/lesson";
import { getShortCorrectValidation } from "./session-prompts";

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(a|an|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAnyPhrase(normalizedText: string, phrases: string[]): boolean {
  return phrases.some((phrase) => normalizedText.includes(normalizeForMatch(phrase)));
}

function factMatchesPattern(fact: Fact, pattern: RegExp): boolean {
  return pattern.test(fact.content) || Boolean(fact.tags?.some((tag) => pattern.test(tag)));
}

function matchesFewShotConcept(fact: Fact, normalizedResponse: string): boolean {
  if (!factMatchesPattern(fact, /\bfew[- ]shot\b/i)) {
    return false;
  }

  const mentionsExamples = includesAnyPhrase(normalizedResponse, [
    "example",
    "examples",
    "example inputs and outputs",
    "input and output",
    "inputs and outputs",
    "input output",
    "input output pairs",
    "pairs",
  ]);
  if (!mentionsExamples) {
    return false;
  }

  const mentionsFormatGuidance = includesAnyPhrase(normalizedResponse, [
    "show the model",
    "guide the model",
    "guide it",
    "tell the model",
    "how to respond",
    "what the response should look like",
    "desired format",
    "format",
    "style",
    "pattern",
    "exactly how",
  ]);
  const mentionsReliability = includesAnyPhrase(normalizedResponse, [
    "more reliable",
    "better than describing",
    "better than words alone",
    "better than prose",
    "instead of describing",
    "instead of prose",
  ]);
  const mentionsFewCount = includesAnyPhrase(normalizedResponse, [
    "2",
    "two",
    "3",
    "three",
    "4",
    "four",
    "5",
    "five",
  ]);

  return mentionsFormatGuidance || mentionsReliability || mentionsFewCount;
}

function extractLeadingNumber(text: string): string | null {
  const match = text.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/i);
  return match ? match[1].toLowerCase() : null;
}

function numberVariants(value: string): string[] {
  const normalized = value.toLowerCase();
  const wordToDigit: Record<string, string> = {
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
    ten: "10",
    eleven: "11",
    twelve: "12",
    thirteen: "13",
    fourteen: "14",
    fifteen: "15",
    sixteen: "16",
    seventeen: "17",
    eighteen: "18",
    nineteen: "19",
    twenty: "20",
  };
  const digitToWord = Object.fromEntries(Object.entries(wordToDigit).map(([word, digit]) => [digit, word]));

  return Array.from(
    new Set([
      normalized,
      wordToDigit[normalized],
      digitToWord[normalized],
    ].filter((variant): variant is string => Boolean(variant)))
  );
}

function extractDirectAnswer(fact: Fact, question?: string): { type: "entity" | "number"; expected: string[] } | null {
  const questionText = question?.toLowerCase() ?? "";

  if (/how many\b/.test(questionText)) {
    const value = extractLeadingNumber(fact.content);
    if (value) {
      return { type: "number", expected: numberVariants(value) };
    }
  }

  const centerMatch = fact.content.match(/^At the center of .+? is (.+?)(?:,|\.|$)/i);
  if (centerMatch && /center of/.test(questionText)) {
    return { type: "entity", expected: [normalizeForMatch(centerMatch[1])] };
  }

  const betweenMatch = fact.content.match(/^Between .+?, there'?s the (.+?)(?:,|\.|$)/i);
  if (betweenMatch && /between\b/.test(questionText)) {
    return { type: "entity", expected: [normalizeForMatch(betweenMatch[1])] };
  }

  return null;
}

function tryFastScoreResponse(
  fact: Fact,
  userResponse: string,
  question?: string
): { score: number; feedback: string; isCorrect: boolean } | null {
  if (fact.strictness === "high") return null;

  const normalizedResponse = normalizeForMatch(userResponse);
  if (!normalizedResponse) return null;

  if (matchesFewShotConcept(fact, normalizedResponse)) {
    return {
      score: 4,
      feedback: getShortCorrectValidation(),
      isCorrect: true,
    };
  }

  const directAnswer = extractDirectAnswer(fact, question);
  if (!directAnswer) return null;

  if (directAnswer.type === "number") {
    const responseTokens = normalizedResponse.split(" ");
    const matched = directAnswer.expected.some((expected) => responseTokens.includes(expected));
    if (!matched) return null;
  } else {
    const matched = directAnswer.expected.some((expected) =>
      normalizedResponse === expected || normalizedResponse.includes(expected)
    );
    if (!matched) return null;
  }

  return {
    score: 5,
    feedback: getShortCorrectValidation(),
    isCorrect: true,
  };
}

/**
 * Score a user's response against the expected fact.
 * Uses the Grok API for intelligent, meaning-based evaluation.
 *
 * Returns a quality score (0-5) compatible with the SM-2 algorithm.
 */
export async function scoreResponse(
  fact: Fact,
  userResponse: string,
  question?: string
): Promise<{ score: number; feedback: string; isCorrect: boolean; tokenUsagePrompt?: number; tokenUsageCompletion?: number }> {
  // Quick check: empty response = automatic 0
  if (!userResponse.trim()) {
    return {
      score: 0,
      feedback: "I didn't catch anything. Try saying the fact out loud!",
      isCorrect: false,
    };
  }

  const fastScore = tryFastScoreResponse(fact, userResponse, question);
  if (fastScore) {
    return fastScore;
  }

  const messages = buildEvaluationPrompt(fact, userResponse, question);
  // Use streaming + low max_tokens — scoring JSON is ~50 tokens; streaming
  // exits early as soon as the JSON closes, cutting 1-3s of tail latency.
  const response = await callGrokScoring(messages, { maxTokens: 150, temperature: 0.3 });
  const evaluation = parseEvaluation(response.content);
  const minimumCorrectScore = 3;

  return {
    ...evaluation,
    isCorrect: evaluation.score >= minimumCorrectScore,
    tokenUsagePrompt: response.usage?.prompt_tokens,
    tokenUsageCompletion: response.usage?.completion_tokens,
  };
}
