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
| `get_weather_csl_fourth` | Step tool, called with `cadence: "seasons"`. The 4th-cusp sub lord verdict on each cardinal ingress chart of the year. The season banner shows the season covering the range: its verdict, sub lord, star lord, signified houses and the reasoning line. **Paged.** | KP-extended |
| `get_weather_windows` | Windows of roughly 14 days across a date range, each cast from a lunation chart. The primary tool. Each card renders all three blocks of its window, so the app keeps the whole bundle: the three channels, the 4th-cusp verdict and the Sapta Nadi Chakra, plus the engine's disposition. **Paged**, often one window per page. | Mixed, each block tagged |
| `get_astro_weather` | The signature for the place now, cast for the place's wall clock and the offset in force today. The route reads both from the time zone. | Mixed, each block tagged |
| `get_monsoon_forecast` | The Ardra Pravesha chart. The app calls it only for places in the monsoon belt. It shows the onset chart's own rainfall favourability beside the precipitation channel, and when the two disagree it shows both. | Classical, with KP-extended and Western layers |

The season banner reads one block of the seasonal bundle, so it calls the step tool rather than
`get_seasonal_outlook`. The window cards read every block, so they keep `get_weather_windows`. The
other two step tools (`get_sapta_nadi`, `get_weather_rulerships`) would only repeat what the bundle
already returned.

Each weather result mixes traditions, and the cards say which is which:

- **4th-cusp sub lord verdict**: KP machinery applied to weather by later authors (KP-extended).
  KSK's own books teach no weather rule.
- **Channels**: built on Western planet-to-weather rulerships, with the Sapta Nadi result and the
  4th-cusp verdict folded in. The fired signatures under each channel name every contribution.
- **Sapta Nadi Chakra**: classical, Tantric in origin. Not KP.
- **Ardra Pravesha**: classical (Brihat Samhita). Not KP.

The copy calls the result an "astrometeorology signature", never "the KP forecast".

## What the page shows, and what it does not

Every band, score, verdict and disposition is the engine's own. Scores are the raw numbers the
tool returns, not percentages: temperature and precipitation are signed (negative is cold or dry),
wind and storm count up from zero. The band meter has the engine's five steps, very low to very
high. The app ranks nothing and picks no "best" window. The season banner lists the windows whose
disposition is `SETTLED`, and says so when there are none.

Tool text is relayed word for word. The route changes one thing: each em dash becomes a comma.

## What it costs

| Path | Calls per forecast |
|---|---|
| As shipped, non-monsoon place, one-month range | about **4** (1 season, 2 window pages, 1 now) |
| As shipped, monsoon place, one-month range | about **5** |
| Each further window | 1 more, because `get_weather_windows` often carries one window per page |

This app allows a range of up to 220 days. Such a range gives roughly 15 windows, so about 15 window
pages. A wide range costs well over the one-month figure and takes several minutes.

Check the free monthly allowance and the call packs at [lumin.guru/pricing](https://lumin.guru/pricing).

## Paging is a correctness requirement here, not an optimization

Pages exist so that the model gives each window a real reasoning pass. They do not exist to make the
response smaller. After every `get_weather_windows` or `get_weather_csl_fourth` call, the prompt
tells the model to do these steps:

1. Read `pagination` and `pageNote`.
2. While `pagination.hasMore` is true, call again with `page` incremented.
3. Continue until it reads every window in the requested range.

A stop at page 1 is silent data loss that looks like a smaller answer. The app would report "no
settled window found". The truth would be "no settled window found on the pages I bothered to read".

## Why this is interesting for B2B

- Conventional forecasts are sharp inside about 10 days and vague after that. This lens gives a
  **structured fortnightly lean for months ahead**. That helps when a planner must pick a date early.
- The output is **structured JSON**, not a chat transcript. So it fits into a venue booking flow, a
  crop calendar or a shoot scheduler.
- It is a **planning prompt**, not a forecast. The pattern pairs well with a real meteorological
  API. Show both results. Let the planner weigh them.

## City and place resolution

The form asks for the place as free text, such as "Colombo, Sri Lanka", "Chennai" or "Lisbon,
Portugal". The model resolves the place to coordinates from its own geographic knowledge. So the
demo needs no separate geocoding API. The response includes the resolved values, so a visitor can
check that the app used the right place. For production traffic, use a real geocoding API
(OpenCage, Google, Nominatim) before the Lumin call.

The form also asks for the place's IANA time zone. It takes the zone from the typed place when a
zone has that name (Lisbon becomes Europe/Lisbon), and from the browser otherwise. Every tool takes
one offset, so the route reads the offset at the range start from the tz database, with
`offsetMinutesAt`. When clocks change inside the range, the page shows the offset at both ends.

The model also names the zone that the place is in. That zone can run a different offset at the
range start. Then the page says that the window times are on the wrong clock, and it names the zone
to use.

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

1. Edit `src/lib/prompt.ts`. An agritech build cares about precipitation, and an event venue cares
   about wind and rain together, so choose which blocks to lead with. If your vertical does not need the `current` and `monsoon` blocks, remove them.
2. Add your own rule for an outdoor rating on top of the engine's bands and dispositions, and
   label it as yours on the page, so nobody reads it as the engine's.
3. Restyle `src/app/globals.css` and `src/components/*` with your colors and typography.
4. Cache it. Within a lunation window, the signature is stable. On a public page, a daily cache keyed
   on the place and the window makes the tool cost for each visitor close to zero.

## The disclaimer it ships

> This is a KP astrometeorology signature, an astrological weather lens, not a meteorological
> forecast. Treat it as a planning prompt to pair with conventional weather services, satellite
> data, and local knowledge. Each window describes a tendency, not a guarantee.

The system prompt requires it. The route checks it as a required field when the response arrives.
`DisclaimerBanner` shows it on every result, followed by the weather tools' own disclaimer and the
Sapta Nadi block's own disclaimer, both word for word. Its words make it a lens next to conventional
forecasts, never a replacement for them. A wrong outdoor-safety call from an astrological reading is
the one failure that this app cannot afford to invite.

## License

MIT.
