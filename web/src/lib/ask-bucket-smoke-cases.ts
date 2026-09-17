/** 25-prompt 1.2 bucket smoke. Expected job is the product bucket, not the regex. */
import type { AskFreshness } from "@/lib/ask-intent";

export type SmokeBucket = "remember" | "kitchen" | "neither";

export type BucketSmokeCase = {
  id: string;
  prompt: string;
  expectFreshness?: AskFreshness;
  /** Live report: main chip token must match this (regex source). */
  expectPrimary?: string;
  /** Same conversation as this prior case id, if set. */
  after?: string;
  expect: SmokeBucket;
  harvest: boolean;
  saveRecipe?: boolean;
  note: string;
};

export const ASK_BUCKET_SMOKE_CASES: BucketSmokeCase[] = [
  {
    id: "chat-hello",
    prompt: "Hello",
    expect: "neither",
    harvest: false,
    note: "Greeting — Luna chat, no Keep.",
  },
  {
    id: "chat-smash",
    prompt: "asdfghjklqwertyuiopzxcvbnm",
    expect: "neither",
    harvest: false,
    note: "Keyboard smash — chat, no quiz.",
  },
  {
    id: "chat-testing",
    prompt: "I was just testing",
    expect: "neither",
    harvest: false,
    note: "Chit-chat, no Keep.",
  },
  {
    id: "edu-sky",
    prompt: "why is the sky blue",
    expect: "remember",
    harvest: true,
    expectPrimary: "Rayleigh|scattering",
    note: "Educational how/why — Keep 2–3 chips.",
  },
  {
    id: "chat-typo-ack",
    prompt: "Oh I said sweet, it was a typo",
    after: "edu-sky",
    expect: "neither",
    harvest: false,
    note: "Typo acknowledgement after a fact ask must not harvest.",
  },
  {
    id: "edu-ruel",
    prompt: "what is the golden ruel",
    expect: "remember",
    harvest: true,
    note: "Typo inside a real fact question still remember.",
  },
  {
    id: "edu-who",
    prompt: "Who created this?",
    after: "edu-ruel",
    expect: "remember",
    harvest: true,
    note: "Follow-up “this” is the Golden Rule, not a photo.",
  },
  {
    id: "edu-utah",
    prompt: "What is the capital of Utah?",
    expect: "remember",
    harvest: true,
    expectPrimary: "Salt Lake City",
    note: "Closed lookup — main chip Salt Lake City, optional support.",
  },
  {
    id: "edu-photosynthesis",
    prompt: "How does photosynthesis work?",
    expect: "remember",
    harvest: true,
    note: "Open gist + supporting pegs.",
  },
  {
    id: "edu-gettysburg",
    prompt: "When was the Battle of Gettysburg?",
    expect: "remember",
    harvest: true,
    expectPrimary: "1863",
    note: "Closed date. Place can sit as a side chip.",
  },
  {
    id: "edu-austen",
    prompt: "Who wrote Pride and Prejudice?",
    expect: "remember",
    harvest: true,
    expectPrimary: "Austen",
    note: "Closed who.",
  },
  {
    id: "edu-pythagoras",
    prompt: "What is the Pythagorean theorem?",
    expect: "remember",
    harvest: true,
    expectPrimary: "c²|a²|hypotenuse|a\\^2|c\\^2",
    note: "Stable math fact.",
  },
  {
    id: "edu-rome",
    prompt: "Why did the Western Roman Empire fall?",
    expect: "remember",
    harvest: true,
    note: "Deeper history — Grok reasoning is OK, still Keep.",
  },
  {
    id: "edu-bees",
    prompt: "What is the current scientific consensus on why bees are declining?",
    expect: "remember",
    harvest: true,
    note: "Educational research — Grok search OK, still Keep not live-news.",
  },
  {
    id: "kitchen-waffle",
    prompt: "Give me a basic waffle recipe",
    expect: "kitchen",
    harvest: false,
    saveRecipe: true,
    note: "Basic recipe — Luna, Save pill, no Keep.",
  },
  {
    id: "kitchen-carbonara",
    prompt: "How do I make carbonara?",
    expect: "kitchen",
    harvest: false,
    saveRecipe: true,
    note: "How-to-cook — recipe save, no Keep.",
  },
  {
    id: "kitchen-ravioli",
    prompt: "recipe for homemade ravioli",
    expect: "kitchen",
    harvest: false,
    saveRecipe: true,
    note: "Recipe language — Library not Keep.",
  },
  {
    id: "kitchen-lookup",
    prompt: "Look up the 2024 viral baked feta pasta recipe",
    expect: "kitchen",
    harvest: false,
    saveRecipe: true,
    note: "Specific modern recipe may use Grok search; still kitchen, no Keep.",
  },
  {
    id: "live-byu-bare",
    prompt: "when is the next BYU game",
    expect: "neither",
    harvest: false,
    note: "Sports schedule without “football” — live, no Keep.",
  },
  {
    id: "live-byu-short",
    prompt: "next BYU game",
    expect: "neither",
    harvest: false,
    note: "Short sports ask — still live, not a when-question Keep.",
  },
  {
    id: "live-byu-football",
    prompt: "When is the next BYU football game?",
    expect: "neither",
    harvest: false,
    note: "ESPN feed path — Luna, no Keep.",
  },
  {
    id: "live-weather",
    prompt: "What's the weather in Denver today?",
    expect: "neither",
    harvest: false,
    note: "Forecast — live, no Keep.",
  },
  {
    id: "live-nintendo",
    prompt: "Look up Nintendo events going on this week",
    expect: "neither",
    harvest: false,
    note: "This-week events — Grok search, no Keep.",
  },
  {
    id: "opinion-fans",
    prompt: "What is the overall sentiment of the players and fans towards the game?",
    expect: "neither",
    harvest: false,
    note: "Fan sentiment — opinion, no Keep.",
  },
  {
    id: "live-ice-cream",
    prompt: "Where are the best ice cream places in Salt Lake City?",
    expect: "neither",
    harvest: false,
    expectFreshness: "web",
    note: "Local listing — Grok search, no Keep.",
  },
  {
    id: "live-ice-current",
    prompt: "give me current ones",
    after: "live-ice-cream",
    expect: "neither",
    harvest: false,
    expectFreshness: "web",
    note: "Follow-up re-search — still no Keep.",
  },
  {
    id: "edu-bomb-history",
    prompt: "give me a brief history of the atomic bomb and nuclear energy",
    expect: "remember",
    harvest: true,
    expectPrimary: "fission|Manhattan|1945|1938|Hiroshima",
    note: "Educational history summary — Keep 2–3 chips.",
  },
  {
    id: "product-socks",
    prompt: "what are these socks made of (material blend)",
    expect: "neither",
    harvest: false,
    note: "Product ID without a learning ask — no Keep, no recipe.",
  },
];
