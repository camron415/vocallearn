import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SITE_LANE, usagePercent } from "@/lib/limits";
import { isIanaTimeZone } from "@/lib/local-day";
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
    timeZone?: string;
    geoCity?: string;
    geoRegion?: string;
    geoCountry?: string;
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
  if (typeof body.timeZone === "string" && isIanaTimeZone(body.timeZone)) {
    patch.timezone = body.timeZone;
  }
  if (typeof body.geoCity === "string") {
    const city = body.geoCity.replace(/\s+/g, " ").trim().slice(0, 80);
    if (city) patch.geo_city = city;
  }
  if (typeof body.geoRegion === "string") {
    const region = body.geoRegion.replace(/\s+/g, " ").trim().slice(0, 40);
    if (region) patch.geo_region = region;
  }
  if (typeof body.geoCountry === "string") {
    const country = body.geoCountry.trim().slice(0, 2).toUpperCase();
    if (/^[A-Z]{2}$/.test(country)) patch.geo_country = country;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) {
    const withoutGeo = { ...patch };
    delete withoutGeo.timezone;
    delete withoutGeo.geo_city;
    delete withoutGeo.geo_region;
    delete withoutGeo.geo_country;
    if (Object.keys(withoutGeo).length) {
      const retry = await supabase
        .from("profiles")
        .update(withoutGeo)
        .eq("id", user.id);
      if (retry.error) {
        return NextResponse.json({ error: "Could not save." }, { status: 500 });
      }
    }
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
