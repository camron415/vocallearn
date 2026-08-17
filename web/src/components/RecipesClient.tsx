"use client";

import { useRouter } from "next/navigation";
import { RecipesBoard } from "@/components/RecipesBoard";
import type { HaloProfile, HaloRecipe } from "@/lib/types";
import type { HistoryItem } from "@/components/HistoryMenu";

export function RecipesClient({
  recipes,
  conversations,
  profile,
}: {
  recipes: HaloRecipe[];
  conversations: HistoryItem[];
  profile?: HaloProfile;
}) {
  const router = useRouter();
  return (
    <RecipesBoard
      recipes={recipes}
      conversations={conversations}
      profile={profile}
      onOpenChat={(id) => router.push(`/ask/${id}`)}
    />
  );
}
