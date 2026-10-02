# Wellness Matcher

This Lumin example is a single-page widget. It reads a customer's KP/Vedic chart. It returns two
things: their **Ayurvedic prakriti** (a Vata / Pitta / Kapha mix) and 4 recommended products from an
Ayurvedic personal-care catalog. The reasons come from the chart, not from a generic quiz.

**Vertical:** D2C wellness and Ayurvedic personal-care brands (Spa Ceylon, Forest Essentials, Kama
Ayurveda, Khadi, Just Herbs, and similar). The catalog ships with 24 sample products in 5
categories. Fork the app and replace the samples with your own SKUs.

<!-- screenshot: docs/wellness-matcher.png -->

## What it wires

| Tool | What it contributes | System |
|---|---|---|
| `set_birth_profile` | Checks the birth inputs and returns the reading plan | KP |
| `get_full_chart` | Ascendant, planets, dasha overview | KP |
| `get_planets` | Detailed positions, dignities, retrograde flags | KP |
| `get_house_cusps` | All 12 cusps with sign lord, star lord, sub lord | KP |
| `get_nakshatra_details` | Moon nakshatra and pada | KP |
| `get_aspects_and_strength` | Whole-sign aspect geometry and a 0-100 house strength score | Vedic Parashari, cross-system reference |
| `get_boundary_warnings` | Sub-lord credibility check. A CRITICAL flag within 6 arc-minutes warns that a small correction may flip the prakriti read | KP |
| `get_ayurvedic_constitution` | The vata/pitta/kapha percentage triple, primary and secondary dosha. This app's own spine | Vedic Parashari, cross-system reference |
| `get_shadbala` | Six-fold planetary strength (Sthana, Dig, Kala, Cheshta, Naisargika, Drik). The app uses it to judge which dosha-carrying planet is truly strong | Vedic Parashari, cross-system reference |

Three of the nine tools are Vedic Parashari, not orthodox Krishnamurti Paddhati (KP). One of them is
the app's own spine, `get_ayurvedic_constitution`. The system prompt tags each one inline. The
model's summary names them as a cross-system reading beside the KP layer, never as a KP finding.
Roughly a third of the Lumin MCP server's surface is not KP. So this discipline matters on almost
every app built on it, not only this one.

One omission is deliberate. **This app does not wire `check_doshas`.** It is a Vedic Parashari tool,
but it detects classical chart afflictions, not Ayurvedic constitution. Examples are Manglik,
Kalsarpa, Sadhe Sati, Pitra Dosha and Kemadruma. Despite its name, it would add marriage and karma
signals to a constitution read.

The health tools (`get_health_organ_panel`, `get_chronic_disease_panel`) are also out of scope here.
They are too clinical for a discussion starter. The sibling `health-risk-analyzer` is the right home
for them.

## What it costs

| Path | Calls per match |
|---|---|
| As shipped, all nine tools | **9** |
| Minimum useful matcher (`get_full_chart` and `get_ayurvedic_constitution` only) | 2 |

The free plan is 300 tool calls a month per account, shared by all of its keys. So the shipped path
runs about 33 matches a month on the free plan. The minimum path loses the credibility check, the
constitution drivers that Shadbala ranks, and most of the KP foundation. It still returns a real
prakriti read.

## The detail worth copying

**The business logic lives in the server-side prompt**, `src/lib/prompt.ts`. It holds the city
resolution, the planet-to-dosha mapping, the prakriti weighting and the catalog rules. The Lumin
tools stay generic. The same pattern works for any vertical. To ship a new feature, change the
prompt and the catalog.

The form asks for the birth city as free text, such as "Colombo, Sri Lanka", "Mumbai" or "Brooklyn,
NY". The model resolves the city to coordinates and an IANA time zone from its own
geographic knowledge. It never types a UTC offset, because Lumin reads the offset in force at birth
from the zone. So the demo needs no separate geocoding API. The response shows the coordinates, the
zone and the offset at birth, so a visitor can check that the app used the right city. For
production traffic, use a real geocoding API (OpenCage, Google, Nominatim) before the Lumin call.

## Birth-time fallback

Most e-commerce visitors do not know their exact birth time. The form lets them tick "I don't know
my birth time". When a visitor ticks it:

- The app uses 12:00 noon as the birth time.
- The prompt skips the ascendant and cusp logic. It uses only the planet placements and the Moon
  nakshatra.
- `get_ayurvedic_constitution` still returns a result. But its lagna-element bonus and its 1st-house
  weighting become unreliable.
- The summary begins with a note about this.

## Run it

```bash
# from the repo root
bun install
cp apps/wellness-matcher/.env.example apps/wellness-matcher/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/api-keys

bun run --filter wellness-matcher dev   # http://localhost:3100
```

## Make it yours

1. Replace `src/data/catalog.json` with your own products (same schema).
2. Edit `src/lib/prompt.ts` to adjust the planet-to-dosha mapping or add your brand's voice.
3. Restyle `src/app/globals.css` and `src/components/*` with your colors and typography.
4. Add a personal timing layer. With `get_smart_current_dasha` or `get_sublord_changes`, a product
   page could say "favorable this week". The app would not become a full reading.

## The disclaimer it ships

> A hybrid discussion starter, not a clinical Ayurvedic prakriti reading and not standalone health
> advice. It is a supplementary lens only, blending a KP chart read with the Vedic Parashari
> `get_ayurvedic_constitution` mapping.

The system prompt requires it. The route checks it as a required field when the response arrives.
`PrakritiCard` shows it below the constitution drivers. The disclaimer itself names the cross-system
blend, not only the tool table above. This is deliberate. A visitor who never reads the README still
sees that this is not a pure KP verdict.

## License

MIT.
