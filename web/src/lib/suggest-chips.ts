export type SuggestChip = { id: string; label: string; prompt: string };

const PERSONALIZE_AFTER = 5;

const STARTERS: SuggestChip[] = [
  {
    id: "weather",
    label: "What’s the weather this week?",
    prompt:
      "What's the weather this week, in plain terms — today through the weekend, and whether I need a jacket or umbrella.",
  },
  {
    id: "dinner",
    label: "A simple dinner I can make tonight",
    prompt:
      "Suggest a simple dinner I can make tonight with ordinary fridge and pantry food. One main idea, short steps, and a backup if I'm missing an ingredient.",
  },
  {
    id: "news",
    label: "What’s in the news today?",
    prompt:
      "What's in the news today? Give a short, calm briefing: top world stories, US headlines, and anything families might actually feel this week.",
  },
  {
    id: "stain",
    label: "How do I get a stain out of a shirt?",
    prompt:
      "How do I get a common stain out of a shirt at home? Cover food, grease, and sweat, with the safest first step and what not to do.",
  },
  {
    id: "sky",
    label: "Why is the sky blue at dusk?",
    prompt:
      "Why is the sky blue during the day, and what changes at dusk? Keep it clear and concrete, no jargon.",
  },
  {
    id: "bread",
    label: "How do I keep a sourdough starter alive?",
    prompt:
      "How do I keep a sourdough starter alive if I only bake about once a week? Include fridge vs counter, feeding, and signs it's hungry vs dead.",
  },
];

const STOP = new Set([
  "about",
  "after",
  "alive",
  "also",
  "best",
  "does",
  "from",
  "have",
  "help",
  "here",
  "into",
  "just",
  "keep",
  "know",
  "latest",
  "like",
  "make",
  "need",
  "simple",
  "some",
  "than",
  "that",
  "their",
  "them",
  "then",
  "this",
  "today",
  "what",
  "when",
  "where",
  "which",
  "with",
  "would",
  "your",
]);

const TOPIC_PROMPTS: Array<{ test: RegExp; chips: Omit<SuggestChip, "id">[] }> = [
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
        label: "An easy loaf I can bake this weekend",
        prompt:
          "Give me an easy sourdough or simple bread I can bake this weekend, with a short ingredient list and clear steps.",
      },
    ],
  },
  {
    test: /\b(flight|flights|travel|trip|lisbon)/i,
    chips: [
      {
        label: "Cheapest weekend trip from Denver",
        prompt:
          "What are the cheapest realistic weekend trip ideas from Denver in the next couple of months? Name a few cities and why they'd be affordable.",
      },
      {
        label: "What should I pack for 4 days?",
        prompt:
          "What should I pack for a 4-day trip? Keep it to a short, practical list for mixed weather.",
      },
    ],
  },
  {
    test: /\b(dinner|recipe|cook|food|trader)/i,
    chips: [
      {
        label: "What can I cook with a regular fridge?",
        prompt:
          "What can I cook tonight with a regular fridge and pantry? One easy dinner, short steps, no fancy ingredients.",
      },
      {
        label: "A 20-minute weeknight dinner",
        prompt:
          "Give me a 20-minute weeknight dinner. One recipe, everyday ingredients, and how to plate it.",
      },
    ],
  },
  {
    test: /\b(guitar|song|music)/i,
    chips: [
      {
        label: "Easy guitar songs for a beginner",
        prompt:
          "What are easy guitar songs for a beginner? List a few with why they're doable and the first chords to learn.",
      },
    ],
  },
  {
    test: /\b(weather|forecast)/i,
    chips: [
      {
        label: "Will it rain this weekend?",
        prompt:
          "Will it rain this weekend? Give a plain forecast for the next few days and whether outdoor plans make sense.",
      },
    ],
  },
];

function tokensFrom(title: string): string[] {
  const clipped = /(?:…|\.{2,})$/.test(title.trim());
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s&]/g, " ")
    .split(/\s+/)
    .filter((word) => /^[a-z]{5,}$/.test(word) && !STOP.has(word));
  // Clipped titles often end mid-word ("Amon…" from Amazon). Drop that stub.
  return clipped && words.length > 1 ? words.slice(0, -1) : words;
}

function chipsFromHistory(titles: string[]): Omit<SuggestChip, "id">[] {
  const out: Omit<SuggestChip, "id">[] = [];
  const seen = new Set<string>();

  function add(chip: Omit<SuggestChip, "id">) {
    const key = chip.label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(chip);
  }

  for (const { test, chips } of TOPIC_PROMPTS) {
    if (titles.some((title) => test.test(title))) {
      for (const chip of chips) add(chip);
    }
  }

  const counts = new Map<string, number>();
  for (const title of titles) {
    for (const token of tokensFrom(title)) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }

  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([token]) => token);

  for (const token of ranked) {
    if (out.length >= 4) break;
    add({
      label: `What’s new with ${token}?`,
      prompt: `Give a short, practical update on ${token}: what's worth knowing right now, and one simple next step.`,
    });
  }

  return out;
}

/** Home chips: generic for new families, then interest-based questions — not old chats. */
export function suggestChips(titles: string[]): SuggestChip[] {
  const cleaned = titles.map((title) => title.replace(/\s+/g, " ").trim()).filter(Boolean);

  if (cleaned.length < PERSONALIZE_AFTER) {
    return STARTERS;
  }

  const personalized = chipsFromHistory(cleaned);
  const used = new Set(personalized.map((p) => p.label.toLowerCase()));
  const mixed: SuggestChip[] = personalized.map((chip, i) => ({
    ...chip,
    id: `s${i}`,
  }));
  for (const starter of STARTERS) {
    if (mixed.length >= 6) break;
    if (used.has(starter.label.toLowerCase())) continue;
    mixed.push(starter);
  }

  return mixed.slice(0, 6);
}
