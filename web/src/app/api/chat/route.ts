import { NextResponse } from "next/server";
import { prepareAskTurn, saveAssistantReply } from "@/lib/ask-turn";
import { attachmentsToGrokParts } from "@/lib/files";
import {
  resolveAskRoute,
  liveLookupContext,
  harvestAnswerHint,
  answerLengthForRoute,
} from "@/lib/ask-route";
import { ASK_SYSTEM_PROMPT } from "@/lib/constants";
import { streamGrokChat } from "@/lib/grok-stream";
import { grokCostMicros, estimateAskMicros } from "@/lib/limits";
import { encodeHaloEvent, type HaloStreamEvent } from "@/lib/halo-stream";
import {
  geoFromProfile,
  loadHaloProfile,
  rememberHaloGeo,
} from "@/lib/halo-profile";
import { isIanaTimeZone } from "@/lib/local-day";
import { extractRecipe, firstImageAttachment, isSaveRecipeCommand } from "@/lib/recipes";
import { saveRecipePhoto } from "@/lib/recipe-photo";
import { geoFromRequest, localeLine, mergeHaloGeo } from "@/lib/request-geo";
import { trackHaloEvent } from "@/lib/track";
import { createClient } from "@/lib/supabase/server";
import { attachSources } from "@/lib/markdown-plain";
import type { AskMessage, ChatAttachment } from "@/lib/types";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

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
    timeZone?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const attachments = Array.isArray(body.attachments) ? body.attachments : [];

  const profile = await loadHaloProfile(supabase, user);
  const clientTz =
    typeof body.timeZone === "string" && isIanaTimeZone(body.timeZone)
      ? body.timeZone
      : undefined;
  const geo = mergeHaloGeo(
    geoFromProfile(profile),
    geoFromRequest(request),
    clientTz ? { timeZone: clientTz } : null
  );
  void rememberHaloGeo(supabase, user.id, geo);

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
      const detail = err instanceof Error ? err.message : "";
      return NextResponse.json(
        {
          error: detail.includes("too large")
            ? detail
            : "Could not attach that file. Try a smaller JPG, PNG, or PDF.",
        },
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
  const route = resolveAskRoute(userText, attachments.length > 0);
  const answerLength = answerLengthForRoute(route);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: HaloStreamEvent) => {
        controller.enqueue(encoder.encode(encodeHaloEvent(event)));
      };

      try {
        let system: string | undefined;
        let lookupSources: { label: string; url: string }[] = [];
        const harvestHint = harvestAnswerHint(userText);
        const useLive = route.kind === "lookup" || route.seedLive;
        if (useLive) {
          send({ type: "status", status: "checking" });
          const live = await liveLookupContext(userText, {
            allowSearch: Boolean(route.tools),
            geo,
          });
          lookupSources = live.sources;
          system = [ASK_SYSTEM_PROMPT, live.systemExtra, harvestHint]
            .filter(Boolean)
            .join("\n\n");
          for (const src of lookupSources.slice(0, 4)) {
            send({ type: "status", status: "reading", detail: src.label });
          }
        }

        for await (const live of streamGrokChat(history, {
          effort: route.effort,
          answerLength,
          tools: route.tools,
          maxToolCalls: route.maxToolCalls,
          timeZone: geo.timeZone,
          system:
            system ??
            [ASK_SYSTEM_PROMPT, localeLine(geo), harvestHint]
              .filter(Boolean)
              .join("\n\n"),
        })) {
          if (live.type === "done") {
            const finalText = lookupSources.length
              ? attachSources(live.text, lookupSources)
              : live.text;
            const { assistantRow, assistantError } = await saveAssistantReply(
              supabase,
              conversationId,
              history,
              userText,
              finalText
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
              search: route.tools,
              route: route.kind,
              costMicros,
              inputTokens: live.usage?.inputTokens ?? 0,
              outputTokens: live.usage?.outputTokens ?? 0,
            });
            if (assistantError || !assistantRow) {
              const fallback: AskMessage = {
                id: `local-${Date.now()}`,
                conversation_id: conversationId,
                role: "assistant",
                content: finalText,
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
            const harvested = await import("@/lib/learn-mine").then(
              ({ mineLearnFromTurn }) =>
                mineLearnFromTurn(
                  supabase,
                  user.id,
                  conversationId,
                  userText,
                  live.text
                )
            );
            void trackHaloEvent(supabase, user.id, "harvest", {
              conversationId,
              skipped: harvested.length === 0,
              cardCount: harvested.length,
              kinds: [...new Set(harvested.map((chip) => chip.kind))].join(","),
            });
            if (harvested.length) {
              send({ type: "harvest", chips: harvested });
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
