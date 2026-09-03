import { NextResponse } from "next/server";
import { extractRecipe } from "@/lib/recipes";
import { trackHaloEvent } from "@/lib/track";
import { createClient } from "@/lib/supabase/server";
import { sanitizeModelText } from "@/lib/markdown-plain";
import type { GrokMessage } from "@/lib/grok";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { conversationId?: string; markdown?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const conversationId =
    typeof body.conversationId === "string" ? body.conversationId.trim() : "";
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversation" }, { status: 400 });
  }

  const { data: chat } = await supabase
    .from("ask_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const { data: rows } = await supabase
    .from("ask_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(40);

  const history: GrokMessage[] = (rows ?? [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: sanitizeModelText(String(m.content ?? "")),
    }));

  const markdown =
    typeof body.markdown === "string" ? body.markdown.slice(0, 8000) : "";

  const extracted = await extractRecipe(history, markdown);
  if (!extracted) {
    return NextResponse.json(
      { error: "Couldn't find a recipe in this chat to save." },
      { status: 422 }
    );
  }

  const { data: saved, error } = await supabase
    .from("halo_recipes")
    .insert({
      user_id: user.id,
      conversation_id: conversationId,
      title: extracted.title,
      ingredients: extracted.ingredients,
      steps: extracted.steps,
    })
    .select("id, title")
    .single();

  if (error || !saved) {
    return NextResponse.json(
      { error: "Could not save that recipe." },
      { status: 500 }
    );
  }

  await trackHaloEvent(supabase, user.id, "recipe_save", {
    via: "save_offer",
  });

  return NextResponse.json({ id: saved.id, title: saved.title });
}
