import {
  PREVIEW_HOME_CHIPS,
  type ChipKind,
  type ChipSeat,
  type HarvestChip,
} from "@/lib/harvest";

const STORAGE_KEY = "halo-keep-v1";
const KEEP_CAP = 30;
const MASTER_AFTER = 3;

let chips: HarvestChip[] = [];
let pinnedAsks: Array<{ id: string; kind: ChipKind }> = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

function seatFromHeat(heat: HarvestChip["heat"]): ChipSeat {
  if (heat === "rest" || heat === "locked") return "keep";
  return "home";
}

export function chipSeat(chip: HarvestChip): ChipSeat {
  if (chip.seat === "home" || chip.seat === "keep" || chip.seat === "mastered") {
    return chip.seat;
  }
  return seatFromHeat(chip.heat);
}

export function withSeat(chip: HarvestChip, seat?: ChipSeat): HarvestChip {
  return { ...chip, seat: seat ?? chipSeat(chip) };
}

/** Due — belongs on Home. */
export function isDueChip(chip: HarvestChip) {
  return chipSeat(chip) === "home" && !chip.id.startsWith("keep-");
}

/** Not due — belongs in the Keep pocket. */
export function isBankedChip(chip: HarvestChip) {
  return chipSeat(chip) === "keep" && !chip.id.startsWith("keep-");
}

export function isMasteredChip(chip: HarvestChip) {
  return chipSeat(chip) === "mastered" && !chip.id.startsWith("keep-");
}

/** 0 new · 1 bronze · 2 silver · 3 gold. */
export function keepRank(chip: HarvestChip) {
  if (isMasteredChip(chip) || (chip.clears ?? 0) >= MASTER_AFTER) return 3;
  const n = chip.clears ?? 0;
  if (n >= 2) return 2;
  if (n >= 1) return 1;
  return 0;
}

export function sortKeepBeads(list: HarvestChip[]) {
  return list
    .filter((chip) => isBankedChip(chip) || isMasteredChip(chip))
    .slice()
    .sort((a, b) => {
      const rank = keepRank(b) - keepRank(a);
      if (rank) return rank;
      return (a.keptAt ?? 0) - (b.keptAt ?? 0);
    })
    .slice(0, KEEP_CAP);
}

function stampKeptAt(chip: HarvestChip, fallback: number): HarvestChip {
  return { ...chip, keptAt: chip.keptAt ?? fallback };
}

/** If any member of a cluster is harvested into Keep, extras from that Ask follow. */
function bankClusters(list: HarvestChip[]): HarvestChip[] {
  const keepClusters = new Set(
    list
      .filter((chip) => chip.cluster && chipSeat(chip) === "keep")
      .map((chip) => chip.cluster as string)
  );
  if (!keepClusters.size) return list;
  return list.map((chip) =>
    chip.cluster && keepClusters.has(chip.cluster)
      ? { ...chip, seat: "keep" as const }
      : chip
  );
}

function isChip(value: unknown): value is HarvestChip {
  if (!value || typeof value !== "object") return false;
  const chip = value as HarvestChip;
  return Boolean(chip.id && chip.token && chip.kind && chip.prompt && chip.answer);
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { chips?: unknown; pins?: unknown };
    if (Array.isArray(parsed.chips)) {
      const raw = parsed.chips.filter(isChip);
      chips = raw
        .map((chip, i) =>
          withSeat(stampKeptAt(chip, Date.now() - (raw.length - i) * 1000))
        )
        .slice(-KEEP_CAP);
    }
    if (Array.isArray(parsed.pins)) {
      pinnedAsks = parsed.pins.filter(
        (pin): pin is { id: string; kind: ChipKind } =>
          Boolean(pin && typeof pin === "object" && "id" in pin && "kind" in pin)
      );
    }
    persist();
  } catch {
    /* corrupt store — start empty */
  }
}

function moveIdsToEnd(list: HarvestChip[], ids: Set<string>) {
  const rest = list.filter((chip) => !ids.has(chip.id));
  const moved = list.filter((chip) => ids.has(chip.id));
  return [...rest, ...moved];
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ v: 1, chips, pins: pinnedAsks })
    );
  } catch {
    /* quota / private mode */
  }
}

export function readKeepChips() {
  hydrate();
  return chips;
}

export function writeKeepChips(next: HarvestChip[]) {
  chips = next
    .map((chip, i) =>
      withSeat(stampKeptAt(chip, Date.now() - (next.length - i) * 1000))
    )
    .slice(-KEEP_CAP);
  persist();
  emit();
}

/** Harvest lands in Keep (not due). The whole cluster follows. Cap 30. */
export function addKeepChip(chip: HarvestChip) {
  hydrate();
  if (!chip?.id) return;
  const next = stampKeptAt(
    withSeat(chip, chip.seat ?? "keep"),
    Date.now()
  );
  const index = chips.findIndex((item) => item.id === next.id);
  if (index < 0 && chips.length >= KEEP_CAP) return;
  const updated =
    index >= 0
      ? [...chips.filter((item) => item.id !== next.id), { ...chips[index], ...next }]
      : [...chips, next];
  writeKeepChips(bankClusters(updated));
}

export function clearKeepChips() {
  hydrate();
  pinnedAsks = [];
  writeKeepChips([]);
}

export function removeKeepChip(id: string) {
  hydrate();
  writeKeepChips(chips.filter((chip) => chip.id !== id));
}

export function seedKeepDemo(force = false) {
  hydrate();
  if (force) {
    writeKeepChips(
      PREVIEW_HOME_CHIPS.map((chip, i) =>
        withSeat(stampKeptAt(chip, 1_000_000 + i * 1000))
      )
    );
    return;
  }
  const extras = chips.filter((chip) => !chip.id.startsWith("preview-"));
  const preview = chips.filter((chip) => chip.id.startsWith("preview-"));
  if (preview.length) {
    writeKeepChips([...preview.map((chip) => withSeat(chip)), ...extras]);
    return;
  }
  writeKeepChips([...PREVIEW_HOME_CHIPS.map((chip) => withSeat(chip)), ...extras]);
}

export function readPinnedAsks() {
  hydrate();
  return pinnedAsks;
}

export function pinAsk(id: string, kind: ChipKind) {
  hydrate();
  if (!id || pinnedAsks.some((item) => item.id === id)) return;
  pinnedAsks = [...pinnedAsks, { id, kind }];
  persist();
  emit();
}

export function unpinAsk(id: string) {
  hydrate();
  pinnedAsks = pinnedAsks.filter((item) => item.id !== id);
  persist();
  emit();
}

export function subscribeKeep(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function readLoopStats() {
  hydrate();
  return {
    due: chips.filter(isDueChip).length,
    keep: chips.filter(isBankedChip).length,
    mastered: chips.filter(isMasteredChip).length,
    total: chips.filter((chip) => !chip.id.startsWith("keep-")).length,
    cap: KEEP_CAP,
  };
}

export function gradeChips(ids: string[], result: "ok" | "miss") {
  hydrate();
  const hit = new Set(ids);
  const next = chips.map((chip) => {
    if (!hit.has(chip.id)) return chip;
    if (result === "miss") {
      return { ...chip, seat: "home" as const, lastResult: "miss" as const };
    }
    const clears = (chip.clears ?? 0) + 1;
    return {
      ...chip,
      clears,
      lastResult: "ok" as const,
      seat: clears >= MASTER_AFTER ? ("mastered" as const) : ("keep" as const),
    };
  });
  writeKeepChips(result === "ok" ? moveIdsToEnd(next, hit) : next);
}

export function gradeDue(result: "ok" | "miss") {
  hydrate();
  gradeChips(
    chips.filter(isDueChip).map((chip) => chip.id),
    result
  );
}

export function dropKeepDue() {
  hydrate();
  writeKeepChips(
    chips.map((chip) =>
      chipSeat(chip) === "keep"
        ? { ...chip, seat: "home", dueAt: Date.now(), heat: "warm" }
        : chip
    )
  );
}

export function bankDue() {
  hydrate();
  writeKeepChips(
    chips.map((chip) =>
      chipSeat(chip) === "home" ? { ...chip, seat: "keep" } : chip
    )
  );
}

export function masterDue() {
  hydrate();
  writeKeepChips(
    chips.map((chip) =>
      chipSeat(chip) === "home"
        ? { ...chip, seat: "mastered", clears: MASTER_AFTER, lastResult: "ok" }
        : chip
    )
  );
}

export function spawnLabFact() {
  hydrate();
  const n = Date.now() % 10000;
  const kinds: HarvestChip["kind"][] = ["who", "where", "when", "meaning"];
  const kind = kinds[n % 4];
  addKeepChip({
    id: `lab-${Date.now()}`,
    token: `Lab fact ${n}`,
    span: `Lab fact ${n}`,
    kind,
    prompt: `What is lab fact ${n}?`,
    answer: `Lab fact ${n}`,
    hint: "Spawned from Mix → Loop.",
    cluster: `lab-${Date.now()}`,
    heat: "rest",
    seat: "keep",
  });
}

/** Three Nile facts due; everything else in Keep — one clear can empty Home. */
export function seedTutorialPack() {
  hydrate();
  writeKeepChips(
    PREVIEW_HOME_CHIPS.map((chip, i) => {
      const nile = chip.cluster === "nile";
      return withSeat(
        stampKeptAt(
          {
            ...chip,
            clears: 0,
            lastResult: undefined,
          },
          1_000_000 + i * 1000
        ),
        nile ? "home" : "keep"
      );
    })
  );
}
