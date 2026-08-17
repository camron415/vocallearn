import { RecipesClient } from "@/components/RecipesClient";
import { createClient } from "@/lib/supabase/server";
import { loadHaloProfile } from "@/lib/halo-profile";
import type { HaloRecipe } from "@/lib/types";

export default async function RecipesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await loadHaloProfile(supabase, user) : undefined;

  const [{ data: recipes }, { data: conversations }] = await Promise.all([
    supabase
      .from("halo_recipes")
      .select("id, title, ingredients, steps, photo_path, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("ask_conversations")
      .select("id, title")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false })
      .limit(40),
  ]);

  return (
    <RecipesClient
      recipes={(recipes ?? []) as HaloRecipe[]}
      conversations={conversations ?? []}
      profile={profile}
    />
  );
}
