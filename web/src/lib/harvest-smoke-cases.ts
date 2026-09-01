import { harvestFactKey, PREVIEW_HARVEST_REPLY } from "@/lib/harvest";
import type { HarvestChipDraft } from "@/lib/learn-mine";
import { mineLearnFromReply, shouldSkipHarvest } from "@/lib/learn-mine";

export type SmokeExpect = {
  skip?: boolean;
  minChips?: number;
  maxChips?: number;
  closedOnly?: boolean;
  minDistractors?: number;
  clusterMin?: number;
  /** Facts already in the user's collection — must not re-harvest. */
  forbidTokens?: string[];
};

export type SmokeCase = {
  id: string;
  label: string;
  mode: "gate" | "miner";
  userText: string;
  reply: string;
  expect: SmokeExpect;
  knownPrompts?: string[];
  knownRows?: Array<{ prompt?: string; token?: string; answer?: string }>;
};

export const HARVEST_SMOKE_CASES: SmokeCase[] = [
  {
    id: "gate-weather",
    label: "Weather lookup ask",
    mode: "gate",
    userText: "What's the weather in Denver today please?",
    reply:
      "It will be sunny with a high of 82 degrees and a light breeze this afternoon.",
    expect: { skip: true },
  },
  {
    id: "gate-news",
    label: "News headline ask",
    mode: "gate",
    userText: "What's in the news today around the world?",
    reply:
      "Headlines today include a summit in Europe and a tech earnings report moving markets.",
    expect: { skip: true },
  },
  {
    id: "gate-stocks",
    label: "Market close ask",
    mode: "gate",
    userText: "How did the stock market close today?",
    reply: "The S&P 500 closed up 0.8% as of market close with tech leading gains.",
    expect: { skip: true },
  },
  {
    id: "gate-sports",
    label: "Sports score ask",
    mode: "gate",
    userText: "What was the final score in the game last night?",
    reply: "The final score was 24-17 with a late touchdown in the fourth quarter.",
    expect: { skip: true },
  },
  {
    id: "gate-flights",
    label: "Cheap flights ask",
    mode: "gate",
    userText: "Where are cheap flights this month from Seattle?",
    reply: "Sample fares are trending lower for March getaways but change daily.",
    expect: { skip: true },
  },
  {
    id: "gate-crypto",
    label: "Crypto price ask",
    mode: "gate",
    userText: "What is bitcoin trading at right now?",
    reply: "Bitcoin is at $67,200 as of this morning on major exchanges.",
    expect: { skip: true },
  },
  {
    id: "gate-ephemeral-reply",
    label: "History ask + market reply",
    mode: "gate",
    userText:
      "Tell me more about ancient Egypt and the Nile delta for my kids.",
    reply:
      "The S&P 500 closed up 1.2% as of market close while Egypt relied on the Nile for farming.",
    expect: { skip: true },
  },
  {
    id: "gate-short",
    label: "Too-short turn",
    mode: "gate",
    userText: "hi",
    reply: "The Nile is long.",
    expect: { skip: true },
  },
  {
    id: "gate-capital-maine",
    label: "Short closed capital reply",
    mode: "gate",
    userText: "What is the capital of Maine?",
    reply: "The capital of Maine is Augusta.",
    expect: { skip: false },
  },
  {
    id: "miner-nile",
    label: "Nile cluster (closed facts)",
    mode: "miner",
    userText:
      "Why is the Nile usually named as the longest river in the world?",
    reply: PREVIEW_HARVEST_REPLY,
    expect: {
      skip: false,
      minChips: 2,
      maxChips: 3,
      closedOnly: true,
      minDistractors: 3,
      clusterMin: 2,
    },
  },
  {
    id: "miner-rome",
    label: "Roman founding year",
    mode: "miner",
    userText: "When was Rome traditionally founded, in plain terms?",
    reply:
      "Tradition holds that **Rome** was founded in **753 BC**. The legend ties the city to **Romulus** on the Palatine Hill along the Tiber.",
    expect: {
      skip: false,
      minChips: 1,
      maxChips: 3,
      closedOnly: true,
      minDistractors: 3,
    },
  },
  {
    id: "miner-nile-dedup",
    label: "Nile dedup (known Nile fact)",
    mode: "miner",
    userText:
      "Why is the Nile usually named as the longest river in the world?",
    reply: PREVIEW_HARVEST_REPLY,
    knownRows: [{ token: "Nile", answer: "The Nile", prompt: "Longest river?" }],
    expect: {
      skip: false,
      minChips: 1,
      maxChips: 3,
      forbidTokens: ["Nile"],
      closedOnly: true,
      minDistractors: 3,
    },
  },
];

export type SmokeCaseResult = {
  id: string;
  label: string;
  mode: "gate" | "miner";
  ok: boolean;
  skipped: boolean;
  chipCount: number;
  chips: Array<{
    token: string;
    kind: string;
    recall: string;
    distractors: number;
    weight?: string;
  }>;
  failures: string[];
  ms?: number;
};

function validateChips(
  chips: HarvestChipDraft[],
  expect: SmokeExpect
): string[] {
  const failures: string[] = [];
  const count = chips.length;

  if (expect.minChips !== undefined && count < expect.minChips) {
    failures.push(`expected >= ${expect.minChips} chips, got ${count}`);
  }
  if (expect.maxChips !== undefined && count > expect.maxChips) {
    failures.push(`expected <= ${expect.maxChips} chips, got ${count}`);
  }
  if (expect.closedOnly && chips.some((chip) => chip.recall !== "closed")) {
    failures.push("expected closed-only chips");
  }
  const minDist = expect.minDistractors ?? 0;
  if (minDist > 0) {
    for (const chip of chips) {
      if ((chip.distractors?.length ?? 0) < minDist) {
        failures.push(
          `${chip.token}: expected ${minDist} distractors, got ${chip.distractors?.length ?? 0}`
        );
      }
    }
  }
  if (expect.clusterMin !== undefined) {
    const clusterCount = chips.filter((chip) => chip.weight === "cluster").length;
    if (clusterCount < expect.clusterMin) {
      failures.push(
        `expected >= ${expect.clusterMin} cluster-weight chips, got ${clusterCount}`
      );
    }
  }
  if (expect.forbidTokens?.length) {
    for (const forbid of expect.forbidTokens) {
      const key = harvestFactKey(forbid);
      if (
        chips.some(
          (chip) =>
            harvestFactKey(chip.token) === key ||
            harvestFactKey(chip.answer) === key
        )
      ) {
        failures.push(`should not re-harvest duplicate fact: ${forbid}`);
      }
    }
  }
  return failures;
}

export async function runSmokeCase(
  row: SmokeCase,
  options?: { liveMiner?: boolean }
): Promise<SmokeCaseResult> {
  const started = Date.now();
  const skipped = shouldSkipHarvest(row.userText, row.reply);
  const failures: string[] = [];
  let chips: HarvestChipDraft[] = [];

  if (row.expect.skip) {
    if (!skipped) failures.push("expected harvest skip");
  } else if (skipped) {
    failures.push("expected harvest to run");
  }

  if (row.mode === "miner" && !skipped) {
    if (!options?.liveMiner) {
      failures.push("miner case needs --live (GROK_API_KEY)");
    } else {
      try {
        chips = (await mineLearnFromReply(row.userText, row.reply, {
          conversationId: row.id,
          knownPrompts: row.knownPrompts,
          knownRows: row.knownRows,
        })).chips;
      } catch (error) {
        failures.push(`miner error: ${String(error)}`);
      }
      failures.push(...validateChips(chips, row.expect));
    }
  }

  return {
    id: row.id,
    label: row.label,
    mode: row.mode,
    ok: failures.length === 0,
    skipped,
    chipCount: chips.length,
    chips: chips.map((chip) => ({
      token: chip.token,
      kind: chip.kind,
      recall: chip.recall,
      distractors: chip.distractors?.length ?? 0,
      weight: chip.weight,
    })),
    failures,
    ms: Date.now() - started,
  };
}
