/**
 * The response shapes this app renders. Every field is filled by a named
 * tool, and the comment says which one, so a developer forking this knows
 * exactly what to drop when they drop a tool from ALLOWED_TOOLS.
 */

export type QuestionType = "general" | "medical" | "career" | "lost" | "arrival";

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "general", label: "General / anything else" },
  { value: "medical", label: "Health (will I recover, is it serious)" },
  { value: "career", label: "Career (job, promotion, interview)" },
  { value: "lost", label: "Lost, stolen or missing" },
  { value: "arrival", label: "When will they get here" },
];

export type AskInput = {
  question: string;
  /**
   * The user's own classification, when they set one. "null" means auto:
   * the model classifies the question itself. Set, this OVERRIDES the
   * model's own read of the text, per the routing rule this app follows.
   */
  questionTypeHint: QuestionType | null;
  /** 1 to 249. The querent's own number, never invented by the model. */
  number: number;
  latitude: number;
  longitude: number;
  utcOffsetMinutes: number;
};

/** The moment and place of judgment. Never a birth: KP horary reads the sky
 * at the instant the question was cast, at the latitude of judgment. */
export type Moment = {
  datetimeUTC: string;
  latitude: number;
  longitude: number;
  utcOffsetMinutes: number;
};

export type GateVerdict = "ANSWERED" | "WITHHELD";

/**
 * From get_horary_chart_v2's moonConnectivity check, folded together with a
 * type-specific tool's own withhold verdict when one exists (get_medical_horary
 * and get_career_horary both carry a WITHHELD value in their own verdict enum,
 * and get_lost_or_missing can return WITHHELD when its 11th cuspal sub lord has
 * no overlap with either the recovery or the loss houses). Either source can
 * flip this to WITHHELD; the reason names which one fired.
 */
export type Gate = {
  moonConnected: boolean;
  verdict: GateVerdict;
  reason: string;
};

/** One step of the reasoning trail. `rule` names the KP principle applied,
 * `result` is what the tool actually returned for this chart. */
export type ReasoningStep = {
  step: string;
  rule: string;
  result: string;
};

export type TimingWindow = {
  fromDate: string;
  toDate: string;
  basis: string;
};

export type ConfidenceLevel = "high" | "moderate" | "low";

/**
 * The core reading. `label` is the plain-language answer, `confidence` comes
 * from get_horary_advanced's number-intuition check (self-confirmatory number
 * reads high, a weakly-chosen number reads moderate). requiredHouses/covered/
 * missing come straight off get_horary_chart_v2's moonConnectivity block.
 */
export type Verdict = {
  label: string;
  confidence: ConfidenceLevel;
  requiredHouses: number[];
  covered: number[];
  missing: number[];
};

/** get_lost_or_missing. Never names a real individual as the thief; the tool
 * itself only returns a class description (stature, age, relation-class). */
export type LostTypeSpecific = {
  kind: "lost";
  direction: string;
  distanceClass: string;
  inHouseLocation: string;
  recoveryVerdict: string;
  thiefDescription: string | null;
};

/** get_career_horary. One of 14 sourced query types, its own verdict scale
 * (YES / QUALIFIED_YES / MIXED / NO / WITHHELD). */
export type CareerTypeSpecific = {
  kind: "career";
  queryType: string;
  verdict: string;
  notes: string[];
};

/** get_medical_horary. Own verdict scale (RECOVERY / SLOW_RECOVERY /
 * DETERIORATION / MIXED / WITHHELD). Supplementary lens, never diagnostic. */
export type MedicalTypeSpecific = {
  kind: "medical";
  queryType: string;
  verdict: string;
  notes: string[];
};

/** get_arrival_timing. Own verdict scale (PROMISED_EARLY / PROMISED_LATER /
 * OBSTRUCTED / REFUSED / UNKNOWN). `scale` names which hand of the clock to
 * move (hours / days / longer), it is not a timestamp. */
export type ArrivalTypeSpecific = {
  kind: "arrival";
  subject: string;
  verdict: string;
  scale: string | null;
  scaleBasis: string | null;
};

export type TypeSpecific =
  | LostTypeSpecific
  | CareerTypeSpecific
  | MedicalTypeSpecific
  | ArrivalTypeSpecific
  | null;

export type HoraryResponse = {
  question: string;
  questionType: QuestionType;
  number: number;
  moment: Moment;
  /** The catalog event get_horary_chart_v2 and get_horary_advanced were
   * checked against (e.g. "Career / Job Start"). For "lost" and "arrival"
   * this is a labelled proxy: the 76-event catalog has no dedicated "lost
   * article" or "awaited arrival" entry, so the closest thematic match is
   * used and named here rather than silently forced. */
  event: string;
  gate: Gate;
  /** Null exactly when gate.verdict is "WITHHELD". A withheld chart is a
   * complete, honest answer, never rendered as an error. */
  verdict: Verdict | null;
  reasoning: ReasoningStep[];
  timing: { windows: TimingWindow[] };
  typeSpecific: TypeSpecific;
  /** Mandated in the prompt, validated on arrival, rendered by DisclaimerNote. */
  disclaimer: string;
};

// ─── Screen 3: the serial follow-up (get_horary_serial) ───────────────────────

export type TrendSession = {
  question: string;
  number: number;
  datetimeUTC: string;
};

export type TrendInput = {
  topic: string;
  /** Chronological, at least 2. Session 1 is the original reading; session 2
   * (and any later ones) are asked again, right now, with a fresh number. */
  sessions: TrendSession[];
  latitude: number;
  longitude: number;
  utcOffsetMinutes: number;
};

export type TrendDelta = "IMPROVED" | "WORSENED" | "SAME";

export type TrendSnapshot = {
  label: string;
  datetimeUTC: string;
  verdict: string;
  coveragePercent: number;
  deltaFromPrevious: TrendDelta | null;
};

export type TrendResponse = {
  topic: string;
  snapshots: TrendSnapshot[];
  trend: string;
  summary: string;
  disclaimer: string;
};
