import type { AnswerProvider } from "@/lib/ask-provider";
import {
  ASK_BURST_PER_MINUTE,
  ASK_DAILY_FILE_CAP,
  ASK_DAILY_MESSAGE_CAP,
  ASK_MAX_INFLIGHT,
  ASK_RESERVE_TTL_MS,
  askCostMicros,
  eventCostMicros,
  householdMonthlyMicros,
  userBudgetMicros,
  userBudgetPeriod,
  type HaloLane,
} from "@/lib/limits";
import { createServiceClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AskReserve = {
  id: string;
  estimateMicros: number;
};

function daysAgo(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return since;
}

function isStalePending(meta: Record<string, unknown>, createdAt: string) {
  if (meta.released === true) return true;
  const at = new Date(createdAt).getTime();
  return !Number.isFinite(at) || Date.now() - at > ASK_RESERVE_TTL_MS;
}

function costFromRow(kind: unknown, meta: unknown, createdAt: string) {
  const rec =
    meta && typeof meta === "object" ? (meta as Record<string, unknown>) : {};
  if (rec.released === true) return 0;
  if (kind === "ask_hold") {
    if (isStalePending(rec, createdAt)) return 0;
    return eventCostMicros(meta);
  }
  if (kind === "ask") return eventCostMicros(meta);
  return 0;
}

export function estimateTurnMicros(opts: {
  provider: AnswerProvider;
  files: number;
  search: boolean;
}) {
  if (opts.provider === "luna") {
    return askCostMicros("luna", 3200, 500) + askCostMicros("grok", 400, 80);
  }
  if (opts.files) {
    return askCostMicros("grok", 9000, 700) + askCostMicros("grok", 400, 80);
  }
  if (opts.search) {
    return askCostMicros("grok", 12000, 900) + askCostMicros("grok", 400, 80);
  }
  return askCostMicros("grok", 5000, 600) + askCostMicros("grok", 400, 80);
}

type MeterRow = {
  id?: string;
  kind?: string;
  meta: unknown;
  created_at: string;
};

/** Prefer service role so hold UPDATE and household SUM work even if RLS lags. */
function eventsClient(supabase: SupabaseClient) {
  return createServiceClient() ?? supabase;
}

async function loadAskRows(
  supabase: SupabaseClient,
  userId: string | undefined,
  since: Date
): Promise<MeterRow[] | null> {
  const client = eventsClient(supabase);
  let query = client
    .from("halo_events")
    .select("id, kind, meta, created_at")
    .in("kind", ["ask", "ask_hold"])
    .gte("created_at", since.toISOString());
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) return null;
  return (data ?? []) as MeterRow[];
}

export async function spendSince(
  supabase: SupabaseClient,
  since: Date,
  userId?: string
): Promise<number | null> {
  const rows = await loadAskRows(supabase, userId, since);
  if (!rows) return null;
  return rows.reduce(
    (sum, row) =>
      sum + costFromRow(row.kind, row.meta, String(row.created_at)),
    0
  );
}

function filesFromMeta(meta: unknown) {
  const rec =
    meta && typeof meta === "object" ? (meta as Record<string, unknown>) : {};
  const n = Number(rec.files);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export async function gateAskTurn(
  supabase: SupabaseClient,
  userId: string,
  lane: HaloLane,
  opts: { files: number; estimateMicros: number }
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const budgetDays = userBudgetPeriod() === "month" ? 30 : 7;
  const [userRows, houseRows] = await Promise.all([
    loadAskRows(supabase, userId, daysAgo(Math.max(budgetDays, 1))),
    loadAskRows(supabase, undefined, daysAgo(30)),
  ]);
  if (!userRows || !houseRows) {
    return {
      ok: false,
      status: 503,
      error: "Usage meter is unavailable. Try again in a moment.",
    };
  }

  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const minuteAgo = now - 60 * 1000;
  let spentUser = 0;
  let asksDay = 0;
  let asksMinute = 0;
  let inflight = 0;
  let filesDay = 0;

  for (const row of userRows) {
    const created = new Date(String(row.created_at)).getTime();
    const rec =
      row.meta && typeof row.meta === "object"
        ? (row.meta as Record<string, unknown>)
        : {};
    spentUser += costFromRow(row.kind, row.meta, String(row.created_at));
    if (rec.released === true) continue;
    const liveHold =
      row.kind === "ask_hold" && !isStalePending(rec, String(row.created_at));
    if (row.kind === "ask" || liveHold) {
      if (created >= dayAgo) {
        asksDay += 1;
        filesDay += filesFromMeta(row.meta);
      }
      if (created >= minuteAgo) asksMinute += 1;
    }
    if (liveHold) inflight += 1;
  }

  const householdMonth = houseRows.reduce(
    (sum, row) =>
      sum + costFromRow(row.kind, row.meta, String(row.created_at)),
    0
  );

  if (inflight >= ASK_MAX_INFLIGHT) {
    return {
      ok: false,
      status: 429,
      error: "Already answering. Wait for this reply, then ask again.",
    };
  }
  if (asksMinute >= ASK_BURST_PER_MINUTE) {
    return {
      ok: false,
      status: 429,
      error: "Slow down a bit, then try again.",
    };
  }
  if (asksDay >= ASK_DAILY_MESSAGE_CAP) {
    return {
      ok: false,
      status: 429,
      error: "Today’s message limit is reached. Try again tomorrow.",
    };
  }
  if (opts.files > 0 && filesDay + opts.files > ASK_DAILY_FILE_CAP) {
    return {
      ok: false,
      status: 429,
      error: `File limit for today is ${ASK_DAILY_FILE_CAP}. Try again tomorrow.`,
    };
  }
  if (spentUser + opts.estimateMicros > userBudgetMicros(lane)) {
    return {
      ok: false,
      status: 429,
      error:
        userBudgetPeriod() === "month"
          ? "This month’s limit is reached. Try again next month."
          : "This week’s limit is reached. Try again next week.",
    };
  }
  if (householdMonth + opts.estimateMicros > householdMonthlyMicros()) {
    return {
      ok: false,
      status: 429,
      error: "Household monthly limit reached. Ask Camron if you need more.",
    };
  }
  return { ok: true };
}

export async function claimAskTurn(
  supabase: SupabaseClient,
  userId: string,
  lane: HaloLane,
  opts: {
    files: number;
    provider: AnswerProvider;
    search: boolean;
  }
): Promise<
  | { ok: true; reservation: AskReserve }
  | { ok: false; status: number; error: string }
> {
  const estimateMicros = estimateTurnMicros(opts);
  const gated = await gateAskTurn(supabase, userId, lane, {
    files: opts.files,
    estimateMicros,
  });
  if (!gated.ok) return gated;

  const reservation = await reserveAskTurn(supabase, userId, {
    pending: true,
    costMicros: estimateMicros,
    files: opts.files,
    provider: opts.provider,
    search: opts.search,
  });
  if (!reservation) {
    return {
      ok: false,
      status: 503,
      error: "Usage meter is unavailable. Try again in a moment.",
    };
  }

  const pendingRows = await loadAskRows(supabase, userId, daysAgo(1));
  if (!pendingRows) {
    await releaseAskTurn(supabase, reservation.id);
    return {
      ok: false,
      status: 503,
      error: "Usage meter is unavailable. Try again in a moment.",
    };
  }
  const live = pendingRows.filter((row) => {
    const rec =
      row.meta && typeof row.meta === "object"
        ? (row.meta as Record<string, unknown>)
        : {};
    return (
      row.kind === "ask_hold" &&
      !isStalePending(rec, String(row.created_at))
    );
  });
  const spent = pendingRows.reduce(
    (sum, row) =>
      sum + costFromRow(row.kind, row.meta, String(row.created_at)),
    0
  );
  if (live.length > ASK_MAX_INFLIGHT || spent > userBudgetMicros(lane)) {
    await releaseAskTurn(supabase, reservation.id);
    return {
      ok: false,
      status: 429,
      error: "Already answering. Wait for this reply, then ask again.",
    };
  }

  return { ok: true, reservation };
}

export async function reserveAskTurn(
  supabase: SupabaseClient,
  userId: string,
  meta: Record<string, string | number | boolean | null>
): Promise<AskReserve | null> {
  const { data, error } = await supabase
    .from("halo_events")
    .insert({
      user_id: userId,
      kind: "ask_hold",
      meta: { ...meta, pending: true },
    })
    .select("id")
    .single();
  if (error || !data?.id) return null;
  return {
    id: String(data.id),
    estimateMicros: Number(meta.costMicros) || 0,
  };
}

export async function commitAskTurn(
  supabase: SupabaseClient,
  userId: string,
  reservationId: string,
  meta: Record<string, string | number | boolean | null>
) {
  const client = eventsClient(supabase);
  await client.from("halo_events").insert({
    user_id: userId,
    kind: "ask",
    meta: { ...meta, pending: false, holdId: reservationId },
  });
  await client
    .from("halo_events")
    .update({
      meta: { pending: false, released: true, costMicros: 0 },
    })
    .eq("id", reservationId)
    .eq("user_id", userId);
}

export async function releaseAskTurn(
  supabase: SupabaseClient,
  reservationId: string
) {
  const client = eventsClient(supabase);
  await client
    .from("halo_events")
    .update({
      meta: { pending: false, released: true, costMicros: 0 },
    })
    .eq("id", reservationId);
}
