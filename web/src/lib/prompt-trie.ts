import ranked from "@/data/common-prompts.json";

export type RankedPrompt = { text: string; freq: number };

type TrieNode = {
  kids: Map<string, TrieNode>;
  hits: RankedPrompt[];
};

function fold(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/\s+/g, " ");
}

function emptyNode(): TrieNode {
  return { kids: new Map(), hits: [] };
}

function insert(root: TrieNode, key: string, row: RankedPrompt) {
  if (!key) return;
  let node = root;
  for (const ch of key) {
    let next = node.kids.get(ch);
    if (!next) {
      next = emptyNode();
      node.kids.set(ch, next);
    }
    node = next;
  }
  node.hits.push(row);
}

function buildTrie(rows: RankedPrompt[]): TrieNode {
  const root = emptyNode();
  for (const row of rows) {
    const key = fold(row.text);
    if (!key) continue;
    insert(root, key, row);
    for (const match of key.matchAll(/(?:^| )([a-z0-9])/g)) {
      const at = match.index ?? 0;
      const start = match[0].startsWith(" ") ? at + 1 : at;
      if (start > 0) insert(root, key.slice(start), row);
    }
  }
  return root;
}

const ROOT = buildTrie(ranked as RankedPrompt[]);

function collect(node: TrieNode, into: RankedPrompt[]) {
  into.push(...node.hits);
  for (const kid of node.kids.values()) collect(kid, into);
}

/** Prefix walk. Highest frequency first. Empty prefix returns nothing. */
export function matchPrompts(prefix: string, limit = 5): string[] {
  const key = fold(prefix);
  if (!key) return [];
  let node: TrieNode | undefined = ROOT;
  for (const ch of key) {
    node = node.kids.get(ch);
    if (!node) return [];
  }
  const found: RankedPrompt[] = [];
  collect(node, found);
  found.sort((a, b) => b.freq - a.freq || a.text.localeCompare(b.text));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of found) {
    const text = row.text;
    if (seen.has(text)) continue;
    seen.add(text);
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}
