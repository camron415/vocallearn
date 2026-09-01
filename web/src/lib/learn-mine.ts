import { callGrokChat } from "@/lib/grok";
import { isLikelyDuplicate } from "@/lib/learn";
import { resolveChipRecall, type ChipRecall } from "@/lib/chip-recall";
import {
  cardPassesPolicy,
  shouldSkipHarvest,
  V2_HARVEST_POLICY,
  type HarvestPolicy,
} from "@/lib/harvest-policy";
import {
  harvestCardsFromDrafts,
  logHarvestTurn,
} from "@/lib/harvest-log";
import {
  findHarvestNeedle,
  harvestFactKey,
  parseChipKind,
  type ChipWeight,
  type HarvestChip,
} from "@/lib/harvest";
import type { SupabaseClient } from "@supabase/supabase-js";

const MINER = `You extract 0 to 3 review chips from a family Ask chat. Prefer 2–3 chips from the SAME assistant answer when it has more than one stable detail (a cluster).
Return ONLY JSON: {"cards":[{"prompt":"question from memory","promptB":"a second different question for the same fact","answer":"short correct answer","hint":"tiny hint never used as a question","token":"same shape as answer","span":"exact substring copied from ASSISTANT","kind":"when|where|who|meaning","distractors":["wrong1","wrong2","wrong3"]}]}
Rules:
- Only stable facts: history, science, definitions, how-something-works.
- SKIP weather, news, sports scores, stocks, recipes, schedules, opinions, and prices that change day to day.
- KEEP closed facts even from short asks: capitals, counts, names, dates, places, definitions.
- When you return 2+ cards from one answer, spread kinds (when / where / who / meaning) when the facts support it — not all the same color.
- span MUST be the shortest literal substring in ASSISTANT (city, year, number) — never a full sentence.
- If USER asks "capital of …", return at least one where card; span = the city name as written.
- If USER asks "population of …", return a meaning card; span = the number as written (keep commas).
- When ASSISTANT gives 2+ closed facts (city + population), return 2 cards.
- kind: when=dates/years/durations, where=places, who=names, meaning=definitions or the vital phrase.
- token MUST be the same class as answer (both names, both years, both mile figures). Never a phrase vs a city.
- distractors: exactly 3 wrong answers, SAME SHAPE as the answer (same unit, same kind of name). Never miles vs km. Never a phrase vs a city. Never a year vs an era label.
- promptB MUST be a real second question for the same fact. Never copy prompt. Never use hint as promptB.
- If nothing qualifies, {"cards":[]}.`;

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
  const hit = findHarvestNeedle(reply, {
    span: (card.span ?? "").trim(),
    token: (card.token ?? "").trim(),
    answer: (card.answer ?? "").trim(),
  });
  return hit?.text.slice(0, 120) ?? null;
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

function knownFactKeys(rows: Array<{ prompt?: string; token?: string; answer?: string }>) {
  const keys = new Set<string>();
  for (const row of rows) {
    for (const value of [row.prompt, row.token, row.answer]) {
      const key = harvestFactKey(value ?? "");
      if (key) keys.add(key);
    }
  }
  return keys;
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
  const policy = options?.policy ?? V2_HARVEST_POLICY;
  const prompts = [...knownPrompts];
  const knownFacts = knownFactKeys(options?.knownRows ?? []);
  const harvested: HarvestChipDraft[] = [];

  for (const card of parsed?.cards ?? []) {
    const prompt = (card.prompt ?? "").trim();
    const promptB = (card.promptB ?? "").trim();
    const answer = (card.answer ?? "").trim();
    if (!prompt || !answer) continue;
    if (isLikelyDuplicate(prompt, prompts)) continue;

    const token = (card.token ?? card.span ?? answer).trim();
    if (
      knownFacts.has(harvestFactKey(token)) ||
      knownFacts.has(harvestFactKey(answer))
    ) {
      continue;
    }

    const span = resolveSpanInReply(card, reply);
    if (!span) continue;

    const kind = parseChipKind(card.kind);
    const distractors = (card.distractors ?? [])
      .map((item) => item.trim())
      .filter((item) => item && sameShapeAsAnswer(answer, item))
      .slice(0, 3);

    const recall = resolveChipRecall({
      recall: card.recall,
      token,
      answer,
    });

    if (!cardPassesPolicy({ recall, token, answer, distractors }, policy)) {
      continue;
    }

    prompts.push(prompt);
    knownFacts.add(harvestFactKey(token));
    knownFacts.add(harvestFactKey(answer));

    harvested.push({
      id: `draft-${harvested.length}`,
      token: sameShapeAsAnswer(answer, token) ? token.slice(0, 80) : answer.slice(0, 80),
      span: span.slice(0, 120),
      kind,
      prompt: prompt.slice(0, 240),
      promptB:
        promptB &&
        promptB.toLowerCase().replace(/[^a-z0-9]+/g, " ") !==
          prompt.toLowerCase().replace(/[^a-z0-9]+/g, " ")
          ? promptB.slice(0, 240)
          : undefined,
      answer: answer.slice(0, 400),
      hint: (card.hint ?? "").trim().slice(0, 160) || undefined,
      weight: "simple",
      cluster: clusterId || undefined,
      distractors,
      recall,
    });

    if (harvested.length >= policy.maxCardsPerTurn) break;
  }

  const weight: ChipWeight = harvested.length > 1 ? "cluster" : "simple";
  return harvested.map((chip) => ({ ...chip, weight }));
}

export { shouldSkipHarvest } from "@/lib/harvest-policy";

async function callMinerModel(userText: string, reply: string): Promise<string> {
  return callGrokChat(
    [
      {
        role: "user",
        content: `USER: ${userText.slice(0, 1200)}\n\nASSISTANT: ${reply.slice(0, 1800)}`,
      },
    ],
    {
      tools: false,
      effort: "none",
      maxTokens: 500,
      system: MINER,
    }
  );
}

export type MineLearnResult = {
  chips: HarvestChipDraft[];
  skipped: boolean;
  skipReason?: string;
  minerRaw?: string;
};

/** Live smoke / tests — Grok + validation, no Supabase. */
export async function mineLearnFromReply(
  userText: string,
  reply: string,
  options?: CardsFromMinerOptions & {
    conversationId?: string;
    knownPrompts?: string[];
  }
): Promise<MineLearnResult> {
  if (shouldSkipHarvest(userText, reply)) {
    return { chips: [], skipped: true, skipReason: "policy_skip" };
  }
  const raw = await callMinerModel(userText, reply);
  const chips = cardsFromMinerJson(
    parseMinerJson(raw),
    reply,
    options?.knownPrompts ?? [],
    options?.conversationId ?? "smoke",
    options
  );
  return { chips, skipped: false, minerRaw: raw };
}

export async function mineLearnFromTurn(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
  userText: string,
  reply: string
): Promise<HarvestChip[]> {
  const skipped = shouldSkipHarvest(userText, reply);

  try {
    const { data: existing } = await supabase
      .from("halo_learn_cards")
      .select("prompt, token, answer")
      .eq("user_id", userId)
      .limit(40);
    const knownPrompts = (existing ?? []).map((row) => row.prompt as string);

    const mined = skipped
      ? { chips: [], skipped: true, skipReason: "policy_skip" as const }
      : await mineLearnFromReply(userText, reply, {
          conversationId,
          knownPrompts,
          knownRows: existing ?? [],
        });

    const harvested: HarvestChip[] = [];
    const learnCardIds: Array<string | undefined> = [];

    for (const draft of mined.chips) {
      const { recall: _recall, ...chip } = draft;
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
      minerRaw: mined.minerRaw,
    });

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
