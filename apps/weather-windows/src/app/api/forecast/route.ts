import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import type {
  Channel,
  ForecastInput,
  ForecastResponse,
  WeatherWindow,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const LUMIN_MCP_URL =
  process.env.LUMIN_MCP_URL ?? "https://mcp.lumin.guru/mcp";
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

// The astrometeorology family is place-based, not birth-based, so there is no
// set_birth_profile here. All four place-based tools are now wired:
// get_seasonal_outlook frames the season, get_weather_windows lists the
// ~14-day lunation windows, get_astro_weather adds a present-moment snapshot,
// and get_monsoon_forecast (conditional, monsoon regions) reads the onset.
const ALLOWED_TOOLS = [
  "get_seasonal_outlook",
  "get_weather_windows",
  "get_astro_weather",
  "get_monsoon_forecast",
] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 220;
const CHANNEL_LEVELS = ["calm", "mild", "active", "intense"];
const RATINGS = ["favourable", "mixed", "unfavourable"];

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function validateInput(body: unknown): ForecastInput | string {
  if (typeof body !== "object" || body === null) {
    return "Body must be a JSON object";
  }
  const b = body as Record<string, unknown>;
  if (typeof b.location_name !== "string" || !b.location_name.trim()) {
    return 'location_name is required (e.g. "Colombo, Sri Lanka")';
  }
  if (typeof b.start_date !== "string" || !DATE_RE.test(b.start_date)) {
    return "start_date is required (YYYY-MM-DD)";
  }
  if (typeof b.end_date !== "string" || !DATE_RE.test(b.end_date)) {
    return "end_date is required (YYYY-MM-DD)";
  }
  const start = Date.parse(`${b.start_date}T00:00:00Z`);
  const end = Date.parse(`${b.end_date}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "start_date or end_date is not a valid calendar date";
  }
  if (end <= start) {
    return "end_date must be after start_date";
  }
  const days = (end - start) / 86_400_000;
  if (days > MAX_RANGE_DAYS) {
    return `Date range is too wide; keep it within ${MAX_RANGE_DAYS} days`;
  }
  return {
    location_name: b.location_name.trim(),
    start_date: b.start_date,
    end_date: b.end_date,
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

function isChannel(value: unknown): value is Channel {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.level === "string" &&
    CHANNEL_LEVELS.includes(c.level) &&
    typeof c.band === "string" &&
    typeof c.score === "number" &&
    typeof c.note === "string"
  );
}

function parseClaudeJson(text: string): ForecastResponse | string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return "Model did not return JSON";

  let parsed: ForecastResponse;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1)) as ForecastResponse;
  } catch (err) {
    return `JSON parse failed: ${(err as Error).message}`;
  }

  const loc = parsed.resolved_location;
  if (
    !loc ||
    typeof loc.latitude !== "number" ||
    typeof loc.longitude !== "number" ||
    typeof loc.utc_offset_minutes !== "number"
  ) {
    return "Response missing resolved_location";
  }
  if (!parsed.season || typeof parsed.season.season !== "string") {
    return "Response missing season";
  }
  if (!Array.isArray(parsed.windows) || parsed.windows.length === 0) {
    return "Response has no weather windows";
  }
  for (const w of parsed.windows as WeatherWindow[]) {
    if (typeof w.label !== "string" || typeof w.summary !== "string") {
      return "A window is missing label or summary";
    }
    if (!RATINGS.includes(w.outdoor_rating)) {
      return `Invalid outdoor_rating: ${w.outdoor_rating}`;
    }
    if (!isChannel(w.temperature) || !isChannel(w.precipitation) || !isChannel(w.wind)) {
      return `Window "${w.label}" has a malformed weather channel`;
    }
  }
  // current and monsoon are optional enrichments (get_astro_weather and
  // get_monsoon_forecast). Validate their channels only when present.
  if (parsed.current) {
    const c = parsed.current;
    if (!isChannel(c.temperature) || !isChannel(c.precipitation) || !isChannel(c.wind)) {
      return "current snapshot has a malformed weather channel";
    }
  }
  if (parsed.monsoon && !isChannel(parsed.monsoon.precipitation)) {
    return "monsoon outlook has a malformed precipitation channel";
  }
  if (typeof parsed.disclaimer !== "string") {
    return "Response missing disclaimer";
  }
  return parsed;
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
    return NextResponse.json({ error: parsed, raw: finalText }, { status: 502 });
  }

  return NextResponse.json(parsed);
}
