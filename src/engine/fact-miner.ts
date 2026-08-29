import { callGrok, type GrokMessage } from "@/lib/grok";
import { FACT_MINER_SYSTEM_PROMPT } from "@/constants/ask";
import type { AskMessage } from "@/types/ask";

export interface MinedFactCandidate {
  content: string;
  explanation: string;
  tags: string[];
  why_worth_learning: string;
  confidence: number;
}

function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(text: string): Set<string> {
  return new Set(normalizeForCompare(text).split(" ").filter((t) => t.length > 2));
}

/** Cheap Jaccard overlap on tokens — used before/alongside LLM dedup. */
export function textSimilarity(a: string, b: string): number {
  const aSet = tokenSet(a);
  const bSet = tokenSet(b);
  if (aSet.size === 0 || bSet.size === 0) return 0;
  let intersection = 0;
  aSet.forEach((t) => {
    if (bSet.has(t)) intersection += 1;
  });
  const union = aSet.size + bSet.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function isLikelyDuplicate(candidate: string, existingContents: string[], threshold = 0.72): boolean {
  const normalized = normalizeForCompare(candidate);
  return existingContents.some((existing) => {
    if (normalizeForCompare(existing) === normalized) return true;
    return textSimilarity(candidate, existing) >= threshold;
  });
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      if (inString) escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

export async function mineFactsFromMessages(messages: AskMessage[]): Promise<MinedFactCandidate[]> {
  const recent = messages.filter((m) => m.role === "user" || m.role === "assistant").slice(-12);
  if (recent.length < 2) return [];

  const transcript = recent.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");

  const grokMessages: GrokMessage[] = [
    { role: "system", content: FACT_MINER_SYSTEM_PROMPT },
    { role: "user", content: `Transcript:\n\n${transcript}` },
  ];

  const response = await callGrok(grokMessages, {
    temperature: 0.2,
    maxTokens: 900,
    model: process.env.EXPO_PUBLIC_GROK_SCORING_MODEL || "grok-4-fast-non-reasoning",
    timeoutMs: 20000,
  });

  const jsonText = extractJsonObject(response.content);
  if (!jsonText) return [];

  try {
    const parsed = JSON.parse(jsonText) as { facts?: unknown };
    if (!Array.isArray(parsed.facts)) return [];

    return parsed.facts
      .map((raw): MinedFactCandidate | null => {
        if (!raw || typeof raw !== "object") return null;
        const item = raw as Record<string, unknown>;
        const content = typeof item.content === "string" ? item.content.trim() : "";
        if (content.length < 12) return null;
        const explanation =
          typeof item.explanation === "string" && item.explanation.trim()
            ? item.explanation.trim()
            : "A key idea from your Ask conversation.";
        const tags = Array.isArray(item.tags)
          ? item.tags.filter((t): t is string => typeof t === "string").map((t) => t.trim()).filter(Boolean).slice(0, 6)
          : [];
        const why =
          typeof item.why_worth_learning === "string" ? item.why_worth_learning.trim() : "";
        const confidence =
          typeof item.confidence === "number" && Number.isFinite(item.confidence)
            ? Math.max(0, Math.min(1, item.confidence))
            : 0.5;
        return {
          content,
          explanation,
          tags,
          why_worth_learning: why || "Worth reviewing so you can explain it later.",
          confidence,
        };
      })
      .filter((f): f is MinedFactCandidate => f !== null)
      .slice(0, 5);
  } catch {
    return [];
  }
}
