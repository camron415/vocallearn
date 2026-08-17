import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const token = (body.token ?? "").trim();
  if (!token) {
    return NextResponse.json({ error: "Missing invite" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("halo_reserve_invite", {
    tok: token,
  });
  if (error) {
    return NextResponse.json(
      { error: "This invite link is not valid." },
      { status: 400 }
    );
  }
  const result = (data ?? {}) as { ok?: boolean; reason?: string };
  if (!result.ok) {
    const message =
      result.reason === "used"
        ? "This invite was already used. Ask Camron for a new link."
        : result.reason === "busy"
          ? "Someone is already using this invite. If that was you, wait a minute and try again."
          : result.reason === "expired"
            ? "This invite has expired. Ask Camron for a new link."
            : "This invite link is not valid.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
