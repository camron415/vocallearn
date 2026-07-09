import { AI_CONFIG } from "@/constants/config";

const GROK_API_URL = process.env.EXPO_PUBLIC_GROK_API_URL || "https://api.x.ai/v1";
const GROK_API_KEY = process.env.EXPO_PUBLIC_GROK_API_KEY;
const DEFAULT_CHAT_MODEL = "grok-3-mini";
const DEFAULT_TUTOR_MODEL = "grok-voice-think-fast-1.0";
const DEFAULT_TUTOR_CHAT_MODEL =
  process.env.EXPO_PUBLIC_GROK_TUTOR_CHAT_MODEL || "grok-4-fast-non-reasoning";
const DEFAULT_SCORING_MODEL =
  process.env.EXPO_PUBLIC_GROK_SCORING_MODEL || "grok-4-fast-non-reasoning";

export interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GrokUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface GrokResponse {
  content: string;
  usage?: GrokUsage;
  model?: string;
  route?: "chat" | "realtime-text" | "realtime-text-audio";
  /** Base64-encoded PCM16 audio at `sampleRate` Hz — present when the realtime
   *  tutor path collected audio alongside text. Callers can play this directly
   *  instead of making a separate Ara TTS request. */
  audioDataBase64?: string;
  sampleRate?: number;
  firstAudioDeltaMs?: number;
  responseDoneDeltaMs?: number;
  streamPlaybackPromise?: Promise<void>;
}

interface GrokCallOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  timeoutMs?: number;
}

function createTimeoutController(timeoutMs?: number): { controller?: AbortController; timeoutId?: ReturnType<typeof setTimeout> } {
  if (!timeoutMs || timeoutMs <= 0) return {};

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeoutId };
}

function rethrowAbortError(error: unknown, timeoutMs?: number): never {
  if ((error as Error)?.name === "AbortError") {
    throw new Error(`Grok request timed out after ${timeoutMs ?? 0}ms`);
  }

  throw error;
}

function assertApiKey(): string {
  if (!GROK_API_KEY) {
    throw new Error("GROK_API_KEY is not configured");
  }
  return GROK_API_KEY;
}

function maybeLogModelRoute(route: string, model: string): void {
  if (!AI_CONFIG.logModelRouting) return;
  console.log(`[AI] ${route}: ${model}`);
}

function extractFirstCompleteJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (char === "\\") {
      if (inString) isEscaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

async function callChatCompletion(
  messages: GrokMessage[],
  options?: GrokCallOptions
): Promise<GrokResponse> {
  const apiKey = assertApiKey();
  const model = options?.model ?? DEFAULT_CHAT_MODEL;
  const { controller, timeoutId } = createTimeoutController(options?.timeoutMs);

  try {
    const response = await fetch(`${GROK_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 500,
      }),
      signal: controller?.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model,
      route: "chat",
    };
  } catch (error) {
    rethrowAbortError(error, options?.timeoutMs);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  throw new Error("Grok chat request failed unexpectedly.");
}

/**
 * Streaming variant for scoring calls: uses SSE streaming and stops reading
 * as soon as a complete JSON object is detected. For short scoring responses
 * (~30-60 tokens), this shaves 1-3s off the tail latency by not waiting for
 * the [DONE] sentinel and usage metadata the API sends after the JSON closes.
 */
async function callChatCompletionStreaming(
  messages: GrokMessage[],
  options?: GrokCallOptions
): Promise<GrokResponse> {
  const apiKey = assertApiKey();
  const model = options?.model ?? DEFAULT_CHAT_MODEL;
  const { controller, timeoutId } = createTimeoutController(options?.timeoutMs);

  try {
    const response = await fetch(`${GROK_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 150,
        stream: true,
      }),
      signal: controller?.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error (${response.status}): ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Grok streaming API returned no response body");
    }
    const decoder = new TextDecoder();
    let accumulated = "";
    let pendingLine = "";

    const processSseLine = (rawLine: string): GrokResponse | null => {
      const trimmed = rawLine.replace(/\r$/, "").trim();
      if (!trimmed.startsWith("data:")) return null;

      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") {
        return { content: accumulated, model, route: "chat" };
      }

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (typeof delta === "string") accumulated += delta;
      } catch {
        // Ignore malformed event payloads. Buffered line handling prevents
        // chunk-boundary splits from dropping valid deltas.
      }

      const completeJson = extractFirstCompleteJsonObject(accumulated);
      if (completeJson) {
        return { content: completeJson, model, route: "chat" };
      }

      return null;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      pendingLine += decoder.decode(value, { stream: true });
      let newlineIndex = pendingLine.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = pendingLine.slice(0, newlineIndex);
        pendingLine = pendingLine.slice(newlineIndex + 1);
        const result = processSseLine(line);
        if (result) {
          reader.cancel().catch(() => {});
          return result;
        }
        newlineIndex = pendingLine.indexOf("\n");
      }
    }

    if (pendingLine.trim()) {
      const result = processSseLine(pendingLine);
      if (result) return result;
    }

    return { content: accumulated, model, route: "chat" };
  } catch (error) {
    rethrowAbortError(error, options?.timeoutMs);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  throw new Error("Grok streaming request failed unexpectedly.");
}

async function createRealtimeClientSecret(): Promise<string> {
  const apiKey = assertApiKey();
  const response = await fetch(`${GROK_API_URL}/realtime/client_secrets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      expires_after: { seconds: 600 },
      session: { model: DEFAULT_TUTOR_MODEL },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Realtime client secret failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (!data.value) {
    throw new Error("Realtime client secret response did not include a token.");
  }
  return data.value;
}

function buildRealtimeUrl(): string {
  const url = new URL(GROK_API_URL.replace(/^http/i, "ws"));
  url.pathname = "/v1/realtime";
  url.searchParams.set("model", DEFAULT_TUTOR_MODEL);
  return url.toString();
}

function toRealtimeConversationItem(message: GrokMessage) {
  if (message.role === "assistant") {
    return {
      type: "message",
      role: "assistant",
      content: [{ type: "text", text: message.content }],
    };
  }
  return {
    type: "message",
    role: "user",
    content: [{ type: "input_text", text: message.content }],
  };
}

function extractRealtimeText(payload: any): string | null {
  if (payload?.part?.text) return String(payload.part.text);
  if (payload?.part?.transcript) return String(payload.part.transcript);

  const content = payload?.item?.content;
  if (!Array.isArray(content)) return null;

  const textParts = content
    .map((part) => part?.text ?? part?.transcript ?? null)
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0);

  return textParts.length > 0 ? textParts.join(" ") : null;
}

function extractRealtimeSampleRate(payload: any, fallback: number): number {
  const candidates = [
    payload?.sample_rate,
    payload?.audio?.sample_rate,
    payload?.part?.sample_rate,
    payload?.part?.audio?.sample_rate,
    payload?.item?.sample_rate,
    payload?.item?.audio?.sample_rate,
    payload?.response?.sample_rate,
    payload?.response?.audio?.sample_rate,
  ];

  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return fallback;
}

async function callTutorRealtimeText(
  messages: GrokMessage[],
  options?: GrokCallOptions
): Promise<GrokResponse> {
  const { startStreamingPcmPlayback } = await import("@/lib/voice");
  const systemMessages = messages.filter((message) => message.role === "system");
  const conversationMessages = messages.filter((message) => message.role !== "system");
  const instructions = systemMessages.map((message) => message.content).join("\n\n").trim();
  const clientSecret = await createRealtimeClientSecret();

  return await new Promise<GrokResponse>((resolve, reject) => {
    const socket = new WebSocket(buildRealtimeUrl(), [`xai-client-secret.${clientSecret}`]);
    const timeout = setTimeout(() => {
      try {
        socket.close();
      } catch {}
      reject(new Error("Realtime tutor request timed out."));
    }, 20000);

    let configured = false;
    let responded = false;
    let responseRequested = false;
    let finalText = "";
    let finalAudioBase64 = "";
    let sampleRate = 24000;
    let sawTextDelta = false;
    let sawAudioTranscriptDelta = false;
    const requestStartedAt = Date.now();
    let firstAudioDeltaMs: number | undefined;
    let responseDoneDeltaMs: number | undefined;
    let retriedResponseCreate = false;
    let streamPlaybackPromise: Promise<void> | undefined;
    let streamPlayerPromise: Promise<Awaited<ReturnType<typeof startStreamingPcmPlayback>>> | null = null;

    const ensureStreamPlayer = () => {
      if (!AI_CONFIG.useVoiceThinkFastTutorAudio) return null;
      if (!streamPlayerPromise) {
        streamPlayerPromise = startStreamingPcmPlayback(24000);
        streamPlaybackPromise = streamPlayerPromise.then((player) => player.completion);
      }
      return streamPlayerPromise;
    };

    const buildResponseCreatePayload = (includeAdvancedOptions: boolean) => {
      const response: Record<string, unknown> = {
        modalities: AI_CONFIG.useVoiceThinkFastTutorAudio ? ["text", "audio"] : ["text"],
      };

      if (includeAdvancedOptions) {
        if (typeof options?.temperature === "number") {
          response.temperature = options.temperature;
        }
        if (typeof options?.maxTokens === "number") {
          response.max_output_tokens = options.maxTokens;
        }
      }

      return {
        type: "response.create",
        response,
      };
    };

    const cleanup = () => {
      clearTimeout(timeout);
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
    };

    const fail = (error: Error) => {
      cleanup();
      try {
        socket.close();
      } catch {}
      reject(error);
    };

    const finish = () => {
      cleanup();
      try {
        socket.close();
      } catch {}
      const content = finalText.trim();
      if (!content) {
        reject(new Error("Realtime tutor request returned no text."));
        return;
      }
      resolve({
        content,
        model: DEFAULT_TUTOR_MODEL,
        route: finalAudioBase64 ? "realtime-text-audio" : "realtime-text",
        audioDataBase64: finalAudioBase64 || undefined,
        sampleRate: finalAudioBase64 ? sampleRate : undefined,
        firstAudioDeltaMs,
        responseDoneDeltaMs,
        streamPlaybackPromise,
      });
    };

    const configureSession = () => {
      if (configured) return;
      configured = true;
      socket.send(
        JSON.stringify({
          type: "session.update",
          session: {
            model: DEFAULT_TUTOR_MODEL,
            instructions,
            voice: "ara",
            turn_detection: { type: null },
            audio: {
              output: {
                format: {
                  type: "audio/pcm",
                  rate: 24000,
                },
              },
            },
          },
        })
      );
    };

    socket.onmessage = (event) => {
      let payload: any;
      try {
        payload = JSON.parse(String(event.data));
      } catch {
        return;
      }

      switch (payload.type) {
        case "session.created":
        case "conversation.created":
          configureSession();
          return;
        case "session.updated":
          if (responseRequested) return;
          responseRequested = true;
          for (const message of conversationMessages) {
            socket.send(JSON.stringify({ type: "conversation.item.create", item: toRealtimeConversationItem(message) }));
          }
          socket.send(JSON.stringify(buildResponseCreatePayload(true)));
          return;
        case "response.text.delta":
          if (typeof payload.delta === "string") {
            sawTextDelta = true;
            finalText += payload.delta;
          }
          return;
        case "response.output_audio_transcript.delta":
          if (typeof payload.delta === "string" && !sawTextDelta) {
            sawAudioTranscriptDelta = true;
            finalText += payload.delta;
          }
          return;
        case "response.output_audio_transcript.done":
          if (typeof payload.transcript === "string" && !sawTextDelta && !finalText.trim()) {
            finalText = payload.transcript;
          }
          return;
        case "response.audio.delta":
        case "response.output_audio.delta":
          if (typeof payload.delta === "string") {
            if (firstAudioDeltaMs === undefined) {
              firstAudioDeltaMs = Date.now() - requestStartedAt;
            }
            finalAudioBase64 += payload.delta;
            ensureStreamPlayer()?.then((player) => player.appendBase64Chunk(payload.delta)).catch(() => {});
          }
          sampleRate = extractRealtimeSampleRate(payload, sampleRate);
          return;
        case "response.audio.done":
        case "response.output_audio.done":
          sampleRate = extractRealtimeSampleRate(payload, sampleRate);
          return;
        case "response.content_part.done": {
          const text = extractRealtimeText(payload);
          if (text && !finalText.trim()) {
            finalText = text;
          }
          sampleRate = extractRealtimeSampleRate(payload, sampleRate);
          return;
        }
        case "response.output_item.done": {
          const text = extractRealtimeText(payload);
          if (text && !finalText.trim()) {
            finalText = text;
          }
          sampleRate = extractRealtimeSampleRate(payload, sampleRate);
          return;
        }
        case "response.done":
          responseDoneDeltaMs = Date.now() - requestStartedAt;
          if (streamPlayerPromise) {
            streamPlaybackPromise = streamPlayerPromise.then((player) => player.finish());
          }
          responded = true;
          finish();
          return;
        case "error":
          if (!retriedResponseCreate) {
            const errorMessage = String(payload.error?.message ?? "");
            if (/max[_ ]output[_ ]tokens|temperature|unknown field|invalid field|unsupported/i.test(errorMessage)) {
              retriedResponseCreate = true;
              socket.send(JSON.stringify(buildResponseCreatePayload(false)));
              return;
            }
          }
          fail(new Error(`Realtime tutor error: ${payload.error?.message ?? "unknown error"}`));
          return;
        default:
          return;
      }
    };

    socket.onerror = () => {
      fail(new Error("Realtime tutor websocket transport error."));
    };

    socket.onclose = () => {
      if (!responded) {
        fail(new Error("Realtime tutor websocket closed before response completion."));
      }
    };
  });
}

/**
 * Standard non-streaming chat call — use for generation/teach scripts.
 */
export async function callGrok(
  messages: GrokMessage[],
  options?: GrokCallOptions
): Promise<GrokResponse> {
  const response = await callChatCompletion(messages, options);
  maybeLogModelRoute("chat", response.model ?? DEFAULT_CHAT_MODEL);
  return response;
}

/**
 * Streaming chat call optimised for short JSON responses (scoring).
 * Exits as soon as a complete JSON object is seen in the stream, cutting
 * 1-3s of tail latency vs. waiting for the full [DONE] sentinel.
 */
export async function callGrokScoring(
  messages: GrokMessage[],
  options?: GrokCallOptions
): Promise<GrokResponse> {
  try {
    const response = await callChatCompletionStreaming(messages, {
      ...options,
      model: options?.model ?? DEFAULT_SCORING_MODEL,
      timeoutMs: options?.timeoutMs ?? 8000,
    });
    maybeLogModelRoute("chat-scoring", response.model ?? DEFAULT_SCORING_MODEL);
    return response;
  } catch (error) {
    console.warn("Streaming scoring failed, retrying with standard chat completion:", error);
    const response = await callChatCompletion(messages, {
      ...options,
      model: options?.model ?? DEFAULT_SCORING_MODEL,
      temperature: options?.temperature ?? 0.3,
      maxTokens: options?.maxTokens ?? 150,
      timeoutMs: Math.min(options?.timeoutMs ?? 8000, 5000),
    });
    maybeLogModelRoute("chat-scoring-fallback", response.model ?? DEFAULT_SCORING_MODEL);
    return response;
  }
}

export async function callTutorGrok(
  messages: GrokMessage[],
  options?: GrokCallOptions
): Promise<GrokResponse> {
  if (!AI_CONFIG.useVoiceThinkFastTutor) {
    const response = await callChatCompletion(messages, { ...options, model: DEFAULT_TUTOR_CHAT_MODEL });
    maybeLogModelRoute("tutor-fallback", response.model ?? DEFAULT_TUTOR_CHAT_MODEL);
    return response;
  }

  try {
    const response = await callTutorRealtimeText(messages, options);
    maybeLogModelRoute("tutor-realtime", response.model ?? DEFAULT_TUTOR_MODEL);
    return response;
  } catch (error) {
    console.warn("Voice Think Fast tutor path failed, falling back to grok-3-mini:", error);
    const response = await callChatCompletion(messages, { ...options, model: DEFAULT_TUTOR_CHAT_MODEL });
    maybeLogModelRoute("tutor-realtime-fallback", response.model ?? DEFAULT_TUTOR_CHAT_MODEL);
    return response;
  }
}

export interface GeneratedFact {
  content: string;
  explanation: string;
  strictness: "high" | "medium" | "low";
}

export interface GeneratedLesson {
  subjectName: string;
  lessonTitle: string;
  lessonDescription: string;
  facts: GeneratedFact[];
}

export async function generateLessonFromTopic(topic: string): Promise<GeneratedLesson> {
  const response = await callGrok([
    {
      role: "system",
      content: `You are a master teacher creating a voice-based lesson. Think of how the best educators teach — they don't list facts, they tell a story that builds understanding layer by layer.

Your approach:
1. Start with a relatable analogy or mental image that makes the topic click ("Imagine..." or "Think of it like...")
2. Build each fact on the previous one — create a narrative thread so the learner feels they're going on a journey, not reading a dictionary
3. Use the "explanation" field to connect each fact to what came before ("Now that you understand X, this next part will make sense...")
4. Write facts as natural spoken sentences a teacher would say, not textbook definitions
5. Match complexity to the user's level cues ("for beginners" = use everyday language and analogies; "advanced" = can assume prior knowledge)

For each fact:
- "content": The core idea as ONE clear spoken sentence. This is what the learner needs to remember.
- "explanation": A teaching bridge — connect to the previous fact, explain WHY this matters, use an analogy. This is spoken aloud by a voice tutor, so write it conversationally. 2-3 sentences max.
- "strictness": "high" for exact numbers/formulas/dates, "medium" for key definitions, "low" for conceptual understanding

Rules:
- Exactly 10 facts per lesson
- Order facts so each builds on the last — the lesson should have a clear arc from "ah I see the big picture" to "now I know the details"
- The first fact's explanation should set the scene with a vivid analogy or hook
- Never start explanations with "This means..." — be more creative
- Facts must be accurate and well-researched

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "subjectName": "Broad subject area",
  "lessonTitle": "Specific lesson title",
  "lessonDescription": "One sentence summarizing the journey the learner will take",
  "facts": [
    {
      "content": "A concise, memorizable fact as a complete sentence",
      "explanation": "Teaching bridge that connects to prior knowledge and makes this memorable",
      "strictness": "low"
    }
  ]
}`,
    },
    {
      role: "user",
      content: `Create a lesson about: ${topic}`,
    },
  ], { maxTokens: 2000, temperature: 0.7 });

  // Strip markdown code fences if present
  let content = response.content.trim();
  content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse lesson from AI response");

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedLesson;

  // Validate structure
  if (!parsed.subjectName || !parsed.lessonTitle || !Array.isArray(parsed.facts) || parsed.facts.length === 0) {
    throw new Error("Generated lesson is missing required fields");
  }

  return parsed;
}
