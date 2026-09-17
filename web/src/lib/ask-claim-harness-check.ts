/**
 * Walk classify → skip gate → miner uniqueness for ASK_CLAIM_HARNESS_CASES.
 *
 *   npm run test:ask:claims
 *   (also wired into npm run test:harvest)
 */
import {
  fallbackAskIntent,
  mergeAskIntent,
  parseAskIntent,
} from "@/lib/ask-intent";
import { skipHarvestTurn, shouldSkipHarvest } from "@/lib/harvest-policy";
import { cardsFromMinerJson } from "@/lib/learn-mine";
import {
  ASK_CLAIM_HARNESS_CASES,
  type ClaimHarnessCase,
} from "@/lib/ask-claim-harness-cases";

export type ClaimHarnessRow = {
  id: string;
  ok: boolean;
  job: string;
  harvest: boolean;
  skip: boolean;
  regexSkip: boolean;
  tokens: string[];
  flags: string[];
  note: string;
};

function resolveIntent(test: ClaimHarnessCase) {
  const fallback = fallbackAskIntent(test.prompt, {
    priorText: test.prior,
  });
  if (!test.classifyJson) return fallback;
  const parsed =
    parseAskIntent(test.classifyJson, test.prompt, {
      priorText: test.prior,
    }) ?? fallback;
  return mergeAskIntent(parsed, fallback, { userText: test.prompt });
}

export function runClaimHarnessCase(test: ClaimHarnessCase): ClaimHarnessRow {
  const flags: string[] = [];
  const intent = resolveIntent(test);
  const regexSkip = shouldSkipHarvest(test.prompt, test.reply);
  const gate = skipHarvestTurn(test.prompt, test.reply, intent);

  if (intent.job !== test.expect.job) {
    flags.push(`job ${intent.job} want ${test.expect.job}`);
  }
  if (intent.harvest !== test.expect.harvest) {
    flags.push(`harvest ${intent.harvest} want ${test.expect.harvest}`);
  }
  if (gate.skip !== test.expect.skip) {
    flags.push(`gate skip ${gate.skip} want ${test.expect.skip}`);
  }
  if (
    test.expect.regexSkip != null &&
    regexSkip !== test.expect.regexSkip
  ) {
    flags.push(`regexSkip ${regexSkip} want ${test.expect.regexSkip}`);
  }
  if (
    test.expect.askKind != null &&
    intent.askKind !== test.expect.askKind
  ) {
    flags.push(`askKind ${intent.askKind} want ${test.expect.askKind}`);
  }
  if (test.expect.recall === "open" && intent.maxOpen < 1) {
    flags.push("wanted open gist budget");
  }
  if (
    test.expect.recall === "closed" &&
    intent.maxOpen > 0 &&
    intent.answerMode === "direct"
  ) {
    flags.push("closed lookup should not budget open");
  }

  let tokens: string[] = [];
  if (test.miner && !gate.skip) {
    const chips = cardsFromMinerJson(
      { cards: test.miner.cards },
      test.reply,
      [],
      test.id,
      {
        intent,
        userText: test.prompt,
        knownRows: test.miner.knownRows,
      }
    );
    tokens = chips.map((chip) => chip.token);
    const want = test.miner.expectTokens;
    if (tokens.length !== want.length || tokens.some((tok, i) => tok !== want[i])) {
      flags.push(`tokens [${tokens.join(" | ")}] want [${want.join(" | ")}]`);
    }
    if (test.expect.recall && chips[0] && chips[0].recall !== test.expect.recall) {
      flags.push(`recall ${chips[0].recall} want ${test.expect.recall}`);
    }
  } else if (test.miner && gate.skip) {
    flags.push("miner case was gated skip");
  }

  return {
    id: test.id,
    ok: flags.length === 0,
    job: intent.job,
    harvest: intent.harvest,
    skip: gate.skip,
    regexSkip,
    tokens,
    flags,
    note: test.note,
  };
}

export function runAskClaimHarnessFixtures(opts?: { verbose?: boolean }): {
  ok: boolean;
  failures: string[];
  rows: ClaimHarnessRow[];
} {
  const verbose = opts?.verbose ?? false;
  const rows = ASK_CLAIM_HARNESS_CASES.map(runClaimHarnessCase);
  const failures = rows
    .filter((row) => !row.ok)
    .map((row) => `${row.id}: ${row.flags.join("; ")}`);

  if (verbose) {
    const pad = (value: string, n: number) => value.padEnd(n).slice(0, n);
    console.log(
      `${pad("id", 32)} ${pad("job", 10)} ${pad("gate", 8)} ${pad("regex", 8)} chips`
    );
    for (const row of rows) {
      const mark = row.ok ? "OK" : "FAIL";
      const gate = row.skip ? "skip" : "keep";
      const regex = row.regexSkip ? "skip" : "keep";
      const chips = row.tokens.length ? row.tokens.join(", ") : "—";
      console.log(
        `${mark} ${pad(row.id, 32)} ${pad(row.job, 10)} ${pad(gate, 8)} ${pad(regex, 8)} ${chips}`
      );
      if (!row.ok) {
        for (const flag of row.flags) console.log(`    ${flag}`);
      }
    }
    const passed = rows.filter((row) => row.ok).length;
    console.log(`\n${passed}/${rows.length} claim-harness cases`);
  }

  return { ok: failures.length === 0, failures, rows };
}

function isMain() {
  const argv1 = process.argv[1] ?? "";
  return argv1.includes("ask-claim-harness-check");
}

if (isMain()) {
  const result = runAskClaimHarnessFixtures({ verbose: true });
  if (!result.ok) process.exit(1);
}
