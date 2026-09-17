import { inferChipRecall } from "@/lib/chip-recall";
import { V2_HARVEST_POLICY } from "@/lib/harvest-policy";
import { PREVIEW_HARVEST_REPLY } from "@/lib/harvest";
import {
  cardsFromMinerJson,
  parseMinerJson,
  sameShapeAsAnswer,
  shouldSkipHarvest,
} from "@/lib/learn-mine";
import { skipHarvestTurn } from "@/lib/harvest-policy";
import { fallbackAskIntent } from "@/lib/ask-intent";

const NILE_JSON = `{
  "cards": [
    {
      "prompt": "What is usually named as the longest river in the world?",
      "answer": "The Nile",
      "token": "Nile",
      "span": "Nile",
      "kind": "who",
      "recall": "closed",
      "distractors": ["Amazon", "Yangtze", "Mississippi"]
    },
    {
      "prompt": "Which country is most associated with the lower Nile?",
      "answer": "Egypt",
      "token": "Egypt",
      "span": "Egypt",
      "kind": "where",
      "recall": "closed",
      "distractors": ["Sudan", "Ethiopia", "Libya"]
    }
  ]
}`;

const OPEN_JSON = `{
  "cards": [
    {
      "prompt": "What is photosynthesis?",
      "answer": "Photosynthesis is how plants make food from sunlight, water, and carbon dioxide.",
      "token": "photosynthesis",
      "span": "photosynthesis",
      "kind": "meaning",
      "recall": "open",
      "distractors": ["respiration", "digestion", "fermentation"]
    }
  ]
}`;

const BAD_DISTRACTORS_JSON = `{
  "cards": [
    {
      "prompt": "How long is the Nile in miles?",
      "answer": "4,130 miles",
      "token": "4,130 miles",
      "span": "4,130 miles",
      "kind": "when",
      "distractors": ["6,650 km", "Amazon delta", "a very long river"]
    }
  ]
}`;

const JAKARTA_JSON = `{
  "cards": [
    {
      "prompt": "What is the largest city in the world by population?",
      "answer": "Jakarta",
      "token": "Jakarta",
      "span": "largest city by population",
      "kind": "where",
      "distractors": ["Tokyo", "Delhi", "Shanghai"]
    }
  ]
}`;

const PHOTO_REPLY =
  "In short, photosynthesis is how plants make food from sunlight, water, and carbon dioxide. The word photosynthesis shows up in every grade-school life-science unit.";

const EPHEMERAL_ASKS: Array<{ ask: string; reply: string; label: string }> = [
  {
    label: "weather",
    ask: "What's the weather in Denver today please?",
    reply: "It will be sunny with a high of 82 degrees and a light breeze this afternoon.",
  },
  {
    label: "news",
    ask: "What's in the news today around the world?",
    reply: "Headlines today include a summit in Europe and a tech earnings report moving markets.",
  },
  {
    label: "stocks",
    ask: "How did the stock market close today?",
    reply: "The S&P 500 closed up 0.8% as of market close with tech leading gains.",
  },
  {
    label: "sports",
    ask: "What was the final score in the game last night?",
    reply: "The final score was 24-17 with a late touchdown in the fourth quarter.",
  },
  {
    label: "flights",
    ask: "Where are cheap flights this month from Seattle?",
    reply: "Sample fares are trending lower for March getaways but change daily.",
  },
  {
    label: "crypto",
    ask: "What is bitcoin trading at right now?",
    reply: "Bitcoin is at $67,200 as of this morning on major exchanges.",
  },
];

function fail(failures: string[], message: string) {
  failures.push(message);
}

export function runLearnMineFixtures(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];

  for (const row of EPHEMERAL_ASKS) {
    if (!shouldSkipHarvest(row.ask, row.reply)) {
      fail(failures, `${row.label} ask should skip harvest`);
    }
  }

  if (!shouldSkipHarvest("hi", "The Nile is long.")) {
    fail(failures, "short ask should skip");
  }
  if (
    !shouldSkipHarvest(
      "Jupiter",
      "Jupiter is the largest planet in the solar system."
    )
  ) {
    fail(failures, "one-word ask without classify should still skip");
  }
  const planetIntent = fallbackAskIntent(
    "What is the largest planet in the solar system?"
  );
  if (
    skipHarvestTurn(
      "Jupiter",
      "Jupiter is the largest planet in the solar system.",
      { ...planetIntent, harvest: true }
    ).skip
  ) {
    fail(failures, "classified remember should harvest a short follow-up");
  }
  if (
    !shouldSkipHarvest(
      "asdfghjklqwertyuiopzxcvbnm",
      "It looks like you have a typo in your message."
    )
  ) {
    fail(failures, "keyboard smash should skip harvest");
  }
  if (
    !shouldSkipHarvest(
      "Oh I said sweet, it was a typo",
      "Okay, cool — you were saying sweet. Nice to know."
    )
  ) {
    fail(failures, "typo acknowledgement should skip harvest");
  }
  if (
    shouldSkipHarvest(
      "Why is the Nile usually named as the longest river in the world?",
      PREVIEW_HARVEST_REPLY
    )
  ) {
    fail(failures, "nile ask should not skip");
  }
  if (
    shouldSkipHarvest(
      "capital of Spain",
      "Madrid is the capital of Spain and sits near the center of the country on the Meseta."
    )
  ) {
    fail(failures, "closed capital ask should harvest");
  }
  if (
    shouldSkipHarvest(
      "What is the capital of Maine?",
      "The capital of Maine is Augusta."
    )
  ) {
    fail(failures, "short closed capital reply should harvest");
  }
  if (
    !shouldSkipHarvest(
      "Tell me more about ancient Egypt and the Nile delta.",
      "The S&P 500 closed up 1.2% as of market close while Egypt relied on the Nile."
    )
  ) {
    fail(failures, "ephemeral reply should skip even on history ask");
  }
  if (
    !shouldSkipHarvest(
      "recipe for homemade ravioli",
      "Here's ravioli. 1. Mix. 2. Boil."
    )
  ) {
    fail(failures, "recipe ask should skip harvest");
  }
  if (
    !shouldSkipHarvest(
      "what is this",
      "That looks like a cotton-poly sock with a reinforced heel for walking."
    )
  ) {
    fail(failures, "photo what-is-this should skip harvest");
  }

  const nile = cardsFromMinerJson(
    parseMinerJson(NILE_JSON),
    PREVIEW_HARVEST_REPLY,
    [],
    "nile"
  );
  if (nile.length !== 2) fail(failures, `nile count ${nile.length}`);
  if (nile.some((chip) => chip.recall !== "closed")) {
    fail(failures, "nile should be closed");
  }
  if (nile.some((chip) => (chip.distractors?.length ?? 0) < 3)) {
    fail(failures, "nile needs three distractors each");
  }
  if (nile[0]?.weight !== "cluster" || nile[1]?.weight !== "cluster") {
    fail(failures, "nile pair should be cluster weight");
  }
  if (nile[0]?.cluster !== "nile") fail(failures, "nile cluster id");

  const ghost = cardsFromMinerJson(
    parseMinerJson(NILE_JSON),
    "No spans in this reply at all about other rivers.",
    []
  );
  if (ghost.length !== 0) fail(failures, "span must appear in reply");

  const fuzzy = cardsFromMinerJson(
    parseMinerJson(JAKARTA_JSON),
    "It depends, but Jakarta is often named the largest city proper.",
    []
  );
  if (fuzzy.length !== 1) fail(failures, `token fallback should keep card, got ${fuzzy.length}`);
  if (fuzzy[0]?.span !== "Jakarta") {
    fail(failures, `resolved span should be Jakarta, got ${fuzzy[0]?.span ?? "none"}`);
  }

  const dup = cardsFromMinerJson(parseMinerJson(NILE_JSON), PREVIEW_HARVEST_REPLY, [
    "What is usually named as the longest river in the world?",
  ]);
  if (dup.length !== 1) fail(failures, `duplicate prompt filter ${dup.length}`);

  const dupFact = cardsFromMinerJson(
    parseMinerJson(NILE_JSON),
    PREVIEW_HARVEST_REPLY,
    [],
    "nile",
    {
      knownRows: [
        {
          prompt: "What is usually named as the longest river in the world?",
          token: "Nile",
          answer: "The Nile",
        },
      ],
    }
  );
  if (dupFact.length !== 1) {
    fail(failures, `duplicate cue filter ${dupFact.length}`);
  }
  if (dupFact[0]?.token === "Nile") {
    fail(failures, "restated Nile cue should not re-harvest");
  }

  const tokenOnly = cardsFromMinerJson(
    parseMinerJson(NILE_JSON),
    PREVIEW_HARVEST_REPLY,
    [],
    "nile",
    { knownRows: [{ token: "Nile", answer: "The Nile" }] }
  );
  if (tokenOnly.length !== 2) {
    fail(failures, `token-only known row should not block ${tokenOnly.length}`);
  }

  const jupiterReply =
    "Jupiter is the largest planet. It is also the first gas giant past the asteroid belt.";
  const jupiterFamily = `{
  "cards": [
    {
      "prompt": "Which is the first gas giant past the asteroid belt?",
      "answer": "Jupiter",
      "token": "Jupiter",
      "span": "Jupiter",
      "kind": "meaning",
      "recall": "closed",
      "distractors": ["Saturn", "Uranus", "Neptune"]
    }
  ]
}`;
  const parallel = cardsFromMinerJson(
    parseMinerJson(jupiterFamily),
    jupiterReply,
    [],
    "jup",
    {
      knownRows: [
        {
          prompt: "What is the largest planet in the solar system?",
          token: "Jupiter",
          answer: "Jupiter",
        },
      ],
    }
  );
  if (parallel.length !== 1 || parallel[0]?.token !== "Jupiter") {
    fail(failures, `parallel Jupiter cue should Keep, got ${parallel[0]?.token ?? "none"}`);
  }
  const restated = cardsFromMinerJson(
    parseMinerJson(
      `{
  "cards": [
    {
      "prompt": "What is the largest planet?",
      "answer": "Jupiter",
      "token": "Jupiter",
      "span": "Jupiter",
      "kind": "meaning",
      "recall": "closed",
      "distractors": ["Saturn", "Uranus", "Neptune"]
    }
  ]
}`
    ),
    jupiterReply,
    [],
    "jup",
    {
      knownRows: [
        {
          prompt: "What is the largest planet in the solar system?",
          token: "Jupiter",
          answer: "Jupiter",
        },
      ],
    }
  );
  if (restated.length !== 0) {
    fail(failures, `restated Jupiter cue should skip, got ${restated.length}`);
  }

  const openV2 = cardsFromMinerJson(parseMinerJson(OPEN_JSON), PHOTO_REPLY, []);
  if (openV2.length !== 0) {
    fail(failures, "V2 policy should reject open-recall cards");
  }

  const openLab = cardsFromMinerJson(parseMinerJson(OPEN_JSON), PHOTO_REPLY, [], undefined, {
    policy: { ...V2_HARVEST_POLICY, closedOnly: false, maxOpen: 1, minDistractors: 0 },
  });
  if (openLab.length !== 1) fail(failures, `open count ${openLab.length}`);
  if (openLab[0]?.recall !== "open") fail(failures, "photosynthesis should be open");

  const badDistractors = cardsFromMinerJson(
    parseMinerJson(BAD_DISTRACTORS_JSON),
    PREVIEW_HARVEST_REPLY,
    []
  );
  if (badDistractors.length !== 0) {
    fail(failures, "bad distractor shapes should reject card");
  }

  if (!sameShapeAsAnswer("4,130 miles", "3,900 miles")) {
    fail(failures, "matching mile units should pass shape");
  }
  if (sameShapeAsAnswer("4,130 miles", "6,650 km")) {
    fail(failures, "miles vs km should fail shape");
  }
  if (sameShapeAsAnswer("Egypt", "a country along the lower Nile")) {
    fail(failures, "city vs phrase should fail shape");
  }

  if (inferChipRecall("Nile", "The Nile") !== "closed") {
    fail(failures, "infer Nile closed");
  }
  if (
    inferChipRecall(
      "photosynthesis",
      "Photosynthesis is how plants make food from sunlight, water, and carbon dioxide."
    ) !== "open"
  ) {
    fail(failures, "infer photosynthesis open");
  }

  if (!parseMinerJson('noise {"cards":[]} tail')) {
    fail(failures, "parseMinerJson should extract JSON");
  }

  return { ok: failures.length === 0, failures };
}
