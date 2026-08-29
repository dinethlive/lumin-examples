import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import { getProduct } from "@/lib/catalog";
import type {
  BirthInput,
  ConstitutionDriver,
  DoshaBalance,
  Match,
  MatchResponse,
  Prakriti,
  ResolvedLocation,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const LUMIN_MCP_URL =
  process.env.LUMIN_MCP_URL ?? "https://mcp.lumin.guru/mcp";
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

const ALLOWED_TOOLS = [
  "set_birth_profile",
  "get_full_chart",
  "get_planets",
  "get_nakshatra_details",
  "get_aspects_and_strength",
  "get_house_cusps",
  "get_boundary_warnings",
  "get_ayurvedic_constitution",
  "get_shadbala",
] as const;

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

type ParsedResult = {
  resolved_location: ResolvedLocation;
  prakriti: Prakriti;
  dosha_balance: DoshaBalance;
  constitution_drivers: ConstitutionDriver[];
  summary: string;
  matches: Match[];
};

function isDoshaBalance(value: unknown): value is DoshaBalance {
  if (typeof value !== "object" || value === null) return false;
  const b = value as Record<string, unknown>;
  return (
    typeof b.vata === "number" &&
    typeof b.pitta === "number" &&
    typeof b.kapha === "number"
  );
}

function parseClaudeJson(text: string): ParsedResult | string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return "Model did not return JSON";
  const slice = cleaned.slice(start, end + 1);
  try {
    const parsed = JSON.parse(slice) as ParsedResult;
    if (
      !parsed.resolved_location ||
      typeof parsed.resolved_location.latitude !== "number" ||
      typeof parsed.resolved_location.longitude !== "number" ||
      typeof parsed.resolved_location.utc_offset_minutes !== "number"
    ) {
      return "Response missing resolved_location";
    }
    if (!parsed.prakriti?.primary || !parsed.prakriti?.label) {
      return "Response missing prakriti fields";
    }
    if (!isDoshaBalance(parsed.dosha_balance)) {
      return "Response missing dosha_balance (vata/pitta/kapha triple)";
    }
    if (!Array.isArray(parsed.constitution_drivers)) {
      return "Response missing constitution_drivers";
    }
    if (!Array.isArray(parsed.matches) || parsed.matches.length === 0) {
      return "Response missing matches";
    }
    return parsed;
  } catch (err) {
    return `JSON parse failed: ${(err as Error).message}`;
  }
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
      max_tokens: 4096,
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

  const hydratedMatches: MatchResponse["matches"] = [];
  for (const m of parsed.matches) {
    const product = getProduct(m.id);
    if (product) hydratedMatches.push({ ...product, ...m });
  }
  if (hydratedMatches.length === 0) {
    return NextResponse.json(
      {
        error: "Model picked product IDs that are not in the catalog",
        raw: parsed.matches,
      },
      { status: 502 },
    );
  }

  const result: MatchResponse = {
    resolved_location: parsed.resolved_location,
    prakriti: parsed.prakriti,
    dosha_balance: parsed.dosha_balance,
    constitution_drivers: parsed.constitution_drivers,
    summary: parsed.summary,
    matches: hydratedMatches,
  };
  return NextResponse.json(result);
}
