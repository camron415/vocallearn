import type { ChipHeat } from "@/lib/chip-heat";
import type { ChipRecall } from "@/lib/chip-recall";

export type ChipKind = "when" | "where" | "who" | "meaning";
export type ChipWeight = "simple" | "cluster";
/** Home = due. Keep = not due. Mastered = shelf (later). */
export type ChipSeat = "home" | "keep" | "mastered";

export type HarvestChip = {
  id: string;
  token: string;
  span: string;
  kind: ChipKind;
  prompt: string;
  /** Second r3 SAY question. Never equal to prompt. Never use hint as the prompt. */
  promptB?: string;
  answer: string;
  hint?: string;
  weight?: ChipWeight;
  /** Facts from one Ask. Related chips share a cluster. */
  cluster?: string;
  /** Preview / Home readiness. Live Learn will map this from SM-2. */
  heat?: ChipHeat;
  /** Where the chip lives. Harvest defaults to keep. See web/HALO-LOOP.md. */
  seat?: ChipSeat;
  /** Times this chip was cleared. Three oks → mastered (Lab MVP). */
  clears?: number;
  lastResult?: "ok" | "miss";
  dueAt?: number;
  /** When the fact first landed in Keep. Sort chrono within a rank. */
  keptAt?: number;
  /** Same-kind wrong answers for recognize. Color cannot leak the pick. */
  distractors?: string[];
  /** Closed token vs open gist. V2 harvest keeps closed only. */
  recall?: ChipRecall;
  /** Source Ask this fact was harvested from. Hold-to-open on Home. */
  askId?: string;
};

export function parseChipKind(raw: string | undefined | null): ChipKind {
  const k = (raw ?? "").toLowerCase().trim();
  if (k === "when" || k === "date" || k === "duration" || k === "year") return "when";
  if (k === "where" || k === "place") return "where";
  if (k === "who" || k === "who/what" || k === "name" || k === "what") return "who";
  return "meaning";
}

export const KIND_LABEL: Record<ChipKind, string> = {
  when: "When",
  where: "Where",
  who: "Who",
  meaning: "Meaning",
};

/** Nile pack so /preview chat can harvest three tones without a live model. */
export const PREVIEW_HARVEST_REPLY = `The **Nile** is usually named as the longest river in the world. It runs north through **Egypt** for about **4,130 miles** and empties into the Mediterranean.

Herodotus called Egypt “the gift of the Nile.”`;

export const PREVIEW_HARVEST_CHIPS: HarvestChip[] = [
  {
    id: "preview-nile",
    token: "Nile",
    span: "Nile",
    kind: "who",
    prompt: "What is usually named as the longest river in the world?",
    promptB: "Which river is usually named the longest in the world?",
    answer: "The Nile",
    hint: "It runs through Egypt.",
    weight: "cluster",
    cluster: "nile",
    heat: "hot",
    distractors: ["Amazon", "Yangtze", "Mississippi"],
  },
  {
    id: "preview-egypt",
    token: "Egypt",
    span: "Egypt",
    kind: "where",
    prompt: "Which country is most associated with the lower Nile?",
    promptB: "The lower Nile is most associated with which country?",
    answer: "Egypt",
    hint: "Gift of the Nile.",
    weight: "cluster",
    cluster: "nile",
    heat: "hot",
    distractors: ["Sudan", "Ethiopia", "Kenya"],
  },
  {
    id: "preview-miles",
    token: "4,130 miles",
    span: "4,130 miles",
    kind: "meaning",
    prompt: "About how long is the Nile usually said to be?",
    promptB: "How many miles long is the Nile usually said to be?",
    answer: "4,130 miles",
    hint: "A bit over four thousand.",
    weight: "cluster",
    cluster: "nile",
    heat: "hot",
    distractors: ["2,200 miles", "3,400 miles", "1,000 miles"],
  },
];

export const PREVIEW_MORE_CHIP: HarvestChip = {
  id: "preview-herodotus",
  token: "gift of the Nile",
  span: "gift of the Nile",
  kind: "meaning",
  prompt: "What did Herodotus call Egypt?",
  promptB: "Herodotus’s famous phrase for Egypt was what?",
  answer: "The gift of the Nile",
  hint: "The river made the land.",
  weight: "cluster",
  cluster: "nile",
  heat: "hot",
  distractors: ["breadbasket of Africa", "cradle of kings", "land of the delta"],
};

/** Home preview pool: up to 20 facts; mixer hard-caps display at 16. */
export const PREVIEW_HOME_CHIPS: HarvestChip[] = [
  ...PREVIEW_HARVEST_CHIPS,
  PREVIEW_MORE_CHIP,
  {
    id: "preview-rome",
    token: "Rome",
    span: "Rome",
    kind: "where",
    prompt: "Which city was the capital of the Roman Empire in the west?",
    promptB: "What western capital did the Roman Empire use?",
    answer: "Rome",
    hint: "Same name as the civilization.",
    weight: "cluster",
    cluster: "rome",
    heat: "warm",
    distractors: ["Athens", "Constantinople", "Carthage"],
  },
  {
    id: "preview-476",
    token: "476",
    span: "476",
    kind: "when",
    prompt: "In what year did the Western Roman Empire traditionally fall?",
    promptB: "Give the traditional year the Western Roman Empire fell.",
    answer: "476",
    hint: "Late fifth century.",
    weight: "cluster",
    cluster: "rome",
    heat: "warm",
    distractors: ["410", "1453", "330"],
  },
  {
    id: "preview-colosseum",
    token: "The Colosseum",
    span: "Colosseum",
    kind: "who",
    prompt: "What amphitheater in Rome held gladiator games?",
    promptB: "Rome’s gladiator amphitheater is called what?",
    answer: "The Colosseum",
    hint: "Also called the Flavian Amphitheatre.",
    weight: "cluster",
    cluster: "rome",
    heat: "warm",
    distractors: ["Pantheon", "Forum", "Circus Maximus"],
  },
  {
    id: "preview-moon",
    token: "Moon",
    span: "Moon",
    kind: "where",
    prompt: "Where did Apollo 11 land in 1969?",
    promptB: "Apollo 11 landed where in 1969?",
    answer: "The Moon",
    hint: "Earth’s satellite.",
    weight: "cluster",
    cluster: "apollo",
    heat: "rest",
    distractors: ["Mars", "Venus", "Titan"],
  },
  {
    id: "preview-1969",
    token: "1969",
    span: "1969",
    kind: "when",
    prompt: "In what year did Apollo 11 land on the Moon?",
    promptB: "Give the year of the Apollo 11 Moon landing.",
    answer: "1969",
    hint: "Late sixties.",
    weight: "cluster",
    cluster: "apollo",
    heat: "rest",
    distractors: ["1961", "1972", "1957"],
  },
  {
    id: "preview-armstrong",
    token: "Neil Armstrong",
    span: "Armstrong",
    kind: "who",
    prompt: "Who was the first person to walk on the Moon?",
    promptB: "Which astronaut first walked on the Moon?",
    answer: "Neil Armstrong",
    hint: "Apollo 11.",
    weight: "cluster",
    cluster: "apollo",
    heat: "rest",
    distractors: ["Buzz Aldrin", "Yuri Gagarin", "John Glenn"],
  },
  {
    id: "preview-paris",
    token: "Paris",
    span: "Paris",
    kind: "where",
    prompt: "What is the capital of France?",
    promptB: "France’s capital city is which city?",
    answer: "Paris",
    hint: "The Seine runs through it.",
    weight: "cluster",
    cluster: "paris",
    heat: "hot",
    distractors: ["Lyon", "Marseille", "Brussels"],
  },
  {
    id: "preview-seine",
    token: "The Seine",
    span: "Seine",
    kind: "who",
    prompt: "What river runs through Paris?",
    promptB: "Paris sits on which river?",
    answer: "The Seine",
    hint: "Not the Nile.",
    weight: "cluster",
    cluster: "paris",
    heat: "hot",
    distractors: ["Loire", "Rhône", "Thames"],
  },
  {
    id: "preview-1889",
    token: "1889",
    span: "1889",
    kind: "when",
    prompt: "In what year was the Eiffel Tower completed?",
    promptB: "Give the year the Eiffel Tower was completed.",
    answer: "1889",
    hint: "Paris world’s fair.",
    weight: "cluster",
    cluster: "paris",
    heat: "hot",
    distractors: ["1789", "1900", "1851"],
  },
  {
    id: "preview-beethoven",
    token: "Beethoven",
    span: "Beethoven",
    kind: "who",
    prompt: "Who wrote the Ninth Symphony?",
    promptB: "The Ninth Symphony was written by whom?",
    answer: "Beethoven",
    hint: "German composer.",
    weight: "cluster",
    cluster: "ninth",
    heat: "warm",
    distractors: ["Mozart", "Bach", "Haydn"],
  },
  {
    id: "preview-ninth",
    token: "The Ninth",
    span: "Ninth",
    kind: "meaning",
    prompt: "Which Beethoven symphony includes Ode to Joy?",
    promptB: "Ode to Joy appears in which Beethoven symphony?",
    answer: "The Ninth",
    hint: "His last complete symphony.",
    weight: "cluster",
    cluster: "ninth",
    heat: "warm",
    distractors: ["Fifth", "Sixth", "Third"],
  },
  {
    id: "preview-tokyo",
    token: "Tokyo",
    span: "Tokyo",
    kind: "where",
    prompt: "What is the capital of Japan?",
    promptB: "Which city is the capital of Japan?",
    answer: "Tokyo",
    hint: "Honshu.",
    weight: "cluster",
    cluster: "japan",
    heat: "rest",
    distractors: ["Kyoto", "Osaka", "Seoul"],
  },
  {
    id: "preview-fuji",
    token: "Mount Fuji",
    span: "Fuji",
    kind: "who",
    prompt: "What is Japan’s highest mountain?",
    promptB: "Japan’s highest mountain is which mountain?",
    answer: "Mount Fuji",
    hint: "A volcano.",
    weight: "cluster",
    cluster: "japan",
    heat: "rest",
    distractors: ["Mount Everest", "Kilimanjaro", "Mount Rainier"],
  },
  {
    id: "preview-3776",
    token: "3,776 meters",
    span: "3,776 m",
    kind: "meaning",
    prompt: "About how tall is Mount Fuji?",
    promptB: "Give Mount Fuji’s height in meters.",
    answer: "3,776 meters",
    hint: "A bit under four thousand.",
    weight: "cluster",
    cluster: "japan",
    heat: "rest",
    distractors: ["8,849 meters", "1,200 meters", "5,895 meters"],
  },
  {
    id: "preview-1776",
    token: "1776",
    span: "1776",
    kind: "when",
    prompt: "In what year did the United States declare independence?",
    promptB: "Give the year the United States declared independence.",
    answer: "1776",
    hint: "The Declaration of Independence.",
    weight: "simple",
    heat: "locked",
    distractors: ["1789", "1492", "1865"],
  },
  {
    id: "preview-h2o",
    token: "H2O",
    span: "H2O",
    kind: "meaning",
    prompt: "What is the chemical formula for water?",
    promptB: "Water’s chemical formula is what?",
    answer: "H2O",
    hint: "Two hydrogens, one oxygen.",
    weight: "simple",
    heat: "locked",
    distractors: ["CO₂", "O₂", "NaCl"],
  },
];

export type HarvestPiece =
  | { type: "text"; value: string }
  | { type: "chip"; value: string; chip: HarvestChip };

export type HarvestNeedleHit = { start: number; end: number; text: string };

function harvestNeedles(chip: Pick<HarvestChip, "span" | "token" | "answer">) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [chip.span, chip.token, chip.answer]) {
    const needle = (raw ?? "").trim();
    if (!needle || seen.has(needle)) continue;
    seen.add(needle);
    out.push(needle);
  }
  return out.sort((a, b) => b.length - a.length);
}

function sliceHit(
  haystack: string,
  start: number,
  length: number
): HarvestNeedleHit | null {
  if (start < 0 || length <= 0) return null;
  return {
    start,
    end: start + length,
    text: haystack.slice(start, start + length),
  };
}

function stripMdMap(src: string): { text: string; map: number[] } {
  const chars: string[] = [];
  const map: number[] = [];
  let i = 0;
  while (i < src.length) {
    if (src.startsWith("**", i)) {
      i += 2;
      continue;
    }
    if (src[i] === "*" || src[i] === "`") {
      i += 1;
      continue;
    }
    if (src[i] === "[") {
      const close = src.indexOf("](", i);
      const end = close >= 0 ? src.indexOf(")", close) : -1;
      if (close > i && end > close) {
        for (let j = i + 1; j < close; j++) {
          chars.push(src[j]);
          map.push(j);
        }
        i = end + 1;
        continue;
      }
    }
    chars.push(src[i]);
    map.push(i);
    i += 1;
  }
  return { text: chars.join(""), map };
}

function findByFactKey(haystack: string, needle: string): HarvestNeedleHit | null {
  const key = harvestFactKey(needle);
  if (key.length < 3) return null;
  const tokens = key.split(/\s+/).filter(Boolean);
  const pattern = tokens
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[^a-z0-9]+");
  const match = haystack.match(
    new RegExp(`(?<![a-z0-9])${pattern}(?![a-z0-9])`, "i")
  );
  if (match?.index == null) return null;
  return sliceHit(haystack, match.index, match[0].length);
}

function findByDigits(haystack: string, needle: string): HarvestNeedleHit | null {
  const digits = needle.replace(/\D/g, "");
  if (digits.length < 4) return null;
  const re = /\d[\d,.\s]*\d/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(haystack))) {
    if (match[0].replace(/\D/g, "") === digits) {
      return sliceHit(haystack, match.index, match[0].length);
    }
  }
  return null;
}

/** Closest on-screen span for a chip — exact, case-fold, markdown-stripped, then fact key. */
export function findHarvestNeedle(
  haystack: string,
  chip: Pick<HarvestChip, "span" | "token" | "answer">
): HarvestNeedleHit | null {
  if (!haystack) return null;
  const needles = harvestNeedles(chip);
  if (!needles.length) return null;

  for (const needle of needles) {
    const hit = sliceHit(haystack, haystack.indexOf(needle), needle.length);
    if (hit) return hit;
  }
  const folded = haystack.toLowerCase();
  for (const needle of needles) {
    const hit = sliceHit(
      haystack,
      folded.indexOf(needle.toLowerCase()),
      needle.length
    );
    if (hit) return hit;
  }

  const stripped = stripMdMap(haystack);
  const strippedFolded = stripped.text.toLowerCase();
  for (const needle of needles) {
    let at = stripped.text.indexOf(needle);
    if (at < 0) at = strippedFolded.indexOf(needle.toLowerCase());
    if (at < 0 || !stripped.map.length) continue;
    const start = stripped.map[at];
    const endIndex = stripped.map[at + needle.length - 1];
    if (start == null || endIndex == null) continue;
    return {
      start,
      end: endIndex + 1,
      text: haystack.slice(start, endIndex + 1),
    };
  }

  for (const needle of needles) {
    const hit = findByFactKey(haystack, needle) ?? findByDigits(haystack, needle);
    if (hit) return hit;
  }
  return null;
}

function collectHarvestHits(text: string, chips: HarvestChip[], claimed?: Set<string>) {
  const hits: { start: number; end: number; chip: HarvestChip }[] = [];
  const used = claimed ?? new Set<string>();
  const ordered = [...chips].sort(
    (a, b) => (b.span || b.token).length - (a.span || a.token).length
  );
  for (const chip of ordered) {
    if (used.has(chip.id)) continue;
    const hit = findHarvestNeedle(text, chip);
    if (!hit) continue;
    if (hits.some((other) => hit.start < other.end && hit.end > other.start)) {
      continue;
    }
    used.add(chip.id);
    hits.push({ start: hit.start, end: hit.end, chip });
  }
  return hits;
}

export function splitHarvestText(
  text: string,
  chips: HarvestChip[],
  claimed?: Set<string>
): HarvestPiece[] {
  if (!text || !chips.length) return [{ type: "text", value: text }];

  const hits = collectHarvestHits(text, chips, claimed);

  hits.sort((a, b) => a.start - b.start);
  if (!hits.length) return [{ type: "text", value: text }];

  const pieces: HarvestPiece[] = [];
  let cursor = 0;
  for (const hit of hits) {
    if (hit.start > cursor) {
      pieces.push({ type: "text", value: text.slice(cursor, hit.start) });
    }
    pieces.push({
      type: "chip",
      value: text.slice(hit.start, hit.end),
      chip: hit.chip,
    });
    cursor = hit.end;
  }
  if (cursor < text.length) {
    pieces.push({ type: "text", value: text.slice(cursor) });
  }
  return pieces;
}

/** Fold for harvest dedupe — ignore case, punctuation, and a leading "the". */
export function harvestFactKey(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^the /, "")
    .trim();
}

export function sameHarvestFact(
  a: Pick<HarvestChip, "token" | "answer">,
  b: Pick<HarvestChip, "token" | "answer">
) {
  const keys = (chip: Pick<HarvestChip, "token" | "answer">) =>
    [harvestFactKey(chip.token), harvestFactKey(chip.answer)].filter(Boolean);
  const have = new Set(keys(a));
  return keys(b).some((key) => have.has(key));
}

function harvestSeatLooksDue(chip: HarvestChip) {
  if (chip.seat === "home" || chip.seat === "mastered") return true;
  if (chip.seat === "keep") return false;
  if (chip.heat === "rest" || chip.heat === "locked") return false;
  return Boolean(chip.heat);
}

/** Lab Chat must not restamp a due/gold chip off Home. */
export function existingDueHarvest(
  existing: HarvestChip[],
  incoming: HarvestChip
) {
  return existing.find(
    (chip) =>
      (chip.id === incoming.id || sameHarvestFact(chip, incoming)) &&
      harvestSeatLooksDue(chip)
  );
}

export function harvestMarkdown(md: string, chips: HarvestChip[]): string {
  if (!md || !chips.length) return md;
  const hits = collectHarvestHits(md, chips);
  if (!hits.length) return md;
  hits.sort((a, b) => b.start - a.start);
  let out = md;
  for (const hit of hits) {
    const text = out.slice(hit.start, hit.end);
    const link = `[${text}](harvest://${hit.chip.id}/${hit.chip.kind})`;
    out = `${out.slice(0, hit.start)}${link}${out.slice(hit.end)}`;
  }
  return out;
}
