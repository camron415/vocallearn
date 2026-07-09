import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const DEFAULT_GROK_API_URL = "https://api.x.ai/v1";
const DEFAULT_RUNS = 3;
const DEFAULT_FULL_LESSON_ID = "c3d4e5f6-a7b8-9012-cdef-012345678902";
const DEFAULT_REVIEW_LESSON_ID = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
const MAX_HISTORY_MESSAGES = 30;
const TEACH_CHECKIN_MSG = "Got it? Any questions — just ask, or I'll keep going.";
const STOP_WORDS = new Set([
  "a",
  "about",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "but",
  "by",
  "for",
  "from",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "me",
  "my",
  "of",
  "on",
  "or",
  "so",
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

const DEPTH_TECHNIQUES = [
  "Use an analogy: connect this concept to something the student definitely already knows from everyday life. Make the comparison explicit.",
  "Lead with consequence: explain what goes wrong, breaks, or stays confusing if someone doesn't understand this — make the stakes real before stating the fact.",
  "Open with the misconception: start with what most people wrongly assume about this, then correct it. The contrast is what makes it stick.",
  "Make it concrete: give a specific example with real names, numbers, or a scenario the student can picture. Abstractions don't stick; specifics do.",
  "Explain the mechanism: don't just say what is true — explain why it must be true, or how it works step by step. Causal understanding beats memorization.",
  "Callback to an earlier fact: explicitly connect this to something from earlier in this lesson. Say the link out loud — 'remember when we talked about X? This is why that matters.'",
  "End with a generative question: after explaining, ask a 'what would happen if...' or 'so why do you think...' question. Don't answer it — let them think. Active generation doubles retention.",
];

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

function stripWrappingQuotes(value) {
  if (!value) return value;
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function readEnvFile(filePath) {
  const contents = fs.readFileSync(filePath, "utf8");
  const result = {};
  for (const line of contents.split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line)) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = stripWrappingQuotes(line.slice(idx + 1).trim());
    result[key] = value;
  }
  return result;
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const eqIndex = token.indexOf("=");
    if (eqIndex !== -1) {
      args[token.slice(2, eqIndex)] = token.slice(eqIndex + 1);
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

function getSetting({ args, env, key, fallback }) {
  if (args[key] !== undefined) return args[key];
  if (process.env[key] !== undefined) return process.env[key];
  if (env[key] !== undefined) return env[key];
  return fallback;
}

function toNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function nowIsoSlug() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function summarizeNumbers(values) {
  const numbers = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (numbers.length === 0) return null;
  const pickPercentile = (ratio) => numbers[Math.min(numbers.length - 1, Math.floor(numbers.length * ratio))];
  const total = numbers.reduce((sum, value) => sum + value, 0);
  return {
    count: numbers.length,
    min: numbers[0],
    avg: Math.round(total / numbers.length),
    median: pickPercentile(0.5),
    p90: pickPercentile(0.9),
    max: numbers[numbers.length - 1],
  };
}

function normalizeWhitespace(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function normalizeForSimilarity(text) {
  return normalizeWhitespace(text).toLowerCase();
}

function tokenize(text) {
  return normalizeForSimilarity(text)
    .match(/[a-z0-9']+/g)?.filter((token) => token.length > 1 && !STOP_WORDS.has(token)) ?? [];
}

function jaccardSimilarity(aText, bText) {
  const a = new Set(tokenize(aText));
  const b = new Set(tokenize(bText));
  if (a.size === 0 && b.size === 0) return 1;
  const union = new Set([...a, ...b]);
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  return Number((intersection / Math.max(1, union.size)).toFixed(3));
}

function averagePairwiseSimilarity(texts) {
  const normalized = texts.map((text) => normalizeWhitespace(text)).filter(Boolean);
  if (normalized.length < 2) return null;
  const values = [];
  for (let i = 0; i < normalized.length; i += 1) {
    for (let j = i + 1; j < normalized.length; j += 1) {
      values.push(jaccardSimilarity(normalized[i], normalized[j]));
    }
  }
  if (values.length === 0) return null;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}

function averageCrossSimilarity(aTexts, bTexts) {
  const left = aTexts.map((text) => normalizeWhitespace(text)).filter(Boolean);
  const right = bTexts.map((text) => normalizeWhitespace(text)).filter(Boolean);
  if (left.length === 0 || right.length === 0) return null;
  const values = [];
  for (const aText of left) {
    for (const bText of right) {
      values.push(jaccardSimilarity(aText, bText));
    }
  }
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}

function wordCount(text) {
  return normalizeWhitespace(text).split(/\s+/).filter(Boolean).length;
}

function averageWordCount(texts) {
  const counts = texts.map((text) => wordCount(text)).filter((count) => count > 0);
  if (counts.length === 0) return null;
  return Number((counts.reduce((sum, value) => sum + value, 0) / counts.length).toFixed(1));
}

function cleanAnchor(text) {
  return normalizeWhitespace(
    String(text ?? "")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\([^)]*\)/g, "")
      .replace(/[–—-][^–—-]+[–—-]/g, "")
      .replace(/^the fact that\s+/i, "")
      .replace(/^that\s+/i, "")
      .replace(/[,:;.!?]+$/g, "")
      .replace(/^['"]+|['"]+$/g, "")
  );
}

function isLowSignalAnchor(anchor) {
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

function formatTag(tag) {
  return normalizeWhitespace(String(tag ?? "").replace(/[-_]/g, " "));
}

function toSentenceAnchor(anchor) {
  const withLowerArticle = anchor.replace(/^(The|A|An)\b/, (match) => match.toLowerCase());
  if (/^[A-Z][a-z]+(?:\s+[a-z][a-z0-9'-]*)+/.test(withLowerArticle)) {
    return withLowerArticle[0].toLowerCase() + withLowerArticle.slice(1);
  }
  return withLowerArticle;
}

function pickSpecificTag(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return null;
  for (const rawTag of tags) {
    const formatted = formatTag(rawTag);
    const lower = formatted.toLowerCase();
    if (SKIP_TAGS.has(lower) || GENERIC_TAGS.has(lower) || /^\d{4}$/.test(lower)) continue;
    if (formatted.length >= 3) return formatted;
  }
  return null;
}

function stripLeadingCount(text) {
  const stripped = normalizeWhitespace(String(text ?? "").replace(COUNT_PREFIX, ""));
  return stripped || normalizeWhitespace(text);
}

function extractFallbackAnchor(content) {
  const statementMatch = String(content ?? "").match(
    /^(.+?)\s+(?:is|are|means|mean|refers to|represents|allows|allow|lets|let|keeps|keep|develops|develop|formed|form)\b/i
  );
  if (statementMatch) {
    const anchor = cleanAnchor(statementMatch[1]);
    if (!isLowSignalAnchor(anchor)) return anchor;
  }

  const firstClause = cleanAnchor(String(content ?? "").split(/[.:;!?]/)[0] ?? "");
  if (!isLowSignalAnchor(firstClause)) return firstClause;

  return null;
}

function buildPromptSpec(fact) {
  const content = normalizeWhitespace(String(fact.content ?? "").replace(/^In \d{4},?\s*/i, ""));

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

  const securityRiskMatch = content.match(/^(.+?) is a security risk where /i);
  if (securityRiskMatch) {
    const subject = toSentenceAnchor(cleanAnchor(securityRiskMatch[1]));
    return {
      quiz: `Why is ${subject} a security risk?`,
      prediction: `Before I explain it, why do you think ${subject} can be risky?`,
      production: `Explain why ${subject} is risky.`,
    };
  }

  const tagAnchor = pickSpecificTag(fact.tags);
  const anchor = tagAnchor
    ? toSentenceAnchor(tagAnchor)
    : extractFallbackAnchor(content)?.replace(/^(The|A|An)\b/, (match) => match.toLowerCase());
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

function buildQuizPrompt(fact) {
  return buildPromptSpec(fact).quiz;
}

function buildProductionPrompt(fact) {
  return buildPromptSpec(fact).production;
}

function pickDepthTechnique(factId) {
  let hash = 0;
  for (let i = 0; i < factId.length; i += 1) {
    hash = (hash * 31 + factId.charCodeAt(i)) >>> 0;
  }
  return DEPTH_TECHNIQUES[hash % DEPTH_TECHNIQUES.length];
}

function buildSessionSystemMessage(facts, progressMap, currentFact, phase) {
  const factList = facts
    .map((fact) => {
      const progress = progressMap.get(fact.id);
      const mastery = !progress
        ? "not yet learned"
        : progress.mastery_level >= 4
          ? "mastered"
          : progress.mastery_level >= 2
            ? "learning"
            : "struggling";
      return `- [${mastery}] (${fact.strictness} strictness) ${fact.content}${fact.explanation ? ` — ${fact.explanation}` : ""}`;
    })
    .join("\n");

  const depthInstruction = currentFact ? pickDepthTechnique(currentFact.id) : "";
  const masteryLevel = currentFact ? progressMap.get(currentFact.id)?.mastery_level ?? 0 : 0;
  const socraticNote =
    masteryLevel >= 2 && phase === "teach"
      ? `\nSocratic approach: Student has prior exposure to this concept (mastery ${masteryLevel}/5). Don't just state the fact — open with a guiding question ("What do you remember about...?" or "Why do you think...?") to prompt recall. In the checkin window, affirm what they got right and naturally fill in what they missed.`
      : "";

  const currentFactBlock = currentFact
    ? `\nCURRENT FOCUS:\n"${currentFact.content}"\nStrictness: ${currentFact.strictness}${currentFact.explanation ? `\nTeaching notes (your private context — the student has NOT yet heard this text, never reference it as if you already said it): ${currentFact.explanation}` : ""}\nTeaching approach for this fact: ${depthInstruction}${socraticNote}\n`
    : "";

  return `You are a real teacher having a spoken conversation with a student learning via voice.

Your manner: warm, direct, human — like a knowledgeable friend. Voice is not text; make every word count.
Celebrate wins naturally ("Yes, exactly." "That's it." "Nailed it."). When wrong, acknowledge what they got right, then correct only what they missed.
Invite questions naturally — no formal "do you have any questions?" breaks.

When TEACHING a new fact (phase: teach):
- Follow the "Teaching approach" instruction below — it specifies which depth-processing technique to use for this particular fact.
- Draw on the "Teaching notes" to fuel the technique (analogies, examples, mechanisms are in there).
- 2-4 sentences is right. Lead with the hook, land the core idea, say why it matters.

When giving FEEDBACK after a quiz answer:
- 1-2 sentences. Warm and specific. Don't re-teach the whole fact.

Rules:
- Only use facts from the lesson below. Never make up information.
- Evaluate meaning, not exact wording — STT is imperfect. Be forgiving unless strictness is HIGH.
- Explain only the specific thing they missed — don't re-summarize everything.
- Never tell them to "look it up" or "study later" — you are the teacher, right now.
- Never mention speech recognition, transcription, or how they worded things.
- Use the conversation history to respond naturally. Reference earlier exchanges when relevant.
- Never say "does that make sense?" or "make sense?" — invite engagement naturally without explicitly asking.
- Never use filler phrases: "alright so", "here's the thing", "let me think about that", "ok so". Be direct and natural.
- The Teaching notes in CURRENT FOCUS are your private preparation. Never say things like "building on that idea", "as I mentioned", or "like we discussed" unless those exact words appear in the conversation history above.

Session phase: ${phase}${currentFactBlock}
LESSON FACTS (with mastery):
${factList}`;
}

function buildEvaluationPrompt(fact, userResponse) {
  const strictnessGuide =
    fact.strictness === "high"
      ? "HIGH strictness — exact values/terms required."
      : fact.strictness === "medium"
        ? "MEDIUM strictness — specific numbers, named rules, and key terms must be correct; only phrasing/wording is flexible."
        : "LOW strictness — general understanding is enough. Be generous if they show they get the concept.";

  return [
    {
      role: "system",
      content: `You are scoring a student's spoken answer. Focus entirely on MEANING — be generous with word choice.

The fact they should know:
"${fact.content}"

${strictnessGuide}

Be encouraging. If they captured the core idea, that's correct.
A score of 3+ means correct. For LOW strictness, 2 can also be correct.

FEEDBACK RULES:
- Sound like a real teacher speaking face-to-face
- For CORRECT answers: 1 very short sentence ONLY, ideally 2-6 words and never more than 8 words. It should sound like quick spoken validation that lasts about 1-2 seconds.
- For CORRECT answers: confirm they're right without mirroring, paraphrasing, or repeating their answer back to them.
- For CORRECT answers: do NOT restate the fact, do NOT summarize the concept, and do NOT repeat specific nouns or phrases from the student's answer unless absolutely necessary.
- Good correct-answer examples: "Exactly, that's right." "Yes, nice work." "Right on." "You've got it."
- For WRONG answers: acknowledge any partial credit first, then state the correct information naturally (don't just say "The answer is..."), then add a brief natural invitation — e.g. "Any questions, or should we keep going?" (2-3 sentences total)
- NEVER mention typos, transcription, speech recognition, or how they worded it
- NEVER say "ignoring the typos" or "despite the phrasing" — just react naturally to the meaning
- NEVER tell them to "look it up", "do more research", or "study later"
- If the student's number is close to the correct value but looks digit-transposed (e.g. "fifteen" vs "fifty", "15%" vs "50%"), treat it as a likely STT error and be generous
- STT commonly mishears technical terms (e.g. "few-shot" → "Fuchsia", "LLM" → "LOM", "gradient" → "radiant"). Judge the CONCEPT being expressed, not the specific words — if they clearly understand the idea despite garbled terms, score generously

Respond ONLY with JSON (no markdown fences):
{"score": <0-5>, "feedback": "<natural teacher response>", "isCorrect": <true/false>}`,
    },
    {
      role: "user",
      content: `Student said: "${userResponse}"`,
    },
  ];
}

function tryParseEvaluation(responseText) {
  try {
    let cleaned = normalizeWhitespace(responseText);
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ok: false, value: null };
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      ok: true,
      value: {
        score: Math.max(0, Math.min(5, Number(parsed.score) || 0)),
        feedback: String(parsed.feedback || ""),
        isCorrect: Boolean(parsed.isCorrect),
      },
    };
  } catch {
    return { ok: false, value: null };
  }
}

function buildTeachScript(fact) {
  return fact.explanation ? `${fact.explanation} ${fact.content}` : fact.content;
}

function buildReviewHint(fact) {
  if (!fact.explanation) return "Let's try this one again. Take your time.";
  return `Let's try this one again. Here's a hint: ${String(fact.explanation).split(".")[0]}. Now, what's the fact?`;
}

function buildPartialStudentAnswer(fact) {
  const base = normalizeWhitespace(String(fact.content ?? "").replace(/[.?!]+$/g, ""));
  const parts = base.split(/(?:,| because | which | that | so that | but )/i).map((part) => normalizeWhitespace(part)).filter(Boolean);
  if (parts.length > 1 && parts[0].length >= 18) return parts[0];
  const words = base.split(/\s+/).filter(Boolean);
  if (words.length <= 8) return base;
  const truncated = words.slice(0, Math.max(6, Math.floor(words.length * 0.6))).join(" ");
  return truncated.replace(/[,:;]+$/g, "");
}

function buildProgressMap(progressRows) {
  return new Map(progressRows.map((row) => [row.fact_id, row]));
}

function chooseReviewFact(facts, progressRows) {
  const now = Date.now();
  const progressMap = buildProgressMap(progressRows);
  const dueFacts = facts.filter((fact) => {
    const progress = progressMap.get(fact.id);
    return progress && new Date(progress.next_review_at).getTime() <= now;
  });
  const preferred = dueFacts.find((fact) => fact.explanation) ?? dueFacts[0];
  return preferred ?? facts.find((fact) => fact.explanation) ?? facts[0] ?? null;
}

function chooseFullLessonFact(facts, progressRows) {
  const progressMap = buildProgressMap(progressRows);
  const unseen = facts.filter((fact) => !progressMap.has(fact.id));
  const lowMastery = facts.filter((fact) => (progressMap.get(fact.id)?.mastery_level ?? 0) < 2);
  return unseen.find((fact) => fact.explanation)
    ?? unseen[0]
    ?? lowMastery.find((fact) => fact.explanation)
    ?? lowMastery[0]
    ?? facts.find((fact) => fact.explanation)
    ?? facts[0]
    ?? null;
}

async function callChatCompletion({ apiUrl, apiKey, model, messages, maxTokens, temperature }) {
  const startedAt = Date.now();
  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  const latencyMs = Date.now() - startedAt;

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Chat completion failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return {
    latencyMs,
    content: data.choices?.[0]?.message?.content ?? "",
    usage: data.usage ?? null,
  };
}

async function callTts({ apiUrl, apiKey, text }) {
  const startedAt = Date.now();
  const response = await fetch(`${apiUrl}/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ text, voice_id: "ara", language: "en" }),
  });
  const buffer = await response.arrayBuffer();
  const latencyMs = Date.now() - startedAt;
  if (!response.ok) {
    const errorText = Buffer.from(buffer).toString("utf8");
    throw new Error(`TTS failed (${response.status}): ${errorText}`);
  }
  return {
    latencyMs,
    bytes: buffer.byteLength,
    contentType: response.headers.get("content-type") || "",
  };
}

function buildWebSocketUrl(apiUrl, model) {
  const url = new URL(apiUrl.replace(/^http/, "ws"));
  url.pathname = "/v1/realtime";
  url.searchParams.set("model", model);
  return url.toString();
}

function toRealtimeConversationItem(message) {
  if (message.role === "assistant") {
    return {
      type: "message",
      role: "assistant",
      content: [{ type: "text", text: message.content }],
    };
  }
  if (message.role === "system") {
    return {
      type: "message",
      role: "system",
      content: [{ type: "text", text: message.content }],
    };
  }
  return {
    type: "message",
    role: "user",
    content: [{ type: "input_text", text: message.content }],
  };
}

async function callRealtimeVoice({
  apiUrl,
  apiKey,
  model,
  instructions,
  history,
  modalities,
}) {
  return await new Promise((resolve, reject) => {
    const wsUrl = buildWebSocketUrl(apiUrl, model);
    const openedAt = Date.now();
    const ws = new WebSocket(wsUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    let settled = false;
    let sawSessionCreated = false;
    let sawConversationCreated = false;
    let sessionConfigured = false;
    let responseRequestedAt = null;
    let responseId = null;
    let connectMs = null;
    let sessionSetupMs = null;
    let firstTextDeltaMs = null;
    let firstAudioDeltaMs = null;
    let firstTranscriptDeltaMs = null;
    let responseDoneMs = null;
    let transcriptDoneMs = null;
    let audioDoneMs = null;
    let usage = null;
    let text = "";
    let transcript = "";
    let audioBytes = 0;
    let serverError = null;
    let lastEventType = null;
    const eventCounts = new Map();

    const closeAndReject = (error) => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {}
      reject(error instanceof Error ? error : new Error(String(error)));
    };

    const closeAndResolve = () => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {}
      resolve({
        connectMs,
        sessionSetupMs,
        firstTextDeltaMs,
        firstAudioDeltaMs,
        firstTranscriptDeltaMs,
        responseDoneMs,
        transcriptDoneMs,
        audioDoneMs,
        text: normalizeWhitespace(text),
        transcript: normalizeWhitespace(transcript),
        audioBytes,
        responseId,
        usage,
        serverError,
      });
    };

    const sendJson = (payload) => ws.send(JSON.stringify(payload));

    const maybeConfigureSession = () => {
      if ((!sawSessionCreated && !sawConversationCreated) || sessionConfigured) return;
      sessionConfigured = true;
      sendJson({
        type: "session.update",
        session: {
          model,
          instructions,
          voice: "ara",
          turn_detection: { type: null },
          audio: {
            input: { format: { type: "audio/pcm", rate: 24000 } },
            output: { format: { type: "audio/pcm", rate: 24000 } },
          },
        },
      });
    };

    const timeout = setTimeout(() => {
      const counts = Object.fromEntries(eventCounts.entries());
      closeAndReject(
        new Error(
          `Realtime voice benchmark timed out after 45 seconds (last event: ${lastEventType ?? "none"}, connectMs: ${connectMs ?? "n/a"}, sessionSetupMs: ${sessionSetupMs ?? "n/a"}, responseRequested: ${responseRequestedAt != null ? "yes" : "no"}, eventCounts: ${JSON.stringify(counts)}).`
        )
      );
    }, 45000);

    ws.on("open", () => {
      connectMs = Date.now() - openedAt;
    });

    ws.on("message", (rawData) => {
      let payload;
      try {
        payload = JSON.parse(String(rawData));
      } catch {
        return;
      }
      lastEventType = payload.type ?? "unknown";
      eventCounts.set(lastEventType, (eventCounts.get(lastEventType) ?? 0) + 1);

      switch (payload.type) {
        case "session.created":
          sawSessionCreated = true;
          maybeConfigureSession();
          break;
        case "conversation.created":
          sawConversationCreated = true;
          maybeConfigureSession();
          break;
        case "session.updated":
          sessionSetupMs = Date.now() - openedAt;
          for (const message of history.slice(-MAX_HISTORY_MESSAGES)) {
            sendJson({ type: "conversation.item.create", item: toRealtimeConversationItem(message) });
          }
          responseRequestedAt = Date.now();
          sendJson({
            type: "response.create",
            response: { modalities },
          });
          break;
        case "response.created":
          responseId = payload.response?.id ?? responseId;
          break;
        case "response.text.delta":
          if (firstTextDeltaMs == null && responseRequestedAt != null) firstTextDeltaMs = Date.now() - responseRequestedAt;
          text += payload.delta ?? "";
          break;
        case "response.output_audio_transcript.delta":
          if (firstTranscriptDeltaMs == null && responseRequestedAt != null) firstTranscriptDeltaMs = Date.now() - responseRequestedAt;
          transcript += payload.delta ?? "";
          break;
        case "response.output_audio_transcript.done":
          if (!transcript && payload.transcript) transcript = payload.transcript;
          if (responseRequestedAt != null) transcriptDoneMs = Date.now() - responseRequestedAt;
          break;
        case "response.output_audio.delta":
          if (firstAudioDeltaMs == null && responseRequestedAt != null) firstAudioDeltaMs = Date.now() - responseRequestedAt;
          if (payload.delta) {
            audioBytes += Buffer.from(payload.delta, "base64").byteLength;
          }
          break;
        case "response.output_audio.done":
          if (responseRequestedAt != null) audioDoneMs = Date.now() - responseRequestedAt;
          break;
        case "response.done":
          if (responseRequestedAt != null) responseDoneMs = Date.now() - responseRequestedAt;
          usage = payload.response?.usage ?? null;
          clearTimeout(timeout);
          closeAndResolve();
          break;
        case "error":
          serverError = payload.error ?? null;
          clearTimeout(timeout);
          closeAndReject(new Error(`Realtime server error: ${payload.error?.message || payload.error?.code || "unknown error"}`));
          break;
        default:
          break;
      }
    });

    ws.on("error", (error) => {
      clearTimeout(timeout);
      closeAndReject(new Error(`Realtime websocket transport error: ${error.message}`));
    });

    ws.on("close", (code, reason) => {
      if (settled) return;
      clearTimeout(timeout);
      const reasonText = reason ? String(reason) : "";
      if (serverError) {
        closeAndReject(new Error(`Realtime websocket closed after server error: ${serverError.message || serverError.code || "unknown error"} (close ${code}${reasonText ? `: ${reasonText}` : ""})`));
      } else {
        closeAndReject(new Error(`Realtime websocket closed before response.done was received (close ${code}${reasonText ? `: ${reasonText}` : ""}).`));
      }
    });
  });
}

async function authenticateSupabase({ url, anonKey, email, password }) {
  const supabase = createClient(url, anonKey);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return supabase;
}

async function fetchLessonsAndFacts(supabase, lessonIds) {
  const { data: lessons, error: lessonError } = await supabase
    .from("lessons")
    .select("id,title,description")
    .in("id", lessonIds);
  if (lessonError) throw lessonError;

  const { data: facts, error: factError } = await supabase
    .from("facts")
    .select("id,lesson_id,content,explanation,strictness,order_index,tags")
    .in("lesson_id", lessonIds)
    .order("order_index", { ascending: true });
  if (factError) throw factError;

  return { lessons: lessons ?? [], facts: facts ?? [] };
}

async function fetchProgressForFacts(supabase, userId, factIds) {
  if (!factIds.length) return [];
  const { data, error } = await supabase
    .from("user_fact_progress")
    .select("fact_id,next_review_at,mastery_level,ease_factor,interval_days,repetitions,last_reviewed_at,times_correct,times_incorrect")
    .eq("user_id", userId)
    .in("fact_id", factIds);
  if (error) throw error;
  return data ?? [];
}

async function fetchHistoricalBaseline(supabase, { lessonId, interactionTypes, phase }) {
  const runQuery = async ({ scopeLessonId, scopePhase }) => {
    let query = supabase
      .from("session_interactions")
      .select("interaction_type,phase,grok_latency_ms,tts_latency_ms")
      .in("interaction_type", interactionTypes)
      .order("created_at", { ascending: false })
      .limit(200);
    if (scopePhase) query = query.eq("phase", scopePhase);
    if (scopeLessonId) query = query.eq("lesson_id", scopeLessonId);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  };

  const scopedRows = await runQuery({ scopeLessonId: lessonId, scopePhase: phase });
  const phaseRows = scopedRows.length > 0 ? scopedRows : await runQuery({ scopeLessonId: null, scopePhase: phase });
  const rows = phaseRows.length > 0 ? phaseRows : await runQuery({ scopeLessonId: null, scopePhase: null });
  const grokLatencies = rows.map((row) => row.grok_latency_ms).filter((value) => Number.isFinite(value));
  const ttsLatencies = rows.map((row) => row.tts_latency_ms).filter((value) => Number.isFinite(value));
  const audibleTotals = rows
    .map((row) => {
      if (!Number.isFinite(row.grok_latency_ms)) return null;
      const tts = Number.isFinite(row.tts_latency_ms) ? row.tts_latency_ms : 0;
      return row.grok_latency_ms + tts;
    })
    .filter((value) => Number.isFinite(value));

  return {
    count: rows.length,
    scopedToLesson: scopedRows.length > 0,
    scopedToPhase: phaseRows.length > 0,
    grokLatencyMs: summarizeNumbers(grokLatencies),
    ttsLatencyMs: summarizeNumbers(ttsLatencies),
    audibleLatencyMs: summarizeNumbers(audibleTotals),
  };
}

function summarizeControlRuns(runs, { includeTts }) {
  const responses = runs.map((run) => run.responseText);
  const summary = {
    chatLatencyMs: summarizeNumbers(runs.map((run) => run.chatLatencyMs)),
    promptTokens: summarizeNumbers(runs.map((run) => run.usage?.prompt_tokens).filter((value) => Number.isFinite(value))),
    completionTokens: summarizeNumbers(runs.map((run) => run.usage?.completion_tokens).filter((value) => Number.isFinite(value))),
    avgWordCount: averageWordCount(responses),
    withinModelSimilarity: averagePairwiseSimilarity(responses),
    responses,
  };

  if (includeTts) {
    summary.ttsLatencyMs = summarizeNumbers(runs.map((run) => run.ttsLatencyMs));
    summary.totalAudibleLatencyMs = summarizeNumbers(runs.map((run) => run.totalAudibleLatencyMs));
  }

  return summary;
}

function summarizeCandidateRuns(runs, { modalities }) {
  const responses = runs.map((run) => run.responseText);
  const summary = {
    connectMs: summarizeNumbers(runs.map((run) => run.connectMs).filter((value) => Number.isFinite(value))),
    sessionSetupMs: summarizeNumbers(runs.map((run) => run.sessionSetupMs).filter((value) => Number.isFinite(value))),
    responseDoneMs: summarizeNumbers(runs.map((run) => run.responseDoneMs).filter((value) => Number.isFinite(value))),
    outputTokens: summarizeNumbers(runs.map((run) => run.usage?.output_tokens).filter((value) => Number.isFinite(value))),
    inputTokens: summarizeNumbers(runs.map((run) => run.usage?.input_tokens).filter((value) => Number.isFinite(value))),
    avgWordCount: averageWordCount(responses),
    withinModelSimilarity: averagePairwiseSimilarity(responses),
    responses,
  };
  if (modalities.includes("text")) {
    summary.firstTextDeltaMs = summarizeNumbers(runs.map((run) => run.firstTextDeltaMs).filter((value) => Number.isFinite(value)));
  }
  if (modalities.includes("audio")) {
    summary.firstAudioDeltaMs = summarizeNumbers(runs.map((run) => run.firstAudioDeltaMs).filter((value) => Number.isFinite(value)));
    summary.firstTranscriptDeltaMs = summarizeNumbers(runs.map((run) => run.firstTranscriptDeltaMs).filter((value) => Number.isFinite(value)));
    summary.audioDoneMs = summarizeNumbers(runs.map((run) => run.audioDoneMs).filter((value) => Number.isFinite(value)));
    summary.transcriptDoneMs = summarizeNumbers(runs.map((run) => run.transcriptDoneMs).filter((value) => Number.isFinite(value)));
    summary.audioBytes = summarizeNumbers(runs.map((run) => run.audioBytes).filter((value) => Number.isFinite(value)));
  }
  return summary;
}

function summarizeEvaluationResponses(runs) {
  const parsed = runs.map((run) => ({
    parse: tryParseEvaluation(run.responseText),
    responseText: run.responseText,
  }));
  const successful = parsed.filter((entry) => entry.parse.ok).map((entry) => entry.parse.value);
  return {
    adherenceRate: Number((parsed.filter((entry) => entry.parse.ok).length / Math.max(1, parsed.length)).toFixed(3)),
    parsedScores: successful.map((entry) => entry.score),
    parsedCorrectFlags: successful.map((entry) => entry.isCorrect),
    feedbacks: successful.map((entry) => entry.feedback),
  };
}

function projectLatency(historicalMs, syntheticCandidateMs, syntheticControlMs) {
  if (!Number.isFinite(historicalMs) || !Number.isFinite(syntheticCandidateMs) || !Number.isFinite(syntheticControlMs) || syntheticControlMs <= 0) {
    return null;
  }
  return Math.round(historicalMs * (syntheticCandidateMs / syntheticControlMs));
}

async function runConversationalScenario({
  apiUrl,
  apiKey,
  runs,
  systemMessage,
  history,
}) {
  const controlRuns = [];
  const candidateRuns = [];

  for (let runIndex = 0; runIndex < runs; runIndex += 1) {
    const controlChat = await callChatCompletion({
      apiUrl,
      apiKey,
      model: "grok-3-mini",
      messages: [{ role: "system", content: systemMessage }, ...history],
      maxTokens: 300,
      temperature: 0.5,
    });
    const controlTts = await callTts({ apiUrl, apiKey, text: controlChat.content });
    controlRuns.push({
      chatLatencyMs: controlChat.latencyMs,
      ttsLatencyMs: controlTts.latencyMs,
      totalAudibleLatencyMs: controlChat.latencyMs + controlTts.latencyMs,
      responseText: controlChat.content,
      usage: controlChat.usage,
    });

    const candidate = await callRealtimeVoice({
      apiUrl,
      apiKey,
      model: "grok-voice-think-fast-1.0",
      instructions: systemMessage,
      history,
      modalities: ["audio"],
    });

    candidateRuns.push({
      connectMs: candidate.connectMs,
      sessionSetupMs: candidate.sessionSetupMs,
      firstAudioDeltaMs: candidate.firstAudioDeltaMs,
      firstTranscriptDeltaMs: candidate.firstTranscriptDeltaMs,
      responseDoneMs: candidate.responseDoneMs,
      transcriptDoneMs: candidate.transcriptDoneMs,
      audioDoneMs: candidate.audioDoneMs,
      audioBytes: candidate.audioBytes,
      responseText: candidate.transcript || candidate.text,
      usage: candidate.usage,
    });
  }

  return { controlRuns, candidateRuns };
}

async function runEvaluationScenario({ apiUrl, apiKey, clientSecret, runs, messages }) {
  const controlRuns = [];
  const candidateRuns = [];

  for (let runIndex = 0; runIndex < runs; runIndex += 1) {
    const control = await callChatCompletion({
      apiUrl,
      apiKey,
      model: "grok-3-mini",
      messages,
      maxTokens: 150,
      temperature: 0.3,
    });
    controlRuns.push({
      chatLatencyMs: control.latencyMs,
      responseText: control.content,
      usage: control.usage,
    });

    const candidate = await callRealtimeVoice({
      apiUrl,
      apiKey,
      model: "grok-voice-think-fast-1.0",
      instructions: messages[0].content,
      history: [{ role: "user", content: messages[1].content }],
      modalities: ["text"],
    });
    candidateRuns.push({
      connectMs: candidate.connectMs,
      sessionSetupMs: candidate.sessionSetupMs,
      firstTextDeltaMs: candidate.firstTextDeltaMs,
      responseDoneMs: candidate.responseDoneMs,
      responseText: candidate.text || candidate.transcript,
      usage: candidate.usage,
    });
  }

  return { controlRuns, candidateRuns };
}

function ensureLesson(lessonsById, lessonId, label) {
  const lesson = lessonsById.get(lessonId);
  if (!lesson) throw new Error(`Missing ${label} lesson ${lessonId}.`);
  return lesson;
}

function buildScenarioDefinitions({ fullLesson, reviewLesson, fullFacts, reviewFacts, fullProgress, reviewProgress }) {
  const fullProgressMap = buildProgressMap(fullProgress);
  const reviewProgressMap = buildProgressMap(reviewProgress);
  const fullFact = chooseFullLessonFact(fullFacts, fullProgress);
  const reviewFact = chooseReviewFact(reviewFacts, reviewProgress);

  if (!fullFact) throw new Error("Could not select a full-lesson fact for benchmarking.");
  if (!reviewFact) throw new Error("Could not select a review fact for benchmarking.");

  const lessonTeachSystem = buildSessionSystemMessage(fullFacts, fullProgressMap, fullFact, "teach");
  const reviewSystem = buildSessionSystemMessage(reviewFacts, reviewProgressMap, reviewFact, "review");
  const fullTeachScript = buildTeachScript(fullFact);
  const reviewHint = buildReviewHint(reviewFact);
  const fullStudentAnswer = buildPartialStudentAnswer(fullFact);
  const reviewStudentAnswer = buildPartialStudentAnswer(reviewFact);

  return [
    {
      id: "full_lesson_followup",
      mode: "lesson",
      surface: "conversation",
      lesson: fullLesson,
      fact: fullFact,
      baselineQuery: { interactionTypes: ["teach_checkin_question"], phase: "teach" },
      systemMessage: lessonTeachSystem,
      history: [
        { role: "assistant", content: fullTeachScript },
        { role: "assistant", content: TEACH_CHECKIN_MSG },
        { role: "user", content: "Can you make that concrete with one quick example?" },
      ],
      promptInput: "Can you make that concrete with one quick example?",
    },
    {
      id: "review_followup",
      mode: "review",
      surface: "conversation",
      lesson: reviewLesson,
      fact: reviewFact,
      baselineQuery: { interactionTypes: ["user_question"], phase: "review" },
      systemMessage: reviewSystem,
      history: [
        { role: "assistant", content: reviewHint },
        { role: "user", content: "I'm mixing this up with something else. What's the key distinction?" },
      ],
      promptInput: "I'm mixing this up with something else. What's the key distinction?",
    },
    {
      id: "full_lesson_score",
      mode: "lesson",
      surface: "evaluation",
      lesson: fullLesson,
      fact: fullFact,
      baselineQuery: { interactionTypes: ["user_answer"], phase: "quiz" },
      evaluationMessages: buildEvaluationPrompt(fullFact, fullStudentAnswer),
      promptInput: fullStudentAnswer,
    },
    {
      id: "review_score",
      mode: "review",
      surface: "evaluation",
      lesson: reviewLesson,
      fact: reviewFact,
      baselineQuery: { interactionTypes: ["user_answer"], phase: "review" },
      evaluationMessages: buildEvaluationPrompt(reviewFact, reviewStudentAnswer),
      promptInput: reviewStudentAnswer,
    },
  ];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node scripts/benchmark-voice-think-fast.mjs [options]\n\nOptions:\n  --runs <n>\n  --email <email>\n  --password <password>\n  --full-lesson-id <uuid>\n  --review-lesson-id <uuid>\n  --report-dir <path>`);
    return;
  }

  const envPath = path.resolve(".env.local");
  const env = fs.existsSync(envPath) ? readEnvFile(envPath) : {};

  const grokApiUrl = getSetting({ args, env, key: "EXPO_PUBLIC_GROK_API_URL", fallback: DEFAULT_GROK_API_URL });
  const grokApiKey = getSetting({ args, env, key: "EXPO_PUBLIC_GROK_API_KEY", fallback: undefined });
  const supabaseUrl = getSetting({ args, env, key: "EXPO_PUBLIC_SUPABASE_URL", fallback: undefined });
  const supabaseAnonKey = getSetting({ args, env, key: "EXPO_PUBLIC_SUPABASE_ANON_KEY", fallback: undefined });
  const email = getSetting({ args, env, key: "VL_BENCH_EMAIL", fallback: undefined });
  const password = getSetting({ args, env, key: "VL_BENCH_PASSWORD", fallback: undefined });
  const runs = toNumber(getSetting({ args, env, key: "runs", fallback: DEFAULT_RUNS }), DEFAULT_RUNS);
  const fullLessonId = getSetting({ args, env, key: "full-lesson-id", fallback: DEFAULT_FULL_LESSON_ID });
  const reviewLessonId = getSetting({ args, env, key: "review-lesson-id", fallback: DEFAULT_REVIEW_LESSON_ID });
  const reportDir = path.resolve(getSetting({ args, env, key: "report-dir", fallback: "debug-logs/model-benchmarks" }));

  if (!grokApiKey) throw new Error("Missing EXPO_PUBLIC_GROK_API_KEY in .env.local or environment.");
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Missing Supabase settings in .env.local or environment.");
  if (!email || !password) {
    throw new Error("Missing benchmark auth. Provide VL_BENCH_EMAIL and VL_BENCH_PASSWORD via env or --email/--password.");
  }

  const supabase = await authenticateSupabase({ url: supabaseUrl, anonKey: supabaseAnonKey, email, password });
  const userId = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user?.id : null;
  if (!userId) throw new Error("Failed to resolve the authenticated benchmark user.");

  const lessonIds = [...new Set([fullLessonId, reviewLessonId])];
  const { lessons, facts } = await fetchLessonsAndFacts(supabase, lessonIds);
  const lessonsById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const fullLesson = ensureLesson(lessonsById, fullLessonId, "full lesson");
  const reviewLesson = ensureLesson(lessonsById, reviewLessonId, "review lesson");

  const factsByLesson = new Map();
  for (const fact of facts) {
    if (!factsByLesson.has(fact.lesson_id)) factsByLesson.set(fact.lesson_id, []);
    factsByLesson.get(fact.lesson_id).push(fact);
  }
  const fullFacts = factsByLesson.get(fullLesson.id) ?? [];
  const reviewFacts = factsByLesson.get(reviewLesson.id) ?? [];
  const allFactIds = facts.map((fact) => fact.id);
  const progressRows = await fetchProgressForFacts(supabase, userId, allFactIds);
  const progressByLesson = new Map();
  for (const row of progressRows) {
    const fact = facts.find((item) => item.id === row.fact_id);
    if (!fact) continue;
    if (!progressByLesson.has(fact.lesson_id)) progressByLesson.set(fact.lesson_id, []);
    progressByLesson.get(fact.lesson_id).push(row);
  }
  const fullProgress = progressByLesson.get(fullLesson.id) ?? [];
  const reviewProgress = progressByLesson.get(reviewLesson.id) ?? [];

  const scenarios = buildScenarioDefinitions({
    fullLesson,
    reviewLesson,
    fullFacts,
    reviewFacts,
    fullProgress,
    reviewProgress,
  });

  const scenarioResults = [];
  for (const scenario of scenarios) {
    const historicalBaseline = await fetchHistoricalBaseline(supabase, {
      lessonId: scenario.lesson.id,
      interactionTypes: scenario.baselineQuery.interactionTypes,
      phase: scenario.baselineQuery.phase,
    });

    let controlRuns;
    let candidateRuns;
    if (scenario.surface === "conversation") {
      ({ controlRuns, candidateRuns } = await runConversationalScenario({
        apiUrl: grokApiUrl,
        apiKey: grokApiKey,
        runs,
        systemMessage: scenario.systemMessage,
        history: scenario.history,
      }));
    } else {
      ({ controlRuns, candidateRuns } = await runEvaluationScenario({
        apiUrl: grokApiUrl,
        apiKey: grokApiKey,
        runs,
        messages: scenario.evaluationMessages,
      }));
    }

    const controlSummary = summarizeControlRuns(controlRuns, { includeTts: scenario.surface === "conversation" });
    const candidateSummary = summarizeCandidateRuns(candidateRuns, {
      modalities: scenario.surface === "conversation" ? ["audio"] : ["text"],
    });
    const controlEvaluation = scenario.surface === "evaluation" ? summarizeEvaluationResponses(controlRuns) : null;
    const candidateEvaluation = scenario.surface === "evaluation" ? summarizeEvaluationResponses(candidateRuns) : null;

    const controlTexts = controlRuns.map((run) => run.responseText);
    const candidateTexts = candidateRuns.map((run) => run.responseText);
    const syntheticControlMs = scenario.surface === "conversation"
      ? controlSummary.totalAudibleLatencyMs?.avg ?? null
      : controlSummary.chatLatencyMs?.avg ?? null;
    const syntheticCandidateMs = scenario.surface === "conversation"
      ? candidateSummary.firstAudioDeltaMs?.avg ?? null
      : candidateSummary.responseDoneMs?.avg ?? null;
    const historicalAnchorMs = scenario.surface === "conversation"
      ? historicalBaseline.audibleLatencyMs?.avg ?? null
      : historicalBaseline.grokLatencyMs?.avg ?? null;
    const projectedCandidateMs = projectLatency(historicalAnchorMs, syntheticCandidateMs, syntheticControlMs);

    scenarioResults.push({
      id: scenario.id,
      mode: scenario.mode,
      surface: scenario.surface,
      lesson: {
        id: scenario.lesson.id,
        title: scenario.lesson.title,
      },
      fact: {
        id: scenario.fact.id,
        content: scenario.fact.content,
        strictness: scenario.fact.strictness,
      },
      promptInput: scenario.promptInput,
      historicalBaseline,
      control: {
        runs: controlRuns,
        summary: controlSummary,
        evaluation: controlEvaluation,
      },
      candidate: {
        runs: candidateRuns,
        summary: candidateSummary,
        evaluation: candidateEvaluation,
      },
      comparison: {
        crossModelSimilarity: averageCrossSimilarity(controlTexts, candidateTexts),
        syntheticControlMs,
        syntheticCandidateMs,
        syntheticImprovementMs:
          Number.isFinite(syntheticControlMs) && Number.isFinite(syntheticCandidateMs)
            ? Math.round(syntheticControlMs - syntheticCandidateMs)
            : null,
        syntheticImprovementPct:
          Number.isFinite(syntheticControlMs) && Number.isFinite(syntheticCandidateMs) && syntheticControlMs > 0
            ? Number((((syntheticControlMs - syntheticCandidateMs) / syntheticControlMs) * 100).toFixed(1))
            : null,
        projectedCurrentRealLifeMs: historicalAnchorMs,
        projectedCandidateRealLifeMs: projectedCandidateMs,
        projectedImprovementMs:
          Number.isFinite(historicalAnchorMs) && Number.isFinite(projectedCandidateMs)
            ? historicalAnchorMs - projectedCandidateMs
            : null,
        projectedImprovementPct:
          Number.isFinite(historicalAnchorMs) && Number.isFinite(projectedCandidateMs) && historicalAnchorMs > 0
            ? Number((((historicalAnchorMs - projectedCandidateMs) / historicalAnchorMs) * 100).toFixed(1))
            : null,
      },
    });
  }

  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `voice-think-fast-benchmark-${nowIsoSlug()}.json`);
  const report = {
    generatedAt: new Date().toISOString(),
    config: {
      runs,
      controlModel: "grok-3-mini",
      candidateModel: "grok-voice-think-fast-1.0",
      fullLessonId,
      reviewLessonId,
    },
    scenarioResults,
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const consoleSummary = scenarioResults.map((scenario) => ({
    id: scenario.id,
    lesson: scenario.lesson.title,
    fact: scenario.fact.content,
    controlSyntheticMs: scenario.comparison.syntheticControlMs,
    candidateSyntheticMs: scenario.comparison.syntheticCandidateMs,
    syntheticImprovementPct: scenario.comparison.syntheticImprovementPct,
    projectedCurrentRealLifeMs: scenario.comparison.projectedCurrentRealLifeMs,
    projectedCandidateRealLifeMs: scenario.comparison.projectedCandidateRealLifeMs,
    projectedImprovementPct: scenario.comparison.projectedImprovementPct,
    crossModelSimilarity: scenario.comparison.crossModelSimilarity,
    controlAdherenceRate: scenario.control.evaluation?.adherenceRate ?? null,
    candidateAdherenceRate: scenario.candidate.evaluation?.adherenceRate ?? null,
  }));

  console.log(JSON.stringify({ reportPath, consoleSummary }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});