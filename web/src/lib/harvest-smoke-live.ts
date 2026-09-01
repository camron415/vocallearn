#!/usr/bin/env tsx
/**
 * Live harvest smoke — gate checks (free) + optional Grok miner cases.
 *
 * Usage:
 *   npm run test:harvest          # unit fixtures only
 *   npm run test:harvest:live     # gate + live miner (needs GROK_API_KEY in .env.local)
 *   npm run test:harvest:live -- --dry   # gate cases only, no API spend
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  HARVEST_SMOKE_CASES,
  runSmokeCase,
  type SmokeCaseResult,
} from "./harvest-smoke-cases";

const dry = process.argv.includes("--dry");
const liveMiner = !dry && Boolean(process.env.GROK_API_KEY?.trim());

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function renderReport(results: SmokeCaseResult[], meta: Record<string, string>) {
  const passed = results.filter((row) => row.ok).length;
  const lines = [
    "# Harvest live smoke",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${meta.mode}`,
    `Result: **${passed}/${results.length} passed**`,
    "",
    "| Case | Mode | Skip | Chips | ms | Status |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const row of results) {
    const status = row.ok ? "PASS" : `FAIL — ${row.failures.join("; ")}`;
    lines.push(
      `| ${row.label} | ${row.mode} | ${row.skipped ? "yes" : "no"} | ${row.chipCount} | ${row.ms ?? "—"} | ${status} |`
    );
  }

  lines.push("", "## Chip detail", "");
  for (const row of results.filter((r) => r.chipCount > 0)) {
    lines.push(`### ${row.label}`);
    for (const chip of row.chips) {
      lines.push(
        `- **${chip.token}** (${chip.kind}, ${chip.recall}) — ${chip.distractors} distractors, weight=${chip.weight ?? "—"}`
      );
    }
    lines.push("");
  }

  const failed = results.filter((row) => !row.ok);
  if (failed.length) {
    lines.push("## Failures", "");
    for (const row of failed) {
      lines.push(`- **${row.id}**: ${row.failures.join("; ")}`);
    }
  }

  return lines.join("\n");
}

async function main() {
  const gateOnly = dry || !liveMiner;
  if (!dry && !liveMiner) {
    console.error(
      "GROK_API_KEY missing — running gate cases only. Set key in .env.local for miner smoke."
    );
  }

  const mode = dry
    ? "dry (gate only)"
    : liveMiner
      ? "live (gate + Grok miner)"
      : "gate only (no API key)";

  const cases = gateOnly
    ? HARVEST_SMOKE_CASES.filter((row) => row.mode === "gate")
    : HARVEST_SMOKE_CASES;

  console.log(`Harvest live smoke — ${mode} (${cases.length} cases)\n`);

  const results: SmokeCaseResult[] = [];
  for (const row of cases) {
    const result = await runSmokeCase(row, { liveMiner });
    results.push(result);
    const mark = result.ok ? "PASS" : "FAIL";
    console.log(
      `[${mark}] ${result.label} (${result.mode}) skip=${result.skipped} chips=${result.chipCount}${result.ms ? ` ${result.ms}ms` : ""}`
    );
    if (!result.ok) {
      for (const line of result.failures) {
        console.log(`       ${line}`);
      }
    }
  }

  const passed = results.filter((row) => row.ok).length;
  console.log(`\n${passed}/${results.length} smoke cases passed`);

  const reportDir = join(process.cwd(), "reports");
  mkdirSync(reportDir, { recursive: true });
  const report = renderReport(results, { mode });
  const dated = join(reportDir, `harvest-smoke-${stamp()}.md`);
  const latest = join(reportDir, "harvest-smoke-latest.md");
  writeFileSync(dated, report);
  writeFileSync(latest, report);
  console.log(`\nReport: ${latest}`);
  if (gateOnly && !dry) {
    console.log(
      "\nMiner cases not run — set GROK_API_KEY in .env.local and run npm run test:harvest:live"
    );
  }

  if (passed !== results.length) process.exit(1);
}

void main();
