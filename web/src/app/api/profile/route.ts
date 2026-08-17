import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SITE_LANE, usagePercent } from "@/lib/limits";
import { usageSnapshot } from "@/lib/usage";
import type { AnswerLength } from "@/lib/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: member }, usage] = await Promise.all([
    supabase
      .from("halo_members")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle(),
    usageSnapshot(supabase, user.id),
  ]);

  const percent = usagePercent(usage.spentWeek, usage.weekCap);
  if (member?.role !== "admin") {
    return NextResponse.json({ percent, showCost: false });
  }

  return NextResponse.json({
    ...usage,
    percent,
    showCost: true,
    siteLane: SITE_LANE,
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    displayName?: string;
    answerLength?: AnswerLength;
    onboarded?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, string | null> = {};
  if (typeof body.displayName === "string") {
    const name = body.displayName.replace(/\s+/g, " ").trim().slice(0, 40);
    if (name) patch.display_name = name;
  }
  if (
    body.answerLength === "short" ||
    body.answerLength === "medium" ||
    body.answerLength === "long"
  ) {
    patch.answer_length = body.answerLength;
  }
  if (body.onboarded) {
    patch.halo_onboarded_at = new Date().toISOString();
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) {
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }

  if (patch.display_name) {
    await supabase.auth.updateUser({
      data: { display_name: patch.display_name },
    });
  }

  if (body.onboarded) {
    const { trackHaloEvent } = await import("@/lib/track");
    await trackHaloEvent(supabase, user.id, "onboard", {});
  }

  return NextResponse.json({ ok: true });
}
