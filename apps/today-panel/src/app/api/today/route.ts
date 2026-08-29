import { NextResponse, type NextRequest } from "next/server";
import {
  runLumin,
  logRun,
  parseJsonBlock,
  ensureShape,
  LuminClientError,
} from "@lumin-examples/client";
import { ALLOWED_TOOLS, buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import type { PlaceInput, TodayResponse } from "@/lib/types";

export const runtime = "nodejs";
/** The loading copy promises 15 to 40 seconds, so this has room above that. */
export const maxDuration = 90;

const ROUTE = "/api/today";

function badRequest(message: string) {
  return NextResponse.json({ error: message, failure: "bad_request" }, { status: 400 });
}

/** Returns the parsed input, or a string naming what is wrong with it. */
function validateInput(body: unknown): PlaceInput | string {
  if (typeof body !== "object" || body === null) return "Body must be a JSON object";
  const b = body as Record<string, unknown>;

  if (typeof b.city !== "string" || !b.city.trim()) {
    return "city is required, for example \"Colombo, Sri Lanka\"";
  }
  if (typeof b.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) {
    return "date is required in YYYY-MM-DD form";
  }
  // The offset decides which civil day the sunrise-to-sunrise day belongs to,
  // so it is required rather than inferred.
  if (
    typeof b.utcOffsetMinutes !== "number" ||
    !Number.isFinite(b.utcOffsetMinutes) ||
    b.utcOffsetMinutes < -720 ||
    b.utcOffsetMinutes > 840
  ) {
    return "utcOffsetMinutes is required and must be between -720 and 840";
  }

  return {
    city: b.city.trim().slice(0, 120),
    date: b.date,
    utcOffsetMinutes: Math.round(b.utcOffsetMinutes),
  };
}

const QUALITIES = new Set(["auspicious", "neutral", "inauspicious"]);

function validateShape(data: TodayResponse): string | null {
  if (!data.place || typeof data.place.latitude !== "number") {
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
      parseJsonBlock<TodayResponse>(result.text),
      validateShape,
    );
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
