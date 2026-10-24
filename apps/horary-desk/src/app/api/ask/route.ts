import { NextResponse, type NextRequest } from "next/server";
import {
  runLumin,
  logRun,
  parseJsonBlock,
  ensureShape,
  LuminClientError,
} from "@lumin-examples/client";
import {
  ALLOWED_TOOLS,
  buildSystemPrompt,
  buildUserPrompt,
  judgementLocal,
} from "@/lib/prompt";
import type { AskInput, HoraryResponse, QuestionType } from "@/lib/types";

export const runtime = "nodejs";
/** A lost question reads up to four step tools plus every recovery page, so
 * this has room well above the 20 to 90 seconds the loading copy promises. */
export const maxDuration = 300;

const ROUTE = "/api/ask";

const QUESTION_TYPE_VALUES: QuestionType[] = [
  "general",
  "medical",
  "career",
  "lost",
  "arrival",
];

function badRequest(message: string) {
  return NextResponse.json({ error: message, failure: "bad_request" }, { status: 400 });
}

/** Returns the parsed input, or a string naming what is wrong with it. */
function validateInput(body: unknown): AskInput | string {
  if (typeof body !== "object" || body === null) return "Body must be a JSON object";
  const b = body as Record<string, unknown>;

  if (typeof b.question !== "string" || !b.question.trim()) {
    return "question is required";
  }
  if (b.question.trim().length > 600) {
    return "question must be 600 characters or fewer";
  }

  if (
    typeof b.number !== "number" ||
    !Number.isInteger(b.number) ||
    b.number < 1 ||
    b.number > 249
  ) {
    return "number is required and must be an integer between 1 and 249";
  }

  let questionTypeHint: QuestionType | null = null;
  if (b.questionTypeHint !== undefined && b.questionTypeHint !== null) {
    if (
      typeof b.questionTypeHint !== "string" ||
      !QUESTION_TYPE_VALUES.includes(b.questionTypeHint as QuestionType)
    ) {
      return `questionTypeHint must be one of: ${QUESTION_TYPE_VALUES.join(", ")}`;
    }
    questionTypeHint = b.questionTypeHint as QuestionType;
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
    question: b.question.trim(),
    questionTypeHint,
    number: b.number,
    latitude: b.latitude,
    longitude: b.longitude,
    utcOffsetMinutes: Math.round(b.utcOffsetMinutes),
  };
}

const GATE_VERDICTS = new Set(["ANSWERED", "WITHHELD"]);
const CONFIDENCE_LEVELS = new Set(["high", "moderate", "low"]);
const TYPE_SPECIFIC_KINDS = new Set(["medical", "career", "lost", "arrival"]);
const LOST_QUERY_TYPES = new Set(["lost", "theft", "missing_person"]);

function validateShape(data: HoraryResponse): string | null {
  if (typeof data.question !== "string" || !data.question.trim()) {
    return "response is missing the question";
  }
  if (!QUESTION_TYPE_VALUES.includes(data.questionType)) {
    return `invalid questionType: ${data.questionType}`;
  }
  if (typeof data.number !== "number" || data.number < 1 || data.number > 249) {
    return "response is missing a valid number";
  }
  if (!data.moment || typeof data.moment.datetimeUTC !== "string") {
    return "response is missing the moment of judgment";
  }
  if (typeof data.event !== "string" || !data.event.trim()) {
    return "response is missing the catalog event it was checked against";
  }
  if (!data.gate || !GATE_VERDICTS.has(data.gate.verdict)) {
    return "response is missing a valid gate verdict";
  }
  if (typeof data.gate.reason !== "string" || !data.gate.reason.trim()) {
    return "response is missing the gate's reason";
  }

  // A withheld chart is a complete answer: no verdict, no timing windows.
  if (data.gate.verdict === "WITHHELD") {
    if (data.verdict !== null) {
      return "gate is WITHHELD but a verdict was still returned";
    }
  } else {
    if (!data.verdict || typeof data.verdict.label !== "string" || !data.verdict.label.trim()) {
      return "gate is ANSWERED but the verdict is missing";
    }
    if (!CONFIDENCE_LEVELS.has(data.verdict.confidence)) {
      return `invalid confidence: ${data.verdict.confidence}`;
    }
    if (
      !Array.isArray(data.verdict.requiredHouses) ||
      !Array.isArray(data.verdict.covered) ||
      !Array.isArray(data.verdict.missing)
    ) {
      return "verdict is missing its house arrays";
    }
  }

  // The number's stated methods and the two ruling-planet definitions are
  // side-by-side spreads: every entry needs its own system label, and the
  // shape has no field for a picked winner.
  if (!Array.isArray(data.numberMethods) || data.numberMethods.length === 0) {
    return "response is missing the number methods";
  }
  for (const m of data.numberMethods) {
    if (
      typeof m.id !== "string" ||
      typeof m.system !== "string" ||
      !m.system.trim() ||
      typeof m.source !== "string" ||
      typeof m.finding !== "string"
    ) {
      return "a number method is missing a field";
    }
  }
  if (
    !data.rulingPlanets ||
    !Array.isArray(data.rulingPlanets.variants) ||
    data.rulingPlanets.variants.length === 0 ||
    typeof data.rulingPlanets.difference !== "string"
  ) {
    return "response is missing the ruling planet variants";
  }
  for (const v of data.rulingPlanets.variants) {
    if (
      typeof v.id !== "string" ||
      typeof v.system !== "string" ||
      !v.system.trim() ||
      typeof v.source !== "string" ||
      typeof v.applied !== "boolean" ||
      !Array.isArray(v.planets)
    ) {
      return "a ruling planet variant is missing a field";
    }
  }

  if (!Array.isArray(data.reasoning) || data.reasoning.length === 0) {
    return "response has no reasoning steps";
  }
  for (const step of data.reasoning) {
    if (typeof step.step !== "string" || typeof step.rule !== "string" || typeof step.result !== "string") {
      return "a reasoning step is missing a field";
    }
  }

  if (!data.timing || !Array.isArray(data.timing.windows)) {
    return "response is missing timing.windows";
  }
  if (data.gate.verdict === "WITHHELD" && data.timing.windows.length > 0) {
    return "gate is WITHHELD but timing windows were still returned";
  }
  if (data.timing.windows.length > 12) {
    return "timing.windows carries more than the 12 the screen shows";
  }

  if (data.typeSpecific !== null) {
    if (!TYPE_SPECIFIC_KINDS.has(data.typeSpecific.kind)) {
      return `invalid typeSpecific.kind: ${(data.typeSpecific as { kind: string }).kind}`;
    }
    if (data.typeSpecific.kind !== data.questionType) {
      return "typeSpecific.kind does not match questionType";
    }
    if (data.typeSpecific.kind === "lost") {
      const lost = data.typeSpecific;
      if (!LOST_QUERY_TYPES.has(lost.queryType)) {
        return `invalid lost queryType: ${lost.queryType}`;
      }
      for (const f of ["direction", "distanceClass", "inHouseLocation", "recoveryVerdict", "recoveryRationale"] as const) {
        if (typeof lost[f] !== "string" || !lost[f].trim()) {
          return `lost reading is missing ${f}`;
        }
      }
      // The nature step runs for lost and theft, the thief step for theft and
      // a missing person. A field from a step that did not run must be null.
      if (lost.queryType === "missing_person" && lost.articleNature !== null) {
        return "articleNature must be null for a missing person";
      }
      if (lost.queryType === "lost" && lost.thiefDescription !== null) {
        return "thiefDescription must be null for a lost article";
      }
    }
  } else if (data.questionType !== "general") {
    return `typeSpecific is missing for a ${data.questionType} question`;
  }

  if (typeof data.disclaimer !== "string" || !data.disclaimer.trim()) {
    return "response is missing the disclaimer";
  }
  if (!data.disclaimer.startsWith("A reflective lens on a question asked at a moment, not advice.")) {
    return "disclaimer does not match the mandated text";
  }
  if (
    data.questionType === "medical" &&
    !data.disclaimer.includes("never be read as a reason to delay or avoid seeking medical care")
  ) {
    return "medical question is missing the required care-seeking sentence in the disclaimer";
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
      user: buildUserPrompt(input, judgementLocal(input.utcOffsetMinutes)),
      // 2 to 5 tool calls (more when recovery pages), a chart-sized payload
      // each, and two side-by-side spreads to copy out. Comfortable headroom.
      maxTokens: 24000,
      // A gate to reason through correctly, not just a lookup. xhigh is worth it.
      effort: "xhigh",
      signal: req.signal,
    });

    logRun(ROUTE, result);

    const data = ensureShape(
      parseJsonBlock<HoraryResponse>(result.text),
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
