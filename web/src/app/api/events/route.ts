import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackHaloEvent } from "@/lib/track";

export const dynamic = "force-dynamic";

const KINDS = new Set(["harvest_lock"]);

async function requireMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null as null };
  const { data: member } = await supabase
    .from("halo_members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) return { supabase, user: null };
  return { supabase, user };
}

export async function POST(request: Request) {
  const { supabase, user } = await requireMember();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { kind?: unknown; meta?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const kind = typeof body.kind === "string" ? body.kind : "";
  if (!KINDS.has(kind)) {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

  const raw =
    body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
      ? (body.meta as Record<string, unknown>)
      : {};
  const meta: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(raw).slice(0, 16)) {
    if (typeof value === "string") meta[key] = value.slice(0, 4000);
    else if (typeof value === "number" && Number.isFinite(value)) meta[key] = value;
    else if (typeof value === "boolean") meta[key] = value;
    else if (value == null) meta[key] = null;
  }

  if (kind === "harvest_lock") {
    await trackHaloEvent(supabase, user.id, "harvest_lock", meta);
  }

  return NextResponse.json({ ok: true });
}
