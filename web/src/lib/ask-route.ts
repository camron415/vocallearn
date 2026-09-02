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

const LOOKUP =
  /\b(weather|forecast|rain|snow|temperature|umbrella|sunrise|sunset|air quality|aqi|news|headline|stock|ticker|market|nasdaq|dow|s&p|crypto|bitcoin|ethereum|btc|eth|sport|score|game last night|world cup|nfl|nba|mlb|nhl|hockey|f1|formula 1|flights?|airfare|traffic|commute|movie times|what'?s playing|tv show|tv series|exchange rate|dollar to|euro to|currency|forex|holiday|earthquake|quake|define|definition of|meaning of|capital of|population of|time in|what time is it|isbn|who wrote|author of)\b/i;

const DEPTH =
  /\b(why|how come|what happened|what caused|tell me more|more detail|in depth|in detail|detailed|explain|should i|is it (a )?good|news about|behind (the |this )|analy[sz]e|compare|trade-?offs?)\b/i;

export function isLookupAsk(text: string) {
  return LOOKUP.test(text);
}

export function wantsDeeperAsk(text: string) {
  return DEPTH.test(text) || pickReasoningEffort(text) !== "low";
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

export function resolveAskRoute(
  userText: string,
  hasFiles: boolean
): AskRoute {
  const lookup = isLookupAsk(userText);
  const deeper = wantsDeeperAsk(userText);

  if (lookup && !deeper) {
    return {
      kind: "lookup",
      tools: false,
      effort: "none",
      maxToolCalls: 0,
    };
  }

  if (hasFiles || lookup || deeper) {
    return {
      kind: "reason",
      tools: true,
      effort: deeper ? "medium" : "low",
      maxToolCalls: deeper ? 2 : 1,
      seedLive: lookup,
    };
  }

  return {
    kind: "reason",
    tools: true,
    effort: "low",
    maxToolCalls: 1,
  };
}

/** Settings length is gone — short by default, medium when the ask is deep. */
export function answerLengthForRoute(route: AskRoute): "short" | "medium" {
  if (route.effort === "medium" || route.effort === "high") return "medium";
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
      ? "You have a live snapshot from public feeds. Search the web if the user asked why, context, or news behind the numbers. Prefer the snapshot for prices, scores, weather, and headlines."
      : "Web search is off for this turn. Do not claim you searched the web.",
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
      : "Write a useful family answer: lead with the number that answers the question, then 3–6 extra facts that are already in the live data (range, change, wind, UV, volume, and so on). Do not one-line it if the data has more. Do not pad with advice.",
    live.text ? `Live data:\n${live.text}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return { systemExtra, sources: live.sources };
}
