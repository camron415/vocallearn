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

const STORAGE_KEY = "halo-timezone";

/** Prefer profile/browser TZ; never treat bare UTC as a user zone in the browser. */
export function resolveUserTimeZone(profileTz?: string | null): string {
  if (profileTz && isIanaTimeZone(profileTz) && profileTz !== "UTC") {
    return profileTz;
  }
  const guessed = guessTimeZone();
  if (guessed !== "UTC") return guessed;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isIanaTimeZone(saved) && saved !== "UTC") return saved;
  } catch {
    /* private browsing */
  }
  return FALLBACK_TIME_ZONE;
}

export function rememberUserTimeZone(timeZone: string) {
  if (!isIanaTimeZone(timeZone) || timeZone === "UTC") return;
  try {
    localStorage.setItem(STORAGE_KEY, timeZone);
  } catch {
    /* private browsing */
  }
}

export function getUserTimeZone(): string {
  if (typeof window === "undefined") return FALLBACK_TIME_ZONE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isIanaTimeZone(saved) && saved !== "UTC") return saved;
  } catch {
    /* private browsing */
  }
  const guessed = guessTimeZone();
  return guessed === "UTC" ? FALLBACK_TIME_ZONE : guessed;
}

export function localDayKey(
  now = Date.now(),
  timeZone = getUserTimeZone()
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
  timeZone = getUserTimeZone()
): number {
  return zonedMidnight(localDayKey(from, timeZone), timeZone);
}

/** Start of the local calendar day `days` after the calendar day of `from`. */
export function addLocalCalendarDays(
  from: number,
  days: number,
  timeZone = getUserTimeZone()
): number {
  return zonedMidnight(addYmd(localDayKey(from, timeZone), days), timeZone);
}

export function localHour(
  now = Date.now(),
  timeZone = getUserTimeZone()
): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date(now));
  const h = Number(parts.find((p) => p.type === "hour")?.value);
  if (h === 24) return 0;
  return Number.isFinite(h) ? h : new Date(now).getHours();
}

export function timeGreeting(
  now = Date.now(),
  timeZone = getUserTimeZone()
): string {
  const h = localHour(now, timeZone);
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Fix chips scheduled at UTC midnight instead of local midnight (1.1.1 hotfix). */
export function repairUtcMidnightDue(dueAt: number, timeZone: string): number {
  if (!Number.isFinite(dueAt) || timeZone === "UTC") return dueAt;
  const utcKey = localDayKey(dueAt, "UTC");
  if (dueAt !== zonedMidnight(utcKey, "UTC")) return dueAt;
  return zonedMidnight(utcKey, timeZone);
}
