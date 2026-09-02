/** Calendar-day math in an IANA timezone. No rolling 24h / 72h windows. */

export const FALLBACK_TIME_ZONE = "America/Denver";

export function isIanaTimeZone(value: string): boolean {
  if (!value || value.length > 80) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function guessTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && isIanaTimeZone(tz)) return tz;
  } catch {
    /* ignore */
  }
  return FALLBACK_TIME_ZONE;
}

export function localDayKey(
  now = Date.now(),
  timeZone = guessTimeZone()
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function addYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

function tzOffsetMs(atUtc: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(atUtc));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  let hour = get("hour");
  if (hour === 24) hour = 0;
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    hour,
    get("minute"),
    get("second")
  );
  return asUtc - atUtc;
}

/** UTC millis for local midnight of YYYY-MM-DD in `timeZone`. */
export function zonedMidnight(ymd: string, timeZone: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  const utcGuess = Date.UTC(y, m - 1, d, 0, 0, 0);
  return utcGuess - tzOffsetMs(utcGuess, timeZone);
}

export function startOfLocalDay(
  from = Date.now(),
  timeZone = guessTimeZone()
): number {
  return zonedMidnight(localDayKey(from, timeZone), timeZone);
}

/** Start of the local calendar day `days` after the calendar day of `from`. */
export function addLocalCalendarDays(
  from: number,
  days: number,
  timeZone = guessTimeZone()
): number {
  return zonedMidnight(addYmd(localDayKey(from, timeZone), days), timeZone);
}

export function localHour(
  now = Date.now(),
  timeZone = guessTimeZone()
): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(now));
  let h = Number(parts.find((p) => p.type === "hour")?.value);
  const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value;
  if (dayPeriod && Number.isFinite(h) && h <= 12) {
    const pm = /p/i.test(dayPeriod);
    if (pm && h < 12) h += 12;
    if (!pm && h === 12) h = 0;
  }
  if (h === 24) return 0;
  return Number.isFinite(h) ? h : new Date(now).getHours();
}

export function timeGreeting(
  now = Date.now(),
  timeZone = guessTimeZone()
): string {
  const h = localHour(now, timeZone);
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
