import { LuminClientError } from "./errors";

/**
 * Pull one JSON object out of a model's final text block.
 *
 * Assistant prefill is rejected on every current model, so we cannot force the
 * response to open with a brace. The model is asked for bare JSON in the system
 * prompt and usually complies, but it may still wrap the object in a fenced
 * block or add a sentence before it. Both are handled here, in one place,
 * rather than four times across four apps.
 */
export function parseJsonBlock<T>(text: string): T {
  let cleaned = text.trim();

  // Strip a fenced block, with or without a language tag.
  const fence = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) cleaned = fence[1].trim();

  // Fall back to the outermost braces, which survives a leading sentence.
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new LuminClientError("unparseable_output", "no JSON object in output");
  }

  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch (err) {
    throw new LuminClientError("unparseable_output", (err as Error).message, {
      cause: err,
    });
  }
}

/**
 * Run a caller-supplied validator and convert its complaint into a typed error.
 *
 * The validator returns null when the value is good, or a string naming what is
 * wrong. Keeping validation in the app means each example states the exact
 * shape it renders, which is the part a developer forking it needs to edit.
 */
export function ensureShape<T>(value: T, validate: (v: T) => string | null): T {
  const problem = validate(value);
  if (problem) throw new LuminClientError("invalid_shape", problem);
  return value;
}
