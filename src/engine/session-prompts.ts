import type { Fact } from "../types/lesson";

const SKIP_TAGS = new Set(["timeline", "synthesis", "overview", "application"]);
const GENERIC_TAGS = new Set([
  "definition",
  "terminology",
  "concept",
  "rule",
  "formula",
  "historical",
  "history",
  "strategy",
  "example",
  "risk",
  "process",
  "application",
  "overview",
  "synthesis",
]);

const COUNT_PREFIX = /^(?:exactly\s+|about\s+|around\s+|approximately\s+)?(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s+/i;

const LOW_SIGNAL_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "how",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "there",
  "these",
  "they",
  "this",
  "those",
  "to",
  "was",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "why",
  "with",
  "you",
  "your",
]);

export const SHORT_VALIDATION_FALLBACKS = [
  "Exactly, that's right.",
  "Yes, nice work.",
  "Right on.",
  "That's it.",
  "Yep, nailed it.",
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function cleanAnchor(text: string): string {
  return normalizeText(
    text
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\([^)]*\)/g, "")
      .replace(/[–—-][^–—-]+[–—-]/g, " ")
      .replace(/^the fact that\s+/i, "")
      .replace(/^that\s+/i, "")
      .replace(/[,:;.!?]+$/g, "")
      .replace(/^['"]+|['"]+$/g, "")
  );
}

function isLowSignalAnchor(anchor: string): boolean {
  const lower = anchor.toLowerCase();
  return (
    !anchor ||
    anchor.length < 3 ||
    anchor.length > 80 ||
    /^(there|here|this|that|it|they|these|those)\b/.test(lower) ||
    /^(at|between|from|during|because|when|while|with|without)\b/.test(lower) ||
    /\bformed about \d/.test(lower) ||
    /\bline up in this\b/.test(lower) ||
    lower === "this concept" ||
    lower === "this idea"
  );
}

function formatTag(tag: string): string {
  return normalizeText(tag.replace(/[-_]/g, " "));
}

function toSentenceAnchor(anchor: string): string {
  const withLowerArticle = anchor.replace(/^(The|A|An)\b/, (match) => match.toLowerCase());
  if (/^[A-Z][a-z]+(?:\s+[a-z][a-z0-9'-]*)+/.test(withLowerArticle)) {
    return withLowerArticle[0].toLowerCase() + withLowerArticle.slice(1);
  }
  if (/^[A-Z][a-z0-9'-]+$/.test(withLowerArticle)) {
    return withLowerArticle[0].toLowerCase() + withLowerArticle.slice(1);
  }
  return withLowerArticle;
}

function pickSpecificTag(tags: string[] | null | undefined): string | null {
  if (!tags?.length) return null;
  for (const rawTag of tags) {
    const formatted = formatTag(rawTag);
    const lower = formatted.toLowerCase();
    if (SKIP_TAGS.has(lower) || GENERIC_TAGS.has(lower) || /^\d{4}$/.test(lower)) continue;
    if (formatted.length >= 3) return formatted;
  }
  return null;
}

function stripLeadingCount(text: string): string {
  const stripped = normalizeText(text.replace(COUNT_PREFIX, ""));
  return stripped || normalizeText(text);
}

function buildContentTokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9']+/g) ?? []).filter(
    (token) => token.length > 2 && !LOW_SIGNAL_WORDS.has(token)
  );
}

function overlapCount(a: string[], b: string[]): number {
  const bSet = new Set(b);
  return a.filter((token) => bSet.has(token)).length;
}

function extractFallbackAnchor(content: string): string | null {
  const statementMatch = content.match(
    /^(.+?)\s+(?:is|are|means|mean|refers to|represents|allows|allow|lets|let|keeps|keep|develops|develop|formed|form|becomes|become|matters|matter|helps|help|hurts|hurt|creates|create|makes|make|improves|improve|changes|change|depends on|depend on|treats|treat|processes|process|follows|follow|expands|expand|stores|store|converts|convert|belongs to|belong to|includes|include|provides|provide|optimizes|optimize|guarantees|guarantee|outperforms|outperform|translates|translate|respects|respect|retrieves|retrieve|adds|add|reduces|reduce|increases|increase)\b/i
  );
  if (statementMatch) {
    const anchor = cleanAnchor(statementMatch[1]);
    if (!isLowSignalAnchor(anchor)) return anchor;
  }

  const firstClause = cleanAnchor(content.split(/[.:;!?]/)[0] ?? "");
  if (!isLowSignalAnchor(firstClause)) return firstClause;

  return null;
}

function extractLeadingPluralSubject(content: string): string | null {
  const pluralSubjectMatch = content.match(
    /^(?:these|those)\s+((?:(?:first|last|inner|outer|main|key|core|large|small|early|later|different|major|minor|top|best|worst)\s+){0,3}[a-z][a-z0-9'-]*(?:\s+[a-z][a-z0-9'-]*){0,5})\s+(?:are|do|can|will|should|become|reduce|improve|matter|help|hurt|create|form|keep|make|work|expand|change|add|adds|include|includes|provide|provides|use|uses|follow|follows)\b/i
  );
  if (!pluralSubjectMatch) return null;

  const subject = cleanAnchor(pluralSubjectMatch[1]);
  if (isLowSignalAnchor(subject)) return null;
  return subject;
}

function buildPromptSpec(fact: Fact): { quiz: string; prediction: string; production: string } {
  const content = normalizeText(fact.content.replace(/^In \d{4},?\s*/i, ""));

  const countMatch = content.match(/^There are exactly (.+?) that orbit (.+?)\.?$/i);
  if (countMatch) {
    const thing = stripLeadingCount(countMatch[1]);
    const target = toSentenceAnchor(cleanAnchor(countMatch[2]));
    return {
      quiz: `How many ${thing} orbit ${target}?`,
      prediction: `Before I explain it, how many ${thing} do you think orbit ${target}?`,
      production: `Tell me how many ${thing} orbit ${target}.`,
    };
  }

  const centerMatch = content.match(/^At the center of (.+?) is (.+?)(?:,|\.|$)/i);
  if (centerMatch) {
    const place = toSentenceAnchor(cleanAnchor(centerMatch[1]));
    return {
      quiz: `What's at the center of ${place}?`,
      prediction: `Before I explain it, what do you think sits at the center of ${place}?`,
      production: `Explain what's at the center of ${place}.`,
    };
  }

  const orderMatch = content.match(/^(.+?) line up in this order from (.+?):/i);
  if (orderMatch) {
    const subject = cleanAnchor(orderMatch[1]).toLowerCase();
    const target = cleanAnchor(orderMatch[2]);
    return {
      quiz: `What's the order of ${subject} from ${target}?`,
      prediction: `Before I explain it, can you name the order of ${subject} from ${target}?`,
      production: `Walk me through the order of ${subject} from ${target}.`,
    };
  }

  const betweenMatch = content.match(/^Between (.+?), there's the (.+?)(?:,|\.|$)/i);
  if (betweenMatch) {
    const range = cleanAnchor(betweenMatch[1]);
    return {
      quiz: `What's between ${range}?`,
      prediction: `Before I explain it, what do you think sits between ${range}?`,
      production: `Explain what's between ${range}.`,
    };
  }

  const formationMatch = content.match(/^(.+?) formed about .*? from (.+?)\.?$/i);
  if (formationMatch) {
    const subject = toSentenceAnchor(cleanAnchor(formationMatch[1]));
    return {
      quiz: `How did ${subject} form?`,
      prediction: `Before I explain it, how do you think ${subject} formed?`,
      production: `Explain how ${subject} formed.`,
    };
  }

  const forceMatch = content.match(/^(.+?) is the force that (.+?)\.?$/i);
  if (forceMatch) {
    const subject = toSentenceAnchor(cleanAnchor(forceMatch[1]));
    return {
      quiz: `What does ${subject} do?`,
      prediction: `Before I explain it, what do you think ${subject} does here?`,
      production: `Explain what ${subject} does.`,
    };
  }

  const teachesByMatch = content.match(/^(.+?)\s+(?:usually\s+)?teaches? (?:a |the )?(?:language model|model|assistant|system) by (.+?)\.?$/i);
  if (teachesByMatch) {
    const subject = toSentenceAnchor(cleanAnchor(teachesByMatch[1]));
    return {
      quiz: `What does ${subject} usually teach the model to do?`,
      prediction: `Before I explain it, what do you think ${subject} teaches the model to do?`,
      production: `Explain what ${subject} teaches the model to do.`,
    };
  }

  const teachesAfterMatch = content.match(/^(.+?)\s+happens after .+? and teaches (?:a |the )?(?:language model|model|assistant|system) to (.+?)\.?$/i);
  if (teachesAfterMatch) {
    const subject = toSentenceAnchor(cleanAnchor(teachesAfterMatch[1]));
    return {
      quiz: `What does ${subject} teach the model to do?`,
      prediction: `Before I explain it, what do you think ${subject} teaches the model to do?`,
      production: `Explain what ${subject} teaches the model to do.`,
    };
  }

  const shapeMoreThanMatch = content.match(/^(.+?) shape (.+?) more strongly than (.+?)\.?$/i);
  if (shapeMoreThanMatch) {
    const subject = toSentenceAnchor(cleanAnchor(shapeMoreThanMatch[1]));
    const target = toSentenceAnchor(cleanAnchor(shapeMoreThanMatch[2]));
    const contrast = toSentenceAnchor(cleanAnchor(shapeMoreThanMatch[3]));
    return {
      quiz: `What shapes ${target} more strongly: ${subject} or ${contrast}?`,
      prediction: `Before I explain it, which do you think shapes ${target} more: ${subject} or ${contrast}?`,
      production: `Explain why ${subject} shape ${target} more strongly than ${contrast}.`,
    };
  }

  const optimizeMatch = content.match(/^(.+?) optimize(?:s)? for (.+?), not just (.+?)\.?$/i);
  if (optimizeMatch) {
    const subject = toSentenceAnchor(cleanAnchor(optimizeMatch[1]));
    const target = cleanAnchor(optimizeMatch[2]);
    const baseline = toSentenceAnchor(cleanAnchor(optimizeMatch[3]));
    return {
      quiz: `What do ${subject} optimize for beyond ${baseline}?`,
      prediction: `Before I explain it, what do you think ${subject} optimize for beyond ${baseline}?`,
      production: `Explain what ${subject} optimize for beyond ${baseline}.`,
    };
  }

  const improvesButNotMatch = content.match(/^(.+?) improves (.+?), but it does not guarantee (.+?)\.?$/i);
  if (improvesButNotMatch) {
    const subject = toSentenceAnchor(cleanAnchor(improvesButNotMatch[1]));
    const improvesTarget = cleanAnchor(improvesButNotMatch[2]);
    const missingGuarantee = cleanAnchor(improvesButNotMatch[3]);
    return {
      quiz: `What does ${subject} improve, and what does it not guarantee?`,
      prediction: `Before I explain it, what do you think ${subject} improves, but still does not guarantee?`,
      production: `Explain what ${subject} improves and what it still does not guarantee.`,
    };
  }

  const securityRiskMatch = content.match(/^(.+?) is a security risk where /i);
  if (securityRiskMatch) {
    const subject = toSentenceAnchor(cleanAnchor(securityRiskMatch[1]));
    return {
      quiz: `Why is ${subject} a security risk?`,
      prediction: `Before I explain it, why do you think ${subject} can be risky?`,
      production: `Explain why ${subject} is risky.`,
    };
  }

  // Pattern: "Subject—enumeration—descriptor" (em-dash parenthetical list)
  // e.g. "The inner planets—Mercury, Venus, Earth, and Mars—are small, rocky worlds"
  // Without this, cleanAnchor's dash-stripping joins "Subject" + "descriptor" without spacing.
  const emDashSubjectMatch = content.match(/^(.+?)[–—]/);
  if (emDashSubjectMatch) {
    const subject = toSentenceAnchor(cleanAnchor(emDashSubjectMatch[1]));
    if (subject && !isLowSignalAnchor(subject)) {
      return {
        quiz: `What do you remember about ${subject}?`,
        prediction: `Before I explain it, what do you already know about ${subject}?`,
        production: `Explain ${subject} in your own words.`,
      };
    }
  }

  const pluralSubject = extractLeadingPluralSubject(content);
  if (pluralSubject) {
    const subject = toSentenceAnchor(pluralSubject);
    return {
      quiz: `What do you remember about ${subject}?`,
      prediction: `Before I explain it, what do you already know about ${subject}?`,
      production: `Explain ${subject} in your own words.`,
    };
  }

  const tagAnchor = pickSpecificTag(fact.tags);
  const anchor = tagAnchor
    ? toSentenceAnchor(tagAnchor)
    : (() => {
        const fallbackAnchor = extractFallbackAnchor(content);
        return fallbackAnchor ? toSentenceAnchor(fallbackAnchor) : null;
      })();
  if (anchor && !isLowSignalAnchor(anchor)) {
    return {
      quiz: `What do you remember about ${anchor}?`,
      prediction: `Before I explain it, what do you already know about ${anchor}?`,
      production: `Explain ${anchor} in your own words.`,
    };
  }

  return {
    quiz: "What key idea do you remember from that fact?",
    prediction: "Before I explain it, what's your best guess about this idea?",
    production: "Explain the key idea in your own words.",
  };
}

export function buildPredictionQuestion(fact: Fact): string {
  return buildPromptSpec(fact).prediction;
}

export function buildQuizPrompt(fact: Fact): string {
  return buildPromptSpec(fact).quiz;
}

export function buildProductionPrompt(fact: Fact): string {
  return buildPromptSpec(fact).production;
}

export function getShortCorrectValidation(): string {
  return pick(SHORT_VALIDATION_FALLBACKS);
}

/**
 * Quick heuristic: did the user's spoken prediction substantially overlap with the fact?
 * Used to choose a positive vs corrective acknowledgment bridge before the teach.
 */
export function predictionIsOnTrack(userText: string, factContent: string): boolean {
  return overlapCount(buildContentTokens(userText), buildContentTokens(factContent)) >= 3;
}

export function normalizeCorrectValidation(feedback: string, fact: Fact, userResponse: string): string {
  const firstSentence = normalizeText(feedback)
    .split(/(?<=[.!?])\s+/)[0]
    ?.replace(/^['"]+|['"]+$/g, "")
    .trim();

  if (!firstSentence) return pick(SHORT_VALIDATION_FALLBACKS);

  const normalized = /[.!?]$/.test(firstSentence) ? firstSentence : `${firstSentence}.`;
  const words = normalized.match(/[A-Za-z0-9']+/g) ?? [];
  if (words.length > 8 || normalized.length > 60 || normalized.includes("?")) {
    return pick(SHORT_VALIDATION_FALLBACKS);
  }

  const feedbackTokens = buildContentTokens(normalized);
  if (overlapCount(feedbackTokens, buildContentTokens(userResponse)) >= 2) {
    return pick(SHORT_VALIDATION_FALLBACKS);
  }

  if (overlapCount(feedbackTokens, buildContentTokens(fact.content)) >= 3) {
    return pick(SHORT_VALIDATION_FALLBACKS);
  }

  return normalized;
}