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
import type { MatchResponse, PersonInput, ResolvedMatch, ResolvedPerson } from "@/lib/types";

export const runtime = "nodejs";
/** The loading copy promises 90 to 240 seconds for a 15-call read, so this has room above that. */
export const maxDuration = 300;

const ROUTE = "/api/match";

function badRequest(message: string) {
  return NextResponse.json({ error: message, failure: "bad_request" }, { status: 400 });
}

const GENDERS = new Set(["female", "male", "other"]);

/** Returns the parsed person, or a string naming what is wrong with it. */
function validatePerson(label: string, body: unknown): ResolvedPerson | string {
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
  if (typeof b.time_zone !== "string" || !isKnownTimeZone(b.time_zone)) {
    return `${label}: time_zone is required, an IANA name such as "Asia/Colombo"`;
  }
  const gender = typeof b.gender === "string" ? b.gender : "other";
  if (!GENDERS.has(gender)) return `${label}: gender must be female, male or other`;

  // The offset at birth feeds the Ascendant directly, so it comes from the tz
  // database for this person's zone and birth moment, never from a guess. The
  // nested partner and person2 objects take a number, so the route computes it.
  const birthTime = b.birth_time_known ? b.birth_time : "12:00";
  const offset = offsetMinutesAt(b.time_zone, `${b.birth_date}T${birthTime}:00`);
  if (offset === null) return `${label}: the UTC offset at birth could not be read from time_zone`;

  return {
    name: typeof b.name === "string" ? b.name.trim().slice(0, 80) : "",
    birth_date: b.birth_date,
    birth_time: birthTime,
    birth_time_known: b.birth_time_known,
    location_name: b.location_name.trim().slice(0, 120),
    time_zone: b.time_zone,
    utc_offset_minutes: Math.round(offset * 100) / 100,
    gender: gender as PersonInput["gender"],
  };
}

function validateInput(body: unknown): ResolvedMatch | string {
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
  if (s.ashtaKoota.groom !== "personA" && s.ashtaKoota.groom !== "personB") {
    return "systems.ashtaKoota.groom must name whose chart was scored as the groom";
  }
  if (!s.kpCuspal || !Array.isArray(s.kpCuspal.factors) || s.kpCuspal.factors.length !== 6) {
    return "systems.kpCuspal must carry exactly 6 factors";
  }
  // Five promise rows from get_couple_csl_factors, then the DASHA_SYNC row from
  // get_couple_dasha_sync. Anything else means a step tool was skipped.
  const sources = s.kpCuspal.factors.map((f) => f?.source);
  if (
    sources.slice(0, 5).some((src) => src !== "get_couple_csl_factors") ||
    sources[5] !== "get_couple_dasha_sync"
  ) {
    return "systems.kpCuspal.factors must be five get_couple_csl_factors rows then the get_couple_dasha_sync row";
  }
  if (!Array.isArray(s.kpCuspal.dashaSyncWindows)) {
    return "systems.kpCuspal.dashaSyncWindows is missing (an empty array is valid)";
  }
  if (!Array.isArray(s.kpCuspal.prerequisites) || typeof s.kpCuspal.prerequisiteNote !== "string") {
    return "systems.kpCuspal is missing the individual prerequisites and their note";
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

  const km = data.kpMarriage;
  if (!km?.punarphoo?.personA || !km.punarphoo.personB) {
    return "response is missing kpMarriage.punarphoo for both people";
  }
  if (typeof km.punarphoo.personA.present !== "boolean" || typeof km.punarphoo.personB.present !== "boolean") {
    return "kpMarriage.punarphoo must say present or not for both people";
  }
  for (const [label, d] of [["personA", km.discord?.personA], ["personB", km.discord?.personB]] as const) {
    if (!d || !Array.isArray(d.fruitfulAgents) || !Array.isArray(d.criticalAgents)) {
      return `response is missing kpMarriage.discord.${label}`;
    }
  }
  // The discord tool ships its own disclaimer; it travels in the payload.
  if (typeof km.discord.disclaimer !== "string" || !km.discord.disclaimer.trim()) {
    return "response is missing kpMarriage.discord.disclaimer";
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
      // 15 tool calls across two charts, three scored systems, doshas, Punarphoo,
      // the discord rule, spouse characteristics in both directions and a
      // disagreement drawer. We stream, so a large budget costs nothing when
      // the answer is shorter.
      maxTokens: 40000,
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
