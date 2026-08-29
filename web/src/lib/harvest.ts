import type { ChipHeat } from "@/lib/chip-heat";

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
    answer: "Egypt",
    hint: "Gift of the Nile.",
    weight: "cluster",
    cluster: "nile",
    heat: "hot",
    distractors: ["Sudan", "Ethiopia", "Kenya"],
  },
  {
    id: "preview-miles",
    token: "Nile · 4,130 miles",
    span: "4,130 miles",
    kind: "meaning",
    prompt: "About how long is the Nile usually said to be?",
    answer: "4,130 miles",
    hint: "A bit over four thousand.",
    weight: "cluster",
    cluster: "nile",
    heat: "hot",
    distractors: ["2,200 miles", "6,650 km", "1,000 miles"],
  },
];

export const PREVIEW_MORE_CHIP: HarvestChip = {
  id: "preview-herodotus",
  token: "gift of the Nile",
  span: "gift of the Nile",
  kind: "meaning",
  prompt: "What did Herodotus call Egypt?",
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
    answer: "Rome",
    hint: "Same name as the civilization.",
    weight: "cluster",
    cluster: "rome",
    heat: "warm",
    distractors: ["Athens", "Constantinople", "Carthage"],
  },
  {
    id: "preview-476",
    token: "fall of Rome, 476",
    span: "476",
    kind: "when",
    prompt: "In what year did the Western Roman Empire traditionally fall?",
    answer: "476",
    hint: "Late fifth century.",
    weight: "cluster",
    cluster: "rome",
    heat: "warm",
    distractors: ["410", "1453", "27 BC"],
  },
  {
    id: "preview-colosseum",
    token: "Rome’s Colosseum",
    span: "Colosseum",
    kind: "who",
    prompt: "What amphitheater in Rome held gladiator games?",
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
    answer: "The Moon",
    hint: "Earth’s satellite.",
    weight: "cluster",
    cluster: "apollo",
    heat: "rest",
    distractors: ["Mars", "Low Earth orbit", "Tranquility Base only"],
  },
  {
    id: "preview-1969",
    token: "Apollo landing, 1969",
    span: "1969",
    kind: "when",
    prompt: "In what year did Apollo 11 land on the Moon?",
    answer: "1969",
    hint: "Late sixties.",
    weight: "cluster",
    cluster: "apollo",
    heat: "rest",
    distractors: ["1961", "1972", "1957"],
  },
  {
    id: "preview-armstrong",
    token: "first walk on the Moon",
    span: "Armstrong",
    kind: "who",
    prompt: "Who was the first person to walk on the Moon?",
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
    answer: "Paris",
    hint: "The Seine runs through it.",
    weight: "cluster",
    cluster: "paris",
    heat: "hot",
    distractors: ["Lyon", "Marseille", "Brussels"],
  },
  {
    id: "preview-seine",
    token: "Seine through Paris",
    span: "Seine",
    kind: "who",
    prompt: "What river runs through Paris?",
    answer: "The Seine",
    hint: "Not the Nile.",
    weight: "cluster",
    cluster: "paris",
    heat: "hot",
    distractors: ["Loire", "Rhône", "Thames"],
  },
  {
    id: "preview-1889",
    token: "Eiffel, 1889",
    span: "1889",
    kind: "when",
    prompt: "In what year was the Eiffel Tower completed?",
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
    answer: "Beethoven",
    hint: "German composer.",
    weight: "cluster",
    cluster: "ninth",
    heat: "warm",
    distractors: ["Mozart", "Bach", "Haydn"],
  },
  {
    id: "preview-ninth",
    token: "Ode to Joy",
    span: "Ninth",
    kind: "meaning",
    prompt: "Which Beethoven symphony includes Ode to Joy?",
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
    answer: "Tokyo",
    hint: "Honshu.",
    weight: "cluster",
    cluster: "japan",
    heat: "rest",
    distractors: ["Kyoto", "Osaka", "Seoul"],
  },
  {
    id: "preview-fuji",
    token: "Mount Fuji, Japan",
    span: "Fuji",
    kind: "who",
    prompt: "What is Japan’s highest mountain?",
    answer: "Mount Fuji",
    hint: "A volcano.",
    weight: "cluster",
    cluster: "japan",
    heat: "rest",
    distractors: ["Mount Everest", "Kilimanjaro", "Mount Rainier"],
  },
  {
    id: "preview-3776",
    token: "3,776 m",
    span: "3,776 m",
    kind: "meaning",
    prompt: "About how tall is Mount Fuji?",
    answer: "3,776 meters",
    hint: "A bit under four thousand.",
    weight: "cluster",
    cluster: "japan",
    heat: "rest",
    distractors: ["8,849 m", "1,200 m", "5,895 m"],
  },
  {
    id: "preview-1776",
    token: "1776",
    span: "1776",
    kind: "when",
    prompt: "In what year did the United States declare independence?",
    answer: "1776",
    hint: "The Declaration of Independence.",
    weight: "simple",
    heat: "locked",
    distractors: ["1789", "1492", "1865"],
  },
  {
    id: "preview-h2o",
    token: "water is H₂O",
    span: "H2O",
    kind: "meaning",
    prompt: "What is the chemical formula for water?",
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

export function splitHarvestText(
  text: string,
  chips: HarvestChip[],
  claimed?: Set<string>
): HarvestPiece[] {
  if (!text || !chips.length) return [{ type: "text", value: text }];

  const hits: { start: number; end: number; chip: HarvestChip }[] = [];
  const used = claimed ?? new Set<string>();
  const ordered = [...chips].sort(
    (a, b) => (b.span || b.token).length - (a.span || a.token).length
  );

  for (const chip of ordered) {
    const needle = (chip.span || chip.token).trim();
    if (!needle) continue;
    if (used.has(chip.id)) continue;
    const start = text.indexOf(needle);
    if (start < 0) continue;
    const end = start + needle.length;
    if (hits.some((h) => start < h.end && end > h.start)) continue;
    used.add(chip.id);
    hits.push({ start, end, chip });
  }

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

export function harvestMarkdown(md: string, chips: HarvestChip[]): string {
  if (!md || !chips.length) return md;
  const used = new Set<string>();
  const ordered = [...chips].sort(
    (a, b) => (b.span || b.token).length - (a.span || a.token).length
  );
  let out = md;
  for (const chip of ordered) {
    const needle = (chip.span || chip.token).trim();
    if (!needle || used.has(chip.id)) continue;
    const start = out.indexOf(needle);
    if (start < 0) continue;
    used.add(chip.id);
    const link = `[${needle}](harvest://${chip.id}/${chip.kind})`;
    out = `${out.slice(0, start)}${link}${out.slice(start + needle.length)}`;
  }
  return out;
}
