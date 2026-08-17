import type { SupabaseClient } from "@supabase/supabase-js";
import {
  eventCostMicros,
  householdMonthlyMicros,
  isHaloLane,
  weeklyBudgetMicros,
  type HaloLane,
} from "@/lib/limits";

export async function loadMemberLane(
  supabase: SupabaseClient,
  userId: string
): Promise<HaloLane> {
  const { data, error } = await supabase
    .from("halo_members")
    .select("lane")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return "family";
  return isHaloLane(data?.lane) ? data.lane : "family";
}

function daysAgo(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return since;
}

export async function spendSince(
  supabase: SupabaseClient,
  since: Date,
  userId?: string
): Promise<number> {
  let query = supabase
    .from("halo_events")
    .select("meta")
    .eq("kind", "ask")
    .gte("created_at", since.toISOString());
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) return 0;
  return (data ?? []).reduce(
    (sum, row) => sum + eventCostMicros(row.meta),
    0
  );
}

export async function usageSnapshot(
  supabase: SupabaseClient,
  userId: string
) {
  const lane = await loadMemberLane(supabase, userId);
  const [spentWeek, householdMonth] = await Promise.all([
    spendSince(supabase, daysAgo(7), userId),
    spendSince(supabase, daysAgo(30)),
  ]);
  return {
    lane,
    spentWeek,
    weekCap: weeklyBudgetMicros(lane),
    householdMonth,
    householdCap: householdMonthlyMicros(),
  };
}
