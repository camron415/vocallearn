import { pickReasoningEffort, type ReasoningEffort } from "@/lib/grok";
import { gatherLiveBriefs } from "@/lib/live-lookups";
import type { DisplaySource } from "@/lib/markdown-plain";
import { localeLine, type HaloGeo } from "@/lib/request-geo";

export type AskRoute = {
  kind: "lookup" | "reason";
  tools: boolean;
  effort: ReasoningEffort;
  /** 0 = search off. Default reason = 1. Depth = 2. */
  maxToolCalls: number;
  /** Fetch free feeds even when search will run (why / more / explain). */
  seedLive?: boolean;
};

export type FeedDomain =
  | "weather"
  | "news"
  | "stocks"
  | "crypto"
  | "forex"
  | "sports"
  | "holidays"
  | "quakes"
  | "airquality"
  | "time"
  | "tv"
  | "books";

/**
 * Machines we already fetch. Not Keep authority. Not search authority.
 * Capitals / definitions / who-wrote stay remember — those are not live feeds here.
 */
const FEED_HINTS: Array<{ domain: FeedDomain; re: RegExp }> = [
  {
    domain: "weather",
    re: /\b(weather|forecast|rain(?:ing|s)?|snow|temperature|umbrella|sunrise|sunset)\b/i,
  },
  { domain: "airquality", re: /\b(air quality|aqi)\b/i },
  { domain: "news", re: /\b(news|headline)\b/i },
  {
    domain: "stocks",
    re: /\b(stock|ticker|market|nasdaq|dow|s&p)\b/i,
  },
  { domain: "crypto", re: /\b(crypto|bitcoin|ethereum|btc|eth)\b/i },
  {
    domain: "forex",
    re: /\b(exchange rate|dollar to|euro to|currency|forex)\b/i,
  },
  {
    domain: "sports",
    re: /\b(sports?|score|game last night|next game|who they(?:'re| are) playing|who(?:'s| are they) playing|world cup|nfl|nba|mlb|nhl|hockey|football|soccer|basketball|baseball|f1|formula 1)\b/i,
  },
  { domain: "holidays", re: /\bholiday\b/i },
  {
    domain: "quakes",
    re: /\b(earthquake|quake).{0,24}\b(today|tonight|this week|latest|now)\b|\b(latest|today'?s|this week'?s) (earthquake|quake)/i,
  },
  { domain: "time", re: /\b(time in|what time is it)\b/i },
  { domain: "tv", re: /\b(tv show|tv series|movie times|what'?s playing)\b/i },
  { domain: "books", re: /\bisbn\b/i },
];

const LOOKUP =
  /\b(weather|forecast|rain|snow|temperature|umbrella|sunrise|sunset|air quality|aqi|news|headline|stock|ticker|market|nasdaq|dow|s&p|crypto|bitcoin|ethereum|btc|eth|sports?|score|game last night|next game|who they(?:'re| are) playing|who(?:'s| are they) playing|world cup|nfl|nba|mlb|nhl|hockey|football|soccer|basketball|baseball|f1|formula 1|flights?|airfare|traffic|commute|movie times|what'?s playing|tv show|tv series|exchange rate|dollar to|euro to|currency|forex|holiday|earthquake|quake|define|definition of|meaning of|capital of|population of|time in|what time is it|isbn|who wrote|author of)\b/i;

const DEPTH =
  /\b(why|how come|what happened|what caused|tell me more|more details?|in depth|in details?|detailed|explain|history of|brief history|overview of|should i|is it (a )?good|news about|behind (the |this )|analy[sz]e|compare|trade-?offs?|sentiment|fan reaction)\b/i;

const FOLLOW_UP =
  /^(and |also |what about |how about |more |give me (?:more|current)|current ones|can you (give|tell|add|look)|who(?:'s| are they|'re they)|details|the stats|sentiment|fans)\b/i;

export function isLookupAsk(text: string) {
  return LOOKUP.test(text);
}

export function wantsDeeperAsk(text: string) {
  return DEPTH.test(text) || pickReasoningEffort(text) !== "low";
}

/** Own-feed detector. Never sets tools or Keep. */
export function feedHints(text: string): FeedDomain | null {
  const t = text.trim();
  if (!t) return null;
  for (const row of FEED_HINTS) {
    if (row.re.test(t)) return row.domain;
  }
  return null;
}

export function isShortFollowUp(text: string) {
  const t = text.trim();
  if (!t || t.length > 200) return false;
  if (FOLLOW_UP.test(t)) return true;
  const words = t.split(/\s+/).length;
  return (
    words <= 16 &&
    /\b(they|them|the game|stats|details|more|fans|players|that|ones|current|closed|open)\b/i.test(
      t
    )
  );
}

export function routeText(userText: string, priorText?: string) {
  if (priorText?.trim() && isShortFollowUp(userText)) {
    return `${priorText.trim()}\n${userText.trim()}`;
  }
  return userText;
}

function messageText(content: unknown, kinds: string[]): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (!part || typeof part !== "object") return "";
      const row = part as { type?: string; text?: string };
      if (row.type && kinds.includes(row.type)) return row.text ?? "";
      return "";
    })
    .join(" ")
    .trim();
}

export function priorUserText(
  history: Array<{ role: string; content: unknown }>
): string {
  const texts: string[] = [];
  for (const message of history) {
    if (message.role !== "user") continue;
    const text = messageText(message.content, ["input_text", "text"]);
    if (text) texts.push(text);
  }
  if (texts.length < 2) return "";
  return texts[texts.length - 2];
}

/** Previous assistant turn, for classify “this” — not a second full-history call. */
export function priorAssistantText(
  history: Array<{ role: string; content: unknown }>
): string {
  for (let i = history.length - 1; i >= 0; i--) {
    const message = history[i];
    if (message.role !== "assistant") continue;
    const text = messageText(message.content, ["output_text", "text"]);
    if (text) return text;
  }
  return "";
}

/**
 * Last few turns, compact, so classify / fallback keep job+freshness when
 * they hop pipelines (Luna → Grok search) mid-thread.
 */
export function threadClip(
  history: Array<{ role: string; content: unknown }>,
  turns = 6
): string {
  const lines: string[] = [];
  for (const message of history) {
    if (message.role !== "user" && message.role !== "assistant") continue;
    const kinds =
      message.role === "user"
        ? ["input_text", "text"]
        : ["output_text", "text"];
    const text = messageText(message.content, kinds).replace(/\s+/g, " ");
    if (!text) continue;
    const tag = message.role === "user" ? "U" : "A";
    lines.push(`${tag}: ${text.slice(0, 220)}`);
  }
  return lines.slice(-turns).join("\n");
}

/** Never name tools. Models copy “web search is off” into the family answer. */
export function searchRuleLine(searchOn: boolean) {
  return searchOn
    ? "Use current public pages when the question needs them. Prefer 1 lookup. Cite only pages you actually opened. Never mention tools or routing."
    : "Answer from what you know and any live snapshot in this prompt. Never mention how you fetched this. If you lack a current listing, say you do not have today's schedule — do not invent one.";
}

/** Depth asks: nudge the model to surface quiz-worthy closed facts in the reply. */
export function harvestAnswerHint(userText: string) {
  if (!wantsDeeperAsk(userText) || isLookupAsk(userText)) return "";
  return [
    "Review-friendly facts: when you explain history, science, or how something works,",
    "weave in 2–4 stable closed facts (a year, a place, a name, a key term) spelled out in the answer.",
    "Spread kinds when natural (when / where / who / meaning). Do not pad or list trivia for its own sake.",
  ].join(" ");
}

/**
 * Keyword-only estimate for abuse claim before classify finishes.
 * Not Keep authority. Real stream route comes from planToRoute.
 */
export function resolveAskRoute(
  userText: string,
  hasFiles: boolean,
  options?: { priorText?: string }
): AskRoute {
  const text = routeText(userText, options?.priorText);
  const feed = feedHints(text);
  const lookup = isLookupAsk(text);
  const deeper = wantsDeeperAsk(text);

  if (hasFiles) {
    return {
      kind: "reason",
      tools: true,
      effort: "medium",
      maxToolCalls: 1,
      seedLive: Boolean(feed),
    };
  }

  if (feed && !deeper) {
    return {
      kind: "lookup",
      tools: false,
      effort: "none",
      maxToolCalls: 0,
      seedLive: true,
    };
  }

  if (feed || deeper || lookup) {
    return {
      kind: feed ? "lookup" : "reason",
      tools: !feed || deeper,
      effort: deeper ? "medium" : "low",
      maxToolCalls: deeper ? 2 : feed ? 0 : 1,
      seedLive: Boolean(feed),
    };
  }

  return {
    kind: "reason",
    tools: false,
    effort: "low",
    maxToolCalls: 0,
  };
}

/** Settings length is gone — short by default, medium when the ask is deep, searching, or a live feed. */
export function answerLengthForRoute(route: AskRoute): "short" | "medium" {
  if (route.effort === "medium" || route.effort === "high") return "medium";
  if (route.tools) return "medium";
  if (route.kind === "lookup") return "medium";
  return "short";
}

export async function liveLookupContext(
  userText: string,
  options?: { allowSearch?: boolean; geo?: HaloGeo | null }
): Promise<{
  systemExtra: string;
  sources: DisplaySource[];
}> {
  let live = { text: "", sources: [] as DisplaySource[] };
  try {
    live = await gatherLiveBriefs(userText, options?.geo);
  } catch {
    live = { text: "", sources: [] };
  }

  const names = live.sources.map((row) => row.label).join(", ");
  const searchOn = Boolean(options?.allowSearch);
  const systemExtra = [
    options?.geo ? localeLine(options.geo) : "",
    searchOn
      ? "You have a live snapshot from public feeds. Add current public pages if they asked why, context, sentiment, or news behind the numbers. Prefer the snapshot for prices, scores, weather, and headlines. Never mention tools."
      : "Use the live snapshot only. Never mention how you fetched this. If a number is not in the snapshot, say you could not fetch it.",
    searchOn
      ? "You may add a Sources section for pages you actually opened. Keep the live-feed names in the answer."
      : "Do not write a Sources section. One will be attached from the feeds that were actually fetched.",
    "Use the live data block for today's numbers. Do not invent figures that are not in it.",
    names
      ? `Name these feeds in the answer: ${names}.`
      : "No live feed matched. Ask which city, ticker, or league you mean.",
    "If a feed is missing, say you could not fetch it.",
    searchOn
      ? ""
      : "Write a useful family answer: lead with the number that answers the question, then 3–6 extra facts that are already in the live data (range, change, wind, UV, volume, opponent, record). Do not one-line it if the data has more. Do not pad with advice.",
    live.text ? `Live data:\n${live.text}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return { systemExtra, sources: live.sources };
}
