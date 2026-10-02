# Weather Windows

This Lumin example is a single-page widget. It takes a **place and a date range**. It returns a
sequence of **weather windows** of roughly 14 days each. Each window has a score for temperature,
precipitation and wind. So a planner can see which stretches lean settled and which look unsettled.

**Vertical:** outdoor event venues, agritech and farm planning, tour operators, construction and
logistics schedulers, and film production. It helps wherever a planner must decide months ahead and
an outlook for each fortnight can frame that decision.

This is the first example built on the astrometeorology family, the non-natal side of the Lumin MCP
server. It reads the weather signature for a **location**, not a person. So it never asks for birth
data and never calls `set_birth_profile`.

<!-- screenshot: docs/weather-windows.png -->

## What it wires

| Tool | What it contributes | System |
|---|---|---|
| `get_seasonal_outlook` | Four seasonal themes for a year, from the cardinal ingress charts. The season banner uses it. **Paged.** | KP-extended |
| `get_weather_windows` | Windows of roughly 14 days across a date range, each cast from a lunation chart. The primary tool. **Paged.** | KP-extended |
| `get_astro_weather` | The signature for the place at the present moment, an "as of today" anchor beside the future windows | KP-extended |
| `get_monsoon_forecast` | Monsoon onset from the Ardra Pravesha chart. The app calls it only for places in the monsoon belt | KP-extended |

The tool taxonomy tags all four astrometeorology tools as **KP-extended**. That means a later author
extended KP technique to a moment in time instead of a birth. It is not orthodox Krishnamurti
Paddhati itself, and KSK's own books have no weather chapter. The system prompt says so first, and
this README says so too. The copy in this app calls the result an "astrometeorology signature",
never "the KP forecast".

## What it costs

| Path | Calls per forecast |
|---|---|
| As shipped, all four tools, non-monsoon place | **3** |
| As shipped, all four tools, monsoon place in season | **4** |
| Minimum useful forecast (`get_weather_windows` only) | 1, plus 1 more per extra page |

`get_weather_windows` and `get_seasonal_outlook` both return pages. This app allows a range of up to
220 days. Such a range gives roughly 15 windows and can span more than one page. So a forecast over a
wide range can cost more than the table shows, because each extra page is one more call.

The free plan is 300 tool calls a month per account, shared by all of its keys. So the shipped path
runs about 75 to 100 forecasts a month on the free plan, depending on the width of the range.

## Paging is a correctness requirement here, not an optimization

Pages exist so that the model gives each window a real reasoning pass. They do not exist to make the
response smaller. After every `get_weather_windows` or `get_seasonal_outlook` call, the prompt tells
the model to do these steps:

1. Read `pagination.totalItems` and `pageNote`.
2. Call again with `page` incremented.
3. Continue until it reads every window in the requested range.

A stop at page 1 on a wide range is silent data loss that looks like a smaller answer. The app would
report "no unsettled stretch found". The truth would be "no unsettled stretch found on the pages I
bothered to read".

## Why this is interesting for B2B

- Conventional forecasts are sharp inside about 10 days and vague after that. This lens gives a
  **structured fortnightly lean for months ahead**. That helps when a planner must pick a date early.
- The output is **structured JSON**, not a chat transcript. So it fits into a venue booking flow, a
  crop calendar or a shoot scheduler.
- It is a **planning prompt**, not a forecast. The pattern pairs well with a real meteorological
  API. Show both results. Let the planner weigh them.

## City and place resolution

The form asks for the place as free text, such as "Colombo, Sri Lanka", "Chennai" or "Lisbon,
Portugal". The model resolves the place to coordinates, and to the UTC offset in effect during the
range, from its own geographic knowledge. So the demo needs no separate geocoding API. The response
includes the resolved values, so a visitor can check that the app used the right place. For
production traffic, use a real geocoding API (OpenCage, Google, Nominatim) before the Lumin call.

## Run it

```bash
# from the repo root
bun install
cp apps/weather-windows/.env.example apps/weather-windows/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/api-keys

bun run --filter weather-windows dev   # http://localhost:3103
```

## Make it yours

1. Edit `src/lib/prompt.ts`. Tighten the outdoor-rating rules for your domain. For example, an
   agritech build cares about precipitation, and an event venue cares about wind and rain together.
   If your vertical does not need the `current` and `monsoon` blocks, remove them.
2. Adjust the channel bands in the prompt and `WindowCard` to your domain vocabulary.
3. Restyle `src/app/globals.css` and `src/components/*` with your colors and typography.
4. Cache it. Within a lunation window, the signature is stable. On a public page, a daily cache keyed
   on the place and the window makes the tool cost for each visitor close to zero.

## The disclaimer it ships

> This is a KP astrometeorology signature, an astrological weather lens, not a meteorological
> forecast. Treat it as a planning prompt to pair with conventional weather services, satellite
> data, and local knowledge. Each window describes a tendency, not a guarantee.

The system prompt requires it. The route checks it as a required field when the response arrives.
`DisclaimerBanner` shows it on every result. Its words make it a lens next to conventional
forecasts, never a replacement for them. A wrong outdoor-safety call from an astrological reading is
the one failure that this app cannot afford to invite.

## License

MIT.
