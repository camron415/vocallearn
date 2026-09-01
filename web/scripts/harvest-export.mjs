#!/usr/bin/env node
/**
 * Export halo_harvest_turns for tuning review.
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 * (or NEXT_PUBLIC_SUPABASE_URL + service role).
 */
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const web = join(dirname(fileURLToPath(import.meta.url)), "..");
const limit = Number(process.argv[2] || 100);

const url =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, key);

const { data, error } = await supabase
  .from("halo_harvest_turns")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(limit);

if (error) {
  console.error(error.message);
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outDir = join(web, "reports");
mkdirSync(outDir, { recursive: true });
const jsonPath = join(outDir, `harvest-turns-${stamp}.json`);
const mdPath = join(outDir, "harvest-turns-latest.md");

const lines = [
  "# Harvest turns export",
  "",
  `Exported: ${new Date().toISOString()}`,
  `Rows: ${data?.length ?? 0}`,
  "",
];

for (const row of data ?? []) {
  lines.push(`## ${row.created_at?.slice(0, 19) ?? "?"} · ${row.card_count} chips · ${(row.kinds || []).join(", ")}`);
  lines.push("");
  lines.push("**Ask:**", row.user_text, "");
  lines.push("**Reply (trim):**", (row.reply_text || "").slice(0, 400), "…", "");
  if (row.skipped) {
    lines.push(`_Skipped: ${row.skip_reason}_`, "");
    continue;
  }
  for (const card of row.cards ?? []) {
    lines.push(`- **${card.kind}** \`${card.token}\` — ${card.prompt}`);
  }
  lines.push("");
}

writeFileSync(jsonPath, JSON.stringify(data, null, 2));
writeFileSync(mdPath, lines.join("\n"));
console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${mdPath}`);
