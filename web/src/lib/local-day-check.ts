import {
  addLocalCalendarDays,
  localDayKey,
  localHour,
  timeGreeting,
  zonedMidnight,
} from "./local-day";

type SuiteResult = { ok: boolean; failures: string[] };

export function runLocalDayFixtures(): SuiteResult {
  const failures: string[] = [];
  const tz = "America/Denver";
  // 2026-09-01 21:00 MDT = 2026-09-02 03:00 UTC
  const evening = Date.parse("2026-09-02T03:00:00.000Z");

  const day = localDayKey(evening, tz);
  if (day !== "2026-09-01") {
    failures.push(`localDayKey evening Denver: got ${day}`);
  }

  const next = addLocalCalendarDays(evening, 1, tz);
  const expectNext = zonedMidnight("2026-09-02", tz);
  if (next !== expectNext) {
    failures.push(
      `+1 calendar day: got ${new Date(next).toISOString()} want ${new Date(expectNext).toISOString()}`
    );
  }
  if (localDayKey(next, tz) !== "2026-09-02") {
    failures.push(`+1 day key ${localDayKey(next, tz)}`);
  }
  if (next <= evening) {
    failures.push("next calendar midnight should be after the 9pm harvest");
  }

  const plus3 = addLocalCalendarDays(evening, 3, tz);
  if (localDayKey(plus3, tz) !== "2026-09-04") {
    failures.push(`+3 day key ${localDayKey(plus3, tz)}`);
  }

  const plus7 = addLocalCalendarDays(evening, 7, tz);
  if (localDayKey(plus7, tz) !== "2026-09-08") {
    failures.push(`+7 day key ${localDayKey(plus7, tz)}`);
  }

  const hour = localHour(evening, tz);
  if (hour !== 21) failures.push(`localHour Denver evening: ${hour}`);
  if (timeGreeting(evening, tz) !== "Good evening") {
    failures.push(`greeting: ${timeGreeting(evening, tz)}`);
  }

  const morning = Date.parse("2026-09-01T14:00:00.000Z"); // 08:00 MDT
  if (timeGreeting(morning, tz) !== "Good morning") {
    failures.push(`morning greeting: ${timeGreeting(morning, tz)}`);
  }

  return { ok: failures.length === 0, failures };
}
