# Weather Windows

A Lumin example: a single-page widget that takes a **place and a date range** and returns a
sequence of roughly 14-day **weather windows**, each scored for temperature, precipitation, and
wind, so a planner can see which stretches lean settled and which look unsettled.

**Vertical:** outdoor event venues, agritech and farm planning, tour operators, construction and
logistics schedulers, and film production, anywhere a fortnight-by-fortnight outlook helps frame a
decision made months ahead. This is the first example built on the astrometeorology family, the
non-natal side of the Lumin MCP server: it reads the weather signature for a **location**, not a
person, so it never asks for birth data and never calls `set_birth_profile`.

<!-- screenshot: docs/weather-windows.png -->

## What it wires

| Tool | What it contributes | System |
|---|---|---|
| `get_seasonal_outlook` | Four seasonal themes for a year, from the cardinal ingress charts. Used for the season banner. **Paged.** | KP-extended |
| `get_weather_windows` | Roughly 14-day windows across a date range, each cast from a lunation chart. Primary tool. **Paged.** | KP-extended |
| `get_astro_weather` | The signature for the place at the present moment, an "as of today" anchor beside the future windows | KP-extended |
| `get_monsoon_forecast` | Monsoon onset from the Ardra Pravesha chart, called only for monsoon-belt places | KP-extended |

All four astrometeorology tools are tagged **KP-extended** in the tool taxonomy: a later-author
extension of KP technique applied to a moment in time rather than a birth, not orthodox
Krishnamurti Paddhati itself (KSK's own books have no weather chapter). The system prompt says so
up front, and this README says so too: the copy in this app calls the result an "astrometeorology
signature," never "the KP forecast."

## What it costs

| Path | Calls per forecast |
|---|---|
| As shipped, all four tools, non-monsoon place | **3** |
| As shipped, all four tools, monsoon place in season | **4** |
| Minimum useful forecast (`get_weather_windows` only) | 1, plus 1 more per extra page |

`get_weather_windows` and `get_seasonal_outlook` are both paged. This app allows a range up to 220
days, which produces roughly 15 windows and can span more than one page, so a wide-range forecast
can cost more than the table above before counting monsoon or paging. The free plan is 300 tool
calls per month per credential, so the shipped path runs about 75 to 100 forecasts a month on the
free tier depending on range width.

## Paging is a correctness requirement here, not an optimization

A page exists so the model gives each window a real reasoning pass, not so the response is smaller.
The prompt instructs the model to read `pagination.totalItems` and `pageNote` after every
`get_weather_windows` or `get_seasonal_outlook` call and to call again with `page` incremented until
every window in the requested range has actually been read. Stopping at page 1 on a wide range is
silent data loss dressed up as a smaller answer: the app would report "no unsettled stretch found"
when the truth is "no unsettled stretch found on the pages I bothered to read."

## Why this is interesting for B2B

- Conventional forecasts are sharp inside about 10 days and vague beyond. This lens gives a
  **structured fortnightly lean for months ahead**, useful when a date has to be picked early.
- The output is **structured JSON**, not a chat transcript, so it slots into a venue booking flow, a
  crop calendar, or a shoot scheduler.
- It is a **planning prompt**, not a forecast. The pattern pairs naturally with a real
  meteorological API: show both, let the planner weigh them.

## City and place resolution

The form asks for a free-text place ("Colombo, Sri Lanka", "Chennai", "Lisbon, Portugal"). The
model resolves it to coordinates and the UTC offset in effect during the range from its own
geographic knowledge, so the demo needs no separate geocoding API. The resolved values are surfaced
in the response so a visitor can verify the right place was used. For production traffic, swap in a
real geocoding API (OpenCage, Google, Nominatim) before the Lumin call.

## Run it

```bash
# from the repo root
bun install
cp apps/weather-windows/.env.example apps/weather-windows/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/developer

bun run --filter weather-windows dev   # http://localhost:3103
```

## Make it yours

1. Edit `src/lib/prompt.ts`. Tighten the outdoor-rating rules (an agritech build cares about
   precipitation; an event venue cares about wind and rain together), or drop the `current` and
   `monsoon` blocks if your vertical does not need them.
2. Adjust the channel bands in the prompt and `WindowCard` to your domain vocabulary.
3. Restyle `src/app/globals.css` and `src/components/*` with your colors and typography.
4. Cache it. Within a lunation window, the signature is stable; a daily cache keyed on place plus
   window drops the per-visitor tool cost close to zero for a public page.

## The disclaimer it ships

> This is a KP astrometeorology signature, an astrological weather lens, not a meteorological
> forecast. Treat it as a planning prompt to pair with conventional weather services, satellite
> data, and local knowledge. Each window describes a tendency, not a guarantee.

It is mandated in the system prompt, validated as a required field when the response arrives, and
rendered by `DisclaimerBanner` on every result. It is worded as a lens next to conventional
forecasts, never a replacement for one, because a wrong outdoor-safety call from an astrological
reading is the one failure mode this app cannot afford to invite.

## License

MIT.
