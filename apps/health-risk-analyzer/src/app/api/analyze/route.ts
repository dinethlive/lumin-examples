import { NextResponse, type NextRequest } from "next/server";
import {
  runLumin,
  logRun,
  parseJsonBlock,
  ensureShape,
  LuminClientError,
} from "@lumin-examples/client";
import { ALLOWED_TOOLS, buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import { getBodySystem } from "@/lib/body-systems";
import type {
  AnalysisResponse,
  AnalysisResponseHydrated,
  BirthInput,
  ConfidenceBand,
  SaturnCycleStatus,
  SystemId,
  SystemRisk,
  SystemRiskHydrated,
} from "@/lib/types";

export const runtime = "nodejs";
/** The loading copy promises 50 to 130 seconds, so this has room above that. */
export const maxDuration = 180;

const ROUTE = "/api/analyze";

const VALID_SYSTEMS: SystemId[] = [
  "cardiovascular",
  "respiratory",
  "digestive",
  "nervous-mental",
  "musculoskeletal",
  "endocrine-metabolic",
  "reproductive-urinary",
  "immune-vitality",
];

const CONFIDENCE_BANDS: ConfidenceBand[] = ["high", "moderate", "low"];
const SATURN_STATUSES: SaturnCycleStatus[] = ["active", "approaching", "clear"];

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

/** App-specific: the shape this app renders. Kept separate from the shared client. */
function validateShape(data: AnalysisResponse): string | null {
  if (
    !data.resolved_location ||
    typeof data.resolved_location.latitude !== "number" ||
    typeof data.resolved_location.longitude !== "number" ||
    typeof data.resolved_location.utc_offset_minutes !== "number"
  ) {
    return "Response missing resolved_location";
  }
  if (!data.vitality_index || typeof data.vitality_index.score !== "number") {
    return "Response missing vitality_index";
  }
  if (
    !data.chart_confidence ||
    !CONFIDENCE_BANDS.includes(data.chart_confidence.band) ||
    typeof data.chart_confidence.modifier !== "number"
  ) {
    return "Response missing or invalid chart_confidence";
  }
  if (!data.constitutional_basis || !data.chronicity_profile) {
    return "Response missing constitutional_basis or chronicity_profile";
  }
  if (!Array.isArray(data.system_risks) || data.system_risks.length !== 8) {
    return `Expected exactly 8 system_risks, got ${data.system_risks?.length ?? 0}`;
  }
  if (
    !data.organ_panel ||
    typeof data.organ_panel.highest_risk_region !== "string" ||
    !Array.isArray(data.organ_panel.regions)
  ) {
    return "Response missing organ_panel";
  }
  if (!data.saturn_cycle || !SATURN_STATUSES.includes(data.saturn_cycle.status)) {
    return "Response missing or invalid saturn_cycle";
  }
  if (!Array.isArray(data.screening_calendar)) {
    return "Response missing screening_calendar";
  }
  if (!Array.isArray(data.surgery_windows) || !Array.isArray(data.recovery_periods)) {
    return "Response missing surgery_windows or recovery_periods";
  }
  if (typeof data.disclaimer !== "string" || !data.disclaimer.trim()) {
    return "Response missing the disclaimer";
  }

  for (const risk of data.system_risks) {
    if (!VALID_SYSTEMS.includes(risk.system)) {
      return `Invalid system id: ${risk.system}`;
    }
    if (!["low", "moderate", "elevated", "high"].includes(risk.risk_level)) {
      return `Invalid risk_level for ${risk.system}: ${risk.risk_level}`;
    }
  }

  return null;
}

function hydrate(parsed: AnalysisResponse): AnalysisResponseHydrated | string {
  const hydratedRisks: SystemRiskHydrated[] = [];
  for (const r of parsed.system_risks as SystemRisk[]) {
    const meta = getBodySystem(r.system);
    if (!meta) return `Unknown system meta: ${r.system}`;
    hydratedRisks.push({ ...r, meta });
  }
  hydratedRisks.sort(
    (a, b) => VALID_SYSTEMS.indexOf(a.system) - VALID_SYSTEMS.indexOf(b.system),
  );
  return { ...parsed, system_risks: hydratedRisks };
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
      // 31 tool calls, three of them paged, feeding an 8-card dashboard.
      // MCP tool-use blocks count against this budget alongside the final
      // text, so a deep reading like this one needs real headroom above the
      // 16000 floor. We stream, so it costs nothing when the answer is
      // shorter.
      maxTokens: 24000,
      effort: "xhigh",
      signal: req.signal,
    });

    logRun(ROUTE, result);

    const parsed = ensureShape(
      parseJsonBlock<AnalysisResponse>(result.text),
      validateShape,
    );

    const hydrated = hydrate(parsed);
    if (typeof hydrated === "string") {
      throw new LuminClientError("invalid_shape", hydrated);
    }

    return NextResponse.json(hydrated);
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
