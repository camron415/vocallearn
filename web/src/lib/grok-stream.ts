import {
  callGrokChat,
  grokAuth,
  grokResponsesBody,
  parseResponsesPayload,
  type GrokMessage,
  type ReasoningEffort,
} from "@/lib/grok";
import {
  attachSources,
  looksLikeEncryptedBlob,
  sanitizeModelText,
} from "@/lib/markdown-plain";

export type GrokUsage = {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
};

export type GrokLiveEvent =
  | { type: "status"; status: "searching" | "reading"; detail?: string }
  | { type: "thinking"; text: string }
  | { type: "delta"; text: string }
  | { type: "done"; text: string; usage?: GrokUsage };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

async function* iterateSse(
  response: Response
): AsyncGenerator<Record<string, unknown>> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const data = part
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n")
        .trim();
      if (!data || data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data) as unknown;
        const rec = asRecord(parsed);
        if (rec) yield rec;
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

function eventDelta(event: Record<string, unknown>): string {
  if (typeof event.delta === "string") return event.delta;
  const delta = asRecord(event.delta);
  if (delta) {
    return (
      str(delta.text) ||
      str(delta.content) ||
      str(delta.reasoning_content) ||
      str(delta.reasoning)
    );
  }
  return "";
}

function itemType(event: Record<string, unknown>): string {
  const item = asRecord(event.item) || asRecord(event.output_item);
  return str(item?.type) || str(event.type);
}

function actionDetail(event: Record<string, unknown>): string | undefined {
  const item = asRecord(event.item) || asRecord(event.output_item);
  const action = asRecord(item?.action) || asRecord(event.action);
  if (!action) return undefined;
  const query = str(action.query) || str(action.url) || str(action.domain);
  return query || undefined;
}

function parseUsage(value: unknown): GrokUsage | undefined {
  const rec = asRecord(value);
  const usage = asRecord(rec?.usage) || asRecord(asRecord(rec?.response)?.usage);
  if (!usage) return undefined;
  const details = asRecord(usage.input_tokens_details);
  const input =
    Number(usage.input_tokens ?? usage.prompt_tokens) || 0;
  const output =
    Number(usage.output_tokens ?? usage.completion_tokens) || 0;
  const cached =
    Number(usage.cached_tokens ?? details?.cached_tokens) || 0;
  if (!input && !output) return undefined;
  return { inputTokens: input, outputTokens: output, cachedTokens: cached };
}

function liveStatus(
  event: Record<string, unknown>
): { status: "searching" | "reading"; detail?: string } | null {
  const blob = `${str(event.type)} ${itemType(event)}`.toLowerCase();
  if (
    blob.includes("web_search") ||
    blob.includes("searching") ||
    blob.includes("web_search_call")
  ) {
    return { status: "searching", detail: actionDetail(event) };
  }
  if (
    blob.includes("browse") ||
    blob.includes("open_page") ||
    blob.includes("reading")
  ) {
    return { status: "reading", detail: actionDetail(event) };
  }
  return null;
}

function isThinkingEvent(event: Record<string, unknown>): boolean {
  const t = `${str(event.type)} ${itemType(event)}`.toLowerCase();
  return t.includes("reasoning") && !t.includes("encrypted");
}

function isOutputDelta(event: Record<string, unknown>): boolean {
  const t = str(event.type).toLowerCase();
  return (
    t === "response.output_text.delta" ||
    t === "response.content_part.delta" ||
    t.endsWith("output_text.delta")
  );
}

export async function* streamGrokChat(
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
): AsyncGenerator<GrokLiveEvent> {
  const effort = options?.effort || "none";
  const { apiUrl, headers } = grokAuth();
  const body = grokResponsesBody(messages, { ...options, stream: true });

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/responses`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    const text = await callGrokChat(messages, options);
    yield { type: "delta", text };
    yield { type: "done", text };
    return;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.includes("text/event-stream")) {
    if (response.ok) {
      const data = await response.json();
      const parsed = parseResponsesPayload(data);
      if (parsed.text.trim()) {
        const text = attachSources(sanitizeModelText(parsed.text), parsed.citations);
        yield { type: "delta", text };
        yield { type: "done", text, usage: parseUsage(data) };
        return;
      }
    }
    const text = await callGrokChat(messages, options);
    yield { type: "delta", text };
    yield { type: "done", text };
    return;
  }

  let assembled = "";
  let completedText = "";
  let usage: GrokUsage | undefined;
  const seenStatus = new Set<string>();

  for await (const event of iterateSse(response)) {
    const status = liveStatus(event);
    if (status) {
      const key = `${status.status}:${status.detail || ""}`;
      if (!seenStatus.has(key)) {
        seenStatus.add(key);
        yield { type: "status", status: status.status, detail: status.detail };
      }
    }

    if (effort !== "none" && isThinkingEvent(event)) {
      const piece = eventDelta(event);
      if (piece && !looksLikeEncryptedBlob(piece)) {
        yield { type: "thinking", text: piece };
      }
    }

    if (isOutputDelta(event)) {
      const piece = eventDelta(event);
      if (piece) {
        assembled += piece;
        yield { type: "delta", text: piece };
      }
    }

    const type = str(event.type);
    if (type === "response.completed" || type === "response.incomplete") {
      const parsed = parseResponsesPayload(event.response ?? event);
      if (parsed.text.trim()) {
        completedText = attachSources(
          sanitizeModelText(parsed.text),
          parsed.citations
        );
      }
      usage = parseUsage(event) || parseUsage(event.response) || usage;
    }
    usage = parseUsage(event) || usage;
  }

  const text =
    completedText ||
    (assembled.trim()
      ? attachSources(sanitizeModelText(assembled), [])
      : await callGrokChat(messages, options));

  if (!assembled && text) {
    yield { type: "delta", text };
  }
  yield { type: "done", text, usage };
}
