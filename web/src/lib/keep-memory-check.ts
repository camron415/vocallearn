import type { HarvestChip } from "@/lib/harvest";
import {
  keepInspectView,
  KEEP_CAP,
  addKeepChip,
  clearKeepChips,
  countsTowardKeepCap,
  finishRound,
  readDockBeads,
  readGoldVault,
  readKeepChips,
  readKeepInspect,
  tryAddKeepChip,
} from "@/lib/keep-memory";

function fail(failures: string[], message: string) {
  failures.push(message);
}

function sample(id: string, extra?: Partial<HarvestChip>): HarvestChip {
  return {
    id,
    token: `t-${id}`,
    span: `t-${id}`,
    kind: "who",
    prompt: `Prompt ${id}?`,
    answer: `Answer ${id}`,
    distractors: ["A", "B", "C"],
    recall: "closed",
    ...extra,
  };
}

export function runKeepMemoryFixtures() {
  const failures: string[] = [];
  clearKeepChips();

  const added = tryAddKeepChip(sample("k1"));
  if (!added.ok) fail(failures, "first add should succeed");
  const inspect = readKeepInspect("k1");
  if (!inspect || inspect.token !== "t-k1" || inspect.rank !== 0) {
    fail(failures, "inspect should return the new chip");
  }
  if (inspect && inspect.dueAt == null) {
    fail(failures, "closed harvest should stamp tomorrow dueAt");
  }
  if (inspect && inspect.seat !== "keep") {
    fail(failures, "fresh harvest should sit in Keep, not Home");
  }

  const pass1 = finishRound([{ id: "k1", passed: true }]);
  if (!pass1.passedIds.includes("k1") || pass1.failedIds.length) {
    fail(failures, "clean pass should bank");
  }
  if (readKeepInspect("k1")?.rank !== 1) fail(failures, "one pass is bronze");

  const miss = finishRound([{ id: "k1", passed: false }]);
  if (!miss.failedIds.includes("k1")) fail(failures, "miss should fail the fact");
  if ((readKeepInspect("k1")?.clears ?? 0) !== 1) {
    fail(failures, "miss must not bump clears");
  }
  if (readKeepInspect("k1")?.seat !== "home") {
    fail(failures, "miss stays due on Home");
  }

  clearKeepChips();
  addKeepChip(sample("gold", { clears: 3, seat: "mastered" }));
  for (let i = 0; i < KEEP_CAP; i += 1) {
    const result = tryAddKeepChip(sample(`c${i}`));
    if (!result.ok) fail(failures, `in-progress ${i} should add`);
  }
  const capped = tryAddKeepChip(sample("overflow"));
  if (capped.ok || capped.reason !== "cap") {
    fail(failures, "31st in-progress should refuse, not drop gold");
  }
  if (!readGoldVault().some((chip) => chip.id === "gold")) {
    fail(failures, "gold must survive a full Keep");
  }
  if (readKeepChips().filter(countsTowardKeepCap).length !== KEEP_CAP) {
    fail(failures, "cap should count in-progress only");
  }
  if (readDockBeads().length > KEEP_CAP) {
    fail(failures, "dock should still show at most 30");
  }

  clearKeepChips();
  const openAdd = tryAddKeepChip(
    sample("open1", {
      token: "photosynthesis",
      span: "make food from sunlight",
      kind: "meaning",
      prompt: "How do plants make food?",
      answer:
        "Photosynthesis is how plants make food from sunlight, water, and carbon dioxide.",
      recall: "open",
      distractors: [],
    })
  );
  if (!openAdd.ok) fail(failures, "open gist should add");
  if (readKeepInspect("open1")?.dueAt == null) {
    fail(failures, "open harvest should stamp tomorrow dueAt");
  }
  const openView = keepInspectView({
    recall: "open",
    token: "photosynthesis",
    prompt: "How do plants make food?",
    answer:
      "Photosynthesis is how plants make food from sunlight, water, and carbon dioxide.",
  });
  if (openView.head !== "How do plants make food?" || openView.prompt) {
    fail(failures, "open inspect should head the question, not repeat it");
  }
  if (!openView.answer?.toLowerCase().includes("photosynthesis is")) {
    fail(failures, "open inspect should keep the gist once");
  }
  const closedView = keepInspectView({
    recall: "closed",
    token: "chloroplast",
    prompt: "Where does photosynthesis happen?",
    answer: "chloroplast",
  });
  if (closedView.head !== "chloroplast" || closedView.answer) {
    fail(failures, "closed inspect should drop the duplicate token/answer line");
  }
  if (closedView.prompt !== "Where does photosynthesis happen?") {
    fail(failures, "closed inspect should keep the question");
  }

  clearKeepChips();
  return { ok: failures.length === 0, failures };
}
