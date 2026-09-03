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

const HEAD_ING =
  /^\*{0,2}ingredients?\*{0,2}\s*:?\s*$|^#{1,3}\s*ingredients?\b/i;
const HEAD_STEPS =
  /^\*{0,2}(steps|instructions|directions|method)\*{0,2}\s*:?\s*$|^#{1,3}\s*(steps|instructions|directions|method)\b/i;
const BULLET = /^[-*•]\s+(.+)$/;
const NUMBERED = /^\d+[\.)]\s+(.+)$/;

function stripSources(md: string) {
  return md.replace(/##\s*Sources[\s\S]*$/i, "").trim();
}

function titleFromIntro(intro: string[]) {
  for (const line of intro) {
    const bold = line.match(/\*\*([^*]+)\*\*/);
    if (bold?.[1]) return bold[1].replace(/\s+/g, " ").trim();
    const heading = line.match(/^#{1,3}\s+(.+)/);
    if (heading?.[1]) {
      return heading[1].replace(/\*+/g, "").replace(/\s+/g, " ").trim();
    }
  }
  const first = intro[0]?.replace(/\*+/g, "").replace(/\s+/g, " ").trim() ?? "";
  if (first.length >= 3 && first.length <= 80) return first;
  return "";
}

/** Sync kitchen card from markdown. No model call. */
export function parseRecipeMarkdown(md: string): Extracted | null {
  const cleaned = stripSources(md);
  if (cleaned.length < 40) return null;

  const intro: string[] = [];
  const ingredients: string[] = [];
  const steps: string[] = [];
  let mode: "intro" | "ingredients" | "steps" = "intro";

  for (const raw of cleaned.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (HEAD_ING.test(trimmed)) {
      mode = "ingredients";
      continue;
    }
    if (HEAD_STEPS.test(trimmed)) {
      mode = "steps";
      continue;
    }
    if (mode === "ingredients") {
      const bullet = trimmed.match(BULLET);
      ingredients.push((bullet?.[1] ?? trimmed).trim());
      continue;
    }
    if (mode === "steps") {
      const numbered = trimmed.match(NUMBERED);
      const bullet = trimmed.match(BULLET);
      const text = (numbered?.[1] ?? bullet?.[1] ?? trimmed).trim();
      if (text) steps.push(`${steps.length + 1}. ${text}`);
      continue;
    }
    intro.push(trimmed);
  }

  if (ingredients.length < 2 && steps.length < 2) return null;
  const title = (titleFromIntro(intro) || "Saved recipe").slice(0, 80);
  if (!title) return null;
  return {
    title,
    ingredients: ingredients.join("\n"),
    steps: steps.join("\n"),
  };
}

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
  history: GrokMessage[],
  markdown?: string
): Promise<Extracted | null> {
  const recipe = stripSources(markdown || "") || lastAssistantText(history);
  if (!recipe) return null;

  const local = parseRecipeMarkdown(recipe);
  if (local) return local;

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
