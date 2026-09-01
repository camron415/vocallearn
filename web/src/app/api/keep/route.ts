import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseKeepCloudPayload } from "@/lib/keep-memory";

export const dynamic = "force-dynamic";

async function requireUser() {
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

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("halo_keep_state")
    .select("payload, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ payload: null, updatedAt: null });
  }

  return NextResponse.json({
    payload: data?.payload ?? null,
    updatedAt: data?.updated_at ?? null,
  });
}

export async function PUT(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { payload?: unknown; updatedAt?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = parseKeepCloudPayload(body.payload);
  if (!payload) {
    return NextResponse.json({ error: "Invalid keep payload" }, { status: 400 });
  }

  const clientAt =
    typeof body.updatedAt === "number"
      ? body.updatedAt
      : typeof body.updatedAt === "string"
        ? Date.parse(body.updatedAt)
        : 0;
  if (!Number.isFinite(clientAt) || clientAt < 0) {
    return NextResponse.json({ error: "Invalid updatedAt" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("halo_keep_state")
    .select("payload, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const serverAt = existing?.updated_at ? Date.parse(existing.updated_at) : 0;
  if (existing && serverAt > clientAt) {
    return NextResponse.json({
      payload: existing.payload,
      updatedAt: existing.updated_at,
      won: false,
    });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("halo_keep_state")
    .upsert(
      {
        user_id: user.id,
        payload,
        updated_at: now,
      },
      { onConflict: "user_id" }
    )
    .select("payload, updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not save keep." }, { status: 500 });
  }

  return NextResponse.json({
    payload: data?.payload ?? payload,
    updatedAt: data?.updated_at ?? now,
    won: true,
  });
}
