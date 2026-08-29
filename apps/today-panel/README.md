# Today panel

Panchang, choghadiya and hora for any city on earth, computed live, with the band that is
running right now highlighted.

**Vertical:** regional consumer apps, news and temple portals, productivity and scheduling tools.

**This app collects nothing personal.** No account, no birth date, no birth time. It is built
entirely from a city and a date, which makes it the fastest thing in this repo to put in front of
a real user, and the easiest to cache (one result per city per day).

<!-- screenshot: docs/today-panel.png -->

## What it wires

| Tool | What it contributes | System |
|---|---|---|
| `get_panchang` | The five limbs (tithi, nakshatra, yoga, karana, weekday), sunrise and sunset, and the three inauspicious bands: rahu kaal, yamaganda, gulikai | KP |
| `get_choghadiya_today` | Eight day and eight night periods of about 90 minutes, each with a lord, a quality and an interpretation, plus the one running now | Vedic muhurta adjunct, **not** orthodox KP |
| `get_hora_today` | Twenty-four planetary hours in Chaldean order from sunrise, plus the one running now | Vedic muhurta adjunct, **not** orthodox KP |
| `get_moon_transit` | The Moon's sign, star lord, sub lord and the minutes left in the current sub | KP |
| `get_sublord_changes` | Hours until each planet's sub lord changes next. Takes no location at all | KP |

Choghadiya and hora are Vedic muhurta material rather than Krishnamurti Paddhati. The panel shows
them beside the KP layer, and the card headings say so. Roughly a third of the server's surface is
non-KP, and presenting one of those as a KP finding is a methodology error that reads as
thoroughness.

## What it costs

| Path | Calls per panel |
|---|---|
| As shipped, all five tools | **5** |
| Minimum useful panel (`get_panchang` and `get_choghadiya_today` only) | 2 |

The free plan is 300 tool calls per month per credential, so this app runs about 60 panels a month
on the free tier. Because the result depends only on a city and a date, it caches perfectly: one
call set per city per day serves every visitor.

## The detail worth copying

**The astrological day runs sunrise to sunrise, so `utc_offset_minutes` is required, not optional.**
It is what decides which civil day is meant. Omitting it puts every band a day early east of
Greenwich, and it is the detail most implementations get wrong. The form prefills it from the
browser and the route rejects a request without it.

Two smaller ones:

- `get_panchang` and `get_moon_transit` are declared with birth-data field names, but the values
  carry the **query** moment and place, not a person. That is why this app is free of personal data
  despite calling two tools that look like they need a chart.
- Every timestamp crossing the API is ISO 8601 UTC. The client converts once, at render. Sending
  local times through the model is how off-by-one-timezone bugs get in.

## Run it

```bash
# from the repo root
npm install
cp apps/today-panel/.env.example apps/today-panel/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/developer

npm run dev -w apps/today-panel   # http://localhost:3110
```

## Make it yours

- **Add a personal layer.** Add `get_tara_bala` (the nine-fold favourability of today against a
  person's birth star) and `run_today_complete` behind an optional birth-date field. That turns a
  shared city panel into a per-user daily card, at the cost of collecting birth data.
- **Change the bands.** Drop hora if 24 rows is too many for your surface, or keep only
  `currentPeriod` and `currentHora` for a compact widget.
- **Cache it.** The response is a pure function of city, date and offset. Put it behind a daily
  cache keyed on those three and the tool cost per visitor goes to zero.
- **Embed it.** With no personal data and no signup, this renders fine as a public page or an
  iframe widget on a news site.

## The disclaimer it ships

> A traditional almanac panel, computed for the place and date you chose. It describes conventional
> timing categories, not advice.

It is mandated in the system prompt, validated as a required field when the response arrives, and
rendered on the page. Disclaimers here are data, not decoration: if the model omits it, the
response fails validation and the request errors rather than rendering without it.
