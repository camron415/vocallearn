/** Cleanup + citation helpers for Ask replies. */

export type DisplaySource = { label: string; url: string };

const URL_RE = /https?:\/\/[^\s)]+/i;
const INLINE_CITE_RE = /\[\[(\d+)\]\]\((https?:[^)\s]+)\)/g;
const SOURCES_HEADING_RE = /(?:^|\n)(?:#{1,3}\s*)?Sources:?\s*\n/i;

export function hostnameLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Strip object-replacement junk and images. Keep markdown. */
export function sanitizeModelText(text: string): string {
  const withoutSpecials = Array.from(text)
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      if (code === 0xfffc || code === 0xfffd) return false;
      if (code >= 0xfff0 && code <= 0xffff) return false;
      if (code >= 0xe000 && code <= 0xf8ff) return false;
      if (code < 32 && code !== 9 && code !== 10 && code !== 13) return false;
      return true;
    })
    .join("");

  return withoutSpecials
    .replace(/&#(?:x0*fffc|65532);/gi, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/!\[[^\]]*\]\[[^\]]*\]/g, "")
    .replace(/!\[[^\]]*\]/g, "")
    .replace(/<\/?(?:img|object|figure|picture)\b[^>]*>/gi, "")
    .replace(/\[(?:obj|object|image)\]/gi, "")
    .replace(/^\s*OBJ\s*$/gim, "")
    .replace(/\bOBJ\b/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Plain text for titles and user bubbles. */
export function stripMarkdownForDisplay(text: string): string {
  return sanitizeModelText(text)
    .replace(/\[\[(\d+)\]\]\(([^)]+)\)/g, "[$1]")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/ {2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseSourceBlock(block: string): DisplaySource[] {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const out: DisplaySource[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const match = line.match(URL_RE);
    if (!match) continue;
    const url = match[0].replace(/[.,;]+$/, "");
    if (seen.has(url)) continue;
    seen.add(url);
    const label = line
      .replace(/^\d+[.)]\s*/, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(URL_RE, "")
      .replace(/[—–-]\s*$/g, "")
      .replace(/[()]/g, "")
      .trim();
    out.push({ label: label || hostnameLabel(url), url });
  }

  return out;
}

export function extractLinkedCitations(text: string): DisplaySource[] {
  const out: DisplaySource[] = [];
  const seen = new Set<string>();
  const re = new RegExp(INLINE_CITE_RE.source, "g");
  for (const match of text.matchAll(re)) {
    const url = match[2].trim();
    if (!url.startsWith("http") || seen.has(url)) continue;
    seen.add(url);
    out.push({ label: hostnameLabel(url), url });
  }
  return out;
}

export function splitMessageSources(content: string): {
  body: string;
  sources: DisplaySource[];
} {
  const clean = sanitizeModelText(content);
  const sourcesMatch = clean.match(SOURCES_HEADING_RE);
  if (!sourcesMatch || sourcesMatch.index == null) {
    return { body: clean, sources: extractLinkedCitations(clean) };
  }

  const body = clean.slice(0, sourcesMatch.index).trim();
  const block = clean.slice(sourcesMatch.index + sourcesMatch[0].length).trim();
  const fromBlock = parseSourceBlock(block);
  const fromInline = extractLinkedCitations(body);
  return { body, sources: mergeSources(fromBlock, fromInline) };
}

export function collectSources(content: string): DisplaySource[] {
  return splitMessageSources(content).sources;
}

export function mergeSources(...lists: DisplaySource[][]): DisplaySource[] {
  const out: DisplaySource[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const source of list) {
      const url = source.url.trim();
      if (!url.startsWith("http") || seen.has(url)) continue;
      seen.add(url);
      out.push({
        label:
          source.label && !/^\d+$/.test(source.label)
            ? source.label
            : hostnameLabel(url),
        url,
      });
    }
  }
  return out;
}

function sourcesMarkdown(sources: DisplaySource[]): string {
  const lines = sources.map(
    (source, i) => `${i + 1}. [${source.label}](${source.url})`
  );
  return `## Sources\n\n${lines.join("\n")}`;
}

/** One in-answer Sources heading with every cited URL. */
export function attachSources(
  text: string,
  citations: DisplaySource[]
): string {
  const { body, sources } = splitMessageSources(text);
  const picked = mergeSources(sources, citations).slice(0, 8);
  if (picked.length === 0) return body;
  return `${body}\n\n${sourcesMarkdown(picked)}`;
}

/** Show Sources as a heading while the model is still writing the list. */
export function promoteSourcesHeading(text: string): string {
  return text.replace(SOURCES_HEADING_RE, "\n\n## Sources\n\n");
}

/** Close unclosed markdown so a streaming buffer still renders. */
export function stabilizeMarkdown(src: string): string {
  let s = src;
  const fences = (s.match(/```/g) || []).length;
  if (fences % 2) s += "\n```";

  const withoutFences = s.replace(/```[\s\S]*?```/g, "");
  if ((withoutFences.match(/`/g) || []).length % 2) s += "`";
  if ((withoutFences.match(/\*\*/g) || []).length % 2) s += "**";

  const singles = withoutFences.replace(/\*\*/g, "");
  if ((singles.match(/(^|[^*])\*(?!\*)/g) || []).length % 2) s += "*";

  const opens = (s.match(/\[([^\]]*)\]\([^)]*$/) || [])[0];
  if (opens) s += ")";
  return s;
}

export function linkifyBareCitations(
  body: string,
  sources: DisplaySource[]
): string {
  return body.replace(/(^|[^[])\[(\d+)\](?!\()/g, (full, pre: string, n: string) => {
    const source = sources[Number(n) - 1];
    const href = source?.url || `#src-${n}`;
    return `${pre}[[${n}]](${href})`;
  });
}

export function looksLikeEncryptedBlob(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 40) return false;
  if (/[a-z]{4,}\s+[a-z]{3,}/i.test(trimmed)) return false;
  return /^[A-Za-z0-9+/=\-_.]+$/.test(trimmed.replace(/\s/g, ""));
}
