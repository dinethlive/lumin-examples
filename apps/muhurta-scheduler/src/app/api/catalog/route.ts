import { NextResponse } from "next/server";
import {
  runLumin,
  logRun,
  parseJsonBlock,
  ensureShape,
  LuminClientError,
} from "@lumin-examples/client";
import {
  ALLOWED_TOOLS_CATALOG,
  buildCatalogSystemPrompt,
  buildCatalogUserPrompt,
} from "@/lib/prompt";
import type { CatalogResponse } from "@/lib/types";

export const runtime = "nodejs";
/** One tool call, possibly paged once or twice. Comfortable above that. */
export const maxDuration = 60;

const ROUTE = "/api/catalog";

const PROVENANCES = new Set([
  "BOOK_SOURCED",
  "WEB_SOURCED",
  "DERIVED_TABLE_D",
  "DERIVED_CUSP_RULE",
]);

function validateShape(data: CatalogResponse): string | null {
  if (!Array.isArray(data.events) || data.events.length === 0) {
    return "response has no events";
  }
  for (const e of data.events) {
    if (!e.key || !e.label) return "an event is missing a key or a label";
    if (!PROVENANCES.has(e.provenance)) {
      return `invalid provenance: ${e.provenance}`;
    }
    if (!Array.isArray(e.electedHouses) || e.electedHouses.length === 0) {
      return `event ${e.key} has no elected houses`;
    }
  }
  if (typeof data.totalItems !== "number") {
    return "response is missing totalItems";
  }
  if (typeof data.disclaimer !== "string" || !data.disclaimer.trim()) {
    return "response is missing the disclaimer";
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const result = await runLumin({
      allowedTools: ALLOWED_TOOLS_CATALOG,
      system: buildCatalogSystemPrompt(),
      user: buildCatalogUserPrompt(),
      // One paged tool, a few dozen short rows. Comfortable, costs nothing
      // when shorter because we stream.
      maxTokens: 8000,
      // A lookup with no reasoning to do beyond relaying a table.
      effort: "low",
      signal: req.signal,
    });

    logRun(ROUTE, result);

    const data = ensureShape(
      parseJsonBlock<CatalogResponse>(result.text),
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
