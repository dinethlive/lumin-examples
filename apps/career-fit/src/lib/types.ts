/**
 * The response shape this app renders. Every field is filled by a named tool,
 * and the comment says which one, so a developer forking this knows exactly
 * what to drop when they drop a tool from ALLOWED_TOOLS.
 *
 * Order of work mirrors the reading itself: foundation and audit, then the
 * promise gate, then the domain tools (fit, mode, timing, blockage), then the
 * one cross-system reference. Nothing in `fit`, `mode`, `timing` or `blockage`
 * may be treated as promised unless `promise.career.verdict` says so.
 */

export type BirthInput = {
  /** Optional, shown back in the header only. */
  name: string;
  birthDate: string;
  birthTime: string;
  birthTimeKnown: boolean;
  /** Free text, e.g. "Colombo, Sri Lanka". The model resolves it to coordinates. */
  locationName: string;
  /** Years ahead to scan for every timing tool. Default 10, clamped 3 to 20. */
  horizonYears: number;
};

export type ResolvedLocation = {
  latitude: number;
  longitude: number;
  utcOffsetMinutes: number;
  note: string;
};

export type ConfidenceBand = "HIGH" | "MODERATE" | "LOW";

/** run_pre_verdict_audit. The chart-integrity gate, run first. */
export type PreVerdictAudit = {
  confidenceModifier: number;
  band: ConfidenceBand;
  summary: string;
  flags: string[];
};

/** get_boundary_warnings. Cusp and planet sub-lord boundary proximity. */
export type BoundaryWarning = {
  target: string;
  severity: "CRITICAL" | "CAUTION";
  arcMinutes: number;
  note: string;
};

export type PromiseVerdict = "ACTIVE" | "MIXED_ACTIVE" | "PARTIALLY_ACTIVE" | "DENIED";

/**
 * analyze_natal_promise, the "Career / Job Start" row pulled out of the paged
 * life-events list. Nothing below this may state a verdict before this field
 * is filled.
 */
export type CareerPromise = {
  event: string;
  house: number;
  csl: string;
  verdict: PromiseVerdict;
  required: number[];
  covered: number[];
  missing: number[];
  reasoning: string;
};

export type CareerBalanceBand =
  | "STRONG"
  | "FAVOURABLE"
  | "MIXED"
  | "OBSTRUCTED"
  | "HEAVILY_OBSTRUCTED";

/** get_career_cusp_panel. The five career cusps against the four negation cusps. */
export type CareerBalance = {
  band: CareerBalanceBand;
  index: number;
  summary: string;
};

/** get_career_signature. Eight named career categories, each 0 to 100. */
export type CareerCategoryScore = {
  name: string;
  score: number;
  hits: string[];
};

/** Cross-cutting axes from the same get_career_signature call. */
export type CareerAxes = {
  sectorClass: string;
  employmentMode: string;
  leadershipScore: number;
  technicalScore: number;
  creativeScore: number;
};

export type OccupationProvenance = "BOOK_SOURCED" | "ANCESTOR_DERIVED" | "PRINCIPLE_DERIVED";

/**
 * get_occupation_matches, one row. The weakest-confidence tool in the career
 * suite, and its own description says so; sourceQuote is what makes that
 * caveat checkable rather than a disclaimer nobody reads.
 */
export type OccupationMatch = {
  title: string;
  score: number;
  family: string;
  provenance: OccupationProvenance;
  sourceQuote: string;
};

/** get_profession_description. Industry, sector and employment mode, not timing. */
export type ProfessionDescription = {
  primaryIndustry: string;
  secondaryIndustry: string;
  sector: string;
  employmentMode: string;
  workType: string;
  salaryBand: string;
};

export type JobVsBusinessResult = "service" | "business" | "mixed" | "inconclusive";

/**
 * get_job_vs_business_verdict, one of its five independently reported rules.
 * Rendered as five separate rows, never blended into one score: that panel is
 * the reason this app exists rather than a generic "career horoscope".
 */
export type JobVsBusinessRule = {
  id: "A" | "B" | "C" | "D" | "E";
  /** One line naming what this rule examines. */
  tests: string;
  result: JobVsBusinessResult;
  explanation: string;
};

export type JobVsBusinessAgreement = "STRONG" | "PARTIAL" | "DIVERGENT";

export type JobVsBusinessVerdict = {
  consensus: JobVsBusinessResult;
  agreement: JobVsBusinessAgreement;
  rules: JobVsBusinessRule[];
  denialGate: boolean;
  summary: string;
};

export type TimingWindow = {
  start: string;
  end: string;
  reason: string;
};

/** get_promotion_verdict. The 11th-cusp three-condition gate. */
export type PromotionVerdict = {
  eligible: boolean;
  windows: TimingWindow[];
  stagnationFlag: boolean;
  summary: string;
};

/** get_job_change_timing. Both leaving-house derivations, reported side by side. */
export type JobChangeTiming = {
  promised: boolean;
  windows: TimingWindow[];
  changeAxis: string;
  summary: string;
};

/** get_earned_income_panel. Qualitative only, never a figure or a rate. */
export type EarnedIncomePanel = {
  incomeGrade: string;
  incrementWindows: TimingWindow[];
  leakageFlag: boolean;
  summary: string;
};

/**
 * get_career_blockage_diagnosis, one of up to four named consultation
 * answers: prolonged unemployment, stagnant salary, blocked promotion,
 * layoff exposure. Each is period-bound, never a permanent verdict.
 */
export type BlockageDiagnosis = {
  name: string;
  explanation: string;
  missingHouses: number[];
  resolutionWindows: TimingWindow[];
};

export type CareerBlockage = {
  tenthCsl: string;
  missingHouses: number[];
  diagnoses: BlockageDiagnosis[];
  primaryBlockage: string | null;
  summary: string;
};

/**
 * get_d10_chart. Vedic Parashari, not KP. Shown beside the KP verdict as a
 * cross-system reference and never merged into it.
 */
export type D10CrossSystem = {
  ascendant: string;
  tenthLord: string;
  planetsInTenth: string[];
  strongestCareerPlanet: string;
};

export type CareerFitResponse = {
  resolvedLocation: ResolvedLocation;
  audit: PreVerdictAudit;
  promise: {
    career: CareerPromise;
  };
  fit: {
    careerBalance: CareerBalance;
    categories: CareerCategoryScore[];
    axes: CareerAxes;
    occupations: OccupationMatch[];
    topFamilies: string[];
    noSettledOccupationFlag: boolean;
    profession: ProfessionDescription;
  };
  mode: {
    jobVsBusiness: JobVsBusinessVerdict;
  };
  timing: {
    promotion: PromotionVerdict;
    jobChange: JobChangeTiming;
    earnedIncome: EarnedIncomePanel;
  };
  blockage: CareerBlockage;
  crossSystem: {
    d10: D10CrossSystem;
    /** Always the fixed note from the prompt. Rendered next to the D10 chip. */
    note: string;
  };
  confidence: {
    boundaryWarnings: BoundaryWarning[];
  };
  /** Mandated in the prompt, validated on arrival, rendered by DisclaimerBanner. */
  disclaimer: string;
};
