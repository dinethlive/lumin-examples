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
  ModelPlace,
  ResolvedPlace,
  ResolvedPlaceInput,
  TodayModelResponse,
  TodayResponse,
} from "@/lib/types";

export const runtime = "nodejs";
/** The loading copy promises 15 to 40 seconds, so this has room above that. */
export const maxDuration = 90;

const ROUTE = "/api/today";

function badRequest(message: string) {
  return NextResponse.json({ error: message, failure: "bad_request" }, { status: 400 });
}

/** Returns the parsed input, or a string naming what is wrong with it. */
function validateInput(body: unknown): ResolvedPlaceInput | string {
  if (typeof body !== "object" || body === null) return "Body must be a JSON object";
  const b = body as Record<string, unknown>;

  if (typeof b.city !== "string" || !b.city.trim()) {
    return "city is required, for example \"Colombo, Sri Lanka\"";
  }
  if (typeof b.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) {
    return "date is required in YYYY-MM-DD form";
  }
  if (typeof b.timeZone !== "string" || !isKnownTimeZone(b.timeZone)) {
    return 'timeZone is required, an IANA name such as "Asia/Colombo"';
  }
  // The offset decides which civil day the sunrise-to-sunrise day belongs to.
  // It comes from the tz database for this zone and date, never from a guess.
  const offset = offsetMinutesAt(b.timeZone, noonOf(b.date));
  if (offset === null) return "the UTC offset for that date could not be read from timeZone";

  return {
    city: b.city.trim().slice(0, 120),
    date: b.date,
    timeZone: b.timeZone,
    utcOffsetMinutes: Math.round(offset),
  };
}

/** Noon on the date. A daylight saving change happens in the small hours, so noon is clear of it. */
function noonOf(date: string): string {
  return `${date}T12:00:00`;
}

/**
 * The place the panel shows, on the clock the form chose. When the city's own
 * zone runs a different offset that day, every time on the panel is on the
 * wrong clock, so the response says which zone to use. Offsets are compared,
 * not names, so an alias such as Asia/Calcutta for Asia/Kolkata is no mismatch.
 */
function placeFor(model: ModelPlace, input: ResolvedPlaceInput): ResolvedPlace {
  const place: ResolvedPlace = {
    label: model.label,
    latitude: model.latitude,
    longitude: model.longitude,
    timeZone: input.timeZone,
    utcOffsetMinutes: input.utcOffsetMinutes,
  };
  const cityOffset =
    typeof model.cityTimeZone === "string"
      ? offsetMinutesAt(model.cityTimeZone, noonOf(input.date))
      : null;
  if (cityOffset !== null && Math.round(cityOffset) !== input.utcOffsetMinutes) {
    place.zoneMismatch = {
      cityTimeZone: model.cityTimeZone,
      cityOffsetMinutes: Math.round(cityOffset),
    };
  }
  return place;
}

const QUALITIES = new Set(["auspicious", "neutral", "inauspicious"]);

function validateShape(data: TodayModelResponse): string | null {
  if (
    !data.place ||
    typeof data.place.latitude !== "number" ||
    typeof data.place.longitude !== "number"
  ) {
    return "response is missing a resolved place";
  }
  if (!data.panchang || typeof data.panchang.tithi !== "string") {
    return "response is missing panchang";
  }
  if (!Array.isArray(data.choghadiya) || data.choghadiya.length === 0) {
    return "response has no choghadiya periods";
  }
  if (!Array.isArray(data.hora) || data.hora.length === 0) {
    return "response has no hora hours";
  }
  for (const band of [...data.choghadiya, ...data.hora]) {
    if (!QUALITIES.has(band.quality)) return `invalid quality: ${band.quality}`;
    if (typeof band.startUTC !== "string" || typeof band.endUTC !== "string") {
      return "a band is missing its start or end time";
    }
  }
  // Exactly one "now" per track, or none. Two would render two highlights.
  if (data.choghadiya.filter((p) => p.isCurrent).length > 1) {
    return "more than one choghadiya period marked current";
  }
  if (data.hora.filter((h) => h.isCurrent).length > 1) {
    return "more than one hora hour marked current";
  }
  if (!data.moon || typeof data.moon.subLord !== "string") {
    return "response is missing the moon position";
  }
  if (typeof data.disclaimer !== "string" || !data.disclaimer.trim()) {
    return "response is missing the disclaimer";
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
      // Five tool calls plus a 16-period and 24-hour payload. Comfortable, and
      // it costs nothing when the answer is shorter, because we stream.
      maxTokens: 16000,
      // This is a lookup, not an investigation. High is enough and it is faster.
      effort: "high",
      signal: req.signal,
    });

    logRun(ROUTE, result);

    const data = ensureShape(
      parseJsonBlock<TodayModelResponse>(result.text),
      validateShape,
    );
    const response: TodayResponse = { ...data, place: placeFor(data.place, input) };
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
