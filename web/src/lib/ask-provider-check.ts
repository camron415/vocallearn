import { pickAnswerProvider, planToRoute } from "@/lib/ask-provider";
import { fallbackAskIntent } from "@/lib/ask-intent";
import {
  answerLengthForRoute,
  priorUserText,
  priorAssistantText,
  threadClip,
  resolveAskRoute,
  searchRuleLine,
} from "@/lib/ask-route";
import { espnScoreboardUrls } from "@/lib/live-lookups";

function routeFor(ask: string, prior?: string, files = false) {
  return planToRoute(fallbackAskIntent(ask, { priorText: prior }), files);
}

export function runAskProviderFixtures(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  const prevKey = process.env.OPENAI_API_KEY;
  const prevLuna = process.env.HALO_USE_LUNA;
  process.env.OPENAI_API_KEY = prevKey || "test-key";
  process.env.HALO_USE_LUNA = "1";

  try {
    const lookup = routeFor("weather in Denver");
    if (pickAnswerProvider(lookup, false) !== "luna") {
      failures.push("simple lookup should use Luna");
    }
    if (lookup.tools) {
      failures.push("simple weather should not enable Grok search");
    }
    if (answerLengthForRoute(lookup) !== "medium") {
      failures.push("live feed weather should get a medium answer, not one line");
    }

    const rain = fallbackAskIntent("why is it raining in Denver");
    if (rain.job !== "live" || rain.freshness !== "feeds") {
      failures.push("why is it raining in Denver should be live feeds");
    }
    const depth = planToRoute(rain, false);
    if (depth.tools) {
      failures.push("weather why on feeds should not force web search");
    }

    const chat = routeFor("what is photosynthesis");
    if (pickAnswerProvider(chat, false) !== "luna") {
      failures.push("plain teach ask should use Luna");
    }
    if (chat.tools) {
      failures.push("plain teach ask should not enable Grok search");
    }

    const files = resolveAskRoute("what is this", true);
    if (pickAnswerProvider(files, true) !== "grok") {
      failures.push("attachments should use Grok");
    }

    const chorePlan = fallbackAskIntent("why is there ketchup on my shirt");
    const chore = planToRoute(chorePlan, false);
    if (chore.tools) {
      failures.push("practical chore should turn search off");
    }

    const byu = routeFor("When is the next BYU football game?");
    if (byu.tools) {
      failures.push("BYU next game should use ESPN feeds, not Grok search");
    }
    if (pickAnswerProvider(byu, false) !== "luna") {
      failures.push("BYU next game should use Luna");
    }
    if (byu.kind !== "lookup") {
      failures.push("BYU next game should be a live lookup");
    }
    const byuUrls = espnScoreboardUrls("When is the next BYU football game?");
    if (!byuUrls.some((url) => url.includes("college-football"))) {
      failures.push("BYU should fetch the college-football ESPN board");
    }
    if (byuUrls.some((url) => url.includes("/nfl/"))) {
      failures.push("BYU should not default to the NFL board");
    }

    const moreAsk =
      "Can you give me more details on who they're playing and the stats?";
    const morePlan = fallbackAskIntent(moreAsk, {
      priorText: "When is the next BYU football game?",
    });
    if (morePlan.job !== "live") {
      failures.push("sports follow-up should stay live");
    }
    const moreWeb = planToRoute(
      { ...morePlan, freshness: "web", feedDomain: null },
      false
    );
    if (!moreWeb.tools || pickAnswerProvider(moreWeb, false) !== "grok") {
      failures.push("live+web sports follow-up should use Grok search");
    }

    const fans = routeFor(
      "What is the overall sentiment of the players and fans towards the game?",
      "When is the next BYU football game?"
    );
    if (!fans.tools) {
      failures.push("fan sentiment should use Grok search");
    }

    const nintendo = routeFor("Look up Nintendo events going on this week");
    if (!nintendo.tools) {
      failures.push("look-it-up Nintendo events should enable Grok search");
    }
    if (pickAnswerProvider(nintendo, false) !== "grok") {
      failures.push("Nintendo look-it-up should use Grok");
    }

    const iceCream = routeFor(
      "Where are the best ice cream places in Salt Lake City?"
    );
    if (!iceCream.tools) {
      failures.push("best ice cream in a city should enable Grok search");
    }
    if (pickAnswerProvider(iceCream, false) !== "grok") {
      failures.push("best ice cream in a city should use Grok");
    }

    const currentOnes = routeFor(
      "give me current ones",
      "Where are the best ice cream places in Salt Lake City?"
    );
    if (!currentOnes.tools) {
      failures.push("give me current ones should inherit search from the city listing");
    }

    const historyPlan = fallbackAskIntent(
      "give me a brief history of the atomic bomb and nuclear energy"
    );
    if (!historyPlan.harvest || historyPlan.job !== "remember") {
      failures.push("brief history should be remember Keep");
    }
    const history = planToRoute(historyPlan, false);
    if (pickAnswerProvider(history, false) !== "grok") {
      failures.push("brief history teach_light should use Grok");
    }

    const hello = routeFor("Hello");
    if (hello.tools || pickAnswerProvider(hello, false) !== "luna") {
      failures.push("hello should stay on Luna with search off");
    }

    const recipe = routeFor("Give me a basic waffle recipe");
    if (recipe.tools) {
      failures.push("recipe ask should stay on Luna without search");
    }
    if (pickAnswerProvider(recipe, false) !== "luna") {
      failures.push("recipe ask should use Luna");
    }

    const recipeLook = routeFor(
      "Look up the 2024 viral baked feta pasta recipe"
    );
    if (!recipeLook.tools) {
      failures.push("look-it-up recipe should enable Grok search");
    }
    if (pickAnswerProvider(recipeLook, false) !== "grok") {
      failures.push("specific look-it-up recipe should use Grok");
    }

    if (/web search is off/i.test(searchRuleLine(false))) {
      failures.push("search-off copy must not say web search is off");
    }
    if (/web search is on/i.test(searchRuleLine(true))) {
      failures.push("search-on copy must not say web search is on");
    }

    const prior = priorUserText([
      { role: "user", content: "When is the next BYU football game?" },
      { role: "assistant", content: "Saturday vs Utah." },
      { role: "user", content: "Give me more details" },
    ]);
    if (prior !== "When is the next BYU football game?") {
      failures.push(`prior user text got ${prior || "empty"}`);
    }
    const last = priorAssistantText([
      { role: "user", content: "what is the golden ruel" },
      { role: "assistant", content: "The Golden Rule is treat others as you would like to be treated." },
      { role: "user", content: "Who created this?" },
    ]);
    if (!/Golden Rule/i.test(last)) {
      failures.push("prior assistant should be the Golden Rule answer");
    }
    const clip = threadClip([
      { role: "user", content: "Where are the best ice cream places in Salt Lake City?" },
      { role: "assistant", content: "Here are five shops." },
      { role: "user", content: "give me current ones" },
    ]);
    if (!/ice cream/i.test(clip) || !/current ones/i.test(clip)) {
      failures.push("thread clip should keep listing follow-up context");
    }

    return { ok: failures.length === 0, failures };
  } finally {
    if (prevKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevKey;
    if (prevLuna === undefined) delete process.env.HALO_USE_LUNA;
    else process.env.HALO_USE_LUNA = prevLuna;
  }
}
