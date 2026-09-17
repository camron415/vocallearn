/**
 * TurnPlan harness fixtures — routing, merge, and provider expectations.
 * Sourced from Camron QA stumps (2026-08–09) and frontier-style bucket tests.
 */
import type { AskFreshness, AskJob } from "@/lib/ask-intent";

export type HarnessCase = {
  id: string;
  prompt: string;
  after?: string;
  /** Synthetic prior user line when `after` is set (override). */
  priorUser?: string;
  priorAssistant?: string;
  expect: {
    job: AskJob;
    freshness: AskFreshness;
    harvest: boolean;
    tools: boolean;
    provider: "luna" | "grok";
  };
  /** When set, dry harness tests mergeAskIntent(classify, fallback). */
  classifyJson?: string;
  note: string;
};

export const ASK_HARNESS_CASES: HarnessCase[] = [
  {
    id: "chat-smash",
    prompt: "asdfghjklqwertyuiopzxcvbnm",
    expect: {
      job: "chat",
      freshness: "weights",
      harvest: false,
      tools: false,
      provider: "luna",
    },
    note: "Keyboard smash — no Keep.",
  },
  {
    id: "chat-typo-ack",
    prompt: "Oh I said sweet, it was a typo",
    after: "edu-sky",
    priorUser: "why is the sky blue",
    priorAssistant: "Rayleigh scattering makes shorter wavelengths scatter more.",
    classifyJson: `{"job":"chat","freshness":"weights","feedDomain":null,"answerMode":"practical","primaryAsk":"typo acknowledgement","topicKey":null,"maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    expect: {
      job: "chat",
      freshness: "weights",
      harvest: false,
      tools: false,
      provider: "luna",
    },
    note: "Typo meta after a fact ask — classify must not Keep.",
  },
  {
    id: "edu-sky",
    prompt: "why is the sky blue",
    expect: {
      job: "remember",
      freshness: "weights",
      harvest: true,
      tools: false,
      provider: "luna",
    },
    note: "Educational how/why — Luna, Keep. Grok only if answerDepth long.",
  },
  {
    id: "edu-who-this",
    prompt: "Who created this?",
    after: "edu-ruel",
    priorUser: "what is the golden ruel",
    priorAssistant: "Treat others as you want to be treated.",
    expect: {
      job: "remember",
      freshness: "weights",
      harvest: true,
      tools: false,
      provider: "luna",
    },
    note: "“This” is the Golden Rule, not a photo.",
  },
  {
    id: "edu-ruel",
    prompt: "what is the golden ruel",
    expect: {
      job: "remember",
      freshness: "weights",
      harvest: true,
      tools: false,
      provider: "luna",
    },
    note: "Typo inside a real fact question.",
  },
  {
    id: "edu-bomb",
    prompt: "give me a brief history of the atomic bomb and nuclear energy",
    expect: {
      job: "remember",
      freshness: "weights",
      harvest: true,
      tools: false,
      provider: "grok",
    },
    note: "History summary — teach_light, Keep.",
  },
  {
    id: "live-ice-cream",
    prompt: "Where are the best ice cream places in Salt Lake City?",
    expect: {
      job: "live",
      freshness: "web",
      harvest: false,
      tools: true,
      provider: "grok",
    },
    classifyJson: `{"job":"live","freshness":"web","feedDomain":null,"answerMode":"practical","primaryAsk":"ice cream in SLC","topicKey":"ice-cream","maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    note: "Local listing — search, no Keep.",
  },
  {
    id: "live-ice-current",
    prompt: "give me current ones",
    after: "live-ice-cream",
    priorUser: "Where are the best ice cream places in Salt Lake City?",
    priorAssistant:
      "Here are several well-rated ice cream shops in Salt Lake City with current hours.",
    expect: {
      job: "live",
      freshness: "web",
      harvest: false,
      tools: true,
      provider: "grok",
    },
    note: "Short follow-up inherits listing + web search.",
  },
  {
    id: "live-byu-bare",
    prompt: "when is the next BYU game",
    expect: {
      job: "live",
      freshness: "feeds",
      harvest: false,
      tools: false,
      provider: "luna",
    },
    classifyJson: `{"job":"live","freshness":"feeds","feedDomain":"sports","answerMode":"practical","primaryAsk":"next BYU game","topicKey":"byu-game","maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    note: "Bare schedule — feeds, not Keep.",
  },
  {
    id: "live-weather",
    prompt: "What's the weather in Denver today?",
    expect: {
      job: "live",
      freshness: "feeds",
      harvest: false,
      tools: false,
      provider: "luna",
    },
    classifyJson: `{"job":"live","freshness":"feeds","feedDomain":"weather","answerMode":"practical","primaryAsk":"Denver weather","topicKey":"denver-weather","maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    note: "Forecast — feeds only.",
  },
  {
    id: "live-weather-harvest-lie",
    prompt: "What's the weather in Denver today?",
    classifyJson: `{"job":"remember","freshness":"feeds","feedDomain":"weather","answerMode":"direct","primaryAsk":"Denver weather","topicKey":"denver","maxChips":3,"primaryRecall":"closed","maxOpen":0,"saveOffer":null}`,
    expect: {
      job: "live",
      freshness: "feeds",
      harvest: false,
      tools: false,
      provider: "luna",
    },
    note: "Merge must not Keep on weather even if classify says remember.",
  },
  {
    id: "kitchen-carbonara",
    prompt: "How do I make carbonara?",
    expect: {
      job: "kitchen",
      freshness: "weights",
      harvest: false,
      tools: false,
      provider: "luna",
    },
    classifyJson: `{"job":"kitchen","freshness":"weights","feedDomain":null,"answerMode":"practical","primaryAsk":"carbonara recipe","topicKey":"carbonara","maxChips":0,"primaryRecall":"closed","maxOpen":0,"saveOffer":"recipe"}`,
    note: "Recipe — Save pill, no Keep.",
  },
  {
    id: "opinion-fans",
    prompt:
      "What is the overall sentiment of the players and fans towards the game?",
    expect: {
      job: "opinion",
      freshness: "web",
      harvest: false,
      tools: true,
      provider: "grok",
    },
    note: "Sentiment — no Keep.",
  },
  {
    id: "live-nintendo",
    prompt: "Look up Nintendo events going on this week",
    expect: {
      job: "live",
      freshness: "web",
      harvest: false,
      tools: true,
      provider: "grok",
    },
    note: "Events this week — web search.",
  },
  {
    id: "product-socks",
    prompt: "what are these socks made of (material blend)",
    expect: {
      job: "other",
      freshness: "web",
      harvest: false,
      tools: true,
      provider: "grok",
    },
    note: "Product ID — no Keep; may use search.",
  },
];

/** Map case id → case for chain resolution. */
export function harnessCaseById(id: string): HarnessCase | undefined {
  return ASK_HARNESS_CASES.find((row) => row.id === id);
}
