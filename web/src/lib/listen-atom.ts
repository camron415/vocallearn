/** First sentence / clause for Listen. Cap ~400 chars. Not a full-article dump. */

const ATOM_MAX = 400;

export function listenAtom(plain: string, max = ATOM_MAX): {
  atom: string;
  rest: string;
  truncated: boolean;
} {
  const text = plain.replace(/\s+/g, " ").trim();
  if (!text) return { atom: "", rest: "", truncated: false };
  if (text.length <= max) {
    const cut = firstSentence(text);
    if (cut.end >= text.length) {
      return { atom: text, rest: "", truncated: false };
    }
    return {
      atom: text.slice(0, cut.end).trim(),
      rest: text.slice(cut.end).trim(),
      truncated: true,
    };
  }
  const window = text.slice(0, max);
  const cut = firstSentence(window);
  const end = cut.found ? cut.end : lastSpace(window);
  const atom = text.slice(0, end).trim();
  const rest = text.slice(end).trim();
  return { atom, rest, truncated: rest.length > 0 };
}

function lastSpace(text: string) {
  const at = text.lastIndexOf(" ");
  return at > 40 ? at : text.length;
}

function firstSentence(text: string): { end: number; found: boolean } {
  for (let i = 0; i < text.length - 1; i++) {
    const ch = text[i];
    if (ch !== "." && ch !== "!" && ch !== "?") continue;
    if (isAbbrevDot(text, i)) continue;
    let j = i + 1;
    while (j < text.length && /[\s"”)\]]/.test(text[j])) j += 1;
    if (j >= text.length) return { end: text.length, found: true };
    return { end: j, found: true };
  }
  return { end: text.length, found: false };
}

const ABBREV = new Set(["mr", "mrs", "ms", "dr", "st", "vs", "u.s", "e.g", "i.e"]);

function isAbbrevDot(text: string, dot: number) {
  if (text[dot] !== ".") return false;
  let start = dot - 1;
  while (start >= 0 && /[a-z.]/i.test(text[start])) start -= 1;
  const token = text.slice(start + 1, dot).toLowerCase();
  if (ABBREV.has(token)) return true;
  if (/^[a-z]$/i.test(token)) return true;
  return false;
}
