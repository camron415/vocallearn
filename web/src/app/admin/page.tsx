import { redirect } from "next/navigation";
import { AdminBoard } from "@/components/AdminBoard";
import { loadHaloProfile } from "@/lib/halo-profile";
import { createClient } from "@/lib/supabase/server";

type MemberRow = {
  user_id: string;
  role: string;
  lane?: string | null;
  created_at: string;
};

type EventRow = {
  user_id: string;
  kind: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await loadHaloProfile(supabase, user);
  if (!profile.isAdmin) redirect("/ask");

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const membersQuery = await supabase
    .from("halo_members")
    .select("user_id, role, lane, created_at")
    .order("created_at", { ascending: true });
  const members =
    membersQuery.error
      ? (
          await supabase
            .from("halo_members")
            .select("user_id, role, created_at")
            .order("created_at", { ascending: true })
        ).data
      : membersQuery.data;

  const [{ data: profiles }, { data: events }, { data: conversations }] =
    await Promise.all([
      supabase.from("profiles").select("id, display_name"),
      supabase
        .from("halo_events")
        .select("user_id, kind, created_at")
        .gte("created_at", since.toISOString()),
      supabase
        .from("ask_conversations")
        .select("id, title")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(40),
    ]);

  const names = new Map(
    ((profiles ?? []) as ProfileRow[]).map((row) => [
      row.id,
      row.display_name || "Someone",
    ])
  );

  const people = ((members ?? []) as MemberRow[]).map((member) => {
    const theirs = ((events ?? []) as EventRow[]).filter(
      (event) => event.user_id === member.user_id
    );
    const last = theirs
      .map((event) => event.created_at)
      .sort()
      .at(-1);
    return {
      id: member.user_id,
      name: names.get(member.user_id) || "Someone",
      role: member.role,
      lane: member.lane ?? "family",
      asks: theirs.filter((event) => event.kind === "ask").length,
      recipes: theirs.filter((event) => event.kind === "recipe_save").length,
      lastActive: last ?? member.created_at,
    };
  });

  return (
    <AdminBoard
      people={people}
      conversations={conversations ?? []}
      profile={profile}
    />
  );
}
