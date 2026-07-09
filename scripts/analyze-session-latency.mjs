import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

function readEnvValue(contents, key) {
  return (contents.match(new RegExp(`^${key}=(.*)$`, "m")) || [])[1]?.trim();
}

function summarize(rows, field) {
  const values = rows
    .map((row) => row[field])
    .filter((value) => typeof value === "number")
    .sort((a, b) => a - b);

  if (values.length === 0) return null;

  const avg = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const p50 = values[Math.floor(values.length * 0.5)];
  const p90 = values[Math.floor(values.length * 0.9)];
  const max = values[values.length - 1];

  return { count: values.length, avg, p50, p90, max };
}

async function main() {
  const envPath = path.resolve(".env.local");
  const env = fs.readFileSync(envPath, "utf8");
  const supabaseUrl = readEnvValue(env, "EXPO_PUBLIC_SUPABASE_URL");
  const supabaseKey = readEnvValue(env, "EXPO_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials in .env.local");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: "REDACTED_EMAIL",
    password: "REDACTED_PASSWORD",
  });
  if (authError) throw authError;

  const { data: interactions, error: interactionError } = await supabase
    .from("session_interactions")
    .select(
      "session_log_id,interaction_type,phase,lesson_id,created_at,grok_latency_ms,tts_latency_ms,stt_latency_ms,user_response_delay_ms"
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (interactionError) throw interactionError;

  const { data: bugReports, error: reportError } = await supabase
    .from("bug_reports")
    .select("created_at,phase,user_description,session_log_id,lesson_id")
    .order("created_at", { ascending: false })
    .limit(50);
  if (reportError) throw reportError;

  const groups = new Map();
  for (const row of interactions) {
    const key = row.interaction_type;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const groupedSummary = [...groups.entries()]
    .map(([interactionType, rows]) => ({
      interactionType,
      grokLatency: summarize(rows, "grok_latency_ms"),
      ttsLatency: summarize(rows, "tts_latency_ms"),
      sttLatency: summarize(rows, "stt_latency_ms"),
      responseDelay: summarize(rows, "user_response_delay_ms"),
    }))
    .sort((a, b) => (b.grokLatency?.avg || 0) - (a.grokLatency?.avg || 0));

  const latencyBugReports = bugReports.filter((report) =>
    /latency|delay|slow|wait|cut off|ignored|question/i.test(report.user_description)
  );

  console.log(JSON.stringify({ groupedSummary, latencyBugReports }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});