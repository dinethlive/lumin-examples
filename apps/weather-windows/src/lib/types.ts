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

export type ResolvedLocation = {
  latitude: number;
  longitude: number;
  utc_offset_minutes: number;
  label: string;
  note: string;
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
};
