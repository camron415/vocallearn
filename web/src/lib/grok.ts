import { ASK_SYSTEM_PROMPT, clockLine, HISTORY_TITLE_MAX, clipAtWord } from "@/lib/constants";
import {
  attachSources,
  hostnameLabel,
  sanitizeModelText,
  type DisplaySource,
} from "@/lib/markdown-plain";

export type GrokContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail?: "low" | "high" }
  | { type: "input_file"; file_id: string };

export type GrokMessage = {
  role: "system" | "user" | "assistant";
  content: string | GrokContentPart[];
};

export type ReasoningEffort = "none" | "low" | "medium" | "high";

const RETIRED_FAST = new Set([
  "grok-4-fast-non-reasoning",
  "grok-4-fast-reasoning",
  "grok-4-1-fast-non-reasoning",
  "grok-4-1-fast-reasoning",
]);

const requestedModel = process.env.GROK_CHAT_MODEL || "grok-4.3";
const CHAT_MODEL = RETIRED_FAST.has(requestedModel)
  ? "grok-4.3"
  : requestedModel;
const FAST_EFFORT: ReasoningEffort =
  (process.env.GROK_CHAT_REASONING as ReasoningEffort) || "none";
const SMART_EFFORT: ReasoningEffort =
  (process.env.GROK_CHAT_REASONING_SMART as ReasoningEffort) || "low";

const HARD =
  /\b(step by step|analy[sz]e|compare|trade-?offs?|debug|refactor|architect|prove|derive|deep dive|reason about|implement|walk me through|in detail|detailed)\b/i;

/** Cheap by default (no reasoning). Step up effort only when the turn is heavy. */
export function pickReasoningEffort(userText: string): ReasoningEffort {
  if (userText.length > 520 || HARD.test(userText)) return SMART_EFFORT;
  return FAST_EFFORT;
}

export function grokAuth() {
  const apiKey = process.env.GROK_API_KEY;
  const apiUrl = process.env.GROK_API_URL || "https://api.x.ai/v1";
  if (!apiKey) {
    throw new Error("GROK_API_KEY is not configured");
  }
  return {
    apiKey,
    apiUrl,
    model: CHAT_MODEL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  };
}

function lengthLine(length?: "short" | "medium" | "long") {
  if (length === "short") {
    return "Length: Keep answers short. A few sentences or a tight list. No extra sections.";
  }
  if (length === "long") {
    return "Length: Be thorough. Cover the useful details, still in plain language.";
  }
  return "Length: Medium. Enough to be useful, not an essay.";
}

export function grokInput(
  messages: GrokMessage[],
  options?: { answerLength?: "short" | "medium" | "long"; system?: string }
) {
  const system =
    options?.system ||
    `${ASK_SYSTEM_PROMPT}\n\n${lengthLine(options?.answerLength)}\n\n${clockLine()}`;
  return [
    {
      role: "system",
      content: system,
    },
    ...messages.filter((m) => m.role !== "system"),
  ];
}

export function grokResponsesBody(
  messages: GrokMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
    effort?: ReasoningEffort;
    stream?: boolean;
    tools?: boolean;
    answerLength?: "short" | "medium" | "long";
    system?: string;
  }
) {
  const effort = options?.effort || FAST_EFFORT;
  const useTools = options?.tools !== false;
  const length = options?.answerLength || "medium";
  const maxTokens =
    options?.maxTokens ??
    (length === "short" ? 500 : length === "long" ? 1800 : effort === "none" ? 1100 : 1600);
  return {
    model: options?.model || CHAT_MODEL,
    input: grokInput(messages, {
      answerLength: length,
      system: options?.system,
    }),
    temperature: options?.temperature ?? 0.5,
    max_output_tokens: maxTokens,
    reasoning: { effort },
    ...(useTools
      ? { tools: [{ type: "web_search" }], max_tool_calls: 2 }
      : {}),
    store: false,
    stream: options?.stream ?? false,
  };
}

export async function callGrokChat(
  messages: GrokMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
    effort?: ReasoningEffort;
    tools?: boolean;
    answerLength?: "short" | "medium" | "long";
    system?: string;
  }
): Promise<string> {
  const { apiUrl, headers } = grokAuth();
  const body = grokResponsesBody(messages, options);

  const response = await fetch(`${apiUrl}/responses`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (response.ok) {
    const data = await response.json();
    const { text, citations } = parseResponsesPayload(data);
    if (text.trim()) {
      return attachSources(sanitizeModelText(text), citations);
    }
  }

  const fallback = await fetch(`${apiUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: body.model,
      messages: body.input,
      temperature: body.temperature,
      max_tokens: body.max_output_tokens,
    }),
  });

  if (!fallback.ok) {
    const errorText = await (response.ok ? fallback : response).text();
    throw new Error(
      `Grok API error (${fallback.status || response.status}): ${errorText}`
    );
  }

  const data = await fallback.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  return sanitizeModelText(String(raw));
}

export function parseResponsesPayload(data: unknown): {
  text: string;
  citations: DisplaySource[];
} {
  const root = data as {
    output_text?: unknown;
    citations?: unknown;
    output?: unknown;
    response?: { output?: unknown; output_text?: unknown; citations?: unknown };
  };

  const payload = root.response && typeof root.response === "object" ? root.response : root;
  const citations: DisplaySource[] = [];
  const seen = new Set<string>();

  function addUrl(url: string, label?: string) {
    const clean = url.trim();
    if (!clean.startsWith("http") || seen.has(clean)) return;
    seen.add(clean);
    citations.push({
      label: (label && !/^\d+$/.test(label) ? label : hostnameLabel(clean)).trim(),
      url: clean,
    });
  }

  if (Array.isArray(payload.citations)) {
    for (const item of payload.citations) {
      if (typeof item === "string") addUrl(item);
      else if (item && typeof item === "object" && "url" in item) {
        const row = item as { url?: unknown; title?: unknown };
        if (typeof row.url === "string") {
          addUrl(row.url, typeof row.title === "string" ? row.title : undefined);
        }
      }
    }
  }

  let text = "";
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const row = item as { type?: unknown; content?: unknown };
    if (row.type !== "message") continue;
    const parts = Array.isArray(row.content) ? row.content : [];
    for (const part of parts) {
      if (!part || typeof part !== "object") continue;
      const block = part as {
        type?: unknown;
        text?: unknown;
        annotations?: unknown;
      };
      if (block.type !== "output_text" && block.type !== "text") continue;
      if (typeof block.text === "string") text += block.text;
      if (Array.isArray(block.annotations)) {
        for (const ann of block.annotations) {
          if (ann && typeof ann === "object" && "url" in ann) {
            const cite = ann as { url?: unknown; title?: unknown };
            if (typeof cite.url === "string") {
              addUrl(
                cite.url,
                typeof cite.title === "string" ? cite.title : undefined
              );
            }
          }
        }
      }
    }
  }

  if (!text && typeof payload.output_text === "string") {
    text = payload.output_text;
  }

  return { text, citations: citations.slice(0, 8) };
}

/** Cheap history label. Skips the model when the first question already fits. */
export async function summarizeChatTitle(userText: string): Promise<string> {
  const cleaned = userText.replace(/\s+/g, " ").trim();
  if (!cleaned) return "New chat";
  if (cleaned.length <= HISTORY_TITLE_MAX) return cleaned;

  try {
    const { apiUrl, headers, model } = grokAuth();
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 40,
        messages: [
          {
            role: "system",
            content:
              "Write a history label for this question. Max 50 characters. No quotes. No trailing period. Plain text only.",
          },
          { role: "user", content: cleaned.slice(0, 500) },
        ],
      }),
    });
    if (!response.ok) return clipAtWord(cleaned, HISTORY_TITLE_MAX);
    const data = await response.json();
    const raw = String(data.choices?.[0]?.message?.content ?? "")
      .replace(/\s+/g, " ")
      .replace(/^["']|["']$/g, "")
      .trim();
    if (!raw) return clipAtWord(cleaned, HISTORY_TITLE_MAX);
    return clipAtWord(raw, HISTORY_TITLE_MAX);
  } catch {
    return clipAtWord(cleaned, HISTORY_TITLE_MAX);
  }
}
