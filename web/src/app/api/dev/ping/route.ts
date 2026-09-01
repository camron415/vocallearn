import { NextResponse } from "next/server";
import { isLabHost } from "@/lib/lab-host";

export const dynamic = "force-dynamic";

/** Phone/LAN smoke: GET /api/dev/ping — no auth. Dev + LAN hosts only. */
export async function GET(request: Request) {
  const host = new URL(request.url).hostname;
  if (process.env.NODE_ENV !== "development" && !isLabHost(host)) {
    return NextResponse.json({ ok: false, error: "dev_only" }, { status: 403 });
  }
  return NextResponse.json({
    ok: true,
    host,
    at: new Date().toISOString(),
  });
}
