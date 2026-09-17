import type { AskIntent } from "@/lib/ask-intent";
import type { AskRoute, FeedDomain } from "@/lib/ask-route";
import { lunaEnabled } from "@/lib/openai";

export type AnswerProvider = "luna" | "grok";

/**
 * job ⟂ freshness. harvest = f(job). search = f(freshness).
 * Attachments always Grok; teach_light / web get a little effort.
 */
export function planToRoute(
  plan: Pick<
    AskIntent,
    "job" | "answerMode" | "freshness" | "feedDomain" | "answerDepth"
  >,
  hasAttachments: boolean
): AskRoute {
  const freshness =
    plan.feedDomain && plan.freshness !== "feeds" ? "feeds" : plan.freshness;
  const web = freshness === "web";
  const feeds = freshness === "feeds";
  const teach = plan.answerMode === "teach_light";
  const long = plan.answerDepth === "long";
  if (hasAttachments) {
    return {
      kind: "reason",
      tools: web || feeds,
      effort: "medium",
      maxToolCalls: web ? 1 : 0,
      seedLive: feeds,
    };
  }
  return {
    kind: feeds ? "lookup" : "reason",
    tools: web,
    effort: web || long ? "medium" : feeds ? "none" : "low",
    maxToolCalls: web ? (teach ? 2 : 1) : 0,
    seedLive: feeds,
  };
}

/** @deprecated Use planToRoute. Kept so older tests compile until they switch. */
export function refineRouteForIntent(
  _route: AskRoute,
  intent: { answerMode: string; job?: string; freshness?: AskIntent["freshness"]; feedDomain?: string | null },
  hasAttachments: boolean,
  _userText = ""
): AskRoute {
  const freshness = intent.freshness ?? "weights";
  return planToRoute(
    {
      job: (intent.job as AskIntent["job"]) || "chat",
      answerMode: (intent.answerMode as AskIntent["answerMode"]) || "practical",
      freshness,
      answerDepth: "standard",
      feedDomain: (intent.feedDomain as FeedDomain | null) ?? null,
    },
    hasAttachments
  );
}

/** Luna: default family chat. Grok: files, web search, or long depth (route.effort). */
export function pickAnswerProvider(
  route: AskRoute,
  hasAttachments: boolean
): AnswerProvider {
  if (!lunaEnabled()) return "grok";
  if (hasAttachments) return "grok";
  if (route.tools) return "grok";
  if (route.effort === "medium" || route.effort === "high") return "grok";
  return "luna";
}
