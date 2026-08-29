import Anthropic from "@anthropic-ai/sdk";
import { LuminClientError } from "./errors";

/** The public Lumin MCP endpoint. API keys go here. */
export const DEFAULT_MCP_URL = "https://mcp.lumin.guru/mcp";

/**
 * `/mcp/auth` is the OAuth-only endpoint for interactive clients. An API key
 * sent there is rejected, which is worth stating because the first generation
 * of these examples told developers to do exactly that.
 */
export const DEFAULT_MODEL = "claude-opus-5";

/** The MCP connector is still behind a beta flag. Both halves are required. */
const MCP_BETA = "mcp-client-2025-11-20";

/** The server name the model sees. Referenced by the toolset, so keep them equal. */
const SERVER_NAME = "lumin";

export type LuminRunOptions = {
  /**
   * Deny-by-default allowlist. The model can call these Lumin tools and no
   * others, which bounds both the cost and the blast radius of a prompt.
   * Naming them also documents what the feature actually reads.
   */
  allowedTools: readonly string[];
  system: string;
  user: string;
  /**
   * Whole-turn budget. MCP tool-use blocks are model output and count against
   * this alongside the final text, so a 25-call reading needs real headroom.
   * We stream, so a large value costs nothing when the answer is short.
   */
  maxTokens?: number;
  model?: string;
  /** low | medium | high | xhigh | max. Agentic runs want xhigh. */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  /** Safety valve for the pause_turn loop. */
  maxTurns?: number;
  signal?: AbortSignal;
};

export type LuminToolCall = {
  name: string;
  isError: boolean;
  /** First 300 characters of the result, for logging. Never sent to a browser. */
  preview: string;
};

export type LuminRunResult = {
  /** The model's final text block, which is where the JSON lives. */
  text: string;
  toolCalls: LuminToolCall[];
  turns: number;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
  };
};

function envModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
}

function mcpUrl(): string {
  return process.env.LUMIN_MCP_URL?.trim() || DEFAULT_MCP_URL;
}

type LooseBlock = {
  type: string;
  text?: string;
  name?: string;
  is_error?: boolean;
  content?: unknown;
};

function previewOf(content: unknown): string {
  if (typeof content === "string") return content.slice(0, 300);
  if (Array.isArray(content)) {
    const first = content.find(
      (b): b is { type: string; text: string } =>
        typeof b === "object" && b !== null && (b as LooseBlock).type === "text",
    );
    if (first?.text) return first.text.slice(0, 300);
  }
  return "";
}

/**
 * Lumin answers a spent allowance with a JSON-RPC error carrying
 * retryAfterSeconds and packBalance. It reaches us as tool-result text rather
 * than an HTTP status, because the failure happened inside the conversation.
 */
function detectLuminRateLimit(preview: string): number | undefined {
  if (!/allowance|call pack|429/i.test(preview)) return undefined;
  const match = preview.match(/"retryAfterSeconds"\s*:\s*(\d+)/);
  return match ? Number(match[1]) : 0;
}

function isLuminAuthFailure(preview: string): boolean {
  return /\b401\b|unauthori[sz]ed|invalid api key/i.test(preview);
}

function mapSdkError(err: unknown): LuminClientError {
  if (err instanceof Anthropic.RateLimitError) {
    return new LuminClientError("model_rate_limited", err.message, { cause: err });
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return new LuminClientError("model_auth", err.message, { cause: err });
  }
  if (err instanceof Anthropic.BadRequestError) {
    return new LuminClientError("model_bad_request", err.message, { cause: err });
  }
  if (err instanceof LuminClientError) return err;
  const message = err instanceof Error ? err.message : "unknown upstream failure";
  return new LuminClientError("upstream", message, { cause: err });
}

/**
 * One agentic run against the Lumin MCP server.
 *
 * What this handles that a bare `messages.create` does not:
 *   - pause_turn, which is how a long server-side tool loop reports "not done".
 *     Treating it as a failure is what made long readings look broken.
 *   - refusal, max_tokens and model_context_window_exceeded, each mapped to a
 *     distinct status rather than a blanket 502.
 *   - whether any Lumin tool actually ran. Without this check a run in which
 *     every tool returned 401 still produces well-formed JSON and renders as a
 *     finished reading.
 *   - Lumin's own 429, which arrives as tool-result text, not an HTTP status.
 */
export async function runLumin(opts: LuminRunOptions): Promise<LuminRunResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new LuminClientError("no_model_key");
  }
  if (!process.env.LUMIN_API_KEY) {
    throw new LuminClientError("no_lumin_key");
  }

  const client = new Anthropic();
  const maxTurns = opts.maxTurns ?? 12;

  const server: Anthropic.Beta.BetaRequestMCPServerURLDefinition = {
    type: "url",
    url: mcpUrl(),
    name: SERVER_NAME,
    authorization_token: process.env.LUMIN_API_KEY,
  };

  const configs: Record<string, { enabled: true }> = {};
  for (const tool of opts.allowedTools) configs[tool] = { enabled: true };

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: opts.user },
  ];

  const toolCalls: LuminToolCall[] = [];
  const usage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 };
  let turns = 0;

  for (;;) {
    turns += 1;
    if (turns > maxTurns) {
      throw new LuminClientError(
        "upstream",
        `run did not settle within ${maxTurns} turns`,
      );
    }

    let response: Anthropic.Beta.BetaMessage;
    try {
      // Streaming, because max_tokens is large enough that a non-streaming
      // request would risk an HTTP timeout on a long reading.
      const stream = client.beta.messages.stream(
        {
          model: opts.model ?? envModel(),
          max_tokens: opts.maxTokens ?? 16000,
          system: opts.system,
          messages,
          thinking: { type: "adaptive" },
          output_config: { effort: opts.effort ?? "xhigh" },
          mcp_servers: [server],
          tools: [
            {
              type: "mcp_toolset",
              mcp_server_name: SERVER_NAME,
              default_config: { enabled: false },
              configs,
            },
          ],
          betas: [MCP_BETA],
        },
        opts.signal ? { signal: opts.signal } : undefined,
      );
      response = await stream.finalMessage();
    } catch (err) {
      throw mapSdkError(err);
    }

    usage.inputTokens += response.usage.input_tokens ?? 0;
    usage.outputTokens += response.usage.output_tokens ?? 0;
    usage.cacheReadTokens += response.usage.cache_read_input_tokens ?? 0;

    const blocks = response.content as unknown as LooseBlock[];
    for (const block of blocks) {
      if (block.type === "mcp_tool_result") {
        const preview = previewOf(block.content);
        const isError = block.is_error === true;
        toolCalls.push({
          name: block.name ?? "unknown",
          isError,
          preview,
        });
        if (isError) {
          const retryAfterSeconds = detectLuminRateLimit(preview);
          if (retryAfterSeconds !== undefined) {
            throw new LuminClientError("lumin_rate_limited", preview, {
              retryAfterSeconds,
            });
          }
          if (isLuminAuthFailure(preview)) {
            throw new LuminClientError("lumin_auth", preview);
          }
        }
      }
    }

    if (response.stop_reason === "pause_turn") {
      // The turn is resumable. Append what came back verbatim and continue.
      messages.push({ role: "assistant", content: response.content });
      continue;
    }

    if (response.stop_reason === "refusal") {
      const category = response.stop_details?.category ?? "unspecified";
      throw new LuminClientError("refused", `category=${category}`);
    }
    if (response.stop_reason === "max_tokens") {
      throw new LuminClientError("output_truncated");
    }
    if (response.stop_reason === "model_context_window_exceeded") {
      throw new LuminClientError("context_exceeded");
    }

    const succeeded = toolCalls.filter((c) => !c.isError);
    if (toolCalls.length === 0) {
      throw new LuminClientError("tools_never_ran");
    }
    if (succeeded.length === 0) {
      throw new LuminClientError("tools_all_failed");
    }

    const text = [...blocks]
      .reverse()
      .find((b) => b.type === "text" && typeof b.text === "string")?.text;
    if (!text) {
      throw new LuminClientError("unparseable_output", "no text block in output");
    }

    return { text, toolCalls, turns, usage };
  }
}

/** One line per run. Tool names and counts, never chart data. */
export function logRun(route: string, result: LuminRunResult): void {
  const failed = result.toolCalls.filter((c) => c.isError).length;
  console.log(
    JSON.stringify({
      route,
      turns: result.turns,
      toolCalls: result.toolCalls.length,
      toolsFailed: failed,
      tools: result.toolCalls.map((c) => c.name),
      usage: result.usage,
    }),
  );
}
