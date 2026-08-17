import { NextResponse } from "next/server";
import { prepareAskTurn, saveAssistantReply } from "@/lib/ask-turn";
import { attachmentsToGrokParts } from "@/lib/files";
import { pickReasoningEffort } from "@/lib/grok";
import { streamGrokChat } from "@/lib/grok-stream";
import { grokCostMicros, estimateAskMicros } from "@/lib/limits";
import { encodeHaloEvent, type HaloStreamEvent } from "@/lib/halo-stream";
import { extractRecipe, firstImageAttachment, isSaveRecipeCommand } from "@/lib/recipes";
import { saveRecipePhoto } from "@/lib/recipe-photo";
import { trackHaloEvent } from "@/lib/track";
import { createClient } from "@/lib/supabase/server";
import type { AnswerLength, AskMessage, ChatAttachment } from "@/lib/types";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

async function loadAnswerLength(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<AnswerLength> {
  const { data } = await supabase
    .from("profiles")
    .select("answer_length")
    .eq("id", userId)
    .maybeSingle();
  const value = data?.answer_length;
  if (value === "short" || value === "long" || value === "medium") return value;
  return "medium";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member, error: memberError } = await supabase
    .from("halo_members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (memberError || !member) {
    return NextResponse.json(
      { error: "This account is not invited." },
      { status: 403 }
    );
  }

  let body: {
    conversationId?: string | null;
    message?: string;
    resume?: boolean;
    prepareOnly?: boolean;
    attachments?: ChatAttachment[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const attachments = Array.isArray(body.attachments) ? body.attachments : [];

  const prepared = await prepareAskTurn(supabase, user, {
    ...body,
    attachments,
  });
  if (!prepared.ok) {
    return NextResponse.json(
      { error: prepared.error },
      { status: prepared.status }
    );
  }

  if (body.prepareOnly) {
    return NextResponse.json({ conversationId: prepared.conversationId });
  }

  const { conversationId, userText } = prepared;
  let { history } = prepared;

  if (attachments.length) {
    try {
      const parts = await attachmentsToGrokParts(attachments);
      const last = history[history.length - 1];
      if (last?.role === "user" && parts.length) {
        last.content = [{ type: "input_text", text: userText }, ...parts];
      }
    } catch (err) {
      return NextResponse.json(
        { error: "Could not attach that file." },
        { status: 400 }
      );
    }
  }

  if (isSaveRecipeCommand(userText)) {
    const extracted = await extractRecipe(history);
    const photo = firstImageAttachment(attachments);
    const reply = extracted
      ? photo
        ? `Saved **${extracted.title}** to Recipes, with the photo. Open Recipes from the header anytime.`
        : `Saved **${extracted.title}** to Recipes. You can add a photo there, or attach one next time you save.`
      : "I couldn't find a recipe in this chat to save. Ask me for one first, then say “save this recipe.”";

    if (extracted) {
      const { data: saved } = await supabase
        .from("halo_recipes")
        .insert({
          user_id: user.id,
          conversation_id: conversationId,
          title: extracted.title,
          ingredients: extracted.ingredients,
          steps: extracted.steps,
        })
        .select("id")
        .single();

      if (saved?.id && photo) {
        await saveRecipePhoto(user.id, saved.id, photo);
      }

      await trackHaloEvent(supabase, user.id, "recipe_save", {
        files: attachments.length,
        photo: Boolean(photo),
      });
    }

    const { assistantRow, assistantError } = await saveAssistantReply(
      supabase,
      conversationId,
      history,
      userText,
      reply
    );
    const fallback: AskMessage = {
      id: `local-${Date.now()}`,
      conversation_id: conversationId,
      role: "assistant",
      content: reply,
      created_at: new Date().toISOString(),
    };
    return NextResponse.json({
      conversationId,
      reply: assistantError || !assistantRow ? fallback : assistantRow,
    });
  }

  const encoder = new TextEncoder();
  const effort = pickReasoningEffort(userText);
  const answerLength = await loadAnswerLength(supabase, user.id);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: HaloStreamEvent) => {
        controller.enqueue(encoder.encode(encodeHaloEvent(event)));
      };

      try {
        for await (const live of streamGrokChat(history, {
          effort,
          answerLength,
        })) {
          if (live.type === "done") {
            const { assistantRow, assistantError } = await saveAssistantReply(
              supabase,
              conversationId,
              history,
              userText,
              live.text
            );
            const costMicros = live.usage
              ? grokCostMicros(
                  live.usage.inputTokens,
                  live.usage.outputTokens,
                  live.usage.cachedTokens
                )
              : estimateAskMicros();
            await trackHaloEvent(supabase, user.id, "ask", {
              files: attachments.length,
              search: live.text.includes("## Sources"),
              costMicros,
              inputTokens: live.usage?.inputTokens ?? 0,
              outputTokens: live.usage?.outputTokens ?? 0,
            });
            if (assistantError || !assistantRow) {
              const fallback: AskMessage = {
                id: `local-${Date.now()}`,
                conversation_id: conversationId,
                role: "assistant",
                content: live.text,
                created_at: new Date().toISOString(),
              };
              send({ type: "done", conversationId, reply: fallback });
            } else {
              send({
                type: "done",
                conversationId,
                reply: assistantRow as AskMessage,
              });
            }
            continue;
          }
          send(live);
        }
      } catch (e) {
        send({
          type: "error",
          error: "Something went wrong. Try again.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
