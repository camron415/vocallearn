import {
  PREVIEW_HOME_CHIPS,
  type ChipKind,
  type ChipSeat,
  type HarvestChip,
} from "@/lib/harvest";

const STORAGE_KEY = "halo-keep-v2";
const KEEP_CAP = 30;
const HOME_SEAT_CAP = 16;
const DAY_ROUND_CAP = 3;
const MASTER_AFTER = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
/** After a clean r1 / r2 / r3: next due in ~1d, ~3d, ~7d. */
const PASS_GAP_DAYS = [1, 3, 7] as const;

export { HOME_SEAT_CAP, DAY_ROUND_CAP, MASTER_AFTER, PASS_GAP_DAYS };

export type KeepCloudPayload = {
  v: number;
  chips: HarvestChip[];
  pins: Array<{ id: string; kind: ChipKind }>;
  roundsToday: number;
  roundsDay: string;
  roundsLifetime: number;
  remainderFailed: Record<string, string[]>;
  remainderFreeUsed: Record<string, boolean>;
};

let chips: HarvestChip[] = [];
let pinnedAsks: Array<{ id: string; kind: ChipKind }> = [];
let roundsToday = 0;
let roundsDay = "";
let roundsLifetime = 0;
/** Failed chip ids still due, keyed by cluster (or chip id if no cluster). */
let remainderFailed: Record<string, string[]> = {};
let remainderFreeUsed: Record<string, boolean> = {};
let lastOpenRemainderFree = false;
let hydrated = false;
let updatedAt = 0;
let applyingRemote = false;
let cloudPush: (() => void) | null = null;
const listeners = new Set<() => void>();

export function attachKeepCloudPush(fn: () => void) {
  cloudPush = fn;
}

function emit() {
  for (const fn of listeners) fn();
}

function dayKey(now = Date.now()) {
  const d = new Date(now);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function rollDayCap(now = Date.now()) {
  const key = dayKey(now);
  if (roundsDay !== key) {
    roundsDay = key;
    roundsToday = 0;
    remainderFailed = {};
    remainderFreeUsed = {};
    lastOpenRemainderFree = false;
  }
}

function resetDayCap(now = Date.now()) {
  roundsDay = dayKey(now);
  roundsToday = 0;
  remainderFailed = {};
  remainderFreeUsed = {};
  lastOpenRemainderFree = false;
}

/** Lab QA / Settings — reset 3-round day cap without wiping chips. */
export function resetRoundsToday(now = Date.now()) {
  hydrate();
  resetDayCap(now);
  persist();
  emit();
}

function clusterKeyFor(chip: { id: string; cluster?: string }) {
  return chip.cluster || chip.id;
}

export function passGapDays(clears: number) {
  if (clears <= 1) return PASS_GAP_DAYS[0];
  if (clears === 2) return PASS_GAP_DAYS[1];
  return PASS_GAP_DAYS[2];
}

export function nextDueAt(clears: number, from = Date.now()) {
  return from + passGapDays(clears) * DAY_MS;
}

/**
 * Upcoming play round from clears, never from calendar lateness.
 * 0 clears → r1, 1 → r2, 2+ → r3. Gold stays r3 off Home.
 */
export function roundIndex(chip: HarvestChip): 1 | 2 | 3 {
  const n = chip.clears ?? 0;
  if (n >= 2) return 3;
  if (n >= 1) return 2;
  return 1;
}

/** True if a pass this round would master the chip (gold off dock). */
export function wouldMasterOnPass(chip: HarvestChip) {
  return (chip.clears ?? 0) + 1 >= MASTER_AFTER;
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

/** Not due — belongs in the Keep pocket. Gold is not docked. */
export function isBankedChip(chip: HarvestChip) {
  return chipSeat(chip) === "keep" && !chip.id.startsWith("keep-");
}

export function isMasteredChip(chip: HarvestChip) {
  return chipSeat(chip) === "mastered" && !chip.id.startsWith("keep-");
}

function isGoldOrMastered(chip: HarvestChip) {
  return isMasteredChip(chip) || (chip.clears ?? 0) >= MASTER_AFTER;
}

/** 0 new · 1 bronze · 2 silver · 3 gold (gold is off the dock). */
export function keepRank(chip: HarvestChip) {
  if (isGoldOrMastered(chip)) return 3;
  const n = chip.clears ?? 0;
  if (n >= 2) return 2;
  if (n >= 1) return 1;
  return 0;
}

/** Dock = in progress only. Silver → bronze → new, older left within a band. */
export function sortKeepBeads(list: HarvestChip[]) {
  return list
    .filter((chip) => isBankedChip(chip))
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

function wakeHeat(chip: HarvestChip): HarvestChip["heat"] {
  if (chip.heat === "rest" || chip.heat === "locked") return "warm";
  return chip.heat;
}

function isDueForHome(chip: HarvestChip, now: number) {
  if (chip.id.startsWith("keep-")) return false;
  if (isGoldOrMastered(chip)) return false;
  if (chipSeat(chip) === "home") return true;
  return chip.dueAt != null && chip.dueAt <= now;
}

/**
 * Home holds at most 16 due chips. Extra due stay in Keep until a seat frees.
 * Already-on-Home keep their seats; new drops fill by soonest dueAt, then keptAt.
 */
export function applyDueSeats(list: HarvestChip[], now = Date.now()): HarvestChip[] {
  const eligible = list.filter((chip) => isDueForHome(chip, now));
  const onHome = eligible.filter((chip) => chipSeat(chip) === "home");
  const waiting = eligible
    .filter((chip) => chipSeat(chip) !== "home")
    .slice()
    .sort((a, b) => {
      const due = (a.dueAt ?? 0) - (b.dueAt ?? 0);
      if (due) return due;
      return (a.keptAt ?? 0) - (b.keptAt ?? 0);
    });
  const takeIds = new Set(
    [...onHome, ...waiting].slice(0, HOME_SEAT_CAP).map((chip) => chip.id)
  );
  return list.map((chip) => {
    if (chip.id.startsWith("keep-")) return chip;
    if (isGoldOrMastered(chip)) {
      return { ...chip, seat: "mastered" as const };
    }
    if (takeIds.has(chip.id)) {
      return { ...chip, seat: "home" as const, heat: wakeHeat(chip) };
    }
    if (chipSeat(chip) === "home") {
      return { ...chip, seat: "keep" as const };
    }
    return chip;
  });
}

/**
 * Harvest extras in the same Ask follow into Keep, but never demote
 * a chip that is already due on Home or already gold.
 */
function bankClusters(list: HarvestChip[]): HarvestChip[] {
  const keepClusters = new Set(
    list
      .filter((chip) => chip.cluster && chipSeat(chip) === "keep")
      .map((chip) => chip.cluster as string)
  );
  if (!keepClusters.size) return list;
  return list.map((chip) => {
    if (!chip.cluster || !keepClusters.has(chip.cluster)) return chip;
    if (chipSeat(chip) === "home" || isGoldOrMastered(chip)) return chip;
    return { ...chip, seat: "keep" as const };
  });
}

/** Incoming harvest may refresh copy; loop seat / clears / due stay if already due or gold. */
function mergeHarvest(prev: HarvestChip, incoming: HarvestChip): HarvestChip {
  const next: HarvestChip = {
    ...prev,
    ...incoming,
    keptAt: prev.keptAt ?? incoming.keptAt,
    dueAt: incoming.dueAt ?? prev.dueAt,
    askId: incoming.askId ?? prev.askId,
  };
  if (chipSeat(prev) === "home" || isGoldOrMastered(prev)) {
    return {
      ...next,
      seat: chipSeat(prev),
      dueAt: prev.dueAt ?? incoming.dueAt,
      clears: prev.clears,
      lastResult: prev.lastResult,
      keptAt: prev.keptAt ?? next.keptAt,
    };
  }
  return next;
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
    const parsed = JSON.parse(raw) as {
      chips?: unknown;
      pins?: unknown;
      roundsToday?: unknown;
      roundsDay?: unknown;
      roundsLifetime?: unknown;
      remainderFailed?: unknown;
      remainderFreeUsed?: unknown;
      updatedAt?: unknown;
    };
    if (Array.isArray(parsed.chips)) {
      const loaded = parsed.chips.filter(isChip);
      chips = applyDueSeats(
        loaded
          .map((chip, i) =>
            withSeat(stampKeptAt(chip, Date.now() - (loaded.length - i) * 1000))
          )
          .slice(-KEEP_CAP)
      );
    }
    if (Array.isArray(parsed.pins)) {
      pinnedAsks = parsed.pins.filter(
        (pin): pin is { id: string; kind: ChipKind } =>
          Boolean(pin && typeof pin === "object" && "id" in pin && "kind" in pin)
      );
    }
    if (typeof parsed.roundsToday === "number" && parsed.roundsToday >= 0) {
      roundsToday = Math.floor(parsed.roundsToday);
    }
    if (typeof parsed.roundsDay === "string") {
      roundsDay = parsed.roundsDay;
    }
    if (typeof parsed.roundsLifetime === "number" && parsed.roundsLifetime >= 0) {
      roundsLifetime = Math.floor(parsed.roundsLifetime);
    }
    if (parsed.remainderFailed && typeof parsed.remainderFailed === "object") {
      remainderFailed = {};
      for (const [key, ids] of Object.entries(
        parsed.remainderFailed as Record<string, unknown>
      )) {
        if (Array.isArray(ids)) {
          remainderFailed[key] = ids.filter((id): id is string => typeof id === "string");
        }
      }
    }
    if (parsed.remainderFreeUsed && typeof parsed.remainderFreeUsed === "object") {
      remainderFreeUsed = {};
      for (const [key, used] of Object.entries(
        parsed.remainderFreeUsed as Record<string, unknown>
      )) {
        remainderFreeUsed[key] = Boolean(used);
      }
    }
    if (typeof parsed.updatedAt === "number" && parsed.updatedAt >= 0) {
      updatedAt = parsed.updatedAt;
    } else if (chips.length) {
      updatedAt = Date.now();
    }
    rollDayCap();
    persist({ skipPush: true });
  } catch {
    /* corrupt store — start empty */
  }
}

function moveIdsToEnd(list: HarvestChip[], ids: Set<string>) {
  const rest = list.filter((chip) => !ids.has(chip.id));
  const moved = list.filter((chip) => ids.has(chip.id));
  return [...rest, ...moved];
}

function persist(opts?: { skipPush?: boolean }) {
  if (typeof window === "undefined") return;
  if (!opts?.skipPush && !applyingRemote) {
    updatedAt = Date.now();
  }
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        v: 2,
        chips,
        pins: pinnedAsks,
        roundsToday,
        roundsDay,
        roundsLifetime,
        remainderFailed,
        remainderFreeUsed,
        updatedAt,
      })
    );
  } catch {
    /* quota / private mode */
  }
  if (!opts?.skipPush && !applyingRemote) {
    cloudPush?.();
  }
}

function isPin(value: unknown): value is { id: string; kind: ChipKind } {
  if (!value || typeof value !== "object") return false;
  const pin = value as { id?: unknown; kind?: unknown };
  return (
    typeof pin.id === "string" &&
    (pin.kind === "when" ||
      pin.kind === "where" ||
      pin.kind === "who" ||
      pin.kind === "meaning")
  );
}

export function parseKeepCloudPayload(value: unknown): KeepCloudPayload | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.chips)) return null;
  const loaded = raw.chips.filter(isChip);
  const remainderFailedNext: Record<string, string[]> = {};
  if (raw.remainderFailed && typeof raw.remainderFailed === "object") {
    for (const [key, ids] of Object.entries(
      raw.remainderFailed as Record<string, unknown>
    )) {
      if (Array.isArray(ids)) {
        remainderFailedNext[key] = ids.filter(
          (id): id is string => typeof id === "string"
        );
      }
    }
  }
  const remainderFreeUsedNext: Record<string, boolean> = {};
  if (raw.remainderFreeUsed && typeof raw.remainderFreeUsed === "object") {
    for (const [key, used] of Object.entries(
      raw.remainderFreeUsed as Record<string, unknown>
    )) {
      remainderFreeUsedNext[key] = Boolean(used);
    }
  }
  return {
    v: 2,
    chips: loaded.slice(-KEEP_CAP),
    pins: Array.isArray(raw.pins) ? raw.pins.filter(isPin) : [],
    roundsToday:
      typeof raw.roundsToday === "number" && raw.roundsToday >= 0
        ? Math.floor(raw.roundsToday)
        : 0,
    roundsDay: typeof raw.roundsDay === "string" ? raw.roundsDay : "",
    roundsLifetime:
      typeof raw.roundsLifetime === "number" && raw.roundsLifetime >= 0
        ? Math.floor(raw.roundsLifetime)
        : 0,
    remainderFailed: remainderFailedNext,
    remainderFreeUsed: remainderFreeUsedNext,
  };
}

export function snapshotKeepState() {
  hydrate();
  const payload: KeepCloudPayload = {
    v: 2,
    chips,
    pins: pinnedAsks,
    roundsToday,
    roundsDay,
    roundsLifetime,
    remainderFailed,
    remainderFreeUsed,
  };
  return { payload, updatedAt };
}

export function applyKeepCloudPayload(payload: KeepCloudPayload, at: number) {
  hydrate();
  applyingRemote = true;
  chips = applyDueSeats(
    payload.chips
      .map((chip, i) =>
        withSeat(stampKeptAt(chip, Date.now() - (payload.chips.length - i) * 1000))
      )
      .slice(-KEEP_CAP)
  );
  pinnedAsks = payload.pins;
  roundsToday = payload.roundsToday;
  roundsDay = payload.roundsDay;
  roundsLifetime = payload.roundsLifetime;
  remainderFailed = payload.remainderFailed;
  remainderFreeUsed = payload.remainderFreeUsed;
  updatedAt = at;
  persist({ skipPush: true });
  applyingRemote = false;
  emit();
}

export function markKeepCloudSynced(at: number) {
  if (!Number.isFinite(at) || at <= 0) return;
  updatedAt = at;
  persist({ skipPush: true });
}

export function keepStateIsEmpty() {
  hydrate();
  return (
    chips.length === 0 &&
    pinnedAsks.length === 0 &&
    roundsLifetime === 0 &&
    roundsToday === 0
  );
}

export function readKeepChips() {
  hydrate();
  return chips;
}

export function writeKeepChips(next: HarvestChip[]) {
  chips = applyDueSeats(
    next
      .map((chip, i) =>
        withSeat(stampKeptAt(chip, Date.now() - (next.length - i) * 1000))
      )
      .slice(-KEEP_CAP)
  );
  persist();
  emit();
}

/** Harvest lands in Keep (not due). Must not restamp an already-due Home chip. Cap 30. */
export function addKeepChip(chip: HarvestChip) {
  hydrate();
  if (!chip?.id) return;
  const now = Date.now();
  let next = stampKeptAt(withSeat(chip, chip.seat ?? "keep"), now);
  const index = chips.findIndex((item) => item.id === next.id);
  if (index < 0 && chips.length >= KEEP_CAP) return;
  if (index >= 0) {
    next = mergeHarvest(chips[index], next);
  } else if (!isGoldOrMastered(next) && next.dueAt == null) {
    next = { ...next, dueAt: now + DAY_MS };
  }
  const updated =
    index >= 0
      ? [...chips.filter((item) => item.id !== next.id), next]
      : [...chips, next];
  writeKeepChips(bankClusters(updated));
}

export function clearKeepChips() {
  hydrate();
  pinnedAsks = [];
  roundsLifetime = 0;
  resetDayCap();
  writeKeepChips([]);
}

export function removeKeepChip(id: string) {
  hydrate();
  writeKeepChips(chips.filter((chip) => chip.id !== id));
}

export function seedKeepDemo(force = false) {
  hydrate();
  if (force) {
    roundsLifetime = 0;
    resetDayCap();
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

export function readRoundsToday() {
  hydrate();
  rollDayCap();
  return roundsToday;
}

export function readRoundsLifetime() {
  hydrate();
  return roundsLifetime;
}

function hasDueRemainder(clusterId: string) {
  const ids = remainderFailed[clusterId];
  if (!ids?.length) return false;
  return ids.some((id) => chips.some((chip) => chip.id === id && isDueChip(chip)));
}

/** True when this tap is the first same-day remainder re-tap (does not consume a slot). */
export function isRemainderFreeTap(clusterId?: string | null) {
  hydrate();
  rollDayCap();
  if (!clusterId) return false;
  if (remainderFreeUsed[clusterId]) return false;
  return hasDueRemainder(clusterId);
}

export function canOpenRound(clusterId?: string | null) {
  hydrate();
  rollDayCap();
  if (isRemainderFreeTap(clusterId)) return true;
  return roundsToday < DAY_ROUND_CAP;
}

export function isDayCapped(clusterId?: string | null) {
  return !canOpenRound(clusterId);
}

export function roundOpenWasFree() {
  return lastOpenRemainderFree;
}

/**
 * Count a Home chip tap. Pass cluster id (or chip id) so remainder-free can apply.
 * False = blocked (day cap); B shows the day-cap line, do not open.
 */
export function recordRoundOpen(clusterId?: string | null, now = Date.now()) {
  hydrate();
  rollDayCap(now);
  if (isRemainderFreeTap(clusterId)) {
    remainderFreeUsed[clusterId as string] = true;
    lastOpenRemainderFree = true;
    persist();
    emit();
    return true;
  }
  lastOpenRemainderFree = false;
  if (roundsToday >= DAY_ROUND_CAP) {
    persist();
    emit();
    return false;
  }
  roundsToday += 1;
  persist();
  emit();
  return true;
}

export function readLoopStats() {
  hydrate();
  rollDayCap();
  return {
    due: chips.filter(isDueChip).length,
    keep: chips.filter(isBankedChip).length,
    mastered: chips.filter(isMasteredChip).length,
    total: chips.filter((chip) => !chip.id.startsWith("keep-")).length,
    cap: KEEP_CAP,
    roundsToday,
    dayCap: DAY_ROUND_CAP,
    dayCapped: roundsToday >= DAY_ROUND_CAP,
    roundsLifetime,
  };
}

export type ChipRoundResult = { id: string; passed: boolean };

export type FinishRoundSplit = {
  passedIds: string[];
  failedIds: string[];
  /** True when this dismiss was the free remainder retry — roundsLifetime was not bumped. */
  remainderFree: boolean;
};

function normalizeRoundResults(
  results: ChipRoundResult[] | string[],
  legacy?: "clean" | "miss"
): ChipRoundResult[] {
  const first = results[0];
  if (first && typeof first === "object" && "passed" in first) {
    return results as ChipRoundResult[];
  }
  const passed = legacy !== "miss";
  return (results as string[]).map((id) => ({ id, passed }));
}

function rememberRemainders(list: HarvestChip[], failedIds: string[], touchedClusters: Set<string>) {
  for (const key of touchedClusters) {
    const failed = failedIds.filter((id) => {
      const chip = list.find((item) => item.id === id);
      return chip && clusterKeyFor(chip) === key;
    });
    if (failed.length) {
      remainderFailed[key] = failed;
    } else {
      delete remainderFailed[key];
      delete remainderFreeUsed[key];
    }
  }
}

/**
 * Per-chip pass/fail at Done. Passed bank (1d/3d/7d; gold off dock).
 * Failed stay due today. r3 fail resets that chip to r1 (`clears` 0).
 * Legacy: `finishRound(ids, "clean" | "miss")` still works for Mix / old B.
 */
export function finishRound(
  results: ChipRoundResult[] | string[],
  legacy?: "clean" | "miss"
): FinishRoundSplit {
  hydrate();
  const list = normalizeRoundResults(results, legacy);
  const skipLifetime = lastOpenRemainderFree;
  lastOpenRemainderFree = false;
  if (!skipLifetime) roundsLifetime += 1;

  const now = Date.now();
  const byId = new Map(list.map((row) => [row.id, row.passed]));
  const passedIds: string[] = [];
  const failedIds: string[] = [];
  const touchedClusters = new Set<string>();

  const next = chips.map((chip) => {
    if (!byId.has(chip.id) || isGoldOrMastered(chip)) return chip;
    touchedClusters.add(clusterKeyFor(chip));
    const passed = byId.get(chip.id)!;
    if (passed) {
      passedIds.push(chip.id);
      const clears = (chip.clears ?? 0) + 1;
      const gold = clears >= MASTER_AFTER;
      return {
        ...chip,
        clears,
        lastResult: "ok" as const,
        dueAt: nextDueAt(clears, now),
        seat: gold ? ("mastered" as const) : ("keep" as const),
      };
    }
    failedIds.push(chip.id);
    const r3 = (chip.clears ?? 0) >= 2;
    return {
      ...chip,
      seat: "home" as const,
      lastResult: "miss" as const,
      dueAt: now,
      clears: r3 ? 0 : chip.clears,
    };
  });

  rememberRemainders(next, failedIds, touchedClusters);
  writeKeepChips(passedIds.length ? moveIdsToEnd(next, new Set(passedIds)) : next);
  return { passedIds, failedIds, remainderFree: skipLifetime };
}

export function gradeChips(ids: string[], result: "ok" | "miss") {
  finishRound(ids, result === "ok" ? "clean" : "miss");
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
  const now = Date.now();
  writeKeepChips(
    chips.map((chip) => {
      if (isGoldOrMastered(chip)) return chip;
      return { ...chip, dueAt: now, seat: "home" as const, heat: wakeHeat(chip) };
    })
  );
}

export function bankDue() {
  hydrate();
  const now = Date.now();
  writeKeepChips(
    chips.map((chip) => {
      if (chip.id.startsWith("keep-") || isGoldOrMastered(chip)) return chip;
      const waiting =
        chipSeat(chip) === "home" || (chip.dueAt != null && chip.dueAt <= now);
      return waiting ? { ...chip, seat: "keep" as const, dueAt: undefined } : chip;
    })
  );
}

export function masterDue() {
  hydrate();
  const now = Date.now();
  writeKeepChips(
    chips.map((chip) =>
      chipSeat(chip) === "home"
        ? {
            ...chip,
            seat: "mastered" as const,
            clears: MASTER_AFTER,
            lastResult: "ok" as const,
            dueAt: nextDueAt(MASTER_AFTER, now),
          }
        : chip
    )
  );
}

export function spawnLabFact() {
  hydrate();
  const n = Date.now();
  const stamp = `${n}-${chips.length}`;
  const kinds: HarvestChip["kind"][] = ["who", "where", "when", "meaning"];
  const kind = kinds[n % 4];
  addKeepChip({
    id: `lab-${stamp}`,
    token: `Lab fact ${stamp}`,
    span: `Lab fact ${stamp}`,
    kind,
    prompt: `What is lab fact ${stamp}?`,
    promptB: `Name lab fact ${stamp}.`,
    answer: `Lab fact ${stamp}`,
    hint: "Spawned from Mix → Loop.",
    cluster: `lab-${stamp}`,
    heat: "rest",
    seat: "keep",
  });
}

/** Three Nile facts due; everything else in Keep — one clear can empty Home. */
export function seedTutorialPack() {
  hydrate();
  roundsLifetime = 0;
  resetDayCap();
  writeKeepChips(
    PREVIEW_HOME_CHIPS.map((chip, i) => {
      const nile = chip.cluster === "nile";
      return withSeat(
        stampKeptAt(
          {
            ...chip,
            clears: 0,
            lastResult: undefined,
            dueAt: undefined,
          },
          1_000_000 + i * 1000
        ),
        nile ? "home" : "keep"
      );
    })
  );
}
