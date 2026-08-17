import { AskLanding } from "@/components/AskLanding";
import { loadHaloProfile } from "@/lib/halo-profile";
import { createClient } from "@/lib/supabase/server";
import type { AskConversation } from "@/lib/types";

export default async function AskHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("ask_conversations")
    .select("*")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false })
    .limit(40);

  const profile = await loadHaloProfile(supabase, user!);

  return (
    <AskLanding
      conversations={(data ?? []) as AskConversation[]}
      displayName={profile.displayName}
      profile={profile}
    />
  );
}
