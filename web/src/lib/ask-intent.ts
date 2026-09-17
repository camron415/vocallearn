import {
  feedHints,
  isLookupAsk,
  wantsDeeperAsk,
  isShortFollowUp,
  type FeedDomain,
} from "@/lib/ask-route";
import { callGrokChat } from "@/lib/grok";
import { isEphemeralAsk, looksLikeGibberish, looksLikeChitChat } from "@/lib/harvest-policy";

export type AnswerMode = "direct" | "teach_light" | "practical";

/** User job. Code maps this to Keep. Not a skip-excuse string. */
export type AskJob =
  | "remember"
  | "live"
  | "kitchen"
  | "chat"
  | "opinion"
  | "other";

/** job ⟂ freshness. harvest = f(job). search = f(freshness). */
export type AskFreshness = "weights" | "feeds" | "web";
export type PlanSource = "model" | "timeout" | "fastpath";
/** What the main Keep chip must be. Null if unsure or not remember. */
export type AskKind = "when" | "where" | "who" | "number" | "meaning" | null;
export type AnswerDepth = "brief" | "standard" | "long";

export type AskIntent = {
  job: AskJob;
  harvest: boolean;
  harvestWhy: string;
  answerMode: AnswerMode;
  primaryAsk: string;
  topicKey: string | null;
  maxChips: number;
  primaryRecall: "closed" | "open";
  maxOpen: 0 | 1;
  /** Library pill only. Never Keep. Null unless this turn is cooking. */
  saveOffer: "recipe" | null;
  freshness: AskFreshness;
  feedDomain: FeedDomain | null;
  planSource: PlanSource;
  askKind: AskKind;
  answerDepth: AnswerDepth;
};

export type ClassifyOptions = {
  hasFiles?: boolean;
  priorText?: string;
  /** Last assistant reply (compact). Helps “this” resolve. Not the whole thread. */
  priorReply?: string;
  /** Last few U/A lines so follow-ups keep job+freshness across Luna/Grok hops. */
  threadClip?: string;
};

const ASK_JOBS: ReadonlySet<string> = new Set([
  "remember",
  "live",
  "kitchen",
  "chat",
  "opinion",
  "other",
]);

const CLASSIFY_MS = 2500;
/** Wait this long for classify before streaming with the timeout fallback guide. */
export const CLASSIFY_ANSWER_MS = 900;

const FRESHNESS_SET: ReadonlySet<string> = new Set(["weights", "feeds", "web"]);
const ASK_KIND_SET: ReadonlySet<string> = new Set([
  "when",
  "where",
  "who",
  "number",
  "meaning",
]);

const CLASSIFIER = `You classify one family Ask turn. Return ONLY JSON.
Schema:
{"job":"remember"|"live"|"kitchen"|"chat"|"opinion"|"other","freshness":"weights"|"feeds"|"web","feedDomain":"weather"|"news"|"stocks"|"crypto"|"forex"|"sports"|"holidays"|"quakes"|"airquality"|"time"|"tv"|"books"|null,"askKind":"when"|"where"|"who"|"number"|"meaning"|null,"answerMode":"direct"|"teach_light"|"practical","primaryAsk":"what they need in one line","topicKey":"slug-or-null","maxChips":0,"primaryRecall":"closed"|"open","maxOpen":0,"saveOffer":null}

job and freshness are independent. harvest is remember only. search is web only.
- kitchen — cookable recipe / how to make this dish. saveOffer "recipe". freshness weights unless they asked to look up a specific modern recipe (then web). Not Keep.
- remember — they want to learn a stable fact (definition, capital, who/when/why/how, history, science, math, a plant/painting/map/diagram). Brief history / summary of events is remember. Typos inside a real fact question stay remember. freshness weights unless last year's number would now be false (then web). Keep.
- live — now-shaped: weather, scores, news, stocks, schedules, hours, listings, local recs, museums/restaurants that can close. Not Keep. freshness feeds if we have a snapshot machine (weather, ESPN, markets). freshness web if the listing/hours/open-now can go stale and we do not have a feed.
- chat — greeting, thanks, acknowledgements, smash, testing, talk about their own typo. Not Keep. freshness weights.
- opinion — fan sentiment, should I. Not Keep. freshness web if they want current sentiment, else weights.
- other — unsure. Never use other to skip a real fact ask.

If an answer from last year could now be false — listings, hours, prices, counts that move, schedules, "current ones", still open — freshness is web (or feeds when a feed exists).
A file is evidence. Do not pick live/kitchen/chat/opinion just because HAS_FILE is yes.
Follow-ups: read PRIOR, LAST, and THREAD. USER may be short ("give me current ones", "this one is closed", "who created this"). Keep the same job unless they clearly changed topic. LAST is the previous answer — “this” is that topic, not a photo.

answerMode:
- practical — only for live, kitchen, chat, opinion
- direct — closed remember (capital, name, date, definition). maxChips 2–3, maxOpen 0
- teach_light — how/why/explain/history remember. maxChips 2–3, maxOpen 1

saveOffer is "recipe" only when job is kitchen. Otherwise null.
feedDomain is set only when freshness is feeds.
askKind is only for remember. It is the MAIN chip: when=date/year, where=place, who=person, number=count, meaning=definition/how-why gist. Null if the ask is two topics at once or you are unsure. Never guess the answer itself.`;

function foldKey(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function clampChips(n: number, harvest: boolean, mode: AnswerMode) {
  if (!harvest) return 0;
  const fallback = mode === "direct" ? 2 : 3;
  return Math.max(2, Math.min(3, Math.round(n) || fallback));
}

function clampOpen(n: number, harvest: boolean, mode: AnswerMode): 0 | 1 {
  if (!harvest || mode === "direct" || mode === "practical") return 0;
  return n >= 1 ? 1 : 0;
}

export function parseAskIntent(
  raw: string,
  userText: string,
  options?: ClassifyOptions
): AskIntent | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const row = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    const job = parseJob(row);
    const harvestFlag = row.harvest === true;
    const modeRaw = String(row.answerMode ?? "");
    const answerMode: AnswerMode =
      modeRaw === "direct" || modeRaw === "teach_light" || modeRaw === "practical"
        ? modeRaw
        : job === "remember" || harvestFlag
          ? "teach_light"
          : "practical";
    const primaryAsk =
      String(row.primaryAsk ?? "").trim().slice(0, 240) ||
      userText.trim().slice(0, 240);
    const topic =
      row.topicKey == null || row.topicKey === ""
        ? foldKey(primaryAsk) || null
        : foldKey(String(row.topicKey));
    const wantsOpen = String(row.primaryRecall ?? "") === "open";
    const harvest = job === "remember";
    const freshness = parseFreshness(row, job);
    const feedDomain = parseFeedDomain(row, freshness);
    const proposed: AskIntent = {
      job,
      harvest,
      harvestWhy: job,
      answerMode,
      primaryAsk,
      topicKey: topic,
      maxChips: Number(row.maxChips ?? 0),
      primaryRecall: wantsOpen ? "open" : "closed",
      maxOpen: wantsOpen ? 1 : 0,
      saveOffer: job === "kitchen" ? "recipe" : null,
      freshness,
      feedDomain,
      planSource: "model",
      askKind: parseAskKind(row, job),
      answerDepth: "standard",
    };
    return mergeAskIntent(proposed, fallbackAskIntent(userText, options), {
      userText,
      priorText: options?.priorText,
    });
  } catch {
    return null;
  }
}

function parseJob(row: Record<string, unknown>): AskJob {
  const job = String(row.job ?? "");
  if (ASK_JOBS.has(job)) return job as AskJob;
  return row.harvest === true ? "remember" : "other";
}

function parseFreshness(row: Record<string, unknown>, job: AskJob): AskFreshness {
  const raw = String(row.freshness ?? "");
  if (FRESHNESS_SET.has(raw)) return raw as AskFreshness;
  if (job === "live") return "web";
  return "weights";
}

function parseFeedDomain(
  row: Record<string, unknown>,
  freshness: AskFreshness
): FeedDomain | null {
  const raw = String(row.feedDomain ?? "");
  const hint = feedHints(raw);
  if (freshness !== "feeds") return null;
  if (hint) return hint;
  const known: FeedDomain[] = [
    "weather",
    "news",
    "stocks",
    "crypto",
    "forex",
    "sports",
    "holidays",
    "quakes",
    "airquality",
    "time",
    "tv",
    "books",
  ];
  return known.includes(raw as FeedDomain) ? (raw as FeedDomain) : null;
}

function parseAskKind(row: Record<string, unknown>, job: AskJob): AskKind {
  if (job !== "remember") return null;
  const raw = String(row.askKind ?? "");
  if (raw === "null" || raw === "") return null;
  if (ASK_KIND_SET.has(raw)) return raw as Exclude<AskKind, null>;
  return null;
}

/** Shape of the main chip — never the answer text. Compound remember asks stay null. */
export function deriveAskKind(text: string): AskKind {
  const t = text.trim();
  if (!t) return null;
  if (/\b(?:history|overview) of\b[\s\S]{0,80}\band\b/i.test(t)) return null;
  if (/\bcapital of\b/i.test(t) || /^where\b/i.test(t)) return "where";
  if (
    /^who\b/i.test(t) ||
    /\bwho (wrote|invented|founded|created|painted|discovered)\b/i.test(t)
  ) {
    return "who";
  }
  if (
    /^when\b/i.test(t) ||
    /\bwhen (was|did|is|were)\b/i.test(t) ||
    /\bwhat year\b/i.test(t) ||
    /\bwhat date\b/i.test(t)
  ) {
    return "when";
  }
  if (/\b(how many|population of|how much|how long)\b/i.test(t)) return "number";
  if (
    /^(why|how)\b/i.test(t) ||
    /\b(history of|brief history|explain|define|definition of)\b/i.test(t) ||
    /^(what (is|are|was|were)|tell me about)\b/i.test(t)
  ) {
    return "meaning";
  }
  return null;
}

export function deriveAnswerDepth(
  plan: Pick<AskIntent, "job" | "harvest" | "answerMode">,
  userText: string,
  options?: ClassifyOptions
): AnswerDepth {
  if (plan.job === "chat" || looksLikeChitChat(userText) || looksLikeGibberish(userText)) {
    return "brief";
  }
  if (!plan.harvest || plan.answerMode === "practical") return "standard";
  if (plan.answerMode === "direct") return "brief";
  const longCue =
    /\b(in depth|in details?|detailed|tell me more|walk me through|deep dive|brief history|history of)\b/i;
  if (longCue.test(userText) || userText.trim().length > 520) return "long";
  const prior = options?.priorText?.trim() ?? "";
  if (prior && isShortFollowUp(userText) && isHarvestFollowUp(userText)) {
    return "long";
  }
  return "standard";
}

function sealPlan(
  plan: AskIntent,
  userText: string,
  options?: ClassifyOptions
): AskIntent {
  const askKind = plan.harvest
    ? plan.askKind ?? deriveAskKind(userText || plan.primaryAsk)
    : null;
  return clampFreshness({
    ...plan,
    askKind,
    answerDepth: deriveAnswerDepth(plan, userText || plan.primaryAsk, options),
  });
}

function clampFreshness(plan: AskIntent): AskIntent {
  if (plan.feedDomain && plan.freshness !== "feeds") {
    return { ...plan, freshness: "feeds" };
  }
  if (plan.freshness === "feeds" && !plan.feedDomain) {
    return { ...plan, freshness: "web", feedDomain: null };
  }
  return plan;
}

/**
 * Classify owns job + freshness. Regex only hard-skips smash/chat.
 * remember wins Keep. live/kitchen/chat/opinion win no Keep.
 * fallback does not veto remember via !fallback.harvest.
 */
export function mergeAskIntent(
  proposed: AskIntent,
  fallback: AskIntent,
  follow?: { userText?: string; priorText?: string }
): AskIntent {
  const current = follow?.userText || fallback.primaryAsk;
  const resolvedAsk = harvestAskText(current, follow?.priorText).slice(0, 240);
  const followAsk =
    follow?.priorText &&
    follow.userText &&
    isHarvestFollowUp(follow.userText)
      ? resolvedAsk
      : "";

  if (looksLikeGibberish(current) || looksLikeChitChat(current)) {
    return sealPlan(
      {
        ...fallback,
        job: "chat",
        harvest: false,
        harvestWhy: looksLikeGibberish(current) ? "gibberish" : "chat",
        answerMode: "practical",
        maxChips: 0,
        maxOpen: 0,
        saveOffer: null,
        freshness: "weights",
        feedDomain: null,
        askKind: null,
      },
      current,
      follow
    );
  }

  if (
    proposed.job === "remember" &&
    fallback.job === "live" &&
    (isEphemeralAsk(current) || isEphemeralAsk(fallback.primaryAsk))
  ) {
    return sealPlan(
      {
        ...fallback,
        harvest: false,
        askKind: null,
        planSource: proposed.planSource,
      },
      current,
      follow
    );
  }

  if (proposed.job === "remember" && regexSkipOwnsJob(current)) {
    return sealPlan(
      {
        ...fallback,
        harvest: false,
        askKind: null,
        planSource: proposed.planSource,
      },
      current,
      follow
    );
  }

  if (proposed.job === "other") {
    const primaryAsk = followAsk || fallback.primaryAsk;
    return sealPlan(
      {
        ...fallback,
        primaryAsk,
        topicKey: foldKey(primaryAsk) || fallback.topicKey,
      },
      current,
      follow
    );
  }

  if (proposed.job !== "remember") {
    const primaryAsk = (followAsk || proposed.primaryAsk || fallback.primaryAsk).slice(
      0,
      240
    );
    return sealPlan(
      {
        job: proposed.job,
        harvest: false,
        harvestWhy: proposed.job,
        answerMode: "practical",
        primaryAsk,
        topicKey: foldKey(primaryAsk) || fallback.topicKey,
        maxChips: 0,
        primaryRecall: "closed",
        maxOpen: 0,
        saveOffer: proposed.job === "kitchen" ? "recipe" : null,
        freshness: proposed.freshness,
        feedDomain: proposed.feedDomain,
        planSource: proposed.planSource,
        askKind: null,
        answerDepth: "standard",
      },
      current,
      follow
    );
  }

  const mode: AnswerMode =
    proposed.answerMode === "direct" || proposed.answerMode === "teach_light"
      ? proposed.answerMode
      : fallback.answerMode === "practical"
        ? "direct"
        : fallback.answerMode;
  const harvest = true;
  const maxOpen = clampOpen(
    proposed.maxOpen || (mode === "teach_light" ? 1 : 0),
    harvest,
    mode
  );
  const primaryAsk = followAsk || fallback.primaryAsk || proposed.primaryAsk;
  return sealPlan(
    {
      job: "remember",
      harvest,
      harvestWhy: fallback.harvestWhy === "chat" ? "remember" : fallback.harvestWhy,
      answerMode: mode,
      primaryAsk,
      topicKey: foldKey(primaryAsk) || fallback.topicKey,
      maxChips: clampChips(
        proposed.maxChips || fallback.maxChips,
        harvest,
        mode
      ),
      primaryRecall: maxOpen ? "open" : "closed",
      maxOpen,
      saveOffer: null,
      freshness: proposed.freshness === "feeds" ? "weights" : proposed.freshness,
      feedDomain: null,
      planSource: proposed.planSource,
      askKind: proposed.askKind ?? fallback.askKind ?? null,
      answerDepth: "standard",
    },
    current,
    follow
  );
}

const PRACTICAL_ASK =
  /\b(made of|material blend|what (is|are) these|what is this|look at this|can i buy|should i buy|this product)\b/i;
const ADVICE_ASK =
  /\b(what to eat|dinner for tonight|sleep better|easy pasta|simple dinner|what'?s for dinner)\b/i;
const EVENT_ASK =
  /\b(what time is|what time does|when does (?:the )?(?:game|event|concert|show|kickoff)|kickoff|launch event|events?(?: happening| going on)? (?:this|next) week)\b/i;
const RECIPE_ASK =
  /\b(recipe for|\brecipe\b|cookbook|ingredients for|how (?:do i|to) (?:make|cook|bake)|meal idea)\b/i;
const LIST_ASK = /\b(packing list|shopping list)\b/i;
const GREETING_ASK =
  /^(hi+|hello|hey|yo|sup|thanks|thank you|ok|okay|good (morning|afternoon|evening))[.!?]*$/i;
const OPINION_ASK =
  /\b(sentiment|fan reaction|what (?:do|are) (?:the )?(?:fans|players|people) think|how do (?:fans|people|players) feel)\b/i;
const CAPITAL_ASK = /\bcapital of\b/i;
const CLOSED_LOOKUP =
  /\b(population of|boiling point|largest city|how many|when was|who (wrote|invented|founded)|what is usually named|longest river|name of the)\b/i;

/** Recipe / product / opinion skips still win over a classify-remember miss. */
function regexSkipOwnsJob(text: string) {
  return (
    PRACTICAL_ASK.test(text) ||
    RECIPE_ASK.test(text) ||
    LIST_ASK.test(text) ||
    OPINION_ASK.test(text)
  );
}

/**
 * Compact follow-up: last ask + this ask. Does not rewrite earlier Keep chips.
 * Standalone capitals / weather / recipes stay themselves.
 */
export function isHarvestFollowUp(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 160) return false;
  if (looksLikeGibberish(t) || looksLikeChitChat(t)) return false;
  if (isShortFollowUp(t)) return true;
  const words = t.split(/\s+/).length;
  if (words > 10) return false;
  if (
    isEphemeralAsk(t) ||
    RECIPE_ASK.test(t) ||
    PRACTICAL_ASK.test(t) ||
    CAPITAL_ASK.test(t) ||
    EVENT_ASK.test(t) ||
    OPINION_ASK.test(t) ||
    ADVICE_ASK.test(t)
  ) {
    return false;
  }
  if (/\b(this|that|it|they|them|these|those)\b/i.test(t)) return true;
  return words <= 4 && /^(who|what|when|where|why|how)\b/i.test(t);
}

export function harvestAskText(userText: string, priorText?: string): string {
  const current = userText.trim();
  const prior = (priorText ?? "").trim();
  if (!prior || !isHarvestFollowUp(current)) return current;
  return `${prior}\n${current}`.slice(0, 480);
}

function blankIntent(
  harvest: boolean,
  harvestWhy: string,
  answerMode: AnswerMode,
  primaryAsk: string,
  maxChips: number,
  maxOpen: 0 | 1,
  saveOffer: "recipe" | null = null,
  job: AskJob = harvest ? "remember" : "other",
  extras?: Partial<
    Pick<AskIntent, "freshness" | "feedDomain" | "planSource" | "askKind" | "answerDepth">
  >
): AskIntent {
  const feed = extras?.feedDomain ?? null;
  const freshness: AskFreshness =
    extras?.freshness ??
    (feed ? "feeds" : job === "live" ? "web" : "weights");
  return sealPlan(
    {
      job,
      harvest,
      harvestWhy,
      answerMode,
      primaryAsk,
      topicKey: foldKey(primaryAsk) || null,
      maxChips,
      primaryRecall: maxOpen ? "open" : "closed",
      maxOpen,
      saveOffer,
      freshness: feed ? "feeds" : freshness,
      feedDomain: feed,
      planSource: extras?.planSource ?? "timeout",
      askKind: extras?.askKind ?? (harvest ? deriveAskKind(primaryAsk) : null),
      answerDepth: extras?.answerDepth ?? "standard",
    },
    primaryAsk
  );
}

function looksLikeRememberAsk(text: string) {
  const t = text.trim();
  if (!t || looksLikeChitChat(t)) return false;
  if (feedHints(t)) return false;
  if (BEST_IN_PLACE.test(t)) return false;
  if (wantsDeeperAsk(t)) return true;
  if (CAPITAL_ASK.test(t) || CLOSED_LOOKUP.test(t)) return true;
  if (isLookupAsk(t) && !isEphemeralAsk(t)) return true;
  if (/^(tell me about|teach me|remind me)\b/i.test(t)) return true;
  if (/\b(?:give me|tell me) (?:a |an )?(?:brief |short )?(?:history|overview) of\b/i.test(t)) {
    return true;
  }
  if (/\b(?:history of|brief history)\b/i.test(t)) return true;
  if (/^(who|what|when|where|why|how|which)\b/i.test(t) && t.length >= 10) {
    return true;
  }
  return false;
}

/** Shape only — not a cuisine list. Timeout path for best-X-in-Y listings. */
const BEST_IN_PLACE =
  /\b(?:best|top|recommend(?:ed)?)\b[\s\S]{0,56}\b(?:in|near|around)\b/i;
const NEXT_GAME = /\b(?:next|upcoming) (?:\w+ ){0,3}(?:game|match)\b/i;

export function fallbackAskIntent(
  userText: string,
  options?: ClassifyOptions
): AskIntent {
  const current = userText.trim();
  const extras: Partial<Pick<AskIntent, "planSource">> = {
    planSource: options?.threadClip ? "timeout" : "timeout",
  };
  if (looksLikeGibberish(current) || looksLikeChitChat(current)) {
    return blankIntent(
      false,
      looksLikeGibberish(current) ? "gibberish" : "chat",
      "practical",
      current.slice(0, 240),
      0,
      0,
      null,
      "chat",
      { ...extras, freshness: "weights", feedDomain: null }
    );
  }
  if (
    options?.priorText?.trim() &&
    isShortFollowUp(current) &&
    !looksLikeChitChat(current) &&
    !OPINION_ASK.test(current) &&
    !RECIPE_ASK.test(current) &&
    !GREETING_ASK.test(current)
  ) {
    const priorPlan = fallbackAskIntent(options.priorText);
    const glue = harvestAskText(current, options.priorText).slice(0, 240);
    const bumpWeb =
      /\b(current|closed|open|latest|still)\b/i.test(current) &&
      priorPlan.job === "live";
    return sealPlan(
      {
        ...priorPlan,
        primaryAsk: glue || priorPlan.primaryAsk,
        topicKey: foldKey(glue) || priorPlan.topicKey,
        freshness: bumpWeb ? "web" : priorPlan.freshness,
        feedDomain: bumpWeb ? null : priorPlan.feedDomain,
        planSource: "timeout",
        askKind:
          deriveAskKind(current) ??
          deriveAskKind(glue) ??
          priorPlan.askKind,
      },
      glue || current,
      options
    );
  }
  const resolved = harvestAskText(current, options?.priorText);
  const primaryAsk = resolved.slice(0, 240) || "the user's question";
  const deeper =
    wantsDeeperAsk(resolved) ||
    wantsDeeperAsk(current) ||
    /\bhow (does|do|is|are|can|would)\b/i.test(resolved);
  const feed = feedHints(resolved) || feedHints(current);
  const ephemeral = isEphemeralAsk(current) || Boolean(feed);
  const recipeAsk = RECIPE_ASK.test(current);
  if (GREETING_ASK.test(current)) {
    return blankIntent(false, "greeting", "practical", current.slice(0, 240), 0, 0, null, "chat", {
      freshness: "weights",
    });
  }
  const practical =
    PRACTICAL_ASK.test(current) ||
    ADVICE_ASK.test(current) ||
    recipeAsk ||
    LIST_ASK.test(current) ||
    OPINION_ASK.test(current);

  if (practical || EVENT_ASK.test(current) || NEXT_GAME.test(current)) {
    const job: AskJob = recipeAsk || LIST_ASK.test(current)
      ? "kitchen"
      : OPINION_ASK.test(current)
        ? "opinion"
        : EVENT_ASK.test(current) || NEXT_GAME.test(current)
          ? "live"
          : "other";
    const liveFeed = job === "live" ? feed || feedHints(current) : null;
    return blankIntent(
      false,
      "practical, advice, photo ID, recipe, list, event time, or opinion",
      "practical",
      current.slice(0, 240) || primaryAsk,
      0,
      0,
      recipeAsk ? "recipe" : null,
      job,
      {
        freshness:
          job === "kitchen"
            ? /\b(look(?: it)? up|viral|20\d{2})\b/i.test(current)
              ? "web"
              : "weights"
            : job === "opinion"
              ? "web"
              : liveFeed
                ? "feeds"
                : "web",
        feedDomain: liveFeed,
      }
    );
  }

  if ((ephemeral || feed) && !deeper) {
    return blankIntent(
      false,
      "transient live lookup",
      "practical",
      current.slice(0, 240) || primaryAsk,
      0,
      0,
      null,
      "live",
      { freshness: feed ? "feeds" : "web", feedDomain: feed }
    );
  }

  if (BEST_IN_PLACE.test(current) || BEST_IN_PLACE.test(resolved)) {
    return blankIntent(
      false,
      "local listing",
      "practical",
      current.slice(0, 240) || primaryAsk,
      0,
      0,
      null,
      "live",
      { freshness: "web", feedDomain: null }
    );
  }

  if (
    CAPITAL_ASK.test(resolved) ||
    (isLookupAsk(resolved) && !deeper && !feed) ||
    CLOSED_LOOKUP.test(resolved)
  ) {
    return blankIntent(true, "closed lookup", "direct", primaryAsk, 2, 0, null, "remember", {
      freshness: "weights",
    });
  }

  if (deeper && feed) {
    return blankIntent(
      false,
      "live plus why",
      "practical",
      current.slice(0, 240) || primaryAsk,
      0,
      0,
      null,
      "live",
      { freshness: "feeds", feedDomain: feed }
    );
  }

  if (deeper) {
    return blankIntent(true, "how/why/explain", "teach_light", primaryAsk, 3, 1, null, "remember", {
      freshness: "weights",
    });
  }

  if (looksLikeRememberAsk(resolved) || looksLikeRememberAsk(current)) {
    return blankIntent(true, "stable fact ask", "direct", primaryAsk, 2, 0, null, "remember", {
      freshness: "weights",
    });
  }

  const words = current.split(/\s+/).filter(Boolean).length;
  if (words >= 4 && current.length >= 8) {
    return blankIntent(true, "timeout remember", "teach_light", primaryAsk, 3, 1, null, "remember", {
      freshness: "weights",
    });
  }

  return blankIntent(false, "chat", "practical", current.slice(0, 240), 0, 0, null, "chat", {
    freshness: "weights",
  });
}

export function intentAnswerGuide(intent: AskIntent): string {
  if (intent.saveOffer === "recipe") {
    return [
      "This turn is a cookable kitchen card, not a review fact.",
      "Start with **Dish name** on its own line.",
      "Then a **Ingredients** heading and bullets with amounts (cups, tsp, grams).",
      "Then a **Steps** heading and 6–12 numbered actions.",
      "Do not write “you'll need”, a lesson, or a Sources section.",
    ].join(" ");
  }
  if (!intent.harvest || intent.answerMode === "practical") {
    if (
      intent.job === "chat" ||
      /greeting|chat|gibberish/i.test(intent.harvestWhy)
    ) {
      return "Greet them back in one or two warm sentences. Do not teach, quiz, or mention how you fetched this.";
    }
    return [
      "This turn is not for review. Answer directly and accurately.",
      "Write a complete useful answer — a short paragraph or 4–8 bullets. Lead with the number they asked for. Do not one-line it.",
      "Do not add a lesson, quiz facts, or extra trivia for studying.",
      "Never mention how you fetched this.",
    ].join(" ");
  }
  const kindLine =
    intent.askKind === "when"
      ? "The first sentence must contain the date or year they asked for, spelled as a complete token (1863, July 1–3 1863), not only a place."
      : intent.askKind === "where"
        ? "The first sentence must contain the place name they asked for, spelled as a complete token."
        : intent.askKind === "who"
          ? "The first sentence must contain the person or people they asked for, spelled as a complete name."
          : intent.askKind === "number"
            ? "The first sentence must contain the number they asked for, digits visible."
            : intent.askKind === "meaning"
              ? "The first sentence must answer what/why/how they asked, as a complete thought."
              : "Lead with the answer to their question in the first sentence.";
  if (intent.answerMode === "direct") {
    return [
      kindLine,
      "Spell that answer as a clear token.",
      "Then add one or two supporting pegs in the prose (a who, when, where, or key term) so they can sit as side chips after the main fact.",
      intent.answerDepth === "brief"
        ? "Keep it to 2–4 sentences. Do not pad trivia or run a tutor quiz."
        : "Keep it tight. Do not pad trivia or run a tutor quiz.",
    ].join(" ");
  }
  const depthLine =
    intent.answerDepth === "long"
      ? "After the opening gist you may write a longer explanation with headings if it helps."
      : "A little more explanation is OK — teach clearly, do not run a tutor quiz or withhold the answer.";
  return [
    kindLine,
    "Open with one complete gist sentence of 12–24 words that starts with the topic (“Photosynthesis is the process of…”, not a telegram fragment).",
    depthLine,
    "Every closed fact worth keeping must appear at least once as a bare token in the prose, not only in a heading.",
    "Then weave in up to two supporting pegs (a who, when, where, or key term) so they can sit as side chips after the main fact.",
  ].join(" ");
}

const INTENT_STOP = new Set([
  "the",
  "a",
  "an",
  "of",
  "in",
  "is",
  "what",
  "who",
  "when",
  "where",
  "why",
  "how",
  "usually",
  "named",
  "as",
  "for",
  "do",
  "does",
  "did",
  "to",
  "and",
  "or",
  "this",
  "that",
  "these",
  "those",
  "with",
  "from",
  "was",
  "were",
  "are",
  "be",
  "it",
  "on",
  "at",
  "which",
  "most",
  "associated",
]);

function contentWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !INTENT_STOP.has(word));
}

export type IntentCard = {
  prompt?: string;
  token?: string;
  answer?: string;
  recall?: string;
};

/** Overlap of the card with the user's question. Higher = more likely the primary fact. */
export function cardIntentScore(
  card: IntentCard,
  intent: AskIntent,
  userText?: string
): number {
  const askWords = contentWords(intent.primaryAsk || userText || "");
  const cardWords = contentWords(
    [card.prompt, card.token, card.answer].filter(Boolean).join(" ")
  );
  if (!askWords.length) return 1;
  let hits = 0;
  for (const word of askWords) {
    if (cardWords.some((item) => item === word || item.includes(word) || word.includes(item))) {
      hits += 1;
    }
  }
  return hits;
}

/** Would this card sit on a flashcard titled with USER's question? */
export function cardMatchesIntent(
  card: IntentCard,
  intent: AskIntent,
  userText?: string
): boolean {
  if (!intent.harvest) return false;
  if (card.recall === "open") return intent.maxOpen >= 1;
  return cardIntentScore(card, intent, userText) >= 1;
}

/** Wait for classify — no regex race before the model plan lands. */
export async function resolveAskIntentForAnswer(
  promise: Promise<AskIntent>,
  fallback: AskIntent
): Promise<AskIntent> {
  try {
    return await promise;
  } catch {
    return { ...fallback, planSource: "timeout" };
  }
}

/** After lookup feeds: use classify only if it already finished. Do not add another wait. */
export function peekAskIntent(
  promise: Promise<AskIntent>,
  fallback: AskIntent
): Promise<AskIntent> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: AskIntent) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    promise.then(finish, () => finish(fallback));
    queueMicrotask(() => finish(fallback));
  });
}

function timeoutIntent(userText: string, options?: ClassifyOptions) {
  return new Promise<AskIntent>((resolve) => {
    setTimeout(() => resolve(fallbackAskIntent(userText, options)), CLASSIFY_MS);
  });
}

export async function classifyAskIntent(
  userText: string,
  options?: ClassifyOptions
): Promise<AskIntent> {
  const fallback = fallbackAskIntent(userText, options);
  const text = userText.trim();
  if (text.length < 8) {
    return { ...fallback, planSource: "fastpath" };
  }

  const prior = options?.priorText?.trim() ?? "";
  const last = options?.priorReply?.replace(/\s+/g, " ").trim() ?? "";
  const thread = options?.threadClip?.replace(/\s+/g, " ").trim() ?? "";
  const userBlock = [
    `USER: ${text.slice(0, 800)}`,
    prior ? `PRIOR: ${prior.slice(0, 400)}` : "",
    last ? `LAST: ${last.slice(0, 360)}` : "",
    thread ? `THREAD:\n${options?.threadClip?.slice(0, 900)}` : "",
    options?.hasFiles
      ? "HAS_FILE: yes (evidence only — do not skip Keep because a file exists)"
      : "HAS_FILE: no",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const grok = callGrokChat(
      [
        {
          role: "user",
          content: userBlock,
        },
      ],
      {
        tools: false,
        effort: "none",
        maxTokens: 220,
        temperature: 0,
        answerLength: "short",
        system: CLASSIFIER,
      }
    )
      .then((raw) => {
        const parsed = parseAskIntent(raw, text, options);
        if (!parsed) return { ...fallback, planSource: "timeout" as const };
        return { ...parsed, planSource: "model" as const };
      })
      .catch(() => fallback);

    const raw = await Promise.race([grok, timeoutIntent(userText, options)]);
    return raw;
  } catch {
    return fallback;
  }
}

const CAPITAL_IS =
  /capital of (?:the )?[\w .']+ is\s+(\*\*)?([A-Z][\w.',\s]{1,40}?)(\*\*)?(?:\.|,|$)/i;
const IS_CAPITAL =
  /(\*\*)?([A-Z][\w.',\s]{1,40}?)(\*\*)?\s+is the capital\b/i;

/** Deterministic chip when the miner returns [] on a capital ask. */
export function capitalFallbackCard(
  userText: string,
  reply: string
): {
  prompt: string;
  answer: string;
  token: string;
  span: string;
  kind: "where";
  recall: "closed";
  distractors: string[];
} | null {
  if (!CAPITAL_ASK.test(userText)) return null;
  const hit = reply.match(CAPITAL_IS) || reply.match(IS_CAPITAL);
  const city = (hit?.[2] ?? "").replace(/\s+/g, " ").trim();
  if (city.length < 3 || city.length > 48) return null;
  if (!reply.includes(city) && !reply.toLowerCase().includes(city.toLowerCase())) {
    return null;
  }
  return {
    prompt: userText.trim().replace(/\?+$/, "?").slice(0, 240) || "What is the capital?",
    answer: city,
    token: city,
    span: city,
    kind: "where" as const,
    recall: "closed" as const,
    distractors: ["Springfield", "Madison", "Albany"],
  };
}

/** One gist card when teach_light miner returns only closed pegs or nothing. */
export function openFallbackCard(
  userText: string,
  reply: string
): {
  prompt: string;
  answer: string;
  token: string;
  span: string;
  kind: "meaning";
  recall: "open";
  distractors: string[];
} | null {
  const plain = reply
    .replace(/[#*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const sentence = (plain.split(/(?<=[.!?])\s+/)[0] || plain).trim();
  const words = sentence.split(" ").filter(Boolean);
  if (words.length < 12 || words.length > 24) return null;
  const topic = topicFromAsk(userText);
  if (!topic || !sentence.toLowerCase().includes(topic.toLowerCase().slice(0, 12))) {
    return null;
  }
  const gist = sentence;
  let span = "";
  for (let n = 6; n >= 3; n -= 1) {
    for (let i = 0; i + n <= words.length; i += 1) {
      const slice = words.slice(i, i + n).join(" ");
      if (plain.toLowerCase().includes(slice.toLowerCase())) {
        span = slice;
        break;
      }
    }
    if (span) break;
  }
  if (!span) return null;
  return {
    prompt: userText.trim().replace(/\?+$/, "?").slice(0, 240) || "What is the idea?",
    answer: gist,
    token: topic.slice(0, 80),
    span,
    kind: "meaning",
    recall: "open",
    distractors: [],
  };
}

function topicFromAsk(userText: string): string {
  const t = userText.replace(/[?!]+$/g, "").trim();
  const m = t.match(
    /^(?:what is|what's|whats|define|explain|how does|how do)\s+(?:the )?(?:basic )?(?:definition of )?(.+?)(?:\s+work|\s+mean)?$/i
  );
  const raw = (m?.[1] ?? t).replace(/\s+/g, " ").trim();
  const words = raw
    .split(/\s+/)
    .filter((word) => !/^(a|an|the|of|for|and|basic)$/i.test(word));
  const topic = words.slice(0, 3).join(" ");
  if (!topic) return "Idea";
  return topic.replace(/^\w/, (ch) => ch.toUpperCase()).slice(0, 48);
}

function completeGistSentence(topic: string, sentence: string): string {
  let s = sentence.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
  const low = s.toLowerCase();
  const topicLow = topic.toLowerCase();
  if (low.startsWith(topicLow)) {
    s = `${topic}${s.slice(topic.length)}`;
  } else if (/^(is|are|was|were)\b/i.test(s)) {
    s = `${topic} ${s}`;
  } else if (/^(the process of|a process)\b/i.test(s)) {
    s = `${topic} is ${s}`;
  } else if (/^(convert|converting|makes?|uses?|turns?)\b/i.test(s)) {
    const rest = s.replace(/^(convert|converting)\b/i, "converting");
    s = `${topic} is the process of ${rest}`;
  }
  if (!/[.!?]$/.test(s)) s += ".";
  const bits = s.split(/\s+/);
  if (bits.length > 28) {
    s = `${bits.slice(0, 24).join(" ").replace(/[,:;]$/, "")}.`;
  }
  return s;
}
