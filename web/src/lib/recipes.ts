import { callGrokChat, type GrokMessage } from "@/lib/grok";
import type { ChatAttachment } from "@/lib/types";

const IMAGE = /^(image\/(jpeg|jpg|png|webp|gif))$/i;

const EXTRACT_SYSTEM = `You extract a short kitchen card from a chat.

Reply with JSON only, no markdown:
{"title":"","ingredients":"","steps":""}

Rules:
- title: the dish name only
- ingredients: one item per line, with amounts. No headings, no extra talk.
- steps: 6 to 12 short numbered steps. One action each. No tips, no stories, no sources, no timing essays.
- Keep the whole card easy to cook from. Do not copy a long article.
- If there is no recipe, {"title":""}`;

export function isSaveRecipeCommand(text: string) {
  const t = text
    .toLowerCase()
    .replace(/\n\n\[attached:[^\]]*\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return false;
  if (!/\brecipe/.test(t) && !/\bcookbook\b/.test(t)) return false;

  const saving =
    /\b(save|keep|store)\b/.test(t) ||
    /\badd (this |it |that )?(to )?(my )?recipes?\b/.test(t) ||
    /\bput (this |it |that )?in(to)? (my )?recipes?\b/.test(t);

  if (!saving) return false;

  if (
    /^(what|whats|how's|hows|can i make|suggest|find me|show me)\b/.test(t) &&
    !/\b(save|keep|store|add this|put this)\b/.test(t)
  ) {
    return false;
  }
  return true;
}

export function firstImageAttachment(attachments: ChatAttachment[]) {
  return attachments.find((file) => IMAGE.test(file.type || "")) ?? null;
}

type Extracted = {
  title: string;
  ingredients: string;
  steps: string;
};

function lastAssistantText(history: GrokMessage[]) {
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    if (m.role !== "assistant") continue;
    const text =
      typeof m.content === "string"
        ? m.content
        : m.content
            .filter((part) => part.type === "input_text")
            .map((part) => part.text)
            .join("\n");
    const cleaned = text.replace(/##\s*Sources[\s\S]*$/i, "").trim();
    if (cleaned.length < 80) continue;
    if (/couldn't find a recipe|saved \*\*/i.test(cleaned)) continue;
    return cleaned.slice(0, 7000);
  }
  return "";
}

function parseCard(raw: string): Extracted | null {
  const fenced = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(fenced.slice(start, end + 1)) as Extracted;
    const title = String(parsed.title || "").replace(/\s+/g, " ").trim();
    if (!title) return null;
    return {
      title: title.slice(0, 80),
      ingredients: String(parsed.ingredients || "").trim(),
      steps: String(parsed.steps || "").trim(),
    };
  } catch {
    return null;
  }
}

export async function extractRecipe(
  history: GrokMessage[]
): Promise<Extracted | null> {
  const recipe = lastAssistantText(history);
  if (!recipe) return null;

  const raw = await callGrokChat(
    [
      {
        role: "user",
        content: `Turn this into a short kitchen card.\n\n${recipe}`,
      },
    ],
    {
      maxTokens: 900,
      temperature: 0.1,
      tools: false,
      system: EXTRACT_SYSTEM,
    }
  );

  return parseCard(raw);
}
