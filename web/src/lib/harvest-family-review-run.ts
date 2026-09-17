#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  FAMILY_REVIEW_CASES,
  runFamilyReviewCase,
} from "./harvest-family-review";

const dry = process.argv.includes("--dry");
const live = !dry && Boolean(process.env.GROK_API_KEY?.trim());

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

async function main() {
  const rows = [];
  for (const row of FAMILY_REVIEW_CASES) {
    rows.push(await runFamilyReviewCase(row, live));
  }

  const passed = rows.filter((row) => row.ok).length;
  const lines = [
    "# Family harvest review",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${live ? "live miner (canned replies, no Luna)" : "dry (gate + intent only)"}`,
    `Result: **${passed}/${rows.length} looked right**`,
    "",
    "Answers here are **canned** so we do not spend Luna. Miner (Grok none) is the harvest job.",
    "",
  ];

  for (const row of rows) {
    const chips = row.chips.length
      ? row.chips
          .map(
            (chip) =>
              `- ${chip.recall} · ${chip.kind} · **${chip.token}** — ${chip.prompt}`
          )
          .join("\n")
      : "- _(none)_";
    lines.push(`## ${row.ok ? "OK" : "LOOK"} · ${row.id}`);
    lines.push("");
    lines.push(`**Question:** ${row.question}`);
    lines.push("");
    lines.push(`**Canned reply:** ${row.cannedReply}`);
    lines.push("");
    lines.push(
      `**Intent:** harvest=${row.intent.harvest} · ${row.intent.answerMode} · open=${row.intent.maxOpen}`
    );
    lines.push("");
    lines.push(`**Skipped:** ${row.skipped ? "yes" : "no"}`);
    lines.push("");
    lines.push("**Harvested:**");
    lines.push(chips);
    lines.push("");
    lines.push(`**Note:** ${row.note}`);
    if (row.flags.length) {
      lines.push("");
      lines.push(`**Flags:** ${row.flags.join("; ")}`);
    }
    lines.push("");
  }

  const dir = join(process.cwd(), "reports");
  mkdirSync(dir, { recursive: true });
  const name = `harvest-family-review-${stamp()}.md`;
  writeFileSync(join(dir, name), lines.join("\n"));
  writeFileSync(join(dir, "harvest-family-review-latest.md"), lines.join("\n"));
  console.log(lines.join("\n"));
  console.log(`\nWrote reports/${name}`);
  if (passed < rows.length) process.exit(1);
}

void main();
