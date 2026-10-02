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
  ForecastModelResponse,
  ForecastResponse,
  ModelLocation,
  ResolvedForecastInput,
  ResolvedLocation,
  WeatherWindow,
} from "@/lib/types";

export const runtime = "nodejs";
/** The loading copy promises 40 to 90 seconds, so this has room above that. */
export const maxDuration = 120;

const ROUTE = "/api/forecast";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 220;
const CHANNEL_LEVELS = ["calm", "mild", "active", "intense"];
const RATINGS = ["favourable", "mixed", "unfavourable"];

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
  if (startOffset === null || endOffset === null) {
    return "the UTC offset for that range could not be read from time_zone";
  }
  return {
    location_name: b.location_name.trim(),
    start_date: b.start_date,
    end_date: b.end_date,
    time_zone: b.time_zone,
    utc_offset_minutes: Math.round(startOffset),
    utc_offset_minutes_at_end: Math.round(endOffset),
  };
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

function isChannel(value: unknown): value is Channel {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.level === "string" &&
    CHANNEL_LEVELS.includes(c.level) &&
    typeof c.band === "string" &&
    typeof c.score === "number" &&
    typeof c.note === "string"
  );
}

/** App-specific: the shape this app renders. Kept separate from the shared client. */
function validateShape(data: ForecastModelResponse): string | null {
  const loc = data.resolved_location;
  if (
    !loc ||
    typeof loc.latitude !== "number" ||
    typeof loc.longitude !== "number"
  ) {
    return "Response missing resolved_location";
  }
  if (!data.season || typeof data.season.season !== "string") {
    return "Response missing season";
  }
  if (!Array.isArray(data.windows) || data.windows.length === 0) {
    return "Response has no weather windows";
  }
  for (const w of data.windows as WeatherWindow[]) {
    if (typeof w.label !== "string" || typeof w.summary !== "string") {
      return "A window is missing label or summary";
    }
    if (!RATINGS.includes(w.outdoor_rating)) {
      return `Invalid outdoor_rating: ${w.outdoor_rating}`;
    }
    if (!isChannel(w.temperature) || !isChannel(w.precipitation) || !isChannel(w.wind)) {
      return `Window "${w.label}" has a malformed weather channel`;
    }
  }
  // current and monsoon are optional enrichments (get_astro_weather and
  // get_monsoon_forecast). Validate their channels only when present.
  if (data.current) {
    const c = data.current;
    if (!isChannel(c.temperature) || !isChannel(c.precipitation) || !isChannel(c.wind)) {
      return "current snapshot has a malformed weather channel";
    }
  }
  if (data.monsoon && !isChannel(data.monsoon.precipitation)) {
    return "monsoon outlook has a malformed precipitation channel";
  }
  if (typeof data.disclaimer !== "string" || !data.disclaimer.trim()) {
    return "Response missing the disclaimer";
  }
  return null;
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
      // A wide range can return up to about 15 windows across two paged
      // tools (get_weather_windows, get_seasonal_outlook), so this has real
      // headroom. We stream, so it costs nothing when the answer is shorter.
      maxTokens: 16000,
      effort: "xhigh",
      signal: req.signal,
    });

    logRun(ROUTE, result);

    const data = ensureShape(parseJsonBlock<ForecastModelResponse>(result.text), validateShape);
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
