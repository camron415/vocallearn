import {
  FALLBACK_TIME_ZONE,
  isIanaTimeZone,
} from "@/lib/local-day";

/** Approximate place for an account. Never store the raw IP. */
export type HaloGeo = {
  timeZone: string;
  city?: string;
  region?: string;
  country?: string;
};

function header(request: Request, name: string): string | undefined {
  const raw = request.headers.get(name);
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw).replace(/\+/g, " ").trim() || undefined;
  } catch {
    return raw.trim() || undefined;
  }
}

/** Vercel edge geo headers. Empty on localhost. */
export function geoFromRequest(request: Request): Partial<HaloGeo> {
  const city = header(request, "x-vercel-ip-city");
  const region = header(request, "x-vercel-ip-country-region");
  const country = header(request, "x-vercel-ip-country")?.toUpperCase();
  const tzRaw = header(request, "x-vercel-ip-timezone");
  const timeZone = tzRaw && isIanaTimeZone(tzRaw) ? tzRaw : undefined;
  return { city, region, country, timeZone };
}

export function mergeHaloGeo(
  ...parts: Array<Partial<HaloGeo> | null | undefined>
): HaloGeo {
  const out: HaloGeo = { timeZone: FALLBACK_TIME_ZONE };
  for (const part of parts) {
    if (!part) continue;
    if (part.timeZone && isIanaTimeZone(part.timeZone)) {
      out.timeZone = part.timeZone;
    }
    if (part.city) out.city = part.city;
    if (part.region) out.region = part.region;
    if (part.country) out.country = part.country.slice(0, 2).toUpperCase();
  }
  return out;
}

export function localeLine(geo: HaloGeo): string {
  const place = [geo.city, geo.region, geo.country].filter(Boolean).join(", ");
  if (place) {
    return `Locale: The user is in ${place} (${geo.timeZone}). For weather, local news, "today", and "near me", use this place unless they name another.`;
  }
  return `Locale: Timezone ${geo.timeZone}. If they ask weather or local news without a city, ask which city.`;
}

export function defaultPlaceLabel(geo?: HaloGeo | null): string {
  if (geo?.city) {
    return [geo.city, geo.region, geo.country].filter(Boolean).join(", ");
  }
  return "Salt Lake City";
}

export function assumedPlaceNote(
  named: boolean,
  geo?: HaloGeo | null
): string {
  if (named) return "";
  if (geo?.city) {
    return ` No city was named; used ${defaultPlaceLabel(geo)} from this account.`;
  }
  return " No city was named; used Salt Lake City (household default).";
}
