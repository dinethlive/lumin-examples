import { NextResponse, type NextRequest } from "next/server";
import {
  runLumin,
  logRun,
  parseJsonBlock,
  ensureShape,
  LuminClientError,
} from "@lumin-examples/client";
import { ALLOWED_TOOLS, buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import type { MatchInput, MatchResponse, PersonInput } from "@/lib/types";

export const runtime = "nodejs";
/** The loading copy promises 50 to 150 seconds for an 11-call read, so this has room above that. */
export const maxDuration = 180;

const ROUTE = "/api/match";

function badRequest(message: string) {
  return NextResponse.json({ error: message, failure: "bad_request" }, { status: 400 });
}

const GENDERS = new Set(["female", "male", "other"]);

/** Returns the parsed person, or a string naming what is wrong with it. */
function validatePerson(label: string, body: unknown): PersonInput | string {
  if (typeof body !== "object" || body === null) return `${label} must be an object`;
  const b = body as Record<string, unknown>;

  if (typeof b.birth_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.birth_date)) {
    return `${label}: birth_date is required in YYYY-MM-DD form`;
  }
  if (typeof b.birth_time !== "string" || !/^\d{2}:\d{2}$/.test(b.birth_time)) {
    return `${label}: birth_time is required in HH:MM form`;
  }
  if (typeof b.birth_time_known !== "boolean") {
    return `${label}: birth_time_known is required`;
  }
  if (typeof b.location_name !== "string" || !b.location_name.trim()) {
    return `${label}: location_name is required, for example "Colombo, Sri Lanka"`;
  }
  // The offset feeds the Ascendant directly, so it is required rather than
  // resolved by the model. See PersonInput.utc_offset_minutes.
  if (
    typeof b.utc_offset_minutes !== "number" ||
    !Number.isFinite(b.utc_offset_minutes) ||
    b.utc_offset_minutes < -720 ||
    b.utc_offset_minutes > 840
  ) {
    return `${label}: utc_offset_minutes is required and must be between -720 and 840`;
  }
  const gender = typeof b.gender === "string" ? b.gender : "other";
  if (!GENDERS.has(gender)) return `${label}: gender must be female, male or other`;

  return {
    name: typeof b.name === "string" ? b.name.trim().slice(0, 80) : "",
    birth_date: b.birth_date,
    birth_time: b.birth_time_known ? b.birth_time : "12:00",
    birth_time_known: b.birth_time_known,
    location_name: b.location_name.trim().slice(0, 120),
    utc_offset_minutes: Math.round(b.utc_offset_minutes),
    gender: gender as PersonInput["gender"],
  };
}

function validateInput(body: unknown): MatchInput | string {
  if (typeof body !== "object" || body === null) return "Body must be a JSON object";
  const b = body as Record<string, unknown>;

  const personA = validatePerson("Person A", b.personA);
  if (typeof personA === "string") return personA;
  const personB = validatePerson("Person B", b.personB);
  if (typeof personB === "string") return personB;

  return { personA, personB };
}

const RECOMMENDATIONS = new Set(["STRONG", "WORKABLE", "REVIEW"]);
const AGREEMENTS = new Set(["HIGH", "MIXED", "LOW"]);
const CONFIDENCE_BANDS = new Set(["high", "moderate", "low"]);

function validateShape(data: MatchResponse): string | null {
  if (!data.headline || !RECOMMENDATIONS.has(data.headline.recommendation)) {
    return "response is missing a valid headline.recommendation";
  }
  if (!AGREEMENTS.has(data.headline.agreement)) {
    return "response is missing a valid headline.agreement";
  }
  // Never STRONG on LOW agreement. Enforced here, not just asked for in the
  // prompt: the whole point of this app is not to paper over a disagreement.
  if (data.headline.recommendation === "STRONG" && data.headline.agreement === "LOW") {
    return "headline is STRONG on LOW agreement, which the systems do not support";
  }

  const s = data.systems;
  if (!s?.ashtaKoota || !Array.isArray(s.ashtaKoota.kootas) || s.ashtaKoota.kootas.length !== 8) {
    return "systems.ashtaKoota must carry exactly 8 kootas";
  }
  if (!s.kpSevenFactor || !Array.isArray(s.kpSevenFactor.factors) || s.kpSevenFactor.factors.length !== 7) {
    return "systems.kpSevenFactor must carry exactly 7 factors";
  }
  if (!s.kpCuspal || !Array.isArray(s.kpCuspal.factors) || s.kpCuspal.factors.length !== 6) {
    return "systems.kpCuspal must carry exactly 6 factors";
  }

  if (!data.doshas?.manglik?.personA || !data.doshas?.manglik?.personB) {
    return "response is missing manglik status for both people";
  }
  if (!data.doshas?.kalsarpa?.personA || !data.doshas?.kalsarpa?.personB) {
    return "response is missing kalsarpa status for both people";
  }
  if (typeof data.doshas.kpDissent !== "string" || !data.doshas.kpDissent.trim()) {
    return "response is missing doshas.kpDissent";
  }

  if (!data.partnerProfile?.forPersonA || !data.partnerProfile?.forPersonB) {
    return "response is missing partnerProfile for both directions";
  }

  if (!Array.isArray(data.disagreements)) {
    return "response is missing disagreements (an empty array is valid)";
  }

  const conf = data.confidence;
  if (!conf?.personA || !CONFIDENCE_BANDS.has(conf.personA.band)) {
    return "response is missing confidence.personA";
  }
  if (!conf?.personB || !CONFIDENCE_BANDS.has(conf.personB.band)) {
    return "response is missing confidence.personB";
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
      // 11 tool calls across two charts, three scored systems, doshas, spouse
      // characteristics in both directions and a disagreement drawer. We
      // stream, so a large budget costs nothing when the answer is shorter.
      maxTokens: 24000,
      // A cross-system investigation, not a lookup. Agentic runs want xhigh.
      effort: "xhigh",
      signal: req.signal,
    });

    logRun(ROUTE, result);

    const data = ensureShape(
      parseJsonBlock<MatchResponse>(result.text),
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
