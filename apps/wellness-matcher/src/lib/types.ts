export type Dosha = "vata" | "pitta" | "kapha";

export type DoshaImpact = "pacify" | "neutral" | "aggravate";

export type ProductCategory =
  | "skin"
  | "hair"
  | "mind-body"
  | "lip"
  | "fragrance-home";

export type Potency = "warming" | "cooling" | "neutral";
export type Quality = "light" | "moderate" | "rich";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  ingredients: string[];
  pricing: { lkr: number; usd: number };
  doshaImpact: { vata: DoshaImpact; pitta: DoshaImpact; kapha: DoshaImpact };
  properties: { potency: Potency; quality: Quality };
  bestFor: string[];
  hue: string;
};

export type Prakriti = {
  primary: Dosha;
  secondary: Dosha | null;
  label: string;
};

// The vata/pitta/kapha percentage triple returned by get_ayurvedic_constitution
// (sums to 100). Surfaced so the prakriti reads as a balance, not a single label.
export type DoshaBalance = {
  vata: number;
  pitta: number;
  kapha: number;
};

// A planet that shapes the constitution, paired with its get_shadbala strength.
// A dosha-carrying planet that is also strong by Shadbala is a high-confidence
// driver; one that is weak is a softer influence.
export type ConstitutionDriver = {
  planet: string;
  dosha: Dosha;
  strength: number;
  note: string;
};

export type Match = {
  id: string;
  reason: string;
};

export type ResolvedLocation = {
  latitude: number;
  longitude: number;
  utc_offset_minutes: number;
  note: string;
};

export type MatchResponse = {
  resolved_location: ResolvedLocation;
  prakriti: Prakriti;
  dosha_balance: DoshaBalance;
  constitution_drivers: ConstitutionDriver[];
  summary: string;
  matches: Array<Match & Product>;
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
