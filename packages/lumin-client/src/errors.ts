/**
 * Typed failures, each carrying the HTTP status your route should return.
 *
 * The point of this file is that a caller can branch on the cause instead of
 * reading an error message. Every failure mode below was a generic 502 in the
 * first generation of these examples, which meant a rate limit, a refusal and
 * a genuine outage were indistinguishable to the browser.
 */

export type LuminFailure =
  | "no_model_key" // ANTHROPIC_API_KEY missing on the server
  | "no_lumin_key" // LUMIN_API_KEY missing; every Lumin endpoint requires credentials
  | "model_rate_limited" // Anthropic 429
  | "model_auth" // Anthropic 401/403
  | "model_bad_request" // Anthropic 400, usually a malformed request
  | "lumin_rate_limited" // Lumin monthly allowance spent and no pack balance
  | "lumin_auth" // Lumin key rejected
  | "tools_never_ran" // the model answered without calling a single Lumin tool
  | "tools_all_failed" // every Lumin tool call came back is_error
  | "refused" // stop_reason: "refusal"
  | "output_truncated" // stop_reason: "max_tokens"
  | "context_exceeded" // stop_reason: "model_context_window_exceeded"
  | "unparseable_output" // the model did not return the JSON we asked for
  | "invalid_shape" // JSON parsed but failed the caller's validator
  | "upstream";

const STATUS: Record<LuminFailure, number> = {
  no_model_key: 500,
  no_lumin_key: 500,
  model_rate_limited: 429,
  model_auth: 500,
  model_bad_request: 500,
  lumin_rate_limited: 429,
  lumin_auth: 500,
  tools_never_ran: 502,
  tools_all_failed: 502,
  refused: 422,
  output_truncated: 502,
  context_exceeded: 502,
  unparseable_output: 502,
  invalid_shape: 502,
  upstream: 502,
};

/**
 * User-facing copy. Deliberately non-technical: these strings reach a browser.
 * Anything a developer needs is on the error object, and is logged server-side.
 */
const MESSAGE: Record<LuminFailure, string> = {
  no_model_key: "The server is missing its model API key.",
  no_lumin_key: "The server is missing its Lumin API key.",
  model_rate_limited: "Too many requests right now. Try again in a moment.",
  model_auth: "The server could not authenticate with the model provider.",
  model_bad_request: "The server sent a request the model could not accept.",
  lumin_rate_limited:
    "This Lumin key has used its monthly call allowance and has no call pack balance left.",
  lumin_auth: "The server could not authenticate with Lumin.",
  tools_never_ran:
    "The reading could not be computed because no chart data was retrieved.",
  tools_all_failed:
    "The reading could not be computed because the chart data calls all failed.",
  refused: "The model declined to answer this request.",
  output_truncated: "The reading was cut off before it finished.",
  context_exceeded: "This reading grew too large to finish.",
  unparseable_output: "The reading came back in an unexpected format.",
  invalid_shape: "The reading came back incomplete.",
  upstream: "Something went wrong computing this reading.",
};

export class LuminClientError extends Error {
  readonly failure: LuminFailure;
  readonly status: number;
  /** Safe to send to a browser. */
  readonly publicMessage: string;
  /** Seconds to wait, when the upstream told us. */
  readonly retryAfterSeconds?: number;
  readonly cause?: unknown;

  constructor(
    failure: LuminFailure,
    detail?: string,
    opts?: { retryAfterSeconds?: number; cause?: unknown },
  ) {
    super(detail ? `${failure}: ${detail}` : failure);
    this.name = "LuminClientError";
    this.failure = failure;
    this.status = STATUS[failure];
    this.publicMessage = MESSAGE[failure];
    this.retryAfterSeconds = opts?.retryAfterSeconds;
    this.cause = opts?.cause;
  }

  /** The body shape every example route returns on failure. */
  toBody(): { error: string; failure: LuminFailure; retryAfterSeconds?: number } {
    return {
      error: this.publicMessage,
      failure: this.failure,
      ...(this.retryAfterSeconds !== undefined
        ? { retryAfterSeconds: this.retryAfterSeconds }
        : {}),
    };
  }
}
