/**
 * The response shape this app renders. Every field is filled by a named tool,
 * and the comment says which one, so a developer forking this knows exactly
 * what to drop when they drop a tool from ALLOWED_TOOLS.
 */

export type PlaceInput = {
  /** Free text, e.g. "Colombo, Sri Lanka". The model resolves it to coordinates. */
  city: string;
  /**
   * Minutes east of UTC. Required, not optional: the astrological day runs
   * sunrise to sunrise, so the offset is what decides which civil day is meant.
   * Getting this wrong makes every band a day early east of Greenwich.
   */
  utcOffsetMinutes: number;
  /** YYYY-MM-DD. Defaults to the visitor's today. */
  date: string;
};

export type ResolvedPlace = {
  label: string;
  latitude: number;
  longitude: number;
  utcOffsetMinutes: number;
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

export type TodayResponse = {
  place: ResolvedPlace;
  date: string;
  panchang: Panchang;
  choghadiya: ChoghadiyaPeriod[];
  hora: HoraHour[];
  moon: MoonNow;
  nextChanges: SubLordChange[];
  /** One or two sentences. Descriptive, never advice. */
  summary: string;
  /** Mandated in the prompt, validated on arrival, rendered by DisclaimerNote. */
  disclaimer: string;
};
