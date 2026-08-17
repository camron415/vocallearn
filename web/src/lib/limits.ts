export type HaloLane = "family" | "tester" | "lab";

export const SITE_LANE: HaloLane =
  process.env.NEXT_PUBLIC_APP_LANE === "lab" ||
  process.env.NEXT_PUBLIC_APP_LANE === "tester"
    ? process.env.NEXT_PUBLIC_APP_LANE
    : "family";

/** Grok 4.3, under 200k prompt tokens. */
const INPUT_USD_PER_M = 1.25;
const CACHED_USD_PER_M = 0.2;
const OUTPUT_USD_PER_M = 2.5;

const MICROS = 1_000_000;

/** Weekly spend cap. Family and early access share $1 — about 50 heavier asks. */
export const WEEKLY_BUDGET_USD: Record<HaloLane, number> = {
  family: 1,
  tester: 1,
  lab: 12,
};

/** Whole household, rolling 30 days. ~8 people at $3–4 each. */
export const HOUSEHOLD_MONTHLY_USD = 30;

export function isHaloLane(value: string | null | undefined): value is HaloLane {
  return value === "family" || value === "tester" || value === "lab";
}

export function weeklyBudgetMicros(lane: HaloLane) {
  return Math.round(WEEKLY_BUDGET_USD[lane] * MICROS);
}

export function householdMonthlyMicros() {
  return Math.round(HOUSEHOLD_MONTHLY_USD * MICROS);
}

export function grokCostMicros(
  inputTokens: number,
  outputTokens: number,
  cachedTokens = 0
) {
  const cached = Math.max(0, Math.min(cachedTokens, inputTokens));
  const fresh = Math.max(0, inputTokens - cached);
  const usd =
    (fresh / 1e6) * INPUT_USD_PER_M +
    (cached / 1e6) * CACHED_USD_PER_M +
    (outputTokens / 1e6) * OUTPUT_USD_PER_M;
  return Math.max(0, Math.round(usd * MICROS));
}

/** Used when Grok does not return usage, or for older unmetered asks. */
export function estimateAskMicros() {
  return grokCostMicros(4500, 750);
}

export function eventCostMicros(meta: unknown) {
  const rec =
    meta && typeof meta === "object" ? (meta as Record<string, unknown>) : null;
  const raw = rec?.costMicros;
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) return raw;
  return estimateAskMicros();
}

export function usagePercent(spentMicros: number, capMicros: number) {
  if (capMicros <= 0) return 0;
  return Math.min(100, Math.round((spentMicros / capMicros) * 100));
}

export function formatUsd(micros: number) {
  const usd = Math.max(0, micros) / MICROS;
  if (usd < 0.005) return "0¢";
  if (usd < 1) return `${Math.round(usd * 100)}¢`;
  if (Math.abs(usd - Math.round(usd)) < 0.005) return `$${Math.round(usd)}`;
  return `$${usd.toFixed(2)}`;
}

export function laneLabel(lane: HaloLane) {
  if (lane === "lab") return "Lab";
  if (lane === "tester") return "Early access";
  return "Family";
}
