import { clozeForChip, gradeClozeSaid, CLOZE_BOTH_PLACEHOLDER } from "./open-cloze";

function fail(failures: string[], message: string) {
  failures.push(message);
}

export function runOpenClozeFixtures() {
  const failures: string[] = [];
  const chip = {
    token: "photosynthesis",
    answer:
      "Photosynthesis is how plants make food from sunlight, water, and carbon dioxide.",
    distractors: [] as string[],
  };

  const r1 = clozeForChip(chip, 1, "see");
  if (!r1 || !r1.stem.includes("____")) {
    fail(failures, "r1 SEE should blank one word");
  }
  if (!r1 || r1.keys.length !== 1) fail(failures, "r1 should be one key");
  if (r1 && !r1.choices.some((choice) => choice.correct)) {
    fail(failures, "r1 needs a correct pick");
  }
  if (r1 && r1.choices.length < 2) fail(failures, "r1 needs distractors");

  const r2see = clozeForChip(chip, 2, "see");
  if (r1 && r2see && r1.keys[0] === r2see.keys[0] && contentHasTwo(chip.answer)) {
    fail(failures, "r2 SEE should use a different blank when possible");
  }

  const r2say = clozeForChip(chip, 2, "say");
  if (!r2say || r2say.keys.length < 1) fail(failures, "r2 SAY should blank keys");
  if (r2say && r2say.keys.length === 2) {
    const joined = r2say.keys.join(" ");
    if (!gradeClozeSaid(joined, r2say.keys)) {
      fail(failures, "typing both keys should pass");
    }
  }
  if (r1 && !gradeClozeSaid(r1.keys[0] ?? "", r1.keys)) {
    fail(failures, "typing the r1 key should pass");
  }
  if (r1 && gradeClozeSaid("amazon", r1.keys)) {
    fail(failures, "wrong cloze word should fail");
  }

  const itch = clozeForChip(
    {
      token: "histamine",
      answer:
        "The immune system releases histamine in response to proteins in the insect's saliva.",
      distractors: [],
    },
    1,
    "see"
  );
  const stolen = [
    "immune",
    "system",
    "releases",
    "response",
    "proteins",
    "insect",
    "saliva",
  ];
  if (
    itch?.choices.some(
      (choice) => !choice.correct && stolen.includes(choice.label.toLowerCase())
    )
  ) {
    fail(failures, "open cloze must not steal fakes from the same sentence");
  }
  if (itch && itch.choices.filter((choice) => !choice.correct).length < 3) {
    fail(failures, "open cloze still needs three fakes");
  }

  const longFake = clozeForChip(
    {
      token: "Rayleigh scattering",
      answer:
        "The sky looks blue because of Rayleigh scattering in Earth's atmosphere.",
      distractors: [
        "Sunlight scatters off molecules in Earth's atmosphere, with shorter blue wavelen",
        "soil",
        "oxygen",
      ],
    },
    1,
    "see"
  );
  if (
    longFake?.choices.some((choice) =>
      /sunlight scatters off molecules/i.test(choice.label)
    )
  ) {
    fail(failures, "open cloze must not use a full-sentence fake");
  }
  if (longFake && longFake.choices.filter((choice) => !choice.correct).length < 3) {
    fail(failures, "long-fake skip still needs three short fakes");
  }

  if (CLOZE_BOTH_PLACEHOLDER !== "Both missing words") {
    fail(failures, "dual-blank placeholder drifted");
  }

  return { ok: failures.length === 0, failures };
}

function contentHasTwo(answer: string) {
  return answer.split(/\s+/).filter((word) => word.replace(/[^a-z]/gi, "").length >= 4)
    .length >= 2;
}
