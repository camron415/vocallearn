import { fallbackAskIntent, parseAskIntent } from "@/lib/ask-intent";
import { mineLearnFromReply } from "@/lib/learn-mine";
import { skipHarvestTurn } from "@/lib/harvest-policy";
import type { AskIntent } from "@/lib/ask-intent";
import type { HarvestChipDraft } from "@/lib/learn-mine";

export type FamilyReviewCase = {
  id: string;
  question: string;
  cannedReply: string;
  wantSkip: boolean;
  wantOpen: boolean;
  expectTokens: string[];
  forbidTokens?: string[];
  note: string;
  /** When set, dry pack tests classify merge instead of regex-only fallback. */
  classifyJson?: string;
};

/** Cheap harvest QA pack for family demo. Canned replies — miner spend only. */
export const FAMILY_REVIEW_CASES: FamilyReviewCase[] = [
  {
    id: "skip-weather",
    question: "What's the weather in Denver today?",
    cannedReply: "Sunny, high of 82, light breeze this afternoon.",
    wantSkip: true,
    wantOpen: false,
    expectTokens: [],
    note: "Ephemeral forecast — no Keep chips.",
  },
  {
    id: "skip-socks",
    question: "what are these socks made of (material blend)",
    cannedReply:
      "Those look like a cotton-poly blend with a bit of elastane in the cuff. Good for walking, not a study fact.",
    wantSkip: true,
    wantOpen: false,
    expectTokens: [],
    note: "Product ID / photo practical — skip harvest.",
  },
  {
    id: "capital-utah",
    question: "What is the capital of Utah?",
    cannedReply: "The capital of Utah is Salt Lake City.",
    wantSkip: false,
    wantOpen: false,
    expectTokens: ["Salt Lake City"],
    note: "Closed lookup — must harvest the city.",
  },
  {
    id: "capital-maine",
    question: "What is the capital of Maine?",
    cannedReply: "The capital of Maine is Augusta.",
    wantSkip: false,
    wantOpen: false,
    expectTokens: ["Augusta"],
    note: "Closed lookup — capital fallback if miner blanks.",
  },
  {
    id: "gettysburg",
    question: "When was the Battle of Gettysburg?",
    cannedReply:
      "The Battle of Gettysburg was fought in **1863** in **Pennsylvania**. It was a turning point of the American Civil War.",
    wantSkip: false,
    wantOpen: false,
    expectTokens: ["1863"],
    note: "Closed date. Place is optional support, not Civil War trivia.",
  },
  {
    id: "photosynthesis",
    question: "How does photosynthesis work?",
    cannedReply:
      "Photosynthesis is how plants make food from sunlight, water, and carbon dioxide. It happens in the chloroplast and gives off oxygen.",
    wantSkip: false,
    wantOpen: true,
    expectTokens: ["chloroplast"],
    note: "Open gist + closed pegs. Gist due tomorrow; Home cloze then gist SAY.",
  },
  {
    id: "cows",
    question: "Why are cows brown?",
    cannedReply:
      "Many cows are brown because of genetics — pigments like **melanin** in the coat. Breed and camouflage also play a part. It is not because they drink chocolate milk.",
    wantSkip: false,
    wantOpen: true,
    expectTokens: ["melanin"],
    note: "How/why — gist plus one closed atom.",
  },
  {
    id: "nile-name",
    question: "What is usually named as the longest river in the world?",
    cannedReply:
      "The **Nile** is usually named the longest river. It runs through **Egypt**. Do not harvest the Amazon just because it is mentioned as a rival.",
    wantSkip: false,
    wantOpen: false,
    expectTokens: ["Nile"],
    forbidTokens: ["Amazon", "Egypt"],
    note: "Primary name only; Egypt/Amazon in the prose are not the ask.",
  },
  {
    id: "skip-ravioli",
    question: "recipe for homemade ravioli",
    cannedReply:
      "**Ingredients**\n- 2 cups flour\n\n**Steps**\n1. Mix the dough.\n2. Fill and boil.",
    wantSkip: true,
    wantOpen: false,
    expectTokens: [],
    note: "Cooking belongs in Library, not Keep.",
  },
  {
    id: "skip-tesla",
    question: "What time is the Tesla cyber cab event",
    cannedReply: "The event is scheduled for 7pm Pacific tonight.",
    wantSkip: true,
    wantOpen: false,
    expectTokens: [],
    note: "Event time is ephemeral.",
  },
  {
    id: "skip-photo",
    question: "what is this",
    cannedReply: "That looks like a cotton sock with a reinforced heel. Not a study fact.",
    wantSkip: true,
    wantOpen: false,
    expectTokens: [],
    note: "Photo ID / what-is-this.",
  },
  {
    id: "golden-ruel",
    question: "what is the golden ruel",
    cannedReply:
      "The **Golden Rule** is a moral principle: treat others as you would like to be treated.",
    wantSkip: false,
    wantOpen: false,
    expectTokens: ["Golden Rule"],
    note: "Typo definition — still remember. Junk classify JSON falls through to Keep.",
  },
  {
    id: "who-created",
    question: "Who created this?",
    cannedReply:
      "The Golden Rule was not created by a single person; versions appear in Confucius and the Bible.",
    wantSkip: false,
    wantOpen: false,
    expectTokens: ["Confucius"],
    note: "Follow-up who-created is a fact ask, not photo ID.",
  },
  {
    id: "plant-name",
    question: "what plant is this",
    cannedReply:
      "That looks like a **monstera**. The split leaves are how you tell it from a philodendron.",
    wantSkip: false,
    wantOpen: false,
    expectTokens: ["monstera"],
    note: "Learning photo — file does not skip Keep.",
  },
  {
    id: "capital-us",
    question: "what is the capital of the us",
    cannedReply: "Washington, D.C. is the capital of the United States.",
    wantSkip: false,
    wantOpen: false,
    expectTokens: ["Washington"],
    note: "Closed lookup — capital fallback if miner blanks.",
  },
  {
    id: "skip-smash",
    question: "asdfghjklqwertyuiopzxcvbnm",
    cannedReply:
      "It looks like you have a typo in your message. That string does not mean anything.",
    wantSkip: true,
    wantOpen: false,
    expectTokens: [],
    note: "Keyboard smash — chat, not a Keep quiz about gibberish.",
  },
  {
    id: "skip-typo-ack",
    question: "Oh I said sweet, it was a typo",
    cannedReply: "Okay, cool — you were saying sweet. Nice to know.",
    wantSkip: true,
    wantOpen: false,
    expectTokens: [],
    note: "Typo acknowledgement is chat, even after a sky-blue fact ask.",
  },
  {
    id: "skip-byu-game",
    question: "when is the next BYU game",
    cannedReply: "BYU's next game is Saturday, September 19.",
    wantSkip: true,
    wantOpen: false,
    expectTokens: [],
    classifyJson: `{"job":"live","answerMode":"practical","primaryAsk":"next BYU game","topicKey":"byu-game","maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    note: "Sports schedule is live. Classify job owns Keep — do not wait for the word football.",
  },
];

export type FamilyReviewRow = {
  id: string;
  question: string;
  cannedReply: string;
  skipped: boolean;
  chips: HarvestChipDraft[];
  intent: AskIntent;
  ok: boolean;
  flags: string[];
  note: string;
};

export function intentForFamilyCase(row: FamilyReviewCase): AskIntent {
  if (row.classifyJson) {
    return (
      parseAskIntent(row.classifyJson, row.question) ??
      fallbackAskIntent(row.question)
    );
  }
  return fallbackAskIntent(row.question);
}

export async function runFamilyReviewCase(
  row: FamilyReviewCase,
  liveMiner: boolean
): Promise<FamilyReviewRow> {
  const intent = intentForFamilyCase(row);
  const skipped = skipHarvestTurn(row.question, row.cannedReply, intent).skip;
  let chips: HarvestChipDraft[] = [];
  if (!skipped && liveMiner) {
    const mined = await mineLearnFromReply(row.question, row.cannedReply, {
      intent,
    });
    chips = mined.chips;
  }

  const flags: string[] = [];
  if (row.wantSkip !== skipped) {
    flags.push(row.wantSkip ? "should skip" : "should harvest");
  }
  if (!row.wantSkip && row.wantOpen) {
    const hasOpen = chips.some((chip) => chip.recall === "open");
    if (!hasOpen && liveMiner) flags.push("wanted an open gist");
  }
  const tokens = chips.map((chip) => chip.token.toLowerCase());
  for (const want of row.expectTokens) {
    if (skipped) continue;
    if (!liveMiner) continue;
    if (!tokens.some((t) => t.includes(want.toLowerCase()))) {
      flags.push(`missing ${want}`);
    }
  }
  for (const forbid of row.forbidTokens ?? []) {
    if (tokens.some((t) => t.includes(forbid.toLowerCase()))) {
      flags.push(`forbid ${forbid}`);
    }
  }

  return {
    id: row.id,
    question: row.question,
    cannedReply: row.cannedReply,
    skipped,
    chips,
    intent,
    ok: flags.length === 0,
    flags,
    note: row.note,
  };
}
