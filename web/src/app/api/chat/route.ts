import { NextResponse } from "next/server";
import { prepareAskTurn, saveAssistantReply } from "@/lib/ask-turn";
import { attachmentsToGrokParts, validateAskAttachments } from "@/lib/files";
import {
  liveLookupContext,
  answerLengthForRoute,
  searchRuleLine,
  priorUserText,
  priorAssistantText,
  routeText,
  threadClip,
} from "@/lib/ask-route";
import { pickAnswerProvider, planToRoute } from "@/lib/ask-provider";
import { ensureAskClassify } from "@/lib/ask-plan-cache";
import {
  fallbackAskIntent,
  intentAnswerGuide,
  resolveAskIntentForAnswer,
} from "@/lib/ask-intent";
import { ASK_SYSTEM_PROMPT } from "@/lib/constants";
import { streamAskAnswer } from "@/lib/ask-stream";
import {
  ASK_MAX_BODY_BYTES,
  askCostMicros,
  estimateAskMicros,
} from "@/lib/limits";
import {
  claimAskTurn,
  commitAskTurn,
  releaseAskTurn,
} from "@/lib/ask-guard";
import { loadMemberLane } from "@/lib/usage";
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
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > ASK_MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "That message is too large." },
      { status: 413 }
    );
  }

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

  const rawAttachments = Array.isArray(body.attachments) ? body.attachments : [];
  const checked = validateAskAttachments(rawAttachments);
  if (!checked.ok) {
    return NextResponse.json({ error: checked.error }, { status: 400 });
  }
  const attachments = checked.files;

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
    const { conversationId, userText, history } = prepared;
    const priorText = priorUserText(history);
    const priorReply = priorAssistantText(history);
    const clip = threadClip(history);
    void ensureAskClassify(user.id, conversationId, userText, {
      hasFiles: attachments.length > 0,
      priorText,
      priorReply,
      threadClip: clip,
    });
    return NextResponse.json({ conversationId });
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
  const priorText = priorUserText(history);
  const priorReply = priorAssistantText(history);
  const clip = threadClip(history);
  const routedText = routeText(userText, priorText);
  const hasFiles = attachments.length > 0;
  const lane = await loadMemberLane(supabase, user.id);
  const claimed = await claimAskTurn(supabase, user.id, lane, {
    files: attachments.length,
    provider: "grok",
    search: true,
  });
  if (!claimed.ok) {
    return NextResponse.json(
      { error: claimed.error },
      { status: claimed.status }
    );
  }
  const reservationId = claimed.reservation.id;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: HaloStreamEvent) => {
        controller.enqueue(encoder.encode(encodeHaloEvent(event)));
      };
      let settled = false;

      try {
        let system: string | undefined;
        let lookupSources: { label: string; url: string }[] = [];
        const fallbackIntent = fallbackAskIntent(userText, {
          hasFiles,
          priorText,
          priorReply,
          threadClip: clip,
        });
        const intentPromise = ensureAskClassify(
          user.id,
          conversationId,
          userText,
          {
            hasFiles,
            priorText,
            priorReply,
            threadClip: clip,
          }
        );
        send({ type: "status", status: "checking" });
        const intentForAnswer = await resolveAskIntentForAnswer(
          intentPromise,
          fallbackIntent
        );
        const liveRoute = planToRoute(intentForAnswer, hasFiles);
        const useFeeds = intentForAnswer.freshness === "feeds" || liveRoute.seedLive;
        if (useFeeds) {
          const live = await liveLookupContext(routedText, {
            allowSearch:
              intentForAnswer.freshness === "web" &&
              pickAnswerProvider(liveRoute, hasFiles) === "grok",
            geo,
          });
          lookupSources = live.sources;
          system = [ASK_SYSTEM_PROMPT, live.systemExtra]
            .filter(Boolean)
            .join("\n\n");
          for (const src of lookupSources.slice(0, 4)) {
            send({ type: "status", status: "reading", detail: src.label });
          }
        }
        const harvestHint = intentAnswerGuide(intentForAnswer);
        const liveLength =
          intentForAnswer.saveOffer === "recipe" ||
          intentForAnswer.answerMode === "teach_light" ||
          intentForAnswer.answerDepth === "long"
            ? "medium"
            : answerLengthForRoute(liveRoute);
        const liveSearch =
          Boolean(liveRoute.tools) &&
          pickAnswerProvider(liveRoute, hasFiles) === "grok";
        system = [
          system ??
            [ASK_SYSTEM_PROMPT, localeLine(geo)].filter(Boolean).join("\n\n"),
          searchRuleLine(liveSearch),
          harvestHint,
        ]
          .filter(Boolean)
          .join("\n\n");

        let answerProvider: "luna" | "grok" = pickAnswerProvider(
          liveRoute,
          hasFiles
        );

        for await (const live of streamAskAnswer(history, {
          route: liveRoute,
          hasAttachments: hasFiles,
          effort: liveRoute.effort,
          answerLength: liveLength,
          tools: liveSearch,
          maxToolCalls: liveRoute.maxToolCalls,
          timeZone: geo.timeZone,
          system,
        })) {
          if (live.type === "meta") {
            answerProvider = live.provider;
            continue;
          }
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
              ? askCostMicros(
                  answerProvider,
                  live.usage.inputTokens,
                  live.usage.outputTokens,
                  live.usage.cachedTokens
                )
              : estimateAskMicros(answerProvider);
            await commitAskTurn(supabase, user.id, reservationId, {
              files: attachments.length,
              search: liveSearch && answerProvider === "grok",
              route: liveRoute.kind,
              provider: answerProvider,
              costMicros,
              inputTokens: live.usage?.inputTokens ?? 0,
              outputTokens: live.usage?.outputTokens ?? 0,
            });
            settled = true;
            let replyId = "";
            if (assistantError || !assistantRow) {
              const fallback: AskMessage = {
                id: `local-${Date.now()}`,
                conversation_id: conversationId,
                role: "assistant",
                content: finalText,
                created_at: new Date().toISOString(),
              };
              replyId = fallback.id;
              send({ type: "done", conversationId, reply: fallback });
            } else {
              replyId = (assistantRow as AskMessage).id;
              send({
                type: "done",
                conversationId,
                reply: assistantRow as AskMessage,
              });
            }
            const harvestIntent = intentForAnswer;
            const harvested =
              harvestIntent.harvest
                ? await import("@/lib/learn-mine").then(({ mineLearnFromTurn }) =>
                    mineLearnFromTurn(
                      supabase,
                      user.id,
                      conversationId,
                      userText,
                      live.text,
                      harvestIntent,
                      priorText
                    )
                  )
                : [];
            void trackHaloEvent(supabase, user.id, "harvest", {
              conversationId,
              skipped: harvested.length === 0,
              cardCount: harvested.length,
              kinds: [...new Set(harvested.map((chip) => chip.kind))].join(","),
              job: harvestIntent.job,
              freshness: harvestIntent.freshness,
              classify_source: harvestIntent.planSource,
              plan_json: JSON.stringify({
                job: harvestIntent.job,
                freshness: harvestIntent.freshness,
                feedDomain: harvestIntent.feedDomain,
                harvest: harvestIntent.harvest,
                planSource: harvestIntent.planSource,
              }),
            });
            if (harvested.length) {
              send({ type: "harvest", chips: harvested });
            }
            const { resolveSaveOffer } = await import("@/lib/save-offer");
            const saveKind = resolveSaveOffer(userText, live.text, harvestIntent);
            if (saveKind && replyId) {
              send({
                type: "saveOffer",
                kind: saveKind,
                messageId: replyId,
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
        if (!settled) {
          await releaseAskTurn(supabase, reservationId);
        }
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
