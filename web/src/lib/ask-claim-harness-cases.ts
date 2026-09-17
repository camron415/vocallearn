/**
 * Discovery-loop A/B pack for cue uniqueness + short remember asks.
 * Recipes are out. Live feeds / chat stay as skip controls.
 */
import type { MinerCardJson } from "@/lib/learn-mine";
import type { AskJob, AskKind } from "@/lib/ask-intent";

export type ClaimKnownRow = {
  prompt?: string;
  token?: string;
  answer?: string;
};

export type ClaimHarnessCase = {
  id: string;
  prompt: string;
  prior?: string;
  reply: string;
  /** When set, merge this classify JSON over fallback (same as TurnPlan). */
  classifyJson?: string;
  miner?: {
    cards: MinerCardJson[];
    knownRows?: ClaimKnownRow[];
    expectTokens: string[];
  };
  expect: {
    job: AskJob;
    harvest: boolean;
    skip: boolean;
    /** Regex/timeout floor, no classify. */
    regexSkip?: boolean;
    askKind?: AskKind;
    recall?: "closed" | "open";
  };
  note: string;
};

function closed(
  prompt: string,
  answer: string,
  kind: "when" | "where" | "who" | "meaning",
  distractors: [string, string, string],
  extras?: Partial<MinerCardJson>
): MinerCardJson {
  return {
    prompt,
    answer,
    token: extras?.token ?? answer.replace(/^the /i, ""),
    span: extras?.span ?? (extras?.token ?? answer.replace(/^the /i, "")),
    kind,
    recall: "closed",
    distractors,
    ...extras,
  };
}

const JUPITER_REPLY =
  "Jupiter is the largest planet in the solar system. It is also the first gas giant past the asteroid belt.";
const NILE_REPLY =
  "The Nile is usually named the longest river in the world. Tradition ties the lower Nile to Egypt. The Nile is about 4,130 miles long.";
const GETTY_REPLY =
  "The Battle of Gettysburg was fought in 1863 in Pennsylvania.";
const PHOTO_REPLY =
  "Photosynthesis is how plants make food from sunlight, water, and carbon dioxide, and they release oxygen as they do it.";

export const ASK_CLAIM_HARNESS_CASES: ClaimHarnessCase[] = [
  {
    id: "skip-hi",
    prompt: "hi",
    reply: "Hello — what would you like to know?",
    expect: { job: "chat", harvest: false, skip: true, regexSkip: true },
    note: "Greeting is chat, not Keep.",
  },
  {
    id: "skip-smash",
    prompt: "asdfghjklqwertyuiopzxcvbnm",
    reply: "That looks like a keyboard smash.",
    expect: { job: "chat", harvest: false, skip: true, regexSkip: true },
    note: "Smash never Keep.",
  },
  {
    id: "skip-weather",
    prompt: "What's the weather in Denver today please?",
    reply: "Sunny, high of 82 degrees this afternoon.",
    expect: { job: "live", harvest: false, skip: true, regexSkip: true },
    note: "Live weather skip.",
  },
  {
    id: "skip-news",
    prompt: "What's in the news today around the world?",
    reply: "Headlines today include a summit in Europe.",
    expect: { job: "live", harvest: false, skip: true, regexSkip: true },
    note: "News skip.",
  },
  {
    id: "skip-stocks",
    prompt: "How did the stock market close today?",
    reply: "The S&P 500 closed up 0.8% as of market close.",
    expect: { job: "live", harvest: false, skip: true, regexSkip: true },
    note: "Markets skip.",
  },
  {
    id: "skip-typo-ack",
    prompt: "Oh I said sweet, it was a typo",
    prior: "why is the sky blue",
    reply: "Okay — you meant something else. What would you like to know?",
    classifyJson: `{"job":"chat","freshness":"weights","feedDomain":null,"answerMode":"practical","primaryAsk":"typo acknowledgement","topicKey":null,"maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    expect: { job: "chat", harvest: false, skip: true, regexSkip: true },
    note: "Typo meta after a fact ask must not Keep.",
  },
  {
    id: "closed-utah",
    prompt: "What is the capital of Utah?",
    reply: "The capital of Utah is Salt Lake City.",
    miner: {
      cards: [
        closed("What is the capital of Utah?", "Salt Lake City", "where", [
          "Provo",
          "Ogden",
          "Moab",
        ]),
      ],
      expectTokens: ["Salt Lake City"],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
      askKind: "where",
      recall: "closed",
    },
    note: "Closed place lookup.",
  },
  {
    id: "closed-gettysburg",
    prompt: "When was the Battle of Gettysburg?",
    reply: GETTY_REPLY,
    miner: {
      cards: [
        closed("When was the Battle of Gettysburg?", "1863", "when", [
          "1861",
          "1865",
          "1812",
        ]),
      ],
      expectTokens: ["1863"],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
      askKind: "when",
      recall: "closed",
    },
    note: "Closed year.",
  },
  {
    id: "closed-austen",
    prompt: "Who wrote Pride and Prejudice?",
    reply: "Jane Austen wrote Pride and Prejudice.",
    miner: {
      cards: [
        closed("Who wrote Pride and Prejudice?", "Jane Austen", "who", [
          "Charlotte Bronte",
          "Emily Dickinson",
          "George Eliot",
        ]),
      ],
      expectTokens: ["Jane Austen"],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
      askKind: "who",
      recall: "closed",
    },
    note: "Closed who.",
  },
  {
    id: "closed-jupiter",
    prompt: "What is the largest planet in the solar system?",
    reply: JUPITER_REPLY,
    miner: {
      cards: [
        closed(
          "What is the largest planet in the solar system?",
          "Jupiter",
          "meaning",
          ["Saturn", "Neptune", "Earth"]
        ),
      ],
      expectTokens: ["Jupiter"],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
      askKind: "meaning",
      recall: "closed",
    },
    note: "One-word closed meaning is Keep.",
  },
  {
    id: "closed-typo-ruel",
    prompt: "what is the golden ruel",
    reply:
      "The Golden Rule is treat others as you would like to be treated.",
    miner: {
      cards: [
        closed("What is the Golden Rule?", "Golden Rule", "meaning", [
          "Silver Rule",
          "Iron Law",
          "Five Precepts",
        ]),
      ],
      expectTokens: ["Golden Rule"],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
      recall: "closed",
    },
    note: "Typo inside a real fact ask still remember.",
  },
  {
    id: "closed-typo-planit",
    prompt: "What is the largest planit in the solar system?",
    reply: JUPITER_REPLY,
    miner: {
      cards: [
        closed(
          "What is the largest planet in the solar system?",
          "Jupiter",
          "meaning",
          ["Saturn", "Neptune", "Earth"]
        ),
      ],
      expectTokens: ["Jupiter"],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
      recall: "closed",
    },
    note: "planit typo still a planet ask.",
  },
  {
    id: "short-jupiter-follow",
    prompt: "Jupiter",
    prior: "What is the largest planet in the solar system?",
    reply: JUPITER_REPLY,
    classifyJson: `{"job":"remember","freshness":"weights","feedDomain":null,"askKind":"meaning","answerMode":"direct","primaryAsk":"largest planet","topicKey":"jupiter","maxChips":2,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    miner: {
      cards: [
        closed(
          "What is the largest planet in the solar system?",
          "Jupiter",
          "meaning",
          ["Saturn", "Neptune", "Earth"]
        ),
      ],
      expectTokens: ["Jupiter"],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
      regexSkip: true,
      recall: "closed",
    },
    note: "One-word follow-up: regex would skip, classify remember Keeps.",
  },
  {
    id: "short-nile",
    prompt: "Nile",
    prior: "What is usually named as the longest river in the world?",
    reply: NILE_REPLY,
    classifyJson: `{"job":"remember","freshness":"weights","feedDomain":null,"askKind":"who","answerMode":"direct","primaryAsk":"longest river","topicKey":"nile","maxChips":2,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    miner: {
      cards: [
        closed(
          "What is usually named as the longest river in the world?",
          "The Nile",
          "who",
          ["Amazon", "Yangtze", "Mississippi"],
          { token: "Nile", span: "Nile" }
        ),
      ],
      expectTokens: ["Nile"],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
      regexSkip: true,
      recall: "closed",
    },
    note: "4-letter follow-up still Keep when classify remembers.",
  },
  {
    id: "open-sky",
    prompt: "why is the sky blue",
    reply:
      "The sky looks blue because of Rayleigh scattering in Earth's atmosphere, which sends shorter blue wavelengths toward your eyes more than red.",
    miner: {
      cards: [
        {
          prompt: "Why does the sky look blue?",
          answer:
            "Rayleigh scattering sends shorter blue wavelengths toward your eyes more than red light does.",
          token: "Rayleigh scattering",
          span: "Rayleigh scattering",
          kind: "meaning",
          recall: "open",
          distractors: [],
        },
      ],
      expectTokens: ["Rayleigh scattering"],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
      recall: "open",
    },
    note: "How/why open gist budget.",
  },
  {
    id: "open-photo",
    prompt: "How does photosynthesis work?",
    reply: PHOTO_REPLY,
    miner: {
      cards: [
        {
          prompt: "How do plants make food?",
          answer:
            "Photosynthesis is how plants make food from sunlight, water, and carbon dioxide.",
          token: "photosynthesis",
          span: "photosynthesis",
          kind: "meaning",
          recall: "open",
          distractors: [],
        },
      ],
      expectTokens: ["photosynthesis"],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
      recall: "open",
    },
    note: "Open gist with topic in the sentence.",
  },
  {
    id: "uniq-jupiter-parallel",
    prompt: "Which is the first gas giant past the asteroid belt?",
    reply: JUPITER_REPLY,
    miner: {
      knownRows: [
        {
          prompt: "What is the largest planet in the solar system?",
          token: "Jupiter",
          answer: "Jupiter",
        },
      ],
      cards: [
        closed(
          "Which is the first gas giant past the asteroid belt?",
          "Jupiter",
          "meaning",
          ["Saturn", "Uranus", "Neptune"]
        ),
      ],
      expectTokens: ["Jupiter"],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
      recall: "closed",
    },
    note: "Same answer, different cue — second Keep.",
  },
  {
    id: "uniq-jupiter-restate",
    prompt: "What is the largest planet?",
    reply: JUPITER_REPLY,
    miner: {
      knownRows: [
        {
          prompt: "What is the largest planet in the solar system?",
          token: "Jupiter",
          answer: "Jupiter",
        },
      ],
      cards: [
        closed("What is the largest planet?", "Jupiter", "meaning", [
          "Saturn",
          "Neptune",
          "Earth",
        ]),
      ],
      expectTokens: [],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
      recall: "closed",
    },
    note: "Restated cue — do not mint a twin.",
  },
  {
    id: "uniq-token-no-block",
    prompt: "What is the largest planet in the solar system?",
    reply: JUPITER_REPLY,
    miner: {
      knownRows: [{ token: "Jupiter", answer: "Jupiter" }],
      cards: [
        closed(
          "What is the largest planet in the solar system?",
          "Jupiter",
          "meaning",
          ["Saturn", "Neptune", "Earth"]
        ),
      ],
      expectTokens: ["Jupiter"],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
      recall: "closed",
    },
    note: "Token-only library row must not block the cue.",
  },
  {
    id: "uniq-nile-miles",
    prompt: "How long is the Nile in miles?",
    reply: NILE_REPLY,
    miner: {
      knownRows: [
        {
          prompt: "What is usually named as the longest river in the world?",
          token: "Nile",
          answer: "The Nile",
        },
      ],
      cards: [
        closed("How long is the Nile in miles?", "4,130 miles", "meaning", [
          "2,200 miles",
          "3,700 miles",
          "1,000 miles",
        ]),
      ],
      expectTokens: ["4,130 miles"],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
      recall: "closed",
    },
    note: "Known Nile name does not block Nile length.",
  },
  {
    id: "uniq-nile-restate-keeps-egypt",
    prompt: "Why is the Nile usually named as the longest river in the world?",
    reply: NILE_REPLY,
    miner: {
      knownRows: [
        {
          prompt: "What is usually named as the longest river in the world?",
          token: "Nile",
          answer: "The Nile",
        },
      ],
      cards: [
        closed(
          "What is usually named as the longest river in the world?",
          "The Nile",
          "who",
          ["Amazon", "Yangtze", "Mississippi"],
          { token: "Nile", span: "Nile" }
        ),
        closed(
          "Which country is most associated with the lower Nile?",
          "Egypt",
          "where",
          ["Sudan", "Ethiopia", "Libya"]
        ),
      ],
      expectTokens: ["Egypt"],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
    },
    note: "Restated Nile cue drops; Egypt support still lands.",
  },
  {
    id: "uniq-gettysburg-pair",
    prompt: "Tell me about the Battle of Gettysburg",
    reply: GETTY_REPLY,
    miner: {
      cards: [
        closed("When was the Battle of Gettysburg?", "1863", "when", [
          "1861",
          "1865",
          "1812",
        ]),
        closed("Where was the Battle of Gettysburg?", "Pennsylvania", "where", [
          "Virginia",
          "Maryland",
          "Ohio",
        ]),
      ],
      expectTokens: ["1863", "Pennsylvania"],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
    },
    note: "When vs where stay two cues, even on one battle.",
  },
  {
    id: "uniq-cue-conflict",
    prompt: "What is the capital of France?",
    reply: "The capital of France is Paris, not Lyon.",
    miner: {
      cards: [
        closed("What is the capital of France?", "Paris", "where", [
          "Lyon",
          "Marseille",
          "Nice",
        ]),
        closed("What is the capital of France?", "Lyon", "where", [
          "Paris",
          "Marseille",
          "Nice",
        ]),
      ],
      expectTokens: ["Paris"],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
      recall: "closed",
    },
    note: "Same cue, second answer is a conflict — keep the first.",
  },
  {
    id: "open-restate",
    prompt: "How do plants make food?",
    reply: PHOTO_REPLY,
    miner: {
      knownRows: [
        {
          prompt: "How does photosynthesis work?",
          token: "photosynthesis",
          answer:
            "Photosynthesis is how plants make food from sunlight, water, and carbon dioxide.",
        },
      ],
      cards: [
        {
          prompt: "How does photosynthesis work?",
          answer:
            "Photosynthesis is how plants make food from sunlight, water, and carbon dioxide.",
          token: "photosynthesis",
          span: "photosynthesis",
          kind: "meaning",
          recall: "open",
          distractors: [],
        },
      ],
      expectTokens: [],
    },
    expect: {
      job: "remember",
      harvest: true,
      skip: false,
      recall: "open",
    },
    note: "Open gist follows the cue. Same how/why does not twin.",
  },
];
