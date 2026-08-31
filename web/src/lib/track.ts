import type { SupabaseClient } from "@supabase/supabase-js";

type EventKind = "ask" | "recipe_save" | "join" | "onboard" | "error" | "suggest" | "harvest";

export async function trackHaloEvent(
  supabase: SupabaseClient,
  userId: string,
  kind: EventKind,
  meta: Record<string, string | number | boolean | null> = {}
) {
  const { error } = await supabase.from("halo_events").insert({
    user_id: userId,
    kind,
    meta,
  });
  if (error) {
    // Table may not exist until 009 is run. Never block a turn on analytics.
    return;
  }
}
