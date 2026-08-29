import { NextResponse, type NextRequest } from "next/server";
import {
  runLumin,
  logRun,
  parseJsonBlock,
  ensureShape,
  LuminClientError,
} from "@lumin-examples/client";
import {
  TREND_ALLOWED_TOOLS,
  buildTrendSystemPrompt,
  buildTrendUserPrompt,
} from "@/lib/prompt";
import type { TrendInput, TrendResponse } from "@/lib/types";

export const runtime = "nodejs";
/** One tool call. The loading copy promises 10 to 25 seconds. */
export const maxDuration = 45;

const ROUTE = "/api/trend";

function badRequest(message: string) {
  return NextResponse.json({ error: message, failure: "bad_request" }, { status: 400 });
}

function validateInput(body: unknown): TrendInput | string {
  if (typeof body !== "object" || body === null) return "Body must be a JSON object";
  const b = body as Record<string, unknown>;

  if (typeof b.topic !== "string" || !b.topic.trim()) {
    return "topic is required";
  }
  if (!Array.isArray(b.sessions) || b.sessions.length < 2) {
    return "sessions is required with at least 2 entries";
  }
  const sessions = [];
  for (const raw of b.sessions) {
    if (typeof raw !== "object" || raw === null) return "each session must be an object";
    const s = raw as Record<string, unknown>;
    if (typeof s.question !== "string" || !s.question.trim()) {
      return "each session needs a question";
    }
    if (typeof s.number !== "number" || !Number.isInteger(s.number) || s.number < 1 || s.number > 249) {
      return "each session needs a number between 1 and 249";
    }
    if (typeof s.datetimeUTC !== "string" || !s.datetimeUTC.trim()) {
      return "each session needs a datetimeUTC";
    }
    sessions.push({
      question: s.question.trim(),
      number: s.number,
      datetimeUTC: s.datetimeUTC,
    });
  }

  if (typeof b.latitude !== "number" || b.latitude < -90 || b.latitude > 90) {
    return "latitude is required and must be between -90 and 90";
  }
  if (typeof b.longitude !== "number" || b.longitude < -180 || b.longitude > 180) {
    return "longitude is required and must be between -180 and 180";
  }
  if (
    typeof b.utcOffsetMinutes !== "number" ||
    !Number.isFinite(b.utcOffsetMinutes) ||
    b.utcOffsetMinutes < -720 ||
    b.utcOffsetMinutes > 840
  ) {
    return "utcOffsetMinutes is required and must be between -720 and 840";
  }

  return {
    topic: b.topic.trim(),
    sessions,
    latitude: b.latitude,
    longitude: b.longitude,
    utcOffsetMinutes: Math.round(b.utcOffsetMinutes),
  };
}

const DELTAS = new Set(["IMPROVED", "WORSENED", "SAME", null]);

function validateShape(data: TrendResponse): string | null {
  if (typeof data.topic !== "string" || !data.topic.trim()) {
    return "response is missing the topic";
  }
  if (!Array.isArray(data.snapshots) || data.snapshots.length < 2) {
    return "response needs at least 2 snapshots";
  }
  for (const snap of data.snapshots) {
    if (typeof snap.verdict !== "string" || !snap.verdict.trim()) {
      return "a snapshot is missing its verdict";
    }
    if (typeof snap.coveragePercent !== "number" || snap.coveragePercent < 0 || snap.coveragePercent > 100) {
      return "a snapshot has an invalid coveragePercent";
    }
    if (!DELTAS.has(snap.deltaFromPrevious)) {
      return `invalid deltaFromPrevious: ${snap.deltaFromPrevious}`;
    }
  }
  if (data.snapshots[0]?.deltaFromPrevious !== null) {
    return "the first snapshot must have a null deltaFromPrevious";
  }
  if (typeof data.trend !== "string" || !data.trend.trim()) {
    return "response is missing the trend";
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
      allowedTools: TREND_ALLOWED_TOOLS,
      system: buildTrendSystemPrompt(),
      user: buildTrendUserPrompt(input),
      maxTokens: 8000,
      effort: "high",
      signal: req.signal,
    });

    logRun(ROUTE, result);

    const data = ensureShape(
      parseJsonBlock<TrendResponse>(result.text),
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
