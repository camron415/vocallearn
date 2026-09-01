import { NextResponse } from "next/server";
import { getHarvestLabPreset } from "@/lib/harvest-lab-presets";
import { mineLearnFromReply, shouldSkipHarvest } from "@/lib/learn-mine";

export const runtime = "nodejs";
export const maxDuration = 60;

function labHost(request: Request) {
  if (process.env.VERCEL) return false;
  const host = (request.headers.get("host") || "").split(":")[0];
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") {
    return true;
  }
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return false;
}

export async function POST(request: Request) {
  if (!labHost(request)) {
    return NextResponse.json(
      { ok: false, error: "harvest_lab_local_only" },
      { status: 403 }
    );
  }

  let body: { preset?: string; userText?: string; reply?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const preset = body.preset ? getHarvestLabPreset(body.preset) : null;
  const userText = (preset?.userText ?? body.userText ?? "").trim();
  const reply = (preset?.reply ?? body.reply ?? "").trim();

  if (!userText || !reply) {
    return NextResponse.json(
      { ok: false, error: "preset_or_userText_reply_required" },
      { status: 400 }
    );
  }

  if (shouldSkipHarvest(userText, reply)) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "policy_skip",
      chips: [],
      userText,
      reply,
      preset: preset?.id ?? null,
      appendReply: preset?.appendReply ?? false,
    });
  }

  try {
    const mined = await mineLearnFromReply(userText, reply, {
      conversationId: `lab-${preset?.id ?? "custom"}`,
    });
    return NextResponse.json({
      ok: true,
      skipped: false,
      chips: mined.chips,
      userText,
      reply,
      preset: preset?.id ?? null,
      appendReply: preset?.appendReply ?? false,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "mine_failed",
      },
      { status: 500 }
    );
  }
}
