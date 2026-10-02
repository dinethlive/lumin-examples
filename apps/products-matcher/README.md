# Products Matcher

This Lumin example is a single-page widget. It reads a visitor's KP/Vedic chart. It returns two
things: a **consumer personality** read and 5 product recommendations from a general e-commerce
catalog. The reasons come from the chart, not from a generic quiz.

**Vertical:** general e-commerce sites with broad catalogs (Kapruka, Daraz, FernsNPetals,
Amazon-style marketplaces). The catalog ships with 30 sample products in 10 categories: flowers,
cakes, chocolates, jewelry, electronics, hampers, home, fashion, toys and food. Fork the app and
replace the samples with your own SKUs.

<!-- screenshot: docs/products-matcher.png -->

## What it wires

| Tool | What it contributes | System |
|---|---|---|
| `set_birth_profile` | Checks the birth inputs and returns the reading plan | KP |
| `get_full_chart` | Ascendant, planets, dasha overview | KP |
| `get_planets` | Detailed positions, dignities, retrograde flags | KP |
| `get_house_cusps` | All 12 cusps with sign lord, star lord, sub lord | KP |
| `get_nakshatra_details` | Moon nakshatra and pada | KP |
| `get_aspects_and_strength` | Whole-sign aspect geometry and a 0-100 house strength score | Vedic Parashari, cross-system reference |
| `get_boundary_warnings` | Sub-lord credibility check. A CRITICAL lagna flag gives less weight to traits that come from the ascendant | KP |
| `get_shadbala` | Six-fold planetary strength. It tests whether strength, or only placement, supports a "strong planet" trait claim | Vedic Parashari, cross-system reference |
| `get_arudha_lagna` | The Arudha Lagna, the projected public image. It drives the **Public image** chart signal | Jaimini, cross-system reference |
| `get_chara_karakas` | The Atmakaraka, the soul's deepest craving. It drives the **Core drive** signal | Jaimini, cross-system reference |
| `get_d2_chart` | The D2 (Hora) divisional chart, the capacity to acquire wealth. It drives the **Spending capacity** signal | Vedic Parashari, cross-system reference |

Five of the eleven tools are not orthodox Krishnamurti Paddhati (KP). Three are Vedic Parashari,
and two are Jaimini. The system prompt tags each one inline. The personality card shows four chart
signals: public image, core drive, strongest planet and spending capacity. Each signal names its
system. So a buyer sees a cross-system reading, never a KP finding presented as one.

Roughly a third of the Lumin MCP server's surface is not KP. So this discipline matters on almost
every app built on it.

## What it costs

| Path | Calls per match |
|---|---|
| As shipped, all eleven tools | **11** |
| Minimum useful matcher (`get_full_chart` and `get_planets` only, trait mapping from sign placements) | 2 |

The free plan is 300 tool calls a month per account, shared by all of its keys. So the shipped path
runs about 27 matches a month on the free plan. The minimum path removes the credibility check and
all four chart signals. Only the trait mapping from sign placements remains.

## The detail worth copying

**The business logic lives in the server-side prompt**, `src/lib/prompt.ts`. It holds the city
resolution, the planet-to-trait mapping, the sources of the four chart signals and the catalog
rules. The Lumin tools stay generic. This app uses the same integration pattern as the sibling
`wellness-matcher`. Only the mapping layer differs, and this catalog is broader.

The form asks for the birth city as free text, such as "Colombo, Sri Lanka", "Mumbai" or "London,
UK". The model resolves the city to coordinates and the historical UTC offset from its own
geographic knowledge. So the demo needs no separate geocoding API. The response includes the
resolved coordinates, so a visitor can check that the app used the right city. For production
traffic, use a real geocoding API (OpenCage, Google, Nominatim) before the Lumin call.

## Birth-time fallback

Most e-commerce visitors do not know their exact birth time. The form lets them tick "I don't know
my birth time". When a visitor ticks it:

- The app uses 12:00 noon as the birth time.
- The prompt skips the ascendant and cusp logic. It uses only the planet placements and the Moon
  nakshatra.
- The prompt skips the Public image signal, because `get_arudha_lagna` depends on the ascendant.
- Core drive and Spending capacity still work from planetary degrees and longitude.
- Strongest planet becomes approximate.
- The summary begins with a note about this.

## Run it

```bash
# from the repo root
bun install
cp apps/products-matcher/.env.example apps/products-matcher/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/api-keys

bun run --filter products-matcher dev   # http://localhost:3101
```

## Make it yours

1. Replace `src/data/catalog.json` with your own products (same schema).
2. Edit `src/lib/prompt.ts` to adjust the planet-to-trait mapping or add your brand's voice.
3. Restyle `src/app/globals.css` and `src/components/*` with your colors and typography.
4. Add a personal timing layer. With `get_smart_current_dasha` or `get_sublord_changes`, a product
   page could say "favorable this week". The app would not become a full reading.

## The disclaimer it ships

> A curiosity and personalization layer, not a financial or psychometric assessment. It blends a KP
> chart read with Vedic Parashari and Jaimini cross-system references, named as such in the chart
> signals above.

The system prompt requires it. The route checks it as a required field when the response arrives.
`PersonalityCard` shows it below the chart signals.

## License

MIT.
