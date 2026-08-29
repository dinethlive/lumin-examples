import { NextResponse, type NextRequest } from "next/server";
import {
  runLumin,
  logRun,
  parseJsonBlock,
  ensureShape,
  LuminClientError,
} from "@lumin-examples/client";
import {
  ALLOWED_TOOLS_ELECT,
  buildElectSystemPrompt,
  buildElectUserPrompt,
} from "@/lib/prompt";
import type { ElectInput, ElectModelOutput, ElectResponse } from "@/lib/types";

export const runtime = "nodejs";
/**
 * Up to five tool calls (one election tool, get_muhurta_advanced, get_panchang,
 * get_choghadiya_today, get_boundary_warnings), one of them a real scan over a
 * date range. Slower than a plain lookup; the loading copy says 20 to 70
 * seconds, so this sits comfortably above that.
 */
export const maxDuration = 120;

const ROUTE = "/api/elect";

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

/** Returns the parsed input, or a string naming what is wrong with it. */
function validateInput(body: unknown): ElectInput | string {
  if (typeof body !== "object" || body === null) return "Body must be a JSON object";
  const b = body as Record<string, unknown>;

  if (!isNonEmptyString(b.eventKey)) return "eventKey is required";
  if (!isNonEmptyString(b.eventLabel)) return "eventLabel is required";
  if (!Array.isArray(b.eventElectedHouses) || b.eventElectedHouses.length === 0) {
    return "eventElectedHouses is required";
  }
  if (!Array.isArray(b.eventExcludedHouses)) return "eventExcludedHouses is required";
  if (typeof b.eventProvenance !== "string" || !PROVENANCES.has(b.eventProvenance)) {
    return "eventProvenance must be one of the four allowed values";
  }
  const eventCitation = typeof b.eventCitation === "string" ? b.eventCitation : null;
  if (typeof b.eventDefaultGranularity !== "string" || !GRANULARITIES.has(b.eventDefaultGranularity)) {
    return "eventDefaultGranularity must be day, hour or minute";
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.scanStart))) {
    return "scanStart is required (YYYY-MM-DD)";
  }
  const scanDays = Number(b.scanDays);
  if (!Number.isFinite(scanDays) || scanDays < 1 || scanDays > 365) {
    return "scanDays must be between 1 and 365";
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
    eventExcludedHouses: (b.eventExcludedHouses as unknown[]).map(Number),
    eventProvenance: b.eventProvenance as ElectInput["eventProvenance"],
    eventCitation,
    eventDefaultGranularity: b.eventDefaultGranularity as ElectInput["eventDefaultGranularity"],
    birth: {
      name: typeof birth.name === "string" ? birth.name.trim().slice(0, 80) : "",
      birthDate: birth.birthDate as string,
      birthTime: birth.birthTime as string,
      birthTimeKnown: birth.birthTimeKnown as boolean,
      birthLocation: (birth.birthLocation as string).trim().slice(0, 120),
    },
    eventLocation: (b.eventLocation as string).trim().slice(0, 120),
    scanStart: b.scanStart as string,
    scanDays: Math.round(scanDays),
    granularity: b.granularity as ElectInput["granularity"],
    preferredHours: {
      start: hours.start as string,
      end: hours.end as string,
      label: typeof hours.label === "string" ? hours.label.trim().slice(0, 60) : "",
    },
  };
}

function validateModelShape(data: ElectModelOutput): string | null {
  if (!Array.isArray(data.moments)) return "response has no moments array";
  if (data.moments.length > 3) return "more than three moments returned, expected at most a tie";
  for (const m of data.moments) {
    if (typeof m.startLocal !== "string" || typeof m.endLocal !== "string") {
      return "a moment is missing startLocal or endLocal";
    }
    if (!VERDICTS.has(m.verdict)) return `invalid verdict: ${m.verdict}`;
    if (![1, 2, 3, 4].includes(m.layersSatisfied)) {
      return `invalid layersSatisfied: ${m.layersSatisfied}`;
    }
  }
  if (typeof data.tie !== "boolean") return "response is missing tie";
  if (data.tie !== data.moments.length > 1) {
    return "tie does not match moments.length > 1";
  }
  if (!data.confidence || !BANDS.has(data.confidence.band)) {
    return "response is missing a valid confidence.band";
  }
  if (!Array.isArray(data.confidence.flags)) return "confidence.flags must be an array";
  for (const f of data.confidence.flags) {
    if (f.severity !== "CRITICAL" && f.severity !== "CAUTION") {
      return `confidence flag carries an invalid severity: ${f.severity}`;
    }
  }
  if (!data.dayContext) return "response is missing dayContext";
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
      allowedTools: ALLOWED_TOOLS_ELECT,
      system: buildElectSystemPrompt(),
      user: buildElectUserPrompt(input),
      // Up to five tool results, several of them with per-window reasoning
      // blocks. Comfortable headroom; costs nothing shorter because we stream.
      maxTokens: 16000,
      // Agentic, sequential (day context depends on the election result first).
      effort: "xhigh",
      signal: req.signal,
    });

    logRun(ROUTE, result);

    const modelData = ensureShape(
      parseJsonBlock<ElectModelOutput>(result.text),
      validateModelShape,
    );

    const data: ElectResponse = {
      event: {
        key: input.eventKey,
        label: input.eventLabel,
        electedHouses: input.eventElectedHouses,
        excludedHouses: input.eventExcludedHouses,
        provenance: input.eventProvenance,
        citation: input.eventCitation,
        defaultGranularity: input.eventDefaultGranularity,
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
