import { callGrokChat } from "@/lib/grok";
import { resolveChipRecall, type ChipRecall } from "@/lib/chip-recall";
import {
  capitalFallbackCard,
  fallbackAskIntent,
  harvestAskText,
  openFallbackCard,
  type AskIntent,
} from "@/lib/ask-intent";
import {
  cardPassesPolicy,
  skipHarvestTurn,
  V2_HARVEST_POLICY,
  type HarvestPolicy,
} from "@/lib/harvest-policy";
import {
  harvestCardsFromDrafts,
  logHarvestTurn,
} from "@/lib/harvest-log";
import { trackHaloEvent } from "@/lib/track";
import {
  cueRestates,
  findHarvestSpanVerbatim,
  harvestCueKey,
  harvestFactKey,
  parseChipKind,
  type ChipWeight,
  type HarvestChip,
} from "@/lib/harvest";
import {
  filterChipInvariants,
  kindFromContent,
  pickPrimaryThenSupports,
  replyHasAskKindAtom,
  splitAssistantHeadBody,
  type ChipDrop,
  type InvariantChip,
} from "@/lib/chip-invariants";
import type { SupabaseClient } from "@supabase/supabase-js";

const MINER = `You extract 0 to 3 review chips from a family Ask chat. Prefer 2–3 chips from the SAME assistant answer when it has more than one stable detail (a cluster).
Return ONLY JSON: {"cards":[{"prompt":"question from memory","promptB":"a second different question for the same fact","answer":"short correct answer","hint":"tiny hint never used as a question","token":"same shape as answer","span":"exact substring copied from ASSISTANT","kind":"when|where|who|meaning","distractors":["wrong1","wrong2","wrong3"]}]}
Rules:
- Only stable facts: history, science, math, definitions, how-something-works.
- SKIP weather, news, sports scores, stocks, recipes, schedules, opinions, fan sentiment, and prices that change day to day.
- SKIP chit-chat and meta-talk: greetings, "got it", and anything about a typo in the user's message. Never quiz "what was the typo" or "what did the user mean to type".
- KEEP closed facts even from short asks: capitals, counts, names, dates, places, definitions. One-word answers (Jupiter, Nile) are fine.
- Uniqueness is the question cue, not the answer word. Same answer with a different question is a new card. Restated questions are not.
- When you return 2+ cards from one answer, spread kinds (when / where / who / meaning) when the facts support it — not all the same color.
- span MUST be the shortest literal substring in ASSISTANT (city, year, number) — never a full sentence.
- If USER asks "capital of …", return at least one where card; span = the city name as written.
- If USER asks "population of …", return a meaning card; span = the number as written (keep commas).
- When ASSISTANT gives 2+ closed facts (city + population), return 2 cards.
- kind: when=dates/years/durations, where=places, who=names, meaning=definitions or the vital phrase.
- token MUST be the same class as answer (both names, both years, both mile figures). Never a phrase vs a city.
- distractors: exactly 3 wrong answers, SAME SHAPE as the answer (same unit, same kind of name). Never miles vs km. Never a phrase vs a city. Never a year vs an era label.
- promptB MUST be a real second question for the same fact. Never copy prompt. Never use hint as promptB.
- Return a "recall" field: "closed" or "open".
- When Open gist cards allowed is 1, card 1 SHOULD be recall=open: token = the topic name (1–3 words, e.g. Photosynthesis), answer = a complete sentence 12–24 words (“Photosynthesis is the process of converting…”, never a bare verb like “convert light energy…”), span = a short phrase copied from ASSISTANT, distractors = []. Then 1–2 closed pegs with 3 distractors.
- span for closed = shortest token (city, year, name). span for open = a 4–10 word phrase that appears in ASSISTANT. token for open is the topic name, not a slice of the gist.
- If nothing qualifies, {"cards":[]}.`;

const LEARN_CARDS_PEEK = 400;

function minerSystem(intent?: AskIntent) {
  if (!intent) return MINER;
  return `${MINER}

INTENT (read first):
USER needs: ${intent.primaryAsk}
Harvest this turn: ${intent.harvest ? "yes" : "no"}
Mode: ${intent.answerMode}
Ask kind (MAIN chip): ${intent.askKind ?? "unspecified"}
Max chips: ${intent.maxChips}
Open gist cards allowed: ${intent.maxOpen} (0 or 1). Open = one complete sentence gist of USER's question, 12–24 words, topic name as token, not the whole answer.
Closed cards: short tokens with exactly 3 same-shape distractors.
Primary card must answer USER (if USER is a follow-up, use PRIOR context in USER needs — “this” means that topic). Card 1 is the MAIN fact (askKind). Cards 2–3 are supporting who/when/where with a different kind — never trivia, never a restatement of USER's question.
Never echo USER as a token (“Give me brief”, “Why did Western”).
Never harvest a product SKU, a specific item's material blend, shopping, today's forecast, event times, or advice lists.
Do not rewrite older facts from earlier turns. Only chips for THIS assistant answer.`;
}

export type MinerCardJson = {
  prompt?: string;
  promptB?: string;
  answer?: string;
  hint?: string;
  token?: string;
  span?: string;
  kind?: string;
  recall?: string;
  distractors?: string[];
};

export type MinerJson = { cards?: MinerCardJson[] };

export type CardsFromMinerOptions = {
  policy?: HarvestPolicy;
  knownRows?: Array<{ prompt?: string; token?: string; answer?: string }>;
  intent?: AskIntent;
  userText?: string;
  priorText?: string;
  drops?: ChipDrop[];
};

function extractJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      if (inString) escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function resolveSpanInReply(card: MinerCardJson, reply: string): string | null {
  return findHarvestSpanVerbatim(reply, {
    span: (card.span ?? "").trim(),
    token: (card.token ?? "").trim(),
    answer: (card.answer ?? "").trim(),
  })?.text.slice(0, 120) ?? null;
}

function unitOf(text: string) {
  const t = text.toLowerCase();
  if (/\bkm\b/.test(t) || /\bkilometers?\b/.test(t)) return "km";
  if (/\bmiles?\b/.test(t)) return "miles";
  if (/\bmeters?\b/.test(t) || /\bm\b/.test(t)) return "m";
  return "";
}

export function sameShapeAsAnswer(answer: string, distractor: string) {
  const unit = unitOf(answer);
  const other = unitOf(distractor);
  if (unit && other && unit !== other) return false;
  const answerWords = answer.trim().split(/\s+/).length;
  const distractorWords = distractor.trim().split(/\s+/).length;
  if (answerWords <= 2 && distractorWords > 4) return false;
  return true;
}

function rankHarvested(
  harvested: HarvestChipDraft[],
  intent: AskIntent | undefined,
  userText: string | undefined,
  reply: string,
  maxCards: number,
  drops?: ChipDrop[]
): HarvestChipDraft[] {
  if (!harvested.length) return harvested;
  const asInvariant = (chip: HarvestChipDraft): InvariantChip => ({
    prompt: chip.prompt,
    promptB: chip.promptB,
    token: chip.token,
    answer: chip.answer,
    span: chip.span,
    kind: chip.kind,
    recall: chip.recall,
    distractors: chip.distractors ?? [],
  });
  const picked = pickPrimaryThenSupports(harvested.map(asInvariant), {
    intent,
    userText,
    reply,
    maxCards,
  });
  if (drops) drops.push(...picked.drops);
  const byKey = new Map(
    harvested.map((chip) => [`${harvestFactKey(chip.token)}|${chip.span}`, chip])
  );
  return picked.chips
    .map((row) => byKey.get(`${harvestFactKey(row.token)}|${row.span}`))
    .filter((chip): chip is HarvestChipDraft => Boolean(chip));
}

type KnownClaim = { prompt: string; token: string; answer: string };

function asKnownClaim(row: { prompt?: string; token?: string; answer?: string }): KnownClaim {
  return {
    prompt: (row.prompt ?? "").trim(),
    token: (row.token ?? "").trim(),
    answer: (row.answer ?? "").trim(),
  };
}

function claimAlreadyKept(card: KnownClaim, known: KnownClaim[]) {
  const cue = harvestCueKey(card.prompt);
  if (!cue) return false;
  return known.some((row) => cueRestates(cue, harvestCueKey(row.prompt)));
}

export function parseMinerJson(raw: string): MinerJson | null {
  const blob = extractJson(raw);
  if (!blob) return null;
  try {
    return JSON.parse(blob) as MinerJson;
  } catch {
    return null;
  }
}

export type HarvestChipDraft = HarvestChip & { recall: ChipRecall };

/** Pure validation pipeline — no Grok, no Supabase. */
export function cardsFromMinerJson(
  parsed: MinerJson | null,
  reply: string,
  knownPrompts: string[] = [],
  clusterId?: string,
  options?: CardsFromMinerOptions
): HarvestChipDraft[] {
  const intent = options?.intent;
  const policy =
    options?.policy ??
    (intent
      ? {
          ...V2_HARVEST_POLICY,
          closedOnly: intent.maxOpen < 1,
          maxOpen: intent.maxOpen,
          maxCardsPerTurn: Math.max(1, intent.maxChips || V2_HARVEST_POLICY.maxCardsPerTurn),
        }
      : V2_HARVEST_POLICY);
  const knownClaims: KnownClaim[] = [
    ...knownPrompts.map((prompt) => asKnownClaim({ prompt })),
    ...(options?.knownRows ?? []).map(asKnownClaim),
  ];
  const harvested: HarvestChipDraft[] = [];

  for (const card of parsed?.cards ?? []) {
    const prompt = (card.prompt ?? "").trim();
    const promptB = (card.promptB ?? "").trim();
    const answer = (card.answer ?? "").trim();
    if (!prompt || !answer) continue;
    if (
      /\b(typo in (the |your |the user's )?message|user'?s message|what .+ typed|what was the typo|keyboard smash)\b/i.test(
        prompt
      )
    ) {
      continue;
    }

    const token = (card.token ?? card.span ?? answer).trim();
    if (claimAlreadyKept({ prompt, token, answer }, knownClaims)) continue;

    const span = resolveSpanInReply(card, reply);
    if (!span) {
      options?.drops?.push({ reason: "no_span", token });
      continue;
    }

    const recall = resolveChipRecall({
      recall: card.recall,
      token,
      answer,
    });
    const kind = kindFromContent({
      token,
      answer,
      kind: parseChipKind(card.kind),
    });
    const distractors = (card.distractors ?? [])
      .map((item) => item.trim())
      .filter((item) => item && sameShapeAsAnswer(answer, item))
      .slice(0, 3);

    if (!cardPassesPolicy({ recall, token, answer, distractors }, policy)) {
      continue;
    }

    if (recall === "open") {
      const openCount = harvested.filter((chip) => chip.recall === "open").length;
      if (openCount >= policy.maxOpen) continue;
    }

    const invariant: InvariantChip = {
      prompt: prompt.slice(0, 240),
      token: sameShapeAsAnswer(answer, token) ? token.slice(0, 80) : answer.slice(0, 80),
      answer: answer.slice(0, 400),
      span: span.slice(0, 120),
      kind,
      recall,
      distractors,
    };
    const dropped = filterChipInvariants(invariant, {
      userText: options?.userText,
      reply,
      askKind: intent?.askKind,
    });
    if (dropped) {
      options?.drops?.push({ reason: dropped, token: invariant.token });
      continue;
    }

    knownClaims.push({ prompt, token, answer });

    harvested.push({
      id: `draft-${harvested.length}`,
      token: invariant.token,
      span: invariant.span,
      kind,
      prompt: invariant.prompt,
      promptB:
        promptB &&
        promptB.toLowerCase().replace(/[^a-z0-9]+/g, " ") !==
          prompt.toLowerCase().replace(/[^a-z0-9]+/g, " ")
          ? promptB.slice(0, 240)
          : undefined,
      answer: invariant.answer,
      hint: (card.hint ?? "").trim().slice(0, 160) || undefined,
      weight: "simple",
      cluster: clusterId || undefined,
      distractors,
      recall,
    });
  }

  const capped = rankHarvested(
    harvested,
    intent,
    options?.userText,
    reply,
    policy.maxCardsPerTurn,
    options?.drops
  );
  const weight: ChipWeight = capped.length > 1 ? "cluster" : "simple";
  return capped.map((chip) => ({ ...chip, weight }));
}

export { shouldSkipHarvest } from "@/lib/harvest-policy";

async function callMinerModel(
  userText: string,
  reply: string,
  intent?: AskIntent
): Promise<string> {
  const { head, body } = splitAssistantHeadBody(reply);
  return callGrokChat(
    [
      {
        role: "user",
        content: [
          `USER: ${userText.slice(0, 1200)}`,
          `ASSISTANT_HEAD:\n${head.slice(0, 900)}`,
          body ? `ASSISTANT_BODY:\n${body.slice(0, 2400)}` : "",
          "The MAIN chip span MUST appear in ASSISTANT_HEAD.",
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ],
    {
      tools: false,
      effort: "none",
      maxTokens: 500,
      system: minerSystem(intent),
    }
  );
}

export type MineLearnResult = {
  chips: HarvestChipDraft[];
  skipped: boolean;
  skipReason?: string;
  minerRaw?: string;
};

function intentLogLine(intent: AskIntent, skipReason?: string) {
  return `INTENT:${JSON.stringify({
    harvest: intent.harvest,
    harvestWhy: intent.harvestWhy,
    job: intent.job,
    freshness: intent.freshness,
    feedDomain: intent.feedDomain,
    planSource: intent.planSource,
    askKind: intent.askKind,
    answerDepth: intent.answerDepth,
    answerMode: intent.answerMode,
    primaryAsk: intent.primaryAsk,
    maxChips: intent.maxChips,
    saveOffer: intent.saveOffer ?? null,
    skipReason: skipReason ?? null,
  })}`;
}

/** Live smoke / tests — Grok + validation, no Supabase. */
export async function mineLearnFromReply(
  userText: string,
  reply: string,
  options?: CardsFromMinerOptions & {
    conversationId?: string;
    knownPrompts?: string[];
  }
): Promise<MineLearnResult> {
  const intent = options?.intent;
  const gate = skipHarvestTurn(userText, reply, intent);
  if (gate.skip) {
    return { chips: [], skipped: true, skipReason: gate.reason };
  }
  const ask = harvestAskText(userText, options?.priorText);
  const drops: ChipDrop[] = options?.drops ?? [];
  const mineOptions = { ...options, userText: ask, intent, drops };
  const raw = await callMinerModel(ask, reply, intent);
  let chips = cardsFromMinerJson(
    parseMinerJson(raw),
    reply,
    options?.knownPrompts ?? [],
    options?.conversationId ?? "smoke",
    mineOptions
  );
  if (!chips.length) {
    const capital = capitalFallbackCard(ask, reply);
    if (capital) {
      chips = cardsFromMinerJson(
        { cards: [capital] },
        reply,
        options?.knownPrompts ?? [],
        options?.conversationId ?? "smoke",
        mineOptions
      );
    }
  }
  if (
    !chips.length &&
    intent?.answerMode === "direct" &&
    replyHasAskKindAtom(intent, reply)
  ) {
    const retryRaw = await callMinerModel(
      ask,
      `${reply}\n\nSTRICT: one card only. The token IS the answer to USER. No extra places, dates, or trivia.`,
      intent
    );
    chips = cardsFromMinerJson(
      parseMinerJson(retryRaw),
      reply,
      options?.knownPrompts ?? [],
      options?.conversationId ?? "smoke",
      mineOptions
    );
  }
  if (intent && intent.maxOpen >= 1 && !chips.some((chip) => chip.recall === "open")) {
    const gist = openFallbackCard(ask, reply);
    if (gist) {
      const extra = cardsFromMinerJson(
        { cards: [gist] },
        reply,
        options?.knownPrompts ?? [],
        options?.conversationId ?? "smoke",
        mineOptions
      );
      chips = [...extra, ...chips].slice(
        0,
        Math.max(1, intent.maxChips || V2_HARVEST_POLICY.maxCardsPerTurn)
      );
    }
  }
  return {
    chips,
    skipped: false,
    skipReason: chips.length ? undefined : "empty_miss",
    minerRaw: [raw, drops.length ? `DROPS:${JSON.stringify(drops)}` : ""]
      .filter(Boolean)
      .join("\n"),
  };
}

export async function mineLearnFromTurn(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
  userText: string,
  reply: string,
  intent?: AskIntent,
  priorText?: string
): Promise<HarvestChip[]> {
  const resolved = intent ?? fallbackAskIntent(userText, { priorText });
  const gate = skipHarvestTurn(userText, reply, resolved);
  const skipped = gate.skip;

  try {
    if (skipped) {
      await logHarvestTurn(supabase, userId, {
        conversationId,
        userText,
        replyText: reply,
        skipped: true,
        skipReason: gate.reason,
        cards: [],
        minerRaw: intentLogLine(resolved, gate.reason),
      });
      return [];
    }

    const { data: existing } = await supabase
      .from("halo_learn_cards")
      .select("prompt, token, answer")
      .eq("user_id", userId)
      .limit(LEARN_CARDS_PEEK);
    const knownPrompts = (existing ?? []).map((row) => row.prompt as string);

    const mined = skipped
      ? { chips: [], skipped: true, skipReason: gate.reason }
      : await mineLearnFromReply(userText, reply, {
          conversationId,
          knownPrompts,
          knownRows: existing ?? [],
          intent: resolved,
          userText,
          priorText,
        });

    const harvested: HarvestChip[] = [];
    const learnCardIds: Array<string | undefined> = [];

    for (const draft of mined.chips) {
      const chip = draft;
      const row = {
        user_id: userId,
        prompt: chip.prompt,
        answer: chip.answer,
        hint: chip.hint ?? null,
        kind: chip.kind,
        token: chip.token,
        span: chip.span,
        weight: chip.weight,
      };

      const inserted = await supabase
        .from("halo_learn_cards")
        .insert(row)
        .select("id")
        .maybeSingle();

      let id = inserted.data?.id as string | undefined;
      if (inserted.error) {
        const { data: fallback } = await supabase
          .from("halo_learn_cards")
          .insert({
            user_id: userId,
            prompt: row.prompt,
            answer: row.answer,
            hint: row.hint,
          })
          .select("id")
          .maybeSingle();
        id = fallback?.id as string | undefined;
      }

      learnCardIds.push(id);
      harvested.push({
        ...chip,
        id: id || `local-${harvested.length}-${Date.now()}`,
        askId: conversationId,
      });
    }

    await logHarvestTurn(supabase, userId, {
      conversationId,
      userText,
      replyText: reply,
      skipped: mined.skipped,
      skipReason: mined.skipReason,
      cards: harvestCardsFromDrafts(mined.chips, learnCardIds),
      minerRaw: [intentLogLine(resolved, mined.skipReason), mined.minerRaw]
        .filter(Boolean)
        .join("\n"),
    });

    if (!mined.chips.length && !mined.skipped) {
      await trackHaloEvent(supabase, userId, "harvest_miss", {
        conversationId,
        userText: userText.slice(0, 400),
        job: resolved.job,
        askKind: resolved.askKind,
        skipReason: mined.skipReason ?? "empty_miss",
      });
    }

    return harvested;
  } catch {
    await logHarvestTurn(supabase, userId, {
      conversationId,
      userText,
      replyText: reply,
      skipped: true,
      skipReason: "mine_error",
      cards: [],
    }).catch(() => undefined);
    return [];
  }
}
