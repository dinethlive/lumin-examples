export type ProductCategory =
  | "flowers"
  | "cakes"
  | "chocolates"
  | "jewelry"
  | "electronics"
  | "hampers"
  | "home"
  | "fashion"
  | "toys"
  | "food";

export type PersonalityTrait =
  | "warm"
  | "intellectual"
  | "luxurious"
  | "traditional"
  | "homebody"
  | "elegant"
  | "practical"
  | "celebratory"
  | "nurturing"
  | "playful";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  price_lkr: number;
  traits: PersonalityTrait[];
  hue: string;
};

// A named chart reading the model surfaces beside the trait list, e.g. the
// Arudha Lagna public image, the Jaimini Atmakaraka core drive, or the
// strongest planet by Shadbala. Keeps the personality read auditable.
export type ChartSignal = {
  label: string;
  value: string;
  detail: string;
};

export type Personality = {
  label: string;
  traits: PersonalityTrait[];
  summary: string;
  signals: ChartSignal[];
};

export type Match = {
  id: string;
  reason: string;
};

/** Where the model placed the birth city. It names the zone, never an offset. */
export type ModelLocation = {
  latitude: number;
  longitude: number;
  /** IANA name, such as "Asia/Colombo". Lumin reads the offset at birth from it. */
  time_zone: string;
  note: string;
};

/** What the page shows. The route computes the offset at birth from the zone. */
export type ResolvedLocation = ModelLocation & {
  utc_offset_minutes: number;
};

export type MatchResponse = {
  resolved_location: ResolvedLocation;
  personality: Personality;
  matches: Array<Match & Product>;
  /** Mandated in the prompt, validated on arrival, rendered by PersonalityCard. */
  disclaimer: string;
};

export type BiologicalSex = "female" | "male" | "unspecified";

export type BirthInput = {
  name: string;
  birth_date: string;
  birth_time: string;
  birth_time_known: boolean;
  location_name: string;
  biological_sex: BiologicalSex;
};
