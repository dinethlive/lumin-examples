import { NextResponse, type NextRequest } from "next/server";
import {
  runLumin,
  logRun,
  parseJsonBlock,
  ensureShape,
  LuminClientError,
} from "@lumin-examples/client";
import { ALLOWED_TOOLS_RANK, buildRankSystemPrompt, buildRankUserPrompt } from "@/lib/prompt";
import type { RankInput, RankModelOutput, RankResponse } from "@/lib/types";

export const runtime = "nodejs";
/** Two tool calls, one of them a scan across up to 10 dates. */
export const maxDuration = 90;

const ROUTE = "/api/rank";

const PROVENANCES = new Set([
  "BOOK_SOURCED",
  "WEB_SOURCED",
  "DERIVED_TABLE_D",
  "DERIVED_CUSP_RULE",
]);
const GRANULARITIES = new Set(["day", "hour", "minute"]);
const VERDICTS = new Set(["FOUR_LAYER", "THREE_LAYER", "TWO_LAYER", "PERIOD_ONLY"]);
const BANDS = new Set(["stable", "watch", "sensitive"]);

function badRequest(message: string) {
  return NextResponse.json({ error: message, failure: "bad_request" }, { status: 400 });
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function validateInput(body: unknown): RankInput | string {
  if (typeof body !== "object" || body === null) return "Body must be a JSON object";
  const b = body as Record<string, unknown>;

  if (!isNonEmptyString(b.eventKey)) return "eventKey is required";
  if (!isNonEmptyString(b.eventLabel)) return "eventLabel is required";
  if (!Array.isArray(b.eventElectedHouses) || b.eventElectedHouses.length === 0) {
    return "eventElectedHouses is required";
  }
  if (typeof b.eventProvenance !== "string" || !PROVENANCES.has(b.eventProvenance)) {
    return "eventProvenance must be one of the four allowed values";
  }

  const birth = b.birth as Record<string, unknown> | undefined;
  if (!birth || typeof birth !== "object") return "birth is required";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(birth.birthDate))) {
    return "birth.birthDate is required (YYYY-MM-DD)";
  }
  if (!/^\d{2}:\d{2}$/.test(String(birth.birthTime))) {
    return "birth.birthTime is required (HH:MM)";
  }
  if (typeof birth.birthTimeKnown !== "boolean") {
    return "birth.birthTimeKnown is required (boolean)";
  }
  if (!isNonEmptyString(birth.birthLocation)) {
    return "birth.birthLocation is required, for example \"Colombo, Sri Lanka\"";
  }

  if (typeof b.eventLocation !== "string") return "eventLocation is required (may be empty)";

  const dates = b.candidateDates;
  if (!Array.isArray(dates) || dates.length < 2 || dates.length > 10) {
    return "candidateDates must have between 2 and 10 entries";
  }
  for (const d of dates) {
    if (typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(d)) {
      return `invalid candidate date: ${String(d)}`;
    }
  }

  if (typeof b.granularity !== "string" || !GRANULARITIES.has(b.granularity)) {
    return "granularity must be day, hour or minute";
  }

  const hours = b.preferredHours as Record<string, unknown> | undefined;
  if (!hours || typeof hours !== "object") return "preferredHours is required";
  if (!/^\d{2}:\d{2}$/.test(String(hours.start)) || !/^\d{2}:\d{2}$/.test(String(hours.end))) {
    return "preferredHours.start and preferredHours.end are required (HH:MM)";
  }

  return {
    eventKey: (b.eventKey as string).trim(),
    eventLabel: (b.eventLabel as string).trim(),
    eventElectedHouses: (b.eventElectedHouses as unknown[]).map(Number),
    eventProvenance: b.eventProvenance as RankInput["eventProvenance"],
    birth: {
      name: typeof birth.name === "string" ? birth.name.trim().slice(0, 80) : "",
      birthDate: birth.birthDate as string,
      birthTime: birth.birthTime as string,
      birthTimeKnown: birth.birthTimeKnown as boolean,
      birthLocation: (birth.birthLocation as string).trim().slice(0, 120),
    },
    eventLocation: (b.eventLocation as string).trim().slice(0, 120),
    candidateDates: dates as string[],
    granularity: b.granularity as RankInput["granularity"],
    preferredHours: {
      start: hours.start as string,
      end: hours.end as string,
      label: typeof hours.label === "string" ? hours.label.trim().slice(0, 60) : "",
    },
  };
}

function validateModelShape(data: RankModelOutput, expectedCount: number): string | null {
  if (!Array.isArray(data.rankedDates) || data.rankedDates.length !== expectedCount) {
    return `expected ${expectedCount} ranked dates, got ${data.rankedDates?.length ?? 0}`;
  }
  for (const r of data.rankedDates) {
    if (!VERDICTS.has(r.verdict)) return `invalid verdict: ${r.verdict}`;
    if (![1, 2, 3, 4].includes(r.layersSatisfied)) {
      return `invalid layersSatisfied: ${r.layersSatisfied}`;
    }
    if (typeof r.rank !== "number" || r.rank < 1) return "a ranked date has an invalid rank";
  }
  if (!data.confidence || !BANDS.has(data.confidence.band)) {
    return "response is missing a valid confidence.band";
  }
  if (!Array.isArray(data.confidence.flags)) return "confidence.flags must be an array";
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
      allowedTools: ALLOWED_TOOLS_RANK,
      system: buildRankSystemPrompt(),
      user: buildRankUserPrompt(input),
      maxTokens: 12000,
      effort: "xhigh",
      signal: req.signal,
    });

    logRun(ROUTE, result);

    const modelData = ensureShape(
      parseJsonBlock<RankModelOutput>(result.text),
      (data) => validateModelShape(data, input.candidateDates.length),
    );

    const data: RankResponse = {
      event: {
        key: input.eventKey,
        label: input.eventLabel,
        electedHouses: input.eventElectedHouses,
        provenance: input.eventProvenance,
      },
      ...modelData,
    };

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
