export type SystemId =
  | "cardiovascular"
  | "respiratory"
  | "digestive"
  | "nervous-mental"
  | "musculoskeletal"
  | "endocrine-metabolic"
  | "reproductive-urinary"
  | "immune-vitality";

export type RiskLevel = "low" | "moderate" | "elevated" | "high";

export type VitalityLabel = "robust" | "balanced" | "fragile";

export type ChronicityTendency = "acute" | "chronic" | "mixed";

export type BodySystem = {
  id: SystemId;
  label: string;
  subtitle: string;
  primary_planets: string[];
  secondary_planets: string[];
  primary_signs: string[];
  primary_houses: number[];
  ruling_karaka: string;
  common_concerns: string[];
  aggravating_factors: string[];
  hue: string;
};

export type ResolvedLocation = {
  latitude: number;
  longitude: number;
  utc_offset_minutes: number;
  note: string;
};

export type VitalityIndex = {
  score: number;
  label: VitalityLabel;
  summary: string;
};

export type ConstitutionalBasis = {
  ascendant: string;
  ascendant_lord: string;
  ascendant_lord_strength: number;
  moon_sign: string;
  moon_nakshatra: string;
  active_dasha: string;
  notes: string;
};

export type SystemRisk = {
  system: SystemId;
  risk_level: RiskLevel;
  severity_score: number;
  primary_indicators: string[];
  peak_window: {
    start: string;
    end: string;
    trigger: string;
  } | null;
  preventive_focus: string;
};

export type TimingWindow = {
  start: string;
  end: string;
  reason: string;
};

export type ScreeningEntry = {
  month: string;
  test: string;
  system: SystemId;
  rationale: string;
};

export type ChronicityProfile = {
  tendency: ChronicityTendency;
  reasoning: string;
};

export type ConfidenceBand = "high" | "moderate" | "low";

// From run_pre_verdict_audit: bundles the sub-lord boundary check, combustion,
// planetary war, and vargottama strength into one confidence modifier.
export type ChartConfidence = {
  band: ConfidenceBand;
  modifier: number;
  summary: string;
};

// From get_health_organ_panel: per-sign body-region affliction scoring, the
// engine-backed version of the Kaalpurusha (sign to body part) mapping.
export type OrganRegion = {
  region: string;
  sign: string;
  score: number;
  note: string;
};

export type OrganPanel = {
  highest_risk_region: string;
  summary: string;
  regions: OrganRegion[];
};

export type SaturnCycleStatus = "active" | "approaching" | "clear";

// From get_sade_sati_phases (status/phase/window) plus get_sade_sati_intensity:
// the sub-lord-resolved intensity peak inside the current or next phase. The
// intensity fields are optional so a phases-only read still validates.
export type SaturnCycle = {
  status: SaturnCycleStatus;
  phase: string;
  window: { start: string; end: string } | null;
  note: string;
  // 0-100 peak intensity within the phase (Saturn-in-sub-of-Saturn = peak,
  // sub-of-Jupiter = relief), from get_sade_sati_intensity.
  intensity?: number | null;
  // the highest-intensity sub-window inside the phase.
  peak_window?: { start: string; end: string } | null;
  // a short theme word for the peak (for example "health-stress peak").
  peak_theme?: string | null;
};

export type AnalysisResponse = {
  resolved_location: ResolvedLocation;
  vitality_index: VitalityIndex;
  chart_confidence: ChartConfidence;
  constitutional_basis: ConstitutionalBasis;
  chronicity_profile: ChronicityProfile;
  system_risks: SystemRisk[];
  organ_panel: OrganPanel;
  saturn_cycle: SaturnCycle;
  surgery_windows: TimingWindow[];
  recovery_periods: TimingWindow[];
  screening_calendar: ScreeningEntry[];
  disclaimer: string;
};

export type SystemRiskHydrated = SystemRisk & { meta: BodySystem };

export type AnalysisResponseHydrated = Omit<AnalysisResponse, "system_risks"> & {
  system_risks: SystemRiskHydrated[];
};

export type BirthInput = {
  name: string;
  birth_date: string;
  birth_time: string;
  birth_time_known: boolean;
  location_name: string;
  biological_sex: "female" | "male" | "unspecified";
};
