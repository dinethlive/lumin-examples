import { NextResponse, type NextRequest } from "next/server";
import {
  runLumin,
  logRun,
  parseJsonBlock,
  ensureShape,
  LuminClientError,
} from "@lumin-examples/client";
import { ALLOWED_TOOLS, buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import type { BirthInput, CareerFitResponse } from "@/lib/types";

export const runtime = "nodejs";
/**
 * Thirteen tools, two of them paged (analyze_natal_promise,
 * get_occupation_matches), so a full run is typically 15 to 18 calls. The
 * loading copy promises 60 to 160 seconds; this stays comfortably above that.
 */
export const maxDuration = 180;

const ROUTE = "/api/career";

const VERDICTS = new Set(["ACTIVE", "MIXED_ACTIVE", "PARTIALLY_ACTIVE", "DENIED"]);
const BANDS = new Set(["HIGH", "MODERATE", "LOW"]);
const BALANCE_BANDS = new Set([
  "STRONG",
  "FAVOURABLE",
  "MIXED",
  "OBSTRUCTED",
  "HEAVILY_OBSTRUCTED",
]);
const PROVENANCE = new Set(["BOOK_SOURCED", "ANCESTOR_DERIVED", "PRINCIPLE_DERIVED"]);
const AGREEMENT = new Set(["STRONG", "PARTIAL", "DIVERGENT"]);
const RULE_RESULTS = new Set(["service", "business", "mixed", "inconclusive"]);
const RULE_IDS = ["A", "B", "C", "D", "E"];

const REQUIRED_DISCLAIMER =
  "A coaching aid built from a Krishnamurti Paddhati chart, meant for self-reflection and conversation with a coach. It is not a hiring, screening, selection or evaluation input, and must never be used to decide about someone else's employment or candidacy. Occupation matches are inclinations, not a shortlist. Income and promotion panels are qualitative only: no salary figure, currency amount or rate of increase is ever derived from a chart.";

function badRequest(message: string) {
  return NextResponse.json({ error: message, failure: "bad_request" }, { status: 400 });
}

function validateInput(body: unknown): BirthInput | string {
  if (typeof body !== "object" || body === null) return "Body must be a JSON object";
  const b = body as Record<string, unknown>;

  if (typeof b.birthDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.birthDate)) {
    return "birthDate is required (YYYY-MM-DD)";
  }
  if (typeof b.birthTime !== "string" || !/^\d{2}:\d{2}$/.test(b.birthTime)) {
    return "birthTime is required (HH:MM)";
  }
  if (typeof b.birthTimeKnown !== "boolean") {
    return "birthTimeKnown is required (boolean)";
  }
  if (typeof b.locationName !== "string" || !b.locationName.trim()) {
    return "locationName is required, for example \"Colombo, Sri Lanka\"";
  }
  const horizon =
    typeof b.horizonYears === "number" && Number.isFinite(b.horizonYears)
      ? Math.min(20, Math.max(3, Math.round(b.horizonYears)))
      : 10;

  return {
    name: typeof b.name === "string" ? b.name.trim().slice(0, 120) : "",
    birthDate: b.birthDate,
    birthTime: b.birthTime,
    birthTimeKnown: b.birthTimeKnown,
    locationName: b.locationName.trim().slice(0, 160),
    horizonYears: horizon,
  };
}

function validateWindow(w: unknown): string | null {
  if (typeof w !== "object" || w === null) return "window is not an object";
  const win = w as Record<string, unknown>;
  if (typeof win.start !== "string" || typeof win.end !== "string") {
    return "window is missing start or end";
  }
  if (typeof win.reason !== "string") return "window is missing reason";
  return null;
}

function validateShape(data: CareerFitResponse): string | null {
  if (!data.resolvedLocation || typeof data.resolvedLocation.latitude !== "number") {
    return "response is missing a resolved location";
  }
  if (!data.audit || !BANDS.has(data.audit.band)) {
    return "response is missing or has an invalid audit.band";
  }
  if (!data.promise?.career || data.promise.career.event !== "Career / Job Start") {
    return "response is missing the Career / Job Start promise row";
  }
  if (!VERDICTS.has(data.promise.career.verdict)) {
    return `invalid promise verdict: ${data.promise.career.verdict}`;
  }
  if (!data.fit?.careerBalance || !BALANCE_BANDS.has(data.fit.careerBalance.band)) {
    return "response is missing or has an invalid fit.careerBalance.band";
  }
  if (!Array.isArray(data.fit.categories) || data.fit.categories.length !== 8) {
    return `expected exactly 8 career categories, got ${data.fit?.categories?.length ?? 0}`;
  }
  if (!Array.isArray(data.fit.occupations) || data.fit.occupations.length === 0) {
    return "response has no occupation matches";
  }
  for (const occ of data.fit.occupations) {
    if (!PROVENANCE.has(occ.provenance)) {
      return `invalid occupation provenance: ${occ.provenance}`;
    }
  }
  if (!data.fit.profession || typeof data.fit.profession.primaryIndustry !== "string") {
    return "response is missing fit.profession";
  }
  if (!data.mode?.jobVsBusiness) return "response is missing mode.jobVsBusiness";
  if (!AGREEMENT.has(data.mode.jobVsBusiness.agreement)) {
    return `invalid job-vs-business agreement: ${data.mode.jobVsBusiness.agreement}`;
  }
  if (!RULE_RESULTS.has(data.mode.jobVsBusiness.consensus)) {
    return `invalid job-vs-business consensus: ${data.mode.jobVsBusiness.consensus}`;
  }
  const rules = data.mode.jobVsBusiness.rules;
  if (!Array.isArray(rules) || rules.length !== 5) {
    return `expected exactly 5 job-vs-business rules, got ${rules?.length ?? 0}`;
  }
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (rule.id !== RULE_IDS[i]) {
      return `job-vs-business rules must be in order A to E, found ${rule.id} at position ${i}`;
    }
    if (!RULE_RESULTS.has(rule.result)) {
      return `invalid rule result for ${rule.id}: ${rule.result}`;
    }
  }
  if (!data.timing?.promotion || !Array.isArray(data.timing.promotion.windows)) {
    return "response is missing timing.promotion";
  }
  if (!data.timing.jobChange || !Array.isArray(data.timing.jobChange.windows)) {
    return "response is missing timing.jobChange";
  }
  if (!data.timing.earnedIncome || typeof data.timing.earnedIncome.incomeGrade !== "string") {
    return "response is missing timing.earnedIncome";
  }
  for (const w of [
    ...data.timing.promotion.windows,
    ...data.timing.jobChange.windows,
    ...data.timing.earnedIncome.incrementWindows,
  ]) {
    const problem = validateWindow(w);
    if (problem) return `timing ${problem}`;
  }
  if (!data.blockage || !Array.isArray(data.blockage.diagnoses)) {
    return "response is missing blockage.diagnoses";
  }
  for (const d of data.blockage.diagnoses) {
    for (const w of d.resolutionWindows ?? []) {
      const problem = validateWindow(w);
      if (problem) return `blockage diagnosis ${problem}`;
    }
  }
  if (!data.crossSystem?.d10 || typeof data.crossSystem.d10.ascendant !== "string") {
    return "response is missing crossSystem.d10";
  }
  if (!data.crossSystem.note || !data.crossSystem.note.trim()) {
    return "response is missing crossSystem.note";
  }
  if (!Array.isArray(data.confidence?.boundaryWarnings)) {
    return "response is missing confidence.boundaryWarnings";
  }
  if (data.disclaimer !== REQUIRED_DISCLAIMER) {
    return "response disclaimer does not match the mandated text";
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
      // 13 tools, up to a handful of extra pages, plus eight category scores,
      // occupation matches with quotes, five job-vs-business rules and three
      // timing panels. Generous headroom; we stream, so it costs nothing when
      // the answer is shorter.
      maxTokens: 24000,
      // This is a real investigation, not a lookup: xhigh is the right effort.
      effort: "xhigh",
      // Two paged tools plus twelve single calls can genuinely need more than
      // the client's default of 12 turns if a page takes a few tries to land
      // on the right event or enough occupation rows.
      maxTurns: 20,
      signal: req.signal,
    });

    logRun(ROUTE, result);

    const data = ensureShape(
      parseJsonBlock<CareerFitResponse>(result.text),
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
