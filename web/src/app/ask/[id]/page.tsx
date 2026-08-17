import { notFound, redirect } from "next/navigation";
import { ChatThread } from "@/components/ChatThread";
import { loadHaloProfile } from "@/lib/halo-profile";
import { createClient } from "@/lib/supabase/server";
import type { AskMessage } from "@/lib/types";

export default async function AskConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: conversation } = await supabase
    .from("ask_conversations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!conversation) notFound();

  const profile = await loadHaloProfile(supabase, user);

  const [{ data: messages }, { data: conversations }] = await Promise.all([
    supabase
      .from("ask_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("ask_conversations")
      .select("id, title")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(40),
  ]);

  return (
    <ChatThread
      conversationId={id}
      title={conversation.title}
      initialMessages={(messages ?? []) as AskMessage[]}
      conversations={conversations ?? []}
      profile={profile}
    />
  );
}
