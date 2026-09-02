import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isHaloLane } from "@/lib/limits";
import { isIanaTimeZone } from "@/lib/local-day";
import type { HaloGeo } from "@/lib/request-geo";
import type { HaloProfile } from "@/lib/types";

const PROFILE_CORE =
  "display_name, answer_length, halo_onboarded_at";
const PROFILE_GEO = `${PROFILE_CORE}, timezone, geo_city, geo_region, geo_country`;

export async function loadHaloProfile(
  supabase: SupabaseClient,
  user: User
): Promise<HaloProfile> {
  const [profileRow, memberResult] = await Promise.all([
    loadProfileRow(supabase, user.id),
    supabase
      .from("halo_members")
      .select("role, lane")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  let member: { role?: string | null; lane?: string | null } | null =
    memberResult.data;
  if (memberResult.error) {
    const retry = await supabase
      .from("halo_members")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    member = retry.data;
  }

  const { profile, profileError } = profileRow;
  const length = profile?.answer_length;
  const timeZone =
    typeof profile?.timezone === "string" && isIanaTimeZone(profile.timezone)
      ? profile.timezone
      : undefined;
  return {
    displayName:
      profile?.display_name ||
      (user.user_metadata?.display_name as string | undefined) ||
      user.email?.split("@")[0] ||
      "friend",
    answerLength:
      length === "short" || length === "long" || length === "medium"
        ? length
        : "medium",
    onboarded: profileError ? true : Boolean(profile?.halo_onboarded_at),
    isAdmin: member?.role === "admin",
    lane: isHaloLane(member?.lane) ? member.lane : "family",
    timeZone,
    geoCity: str(profile?.geo_city),
    geoRegion: str(profile?.geo_region),
    geoCountry: str(profile?.geo_country)?.slice(0, 2).toUpperCase(),
  };
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

type ProfileRow = {
  display_name?: string | null;
  answer_length?: string | null;
  halo_onboarded_at?: string | null;
  timezone?: string | null;
  geo_city?: string | null;
  geo_region?: string | null;
  geo_country?: string | null;
};

async function loadProfileRow(supabase: SupabaseClient, userId: string) {
  const withGeo = await supabase
    .from("profiles")
    .select(PROFILE_GEO)
    .eq("id", userId)
    .maybeSingle();
  if (!withGeo.error) {
    return {
      profile: withGeo.data as ProfileRow | null,
      profileError: withGeo.error,
    };
  }
  const core = await supabase
    .from("profiles")
    .select(PROFILE_CORE)
    .eq("id", userId)
    .maybeSingle();
  return {
    profile: core.data as ProfileRow | null,
    profileError: core.error,
  };
}

export function geoFromProfile(profile?: HaloProfile | null): Partial<HaloGeo> {
  if (!profile) return {};
  return {
    timeZone: profile.timeZone,
    city: profile.geoCity,
    region: profile.geoRegion,
    country: profile.geoCountry,
  };
}

/** Persist IANA TZ + coarse place. Ignores missing-column errors until migration 016. */
export async function rememberHaloGeo(
  supabase: SupabaseClient,
  userId: string,
  geo: HaloGeo
) {
  const patch: Record<string, string> = {};
  if (geo.timeZone && isIanaTimeZone(geo.timeZone)) patch.timezone = geo.timeZone;
  if (geo.city) patch.geo_city = geo.city.slice(0, 80);
  if (geo.region) patch.geo_region = geo.region.slice(0, 40);
  if (geo.country) patch.geo_country = geo.country.slice(0, 2).toUpperCase();
  if (!Object.keys(patch).length) return;
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (!error) return;
  if (patch.timezone) {
    await supabase
      .from("profiles")
      .update({ timezone: patch.timezone })
      .eq("id", userId);
  }
}
