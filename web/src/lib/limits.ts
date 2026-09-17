export type HaloLane = "family" | "tester" | "lab";

export const SITE_LANE: HaloLane =
  process.env.NEXT_PUBLIC_APP_LANE === "lab" ||
  process.env.NEXT_PUBLIC_APP_LANE === "tester"
    ? process.env.NEXT_PUBLIC_APP_LANE
    : "family";

/** Grok 4.3, under 200k prompt tokens. */
const GROK_INPUT_USD_PER_M = 1.25;
const GROK_CACHED_USD_PER_M = 0.2;
const GROK_OUTPUT_USD_PER_M = 2.5;

/** Luna meter list (runtime model is GPT_LUNA_MODEL, default gpt-4.1-mini). */
const LUNA_INPUT_USD_PER_M = 0.2;
const LUNA_CACHED_USD_PER_M = 0.02;
const LUNA_OUTPUT_USD_PER_M = 1.2;

const MICROS = 1_000_000;

/** Server + client compose cap. Does not apply to attachments. */
export const ASK_MESSAGE_MAX_CHARS = Number(
  process.env.HALO_ASK_MESSAGE_MAX_CHARS || 2000
);

/** Documented for a while — now enforced server-side. */
export const ASK_DAILY_MESSAGE_CAP = Number(
  process.env.HALO_DAILY_MESSAGE_CAP || 40
);

/** Parallel send / scripted burst. One in-flight answer per account. */
export const ASK_BURST_PER_MINUTE = Number(
  process.env.HALO_ASK_BURST_PER_MIN || 8
);
export const ASK_MAX_INFLIGHT = Number(process.env.HALO_ASK_MAX_INFLIGHT || 1);

/** ChatGPT Free is 3 files/day. Family photos need a little more. */
export const ASK_DAILY_FILE_CAP = Number(process.env.HALO_ASK_DAILY_FILES || 6);

/** JSON body with 3×4MB base64 would be huge; Vercel already sits near 4.5MB. */
export const ASK_MAX_BODY_BYTES = Number(
  process.env.HALO_ASK_MAX_BODY_BYTES || 4_500_000
);

/** Drop stale reservations if a stream crashes mid-turn. */
export const ASK_RESERVE_TTL_MS = 3 * 60 * 1000;

/** Weekly spend cap. Family and early access share $1 — about 50 heavier asks. */
export const WEEKLY_BUDGET_USD: Record<HaloLane, number> = {
  family: 1,
  tester: 1,
  lab: 12,
};

/** Per-user monthly cap when HALO_USER_BUDGET_PERIOD=month (planned free tier). */
export const MONTHLY_BUDGET_USD: Record<HaloLane, number> = {
  family: Number(process.env.HALO_MONTHLY_BUDGET_USD) || 1,
  tester: Number(process.env.HALO_MONTHLY_BUDGET_USD) || 1,
  lab: 12,
};

export type UserBudgetPeriod = "week" | "month";

export function userBudgetPeriod(): UserBudgetPeriod {
  return process.env.HALO_USER_BUDGET_PERIOD === "month" ? "month" : "week";
}

/** Whole household, rolling 30 days. ~8 people at $3–4 each. */
export const HOUSEHOLD_MONTHLY_USD = 30;

export function isHaloLane(value: string | null | undefined): value is HaloLane {
  return value === "family" || value === "tester" || value === "lab";
}

export function weeklyBudgetMicros(lane: HaloLane) {
  return Math.round(WEEKLY_BUDGET_USD[lane] * MICROS);
}

export function monthlyBudgetMicros(lane: HaloLane) {
  return Math.round(MONTHLY_BUDGET_USD[lane] * MICROS);
}

export function userBudgetMicros(lane: HaloLane) {
  return userBudgetPeriod() === "month"
    ? monthlyBudgetMicros(lane)
    : weeklyBudgetMicros(lane);
}

export function householdMonthlyMicros() {
  return Math.round(HOUSEHOLD_MONTHLY_USD * MICROS);
}

function providerCostMicros(
  inputUsdPerM: number,
  cachedUsdPerM: number,
  outputUsdPerM: number,
  inputTokens: number,
  outputTokens: number,
  cachedTokens = 0
) {
  const cached = Math.max(0, Math.min(cachedTokens, inputTokens));
  const fresh = Math.max(0, inputTokens - cached);
  const usd =
    (fresh / 1e6) * inputUsdPerM +
    (cached / 1e6) * cachedUsdPerM +
    (outputTokens / 1e6) * outputUsdPerM;
  return Math.max(0, Math.round(usd * MICROS));
}

export function grokCostMicros(
  inputTokens: number,
  outputTokens: number,
  cachedTokens = 0
) {
  return providerCostMicros(
    GROK_INPUT_USD_PER_M,
    GROK_CACHED_USD_PER_M,
    GROK_OUTPUT_USD_PER_M,
    inputTokens,
    outputTokens,
    cachedTokens
  );
}

export function lunaCostMicros(
  inputTokens: number,
  outputTokens: number,
  cachedTokens = 0
) {
  return providerCostMicros(
    LUNA_INPUT_USD_PER_M,
    LUNA_CACHED_USD_PER_M,
    LUNA_OUTPUT_USD_PER_M,
    inputTokens,
    outputTokens,
    cachedTokens
  );
}

export function askCostMicros(
  provider: "luna" | "grok",
  inputTokens: number,
  outputTokens: number,
  cachedTokens = 0
) {
  return provider === "luna"
    ? lunaCostMicros(inputTokens, outputTokens, cachedTokens)
    : grokCostMicros(inputTokens, outputTokens, cachedTokens);
}

/** Used when the model does not return usage, or for older unmetered asks. */
export function estimateAskMicros(provider: "luna" | "grok" = "grok") {
  return provider === "luna"
    ? lunaCostMicros(2800, 450)
    : grokCostMicros(4500, 750);
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
