import type { SupabaseClient } from "@supabase/supabase-js";
import {
  householdMonthlyMicros,
  isHaloLane,
  userBudgetMicros,
  userBudgetPeriod,
  weeklyBudgetMicros,
  type HaloLane,
} from "@/lib/limits";
import { spendSince as spendSinceGuarded } from "@/lib/ask-guard";

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
  const micros = await spendSinceGuarded(supabase, since, userId);
  return micros ?? 0;
}

export async function usageSnapshot(
  supabase: SupabaseClient,
  userId: string
) {
  const lane = await loadMemberLane(supabase, userId);
  const budgetDays = userBudgetPeriod() === "month" ? 30 : 7;
  const [spentUser, householdMonth] = await Promise.all([
    spendSinceGuarded(supabase, daysAgo(budgetDays), userId),
    spendSinceGuarded(supabase, daysAgo(30)),
  ]);
  const spentWeek = spentUser ?? 0;
  return {
    lane,
    spentWeek,
    weekCap: userBudgetMicros(lane),
    householdMonth: householdMonth ?? 0,
    householdCap: householdMonthlyMicros(),
    period: userBudgetPeriod(),
    weekCapLegacy: weeklyBudgetMicros(lane),
  };
}
