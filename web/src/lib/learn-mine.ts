import { FAST_MODEL, callGrokChat } from "@/lib/grok";
import { isLookupAsk } from "@/lib/ask-route";
import { isLikelyDuplicate } from "@/lib/learn";
import {
  parseChipKind,
  type ChipWeight,
  type HarvestChip,
} from "@/lib/harvest";
import type { SupabaseClient } from "@supabase/supabase-js";

const MINER = `You extract 0 to 3 review chips from a family Ask chat. Prefer 2–3 chips from the SAME assistant answer when it has more than one stable detail (a cluster).
Return ONLY JSON: {"cards":[{"prompt":"question from memory","answer":"short correct answer","hint":"tiny hint","token":"the key phrase","span":"exact substring copied from ASSISTANT","kind":"when|where|who|meaning"}]}
Rules:
- Only stable facts: history, science, definitions, how-something-works.
- SKIP weather, news, sports scores, stocks, recipes, schedules, opinions, one-off lookups.
- span MUST appear verbatim in the assistant text (no paraphrase).
- kind: when=dates/years/durations, where=places, who=names, meaning=definitions or the vital phrase.
- If nothing qualifies, {"cards":[]}.`;

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

function spanInReply(span: string, reply: string) {
  return Boolean(span) && reply.includes(span);
}

export async function mineLearnFromTurn(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
  userText: string,
  reply: string
): Promise<HarvestChip[]> {
  if (isLookupAsk(userText)) return [];
  if (userText.length < 24 || reply.length < 40) return [];

  try {
    const { data: existing } = await supabase
      .from("halo_learn_cards")
      .select("prompt")
      .eq("user_id", userId)
      .limit(40);
    const known = (existing ?? []).map((row) => row.prompt as string);

    const raw = await callGrokChat(
      [
        {
          role: "user",
          content: `USER: ${userText.slice(0, 1200)}\n\nASSISTANT: ${reply.slice(0, 1800)}`,
        },
      ],
      {
        model: FAST_MODEL,
        tools: false,
        effort: "none",
        maxTokens: 500,
        system: MINER,
      }
    );
    const blob = extractJson(raw);
    if (!blob) return [];
    const parsed = JSON.parse(blob) as {
      cards?: Array<{
        prompt?: string;
        answer?: string;
        hint?: string;
        token?: string;
        span?: string;
        kind?: string;
      }>;
    };

    const weight: ChipWeight =
      (parsed.cards?.length ?? 0) > 1 ? "cluster" : "simple";
    const harvested: HarvestChip[] = [];

    for (const card of parsed.cards ?? []) {
      const prompt = (card.prompt ?? "").trim();
      const answer = (card.answer ?? "").trim();
      if (!prompt || !answer) continue;
      if (isLikelyDuplicate(prompt, known)) continue;
      const span = (card.span ?? card.token ?? answer).trim();
      if (!spanInReply(span, reply) && !spanInReply(answer, reply)) continue;
      const token = (card.token ?? span).trim();
      const kind = parseChipKind(card.kind);
      known.push(prompt);

      const row = {
        user_id: userId,
        prompt: prompt.slice(0, 240),
        answer: answer.slice(0, 400),
        hint: (card.hint ?? "").trim().slice(0, 160) || null,
        kind,
        token: token.slice(0, 80),
        span: span.slice(0, 120),
        weight,
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

      harvested.push({
        id: id || `local-${harvested.length}-${Date.now()}`,
        token: token.slice(0, 80),
        span: span.slice(0, 120),
        kind,
        prompt: prompt.slice(0, 240),
        answer: answer.slice(0, 400),
        hint: (card.hint ?? "").trim().slice(0, 160) || undefined,
        weight,
        cluster: conversationId || undefined,
      });
    }

    return harvested.slice(0, 3);
  } catch {
    return [];
  }
}
