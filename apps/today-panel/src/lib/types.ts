/**
 * The response shape this app renders. Every field is filled by a named tool,
 * and the comment says which one, so a developer forking this knows exactly
 * what to drop when they drop a tool from ALLOWED_TOOLS.
 */

export type PlaceInput = {
  /** Free text, e.g. "Colombo, Sri Lanka". The model resolves it to coordinates. */
  city: string;
  /**
   * IANA time zone of the city, such as "Europe/London". The route reads the
   * offset for the date from it. The astrological day runs sunrise to sunrise,
   * so the offset decides which civil day is meant. A wrong one makes every
   * band a day early east of Greenwich.
   */
  timeZone: string;
  /** YYYY-MM-DD. Defaults to the visitor's today. */
  date: string;
};

/** The input after the route read the offset for the date from the time zone. */
export type ResolvedPlaceInput = PlaceInput & {
  utcOffsetMinutes: number;
  /**
   * The local wall clock (no zone suffix) the ruling planets are judged at:
   * the current minute when the date is today in timeZone, else local noon.
   */
  rpMomentLocal: string;
  /** True when rpMomentLocal is the current minute, false when it is noon on another date. */
  rpMomentIsNow: boolean;
};

/** The place as the model writes it, before the route adds the clock it used. */
export type ModelPlace = {
  label: string;
  latitude: number;
  longitude: number;
  /** The IANA zone the city is in, from the model's own knowledge. */
  cityTimeZone: string;
};

export type ResolvedPlace = {
  label: string;
  latitude: number;
  longitude: number;
  /** The zone the panel used, from the form. */
  timeZone: string;
  /** Minutes east of UTC in timeZone on the date. The route computes it. */
  utcOffsetMinutes: number;
  /**
   * Set when the city's own zone runs a different offset on the date. Every
   * time on the panel is then on the wrong clock, so the panel says so.
   */
  zoneMismatch?: { cityTimeZone: string; cityOffsetMinutes: number };
};

/** get_panchang */
export type Panchang = {
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  weekday: string;
  sunriseUTC: string;
  sunsetUTC: string;
  rahuKaal: { startUTC: string; endUTC: string };
  yamagandaKaal: { startUTC: string; endUTC: string };
  gulikaiKaal: { startUTC: string; endUTC: string };
};

export type BandQuality = "auspicious" | "neutral" | "inauspicious";

/** get_choghadiya_today. Eight day periods and eight night periods. */
export type ChoghadiyaPeriod = {
  name: string;
  lord: string;
  quality: BandQuality;
  startUTC: string;
  endUTC: string;
  interpretation: string;
  /** True for the period containing the moment asked about. */
  isCurrent: boolean;
};

/** get_hora_today. Twenty-four planetary hours, Chaldean order from sunrise. */
export type HoraHour = {
  lord: string;
  quality: BandQuality;
  startUTC: string;
  endUTC: string;
  interpretation: string;
  isCurrent: boolean;
};

/** get_moon_transit. The fastest hand on the KP clock, changes every 2 to 3 hours. */
export type MoonNow = {
  sign: string;
  starLord: string;
  subLord: string;
  minutesRemainingInSub: number;
  nextSubLord: string;
};

/** get_sublord_changes. No chart, no place: just what shifts next. */
export type SubLordChange = {
  planet: string;
  currentSubLord: string;
  nextSubLord: string;
  hoursUntilChange: number;
};

/** get_ruling_planets_at_judgement, holdsUntil.changes, one member changing lord. */
export type RulingPlanetChange = {
  member: string;
  from: string;
  to: string;
  cause: string;
};

/**
 * get_ruling_planets_at_judgement. The KP Ruling Planets of one moment at the
 * city: the five members, the ranked set, and the instant the set changes.
 */
export type RulingPlanetsNow = {
  /** The moment judged, local wall clock at the city. Set by the route, not the model. */
  momentLocal?: string;
  /** True when that moment is the current minute, false when it is noon on another date. */
  momentIsNow?: boolean;
  weekdayLord: string;
  moonSignLord: string;
  moonStarLord: string;
  ascSignLord: string;
  ascStarLord: string;
  /** rulingPlanets.ranked, strongest first, as returned. */
  ranked: string[];
  /** rulingPlanets.nodeRule, how Rahu and Ketu joined the set. */
  nodeRule: string;
  /** holdsUntil.instant, ISO UTC, or null when the tool returned no holdsUntil. */
  holdsUntilUTC: string | null;
  /** holdsUntil.changes. */
  changesAtHoldsUntil: RulingPlanetChange[];
};

/** The JSON the model writes, before the route sets the place's clock. */
export type TodayModelResponse = Omit<TodayResponse, "place"> & {
  place: ModelPlace;
};

export type TodayResponse = {
  place: ResolvedPlace;
  date: string;
  panchang: Panchang;
  choghadiya: ChoghadiyaPeriod[];
  hora: HoraHour[];
  moon: MoonNow;
  nextChanges: SubLordChange[];
  rulingPlanets: RulingPlanetsNow;
  /** One or two sentences. Descriptive, never advice. */
  summary: string;
  /** Mandated in the prompt, validated on arrival, rendered by DisclaimerNote. */
  disclaimer: string;
};
