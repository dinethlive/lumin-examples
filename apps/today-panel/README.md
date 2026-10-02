# Today panel

The panel shows panchang, choghadiya and hora for any city on earth. Lumin computes them live, and
the panel highlights the band that runs now.

**Vertical:** regional consumer apps, news and temple portals, productivity and scheduling tools.

**This app collects nothing personal.** It needs no account, no birth date and no birth time. It
uses only a city and a date. That makes it the fastest app in this repo to show to a real user. It
is also the easiest to cache, with one result per city per day.

<!-- screenshot: docs/today-panel.png -->

## What it wires

| Tool | What it contributes | System |
|---|---|---|
| `get_panchang` | The five limbs (tithi, nakshatra, yoga, karana, weekday), sunrise and sunset, and the three inauspicious bands: rahu kaal, yamaganda, gulikai | KP |
| `get_choghadiya_today` | Eight day and eight night periods of about 90 minutes, each with a lord, a quality and an interpretation, plus the one running now | Vedic muhurta adjunct, **not** orthodox KP |
| `get_hora_today` | Twenty-four planetary hours in Chaldean order from sunrise, plus the one running now | Vedic muhurta adjunct, **not** orthodox KP |
| `get_moon_transit` | The Moon's sign, star lord, sub lord and the minutes left in the current sub | KP |
| `get_sublord_changes` | Hours until each planet's sub lord changes next. It takes no location at all | KP |

Choghadiya and hora come from Vedic muhurta, not from Krishnamurti Paddhati. The panel shows them
beside the KP layer, and the card headings say so. Roughly a third of the server's surface is not
KP. To present one of those tools as a KP finding is a methodology error, and it reads as
thoroughness.

## What it costs

| Path | Calls per panel |
|---|---|
| As shipped, all five tools | **5** |
| Minimum useful panel (`get_panchang` and `get_choghadiya_today` only) | 2 |

The free plan is 300 tool calls a month per account, shared by all of its keys. So this app runs
about 60 panels a month on the free plan. The result depends only on a city and a date, so it caches
perfectly. One set of calls per city per day serves every visitor.

## The detail worth copying

**The astrological day runs from sunrise to sunrise, so every request must carry `utc_offset_minutes`.** The
offset decides which civil day the request means. Without it, every band east of Greenwich falls a
day early. Most implementations get this detail wrong.

The offset must be the city's offset on that date. The visitor's browser offset is wrong for a city in
another zone. So the form asks for the city's IANA time zone. It takes the zone from the typed city
when a zone has that name (London becomes Europe/London), and from the browser otherwise. The
route reads the offset for the date from the tz database, with `offsetMinutesAt`. The route rejects
a request without a known zone.

The model also names the zone that the city is in. That zone can run a different offset on the
date. Then the panel says that its times are on the wrong clock, and it names the zone to use.

Two smaller details are worth copying too:

- The schemas of `get_panchang` and `get_moon_transit` use the field names of birth data. But the
  values carry the **query** moment and place, not a person. So this app holds no personal data,
  although it calls two tools that look like they need a chart.
- Every timestamp that crosses the API is ISO 8601 UTC. The client converts it once, when it
  renders. If you send local times through the model, off-by-one time zone bugs occur.

## Run it

```bash
# from the repo root
bun install
cp apps/today-panel/.env.example apps/today-panel/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/api-keys

bun run --filter today-panel dev   # http://localhost:3110
```

## Make it yours

- **Add a personal layer.** Add `get_tara_bala` and `run_today_complete` behind an optional
  birth-date field. `get_tara_bala` gives the nine-fold favourability of today against a person's
  birth star. This change makes the shared city panel into a daily card for each person. The cost is
  that the app then collects birth data.
- **Change the bands.** If 24 rows are too many for your surface, remove hora. For a compact widget,
  keep only `currentPeriod` and `currentHora`.
- **Cache it.** The response is a pure function of the city, the date and the time zone. Put it behind
  a daily cache with those three values as its key. Then the tool cost for each visitor falls to
  zero.
- **Embed it.** The app has no personal data and no signup. So it renders well as a public page or
  as an iframe widget on a news site.

## The disclaimer it ships

> A traditional almanac panel, computed for the place and date you chose. It describes conventional
> timing categories, not advice.

The system prompt requires it. The route checks it as a required field when the response arrives,
and the page shows it. Disclaimers here are data, not decoration. If the model omits the disclaimer,
the response fails the check and the request returns an error. The page never renders without the
disclaimer.
