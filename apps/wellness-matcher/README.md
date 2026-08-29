# Wellness Matcher

A Lumin example: a single-page widget that reads a customer's KP/Vedic chart and returns their
**Ayurvedic prakriti** (a Vata / Pitta / Kapha mix) plus 4 recommended products from an Ayurvedic
personal-care catalog, with reasoning grounded in the chart rather than a generic quiz.

**Vertical:** D2C wellness and Ayurvedic personal-care brands (Spa Ceylon, Forest Essentials, Kama
Ayurveda, Khadi, Just Herbs, and similar). The catalog ships with 24 sample products across 5
categories. Fork it and swap your own SKUs.

<!-- screenshot: docs/wellness-matcher.png -->

## What it wires

| Tool | What it contributes | System |
|---|---|---|
| `set_birth_profile` | Validates the birth inputs and returns the reading plan | KP |
| `get_full_chart` | Ascendant, planets, dasha overview | KP |
| `get_planets` | Detailed positions, dignities, retrograde flags | KP |
| `get_house_cusps` | All 12 cusps with sign lord, star lord, sub lord | KP |
| `get_nakshatra_details` | Moon nakshatra and pada | KP |
| `get_aspects_and_strength` | Whole-sign aspect geometry and a 0-100 house strength score | Vedic Parashari, cross-system reference |
| `get_boundary_warnings` | Sub-lord credibility check; a CRITICAL flag within 6 arc-minutes warns the prakriti read may flip on a small correction | KP |
| `get_ayurvedic_constitution` | The vata/pitta/kapha percentage triple, primary and secondary dosha. This app's own spine | Vedic Parashari, cross-system reference |
| `get_shadbala` | Six-fold planetary strength (Sthana, Dig, Kala, Cheshta, Naisargika, Drik), used to judge which dosha-carrying planet is genuinely strong | Vedic Parashari, cross-system reference |

Three of the nine tools are Vedic Parashari, not orthodox Krishnamurti Paddhati (KP), including the
app's own spine, `get_ayurvedic_constitution`. The system prompt tags each one inline and the
summary the model writes names them as a cross-system reading shown beside the KP layer, never as
a KP finding. Roughly a third of the Lumin MCP server's surface is non-KP, so this discipline
matters on almost every app built on it, not just this one.

One deliberate omission: **`check_doshas` is not wired here.** It is a Vedic Parashari tool but it
detects classical chart afflictions (Manglik, Kalsarpa, Sadhe Sati, Pitra Dosha, Kemadruma), not
Ayurvedic constitution, so despite the name it would pull marriage-and-karma signals into a
constitution read. The health-oriented tools (`get_health_organ_panel`, `get_chronic_disease_panel`)
are out of scope here too: too clinical for a discussion-starter. The sibling `health-risk-analyzer`
is the right home for those.

## What it costs

| Path | Calls per match |
|---|---|
| As shipped, all nine tools | **9** |
| Minimum useful matcher (`get_full_chart` and `get_ayurvedic_constitution` only) | 2 |

The free plan is 300 tool calls per month per credential, so the shipped path runs about 33 matches
a month on the free tier. Dropping to the minimum path trades away the credibility check, the
Shadbala-ranked constitution drivers, and most of the KP foundation, but still returns a real
prakriti read.

## The detail worth copying

**The business logic lives in the server-side prompt** (`src/lib/prompt.ts`): city resolution,
planet-to-dosha mapping, prakriti weighting, catalog rules. The Lumin tools stay generic. The same
pattern works for any vertical: change the prompt, change the catalog, ship a new feature.

The form asks for a free-text birth city ("Colombo, Sri Lanka", "Mumbai", "Brooklyn, NY"). The model
resolves it to coordinates and the historical UTC offset from its own geographic knowledge, so the
demo needs no separate geocoding API. The resolved coordinates are surfaced in the response so a
visitor can verify the right city was used. For production traffic, swap in a real geocoding API
(OpenCage, Google, Nominatim) before the Lumin call.

## Birth-time fallback

Most e-commerce visitors do not know their exact birth time. The form lets them tick "I don't know
my birth time": the app defaults to 12:00 noon and the prompt skips ascendant and cusp logic,
relying on planet placements plus Moon nakshatra only. `get_ayurvedic_constitution` still returns a
result, but its lagna-element bonus and 1st-house weighting become unreliable, and the summary
begins by saying so.

## Run it

```bash
# from the repo root
bun install
cp apps/wellness-matcher/.env.example apps/wellness-matcher/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/developer

bun run --filter wellness-matcher dev   # http://localhost:3100
```

## Make it yours

1. Replace `src/data/catalog.json` with your own products (same schema).
2. Edit `src/lib/prompt.ts` to adjust the planet-to-dosha mapping or add your brand's voice.
3. Restyle `src/app/globals.css` and `src/components/*` with your colors and typography.
4. Add a personal timing layer: `get_smart_current_dasha` or `get_sublord_changes` would let a
   product page say "favorable this week" without turning the app into a full reading.

## The disclaimer it ships

> A hybrid discussion starter, not a clinical Ayurvedic prakriti reading and not standalone health
> advice. It is a supplementary lens only, blending a KP chart read with the Vedic Parashari
> `get_ayurvedic_constitution` mapping.

It is mandated in the system prompt, validated as a required field when the response arrives, and
rendered by `PrakritiCard` beneath the constitution drivers. Naming the cross-system blend inside the
disclaimer itself, not just in the tool table above, is deliberate: a visitor who never reads the
README still sees that this is not a pure KP verdict.

## License

MIT.
