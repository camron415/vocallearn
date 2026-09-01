import {
  fetchWeatherBrief,
  geocodePlace,
  placeFromWeatherAsk,
} from "@/lib/weather";
import type { DisplaySource } from "@/lib/markdown-plain";

const UA = { "User-Agent": "CoveFamilyAsk/1.1 (lab)" };

async function grab(url: string, ms = 3500): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      headers: UA,
      signal: ctrl.signal,
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function grabJson<T>(url: string): Promise<T | null> {
  const text = await grab(url);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function rssItems(xml: string, count = 6) {
  const items: string[] = [];
  const re =
    /<item[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) && items.length < count) {
    const title = m[1].replace(/\s+/g, " ").trim();
    if (!title || /^bbc|npr news/i.test(title)) continue;
    const rest = m[2];
    const desc =
      rest.match(
        /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i
      )?.[1]
        ?.replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 180) || "";
    const when =
      rest.match(/<(?:pubDate|dc:date)>([\s\S]*?)<\//i)?.[1]?.trim() || "";
    items.push(
      [title, desc, when ? `(${when})` : ""].filter(Boolean).join(" — ")
    );
  }
  return items;
}

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: {
        shortName?: string;
        currency?: string;
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        regularMarketVolume?: number;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
      };
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
  };
};

type EspnScoreboard = {
  events?: Array<{
    name?: string;
    competitions?: Array<{
      status?: { type?: { shortDetail?: string } };
      venue?: { fullName?: string };
      competitors?: Array<{
        homeAway?: string;
        score?: string;
        winner?: boolean;
        records?: Array<{ summary?: string }>;
        team?: { displayName?: string };
      }>;
    }>;
  }>;
};

type CoinMarket = {
  id?: string;
  name?: string;
  symbol?: string;
  current_price?: number;
  price_change_percentage_24h?: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  market_cap?: number;
  total_volume?: number;
  ath?: number;
  atl?: number;
};

export type LiveLookup = {
  text: string;
  sources: DisplaySource[];
};

type Tagged = { text: string; cites: DisplaySource[] } | null;

function tagged(text: string | null, ...cites: DisplaySource[]): Tagged {
  if (!text) return null;
  return { text, cites };
}

/** No-key public feeds. Skip xAI web_search when these cover the ask. */
export async function gatherLiveBriefs(userText: string): Promise<LiveLookup> {
  const t = userText.toLowerCase();
  const jobs: Array<Promise<Tagged>> = [];

  if (
    /\b(weather|forecast|rain|snow|temperature|umbrella|sunrise|sunset)\b/.test(
      t
    )
  ) {
    jobs.push(
      weatherBlock(userText).then((text) =>
        tagged(text, { label: "Open-Meteo", url: "https://open-meteo.com" })
      )
    );
  }
  if (/\b(air quality|aqi)\b/.test(t)) {
    jobs.push(
      airQualityBlock(userText).then((text) =>
        tagged(text, {
          label: "Open-Meteo Air Quality",
          url: "https://open-meteo.com/en/docs/air-quality-api",
        })
      )
    );
  }
  if (/\b(news|headline|headlines)\b/.test(t)) {
    jobs.push(
      newsBlock().then((text) =>
        tagged(
          text,
          { label: "BBC World", url: "https://www.bbc.com/news/world" },
          { label: "NPR", url: "https://www.npr.org" }
        )
      )
    );
  }
  if (/\b(stock|ticker|market|nasdaq|dow|s&p|s and p)\b/.test(t)) {
    jobs.push(
      stocksBlock(userText).then((text) =>
        tagged(text, {
          label: "Yahoo Finance",
          url: "https://finance.yahoo.com",
        })
      )
    );
  }
  if (/\b(crypto|bitcoin|ethereum|btc|eth)\b/.test(t)) {
    jobs.push(
      cryptoBlock().then((text) =>
        tagged(text, { label: "CoinGecko", url: "https://www.coingecko.com" })
      )
    );
  }
  if (
    /\b(exchange rate|dollar to|euro to|currency|forex|yen|pound)\b/.test(t)
  ) {
    jobs.push(
      forexBlock().then((text) =>
        tagged(text, { label: "Frankfurter / ECB", url: "https://www.frankfurter.app" })
      )
    );
  }
  if (
    /\b(sport|score|nfl|nba|mlb|nhl|hockey|world cup|soccer|football|f1|formula 1)\b/.test(
      t
    )
  ) {
    jobs.push(
      sportsBlock(t).then((text) =>
        tagged(text, { label: "ESPN", url: "https://www.espn.com" })
      )
    );
  }
  if (/\b(holiday|holidays)\b/.test(t)) {
    jobs.push(
      holidaysBlock().then((text) =>
        tagged(text, { label: "Nager.Date", url: "https://date.nager.at" })
      )
    );
  }
  if (/\b(earthquake|quake)\b/.test(t)) {
    jobs.push(
      quakesBlock().then((text) =>
        tagged(text, {
          label: "USGS",
          url: "https://earthquake.usgs.gov",
        })
      )
    );
  }
  if (/\b(define|definition of|meaning of)\b/.test(t)) {
    jobs.push(
      defineBlock(userText).then((text) =>
        tagged(text, {
          label: "Wikipedia",
          url: "https://en.wikipedia.org",
        })
      )
    );
  }
  if (/\b(capital of|population of)\b/.test(t)) {
    jobs.push(
      countryBlock(userText).then((text) =>
        tagged(text, {
          label: "countries.dev",
          url: "https://countries.dev",
        })
      )
    );
  }
  if (/\b(time in|what time is it)\b/.test(t)) {
    jobs.push(
      timeBlock(userText).then((text) =>
        tagged(text, {
          label: "Open-Meteo Geocoding",
          url: "https://open-meteo.com/en/docs/geocoding-api",
        })
      )
    );
  }
  if (/\b(tv show|tv series|what'?s playing)\b/.test(t)) {
    jobs.push(
      tvBlock(userText).then((text) =>
        tagged(text, { label: "TVMaze", url: "https://www.tvmaze.com" })
      )
    );
  }
  if (/\b(isbn|who wrote|author of)\b/.test(t)) {
    jobs.push(
      bookBlock(userText).then((text) =>
        tagged(text, {
          label: "Open Library",
          url: "https://openlibrary.org",
        })
      )
    );
  }

  if (!jobs.length) return { text: "", sources: [] };

  const parts = (await Promise.all(jobs)).filter(
    (part): part is { text: string; cites: DisplaySource[] } => Boolean(part)
  );
  const sources: DisplaySource[] = [];
  for (const part of parts) {
    for (const cite of part.cites) {
      if (!sources.some((row) => row.url === cite.url)) sources.push(cite);
    }
  }
  return { text: parts.map((part) => part.text).join("\n\n"), sources };
}

async function weatherBlock(userText: string) {
  const place = placeFromWeatherAsk(userText) || "Salt Lake City";
  try {
    const brief = await fetchWeatherBrief(place);
    if (!brief) return null;
    const assumed = placeFromWeatherAsk(userText)
      ? ""
      : "\nNo city was named; used Salt Lake City (household default).";
    return `${brief.summary}${assumed}`;
  } catch {
    return null;
  }
}

async function newsBlock() {
  const [bbc, npr] = await Promise.all([
    grab("https://feeds.bbci.co.uk/news/world/rss.xml"),
    grab("https://feeds.npr.org/1001/rss.xml"),
  ]);
  const headlines = [
    ...(bbc ? rssItems(bbc, 6) : []),
    ...(npr ? rssItems(npr, 5) : []),
  ];
  if (!headlines.length) return null;
  return `News (BBC World + NPR, delayed RSS, not a web search):\n${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}`;
}

async function stocksBlock(userText: string) {
  const named = [
    ...userText.matchAll(/\b([A-Z]{1,5})\s+stock\b/g),
    ...userText.matchAll(/\bstock(?: price)?(?: for| of)?\s+([A-Z]{1,5})\b/g),
  ]
    .map((m) => m[1])
    .filter((s) => !["I", "A", "US", "CEO"].includes(s));
  const unique = [...new Set(named)].slice(0, 4);
  const symbols = unique.length
    ? unique
    : ["%5EGSPC", "%5EIXIC", "%5EDJI"];
  const labels = unique.length
    ? unique
    : ["S&P 500", "Nasdaq", "Dow"];
  const rows = await Promise.all(
    symbols.map(async (sym, i) => {
      const data = await grabJson<YahooChart>(
        `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=3mo&interval=1d`
      );
      const meta = data?.chart?.result?.[0]?.meta;
      const closes =
        data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(
          (n): n is number => typeof n === "number"
        ) ?? [];
      const last = meta?.regularMarketPrice ?? closes.at(-1);
      if (last == null) return null;
      const prev =
        meta?.chartPreviousClose ??
        meta?.previousClose ??
        (closes.length > 1 ? closes[closes.length - 2] : last);
      const monthAgo = closes.length > 21 ? closes[closes.length - 22] : closes[0];
      const pct = (a: number, b: number) =>
        b ? `${((a - b) / b) * 100 >= 0 ? "+" : ""}${(((a - b) / b) * 100).toFixed(2)}%` : "";
      const day = pct(last, prev);
      const month = monthAgo ? pct(last, monthAgo) : "";
      const hi = meta?.regularMarketDayHigh;
      const lo = meta?.regularMarketDayLow;
      const yHi = meta?.fiftyTwoWeekHigh;
      const yLo = meta?.fiftyTwoWeekLow;
      const vol = meta?.regularMarketVolume;
      const name = meta?.shortName || labels[i];
      return [
        `${name}: ${last.toFixed(last >= 100 ? 0 : 2)} ${meta?.currency ?? "USD"} (${day} today${month ? `, ${month} ~1m` : ""})`,
        hi != null && lo != null ? `day range ${lo.toFixed(0)}–${hi.toFixed(0)}` : "",
        yLo != null && yHi != null ? `52-week ${yLo.toFixed(0)}–${yHi.toFixed(0)}` : "",
        vol != null ? `volume ${Math.round(vol).toLocaleString("en-US")}` : "",
      ]
        .filter(Boolean)
        .join("; ");
    })
  );
  const lines = rows.filter(Boolean);
  if (!lines.length) return null;
  return `US market snapshot (Yahoo Finance public chart, delayed). Use these numbers; add a one-line read of the day vs the month, not advice:\n${lines.join("\n")}`;
}

async function cryptoBlock() {
  const data = await grabJson<CoinMarket[]>(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum&price_change_percentage=24h,7d,30d"
  );
  if (!data?.length) return null;
  const lines = data.map((row) => {
    const money = (n?: number) =>
      n == null
        ? "—"
        : n >= 1e9
          ? `$${(n / 1e9).toFixed(1)}B`
          : `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    const pct = (n?: number) =>
      n == null ? "" : `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
    return `${row.name} (${row.symbol?.toUpperCase()}): ${money(row.current_price)}  24h ${pct(row.price_change_percentage_24h)}, 7d ${pct(row.price_change_percentage_7d_in_currency)}, 30d ${pct(row.price_change_percentage_30d_in_currency)}; mkt cap ${money(row.market_cap)}, vol ${money(row.total_volume)}; ATH ${money(row.ath)} / ATL ${money(row.atl)}`;
  });
  return `Crypto (CoinGecko):\n${lines.join("\n")}`;
}

async function forexBlock() {
  const data = await grabJson<{
    base?: string;
    date?: string;
    rates?: Record<string, number>;
  }>("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,CAD,MXN");
  if (!data?.rates) return null;
  const bits = Object.entries(data.rates)
    .map(([code, n]) => `USD/${code} ${n}`)
    .join(", ");
  return `FX from ECB via Frankfurter (${data.date ?? "today"}): ${bits}`;
}

async function sportsBlock(t: string) {
  const urls: string[] = [];
  if (/\b(world cup|soccer|fifa)\b/.test(t)) {
    urls.push(
      "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard"
    );
  }
  if (/\bnfl\b/.test(t) || urls.length === 0) {
    urls.push(
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
    );
  }
  if (/\bnba\b/.test(t)) {
    urls.push(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"
    );
  }
  if (/\bmlb\b/.test(t)) {
    urls.push(
      "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard"
    );
  }
  if (/\b(nhl|hockey)\b/.test(t)) {
    urls.push(
      "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard"
    );
  }
  if (/\b(f1|formula 1)\b/.test(t)) {
    urls.push(
      "https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard"
    );
  }
  if (/\bsport/.test(t) && urls.length < 2) {
    urls.push(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"
    );
  }

  const boards = await Promise.all(
    [...new Set(urls)].slice(0, 3).map((url) => grabJson<EspnScoreboard>(url))
  );
  const lines: string[] = [];
  for (const board of boards) {
    for (const event of board?.events ?? []) {
      const comp = event.competitions?.[0];
      const teams = comp?.competitors ?? [];
      const score = teams
        .map((c) => {
          const rec = c.records?.[0]?.summary
            ? ` ${c.records[0].summary}`
            : "";
          return `${c.team?.displayName ?? "?"}${rec} ${c.score ?? ""}`.trim();
        })
        .join(" vs ");
      const status = comp?.status?.type?.shortDetail ?? "";
      const venue = comp?.venue?.fullName ? ` @ ${comp.venue.fullName}` : "";
      if (score) lines.push(`${score}${status ? ` (${status})` : ""}${venue}`);
      if (lines.length >= 10) break;
    }
  }
  if (!lines.length) return null;
  return `Scores (ESPN public scoreboard):\n${lines.join("\n")}`;
}

async function holidaysBlock() {
  const year = new Date().getFullYear();
  const data = await grabJson<Array<{ date?: string; name?: string }>>(
    `https://date.nager.at/api/v3/PublicHolidays/${year}/US`
  );
  if (!Array.isArray(data)) return null;
  const upcoming = data
    .filter((h) => (h.date ?? "") >= new Date().toISOString().slice(0, 10))
    .slice(0, 5)
    .map((h) => `${h.date} — ${h.name}`);
  if (!upcoming.length) return null;
  return `Upcoming US public holidays (Nager.Date):\n${upcoming.join("\n")}`;
}

async function quakesBlock() {
  const data = await grabJson<{
    features?: Array<{
      properties?: { mag?: number; place?: string; time?: number };
    }>;
  }>(
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson"
  );
  const rows = (data?.features ?? [])
    .slice(0, 5)
    .map((f) => {
      const p = f.properties;
      return `M${p?.mag ?? "?"} ${p?.place ?? ""}`;
    });
  if (!rows.length) return "USGS: no M4.5+ quakes in the last day.";
  return `Recent quakes (USGS):\n${rows.join("\n")}`;
}

function namedPlace(text: string) {
  return (
    placeFromWeatherAsk(text) ||
    text.match(
      /(?:in|for|near|at)\s+([A-Za-z][A-Za-z]+(?:\s+[A-Za-z][A-Za-z]+){0,3})/i
    )?.[1] ||
    null
  );
}

async function airQualityBlock(userText: string) {
  const place = namedPlace(userText) || "Salt Lake City";
  const geo = await geocodePlace(place);
  if (!geo) return null;
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.searchParams.set("latitude", String(geo.latitude));
  url.searchParams.set("longitude", String(geo.longitude));
  url.searchParams.set("current", "us_aqi,pm2_5,pm10");
  url.searchParams.set("timezone", geo.timezone);
  const data = await grabJson<{
    current?: { us_aqi?: number; pm2_5?: number; pm10?: number };
  }>(url.toString());
  const cur = data?.current;
  if (cur?.us_aqi == null) return null;
  const assumed = namedPlace(userText)
    ? ""
    : " No city was named; used Salt Lake City.";
  return `Air quality in ${geo.label} (Open-Meteo): US AQI ${Math.round(cur.us_aqi)}, PM2.5 ${Math.round(cur.pm2_5 ?? 0)}, PM10 ${Math.round(cur.pm10 ?? 0)}.${assumed}`;
}

async function defineBlock(userText: string) {
  const word =
    userText.match(
      /(?:define|definition of|meaning of)\s+["']?([a-zA-Z][a-zA-Z-]{1,24})["']?/i
    )?.[1] || null;
  if (!word) return null;

  const wiki = await grabJson<{
    extract?: string;
    title?: string;
  }>(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`
  );
  if (wiki?.extract) {
    return `Wikipedia (${wiki.title || word}): ${wiki.extract}`;
  }

  const muse = await grabJson<Array<{ word?: string; defs?: string[] }>>(
    `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=1`
  );
  const def = muse?.[0]?.defs?.[0]?.replace(/^[a-z]\t/, "");
  if (def) return `Dictionary (${word}): ${def}`;

  const data = await grabJson<
    Array<{
      word?: string;
      meanings?: Array<{
        partOfSpeech?: string;
        definitions?: Array<{ definition?: string }>;
      }>;
    }>
  >(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
  const entry = data?.[0];
  const dict = entry?.meanings?.[0]?.definitions?.[0]?.definition;
  if (!dict) return null;
  const pos = entry?.meanings?.[0]?.partOfSpeech;
  return `Dictionary (${word}${pos ? `, ${pos}` : ""}): ${dict}`;
}

async function countryBlock(userText: string) {
  const name =
    userText.match(
      /(?:capital of|population of)\s+([A-Za-z][A-Za-z]+(?:\s+[A-Za-z][A-Za-z]+){0,3})/i
    )?.[1] || null;
  if (!name) return null;
  const data = await grabJson<
    Array<{
      name?: string;
      capital?: string;
      population?: number;
      region?: string;
      currencies?: Array<{ name?: string; code?: string }>;
    }>
  >(`https://countries.dev/name/${encodeURIComponent(name)}`);
  const row = data?.[0];
  if (!row?.name) return null;
  const money = (row.currencies ?? [])
    .map((c) => `${c.name ?? c.code} (${c.code})`)
    .join(", ");
  return `Country (countries.dev): ${row.name}, capital ${row.capital ?? "—"}, population ${row.population?.toLocaleString("en-US") ?? "—"}, ${row.region ?? ""}${money ? `, ${money}` : ""}.`;
}

async function timeBlock(userText: string) {
  const named =
    namedPlace(userText) ||
    userText.match(
      /(?:time in|what time is it in)\s+([A-Za-z][A-Za-z]+(?:\s+[A-Za-z][A-Za-z]+){0,3})/i
    )?.[1] ||
    null;
  const place = named || "Salt Lake City";
  const geo = await geocodePlace(place);
  if (!geo) return null;
  const now = new Intl.DateTimeFormat("en-US", {
    timeZone: geo.timezone === "auto" ? "America/Denver" : geo.timezone,
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date());
  const assumed = named
    ? ""
    : " No city was named; used Salt Lake City.";
  return `Local time in ${geo.label} (${geo.timezone}): ${now}.${assumed}`;
}

async function tvBlock(userText: string) {
  const q =
    userText.match(/"([^"]{2,80})"/)?.[1] ||
    userText
      .replace(/\b(tv show|tv series|what'?s playing|when is|when does)\b/gi, " ")
      .replace(/[?!.]/g, " ")
      .trim()
      .slice(0, 80);
  if (q.length < 2) return null;
  const data = await grabJson<
    Array<{
      show?: {
        name?: string;
        status?: string;
        premiered?: string;
        network?: { name?: string };
        webChannel?: { name?: string };
        summary?: string;
      };
    }>
  >(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`);
  const show = data?.[0]?.show;
  if (!show?.name) return null;
  const where = show.network?.name || show.webChannel?.name || "unknown network";
  const blurb = (show.summary || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  return `TV (TVMaze): ${show.name} (${show.status ?? "unknown"}, ${where}${show.premiered ? `, premiered ${show.premiered}` : ""})${blurb ? `\n${blurb}` : ""}`;
}

async function bookBlock(userText: string) {
  const isbn = userText.match(/\b(\d{10}|\d{13})\b/)?.[1];
  const q =
    isbn ||
    userText.match(/(?:who wrote|author of)\s+["']?(.+?)["']?\s*$/i)?.[1] ||
    userText.replace(/\b(isbn|who wrote|author of)\b/gi, " ").trim();
  if (!q || q.length < 2) return null;
  const data = await grabJson<{
    docs?: Array<{
      title?: string;
      author_name?: string[];
      first_publish_year?: number;
    }>;
  }>(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=3`
  );
  const docs = data?.docs?.filter((d) => d.title) ?? [];
  if (!docs.length) return null;
  return `Books (Open Library):\n${docs
    .map(
      (d) =>
        `${d.title} — ${(d.author_name ?? []).slice(0, 2).join(", ") || "unknown"}${d.first_publish_year ? ` (${d.first_publish_year})` : ""}`
    )
    .join("\n")}`;
}
