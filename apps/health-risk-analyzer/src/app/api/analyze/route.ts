import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
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
export const maxDuration = 180;

const LUMIN_MCP_URL =
  process.env.LUMIN_MCP_URL ?? "https://mcp.lumin.guru/mcp";
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

// 29 tools across the 7-step protocol. run_pre_verdict_audit is the v4
// composite that supersedes the standalone boundary check; the other v4
// additions deepen the health read (organ panel, planetary strength,
// Saturn cycle, and the disease/longevity/mind divisional charts). The four
// post-v4 additions ground the timing and verdict layers that the prompt used
// to reason about unaided: get_significators (the 4-level house-signification
// matrix behind "planets that signify 6/8/12"), get_vedha_transit (Saturn and
// Jupiter transit favourability from natal Moon, KP Reader 5), the
// get_sade_sati_intensity sub-lord timeline (peaks within the phase), and
// get_multi_system_verdict (a 4-school consensus for illness/surgery verdicts).
const ALLOWED_TOOLS = [
  "set_birth_profile",
  "get_full_chart",
  "get_planets",
  "get_house_cusps",
  "get_nakshatra_details",
  "get_aspects_and_strength",
  "run_pre_verdict_audit",
  "get_shadbala",
  "analyze_natal_promise",
  "get_significators",
  "get_multi_system_verdict",
  "get_bhadhakasthana",
  "get_csl_advanced",
  "get_smart_current_dasha",
  "get_dasha_periods",
  "get_vedha_transit",
  "get_medical_timing",
  "get_ashtakavarga",
  "get_chronic_disease_panel",
  "get_health_organ_panel",
  "get_accident_window",
  "get_longevity_balarishta",
  "get_sade_sati_phases",
  "get_sade_sati_intensity",
  "get_ayurvedic_constitution",
  "get_oncology_timing",
  "get_d6_chart",
  "get_d8_chart",
  "get_d30_chart",
] as const;

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
  return NextResponse.json({ error: message }, { status: 400 });
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

type LooseBlock = { type: string; text?: string };

function extractFinalText(content: unknown): string | null {
  if (!Array.isArray(content)) return null;
  const blocks = content as LooseBlock[];
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    if (block.type === "text" && typeof block.text === "string") {
      return block.text;
    }
  }
  return null;
}

function parseClaudeJson(text: string): AnalysisResponse | string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return "Model did not return JSON";
  const slice = cleaned.slice(start, end + 1);

  let parsed: AnalysisResponse;
  try {
    parsed = JSON.parse(slice) as AnalysisResponse;
  } catch (err) {
    return `JSON parse failed: ${(err as Error).message}`;
  }

  if (
    !parsed.resolved_location ||
    typeof parsed.resolved_location.latitude !== "number" ||
    typeof parsed.resolved_location.longitude !== "number" ||
    typeof parsed.resolved_location.utc_offset_minutes !== "number"
  ) {
    return "Response missing resolved_location";
  }
  if (!parsed.vitality_index || typeof parsed.vitality_index.score !== "number") {
    return "Response missing vitality_index";
  }
  if (
    !parsed.chart_confidence ||
    !CONFIDENCE_BANDS.includes(parsed.chart_confidence.band) ||
    typeof parsed.chart_confidence.modifier !== "number"
  ) {
    return "Response missing or invalid chart_confidence";
  }
  if (!parsed.constitutional_basis || !parsed.chronicity_profile) {
    return "Response missing constitutional_basis or chronicity_profile";
  }
  if (!Array.isArray(parsed.system_risks) || parsed.system_risks.length !== 8) {
    return `Expected exactly 8 system_risks, got ${parsed.system_risks?.length ?? 0}`;
  }
  if (
    !parsed.organ_panel ||
    typeof parsed.organ_panel.highest_risk_region !== "string" ||
    !Array.isArray(parsed.organ_panel.regions)
  ) {
    return "Response missing organ_panel";
  }
  if (!parsed.saturn_cycle || !SATURN_STATUSES.includes(parsed.saturn_cycle.status)) {
    return "Response missing or invalid saturn_cycle";
  }
  if (!Array.isArray(parsed.screening_calendar)) {
    return "Response missing screening_calendar";
  }
  if (!Array.isArray(parsed.surgery_windows) || !Array.isArray(parsed.recovery_periods)) {
    return "Response missing surgery_windows or recovery_periods";
  }
  if (typeof parsed.disclaimer !== "string") {
    return "Response missing disclaimer";
  }

  for (const risk of parsed.system_risks) {
    if (!VALID_SYSTEMS.includes(risk.system)) {
      return `Invalid system id: ${risk.system}`;
    }
    if (!["low", "moderate", "elevated", "high"].includes(risk.risk_level)) {
      return `Invalid risk_level for ${risk.system}: ${risk.risk_level}`;
    }
  }

  return parsed;
}

function hydrate(parsed: AnalysisResponse): AnalysisResponseHydrated | string {
  const hydratedRisks: SystemRiskHydrated[] = [];
  for (const r of parsed.system_risks as SystemRisk[]) {
    const meta = getBodySystem(r.system);
    if (!meta) return `Unknown system meta: ${r.system}`;
    hydratedRisks.push({ ...r, meta });
  }
  hydratedRisks.sort(
    (a, b) =>
      VALID_SYSTEMS.indexOf(a.system) - VALID_SYSTEMS.indexOf(b.system),
  );
  return { ...parsed, system_risks: hydratedRisks };
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set on the server" },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const input = validateInput(body);
  if (typeof input === "string") return badRequest(input);

  const anthropic = new Anthropic();

  const mcpServer: Record<string, unknown> = {
    type: "url",
    url: LUMIN_MCP_URL,
    name: "lumin",
  };
  if (process.env.LUMIN_API_KEY) {
    mcpServer.authorization_token = process.env.LUMIN_API_KEY;
  }

  const toolConfigs: Record<string, { enabled: true }> = {};
  for (const tool of ALLOWED_TOOLS) toolConfigs[tool] = { enabled: true };

  let response;
  try {
    response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: buildUserPrompt(input) }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mcp_servers: [mcpServer] as any,
      tools: [
        {
          type: "mcp_toolset",
          mcp_server_name: "lumin",
          default_config: { enabled: false },
          configs: toolConfigs,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
      betas: ["mcp-client-2025-11-20"],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Anthropic call failed";
    return NextResponse.json({ error: `Anthropic: ${message}` }, { status: 502 });
  }

  const finalText = extractFinalText(response.content);
  if (!finalText) {
    return NextResponse.json(
      { error: "Model returned no text output" },
      { status: 502 },
    );
  }

  const parsed = parseClaudeJson(finalText);
  if (typeof parsed === "string") {
    return NextResponse.json(
      { error: parsed, raw: finalText },
      { status: 502 },
    );
  }

  const hydrated = hydrate(parsed);
  if (typeof hydrated === "string") {
    return NextResponse.json({ error: hydrated }, { status: 502 });
  }

  return NextResponse.json(hydrated);
}
