import {
  FIRST_DUE_LINE,
  hasSeenFirstDueLine,
  revealFirstDueLine,
} from "./first-due-line";

function fail(failures: string[], message: string) {
  failures.push(message);
}

export function runFirstDueLineFixtures() {
  const failures: string[] = [];
  const map = new Map<string, string>();
  const store = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };

  if (FIRST_DUE_LINE !== "Tap one to review.") {
    fail(failures, "due line copy drifted");
  }
  if (hasSeenFirstDueLine(store)) fail(failures, "empty store should not be seen");
  if (!revealFirstDueLine(store)) fail(failures, "first due should show");
  if (!hasSeenFirstDueLine(store)) fail(failures, "store should remember due line");
  if (revealFirstDueLine(store)) fail(failures, "second due should not repeat");

  return { ok: failures.length === 0, failures };
}
