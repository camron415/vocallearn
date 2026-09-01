import { clipAtWord } from "@/lib/constants";
import { CHAT_MODEL, grokAuth } from "@/lib/grok";
import { grokCostMicros } from "@/lib/limits";
import { CHIP_LABEL_MAX, type SuggestChip } from "@/lib/suggest-chips";

export type ChatSignal = {
  title: string;
  question: string;
};

const PROMPT_MAX = 420;

const SUGGEST_MODEL = process.env.GROK_SUGGEST_MODEL?.trim() || CHAT_MODEL;

function buildPrompt(displayName: string, signals: ChatSignal[]) {
  const lines = signals
    .map((row, i) => {
      const title = row.title.replace(/\s+/g, " ").trim();
      const question = row.question.replace(/\s+/g, " ").trim().slice(0, 220);
      return `${i + 1}. Title: ${title}\n   Asked: ${question}`;
    })
    .join("\n");

  return `Recent chats for ${displayName}:

${lines}

Write 6 home-screen suggestion chips. These are Discover-style ideas, not recaps.

Zoom out from the chats. Use them only to guess broad interests (markets, cooking, weather, travel, news). Then write everyday questions a family member would tap — the kind Google or YouTube would show, not a rewrite of a past prompt.

Good: "How did the market close today?"  Bad: repeating their exact ticker or Fed question.
Good: "What's an easy dinner tonight?"  Bad: naming the specific recipe they already asked about.
Good: "Will it rain this weekend?"  Bad: restating last week's forecast question.

Mix:
- 3–4 broad follow-ups on their interests (one level more general than the chats)
- 1–2 useful adjacent ideas
- 1 fresh general idea (news, weather, or practical life)

Rules:
- "label": 6–10 words, max ${CHIP_LABEL_MAX} characters. Full questions. No ellipsis. No quotes.
- "prompt": 1–2 plain sentences for the assistant. Broader than the label is fine.
- Do not copy or lightly rephrase any title or question above.
- At most one chip per theme. Six chips should feel varied.
- Do not guess gender, age, or demographics.
- No markdown. Output JSON only:
{"chips":[{"label":"...","prompt":"..."}]}`;
}

const SKIP = new Set([
  "about",
  "after",
  "does",
  "from",
  "have",
  "this",
  "that",
  "what",
  "when",
  "where",
  "which",
  "with",
  "your",
  "today",
  "week",
]);

function words(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !SKIP.has(w));
}

/** Drop chips that are basically a past chat, slightly rephrased. */
function tooCloseToHistory(label: string, signals: ChatSignal[]) {
  const chipWords = new Set(words(label));
  if (chipWords.size < 2) return false;
  const labelNorm = label.toLowerCase();
  for (const row of signals) {
    const hay = `${row.title} ${row.question}`.toLowerCase();
    if (hay.includes(labelNorm) || labelNorm.includes(row.title.toLowerCase().slice(0, 24))) {
      return true;
    }
    const hist = words(`${row.title} ${row.question}`);
    const overlap = hist.filter((w) => chipWords.has(w)).length;
    if (overlap >= 3) return true;
  }
  return false;
}

function parseChipJson(raw: string): Omit<SuggestChip, "id">[] | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced?.[1] ?? trimmed).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(body.slice(start, end + 1)) as {
      chips?: Array<{ label?: string; prompt?: string }>;
    };
    if (!Array.isArray(parsed.chips)) return null;

    const out: Omit<SuggestChip, "id">[] = [];
    const seen = new Set<string>();

    for (const row of parsed.chips) {
      const label = clipAtWord(
        String(row.label ?? "")
          .replace(/\s+/g, " ")
          .replace(/[…]+$/g, "")
          .trim(),
        CHIP_LABEL_MAX
      );
      const prompt = String(row.prompt ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, PROMPT_MAX);
      if (label.length < 8 || prompt.length < 12) continue;
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ label, prompt });
      if (out.length >= 6) break;
    }

    return out.length >= 4 ? out : null;
  } catch {
    return null;
  }
}

export type SuggestGeneration = {
  chips: SuggestChip[];
  costMicros: number;
  inputTokens: number;
  outputTokens: number;
};

/** One cheap model call — ~fraction of a cent. */
export async function generateSuggestChips(
  displayName: string,
  signals: ChatSignal[]
): Promise<SuggestGeneration | null> {
  if (!signals.length) return null;

  try {
    const { apiUrl, headers } = grokAuth();
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: SUGGEST_MODEL,
        temperature: 0.65,
        max_tokens: 520,
        messages: [
          {
            role: "system",
            content:
              "You write tap-to-ask suggestion chips for a private family assistant. Return valid JSON only.",
          },
          {
            role: "user",
            content: buildPrompt(displayName, signals.slice(0, 12)),
          },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const raw = String(data.choices?.[0]?.message?.content ?? "");
    const parsed = parseChipJson(raw)?.filter(
      (chip) => !tooCloseToHistory(chip.label, signals)
    );
    if (!parsed || parsed.length < 4) return null;

    const usage = data.usage ?? {};
    const inputTokens = Number(usage.prompt_tokens) || 0;
    const outputTokens = Number(usage.completion_tokens) || 0;
    const cachedTokens = Number(usage.prompt_tokens_details?.cached_tokens) || 0;
    const costMicros = grokCostMicros(inputTokens, outputTokens, cachedTokens);

    return {
      chips: parsed.map((chip, i) => ({ ...chip, id: `a${i}` })),
      costMicros,
      inputTokens,
      outputTokens,
    };
  } catch {
    return null;
  }
}
