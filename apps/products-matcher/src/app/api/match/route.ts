import { NextResponse, type NextRequest } from "next/server";
import {
  runLumin,
  logRun,
  parseJsonBlock,
  ensureShape,
  LuminClientError,
} from "@lumin-examples/client";
import { ALLOWED_TOOLS, buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import { getProduct } from "@/lib/catalog";
import type {
  BirthInput,
  Match,
  MatchResponse,
  Personality,
  ResolvedLocation,
} from "@/lib/types";

export const runtime = "nodejs";
/** The loading copy promises 30 to 100 seconds, so this has room above that. */
export const maxDuration = 120;

const ROUTE = "/api/match";

function badRequest(message: string) {
  return NextResponse.json({ error: message, failure: "bad_request" }, { status: 400 });
}

function validateInput(body: unknown): BirthInput | string {
  if (typeof body !== "object" || body === null) {
    return "Body must be a JSON object";
  }
  const b = body as Record<string, unknown>;
  if (typeof b.birth_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.birth_date)) {
    return "birth_date is required (YYYY-MM-DD)";
  }
  if (typeof b.birth_time !== "string" || !/^\d{2}:\d{2}$/.test(b.birth_time)) {
    return "birth_time is required (HH:MM)";
  }
  if (typeof b.birth_time_known !== "boolean") {
    return "birth_time_known is required (boolean)";
  }
  if (typeof b.location_name !== "string" || !b.location_name.trim()) {
    return "location_name is required (e.g. \"Colombo, Sri Lanka\")";
  }
  const sex = typeof b.biological_sex === "string" ? b.biological_sex : "unspecified";
  const validSex =
    sex === "female" || sex === "male" || sex === "unspecified" ? sex : "unspecified";
  return {
    name: typeof b.name === "string" ? b.name : "",
    birth_date: b.birth_date,
    birth_time: b.birth_time,
    birth_time_known: b.birth_time_known,
    location_name: b.location_name.trim(),
    biological_sex: validSex,
  };
}

type ParsedResult = {
  resolved_location: ResolvedLocation;
  personality: Personality;
  matches: Match[];
  disclaimer: string;
};

/** App-specific: the shape this app renders. Kept separate from the shared client. */
function validateShape(data: ParsedResult): string | null {
  if (
    !data.resolved_location ||
    typeof data.resolved_location.latitude !== "number" ||
    typeof data.resolved_location.longitude !== "number" ||
    typeof data.resolved_location.utc_offset_minutes !== "number"
  ) {
    return "Response missing resolved_location";
  }
  if (
    !data.personality ||
    !data.personality.label ||
    !Array.isArray(data.personality.traits) ||
    data.personality.traits.length === 0
  ) {
    return "Response missing personality fields";
  }
  if (!Array.isArray(data.personality.signals)) {
    return "Response missing personality.signals";
  }
  if (!Array.isArray(data.matches) || data.matches.length === 0) {
    return "Response missing matches";
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
      maxTokens: 16000,
      effort: "xhigh",
      signal: req.signal,
    });

    logRun(ROUTE, result);

    const parsed = ensureShape(parseJsonBlock<ParsedResult>(result.text), validateShape);

    const hydratedMatches: MatchResponse["matches"] = [];
    for (const m of parsed.matches) {
      const product = getProduct(m.id);
      if (product) hydratedMatches.push({ ...product, ...m });
    }
    if (hydratedMatches.length === 0) {
      throw new LuminClientError(
        "invalid_shape",
        "Model picked product IDs that are not in the catalog",
      );
    }

    const response: MatchResponse = {
      resolved_location: parsed.resolved_location,
      personality: parsed.personality,
      matches: hydratedMatches,
      disclaimer: parsed.disclaimer,
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
