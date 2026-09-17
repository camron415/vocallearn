import { isLookupAsk, wantsDeeperAsk } from "@/lib/ask-route";
import { isOpenRecall } from "@/lib/chip-recall";

export type HarvestPolicy = {
  /** V2 play sheet grades closed tokens only. */
  closedOnly: boolean;
  /** 1 = allow a single gist card; Home plays open as cloze / gist SAY. */
  maxOpen: 0 | 1;
  skipLookupAsks: boolean;
  skipEphemeralReplies: boolean;
  minDistractors: number;
  maxCardsPerTurn: number;
  minUserTextLength: number;
  minReplyLength: number;
};

export const V2_HARVEST_POLICY: HarvestPolicy = {
  closedOnly: true,
  maxOpen: 0,
  /** Closed lookups (capital of, counts) are harvestable. Weather/news still skip. */
  skipLookupAsks: false,
  skipEphemeralReplies: true,
  minDistractors: 3,
  maxCardsPerTurn: 3,
  /** Regex/timeout path only. Classify remember may harvest a short follow-up. */
  minUserTextLength: 8,
  minReplyLength: 40,
};

/** Live feeds — not worth long-term review. Closed facts are not in this list. */
const EPHEMERAL_ASK =
  /\b(weather|forecast|rain|snow|temperature|umbrella|sunrise|sunset|air quality|aqi|news|headline|stock|ticker|market|nasdaq|dow|s&p|crypto|bitcoin|ethereum|btc|eth|sports?|score|game last night|next game|world cup|nfl|nba|mlb|nhl|hockey|football|f1|formula 1|flights?|airfare|traffic|commute|movie times|what'?s playing|tv show|tv series|exchange rate|dollar to|euro to|currency|forex|holiday|earthquake|quake)\b/i;

/** Live feeds / lookups — reply is not worth long-term review. */
const EPHEMERAL_REPLY =
  /\b(\d{1,3}\s*°\s*[fc]|\d{1,3}\s+degrees?\s+f|high of \d|low of \d|forecast for|as of (today|this morning|market close)|closed (up|down)|\b(up|down)\s+\d+(\.\d+)?%|s&p 500|nasdaq|dow jones|currently trading at|final score|won \d+-\d+|lost \d+-\d+|game score|touchdown|home run|inning score|bitcoin is at|ethereum is at|btc\s*\$|eth\s*\$)\b/i;

/** Cooking / lists belong in Library (opt-in), not Keep. */
const RECIPE_OR_LIST_ASK =
  /\b(recipe for|\brecipe\b|cookbook|ingredients for|how (?:do i|to) (?:make|cook|bake)|meal idea|packing list|shopping list)\b/i;

/** Photo ID / product blend — not a study fact. */
const PHOTO_OR_PRODUCT_ASK =
  /\b(what (?:is|are) this|what (?:is|are) these|look at this|made of|material blend|this product|can i buy|should i buy)\b/i;

/** Kickoff / “what time is the event” — not a study fact. */
const EVENT_TIME_ASK =
  /\b(what time is|what time does|kickoff|launch event|when does (?:the )?(?:game|event|concert|show|kickoff)|when is the next (?:game|match)|events?(?: happening| going on)? (?:this|next) week)\b/i;

/** Opinions / fan sentiment — not a Keep fact. */
const OPINION_ASK =
  /\b(sentiment|fan reaction|what (?:do|are) (?:the )?(?:fans|players|people) think|how do (?:fans|people|players) feel)\b/i;

export function isEphemeralAsk(text: string) {
  return EPHEMERAL_ASK.test(text);
}

export function isEphemeralReply(reply: string) {
  return EPHEMERAL_REPLY.test(reply);
}

function isKeyboardish(token: string) {
  if (token.length < 6) return false;
  return /asdf|qwer|zxcv|qwerty|fjdk|sdfg|qazwsx/.test(token);
}

function isRealishWord(token: string) {
  if (token.length < 2) return false;
  if (!/[aeiouy]/i.test(token)) return false;
  if (/^(.)\1{3,}$/.test(token)) return false;
  if (isKeyboardish(token)) return false;
  const vowels = (token.match(/[aeiouy]/gi) || []).length;
  if (token.length >= 6 && vowels / token.length < 0.22) return false;
  return true;
}

/** Keyboard smash / character spam. Misspelled real asks ("golden ruel") stay. */
export function looksLikeGibberish(text: string) {
  const raw = text.trim();
  if (raw.length < 8) return false;
  const tokens = raw
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter(Boolean);
  const letters = raw.replace(/[^a-z]/gi, "");
  if (!tokens.length) return letters.length >= 8;
  const realish = tokens.filter(isRealishWord);
  if (realish.length >= 2) return false;
  if (realish.length === 1 && realish[0].length <= 12 && tokens.length <= 3) {
    return false;
  }
  if (letters.length < 8) return false;
  const vowels = (letters.match(/[aeiouy]/gi) || []).length;
  const vowelRatio = vowels / letters.length;
  const longest = tokens.reduce((max, token) => Math.max(max, token.length), 0);
  if (tokens.length <= 2 && longest >= 12 && vowelRatio < 0.28) return true;
  if (realish.length === 0 && letters.length >= 8) return true;
  if (/^(.)\1{7,}$/.test(letters)) return true;
  return false;
}

const TYPO_META =
  /\b((it|that|this) was a typo|sorry[,.]? (for the )?typo|i (meant|said) .{0,40}\btypo\b|autocorrect|misspelled)\b/i;

const BACKCHANNEL =
  /^(oh+|ah+|um+|uh+|lol|lmao|haha|heh|nice|cool|sweet|got it|makes sense|yeah|yep|yup|ok(ay)?( cool)?|thanks|thank you|wow|interesting|true|fair|same|idk)([.!,]*)$/i;

const GREETING_CHAT =
  /^(hi+|hello|hey|yo|sup|thanks|thank you|ok|okay|good (morning|afternoon|evening))[.!?]*$/i;

/** Acknowledgements, typo-corrections about their own message, empty chat. Fact asks stay. */
export function looksLikeChitChat(text: string) {
  const t = text.trim();
  if (!t) return true;
  if (looksLikeGibberish(t)) return true;
  if (GREETING_CHAT.test(t) || BACKCHANNEL.test(t)) return true;
  if (TYPO_META.test(t) && !/^(who|what|when|where|why|how|which)\b/i.test(t)) {
    return true;
  }
  if (
    /\b(my (message|typo|question)|the typo|what i (typed|meant to (type|say)))\b/i.test(
      t
    ) &&
    !/^(who|what|when|where|why|how|which)\b/i.test(t)
  ) {
    return true;
  }
  if (
    /^(i was )?just testing\b/i.test(t) ||
    /\bjust testing[.!]*$/i.test(t)
  ) {
    return true;
  }
  return false;
}

export function shouldSkipHarvest(
  userText: string,
  reply: string,
  policy: HarvestPolicy = V2_HARVEST_POLICY
): boolean {
  if (looksLikeGibberish(userText)) return true;
  if (looksLikeChitChat(userText)) return true;
  if (policy.skipLookupAsks && isLookupAsk(userText)) return true;
  if (isEphemeralAsk(userText) && !wantsDeeperAsk(userText)) return true;
  if (RECIPE_OR_LIST_ASK.test(userText)) return true;
  if (PHOTO_OR_PRODUCT_ASK.test(userText)) return true;
  if (EVENT_TIME_ASK.test(userText)) return true;
  if (OPINION_ASK.test(userText)) return true;
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

export type HarvestSkipReason = "intent_skip" | "policy_skip";

/**
 * Gate on the merged intent. Merge lets classify skip a regex Keep (live/chat)
 * and still blocks classify from forcing Keep on weather/recipe/smash.
 * Regex policy is the backstop when intent is missing (timeout / no classify).
 */
export function skipHarvestTurn(
  userText: string,
  reply: string,
  intent?: { harvest: boolean; job?: string } | null,
  policy: HarvestPolicy = V2_HARVEST_POLICY
): { skip: boolean; reason?: HarvestSkipReason } {
  if (looksLikeGibberish(userText) || looksLikeChitChat(userText)) {
    return { skip: true, reason: "policy_skip" };
  }
  if (intent) {
    if (!intent.harvest) {
      return { skip: true, reason: "intent_skip" };
    }
    if (harvestQualitySkip(userText, reply, policy)) {
      return { skip: true, reason: "policy_skip" };
    }
    return { skip: false };
  }
  if (shouldSkipHarvest(userText, reply, policy)) {
    return { skip: true, reason: "policy_skip" };
  }
  return { skip: false };
}

function harvestQualitySkip(
  userText: string,
  reply: string,
  policy: HarvestPolicy
): boolean {
  if (isEphemeralAsk(userText) && !wantsDeeperAsk(userText)) return true;
  if (OPINION_ASK.test(userText)) return true;
  if (RECIPE_OR_LIST_ASK.test(userText)) return true;
  if (PHOTO_OR_PRODUCT_ASK.test(userText)) return true;
  const replyLen = reply.trim().length;
  if (replyLen < policy.minReplyLength) {
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
  if (isOpenRecall(card)) {
    if (policy.closedOnly || policy.maxOpen < 1) return false;
    return true;
  }
  if (card.distractors.length < policy.minDistractors) return false;
  return true;
}
