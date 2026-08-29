/**
 * The response shape this app renders. Every field is filled by a named tool,
 * and the comment says which one, so a developer forking this knows exactly
 * what to drop when they drop a tool from ALLOWED_TOOLS.
 *
 * Eleven tool calls fill this per match: get_boundary_warnings x2,
 * get_ashta_koota_milan x1, check_compatibility x1, get_compatibility_advanced
 * x1, check_doshas x2, get_kalsarpa_variants x2, get_spouse_characteristics x2.
 * See src/lib/prompt.ts for the exact call plan and why each tool is called
 * once or twice.
 */

export type Gender = "female" | "male" | "other";

export type PersonInput = {
  /** Free text, used only for labelling. */
  name: string;
  /** YYYY-MM-DD */
  birth_date: string;
  /** HH:MM. Ignored (defaulted to noon) when birth_time_known is false. */
  birth_time: string;
  birth_time_known: boolean;
  /** Free text, e.g. "Colombo, Sri Lanka". The model resolves it to coordinates. */
  location_name: string;
  /**
   * Minutes east of UTC, given directly rather than resolved by the model.
   * A KP cuspal sub lord can flip on a boundary a few arc-minutes wide (see
   * get_boundary_warnings), and the offset feeds the Ascendant calculation
   * directly, so a model's guess at a historical timezone is not good enough
   * here the way it can be for a lower-stakes lookup.
   */
  utc_offset_minutes: number;
  gender: Gender;
};

export type MatchInput = {
  personA: PersonInput;
  personB: PersonInput;
};

export type Recommendation = "STRONG" | "WORKABLE" | "REVIEW";
export type AgreementLevel = "HIGH" | "MIXED" | "LOW";

export type Headline = {
  recommendation: Recommendation;
  agreement: AgreementLevel;
  /** 2-3 sentences. Descriptive, never a verdict on the relationship itself. */
  summary: string;
};

/** get_ashta_koota_milan. Vedic Parashari, not orthodox KP. */
export type Koota = {
  name: string;
  score: number;
  max: number;
  note: string;
};

export type AshtaKootaBand = "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR";

/** get_ashta_koota_milan. The traditional 36-point Guna Milan, all 8 kootas. */
export type AshtaKoota = {
  total: number;
  outOf: number;
  band: AshtaKootaBand;
  nadiDosha: boolean;
  bhakootDosha: boolean;
  kootas: Koota[];
};

/** check_compatibility. KP, the 7-factor score. */
export type SevenFactor = {
  name: string;
  score: number;
  weight: number;
  note: string;
};

export type SevenFactorVerdict = "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR";

export type KpSevenFactor = {
  overallScore: number;
  verdict: SevenFactorVerdict;
  factors: SevenFactor[];
};

/** get_compatibility_advanced. KP, the rigorous 6-cuspal-sub-lord-factor read. */
export type CuspalFactor = {
  name: string;
  verdict: string;
  /** The sub-lord chain the verdict rests on, in plain language. */
  chain: string;
};

export type CuspalVerdict = "EXCELLENT" | "GOOD" | "AVERAGE" | "BELOW_AVERAGE" | "POOR";

export type KpCuspal = {
  verdict: CuspalVerdict;
  /** The tool's own note on why it replaces Vedic Porutham. */
  porouthamRejectionNote: string;
  factors: CuspalFactor[];
};

export type Systems = {
  ashtaKoota: AshtaKoota;
  kpSevenFactor: KpSevenFactor;
  kpCuspal: KpCuspal;
};

export type DoshaSeverity = "None" | "Mild" | "Moderate" | "Severe";

/** check_doshas, Manglik entry, read for both people. */
export type ManglikStatus = {
  present: boolean;
  severity: DoshaSeverity;
};

/** check_doshas (present/absent) crossed with get_kalsarpa_variants (which one). */
export type KalsarpaStatus = {
  present: boolean;
  /** PARTIAL = 1-2 planets just outside the Rahu-Ketu axis. */
  full: boolean;
  /** e.g. "Vasuki (Rahu in 3rd)". Null when not present. */
  variant: string | null;
};

export type Doshas = {
  manglik: { personA: ManglikStatus; personB: ManglikStatus };
  kalsarpa: { personA: KalsarpaStatus; personB: KalsarpaStatus };
  /**
   * check_doshas ships the KP corpus's own dissent from the Manglik premise
   * alongside the traditional computation (Reader 4: "it is not left to Mars
   * alone"). Pulled from the tool's own response text, never invented.
   */
  kpDissent: string;
};

/** get_spouse_characteristics, run once per chart. */
export type SpouseProfile = {
  workArchetype: string;
  relativeAge: string;
  background: string;
  wealth: string;
  personality: string;
  physical: string;
};

export type PartnerProfile = {
  /** What Person A's own chart says about their spouse, i.e. Person B's archetype. */
  forPersonA: SpouseProfile;
  /** What Person B's own chart says about their spouse, i.e. Person A's archetype. */
  forPersonB: SpouseProfile;
};

/** The drawer: where the three systems part company, and why, in the traditions' own terms. */
export type Disagreement = {
  topic: string;
  systemA: string;
  systemB: string;
  explanation: string;
};

export type ConfidenceBand = "high" | "moderate" | "low";

/** get_boundary_warnings, run once per chart. */
export type PersonConfidence = {
  band: ConfidenceBand;
  criticalCount: number;
  cautionCount: number;
  note: string;
};

export type Confidence = {
  personA: PersonConfidence;
  personB: PersonConfidence;
};

export type MatchResponse = {
  headline: Headline;
  systems: Systems;
  doshas: Doshas;
  partnerProfile: PartnerProfile;
  disagreements: Disagreement[];
  confidence: Confidence;
  /** Mandated in the prompt, validated on arrival, rendered by DisclaimerNote. */
  disclaimer: string;
};
