import { fallbackAskIntent, intentAnswerGuide } from "@/lib/ask-intent";
import { lunaEnabled } from "@/lib/openai";
import { isPictureTurn, pickAnswerProvider, planToRoute } from "@/lib/ask-provider";
import { skipHarvestTurn } from "@/lib/harvest-policy";
import { cardsFromMinerJson } from "@/lib/learn-mine";
import {
  quietReferenceLinks,
  referencePrompt,
  wantsStudyPaper,
  type StudyReference,
} from "@/lib/study-reference";

function fail(failures: string[], message: string) {
  failures.push(message);
}

function routeOf(prompt: string) {
  const intent = fallbackAskIntent(prompt);
  const route = planToRoute(intent, false);
  return { intent, route, provider: pickAnswerProvider(route, false) };
}

export function runStudyHarnessFixtures() {
  const failures: string[] = [];

  const history = routeOf("Brief history of the Roman Republic");
  if (history.provider !== "grok" || history.route.tools || history.route.effort !== "low") {
    fail(failures, "brief history should be Grok, low effort, search off");
  }
  if (!history.intent.harvest || history.intent.maxChips !== 1 || !isPictureTurn(history.intent)) {
    fail(failures, "brief history should keep one picture-turn chip");
  }
  if (wantsStudyPaper(history.intent.primaryAsk) || wantsStudyPaper("Brief history of the Roman Republic")) {
    fail(failures, "history should not call OpenAlex");
  }

  const population = routeOf("What is the population of Japan?");
  if (population.intent.harvest || population.intent.freshness !== "web" || !population.route.tools) {
    fail(failures, "population should search and keep nothing");
  }
  if (
    !skipHarvestTurn("What is the population of Japan?", "About 124 million.", {
      harvest: true,
    }).skip
  ) {
    fail(failures, "a classify-remember on population must still skip");
  }

  const capital = routeOf("What is the capital of Maine?");
  if (
    capital.route.writer !== "luna" ||
    capital.route.tools ||
    isPictureTurn(capital.intent) ||
    (lunaEnabled() && capital.provider !== "luna")
  ) {
    fail(failures, "a capital should stay on Luna with no picture");
  }
  if (capital.intent.maxChips !== 1) fail(failures, "a capital should budget one chip");

  const signed = routeOf("When was the Declaration signed?");
  if (
    isPictureTurn(signed.intent) ||
    signed.route.writer !== "luna" ||
    signed.intent.maxChips !== 1 ||
    (lunaEnabled() && signed.provider !== "luna")
  ) {
    fail(failures, "a date should stay a short Luna fact");
  }

  const moons = routeOf("How many moons does Mars have?");
  if (isPictureTurn(moons.intent) || wantsStudyPaper("How many moons does Mars have?")) {
    fail(failures, "a count should not be a picture turn or a paper");
  }

  const sky = routeOf("Why is the sky blue?");
  if (sky.provider !== "grok" || sky.route.effort !== "low" || sky.route.tools || !isPictureTurn(sky.intent)) {
    fail(failures, "why is the sky blue should be Grok low with search off");
  }
  if (!wantsStudyPaper("Why is the sky blue?")) {
    fail(failures, "a mechanism why may open one paper");
  }

  const seasons = routeOf("Why do we have seasons?");
  if (!isPictureTurn(seasons.intent) || seasons.route.effort !== "low" || seasons.route.tools) {
    fail(failures, "seasons should be a low-effort picture turn");
  }

  const crispr = routeOf("How does CRISPR change a gene?");
  if (!isPictureTurn(crispr.intent) || !wantsStudyPaper("How does CRISPR change a gene?")) {
    fail(failures, "CRISPR should be a picture turn with a paper");
  }
  if (crispr.route.tools || crispr.route.effort !== "low") {
    fail(failures, "CRISPR should not search the web or raise effort");
  }

  const collapse = routeOf("What caused the Bronze Age collapse?");
  if (collapse.intent.harvest || wantsStudyPaper("What caused the Bronze Age collapse?")) {
    fail(failures, "Bronze Age collapse should not be kept and should not get a paper");
  }

  const dose = routeOf("How much ibuprofen for a 4-year-old?");
  if (dose.intent.harvest || isPictureTurn(dose.intent)) {
    fail(failures, "a dose should not be kept or pictured");
  }
  if (!/cautious|not a fact to study/i.test(intentAnswerGuide(dose.intent))) {
    fail(failures, "a dose should get the short caution");
  }
  if (
    !skipHarvestTurn("How much ibuprofen for a 4-year-old?", "Ask a clinician.", {
      harvest: true,
    }).skip
  ) {
    fail(failures, "a classify-remember on a dose must still skip");
  }

  const dream = routeOf("Why do we dream?");
  if (dream.intent.harvest) fail(failures, "why we dream should not be kept");

  const brain = routeOf("Is it true we use 10% of the brain?");
  if (brain.intent.harvest) fail(failures, "the 10% brain claim should not be kept");

  const autism = routeOf("Do vaccines cause autism?");
  if (autism.intent.harvest || isPictureTurn(autism.intent)) {
    fail(failures, "the vaccine claim should stop and not be kept");
  }

  const glass = routeOf("Is glass a liquid?");
  if (glass.intent.harvest) fail(failures, "glass is a liquid should not be kept");

  const longDepth = planToRoute(
    {
      ...sky.intent,
      answerDepth: "long",
    },
    false
  );
  if (longDepth.effort !== "low" || longDepth.writer !== "grok" || longDepth.tools) {
    fail(failures, "tell-me-more wording must not raise effort or turn search on");
  }

  const wiki: StudyReference = {
    wiki: {
      title: "Augusta, Maine",
      url: "https://en.wikipedia.org/wiki/Augusta,_Maine",
      text: "Augusta is the capital of Maine.",
    },
    paper: {
      title: "A paper",
      url: "https://openalex.org/W1",
      text: "Abstract.",
    },
  };
  const prompt = referencePrompt(wiki);
  if (!prompt.includes("Augusta is the capital of Maine.") || !/own words/i.test(prompt)) {
    fail(failures, "the lead should be given as a rewrite, not a bibliography");
  }
  if (/example\.com/i.test(prompt)) fail(failures, "the reference prompt must not invent a sample URL");
  const links = quietReferenceLinks(wiki);
  if (!links.includes("https://en.wikipedia.org/wiki/Augusta,_Maine") || links.includes("openalex.org")) {
    fail(failures, "the quiet link is the Wikipedia article only");
  }
  const bare = referencePrompt({ wiki: null, paper: null });
  if (!/one or two sentences/i.test(bare) || !/do not write a picture/i.test(bare)) {
    fail(failures, "a missing article should stop a picture turn at one or two sentences");
  }

  const dropped = cardsFromMinerJson(
    {
      cards: [
        {
          prompt: "What caused the Bronze Age collapse?",
          answer: "drought",
          token: "drought",
          span: "drought",
          kind: "meaning",
          recall: "closed",
          distractors: ["plague", "invasion", "earthquake"],
        },
      ],
    },
    "There is no single cause. Drought is one theory among several.",
    [],
    "bronze"
  );
  if (dropped.length !== 0) fail(failures, "an unsettled reply should keep no chip");

  return { ok: failures.length === 0, failures };
}
