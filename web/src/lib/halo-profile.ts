import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isHaloLane } from "@/lib/limits";
import type { HaloProfile } from "@/lib/types";

export async function loadHaloProfile(
  supabase: SupabaseClient,
  user: User
): Promise<HaloProfile> {
  const [{ data: profile, error: profileError }, memberResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, answer_length, halo_onboarded_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("halo_members")
      .select("role, lane")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  let member: { role?: string | null; lane?: string | null } | null =
    memberResult.data;
  if (memberResult.error) {
    const retry = await supabase
      .from("halo_members")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    member = retry.data;
  }

  const length = profile?.answer_length;
  return {
    displayName:
      profile?.display_name ||
      (user.user_metadata?.display_name as string | undefined) ||
      user.email?.split("@")[0] ||
      "friend",
    answerLength:
      length === "short" || length === "long" || length === "medium"
        ? length
        : "medium",
    onboarded: profileError ? true : Boolean(profile?.halo_onboarded_at),
    isAdmin: member?.role === "admin",
    lane: isHaloLane(member?.lane) ? member.lane : "family",
  };
}
