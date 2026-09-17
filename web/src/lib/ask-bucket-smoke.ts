#!/usr/bin/env tsx
/**
 * Live 1.2 bucket smoke on a dedicated lab member — never Camron's Keep.
 *
 *   HALO_SMOKE_BASE=https://lab-url.vercel.app npm run test:ask:buckets
 *
 * Creates/reuses halo.lab.smoke@invalid.local (lane lab) via service role.
 * Resets that account's last-24h ask meter so a full 27-case run is not blocked
 * by the family daily-40 cap. Does not touch Camron's Keep.
 */
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { readHaloStream, type HaloStreamEvent } from "@/lib/halo-stream";
import {
  ASK_BUCKET_SMOKE_CASES,
  type SmokeBucket,
} from "@/lib/ask-bucket-smoke-cases";

const EMAIL = "halo.lab.smoke@invalid.local";
const SMOKE_FILE = join(process.cwd(), ".smoke-user.json");

type IntentSnap = {
  harvest?: boolean;
  job?: string;
  freshness?: string;
  answerMode?: string;
  saveOffer?: string | null;
  maxChips?: number;
  skipReason?: string | null;
};

type Row = {
  id: string;
  prompt: string;
  expect: SmokeBucket;
  harvestWant: boolean;
  saveWant: boolean;
  note: string;
  ok: boolean;
  routingOk: boolean;
  primaryOk: boolean;
  primaryScored: boolean;
  flags: string[];
  routingFlags: string[];
  primaryFlags: string[];
  job: string;
  freshness: string;
  bucket: SmokeBucket;
  harvest: boolean;
  chipCount: number;
  chips: string[];
  primaryToken: string;
  saveOffer: boolean;
  provider: string;
  search: boolean;
  cited: boolean;
  statuses: string[];
  skipReason: string;
  ms: number;
  reply: string;
};

function bucketOf(job: string, harvest: boolean, saveOffer: boolean): SmokeBucket {
  if (saveOffer || job === "kitchen") return "kitchen";
  if (harvest || job === "remember") return "remember";
  return "neither";
}

function hasWebCitation(reply: string) {
  return (
    /\[\[[0-9]+\]\]/.test(reply) ||
    /\[[^\]]+\]\(https?:\/\//i.test(reply) ||
    /^##\s*Sources\b/m.test(reply)
  );
}

function parseIntent(raw: string | null | undefined): IntentSnap {
  if (!raw) return {};
  const hit = raw.match(/INTENT:(\{.*\})/);
  if (!hit) return {};
  try {
    return JSON.parse(hit[1]) as IntentSnap;
  } catch {
    return {};
  }
}

function cookieHeader(res: Response) {
  const raw = res.headers.getSetCookie?.() ?? [];
  if (!raw.length) {
    const one = res.headers.get("set-cookie");
    if (one) raw.push(one);
  }
  return raw
    .map((row) => row.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function ensureSmokeUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let password = process.env.HALO_SMOKE_PASSWORD?.trim() || "";
  try {
    const saved = JSON.parse(readFileSync(SMOKE_FILE, "utf8")) as {
      email?: string;
      password?: string;
    };
    if (!password && saved.password) password = saved.password;
  } catch {
    /* first run */
  }
  if (!password) password = `Sm0ke-${randomBytes(12).toString("base64url")}`;

  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 200 });
  let user = existing.users.find(
    (row) => row.email?.toLowerCase() === EMAIL
  );
  if (!user) {
    const created = await admin.auth.admin.createUser({
      email: EMAIL,
      password,
      email_confirm: true,
      user_metadata: { name: "Lab smoke" },
    });
    if (created.error || !created.data.user) {
      throw new Error(created.error?.message || "Could not create smoke user");
    }
    user = created.data.user;
  } else {
    const updated = await admin.auth.admin.updateUserById(user.id, { password });
    if (updated.error) {
      throw new Error(updated.error.message);
    }
  }

  const member = await admin.from("halo_members").upsert(
    { user_id: user.id, role: "member", lane: "lab" },
    { onConflict: "user_id" }
  );
  if (member.error) {
    throw new Error(`halo_members: ${member.error.message}`);
  }

  writeFileSync(
    SMOKE_FILE,
    JSON.stringify({ email: EMAIL, password, userId: user.id }, null, 2)
  );
  return { admin, userId: user.id, password };
}

/** Dedicated smoke account only — clear today's ask meter so 27-case runs don't 429. */
async function resetSmokeAskMeter(admin: { from: (table: string) => any }, userId: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { error } = await admin
    .from("halo_events")
    .delete()
    .eq("user_id", userId)
    .in("kind", ["ask", "ask_hold"])
    .gte("created_at", since);
  if (error) {
    throw new Error(`reset smoke meter: ${error.message}`);
  }
}

/** Stale INTENT rows from prior runs must not score this run as remember. */
async function resetSmokeHarvestLog(admin: { from: (table: string) => any }, userId: string) {
  const turns = await admin.from("halo_harvest_turns").delete().eq("user_id", userId);
  if (turns.error) {
    throw new Error(`reset smoke harvest_turns: ${turns.error.message}`);
  }
  const cards = await admin.from("halo_learn_cards").delete().eq("user_id", userId);
  if (cards.error) {
    throw new Error(`reset smoke learn_cards: ${cards.error.message}`);
  }
}

async function latestMeta(
  admin: { from: (table: string) => any },
  userId: string,
  kind: string,
  sinceIso: string
) {
  const { data } = await admin
    .from("halo_events")
    .select("meta, created_at")
    .eq("user_id", userId)
    .eq("kind", kind)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data?.meta && typeof data.meta === "object") {
    return data.meta as Record<string, unknown>;
  }
  return {};
}

async function login(base: string, password: string) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: EMAIL, password }),
    redirect: "manual",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`login ${res.status}: ${body.slice(0, 240)}`);
  }
  const cookies = cookieHeader(res);
  if (!cookies) throw new Error("login returned no session cookie");
  return cookies;
}

async function askTurn(
  base: string,
  cookies: string,
  message: string,
  conversationId: string | null
) {
  const started = Date.now();
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
      Cookie: cookies,
    },
    body: JSON.stringify({
      message,
      conversationId,
      timeZone: "America/Denver",
    }),
  });
  if (res.status === 429) {
    const body = await res.text();
    const err = new Error(`chat 429: ${body.slice(0, 240)}`);
    (err as Error & { status?: number }).status = 429;
    throw err;
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`chat ${res.status}: ${body.slice(0, 400)}`);
  }

  const statuses: string[] = [];
  let reply = "";
  let nextId = conversationId;
  const chips: Array<{ token: string; kind: string; recall?: string }> = [];
  let saveOffer = false;
  let error = "";

  await readHaloStream(res, (event: HaloStreamEvent) => {
    if (event.type === "status") {
      statuses.push(event.detail ? `${event.status}:${event.detail}` : event.status);
    }
    if (event.type === "delta") reply += event.text;
    if (event.type === "done") {
      nextId = event.conversationId || nextId;
      reply = event.reply?.content || reply;
    }
    if (event.type === "harvest") {
      for (const chip of event.chips) {
        chips.push({
          token: chip.token,
          kind: chip.kind,
          recall: chip.recall,
        });
      }
    }
    if (event.type === "saveOffer") saveOffer = true;
    if (event.type === "error") error = event.error;
  });

  return {
    conversationId: nextId,
    reply,
    chips,
    saveOffer,
    statuses,
    error,
    ms: Date.now() - started,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function askTurnPaced(
  base: string,
  cookies: string,
  message: string,
  conversationId: string | null
) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      return await askTurn(base, cookies, message, conversationId);
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      const msg = String(error);
      if (status !== 429 || attempt === 5) throw error;
      if (/message limit|week’s limit|month’s limit|Household/i.test(msg)) {
        throw error;
      }
      console.log(`  retry ${attempt} after burst limit…`);
      await sleep(16000);
    }
  }
  throw new Error("askTurnPaced exhausted");
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function render(rows: Row[], meta: Record<string, string>) {
  const routingN = rows.length;
  const routingOk = rows.filter((row) => row.routingOk).length;
  const primaryRows = rows.filter((row) => row.primaryScored);
  const primaryOk = primaryRows.filter((row) => row.primaryOk).length;
  const lines = [
    "# Ask bucket smoke (dedicated lab account)",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Base: ${meta.base}`,
    `Account: ${EMAIL} (lane lab — not Camron's Keep)`,
    `Result: **${routingOk}/${routingN} routing · ${primaryOk}/${primaryRows.length} primary atom**`,
    "",
    "| Case | Expect | Got | Job | Fresh | Provider | Search | Cited | Harvest | Chips | Primary | Save | ms | Status |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const row of rows) {
    const status = row.ok
      ? "OK"
      : `${row.routingOk ? "PRIMARY" : "HOLE"} — ${row.flags.join("; ")}`;
    lines.push(
      `| ${row.id} | ${row.expect} | ${row.bucket} | ${row.job} | ${row.freshness || "—"} | ${row.provider} | ${row.search ? "yes" : "no"} | ${row.cited ? "yes" : "no"} | ${row.harvest ? "yes" : "no"} | ${row.chipCount} | ${row.primaryToken || "—"} | ${row.saveOffer ? "yes" : "no"} | ${row.ms} | ${status} |`
    );
  }
  lines.push("", "## Detail", "");
  for (const row of rows) {
    lines.push(`### ${row.id}`);
    lines.push("");
    lines.push(`**Prompt:** ${row.prompt}`);
    lines.push(`**Note:** ${row.note}`);
    lines.push(
      `**Route:** job=${row.job} freshness=${row.freshness || "—"} provider=${row.provider} search=${row.search} cited=${row.cited} skip=${row.skipReason || "—"}`
    );
    if (row.chips.length) {
      lines.push(`**Chips:** ${row.chips.join(" · ")}`);
    }
    if (row.reply) {
      lines.push("");
      lines.push(row.reply.slice(0, 500).replace(/\n+/g, " "));
    }
    lines.push("");
  }
  const routingHoles = rows.filter((row) => !row.routingOk);
  const primaryHoles = rows.filter((row) => row.primaryScored && !row.primaryOk);
  if (routingHoles.length || primaryHoles.length) {
    lines.push("## Holes", "");
    if (routingHoles.length) {
      lines.push("### Routing", "");
      for (const row of routingHoles) {
        lines.push(`- **${row.id}**: ${row.routingFlags.join("; ")}`);
      }
      lines.push("");
    }
    if (primaryHoles.length) {
      lines.push("### Primary atom", "");
      for (const row of primaryHoles) {
        lines.push(`- **${row.id}**: ${row.primaryFlags.join("; ")}`);
      }
    }
  }
  return lines.join("\n");
}

async function main() {
  const base = (
    process.env.HALO_SMOKE_BASE ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://127.0.0.1:3000"
  ).replace(/\/$/, "");
  const { admin, userId, password } = await ensureSmokeUser();
  await resetSmokeAskMeter(admin, userId);
  await resetSmokeHarvestLog(admin, userId);
  const cookies = await login(base, password);
  const conversations = new Map<string, string | null>();
  const rows: Row[] = [];
  const only = (process.env.HALO_SMOKE_ONLY || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const cases = only.length
    ? ASK_BUCKET_SMOKE_CASES.filter((test) => only.includes(test.id))
    : ASK_BUCKET_SMOKE_CASES;
  if (only.length && !cases.length) {
    throw new Error(`HALO_SMOKE_ONLY matched no cases: ${only.join(", ")}`);
  }

  for (const test of cases) {
    const prior = test.after ? conversations.get(test.after) ?? null : null;
    const started = Date.now();
    let flags: string[] = [];
    let turn: Awaited<ReturnType<typeof askTurn>> | null = null;
    try {
      turn = await askTurnPaced(base, cookies, test.prompt, prior);
      if (turn.error) flags.push(turn.error);
      conversations.set(test.id, turn.conversationId);
    } catch (error) {
      flags.push(String(error));
    }

    await sleep(8000);

    if (!turn) {
      const primaryScored = Boolean(test.harvest || test.expectPrimary);
      rows.push({
        id: test.id,
        prompt: test.prompt,
        expect: test.expect,
        harvestWant: test.harvest,
        saveWant: Boolean(test.saveRecipe),
        note: test.note,
        ok: false,
        routingOk: false,
        primaryOk: !primaryScored,
        primaryScored,
        flags,
        routingFlags: flags,
        primaryFlags: [],
        job: "—",
        freshness: "",
        bucket: "neither",
        harvest: false,
        chipCount: 0,
        chips: [],
        primaryToken: "",
        saveOffer: false,
        provider: "—",
        search: false,
        cited: false,
        statuses: [],
        skipReason: "",
        ms: Date.now() - started,
        reply: "",
      });
      console.log(`[HOLE] ${test.id}  ${flags.join("; ")}`);
      continue;
    }

    const sinceIso = new Date(started - 2000).toISOString();
    const harvestRow = (
      await admin
        .from("halo_harvest_turns")
        .select("skipped, skip_reason, card_count, miner_raw, cards, created_at")
        .eq("user_id", userId)
        .eq("user_text", test.prompt)
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    ).data;

    let harvestMeta = await latestMeta(admin, userId, "harvest", sinceIso);
    let askMeta = await latestMeta(admin, userId, "ask", sinceIso);
    if (!askMeta.provider && !harvestMeta.job && !harvestMeta.plan_json) {
      await sleep(2000);
      harvestMeta = await latestMeta(admin, userId, "harvest", sinceIso);
      askMeta = await latestMeta(admin, userId, "ask", sinceIso);
    }
    const intent = parseIntent(harvestRow?.miner_raw as string | undefined);
    let freshness = String(intent.freshness || harvestMeta.freshness || "");
    let job = String(intent.job || harvestMeta.job || "");
    const planRaw = harvestMeta.plan_json;
    if (typeof planRaw === "string") {
      try {
        const plan = JSON.parse(planRaw) as {
          freshness?: string;
          job?: string;
        };
        if (!freshness) freshness = String(plan.freshness || "");
        if (!job) job = String(plan.job || "");
      } catch {
        /* plan_json optional */
      }
    }
    const chipCount = turn.chips.length;
    const harvest = chipCount > 0;
    const saveOffer = Boolean(turn.saveOffer);
    const bucket = bucketOf(job, harvest, saveOffer);
    const provider = String(askMeta.provider || "—");
    const search = askMeta.search === true;
    const skipReason = String(
      harvestRow?.skip_reason || intent.skipReason || ""
    );
    const cited = hasWebCitation(turn.reply);
    const primaryToken = turn.chips[0]?.token ?? "";
    const routingFlags: string[] = [...flags];
    const primaryFlags: string[] = [];

    if (bucket !== test.expect) {
      routingFlags.push(`bucket ${bucket} want ${test.expect}`);
    }
    if (!test.harvest && chipCount > 0) {
      routingFlags.push(`harvested ${chipCount} chips`);
    }
    if (test.saveRecipe && !saveOffer) {
      routingFlags.push("wanted Save recipe");
    }
    if (!test.saveRecipe && saveOffer) {
      routingFlags.push("unexpected recipe pill");
    }
    if (test.expectFreshness && freshness !== test.expectFreshness) {
      routingFlags.push(`freshness ${freshness || "—"} want ${test.expectFreshness}`);
    }
    if (test.expectFreshness === "web" && !cited) {
      routingFlags.push("web freshness missing citation");
    }
    if (test.harvest && chipCount < 1) {
      primaryFlags.push("empty Keep (soft)");
    }
    if (test.expectPrimary && chipCount > 0) {
      if (!new RegExp(test.expectPrimary, "i").test(primaryToken)) {
        primaryFlags.push(`primary “${primaryToken}” want /${test.expectPrimary}/`);
      }
    } else if (test.expectPrimary && chipCount < 1) {
      primaryFlags.push(`primary missing want /${test.expectPrimary}/`);
    }

    const routingOk = routingFlags.length === 0;
    const primaryScored = Boolean(test.harvest || test.expectPrimary);
    const primaryOk = primaryFlags.length === 0;
    flags = [...routingFlags, ...primaryFlags];

    rows.push({
      id: test.id,
      prompt: test.prompt,
      expect: test.expect,
      harvestWant: test.harvest,
      saveWant: Boolean(test.saveRecipe),
      note: test.note,
      ok: routingOk && primaryOk,
      routingOk,
      primaryOk,
      primaryScored,
      flags,
      routingFlags,
      primaryFlags,
      job: job || "—",
      freshness,
      bucket,
      harvest,
      chipCount,
      chips: turn.chips.map(
        (chip) => `${chip.kind}:${chip.recall ?? "closed"}:${chip.token}`
      ),
      primaryToken,
      saveOffer,
      provider,
      search,
      cited,
      statuses: turn.statuses,
      skipReason,
      ms: turn.ms,
      reply: turn.reply,
    });

    const mark = !routingOk ? "HOLE" : primaryFlags.length ? "PRIMARY" : "OK";
    console.log(
      `[${mark}] ${test.id}  ${bucket}/${provider}  chips=${chipCount}  ${rows[rows.length - 1].ms}ms`
    );
  }

  const markdown = render(rows, { base });
  const dir = join(process.cwd(), "reports");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `ask-bucket-smoke-${stamp()}.md`);
  writeFileSync(file, markdown);
  if (!only.length) {
    writeFileSync(join(dir, "ask-bucket-smoke-latest.md"), markdown);
  }
  console.log(`\n${markdown.split("\n").slice(0, 8).join("\n")}`);
  console.log(`\nWrote ${file}`);
  if (rows.some((row) => !row.ok)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
