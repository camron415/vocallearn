import { pickAnswerProvider, type AnswerProvider } from "@/lib/ask-provider";
import type { AskRoute } from "@/lib/ask-route";
import type { GrokMessage, ReasoningEffort } from "@/lib/grok";
import { streamGrokChat, type GrokLiveEvent, type GrokUsage } from "@/lib/grok-stream";
import {
  streamOpenAIChat,
  type OpenAIUsage,
  type OpenAILiveEvent,
} from "@/lib/openai";

export type AskUsage = (GrokUsage | OpenAIUsage) & { provider: AnswerProvider };

export type AskLiveEvent =
  | GrokLiveEvent
  | OpenAILiveEvent
  | { type: "meta"; provider: AnswerProvider };

function toOpenAIMessages(messages: GrokMessage[]) {
  return messages.map((m) => ({
    role: m.role,
    content:
      typeof m.content === "string"
        ? m.content
        : m.content
            .map((part) =>
              part.type === "input_text" ? part.text : "[attachment]"
            )
            .join("\n"),
  }));
}

async function* streamLunaAnswer(
  messages: GrokMessage[],
  options: {
    maxTokens?: number;
    temperature?: number;
    answerLength?: "short" | "medium" | "long";
    system?: string;
    timeZone?: string;
  }
): AsyncGenerator<OpenAILiveEvent> {
  const openaiMessages = toOpenAIMessages(messages);
  for await (const live of streamOpenAIChat(openaiMessages, options)) {
    yield live;
  }
}

async function* streamGrokAnswer(
  messages: GrokMessage[],
  options: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
    effort?: ReasoningEffort;
    tools?: boolean;
    maxToolCalls?: number;
    answerLength?: "short" | "medium" | "long";
    system?: string;
    timeZone?: string;
  }
): AsyncGenerator<GrokLiveEvent> {
  for await (const live of streamGrokChat(messages, options)) {
    yield live;
  }
}

export async function* streamAskAnswer(
  messages: GrokMessage[],
  options: {
    route: AskRoute;
    hasAttachments: boolean;
    maxTokens?: number;
    temperature?: number;
    model?: string;
    effort?: ReasoningEffort;
    tools?: boolean;
    maxToolCalls?: number;
    answerLength?: "short" | "medium" | "long";
    system?: string;
    timeZone?: string;
  }
): AsyncGenerator<AskLiveEvent> {
  const intended = pickAnswerProvider(options.route, options.hasAttachments);
  let provider = intended;
  yield { type: "meta", provider };

  const lunaOpts = {
    answerLength: options.answerLength,
    system: options.system,
    timeZone: options.timeZone,
    maxTokens: options.maxTokens,
    temperature: options.temperature,
  };
  const grokOpts = {
    effort: options.effort,
    answerLength: options.answerLength,
    tools: intended === "grok" && Boolean(options.tools),
    maxToolCalls: intended === "grok" ? options.maxToolCalls : 0,
    timeZone: options.timeZone,
    system: options.system,
    maxTokens: options.maxTokens,
    temperature: options.temperature,
    model: options.model,
  };

  if (provider === "luna") {
    try {
      for await (const live of streamLunaAnswer(messages, lunaOpts)) {
        yield live;
      }
      return;
    } catch {
      provider = "grok";
      yield { type: "meta", provider };
    }
  }

  for await (const live of streamGrokAnswer(messages, grokOpts)) {
    yield live;
  }
}
