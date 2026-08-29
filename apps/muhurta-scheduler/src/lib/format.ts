/**
 * Every timestamp this app renders is already local wall-clock time, in the
 * "startLocal" / "endLocal" / "dateLocal" fields the tools return, per the
 * KP protocol note to report windows in local time, never UTC. So these
 * formatters parse the string's own digits rather than handing it to
 * `new Date()`, which would read it as the BROWSER's local time and shift it
 * by whatever offset separates the visitor from the event.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parts(iso: string): { y: number; mo: number; d: number; h: number; mi: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(iso);
  if (!m) return null;
  return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]), h: Number(m[4]), mi: Number(m[5]) };
}

/** "Wed, 12 Aug 2026, 14:05" */
export function formatLocalDateTime(iso: string): string {
  const p = parts(iso);
  if (!p) return iso;
  // Date.UTC is used only to derive the weekday from the same calendar
  // numbers; nothing here is actually converted across a timezone.
  const wd = new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay();
  return `${WEEKDAYS[wd]}, ${p.d} ${MONTHS[p.mo - 1]} ${p.y}, ${pad(p.h)}:${pad(p.mi)}`;
}

/** "14:05" */
export function formatLocalTime(iso: string): string {
  const p = parts(iso);
  return p ? `${pad(p.h)}:${pad(p.mi)}` : iso;
}

/** "Wed, 12 Aug 2026" */
export function formatLocalDate(iso: string): string {
  const p = parts(iso) ?? dateOnly(iso);
  if (!p) return iso;
  const wd = new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay();
  return `${WEEKDAYS[wd]}, ${p.d} ${MONTHS[p.mo - 1]} ${p.y}`;
}

function dateOnly(iso: string): { y: number; mo: number; d: number; h: number; mi: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]), h: 0, mi: 0 };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
