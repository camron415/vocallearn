import ranked from "@/data/common-prompts.json";
import seeds from "@/data/prefix-seeds.json";

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

/** Whole-string prefix only — like search autocomplete, not mid-phrase word match. */
function buildTrie(rows: RankedPrompt[]): TrieNode {
  const root = emptyNode();
  for (const row of rows) {
    const key = fold(row.text);
    if (!key) continue;
    insert(root, key, row);
  }
  return root;
}

const RANKED: RankedPrompt[] = [
  ...(ranked as RankedPrompt[]),
  ...(seeds as RankedPrompt[]),
];

const ROOT = buildTrie(RANKED);

function collect(node: TrieNode, into: RankedPrompt[]) {
  into.push(...node.hits);
  for (const kid of node.kids.values()) collect(kid, into);
}

/** Prefix walk from the start of the prompt. Highest frequency first. */
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

/** Idle composer chips — top prompts by freq, rotated daily. No DB; bundled JSON. */
export function topIdlePrompts(limit: number, seed = 0): string[] {
  const sorted = [...RANKED].sort(
    (a, b) => b.freq - a.freq || a.text.localeCompare(b.text)
  );
  if (!sorted.length || limit <= 0) return [];
  const start = seed % sorted.length;
  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < sorted.length && out.length < limit; i += 1) {
    const text = sorted[(start + i) % sorted.length].text;
    if (seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}
