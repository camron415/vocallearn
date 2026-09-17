import { fallbackAskIntent, intentAnswerGuide } from "@/lib/ask-intent";

function fail(failures: string[], msg: string) {
  failures.push(msg);
}

function firstSentence(reply: string) {
  return (reply.trim().split(/(?<=[.!?])\s+/)[0] || reply).trim();
}

export function answerShapeCheck(
  plan: ReturnType<typeof fallbackAskIntent>,
  reply: string
): string[] {
  const holes: string[] = [];
  if (!plan.harvest) return holes;
  const lead = firstSentence(reply);
  if (plan.answerMode === "direct") {
    if (plan.askKind === "when" && !/\b(1[0-9]{3}|20[0-2][0-9])\b/.test(lead)) {
      holes.push("direct when: first sentence missing a year");
    }
    if (plan.askKind === "where" && lead.length < 8) {
      holes.push("direct where: first sentence too thin");
    }
  }
  if (plan.answerMode === "teach_light") {
    const words = lead.split(/\s+/).filter(Boolean).length;
    if (words < 8) holes.push("teach_light: opening gist too short");
  }
  return holes;
}

export function runAskAnswerShapeFixtures(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];

  const utah = fallbackAskIntent("What is the capital of Utah?");
  if (!/place name|where|first sentence/i.test(intentAnswerGuide(utah))) {
    fail(failures, "Utah guide should name the place atom");
  }
  const utahHoles = answerShapeCheck(
    utah,
    "The capital of Utah is Salt Lake City. It is the largest city in the state."
  );
  if (utahHoles.length) fail(failures, utahHoles.join("; "));

  const when = fallbackAskIntent("When was the Battle of Gettysburg?");
  if (!/date or year/i.test(intentAnswerGuide(when))) {
    fail(failures, "Gettysburg guide should demand a date token");
  }
  const whenHoles = answerShapeCheck(
    when,
    "The Battle of Gettysburg was fought in 1863 in Pennsylvania."
  );
  if (whenHoles.length) fail(failures, whenHoles.join("; "));
  const whenBad = answerShapeCheck(
    when,
    "The Battle of Gettysburg was fought in Pennsylvania during the Civil War."
  );
  if (!whenBad.length) {
    fail(failures, "place-only Gettysburg opening should fail answer shape");
  }

  const sky = fallbackAskIntent("why is the sky blue");
  if (!/12–24 words|gist/i.test(intentAnswerGuide(sky))) {
    fail(failures, "teach_light guide should ask for a gist sentence");
  }

  return { ok: failures.length === 0, failures };
}
