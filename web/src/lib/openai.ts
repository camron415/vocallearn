import { ASK_SYSTEM_PROMPT, clockLine } from "@/lib/constants";
import { sanitizeModelText } from "@/lib/markdown-plain";

export type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenAIUsage = {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
};

/** Runtime Luna model. Override via GPT_LUNA_MODEL. */
export const LUNA_MODEL =
  process.env.GPT_LUNA_MODEL?.trim() ||
  process.env.OPENAI_LUNA_MODEL?.trim() ||
  "gpt-4.1-mini";

const LUNA_MAX_OUTPUT_SHORT = 500;
const LUNA_MAX_OUTPUT_MEDIUM = 900;

export function lunaEnabled() {
  return (
    process.env.HALO_USE_LUNA !== "0" &&
    Boolean(process.env.OPENAI_API_KEY?.trim())
  );
}

export function openaiAuth() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return { apiKey, model: LUNA_MODEL };
}

function lengthLine(length?: "short" | "medium" | "long") {
  if (length === "short") {
    return "Length: Keep answers short. A few sentences or a tight list. No extra sections.";
  }
  if (length === "long") {
    return "Length: Be thorough but still plain language.";
  }
  return "Length: Medium. Enough to be useful, not an essay.";
}

function maxTokensForLength(length?: "short" | "medium" | "long") {
  if (length === "short") return LUNA_MAX_OUTPUT_SHORT;
  if (length === "long") return LUNA_MAX_OUTPUT_MEDIUM;
  return LUNA_MAX_OUTPUT_MEDIUM;
}

export function openaiMessages(
  messages: OpenAIMessage[],
  options?: {
    answerLength?: "short" | "medium" | "long";
    system?: string;
    timeZone?: string;
  }
): OpenAIMessage[] {
  const system = [
    options?.system || ASK_SYSTEM_PROMPT,
    lengthLine(options?.answerLength),
    clockLine(new Date(), options?.timeZone),
  ]
    .filter(Boolean)
    .join("\n\n");
  return [
    { role: "system", content: system },
    ...messages.filter((m) => m.role !== "system"),
  ];
}

export async function callOpenAIChat(
  messages: OpenAIMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
    answerLength?: "short" | "medium" | "long";
    system?: string;
    timeZone?: string;
  }
): Promise<{ text: string; usage?: OpenAIUsage }> {
  const { apiKey, model } = openaiAuth();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options?.model || model,
      messages: openaiMessages(messages, options),
      temperature: options?.temperature ?? 0.5,
      max_tokens: options?.maxTokens ?? maxTokensForLength(options?.answerLength),
      stream: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${detail.slice(0, 240)}`);
  }

  const data = await response.json();
  const raw = String(data.choices?.[0]?.message?.content ?? "");
  const usage = data.usage as {
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
  } | undefined;
  return {
    text: sanitizeModelText(raw),
    usage: usage
      ? {
          inputTokens: Number(usage.prompt_tokens) || 0,
          outputTokens: Number(usage.completion_tokens) || 0,
          cachedTokens: Number(usage.prompt_tokens_details?.cached_tokens) || 0,
        }
      : undefined,
  };
}

export type OpenAILiveEvent =
  | { type: "delta"; text: string }
  | { type: "done"; text: string; usage?: OpenAIUsage };

export async function* streamOpenAIChat(
  messages: OpenAIMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
    answerLength?: "short" | "medium" | "long";
    system?: string;
    timeZone?: string;
  }
): AsyncGenerator<OpenAILiveEvent> {
  const { apiKey, model } = openaiAuth();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options?.model || model,
      messages: openaiMessages(messages, options),
      temperature: options?.temperature ?? 0.5,
      max_tokens: options?.maxTokens ?? maxTokensForLength(options?.answerLength),
      stream: true,
      stream_options: { include_usage: true },
    }),
  });

  if (!response.ok || !response.body) {
    const { text, usage } = await callOpenAIChat(messages, options);
    yield { type: "delta", text };
    yield { type: "done", text, usage };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let assembled = "";
  let usage: OpenAIUsage | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part
        .split("\n")
        .find((row) => row.startsWith("data:"));
      if (!line) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
          usage?: {
            prompt_tokens?: number;
            completion_tokens?: number;
            prompt_tokens_details?: { cached_tokens?: number };
          };
        };
        const piece = parsed.choices?.[0]?.delta?.content;
        if (piece) {
          assembled += piece;
          yield { type: "delta", text: piece };
        }
        if (parsed.usage) {
          usage = {
            inputTokens: Number(parsed.usage.prompt_tokens) || 0,
            outputTokens: Number(parsed.usage.completion_tokens) || 0,
            cachedTokens:
              Number(parsed.usage.prompt_tokens_details?.cached_tokens) || 0,
          };
        }
      } catch {
        // ignore malformed chunks
      }
    }
  }

  const text = sanitizeModelText(assembled);
  if (!assembled && text) {
    yield { type: "delta", text };
  }
  yield { type: "done", text, usage };
}
