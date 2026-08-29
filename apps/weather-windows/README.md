# Sky Window Planner

A Lumin example: a single-page widget that takes a **place and a date range** and returns a sequence of roughly 14-day **weather windows**, each scored for temperature, precipitation, and wind, so a planner can see which stretches lean settled and which look unsettled.

This is the first example built on the **KP astrometeorology** tool family, the non-natal side of the Lumin MCP. Unlike the sibling examples, it reads the weather signature for a **location**, not a person, so it never asks for birth data and never calls `set_birth_profile`.

Designed as a drop-in pattern for **outdoor event venues, agritech and farm planning, tour operators, construction and logistics schedulers, and film production**, anywhere a fortnight-by-fortnight outlook helps frame a decision. Fork it and re-skin for your brand.

## How it works

```
Browser form (place as free text, range start date, range end date)
  -> POST /api/forecast
  -> Anthropic Messages API + mcp.lumin.guru attached
  -> Claude resolves the place to lat/lng/UTC offset
  -> Claude calls the astrometeorology tools:
       get_seasonal_outlook  (the four cardinal-ingress season themes; the
                              one covering the range becomes the banner)
       get_weather_windows   (one ~14-day window per new/full moon across
                              the range, each with temperature, precipitation,
                              and wind/storm channels + the 4th-cusp CSL verdict)
       get_astro_weather     (the present-moment signature for the place, an
                              "as of today" anchor beside the future windows)
       get_monsoon_forecast  (conditional: monsoon onset from the Ardra
                              Pravesha chart, only for monsoon-belt places)
  -> Claude normalizes each channel to a level (calm/mild/active/intense),
     a human band word, a 0-100 score, and the chart signature behind it
  -> Claude rates each window favourable / mixed / unfavourable for outdoor plans
  -> Client renders a season banner + a grid of weather-window cards
```

The **business logic lives in the server-side prompt** (`src/lib/prompt.ts`): place resolution, channel normalization, the outdoor-rating rules, and the disclaimer. The Lumin MCP tools stay generic. Same integration pattern as the sibling examples (`wellness-matcher`, `products-matcher`, `health-risk-analyzer`): a server route, the Anthropic SDK with `mcp_servers` attached, a structured JSON response, no chatbot UI.

## The astrometeorology tool family

The May-2026 Lumin MCP shipped 78 tools. The v4 sweep took the catalog to 144, and it has since grown to **~159 tools** (the session's live server). Four of them are a distinct **astrometeorology** family. They are place-based: each takes a location and a date, never birth data, and reads a KP weather signature with three channels (temperature, precipitation, wind/storm), a 4th-cusp CSL verdict, and a Sapta Nadi Chakra block.

| Tool | What it reads |
|---|---|
| `get_weather_windows` | Roughly 14-day windows across a date range, each cast from a lunation chart. **Primary tool here.** |
| `get_seasonal_outlook` | Four seasonal themes for a year, from the cardinal ingress charts. **Used here for the banner.** |
| `get_astro_weather` | The signature for a single place and moment. **Wired here as the "as of today" snapshot card.** |
| `get_monsoon_forecast` | Monsoon onset from the Ardra Pravesha chart. **Wired here, conditionally, for monsoon-belt places.** |

This example now wires **all four**. The two natal-free additions surface as a present-conditions card (`get_astro_weather`, always read) and a monsoon-onset card (`get_monsoon_forecast`, populated only when the place sits in a monsoon climate and the range overlaps the season; null otherwise).

## Why this is interesting for B2B

- Conventional forecasts are sharp inside about 10 days and vague beyond. This lens gives a **structured fortnightly lean for months ahead**, useful when a date has to be picked early.
- The output is **structured JSON** (not a chat blob), so it slots into a venue booking flow, a crop calendar, or a shoot scheduler.
- It is a **planning prompt**, not a forecast. The pattern pairs naturally with a real meteorological API: show both, let the planner weigh them.

## City and place resolution

The form asks for a free-text place ("Colombo, Sri Lanka", "Chennai", "Lisbon, Portugal"). Claude resolves it to coordinates and the UTC offset in effect during the range using its built-in geographic knowledge: no separate geocoding API needed for the demo. The resolved values are surfaced in the response so the user can verify the right place was used. For production traffic, swap in a real geocoding API (OpenCage, Google, Nominatim) before the Lumin call.

## Run it

```bash
cp .env.example .env.local
# Add ANTHROPIC_API_KEY=sk-ant-... to .env.local

npm install
npm run dev
# http://localhost:3103
```

## Deploy

Vercel-ready. Set `ANTHROPIC_API_KEY` in project env vars and import. `maxDuration` is set to 120s on the API route to accommodate the per-lunation chart computations (typical run: 30 to 70s).

## Customize for your vertical

1. Edit `src/lib/prompt.ts`. Tighten the outdoor-rating rules (an agritech build cares about precipitation; an event venue cares about wind and rain together), or drop the `current`/`monsoon` blocks if your vertical does not need them (set them to null in the prompt and the cards disappear).
2. Adjust the channel bands in the prompt and `WindowCard` to your domain vocabulary.
3. Restyle `src/app/globals.css` and `src/components/*` with your colors and typography.
4. Swap the authless MCP endpoint for `/mcp/auth` plus an API key when usage exceeds 50 calls/day per IP.

## Important: this is not a forecast

This is a **KP astrometeorology signature, an astrological weather lens, not a meteorological forecast**. Treat every window as a planning prompt to pair with conventional weather services, satellite data, and local knowledge. Each window describes a tendency, not a guarantee. The disclaimer text is enforced server-side and surfaced in the UI on every result.

## License

MIT.
