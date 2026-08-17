import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { isHaloLane, type HaloLane } from "@/lib/limits";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member } = await supabase
    .from("halo_members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (member?.role !== "admin") {
    return NextResponse.json({ error: "Only admins can invite." }, { status: 403 });
  }

  let lane: HaloLane = "family";
  try {
    const body = (await request.json()) as { lane?: string };
    if (isHaloLane(body.lane) && body.lane !== "lab") lane = body.lane;
  } catch {
    lane = "family";
  }

  const token = randomBytes(18).toString("base64url");
  const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const insert = await supabase.from("halo_invites").insert({
    token,
    created_by: user.id,
    expires_at: expires,
    lane,
  });
  if (insert.error) {
    const fallback = await supabase.from("halo_invites").insert({
      token,
      created_by: user.id,
      expires_at: expires,
    });
    if (fallback.error) {
      return NextResponse.json(
        { error: "Could not create invite. Try again." },
        { status: 500 }
      );
    }
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  return NextResponse.json({
    url: `${origin.replace(/\/$/, "")}/invite/${token}`,
    expiresAt: expires,
    lane,
  });
}
