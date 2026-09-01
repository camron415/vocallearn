export type SuggestChip = { id: string; label: string; prompt: string };

export const CHIP_LABEL_MAX = 52;

/** Evergreen + currently common asks (weather, news, food, sports, watch, money). */
export const GENERIC_POOL: SuggestChip[] = [
  {
    id: "weather",
    label: "What’s the weather this week?",
    prompt:
      "What's the weather this week, in plain terms — today through the weekend, and whether I need a jacket or umbrella.",
  },
  {
    id: "news",
    label: "What’s in the news today?",
    prompt:
      "What's in the news today? Give a short, calm briefing: top world stories, US headlines, and anything families might actually feel this week.",
  },
  {
    id: "dinner",
    label: "What’s a simple dinner for tonight?",
    prompt:
      "Suggest a simple dinner I can make tonight with ordinary fridge and pantry food. One main idea, short steps, and a backup if I'm missing an ingredient.",
  },
  {
    id: "sleep",
    label: "How can I sleep better tonight?",
    prompt:
      "How can I sleep better tonight? Give a few practical steps that actually help — evening routine, screens, caffeine, and what to try if I keep waking up.",
  },
  {
    id: "watch",
    label: "What should I watch this weekend?",
    prompt:
      "What should I watch this weekend? Give a few easy picks across streaming — one comfort show, one movie, one that's trending — with why each is worth it.",
  },
  {
    id: "market",
    label: "How did the market close today?",
    prompt:
      "How did the US stock market close today? Short snapshot of the S&P 500, Nasdaq, and Dow, plus the main drivers.",
  },
  {
    id: "rain",
    label: "Will it rain this weekend?",
    prompt:
      "Will it rain this weekend? Give a plain forecast for the next few days and whether outdoor plans make sense.",
  },
  {
    id: "lunch",
    label: "What’s an easy lunch I can make?",
    prompt:
      "What's an easy lunch I can make at home with ordinary ingredients? One idea, short steps, and a swap if I'm missing something.",
  },
  {
    id: "sports",
    label: "What’s trending in sports today?",
    prompt:
      "What's trending in sports today? A short, calm roundup — World Cup if it's on, plus the main US stories worth knowing.",
  },
  {
    id: "flights",
    label: "Where are cheap flights this month?",
    prompt:
      "Where are cheap flights this month from a typical US city? Name a few realistic trip ideas and why they'd be affordable.",
  },
  {
    id: "wordle",
    label: "What’s a hint for today’s Wordle?",
    prompt:
      "Give a gentle hint for today's Wordle without spoiling the answer — starting letters, a strategy, and one clue.",
  },
  {
    id: "stain",
    label: "How do I get a stain out of a shirt?",
    prompt:
      "How do I get a common stain out of a shirt at home? Cover food, grease, and sweat, with the safest first step and what not to do.",
  },
];

/** Four starters — idle list stays short so chips on the field stay visible. */
export const STARTERS: SuggestChip[] = GENERIC_POOL.slice(0, 4);

const PERSONALIZE_AFTER = 8;

type TopicBucket = {
  /** Broad match — needs two titles unless strong also matches. */
  test: RegExp;
  /** One recent title is enough (e.g. "recipe" in the chat name). */
  strong?: RegExp;
  chips: Omit<SuggestChip, "id">[];
};

const TOPIC_BUCKETS: TopicBucket[] = [
  {
    test: /\b(stock|market|nasdaq|s&p|dow|invest)/i,
    chips: [
      {
        label: "How did the market close today?",
        prompt:
          "How did the US stock market close today? Short snapshot of the S&P 500, Nasdaq, and Dow, plus the main drivers.",
      },
      {
        label: "What’s moving tech stocks this week?",
        prompt:
          "What's moving tech stocks this week? Keep it brief: the big names, the why, and what to watch next.",
      },
    ],
  },
  {
    test: /\b(sourdough|starter|bake|bread)/i,
    chips: [
      {
        label: "How do I know my starter is ready?",
        prompt:
          "How do I know a sourdough starter is ready to bake with? Signs to look for, timing, and what to do if it isn't.",
      },
      {
        label: "What’s an easy loaf for this weekend?",
        prompt:
          "Give me an easy sourdough or simple bread I can bake this weekend, with a short ingredient list and clear steps.",
      },
    ],
  },
  {
    test: /\b(flight|flights|travel|trip|lisbon|vacation)/i,
    chips: [
      {
        label: "What’s a cheap weekend trip from Denver?",
        prompt:
          "What are the cheapest realistic weekend trip ideas from Denver in the next couple of months? Name a few cities and why they'd be affordable.",
      },
      {
        label: "What should I pack for a 4-day trip?",
        prompt:
          "What should I pack for a 4-day trip? Keep it to a short, practical list for mixed weather.",
      },
    ],
  },
  {
    test: /\b(dinner|recipe|cook|meal|kitchen|ingredient)/i,
    strong: /\b(recipe|dinner|cook|meal)\b/i,
    chips: [
      {
        label: "What’s a quick dinner for tonight?",
        prompt:
          "What's a quick dinner I can make tonight with everyday ingredients? One recipe, short steps, no fancy gear.",
      },
      {
        label: "What can I make with what I have?",
        prompt:
          "What can I cook tonight with what's usually in a normal fridge and pantry? One easy dinner and a simple swap if I'm missing something.",
      },
    ],
  },
  {
    test: /\b(guitar|song|music|chord)/i,
    chips: [
      {
        label: "What are easy songs for a beginner guitarist?",
        prompt:
          "What are easy guitar songs for a beginner? List a few with why they're doable and the first chords to learn.",
      },
    ],
  },
  {
    test: /\b(weather|forecast|rain|snow|temperature)/i,
    chips: [
      {
        label: "Will it rain this weekend?",
        prompt:
          "Will it rain this weekend? Give a plain forecast for the next few days and whether outdoor plans make sense.",
      },
      {
        label: "What’s the weather this week?",
        prompt:
          "What's the weather this week, in plain terms — today through the weekend, and whether I need a jacket or umbrella.",
      },
    ],
  },
];

function norm(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function labelKey(label: string) {
  return norm(label).toLowerCase();
}

function topicMatches(bucket: TopicBucket, titles: string[]) {
  const hits = titles.filter((title) => bucket.test.test(title));
  if (hits.length >= 2) return true;
  if (hits.length === 1 && bucket.strong?.test(hits[0])) return true;
  return false;
}

/** Pick one chip per bucket, preferring variety via title hash. */
function pickTopicChip(
  bucket: TopicBucket,
  titles: string[],
  index: number
): Omit<SuggestChip, "id"> {
  const seed = titles.join("|").length + index;
  return bucket.chips[seed % bucket.chips.length];
}

/** Turn a past chat title into a natural follow-up chip when it already reads like a question. */
function chipFromTitle(title: string): Omit<SuggestChip, "id"> | null {
  const clean = norm(title).replace(/(?:…|\.{2,})$/, "").trim();
  if (clean.length < 12 || clean.length > 72) return null;
  if (!/\?/.test(clean)) return null;
  if (!/^(what|how|why|when|where|who|will|can|should|is|are|do|does)\b/i.test(clean)) {
    return null;
  }
  return {
    label: clean,
    prompt: clean.endsWith("?") ? clean : `${clean}?`,
  };
}

function chipsFromHistory(titles: string[]): Omit<SuggestChip, "id">[] {
  const out: Omit<SuggestChip, "id">[] = [];
  const seen = new Set<string>();

  function add(chip: Omit<SuggestChip, "id">) {
    const key = labelKey(chip.label);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(chip);
  }

  // Recent real questions the user already asked — good signals, not weird templates.
  for (const title of titles.slice(0, 4)) {
    const fromTitle = chipFromTitle(title);
    if (fromTitle) add(fromTitle);
    if (out.length >= 2) break;
  }

  // At most one templated chip per interest area, only when history backs it up.
  let topicIndex = 0;
  for (const bucket of TOPIC_BUCKETS) {
    if (!topicMatches(bucket, titles)) continue;
    add(pickTopicChip(bucket, titles, topicIndex));
    topicIndex += 1;
    if (out.length >= 4) break;
  }

  return out;
}

function fillStarters(
  mixed: SuggestChip[],
  used: Set<string>,
  titles: string[]
): SuggestChip[] {
  const seed = titles.reduce((n, t) => n + t.length, 0);
  const offset = seed % STARTERS.length;
  const starters = [...STARTERS.slice(offset), ...STARTERS.slice(0, offset)];

  for (const starter of starters) {
    if (mixed.length >= 4) break;
    if (used.has(labelKey(starter.label))) continue;
    used.add(labelKey(starter.label));
    mixed.push({ ...starter, id: `g${mixed.length}` });
  }
  return mixed;
}

/** Home chips: generic for new users, then a mix of their questions + light topic templates. */
export function suggestChips(titles: string[]): SuggestChip[] {
  const cleaned = titles.map(norm).filter(Boolean);

  if (cleaned.length < PERSONALIZE_AFTER) {
    return STARTERS;
  }

  const personalized = chipsFromHistory(cleaned);
  const used = new Set(personalized.map((p) => labelKey(p.label)));
  const mixed: SuggestChip[] = personalized.map((chip, i) => ({
    ...chip,
    id: `s${i}`,
  }));

  return fillStarters(mixed, used, cleaned).slice(0, 4);
}
