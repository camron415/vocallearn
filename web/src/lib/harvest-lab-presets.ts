import { PREVIEW_HARVEST_REPLY } from "@/lib/harvest";

export type HarvestLabPreset = {
  id: string;
  label: string;
  userText: string;
  reply: string;
  /** Gate-only — miner should not run. */
  expectSkip?: boolean;
  /** Add a new assistant bubble (existing Nile thread stays as-is). */
  appendReply?: boolean;
};

export const HARVEST_LAB_PRESETS: Record<string, HarvestLabPreset> = {
  nile: {
    id: "nile",
    label: "Live Nile",
    userText: "Why is the Nile usually named as the longest river in the world?",
    reply: PREVIEW_HARVEST_REPLY,
    appendReply: false,
  },
  weather: {
    id: "weather",
    label: "Skip weather",
    userText: "What's the weather in Denver today please?",
    reply:
      "It will be sunny with a high of 82 degrees and a light breeze this afternoon.",
    expectSkip: true,
    appendReply: false,
  },
  rome: {
    id: "rome",
    label: "Live Rome",
    userText: "When was Rome traditionally founded, in plain terms?",
    reply:
      "Tradition holds that **Rome** was founded in **753 BC**. The legend ties the city to **Romulus** on the Palatine Hill along the Tiber.",
    appendReply: true,
  },
};

export function getHarvestLabPreset(id: string): HarvestLabPreset | null {
  return HARVEST_LAB_PRESETS[id] ?? null;
}
