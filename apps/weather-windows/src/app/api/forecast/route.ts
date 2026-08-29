import { NextResponse, type NextRequest } from "next/server";
import {
  runLumin,
  logRun,
  parseJsonBlock,
  ensureShape,
  LuminClientError,
} from "@lumin-examples/client";
import { ALLOWED_TOOLS, buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import type { Channel, ForecastInput, ForecastResponse, WeatherWindow } from "@/lib/types";

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

function validateInput(body: unknown): ForecastInput | string {
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
  return {
    location_name: b.location_name.trim(),
    start_date: b.start_date,
    end_date: b.end_date,
  };
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
function validateShape(data: ForecastResponse): string | null {
  const loc = data.resolved_location;
  if (
    !loc ||
    typeof loc.latitude !== "number" ||
    typeof loc.longitude !== "number" ||
    typeof loc.utc_offset_minutes !== "number"
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

    const data = ensureShape(parseJsonBlock<ForecastResponse>(result.text), validateShape);
    return NextResponse.json(data);
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
