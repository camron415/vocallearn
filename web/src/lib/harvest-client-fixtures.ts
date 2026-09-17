import {
  existingDueHarvest,
  findHarvestNeedle,
  harvestFactKey,
  harvestMarkdown,
  sameHarvestFact,
  type HarvestChip,
} from "@/lib/harvest";

const NILE: HarvestChip = {
  id: "nile-1",
  token: "Nile",
  span: "Nile",
  kind: "who",
  prompt: "Longest river?",
  answer: "The Nile",
  seat: "home",
  heat: "hot",
};

const EGYPT: HarvestChip = {
  id: "egypt-1",
  token: "Egypt",
  span: "Egypt",
  kind: "where",
  prompt: "Lower Nile country?",
  answer: "Egypt",
  seat: "keep",
};

function fail(failures: string[], message: string) {
  failures.push(message);
}

export function runHarvestClientFixtures(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];

  if (!sameHarvestFact(NILE, { prompt: NILE.prompt, token: "Nile", answer: "the Nile" })) {
    fail(failures, "sameHarvestFact should match folded Nile cue");
  }
  if (sameHarvestFact(NILE, EGYPT)) {
    fail(failures, "Nile and Egypt should not match");
  }

  if (harvestFactKey("The Nile") !== harvestFactKey("nile")) {
    fail(failures, "harvestFactKey should fold case and the");
  }

  const incoming: HarvestChip = {
    ...NILE,
    id: "nile-2",
    prompt: "What is the longest river?",
  };
  if (!existingDueHarvest([NILE], incoming)) {
    fail(failures, "due Home chip should block a restated cue");
  }

  const parallel: HarvestChip = {
    ...NILE,
    id: "nile-miles",
    prompt: "How long is the Nile in miles?",
    token: "4,130 miles",
    answer: "4,130 miles",
  };
  if (existingDueHarvest([NILE], parallel)) {
    fail(failures, "different cue should not count as the due Nile chip");
  }

  const jupiter: HarvestChip = {
    id: "jup-1",
    token: "Jupiter",
    span: "Jupiter",
    kind: "meaning",
    prompt: "What is the largest planet in the solar system?",
    answer: "Jupiter",
    seat: "home",
    heat: "hot",
  };
  const gasGiant: HarvestChip = {
    ...jupiter,
    id: "jup-2",
    prompt: "Which is the first gas giant past the asteroid belt?",
  };
  if (sameHarvestFact(jupiter, gasGiant)) {
    fail(failures, "same answer different cue should be two claims");
  }
  if (existingDueHarvest([jupiter], gasGiant)) {
    fail(failures, "parallel Jupiter cue should still land");
  }
  if (
    !sameHarvestFact(jupiter, {
      ...jupiter,
      prompt: "What is the largest planet?",
    })
  ) {
    fail(failures, "largest planet restatement should match");
  }

  const gettysburgWhen: HarvestChip = {
    id: "g-when",
    token: "1863",
    span: "1863",
    kind: "when",
    prompt: "When was the Battle of Gettysburg?",
    answer: "1863",
  };
  const gettysburgWhere: HarvestChip = {
    id: "g-where",
    token: "Pennsylvania",
    span: "Pennsylvania",
    kind: "where",
    prompt: "Where was the Battle of Gettysburg?",
    answer: "Pennsylvania",
  };
  if (sameHarvestFact(gettysburgWhen, gettysburgWhere)) {
    fail(failures, "when vs where Gettysburg must stay two cues");
  }

  const keepIncoming: HarvestChip = { ...EGYPT, id: "egypt-2" };
  if (existingDueHarvest([EGYPT], keepIncoming)) {
    fail(failures, "Keep chip should not count as due harvest block");
  }

  const capital: HarvestChip = {
    id: "aug",
    token: "Augusta",
    span: "capital city of Maine",
    kind: "where",
    prompt: "What is the capital of Maine?",
    answer: "Augusta",
  };
  const boldMd = harvestMarkdown("The capital of Maine is **Augusta**.", [capital]);
  if (!boldMd.includes("harvest://aug/where") || !boldMd.includes("Augusta")) {
    fail(failures, "bold capital should highlight Augusta");
  }

  const jakarta: HarvestChip = {
    id: "jkt",
    token: "Jakarta",
    span: "largest city by population",
    kind: "where",
    prompt: "Largest city?",
    answer: "Jakarta",
  };
  const jakartaHit = findHarvestNeedle(
    "It depends, but Jakarta is often named the largest city proper.",
    jakarta
  );
  if (jakartaHit?.text !== "Jakarta") {
    fail(failures, `jakarta needle should be Jakarta, got ${jakartaHit?.text ?? "null"}`);
  }

  const pop: HarvestChip = {
    id: "pop",
    token: "10,539,000",
    span: "10539000",
    kind: "meaning",
    prompt: "Population?",
    answer: "10,539,000",
  };
  const popMd = harvestMarkdown(
    "The city has a population of 10,539,000 people.",
    [pop]
  );
  if (!popMd.includes("harvest://pop/meaning") || !popMd.includes("10,539,000")) {
    fail(failures, "comma population should highlight 10,539,000");
  }

  return { ok: failures.length === 0, failures };
}
