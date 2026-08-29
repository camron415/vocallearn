import { NextResponse } from "next/server";
import { writeHarvestCapture } from "@/lib/harvest-capture-fs";

export const runtime = "nodejs";

function labHost(request: Request) {
  if (process.env.VERCEL) return false;
  const host = (request.headers.get("host") || "").split(":")[0];
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") {
    return true;
  }
  // Phone preview hitting the Mac over LAN — same machine as the sink.
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return false;
}

async function macSinkUp() {
  if (Date.now() - sinkAt < 2500) return sinkOk;
  sinkAt = Date.now();
  try {
    const res = await fetch("http://127.0.0.1:8791/health", {
      cache: "no-store",
      signal: AbortSignal.timeout(400),
    });
    sinkOk = res.ok;
  } catch {
    sinkOk = false;
  }
  return sinkOk;
}

let sinkAt = 0;
let sinkOk = false;

export async function GET(request: Request) {
  if (!labHost(request)) {
    return NextResponse.json(
      { ok: false, error: "capture_local_only" },
      { status: 403 }
    );
  }
  const macSink = await macSinkUp();
  return NextResponse.json({ ok: true, macSink, via: "local-api" });
}

export async function POST(request: Request) {
  if (!labHost(request)) {
    return NextResponse.json(
      { ok: false, error: "capture_local_only" },
      { status: 403 }
    );
  }
  try {
    const payload = (await request.json()) as {
      meta: Record<string, unknown>;
      frames: { name: string; jpeg: string }[];
    };
    if (!payload?.frames?.length) {
      return NextResponse.json({ ok: false, error: "no_frames" }, { status: 400 });
    }
    const saved = await writeHarvestCapture(payload);
    return NextResponse.json({ ok: true, ...saved });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "write_failed" },
      { status: 500 }
    );
  }
}
