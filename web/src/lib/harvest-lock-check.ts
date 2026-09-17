import { PREVIEW_HARVEST_CHIPS, type HarvestChip } from "./harvest";
import {
  LOCK_IN_KICKER,
  LOCK_IN_SAY_KICKER,
  LOCK_IN_SEE_KICKER,
  lockChipLog,
  lockChoicesStack,
  lockInKicker,
  lockPlayMode,
} from "./harvest-lock";
import { harvestLockEventMeta } from "./harvest-lock-track";

function chip(partial: Partial<HarvestChip> & Pick<HarvestChip, "id" | "token" | "answer">): HarvestChip {
  return {
    span: partial.span ?? partial.token,
    kind: partial.kind ?? "meaning",
    prompt: partial.prompt ?? "What is it?",
    ...partial,
  };
}

export function runHarvestLockFixtures(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  if (LOCK_IN_SEE_KICKER !== "Tap to keep it") {
    failures.push(`see kicker drifted: ${LOCK_IN_SEE_KICKER}`);
  }
  if (LOCK_IN_SAY_KICKER !== "Say it to keep it" || LOCK_IN_KICKER !== LOCK_IN_SAY_KICKER) {
    failures.push(`say kicker drifted: ${LOCK_IN_SAY_KICKER}`);
  }
  if (lockInKicker("see") !== LOCK_IN_SEE_KICKER) {
    failures.push("see kicker helper mismatch");
  }
  if (lockInKicker("say") !== LOCK_IN_SAY_KICKER) {
    failures.push("say kicker helper mismatch");
  }

  const nile = PREVIEW_HARVEST_CHIPS[0];
  if (lockPlayMode(nile) !== "see") {
    failures.push("closed Nile should be tap (SEE)");
  }

  const golden = chip({
    id: "golden",
    token: "Treat others as you would like to be treated",
    answer: "Treat others as you would like to be treated",
    prompt: "What is the Golden Rule?",
    recall: "closed",
    distractors: [
      "Always put yourself first in every situation. Never help others unless they help you first.",
    ],
  });
  if (lockPlayMode(golden) !== "see") {
    failures.push("closed Golden Rule should be multiple choice");
  }
  if (
    !lockChoicesStack([
      golden.token,
      golden.distractors![0],
    ])
  ) {
    failures.push("long Golden Rule picks should stack");
  }
  if (lockChoicesStack(["Nile", "Amazon", "Yangtze", "Mississippi"])) {
    failures.push("short closed picks should stay a grid");
  }

  const gist = chip({
    id: "gist",
    token: "photosynthesis",
    answer:
      "Plants make food from sunlight, water, and carbon dioxide, and they release oxygen.",
    prompt: "What is photosynthesis?",
    recall: "open",
  });
  if (lockPlayMode(gist) !== "see") {
    failures.push("open gist with cloze should be SEE (tap the blank)");
  }

  const say = chip({
    id: "say",
    token: "hi",
    answer: "ok",
    prompt: "What did they say?",
    recall: "open",
  });
  if (lockPlayMode(say) !== "say") {
    failures.push("open gist without a cloze blank should be type-or-speak");
  }

  const rejectMeta = harvestLockEventMeta({
    conversationId: "c1",
    chips: [lockChipLog(nile, "drop")],
  });
  if (!rejectMeta.reject || rejectMeta.dropped !== 1) {
    failures.push("Don't keep this should flag harvest_lock reject");
  }
  const keepMeta = harvestLockEventMeta({
    conversationId: "c1",
    chips: [lockChipLog(nile, "claimed")],
  });
  if (keepMeta.reject) {
    failures.push("claimed lock-in should not flag reject");
  }

  return { ok: failures.length === 0, failures };
}
