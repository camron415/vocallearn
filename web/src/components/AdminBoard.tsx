"use client";

import { useRouter } from "next/navigation";
import { HaloHeader } from "@/components/HaloHeader";
import { isHaloLane, laneLabel } from "@/lib/limits";
import type { HaloProfile } from "@/lib/types";
import type { HistoryItem } from "@/components/HistoryMenu";

export function AdminBoard({
  people,
  conversations,
  profile,
}: {
  people: Array<{
    id: string;
    name: string;
    role: string;
    lane: string;
    asks: number;
    recipes: number;
    lastActive: string;
  }>;
  conversations: HistoryItem[];
  profile?: HaloProfile;
}) {
  const router = useRouter();

  return (
    <div className="ask-stage">
      <HaloHeader
        conversations={conversations}
        homeHref="/ask"
        showHome
        title="Family activity"
        profile={profile}
        onOpenChat={(id) => router.push(`/ask/${id}`)}
      />
      <main className="recipes-main">
        <p className="login-sub">
          Counts only. No chat text, no files, no recipes themselves. Last 7
          days for asks and saves.
        </p>
        <ul className="admin-list">
          {people.map((person) => (
            <li key={person.id} className="admin-row">
              <h2>{person.name}</h2>
              <p className="login-sub">
                {person.role === "admin" ? "Admin" : "Member"} ·{" "}
                {laneLabel(isHaloLane(person.lane) ? person.lane : "family")} ·
                last active {new Date(person.lastActive).toLocaleString()}
              </p>
              <p>
                {person.asks} asks · {person.recipes} recipes saved
              </p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
