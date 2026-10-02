/**
 * The UTC offset of an IANA zone at a local wall clock time, read from the tz
 * database that the runtime's Intl carries.
 *
 * A model that types `utc_offset_minutes` tends to type today's offset: 330 for
 * a Sri Lankan birth in 1998, when clocks there read UTC+6:00, or -300 for a
 * New York birth in July. Thirty minutes is about 7 degrees of Ascendant. The
 * Lumin server accepts `time_zone` beside a top-level `birth_datetime` and runs
 * this same solver, so the two always agree. Nested chart objects (`person2`,
 * `partner`) and event fields still take a number, which is what this is for.
 *
 * Safe in the browser and on the server. It imports nothing.
 */

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      era: "short",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** True when the runtime knows `timeZone` as an IANA name. */
export function isKnownTimeZone(timeZone: string): boolean {
  if (typeof timeZone !== "string" || timeZone.trim() === "") return false;
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

function offsetSecondsAt(timeZone: string, epochMs: number): number {
  const parts: Record<string, string> = {};
  for (const p of formatterFor(timeZone).formatToParts(new Date(epochMs))) parts[p.type] = p.value;
  let year = Number(parts.year);
  if (parts.era === "BC" || parts.era === "B") year = 1 - year;
  const wall = new Date(0);
  wall.setUTCFullYear(year, Number(parts.month) - 1, Number(parts.day));
  wall.setUTCHours(Number(parts.hour), Number(parts.minute), Number(parts.second), 0);
  return Math.round((wall.getTime() - Math.floor(epochMs / 1000) * 1000) / 1000);
}

/**
 * Minutes east of UTC in force in `timeZone` at the local wall clock
 * `datetime` ("YYYY-MM-DDTHH:MM[:SS]"). A local mean time offset keeps its
 * seconds as a fraction (Colombo before 1906 is 319.53...). A skipped wall time
 * takes the offset after the change, and a repeated one takes the earlier
 * reading. Null when the zone or the datetime cannot be read.
 */
export function offsetMinutesAt(timeZone: string, datetime: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(datetime);
  if (!m || !isKnownTimeZone(timeZone)) return null;
  const wall = new Date(0);
  wall.setUTCFullYear(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  wall.setUTCHours(Number(m[4]), Number(m[5]), m[6] ? Number(m[6]) : 0, 0);
  const wallMs = wall.getTime();
  if (Number.isNaN(wallMs)) return null;
  const before = offsetSecondsAt(timeZone, wallMs - 86_400_000);
  const after = offsetSecondsAt(timeZone, wallMs + 86_400_000);
  const valid = [...new Set([before, after])].filter(
    (off) => offsetSecondsAt(timeZone, wallMs - off * 1000) === off,
  );
  const seconds = valid.length === 0 ? after : Math.max(...valid);
  return seconds / 60;
}

/** "+06:00" or "-04:00", rounded to the minute, for display. */
export function formatUtcOffset(minutes: number): string {
  const rounded = Math.round(minutes);
  const sign = rounded >= 0 ? "+" : "-";
  const abs = Math.abs(rounded);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}
