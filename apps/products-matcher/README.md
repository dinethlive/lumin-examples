# Products Matcher

A Lumin example: a single-page widget that reads a visitor's KP/Vedic chart and returns a
**consumer personality** read plus 5 product recommendations from a generalist e-commerce
catalog, with reasoning grounded in the chart rather than a generic quiz.

**Vertical:** generalist e-commerce sites with broad catalogs (Kapruka, Daraz, FernsNPetals,
Amazon-style marketplaces). The catalog ships with 30 sample products across 10 categories
(flowers, cakes, chocolates, jewelry, electronics, hampers, home, fashion, toys, food). Fork it and
swap your own SKUs.

<!-- screenshot: docs/products-matcher.png -->

## What it wires

| Tool | What it contributes | System |
|---|---|---|
| `set_birth_profile` | Validates the birth inputs and returns the reading plan | KP |
| `get_full_chart` | Ascendant, planets, dasha overview | KP |
| `get_planets` | Detailed positions, dignities, retrograde flags | KP |
| `get_house_cusps` | All 12 cusps with sign lord, star lord, sub lord | KP |
| `get_nakshatra_details` | Moon nakshatra and pada | KP |
| `get_aspects_and_strength` | Whole-sign aspect geometry and a 0-100 house strength score | Vedic Parashari, cross-system reference |
| `get_boundary_warnings` | Sub-lord credibility check; a CRITICAL lagna flag downweights ascendant-driven traits | KP |
| `get_shadbala` | Six-fold planetary strength, tests whether a "strong planet" trait claim is backed by strength or just placement | Vedic Parashari, cross-system reference |
| `get_arudha_lagna` | The Arudha Lagna, the projected public image; drives the **Public image** chart signal | Jaimini, cross-system reference |
| `get_chara_karakas` | The Atmakaraka, the soul's deepest craving; drives the **Core drive** signal | Jaimini, cross-system reference |
| `get_d2_chart` | The D2 (Hora) divisional chart, wealth-acquisition capacity; drives the **Spending capacity** signal | Vedic Parashari, cross-system reference |

Five of the eleven tools are not orthodox Krishnamurti Paddhati (KP): three Vedic Parashari, two
Jaimini. The system prompt tags each one inline, and the four chart signals shown in the personality
card (public image, core drive, strongest planet, spending capacity) name their system so a buyer
sees a cross-system reading, never a KP finding presented as one. Roughly a third of the Lumin MCP
server's surface is non-KP, so this discipline matters on almost every app built on it.

## What it costs

| Path | Calls per match |
|---|---|
| As shipped, all eleven tools | **11** |
| Minimum useful matcher (`get_full_chart` and `get_planets` only, trait mapping from sign placements) | 2 |

The free plan is 300 tool calls per month per credential, so the shipped path runs about 27 matches
a month on the free tier. The minimum path drops the credibility check and all four chart signals,
leaving only the sign-placement trait mapping.

## The detail worth copying

**The business logic lives in the server-side prompt** (`src/lib/prompt.ts`): city resolution,
planet-to-trait mapping, the four chart-signal sources, catalog rules. The Lumin tools stay generic.
Same integration pattern as the sibling `wellness-matcher`, just a different mapping layer and a
broader catalog.

The form asks for a free-text birth city ("Colombo, Sri Lanka", "Mumbai", "London, UK"). The model
resolves it to coordinates and the historical UTC offset from its own geographic knowledge, so the
demo needs no separate geocoding API. The resolved coordinates are surfaced in the response so a
visitor can verify the right city was used. For production traffic, swap in a real geocoding API
(OpenCage, Google, Nominatim) before the Lumin call.

## Birth-time fallback

Most e-commerce visitors do not know their exact birth time. The form lets them tick "I don't know
my birth time": the app defaults to 12:00 noon and the prompt skips ascendant and cusp logic,
relying on planet placements plus Moon nakshatra only. `get_arudha_lagna` depends on the ascendant,
so the Public image signal is skipped; Core drive and Spending capacity still work from planetary
degrees and longitude; Strongest planet becomes approximate. The summary begins by saying so.

## Run it

```bash
# from the repo root
bun install
cp apps/products-matcher/.env.example apps/products-matcher/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/developer

bun run --filter products-matcher dev   # http://localhost:3101
```

## Make it yours

1. Replace `src/data/catalog.json` with your own products (same schema).
2. Edit `src/lib/prompt.ts` to adjust the planet-to-trait mapping or add your brand's voice.
3. Restyle `src/app/globals.css` and `src/components/*` with your colors and typography.
4. Add a personal timing layer: `get_smart_current_dasha` or `get_sublord_changes` would let a
   product page say "favorable this week" without turning the app into a full reading.

## The disclaimer it ships

> A curiosity and personalization layer, not a financial or psychometric assessment. It blends a KP
> chart read with Vedic Parashari and Jaimini cross-system references, named as such in the chart
> signals above.

It is mandated in the system prompt, validated as a required field when the response arrives, and
rendered by `PersonalityCard` beneath the chart signals.

## License

MIT.
