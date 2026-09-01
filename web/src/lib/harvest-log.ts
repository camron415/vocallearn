import type { ChipKind } from "@/lib/harvest";
import type { HarvestChipDraft } from "@/lib/learn-mine";
import type { SupabaseClient } from "@supabase/supabase-js";

export type HarvestTurnCardLog = {
  learnCardId?: string;
  kind: ChipKind;
  token: string;
  span: string;
  prompt: string;
  promptB?: string;
  answer: string;
  hint?: string;
  distractors: string[];
  recall: string;
  weight?: string;
  cluster?: string;
};

export type HarvestTurnLog = {
  conversationId: string;
  userText: string;
  replyText: string;
  skipped: boolean;
  skipReason?: string;
  cards: HarvestTurnCardLog[];
  minerRaw?: string;
};

function cardToLog(chip: HarvestChipDraft, learnCardId?: string): HarvestTurnCardLog {
  return {
    learnCardId,
    kind: chip.kind,
    token: chip.token,
    span: chip.span,
    prompt: chip.prompt,
    promptB: chip.promptB,
    answer: chip.answer,
    hint: chip.hint,
    distractors: chip.distractors ?? [],
    recall: chip.recall,
    weight: chip.weight,
    cluster: chip.cluster,
  };
}

/** Best-effort telemetry for harvest tuning. Never blocks a turn. */
export async function logHarvestTurn(
  supabase: SupabaseClient,
  userId: string,
  turn: HarvestTurnLog
) {
  const kinds = [...new Set(turn.cards.map((card) => card.kind))];
  const { error } = await supabase.from("halo_harvest_turns").insert({
    user_id: userId,
    conversation_id: turn.conversationId,
    user_text: turn.userText.slice(0, 4000),
    reply_text: turn.replyText.slice(0, 12000),
    skipped: turn.skipped,
    skip_reason: turn.skipReason ?? null,
    card_count: turn.cards.length,
    kinds,
    cards: turn.cards,
    miner_raw: turn.minerRaw?.slice(0, 8000) ?? null,
    policy_version: "v2",
  });
  if (error) {
    // Table may not exist until migration 014 is applied.
    return;
  }
}

export function harvestCardsFromDrafts(
  drafts: HarvestChipDraft[],
  learnCardIds: Array<string | undefined>
): HarvestTurnCardLog[] {
  return drafts.map((chip, index) => cardToLog(chip, learnCardIds[index]));
}
