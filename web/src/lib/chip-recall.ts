/** Closed = short token (Nile, 1776). Open = a sentence in their own words. */

export type ChipRecall = "closed" | "open";

function contentWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w && !/^(the|a|an)$/i.test(w));
}

export function parseChipRecall(raw: string | undefined | null): ChipRecall | undefined {
  const k = (raw ?? "").toLowerCase().trim();
  if (k === "closed" || k === "token" || k === "short") return "closed";
  if (k === "open" || k === "gist" || k === "paraphrase" || k === "sentence") {
    return "open";
  }
  return undefined;
}

export function inferChipRecall(token: string, answer: string): ChipRecall {
  const tokenWords = contentWords(token);
  const answerWords = contentWords(answer);
  if (answerWords.length >= 10) return "open";
  if (tokenWords.length <= 4 && answerWords.length <= 7) return "closed";
  return "open";
}

export function resolveChipRecall(opts: {
  recall?: ChipRecall | string | null;
  token: string;
  answer: string;
}): ChipRecall {
  return parseChipRecall(opts.recall) ?? inferChipRecall(opts.token, opts.answer);
}

export function isOpenRecall(opts: {
  recall?: ChipRecall | string | null;
  token: string;
  answer: string;
}) {
  return resolveChipRecall(opts) === "open";
}
