import { isLookupAsk } from "@/lib/ask-route";
import { isOpenRecall } from "@/lib/chip-recall";

export type HarvestPolicy = {
  /** V2 play sheet grades closed tokens only. */
  closedOnly: boolean;
  skipLookupAsks: boolean;
  skipEphemeralReplies: boolean;
  minDistractors: number;
  maxCardsPerTurn: number;
  minUserTextLength: number;
  minReplyLength: number;
};

export const V2_HARVEST_POLICY: HarvestPolicy = {
  closedOnly: true,
  /** Closed lookups (capital of, counts) are harvestable. Weather/news still skip. */
  skipLookupAsks: false,
  skipEphemeralReplies: true,
  minDistractors: 3,
  maxCardsPerTurn: 3,
  minUserTextLength: 8,
  minReplyLength: 40,
};

/** Live feeds — not worth long-term review. Closed facts are not in this list. */
const EPHEMERAL_ASK =
  /\b(weather|forecast|rain|snow|temperature|umbrella|sunrise|sunset|air quality|aqi|news|headline|stock|ticker|market|nasdaq|dow|s&p|crypto|bitcoin|ethereum|btc|eth|sport|score|game last night|world cup|nfl|nba|mlb|nhl|hockey|f1|formula 1|flights?|airfare|traffic|commute|movie times|what'?s playing|tv show|tv series|exchange rate|dollar to|euro to|currency|forex|holiday|earthquake|quake)\b/i;

/** Live feeds / lookups — reply is not worth long-term review. */
const EPHEMERAL_REPLY =
  /\b(\d{1,3}\s*°\s*[fc]|\d{1,3}\s+degrees?\s+f|high of \d|low of \d|forecast for|as of (today|this morning|market close)|closed (up|down)|\b(up|down)\s+\d+(\.\d+)?%|s&p 500|nasdaq|dow jones|currently trading at|final score|won \d+-\d+|lost \d+-\d+|game score|touchdown|home run|inning score|bitcoin is at|ethereum is at|btc\s*\$|eth\s*\$)\b/i;

export function isEphemeralAsk(text: string) {
  return EPHEMERAL_ASK.test(text);
}

export function isEphemeralReply(reply: string) {
  return EPHEMERAL_REPLY.test(reply);
}

export function shouldSkipHarvest(
  userText: string,
  reply: string,
  policy: HarvestPolicy = V2_HARVEST_POLICY
): boolean {
  if (policy.skipLookupAsks && isLookupAsk(userText)) return true;
  if (isEphemeralAsk(userText)) return true;
  if (userText.trim().length < policy.minUserTextLength) return true;
  const replyLen = reply.trim().length;
  if (replyLen < policy.minReplyLength) {
    // Lookup answers are often one sentence ("The capital of Maine is Augusta.").
    const closedLookup = isLookupAsk(userText) && !isEphemeralAsk(userText);
    if (!closedLookup || replyLen < 8) return true;
  }
  if (policy.skipEphemeralReplies && isEphemeralReply(reply)) return true;
  return false;
}

export function cardPassesPolicy(
  card: {
    recall?: string | null;
    token: string;
    answer: string;
    distractors: string[];
  },
  policy: HarvestPolicy = V2_HARVEST_POLICY
): boolean {
  if (policy.closedOnly && isOpenRecall(card)) return false;
  if (card.distractors.length < policy.minDistractors) return false;
  return true;
}
