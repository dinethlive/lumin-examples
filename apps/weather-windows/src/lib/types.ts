export type ChannelLevel = "calm" | "mild" | "active" | "intense";

export type ChannelId = "temperature" | "precipitation" | "wind";

export type Channel = {
  level: ChannelLevel;
  band: string;
  score: number;
  note: string;
};

export type Lunation = "new-moon" | "full-moon";

export type OutdoorRating = "favourable" | "mixed" | "unfavourable";

export type WeatherWindow = {
  label: string;
  start: string;
  end: string;
  lunation: Lunation;
  temperature: Channel;
  precipitation: Channel;
  wind: Channel;
  csl_verdict: string;
  outdoor_rating: OutdoorRating;
  summary: string;
};

export type SeasonOutlook = {
  season: string;
  theme: string;
};

// From get_astro_weather: the signature for the place at a single moment
// (today), an "as of now" anchor shown beside the future lunation windows.
export type CurrentConditions = {
  datetime: string;
  temperature: Channel;
  precipitation: Channel;
  wind: Channel;
  csl_verdict: string;
  summary: string;
};

// From get_monsoon_forecast: the monsoon-onset read from the Ardra Pravesha
// chart. Populated only for monsoon-influenced places whose range overlaps the
// season; null otherwise.
export type MonsoonOutlook = {
  year: number;
  onset: string;
  precipitation: Channel;
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
  best_window: string;
  disclaimer: string;
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
};
