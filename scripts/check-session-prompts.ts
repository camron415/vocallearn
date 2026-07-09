import assert from "node:assert/strict";

import {
  buildPredictionQuestion,
  buildProductionPrompt,
  buildQuizPrompt,
  normalizeCorrectValidation,
} from "../src/engine/session-prompts.ts";

type FactLike = {
  content: string;
  tags: string[] | null;
};

const fact = (content: string, tags: string[] | null = null): FactLike => ({ content, tags });

assert.equal(
  buildQuizPrompt(fact("There are exactly eight planets that orbit the Sun in our Solar System.") as any),
  "How many planets orbit the Sun in our Solar System?"
);

assert.equal(
  buildProductionPrompt(fact("There are exactly eight planets that orbit the Sun in our Solar System.") as any),
  "Tell me how many planets orbit the Sun in our Solar System."
);

assert.equal(
  buildQuizPrompt(fact("At the center of the Solar System is the Sun, a massive ball of hot gases that provides light and heat to everything around it.") as any),
  "What's at the center of the Solar System?"
);

assert.equal(
  buildPredictionQuestion(fact("The planets line up in this order from the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.") as any),
  "Before I explain it, can you name the order of the planets from the Sun?"
);

assert.equal(
  buildQuizPrompt(fact("Between Mars and Jupiter, there's the Asteroid Belt, a ring of rocky debris orbiting the Sun.") as any),
  "What's between Mars and Jupiter?"
);

assert.equal(
  buildQuizPrompt(fact("The Solar System formed about 4.6 billion years ago from a collapsing cloud of gas and dust.") as any),
  "How did the Solar System form?"
);

assert.equal(
  buildQuizPrompt(fact("The inner planets—Mercury, Venus, Earth, and Mars—are small, rocky worlds with solid surfaces.") as any),
  "What do you remember about the inner planets?"
);

assert.equal(
  buildProductionPrompt(fact("The outer planets—Jupiter, Saturn, Uranus, and Neptune—are massive gas giants mostly made of hydrogen and helium.") as any),
  "Explain the outer planets in your own words."
);

assert.equal(
  buildQuizPrompt(fact("These methods add a second training stage where responses are ranked or rewarded.") as any),
  "What do you remember about methods?"
);

assert.equal(
  buildQuizPrompt(
    fact("Pretraining usually teaches a language model by predicting the next token across a very large text corpus.") as any
  ),
  "What does pretraining usually teach the model to do?"
);

assert.equal(
  buildQuizPrompt(
    fact("Instruction tuning happens after pretraining and teaches the model to follow task-oriented prompts in a chat format.") as any
  ),
  "What does instruction tuning teach the model to do?"
);

assert.equal(
  buildQuizPrompt(
    fact("Frequent patterns in the training data shape model behavior more strongly than rare edge cases.") as any
  ),
  "What shapes model behavior more strongly: frequent patterns in the training data or rare edge cases?"
);

assert.equal(
  buildQuizPrompt(
    fact("Alignment methods such as RLHF or RLAIF optimize for preferred behavior, not just raw next-token likelihood.") as any
  ),
  "What do alignment methods such as RLHF or RLAIF optimize for beyond raw next-token likelihood?"
);

assert.equal(
  buildQuizPrompt(
    fact("Alignment improves usability, but it does not guarantee truthfulness, safety, or consistent reasoning on every prompt.") as any
  ),
  "What does alignment improve, and what does it not guarantee?"
);

assert.equal(
  buildQuizPrompt(
    fact(
      "Prompt injection is a security risk where user-provided input contains instructions that override your system prompt.",
      ["prompt-injection", "security"]
    ) as any
  ),
  "Why is prompt injection a security risk?"
);

const validation = normalizeCorrectValidation(
  "You're spot on that the Solar System is a collection of planets, moons, and other objects orbiting the Sun.",
  fact("The Solar System is a collection of planets, moons, and other objects all orbiting around the Sun.") as any,
  "The solar system is a collection of planets and moons orbiting the sun"
);

assert.ok(validation.length <= 60, validation);
assert.ok(!/solar system/i.test(validation), validation);

console.log("session prompt checks passed");