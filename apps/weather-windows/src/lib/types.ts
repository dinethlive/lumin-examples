/** The engine's band for one channel, exactly as the tool returns it. */
export type ChannelBand = "VERY_LOW" | "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";

export type ChannelId = "temperature" | "precipitation" | "wind";

/**
 * One weather channel as the tool returns it. The score is the engine's raw
 * number, not a percentage: temperature and precipitation are signed (negative
 * is cold or dry), wind/storm runs from zero upward.
 */
export type Channel = {
  band: ChannelBand;
  score: number;
  /** The tool's `signal` line, word for word. */
  signal: string;
  /** Labels of the signatures that fired, in the tool's order. */
  signatures: string[];
};

/** The engine's overall disposition for one chart. */
export type Disposition = "WET" | "DRY" | "HOT" | "STORMY" | "MIXED" | "SETTLED";

export type CslVerdictWord = "RAIN" | "HEAT" | "DRY" | "MIXED" | "INDETERMINATE";

/** The 4th-cusp sub lord verdict (cslFourth), as the tool returns it. */
export type CslFourth = {
  sub_lord: string;
  star_lord: string;
  signified_houses: number[];
  verdict: CslVerdictWord;
  /** The tool's final reasoning step (Step 4), word for word. */
  reasoning: string;
};

/** The Sapta Nadi Chakra block (saptaNadi). Classical, not KP. */
export type SaptaNadi = {
  moon_nadi: string;
  moon_group: "RAIN" | "DRY" | "TRANSITIONAL";
  moon_intensifies_rain: boolean;
  precipitation_score: number;
  precipitation_band: string;
  storm_flag: boolean;
  drought_flag: boolean;
  rain_duration: string;
  group_counts: { RAIN: number; DRY: number; TRANSITIONAL: number };
};

export type Lunation = "new" | "full";

/** One row of get_weather_windows: the whole bundle for one lunation chart. */
export type WeatherWindow = {
  label: string;
  /** Local dates at the place, from window_start and window_end. */
  start: string;
  end: string;
  lunation: Lunation;
  temperature: Channel;
  precipitation: Channel;
  wind: Channel;
  csl: CslFourth;
  sapta_nadi: SaptaNadi;
  disposition: Disposition;
  summary: string;
};

/** From get_weather_csl_fourth with cadence 'seasons': the season covering the range. */
export type SeasonOutlook = {
  /** The tool's season name, such as "autumn". */
  season: string;
  year: number;
  frame: "tropical" | "sidereal";
  /** Local date of the cardinal ingress that opens the season. */
  ingress_date: string;
  csl: CslFourth;
};

/** From get_astro_weather: the signature for the place at the present moment. */
export type CurrentConditions = {
  datetime: string;
  temperature: Channel;
  precipitation: Channel;
  wind: Channel;
  csl: CslFourth;
  disposition: Disposition;
  summary: string;
};

/**
 * From get_monsoon_forecast: the Ardra Pravesha chart. The precipitation
 * channel and the onset chart's own rainfall favourability are separate reads
 * and can disagree; both are shown.
 */
export type MonsoonOutlook = {
  year: number;
  /** Local date of the Sun's entry into Ardra. */
  ingress_date: string;
  ingress_sect: "day" | "night";
  ascendant_sign: string;
  rainfall_favourability: ChannelBand;
  precipitation: Channel;
  csl: CslFourth;
  disposition: Disposition;
  summary: string;
};

/** The place as the model writes it, before the route adds the clock it used. */
export type ModelLocation = {
  latitude: number;
  longitude: number;
  /** The IANA zone the place is in, from the model's own knowledge. */
  place_time_zone: string;
  label: string;
  note: string;
};

export type ResolvedLocation = {
  latitude: number;
  longitude: number;
  /** The zone the planner used, from the form. */
  time_zone: string;
  /** Minutes east of UTC in time_zone at the range start. Every tool call used it. */
  utc_offset_minutes: number;
  /** Set when clocks change inside the range: the offset at the range end. */
  utc_offset_minutes_at_end?: number;
  /**
   * Set when the place's own zone runs a different offset at the range start.
   * The window times are then on the wrong clock, so the page says so.
   */
  zone_mismatch?: { place_time_zone: string; place_offset_minutes: number };
  label: string;
  note: string;
};

/** The JSON the model writes, before the route sets the place's clock. */
export type ForecastModelResponse = Omit<ForecastResponse, "resolved_location"> & {
  resolved_location: ModelLocation;
};

export type ForecastResponse = {
  resolved_location: ResolvedLocation;
  range: { start: string; end: string };
  season: SeasonOutlook;
  current?: CurrentConditions | null;
  monsoon?: MonsoonOutlook | null;
  windows: WeatherWindow[];
  /** The app's own disclaimer. */
  disclaimer: string;
  /** The weather tools' own disclaimer, word for word. */
  tool_disclaimer: string;
  /** The Sapta Nadi block's own disclaimer, word for word. */
  sapta_nadi_disclaimer: string;
};

export type ForecastInput = {
  location_name: string;
  start_date: string;
  end_date: string;
  /** IANA time zone of the place, such as "Asia/Colombo". The route reads the offset from it. */
  time_zone: string;
};

/** The input after the route read the offsets for the range from the time zone. */
export type ResolvedForecastInput = ForecastInput & {
  utc_offset_minutes: number;
  utc_offset_minutes_at_end: number;
  /** The wall clock at the place now, YYYY-MM-DDTHH:MM:SS, for get_astro_weather. */
  now_local: string;
  /** Minutes east of UTC in the zone now, for get_astro_weather. */
  now_utc_offset_minutes: number;
};
