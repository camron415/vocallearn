#!/usr/bin/env tsx
/**
 * TurnPlan harness — dry (default) and optional live bucket extension.
 *
 *   npm run test:ask:harness
 *   npm run test:ask:harness:live   # same as test:ask:buckets
 */
import { spawnSync } from "node:child_process";
import {
  fallbackAskIntent,
  mergeAskIntent,
  parseAskIntent,
} from "@/lib/ask-intent";
import { pickAnswerProvider, planToRoute } from "@/lib/ask-provider";
import { priorAssistantText, priorUserText, threadClip } from "@/lib/ask-route";
import type { GrokMessage } from "@/lib/grok";
import {
  ASK_HARNESS_CASES,
  harnessCaseById,
  type HarnessCase,
} from "@/lib/ask-harness-cases";

function fail(failures: string[], msg: string) {
  failures.push(msg);
}

function historyForCase(test: HarnessCase): GrokMessage[] {
  const rows: GrokMessage[] = [];
  if (test.after) {
    const parent = harnessCaseById(test.after);
    if (parent) {
      rows.push({ role: "user", content: test.priorUser ?? parent.prompt });
      rows.push({
        role: "assistant",
        content:
          test.priorAssistant ??
          "Synthetic assistant reply for harness thread clip.",
      });
    }
  }
  rows.push({ role: "user", content: test.prompt });
  return rows;
}

function resolveIntent(test: HarnessCase, history: GrokMessage[]) {
  const priorText = priorUserText(history);
  const priorReply = priorAssistantText(history);
  const clip = threadClip(history);
  const fallback = fallbackAskIntent(test.prompt, {
    priorText,
    priorReply,
    threadClip: clip,
  });
  if (!test.classifyJson) {
    return fallback;
  }
  const parsed =
    parseAskIntent(test.classifyJson, test.prompt, {
      priorText,
      priorReply,
      threadClip: clip,
    }) ?? fallback;
  return mergeAskIntent(parsed, fallback, { userText: test.prompt });
}

export function runAskHarnessDryFixtures(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  const prevKey = process.env.OPENAI_API_KEY;
  const prevLuna = process.env.HALO_USE_LUNA;
  process.env.OPENAI_API_KEY = prevKey || "test-key";
  process.env.HALO_USE_LUNA = "1";

  try {
    for (const test of ASK_HARNESS_CASES) {
      const history = historyForCase(test);
      const intent = resolveIntent(test, history);
      const route = planToRoute(intent, false);
      const provider = pickAnswerProvider(route, false);
      const exp = test.expect;

      if (intent.job !== exp.job) {
        fail(
          failures,
          `${test.id}: job ${intent.job} want ${exp.job} (${test.note})`
        );
      }
      if (intent.freshness !== exp.freshness) {
        fail(
          failures,
          `${test.id}: freshness ${intent.freshness} want ${exp.freshness}`
        );
      }
      if (intent.harvest !== exp.harvest) {
        fail(
          failures,
          `${test.id}: harvest ${intent.harvest} want ${exp.harvest}`
        );
      }
      if (Boolean(route.tools) !== exp.tools) {
        fail(
          failures,
          `${test.id}: tools ${Boolean(route.tools)} want ${exp.tools}`
        );
      }
      if (provider !== exp.provider) {
        fail(
          failures,
          `${test.id}: provider ${provider} want ${exp.provider}`
        );
      }
    }
  } finally {
    if (prevKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevKey;
    if (prevLuna === undefined) delete process.env.HALO_USE_LUNA;
    else process.env.HALO_USE_LUNA = prevLuna;
  }

  return { ok: failures.length === 0, failures };
}

function main() {
  const live = process.argv.includes("--live");
  if (live) {
    const child = spawnSync(
      "npm",
      ["run", "test:ask:buckets"],
      { stdio: "inherit", shell: true, cwd: process.cwd() }
    );
    process.exit(child.status ?? 1);
  }

  const { ok, failures } = runAskHarnessDryFixtures();
  if (!ok) {
    console.error("Ask harness dry failures:");
    for (const line of failures) console.error(`  - ${line}`);
    process.exit(1);
  }
  console.log(`Ask harness dry: ${ASK_HARNESS_CASES.length}/${ASK_HARNESS_CASES.length} OK`);
}

if (process.argv[1]?.endsWith("ask-harness-run.ts")) {
  main();
}
