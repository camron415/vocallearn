import { clipAtWord, titleFromFirstMessage } from "@/lib/constants";
import { summarizeChatTitle } from "@/lib/grok";
import { ASK_MESSAGE_MAX_CHARS } from "@/lib/limits";
import { sanitizeModelText, splitMessageSources } from "@/lib/markdown-plain";
import { attachmentNote } from "@/lib/files";
import { estimateTurnMicros, gateAskTurn } from "@/lib/ask-guard";
import type { GrokMessage } from "@/lib/grok";
import type { ChatAttachment } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadMemberLane } from "@/lib/usage";

export type AskTurn =
  | {
      ok: true;
      conversationId: string;
      history: GrokMessage[];
      userText: string;
    }
  | { ok: false; status: number; error: string };

/** Trim history before sending to the model — full text stays in the DB for the UI. */
function prepareHistoryForApi(messages: GrokMessage[]): GrokMessage[] {
  const MAX_MESSAGES = 24;
  const RECENT_FULL = 8;
  const OLD_CLIP = 900;

  return messages.slice(-MAX_MESSAGES).map((m, i, list) => {
    const recent = i >= list.length - RECENT_FULL;
    let content = typeof m.content === "string" ? m.content : "";

    if (m.role === "assistant") {
      content = splitMessageSources(content).body;
    }

    if (!recent && content.length > OLD_CLIP) {
      content = clipAtWord(content, OLD_CLIP);
    }

    return { role: m.role, content };
  });
}

async function loadHistory(
  supabase: SupabaseClient,
  conversationId: string
): Promise<{ history: GrokMessage[]; error?: string }> {
  const { data: history, error } = await supabase
    .from("ask_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(40);

  if (error) return { history: [], error: error.message };

  const rows = (history ?? [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: sanitizeModelText(m.content as string),
    }));

  return { history: prepareHistoryForApi(rows) };
}

export async function prepareAskTurn(
  supabase: SupabaseClient,
  user: User,
  body: {
    conversationId?: string | null;
    message?: string;
    resume?: boolean;
    prepareOnly?: boolean;
    attachments?: ChatAttachment[];
  }
): Promise<AskTurn> {
  const attachments = body.attachments ?? [];
  const text =
    (body.message ?? "").trim() ||
    (attachments.length ? "Look at this." : "");
  const resume = Boolean(body.resume);

  if (!resume && !text) {
    return { ok: false, status: 400, error: "Message required" };
  }
  if (text.length > ASK_MESSAGE_MAX_CHARS) {
    return {
      ok: false,
      status: 400,
      error: `Message too long (max ${ASK_MESSAGE_MAX_CHARS} characters).`,
    };
  }

  const lane = await loadMemberLane(supabase, user.id);
  const gated = await gateAskTurn(supabase, user.id, lane, {
    files: attachments.length,
    estimateMicros: estimateTurnMicros({
      provider: attachments.length ? "grok" : "luna",
      files: attachments.length,
      search: false,
    }),
  });
  if (!gated.ok) {
    return { ok: false, status: gated.status, error: gated.error };
  }

  let conversationId = body.conversationId ?? null;

  if (!conversationId) {
    const { data: created, error: createError } = await supabase
      .from("ask_conversations")
      .insert({
        user_id: user.id,
        title: titleFromFirstMessage(text || attachments[0]?.name || "New chat"),
      })
      .select("*")
      .single();

    if (createError || !created) {
      return {
        ok: false,
        status: 500,
        error: "Could not start that chat.",
      };
    }
    conversationId = created.id;
  } else {
    const { data: owned } = await supabase
      .from("ask_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!owned) {
      return { ok: false, status: 404, error: "Chat not found" };
    }
  }

  if (!conversationId) {
    return { ok: false, status: 500, error: "Failed to create chat" };
  }

  if (!resume) {
    const { error: userMsgError } = await supabase.from("ask_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: `${text}${attachmentNote(attachments)}`,
    });
    if (userMsgError) {
      return { ok: false, status: 500, error: "Could not save that message." };
    }
  }

  const loaded = await loadHistory(supabase, conversationId);
  if (loaded.error) {
    return { ok: false, status: 500, error: "Could not load that chat." };
  }

  const lastUser = [...loaded.history].reverse().find((m) => m.role === "user");
  const userText =
    (typeof lastUser?.content === "string" ? lastUser.content : "") || text;
  if (!userText) {
    return { ok: false, status: 400, error: "Nothing to resume" };
  }

  if (resume) {
    const last = loaded.history[loaded.history.length - 1];
    if (last?.role !== "user") {
      return { ok: false, status: 409, error: "Nothing to resume" };
    }
  }

  return {
    ok: true,
    conversationId,
    history: loaded.history,
    userText,
  };
}

export async function saveAssistantReply(
  supabase: SupabaseClient,
  conversationId: string,
  history: GrokMessage[],
  userText: string,
  reply: string
) {
  const { data: assistantRow, error: assistantError } = await supabase
    .from("ask_messages")
    .insert({
      conversation_id: conversationId,
      role: "assistant",
      content: reply,
    })
    .select("*")
    .single();

  const firstReply = !history.some((m) => m.role === "assistant");
  const title = firstReply
    ? await summarizeChatTitle(userText)
    : undefined;

  await supabase
    .from("ask_conversations")
    .update({
      updated_at: new Date().toISOString(),
      ...(title ? { title } : {}),
    })
    .eq("id", conversationId);

  return { assistantRow, assistantError };
}
