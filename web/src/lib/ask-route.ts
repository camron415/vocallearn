import { FAST_MODEL, pickReasoningEffort, type ReasoningEffort } from "@/lib/grok";
import { gatherLiveBriefs } from "@/lib/live-lookups";
import type { DisplaySource } from "@/lib/markdown-plain";

export type AskRoute = {
  kind: "lookup" | "reason";
  model?: string;
  tools: boolean;
  effort: ReasoningEffort;
  /** Fetch free feeds even when 4.3 + search will run (why / more / explain). */
  seedLive?: boolean;
};

const LOOKUP =
  /\b(weather|forecast|rain|snow|temperature|umbrella|sunrise|sunset|air quality|aqi|news|headline|stock|ticker|market|nasdaq|dow|s&p|crypto|bitcoin|ethereum|btc|eth|sport|score|game last night|world cup|nfl|nba|mlb|nhl|hockey|f1|formula 1|flight|airfare|traffic|commute|movie times|what'?s playing|tv show|tv series|exchange rate|dollar to|euro to|currency|forex|holiday|earthquake|quake|define|definition of|meaning of|capital of|population of|time in|what time is it|isbn|who wrote|author of)\b/i;

const DEPTH =
  /\b(why|how come|what happened|what caused|tell me more|more detail|in depth|in detail|detailed|explain|should i|is it (a )?good|news about|behind (the |this )|analy[sz]e|compare|trade-?offs?)\b/i;

export function isLookupAsk(text: string) {
  return LOOKUP.test(text);
}

export function wantsDeeperAsk(text: string) {
  return DEPTH.test(text) || pickReasoningEffort(text) !== "none";
}

export function resolveAskRoute(
  userText: string,
  hasFiles: boolean
): AskRoute {
  const effort = pickReasoningEffort(userText);
  if (hasFiles) {
    return { kind: "reason", tools: true, effort };
  }

  const lookup = isLookupAsk(userText);
  const deeper = wantsDeeperAsk(userText);

  if (lookup && !deeper) {
    return {
      kind: "lookup",
      model: FAST_MODEL,
      tools: false,
      effort: "none",
    };
  }

  return {
    kind: "reason",
    tools: true,
    effort,
    seedLive: lookup,
  };
}

export async function liveLookupContext(
  userText: string,
  options?: { allowSearch?: boolean }
): Promise<{
  systemExtra: string;
  sources: DisplaySource[];
}> {
  let live = { text: "", sources: [] as DisplaySource[] };
  try {
    live = await gatherLiveBriefs(userText);
  } catch {
    live = { text: "", sources: [] };
  }

  const names = live.sources.map((row) => row.label).join(", ");
  const searchOn = Boolean(options?.allowSearch);
  const systemExtra = [
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
