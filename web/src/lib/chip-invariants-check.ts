import { fallbackAskIntent } from "@/lib/ask-intent";
import { cardsFromMinerJson } from "@/lib/learn-mine";
import {
  answerFitsAskKind,
  echoesUserPrompt,
  filterChipInvariants,
  isCitationYear,
  pickPrimaryThenSupports,
  type InvariantChip,
} from "@/lib/chip-invariants";

function fail(failures: string[], msg: string) {
  failures.push(msg);
}

const GETTYSBURG_REPLY =
  "The Battle of Gettysburg was fought in **1863** in **Pennsylvania**. It was a turning point of the American Civil War.";

const GETTYSBURG_LIVE_REPLY =
  "The Battle of Gettysburg took place from July 1 to July 3, 1863. It was a pivotal battle in the American Civil War fought in Gettysburg, Pennsylvania.";

const GETTYSBURG_LIVE_JSON = `{
  "cards": [
    {
      "prompt": "Where was the Battle of Gettysburg?",
      "promptB": "Which town hosted Gettysburg?",
      "answer": "Gettysburg, Pennsylvania",
      "token": "Gettysburg, Pennsylvania",
      "span": "Gettysburg, Pennsylvania",
      "kind": "where",
      "recall": "closed",
      "distractors": ["Richmond, Virginia", "Antietam, Maryland", "Vicksburg, Mississippi"]
    },
    {
      "prompt": "When was the Battle of Gettysburg?",
      "promptB": "In what year was Gettysburg fought?",
      "answer": "July 1 to July 3, 1863",
      "token": "July 1 to July 3, 1863",
      "span": "July 1 to July 3, 1863",
      "kind": "when",
      "recall": "closed",
      "distractors": ["July 1861", "April 1865", "June 1812"]
    }
  ]
}`;

const GETTYSBURG_JSON = `{
  "cards": [
    {
      "prompt": "Where was the Battle of Gettysburg?",
      "promptB": "Which state hosted Gettysburg?",
      "answer": "Gettysburg, Pennsylvania",
      "token": "Gettysburg, Pennsylvania",
      "span": "Pennsylvania",
      "kind": "where",
      "recall": "closed",
      "distractors": ["Virginia", "Maryland", "Ohio"]
    },
    {
      "prompt": "When was the Battle of Gettysburg?",
      "promptB": "In what year was Gettysburg fought?",
      "answer": "1863",
      "token": "1863",
      "span": "1863",
      "kind": "when",
      "recall": "closed",
      "distractors": ["1861", "1865", "1812"]
    }
  ]
}`;

const BOMB_JSON = `{
  "cards": [
    {
      "prompt": "What did they ask for?",
      "promptB": "What kind of history?",
      "answer": "Give me brief",
      "token": "Give me brief",
      "span": "Give me brief",
      "kind": "meaning",
      "recall": "closed",
      "distractors": ["Give me long", "Tell me now", "Show me later"]
    }
  ]
}`;

const ROME_JSON = `{
  "cards": [
    {
      "prompt": "Why did it fall?",
      "promptB": "What failed?",
      "answer": "Why did Western",
      "token": "Why did Western",
      "span": "Why did Western",
      "kind": "meaning",
      "recall": "closed",
      "distractors": ["Why did Eastern", "How did Roman", "When did Western"]
    }
  ]
}`;

const UTAH_JSON = `{
  "cards": [
    {
      "prompt": "What is the capital of Utah?",
      "promptB": "Utah's capital city is what?",
      "answer": "Salt Lake City",
      "token": "Salt Lake City",
      "span": "Salt Lake City",
      "kind": "where",
      "recall": "closed",
      "distractors": ["Provo", "Ogden", "Moab"]
    }
  ]
}`;

const JUPITER_JSON = `{
  "cards": [
    {
      "prompt": "What is the largest planet in the solar system?",
      "promptB": "Which planet is the biggest?",
      "answer": "Jupiter",
      "token": "Jupiter",
      "span": "Jupiter",
      "kind": "meaning",
      "recall": "closed",
      "distractors": ["Saturn", "Neptune", "Earth"]
    }
  ]
}`;

function closedChip(partial: Partial<InvariantChip> & Pick<InvariantChip, "token" | "answer" | "span" | "kind">): InvariantChip {
  return {
    prompt: partial.prompt ?? "Q?",
    token: partial.token,
    answer: partial.answer,
    span: partial.span,
    kind: partial.kind,
    recall: partial.recall ?? "closed",
    distractors: partial.distractors ?? ["a", "b", "c"],
  };
}

export function runChipInvariantFixtures(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];

  const gettysburgAsk = "When was the Battle of Gettysburg?";
  const gettysburgPlan = fallbackAskIntent(gettysburgAsk);
  if (gettysburgPlan.askKind !== "when") {
    fail(failures, `Gettysburg askKind ${gettysburgPlan.askKind} want when`);
  }
  const gettysburg = cardsFromMinerJson(
    JSON.parse(GETTYSBURG_JSON),
    GETTYSBURG_REPLY,
    [],
    "g",
    { intent: gettysburgPlan, userText: gettysburgAsk }
  );
  if (gettysburg[0]?.token !== "1863") {
    fail(
      failures,
      `Gettysburg primary ${gettysburg[0]?.token ?? "none"} want 1863`
    );
  }
  if (gettysburg.length > 1 && gettysburg[1]?.token === "1863") {
    fail(failures, "Gettysburg support should not repeat 1863");
  }

  const gettysburgLive = cardsFromMinerJson(
    JSON.parse(GETTYSBURG_LIVE_JSON),
    GETTYSBURG_LIVE_REPLY,
    [],
    "g-live",
    { intent: gettysburgPlan, userText: gettysburgAsk }
  );
  if (!/1863/.test(gettysburgLive[0]?.token ?? "")) {
    fail(
      failures,
      `Gettysburg live primary ${gettysburgLive[0]?.token ?? "none"} want 1863`
    );
  }

  const onlyPlace = cardsFromMinerJson(
    { cards: JSON.parse(GETTYSBURG_JSON).cards.slice(0, 1) },
    GETTYSBURG_REPLY,
    [],
    "g2",
    { intent: gettysburgPlan, userText: gettysburgAsk }
  );
  if (onlyPlace.length !== 0) {
    fail(failures, "Gettysburg where-only must not keep sides without a year main");
  }

  const bombAsk = "give me a brief history of the atomic bomb";
  const bombEcho = filterChipInvariants(
    closedChip({
      token: "Give me brief",
      answer: "Give me brief",
      span: "Give me brief",
      kind: "meaning",
    }),
    { userText: bombAsk, reply: "Give me brief history. Nuclear fission in 1938." }
  );
  if (bombEcho !== "user_echo") {
    fail(failures, `bomb prompt echo got ${bombEcho}`);
  }
  if (
    !echoesUserPrompt(bombAsk, {
      token: "Give me brief",
      answer: "Give me brief",
      span: "Give me brief",
      prompt: "What?",
    })
  ) {
    fail(failures, "Give me brief should echo the user");
  }

  const bombCards = cardsFromMinerJson(
    JSON.parse(BOMB_JSON),
    "Give me brief history. Nuclear fission unlocked the bomb.",
    [],
    "b",
    { userText: bombAsk, intent: fallbackAskIntent(bombAsk) }
  );
  if (bombCards.length !== 0) {
    fail(failures, "user-echo chip must not harvest");
  }

  const romeAsk = "Why did the Western Roman Empire fall?";
  const rome = cardsFromMinerJson(
    JSON.parse(ROME_JSON),
    "Why did Western power fade? The Western Roman Empire fell in 476 CE.",
    [],
    "r",
    { userText: romeAsk, intent: fallbackAskIntent(romeAsk) }
  );
  if (rome.length !== 0) {
    fail(failures, "Why did Western echo must not harvest");
  }

  const beesYear = closedChip({
    token: "2025",
    answer: "2025",
    span: "2025",
    kind: "when",
  });
  if (
    !isCitationYear(
      beesYear,
      "Consensus as of 2025[[1]](https://example.com/2025) holds that mites matter.",
      "What is the current scientific consensus on why bees are declining?"
    )
  ) {
    fail(failures, "bees 2025 should be a citation/current year");
  }

  if (
    !answerFitsAskKind("when", {
      token: "1863",
      answer: "1863",
      recall: "closed",
      kind: "when",
    })
  ) {
    fail(failures, "1863 should fit when");
  }
  if (
    answerFitsAskKind("when", {
      token: "Pennsylvania",
      answer: "Pennsylvania",
      recall: "closed",
      kind: "where",
    })
  ) {
    fail(failures, "Pennsylvania should not fit when");
  }

  const utahAsk = "What is the capital of Utah?";
  const utah = cardsFromMinerJson(
    JSON.parse(UTAH_JSON),
    "The capital of Utah is Salt Lake City.",
    [],
    "u",
    { userText: utahAsk, intent: fallbackAskIntent(utahAsk) }
  );
  if (utah[0]?.token !== "Salt Lake City") {
    fail(failures, `Utah primary ${utah[0]?.token ?? "none"}`);
  }

  const planetAsk = "What is the largest planet in the solar system?";
  const planetPlan = fallbackAskIntent(planetAsk);
  if (planetPlan.askKind !== "meaning") {
    fail(failures, `planet askKind ${planetPlan.askKind} want meaning`);
  }
  if (
    !answerFitsAskKind("meaning", {
      token: "Jupiter",
      answer: "Jupiter",
      recall: "closed",
      kind: "meaning",
    })
  ) {
    fail(failures, "Jupiter should fit meaning as a closed name");
  }
  const planet = cardsFromMinerJson(
    JSON.parse(JUPITER_JSON),
    "Jupiter is the largest planet in the solar system.",
    [],
    "j",
    { userText: planetAsk, intent: planetPlan }
  );
  if (planet[0]?.token !== "Jupiter") {
    fail(failures, `planet primary ${planet[0]?.token ?? "none"} want Jupiter`);
  }

  const emptyPrimary = pickPrimaryThenSupports(
    [
      closedChip({
        token: "Pennsylvania",
        answer: "Pennsylvania",
        span: "Pennsylvania",
        kind: "where",
      }),
    ],
    {
      intent: gettysburgPlan,
      userText: gettysburgAsk,
      reply: GETTYSBURG_REPLY,
      maxCards: 3,
    }
  );
  if (emptyPrimary.chips.length !== 0) {
    fail(failures, "no honest main → no chips");
  }

  return { ok: failures.length === 0, failures };
}
