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

  if (!sameHarvestFact(NILE, { token: "Nile", answer: "the Nile" })) {
    fail(failures, "sameHarvestFact should match folded Nile");
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
    prompt: "Different prompt same fact",
  };
  if (!existingDueHarvest([NILE], incoming)) {
    fail(failures, "due Home chip should block re-harvest flight");
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
