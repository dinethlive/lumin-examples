/**
 * The response shapes this app renders. Every field is filled by a named
 * tool, and the comment says which one, so a developer forking this knows
 * exactly what to drop when they drop a tool from an ALLOWED_TOOLS list.
 */

/**
 * get_election_catalog. BOOK_SOURCED and WEB_SOURCED are a quoted claim.
 * DERIVED_TABLE_D and DERIVED_CUSP_RULE are a generated one. Never render the
 * two kinds the same way, that is the whole point of this field.
 */
export type ElectionProvenance =
  | "BOOK_SOURCED"
  | "WEB_SOURCED"
  | "DERIVED_TABLE_D"
  | "DERIVED_CUSP_RULE";

export type ElectionGranularity = "day" | "hour" | "minute";

/** get_election_catalog, one row of `events[]`. */
export type CatalogEvent = {
  key: string;
  label: string;
  aliases: string[];
  matterHouses: number[];
  electedHouses: number[];
  primaryHouse: number;
  avoidHouses: number[];
  provenance: ElectionProvenance;
  /** "<book>, <page>" when a citation exists, else null. */
  citation: string | null;
  defaultGranularity: ElectionGranularity;
  electionType: string;
};

export type CatalogResponse = {
  events: CatalogEvent[];
  totalItems: number;
  disclaimer: string;
};

// ─── Shared input shapes ──────────────────────────────────────────────────

export type BirthInput = {
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:MM
  birthTimeKnown: boolean;
  /** Free text, e.g. "Colombo, Sri Lanka". The model resolves it to coordinates. */
  birthLocation: string;
};

/** The hours the caller can actually use. The single highest-impact field. */
export type PreferredHours = {
  start: string; // "09:00"
  end: string; // "17:00", earlier than start means the window wraps past midnight
  label: string; // e.g. "office hours". May be empty.
};

// ─── Elect one moment (find_*_time / find_election_window) ───────────────

export type ElectInput = {
  eventKey: string;
  eventLabel: string;
  /**
   * The rest of the event's catalog row, carried forward from the screen-1
   * fetch of get_election_catalog. The route builds the response's "event"
   * object from THESE fields, not from anything the model says, so the
   * provenance chip on the result screen can never disagree with the one on
   * the picker screen.
   */
  eventElectedHouses: number[];
  eventExcludedHouses: number[];
  eventProvenance: ElectionProvenance;
  eventCitation: string | null;
  eventDefaultGranularity: ElectionGranularity;
  birth: BirthInput;
  /** Free text. Empty means "same as birth place". */
  eventLocation: string;
  scanStart: string; // YYYY-MM-DD, first day of the window
  scanDays: number;
  granularity: ElectionGranularity;
  preferredHours: PreferredHours;
};

export type ElectedMoment = {
  startLocal: string;
  endLocal: string;
  durationMinutes: number;
  layersSatisfied: 1 | 2 | 3 | 4;
  verdict: "FOUR_LAYER" | "THREE_LAYER" | "TWO_LAYER" | "PERIOD_ONLY";
  /** What fixed this window: an ascendant-sub election is minutes wide, a moon-sub one is hours wide. */
  resolvingLayer: string;
  /** The test that decided, quoted from `windows[].discriminator`. */
  reason: string;
  matchedConditions: string[];
  /** 1 for the elected moment, 2 and 3 for a genuine tie. */
  rank: number;
};

/** get_muhurta_advanced, the older T40 triangulation, run as a second opinion. */
export type CrossCheckMoment = {
  datetime: string;
  datetimeEnd: string;
  durationMinutes: number;
  /** 0 to 3. 3 is full triangulation, 2 is workable. */
  conditionsMet: number;
  isFullTriangulation: boolean;
  matchedConditions: string[];
};

export type CrossCheck = {
  technique: "T40";
  moments: CrossCheckMoment[];
  note: string;
};

/** get_panchang, for the date the elected moment falls on. */
export type PanchangAtMoment = {
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  weekday: string;
  sunriseLocal: string;
  sunsetLocal: string;
};

/** get_choghadiya_today, the period that CONTAINS the elected moment. */
export type ChoghadiyaAtMoment = {
  name: string;
  lord: string;
  quality: "auspicious" | "neutral" | "inauspicious";
  startLocal: string;
  endLocal: string;
  interpretation: string;
};

export type DayContext = {
  panchang: PanchangAtMoment | null;
  choghadiyaAtMoment: ChoghadiyaAtMoment | null;
};

/** get_boundary_warnings, filtered to CRITICAL/CAUTION targets only. */
export type BoundaryFlag = {
  /** e.g. "cusp_7" or "planet_Moon". */
  target: string;
  severity: "CRITICAL" | "CAUTION";
  distanceArcmin: number;
  note: string;
};

export type Confidence = {
  /** "stable": no flags. "watch": CAUTION only. "sensitive": at least one CRITICAL. */
  band: "stable" | "watch" | "sensitive";
  criticalCount: number;
  cautionCount: number;
  note: string;
  flags: BoundaryFlag[];
};

export type ElectResponseEvent = {
  key: string;
  label: string;
  electedHouses: number[];
  excludedHouses: number[];
  provenance: ElectionProvenance;
  citation: string | null;
  defaultGranularity: ElectionGranularity;
};

/**
 * What the model actually produces. "event" is deliberately absent: the
 * route builds it from the validated request input (see ElectInput), which
 * already carries the catalog row screen 1 fetched, so the provenance chip
 * can never come from a hallucination.
 */
export type ElectModelOutput = {
  /** One moment, or up to three on a genuine tie. Never a ranked top ten. */
  moments: ElectedMoment[];
  tie: boolean;
  crossCheck: CrossCheck | null;
  dayContext: DayContext;
  confidence: Confidence;
  summary: string;
  disclaimer: string;
};

export type ElectResponse = ElectModelOutput & {
  event: ElectResponseEvent;
};

// ─── Rank dates already in hand (rank_candidate_dates) ────────────────────

export type RankInput = {
  eventKey: string;
  eventLabel: string;
  eventElectedHouses: number[];
  eventProvenance: ElectionProvenance;
  birth: BirthInput;
  eventLocation: string;
  candidateDates: string[]; // 2 to 10, YYYY-MM-DD
  granularity: ElectionGranularity;
  preferredHours: PreferredHours;
};

export type RankedDate = {
  rank: number;
  dateLocal: string;
  layersSatisfied: 1 | 2 | 3 | 4;
  verdict: "FOUR_LAYER" | "THREE_LAYER" | "TWO_LAYER" | "PERIOD_ONLY";
  /** startLocal to endLocal of the best window on this date, or null. */
  bestWindowLocal: string | null;
  reason: string;
};

export type RankResponseEvent = {
  key: string;
  label: string;
  electedHouses: number[];
  provenance: ElectionProvenance;
};

/** "event" is absent for the same reason as ElectModelOutput: the route builds it from input. */
export type RankModelOutput = {
  rankedDates: RankedDate[];
  confidence: Confidence;
  summary: string;
  disclaimer: string;
};

export type RankResponse = RankModelOutput & {
  event: RankResponseEvent;
};
