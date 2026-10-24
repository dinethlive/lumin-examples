import { NextResponse, type NextRequest } from "next/server";
import {
  runLumin,
  logRun,
  parseJsonBlock,
  ensureShape,
  LuminClientError,
  isKnownTimeZone,
  offsetMinutesAt,
} from "@lumin-examples/client";
import { ALLOWED_TOOLS, buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import type {
  Channel,
  CslFourth,
  ForecastModelResponse,
  ForecastResponse,
  ModelLocation,
  ResolvedForecastInput,
  ResolvedLocation,
  SaptaNadi,
  WeatherWindow,
} from "@/lib/types";

export const runtime = "nodejs";
/** Every window is one page and one call, so a wide range takes minutes. This has room for it. */
export const maxDuration = 300;

const ROUTE = "/api/forecast";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 220;

function badRequest(message: string) {
  return NextResponse.json({ error: message, failure: "bad_request" }, { status: 400 });
}

function validateInput(body: unknown): ResolvedForecastInput | string {
  if (typeof body !== "object" || body === null) {
    return "Body must be a JSON object";
  }
  const b = body as Record<string, unknown>;
  if (typeof b.location_name !== "string" || !b.location_name.trim()) {
    return 'location_name is required (e.g. "Colombo, Sri Lanka")';
  }
  if (typeof b.start_date !== "string" || !DATE_RE.test(b.start_date)) {
    return "start_date is required (YYYY-MM-DD)";
  }
  if (typeof b.end_date !== "string" || !DATE_RE.test(b.end_date)) {
    return "end_date is required (YYYY-MM-DD)";
  }
  const start = Date.parse(`${b.start_date}T00:00:00Z`);
  const end = Date.parse(`${b.end_date}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "start_date or end_date is not a valid calendar date";
  }
  if (end <= start) {
    return "end_date must be after start_date";
  }
  const days = (end - start) / 86_400_000;
  if (days > MAX_RANGE_DAYS) {
    return `Date range is too wide; keep it within ${MAX_RANGE_DAYS} days`;
  }
  if (typeof b.time_zone !== "string" || !isKnownTimeZone(b.time_zone)) {
    return 'time_zone is required, an IANA name such as "Asia/Colombo"';
  }
  // Every tool takes one offset, so it comes from the tz database for this
  // zone at the range start, never from a guess. The end offset is kept so the
  // page can say when clocks change inside the range.
  const startOffset = offsetMinutesAt(b.time_zone, noonOf(b.start_date));
  const endOffset = offsetMinutesAt(b.time_zone, noonOf(b.end_date));
  // The present-moment read (get_astro_weather) is cast for now on the
  // place's clock, with the offset in force now, both read here rather than
  // left to the tool's own default.
  const nowLocal = wallClockNow(b.time_zone);
  const nowOffset = offsetMinutesAt(b.time_zone, nowLocal);
  if (startOffset === null || endOffset === null || nowOffset === null) {
    return "the UTC offset for that range could not be read from time_zone";
  }
  return {
    location_name: b.location_name.trim(),
    start_date: b.start_date,
    end_date: b.end_date,
    time_zone: b.time_zone,
    utc_offset_minutes: Math.round(startOffset),
    utc_offset_minutes_at_end: Math.round(endOffset),
    now_local: nowLocal,
    now_utc_offset_minutes: Math.round(nowOffset),
  };
}

/** The wall clock in the zone right now, as YYYY-MM-DDTHH:MM:SS. */
function wallClockNow(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}

/** Noon on the date. A daylight saving change happens in the small hours, so noon is clear of it. */
function noonOf(date: string): string {
  return `${date}T12:00:00`;
}

/**
 * The place the page shows, on the clock the form chose. When the place's own
 * zone runs a different offset at the range start, the window times are on the
 * wrong clock, so the response says which zone to use. Offsets are compared,
 * not names, so an alias such as Asia/Calcutta for Asia/Kolkata is no mismatch.
 */
function locationFor(model: ModelLocation, input: ResolvedForecastInput): ResolvedLocation {
  const location: ResolvedLocation = {
    latitude: model.latitude,
    longitude: model.longitude,
    time_zone: input.time_zone,
    utc_offset_minutes: input.utc_offset_minutes,
    label: model.label,
    note: model.note,
  };
  if (input.utc_offset_minutes_at_end !== input.utc_offset_minutes) {
    location.utc_offset_minutes_at_end = input.utc_offset_minutes_at_end;
  }
  const placeOffset =
    typeof model.place_time_zone === "string"
      ? offsetMinutesAt(model.place_time_zone, noonOf(input.start_date))
      : null;
  if (placeOffset !== null && Math.round(placeOffset) !== input.utc_offset_minutes) {
    location.zone_mismatch = {
      place_time_zone: model.place_time_zone,
      place_offset_minutes: Math.round(placeOffset),
    };
  }
  return location;
}

const BANDS = ["VERY_LOW", "LOW", "MODERATE", "HIGH", "VERY_HIGH"];
const DISPOSITIONS = ["WET", "DRY", "HOT", "STORMY", "MIXED", "SETTLED"];
const VERDICTS = ["RAIN", "HEAT", "DRY", "MIXED", "INDETERMINATE"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** A channel as the tool returned it: its band, its raw score, its signal line. */
function isChannel(value: unknown): value is Channel {
  if (!isRecord(value)) return false;
  return (
    typeof value.band === "string" &&
    BANDS.includes(value.band) &&
    typeof value.score === "number" &&
    typeof value.signal === "string" &&
    Array.isArray(value.signatures)
  );
}

function isCsl(value: unknown): value is CslFourth {
  if (!isRecord(value)) return false;
  return (
    typeof value.sub_lord === "string" &&
    typeof value.star_lord === "string" &&
    Array.isArray(value.signified_houses) &&
    typeof value.verdict === "string" &&
    VERDICTS.includes(value.verdict) &&
    typeof value.reasoning === "string"
  );
}

function isSaptaNadi(value: unknown): value is SaptaNadi {
  if (!isRecord(value)) return false;
  return (
    typeof value.moon_nadi === "string" &&
    typeof value.precipitation_score === "number" &&
    typeof value.precipitation_band === "string" &&
    typeof value.storm_flag === "boolean" &&
    typeof value.drought_flag === "boolean" &&
    typeof value.rain_duration === "string" &&
    isRecord(value.group_counts)
  );
}

function isDisposition(value: unknown): boolean {
  return typeof value === "string" && DISPOSITIONS.includes(value);
}

/** App-specific: the shape this app renders. Kept separate from the shared client. */
function validateShape(data: ForecastModelResponse): string | null {
  const loc = data.resolved_location;
  if (!loc || typeof loc.latitude !== "number" || typeof loc.longitude !== "number") {
    return "Response missing resolved_location";
  }
  if (!data.season || typeof data.season.season !== "string" || !isCsl(data.season.csl)) {
    return "Response missing the season's 4th-cusp verdict";
  }
  if (!Array.isArray(data.windows) || data.windows.length === 0) {
    return "Response has no weather windows";
  }
  for (const w of data.windows as WeatherWindow[]) {
    if (typeof w.label !== "string" || typeof w.summary !== "string") {
      return "A window is missing label or summary";
    }
    if (!isDisposition(w.disposition)) {
      return `Window "${w.label}" has an unknown disposition: ${w.disposition}`;
    }
    if (!isChannel(w.temperature) || !isChannel(w.precipitation) || !isChannel(w.wind)) {
      return `Window "${w.label}" has a malformed weather channel`;
    }
    if (!isCsl(w.csl)) return `Window "${w.label}" has a malformed 4th-cusp verdict`;
    if (!isSaptaNadi(w.sapta_nadi)) return `Window "${w.label}" has a malformed Sapta Nadi block`;
  }
  // current and monsoon are optional enrichments (get_astro_weather and
  // get_monsoon_forecast). Validate them only when present.
  if (data.current) {
    const c = data.current;
    if (!isChannel(c.temperature) || !isChannel(c.precipitation) || !isChannel(c.wind)) {
      return "current snapshot has a malformed weather channel";
    }
    if (typeof c.datetime !== "string" || !DATE_RE.test(c.datetime)) {
      return "current snapshot is missing its date";
    }
    if (!isCsl(c.csl) || !isDisposition(c.disposition)) {
      return "current snapshot has a malformed verdict or disposition";
    }
  }
  if (data.monsoon) {
    const m = data.monsoon;
    if (!isChannel(m.precipitation) || !isCsl(m.csl) || !BANDS.includes(m.rainfall_favourability)) {
      return "monsoon outlook is malformed";
    }
  }
  if (typeof data.disclaimer !== "string" || !data.disclaimer.trim()) {
    return "Response missing the disclaimer";
  }
  if (typeof data.tool_disclaimer !== "string" || !data.tool_disclaimer.trim()) {
    return "Response missing the tools' own disclaimer";
  }
  return null;
}

/**
 * Tool text is relayed word for word, and some of it carries em dashes. The
 * page uses none, so each one becomes a comma here, the only change made.
 */
const EM_DASH = new RegExp(`\\s*${String.fromCharCode(0x2014)}\\s*`, "g");

function withoutEmDashes<T>(value: T): T {
  if (typeof value === "string") {
    return value.replace(EM_DASH, ", ") as T;
  }
  if (Array.isArray(value)) return value.map(withoutEmDashes) as T;
  if (isRecord(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = withoutEmDashes(v);
    return out as T;
  }
  return value;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const input = validateInput(body);
  if (typeof input === "string") return badRequest(input);

  try {
    const result = await runLumin({
      allowedTools: ALLOWED_TOOLS,
      system: buildSystemPrompt(),
      user: buildUserPrompt(input),
      // A wide range can return about 15 windows, often one per page, and
      // each window carries three blocks, so this has real headroom. We stream, so it costs nothing when the answer is shorter.
      maxTokens: 32000,
      effort: "xhigh",
      signal: req.signal,
    });

    logRun(ROUTE, result);

    const data = withoutEmDashes(
      ensureShape(parseJsonBlock<ForecastModelResponse>(result.text), validateShape),
    );
    const response: ForecastResponse = {
      ...data,
      resolved_location: locationFor(data.resolved_location, input),
    };
    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof LuminClientError) {
      console.error(
        JSON.stringify({ route: ROUTE, failure: err.failure, detail: err.message }),
      );
      return NextResponse.json(err.toBody(), { status: err.status });
    }
    throw err;
  }
}
