/** Open-Meteo is free, no key. Default city is the household (Salt Lake). */

export type WeatherBrief = {
  place: string;
  summary: string;
};

export type GeoPlace = {
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

type GeoHit = {
  name?: string;
  admin1?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
};

const PLACE =
  /(?:\bin|\bfor|\bnear|\bat)\s+([A-Za-z][A-Za-z]+(?:\s+[A-Za-z][A-Za-z]+){0,3})/i;

export function placeFromWeatherAsk(text: string): string | null {
  const match = text.match(PLACE);
  if (!match) return null;
  const place = match[1].trim();
  if (place.length < 3) return null;
  return place;
}

export async function geocodePlace(place: string): Promise<GeoPlace | null> {
  const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geoUrl.searchParams.set("name", place);
  geoUrl.searchParams.set("count", "1");
  geoUrl.searchParams.set("language", "en");

  const geoRes = await fetch(geoUrl, { next: { revalidate: 3600 } });
  if (!geoRes.ok) return null;
  const geo = (await geoRes.json()) as { results?: GeoHit[] };
  const hit = geo.results?.[0];
  if (
    !hit ||
    typeof hit.latitude !== "number" ||
    typeof hit.longitude !== "number"
  ) {
    return null;
  }

  return {
    label: [hit.name, hit.admin1, hit.country].filter(Boolean).join(", "),
    latitude: hit.latitude,
    longitude: hit.longitude,
    timezone: hit.timezone || "auto",
  };
}

export async function fetchWeatherBrief(
  place: string
): Promise<WeatherBrief | null> {
  const hit = await geocodePlace(place);
  if (!hit) return null;

  const label = hit.label;
  const wxUrl = new URL("https://api.open-meteo.com/v1/forecast");
  wxUrl.searchParams.set("latitude", String(hit.latitude));
  wxUrl.searchParams.set("longitude", String(hit.longitude));
  wxUrl.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code"
  );
  wxUrl.searchParams.set(
    "hourly",
    "temperature_2m,precipitation_probability,weather_code"
  );
  wxUrl.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max,wind_speed_10m_max"
  );
  wxUrl.searchParams.set("timezone", hit.timezone);
  wxUrl.searchParams.set("forecast_days", "7");
  wxUrl.searchParams.set("forecast_hours", "12");
  wxUrl.searchParams.set("temperature_unit", "fahrenheit");
  wxUrl.searchParams.set("wind_speed_unit", "mph");

  const wxRes = await fetch(wxUrl, { next: { revalidate: 1800 } });
  if (!wxRes.ok) return null;
  const wx = (await wxRes.json()) as {
    current?: {
      temperature_2m?: number;
      apparent_temperature?: number;
      relative_humidity_2m?: number;
      wind_speed_10m?: number;
      precipitation?: number;
      weather_code?: number;
    };
    hourly?: {
      time?: string[];
      temperature_2m?: number[];
      precipitation_probability?: number[];
      weather_code?: number[];
    };
    daily?: {
      time?: string[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      precipitation_probability_max?: number[];
      weather_code?: number[];
      sunrise?: string[];
      sunset?: string[];
      uv_index_max?: number[];
      wind_speed_10m_max?: number[];
    };
  };
  const days = wx.daily?.time ?? [];
  if (!days.length) return null;

  const now = wx.current;
  const nowLine = now
    ? `Now: ${weatherWord(now.weather_code)} ${Math.round(now.temperature_2m ?? 0)}°F (feels ${Math.round(now.apparent_temperature ?? now.temperature_2m ?? 0)}°F), humidity ${Math.round(now.relative_humidity_2m ?? 0)}%, wind ${Math.round(now.wind_speed_10m ?? 0)} mph${now.precipitation ? `, precip ${now.precipitation}` : ""}.`
    : "";

  const hours = (wx.hourly?.time ?? []).slice(0, 12).map((stamp, i) => {
    const temp = wx.hourly?.temperature_2m?.[i];
    const rain = wx.hourly?.precipitation_probability?.[i];
    const code = wx.hourly?.weather_code?.[i];
    const hh = stamp.includes("T") ? stamp.split("T")[1]?.slice(0, 5) : stamp;
    return `${hh} ${weatherWord(code)} ${Math.round(temp ?? 0)}°F, ${Math.round(rain ?? 0)}% rain`;
  });

  const lines = days.slice(0, 7).map((day, i) => {
    const hi = wx.daily?.temperature_2m_max?.[i];
    const lo = wx.daily?.temperature_2m_min?.[i];
    const rain = wx.daily?.precipitation_probability_max?.[i];
    const code = wx.daily?.weather_code?.[i];
    const rise = clock(wx.daily?.sunrise?.[i]);
    const set = clock(wx.daily?.sunset?.[i]);
    const uv = wx.daily?.uv_index_max?.[i];
    const wind = wx.daily?.wind_speed_10m_max?.[i];
    const sun = rise && set ? `, sunrise ${rise} / sunset ${set}` : "";
    const extra = [
      uv != null ? `UV ${Math.round(uv)}` : "",
      wind != null ? `wind ${Math.round(wind)} mph` : "",
    ]
      .filter(Boolean)
      .join(", ");
    return `${day}: ${weatherWord(code)} high ${Math.round(hi ?? 0)}°F / low ${Math.round(lo ?? 0)}°F, ${Math.round(rain ?? 0)}% chance of precip${extra ? `, ${extra}` : ""}${sun}`;
  });

  return {
    place: label || place,
    summary: [
      `Forecast for ${label || place} (Open-Meteo, °F):`,
      nowLine,
      hours.length ? `Next 12 hours:\n${hours.join("\n")}` : "",
      `7-day:\n${lines.join("\n")}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

function clock(iso: string | undefined) {
  if (!iso) return "";
  const t = iso.includes("T") ? iso.split("T")[1] : iso;
  return t.slice(0, 5);
}

function weatherWord(code: number | undefined) {
  if (code == null) return "mixed";
  if (code === 0) return "clear";
  if (code <= 3) return "partly cloudy";
  if (code <= 48) return "foggy";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "showers";
  if (code <= 99) return "storms";
  return "mixed";
}
