import {
  FIRST_HARVEST_LINE,
  hasSeenFirstHarvestLine,
  revealFirstHarvestLine,
} from "./first-harvest-line";

function fail(failures: string[], message: string) {
  failures.push(message);
}

export function runFirstHarvestLineFixtures() {
  const failures: string[] = [];
  const map = new Map<string, string>();
  const store = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };

  if (FIRST_HARVEST_LINE !== "Kept — these come back tomorrow.") {
    fail(failures, "H1 copy drifted");
  }
  if (hasSeenFirstHarvestLine(store)) fail(failures, "empty store should not be seen");
  if (!revealFirstHarvestLine(store)) fail(failures, "first reveal should show");
  if (!hasSeenFirstHarvestLine(store)) fail(failures, "store should remember H1");
  if (revealFirstHarvestLine(store)) fail(failures, "second harvest should not repeat H1");

  return { ok: failures.length === 0, failures };
}
