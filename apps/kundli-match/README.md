# Kundli match

This app reads two birth charts with three independent compatibility systems. It shows the systems
side by side, with an agreement meter across the top. A drawer explains where the systems
disagree, in the terms of each tradition. The app does not give one blended Guna score with no
reasoning behind it.

**Vertical:** matrimonial platforms. The design idea is not a better number. The idea is to show
three systems and name where they disagree. A single-score API cannot do that.

<!-- screenshot: docs/kundli-match.png -->

## What it wires

| Tool | What it contributes | System |
|---|---|---|
| `get_boundary_warnings` | The birth-time confidence pill. Runs once per person. Flags any cusp or planet within 10 arc-minutes of a sub-lord boundary | KP |
| `get_ashta_koota_milan` | The familiar 36-point Guna Milan across all eight kootas (Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoota, Nadi) | Vedic Parashari |
| `check_compatibility` | The 7-factor KP score (Moon compatibility, Venus-Mars attraction, Jupiter harmony, sub-lord matching, dasha sync, dignity match, aspect harmony) | KP |
| `get_compatibility_advanced` | Six cuspal sub-lord factors (LOVE, MARRIAGE, FINANCE, UNION, DENIAL_ABSENCE, DASHA_SYNC). The rigorous KP version, built explicitly to replace Vedic Porutham | KP |
| `check_doshas` | Manglik, Kalsarpa, Sadhesati, Pitra Dosha and Kemadruma. Runs once per person. Returns the KP corpus's own dissent from the Manglik premise beside the traditional finding | Vedic Parashari |
| `get_kalsarpa_variants` | Names WHICH of the 12 Kala Sarpa variants applies. Runs once per person | Vedic Parashari |
| `get_spouse_characteristics` | A structured spouse description from the star lord of the 7th cuspal sub lord. Runs once per chart, so each direction gets its own facets | KP |

`run_kundli_match_complete`, the one-call composite, is **not** in `ALLOWED_TOOLS`, on purpose. In
a single call, it cross-checks four things:

- Ashta Koota
- the KP read of six cuspal factors
- a Manglik check on both partners
- the Jaimini Upapada Lagna relationship

But it does not expose the 7-factor KP score, a named Kala Sarpa variant, spouse characteristics
in either direction, or a birth-time confidence read. This app exists to show three independently
scored systems and where they disagree. For that, each system needs its own score. So the app
takes the expanded path instead. The next section shows what that costs.

`get_marital_separation` and `get_extramarital_signature` are advisor-only tools. By design, they
appear nowhere in this app.

## What it costs

| Path | Calls per match | What you get |
|---|---|---|
| As shipped, the expanded path | **11** | All three systems, each scored independently. Manglik and Kalsarpa, with the named variant, for both people. The KP dissent on Manglik. Spouse characteristics in both directions. A birth-time confidence pill for each chart |
| The one-call composite, `run_kundli_match_complete` alone | **1** | Ashta Koota, the KP read of six cuspal factors, a Manglik present/absent flag for both partners, and the Jaimini Upapada Lagna relationship. No 7-factor KP score, no Kala Sarpa variant name, no spouse characteristics, no confidence pill |

The free plan is 300 tool calls a month per account. All keys on an account share that allowance.
At 11 calls a match, that is about 27 matches a month on the free plan. The composite alone would
run about 300. For a matrimonial platform that runs this at volume, that gap is a real cost
argument.

The gap is also the architecture lesson of this app. A composite gets more headroom in calls, but
it gives up the granularity that the disagreement drawer needs. A platform that needs only a pass
or fail gate would use `run_kundli_match_complete` alone. A platform that wants to show its users
the "why" behind the number needs the expanded path that this app ships.

## Screens

1. Two birth forms side by side, one per person. Each form asks for name, birth date and time,
   birth place, birth time zone, and gender. The time has a "time not known" toggle.
2. An agreement meter (high, mixed, low). The app computes it from whether the three systems
   concur. Each chart also gets a birth-time confidence pill. Below them is a panel for each
   system, with its own score, factors and headline verdict. Directly below is the dosha card. It
   shows the doshas and the KP dissent on the same screen.
3. A disagreement drawer. It names every place where the systems really disagree, and why, in the
   terms of each tradition.
4. A partner-profile card with spouse characteristics from each chart, read independently in both
   directions.

## The detail worth copying

**The field names for the second person differ on almost every tool, and none of them agree.**
Check them with grep before you write a matching app on this server. Do not assume them.

- `get_ashta_koota_milan` and `run_kundli_match_complete` (if you use it) take Person A's data at
  the normal snake_case top level: `birth_datetime`, `latitude`, `longitude`,
  `utc_offset_minutes`, `ayanamsa`. Person B goes in a nested `partner` object with **camelCase**
  keys: `datetime`, `latitude`, `longitude`, `utcOffsetMinutes`, `ayanamsa`. That `ayanamsa`
  accepts only `kp`, `lahiri`, `raman` or `true_chitra`, not `kp_new` or `khullar`.
- `check_compatibility` also takes Person A at the snake_case top level. But Person B goes in a
  nested `person2` object, in camelCase. That object also carries an optional `gender`.
- `get_compatibility_advanced` takes **no top-level birth data at all**. Both people are explicit
  nested objects, `person1` and `person2`, both in camelCase. The tool does not inject anything
  automatically.
- `check_doshas`, `get_kalsarpa_variants`, `get_spouse_characteristics` and `get_boundary_warnings`
  are single-chart tools with no second-person field of any kind. Each one runs twice: once with
  Person A's data at the top level, and once with Person B's data.

A wrong shape here is a silent tool failure inside the model's conversation. You do not see a
schema error. `src/lib/prompt.ts` gives the exact shape for each of the eleven calls, so the model
does not have to guess. This README repeats the shapes. Then a developer who forks this app does
not have to derive them again by hand from `kp-mcp/src/mcp/tools.ts`.

**The form asks for the birth time zone. The route computes the UTC offset from it.** For the
other place fields (latitude, longitude), the app trusts the model's own knowledge, as the other
apps in this repo do.

But `get_boundary_warnings` exists because a cuspal sub lord can flip on a boundary a few
arc-minutes wide. The UTC offset feeds the Ascendant calculation directly. A model's guess at a
historical offset is not good enough here. A typed offset is not good enough either, because people
often type today's offset. The whole job of this tool is to measure how close a chart sits to that
kind of boundary.

So each person names an IANA zone, such as `Asia/Colombo`. The route reads the offset in force at
the birth moment from the tz database, with `offsetMinutesAt` from `@lumin-examples/client`. The
nested `partner` and `person2` objects take a number, so the route sends that computed offset to
every tool. The form shows the offset as a hint under the field, so a wrong zone shows itself.

## Run it

```bash
# from the repo root
bun install
cp apps/kundli-match/.env.example apps/kundli-match/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/api-keys

bun run --filter kundli-match dev   # http://localhost:3113
```

## Make it yours

- **Use the cheap path.**
  1. Replace the seven tools in `ALLOWED_TOOLS` with only `run_kundli_match_complete`.
  2. Remove these from the response shape: the `kpSevenFactor` panel, the Kala Sarpa variant
     name, the spouse-characteristics card and the confidence pills.

  The result is a version with 1 call per match. It fits easily inside the free plan at volume.
  But the drawer loses its best material. The composite's Manglik flag has no dissent text, and
  `check_doshas` carries one.
- **Add the Upapada Lagna relationship.** `run_kundli_match_complete` returns a Jaimini
  classification that this app does not show. If you take that path, it is worth adding as a
  fourth system, labelled `jaimini`. Do not fold it into the KP or Vedic panels.
- **Cache per pairing.** A match result is a pure function of the birth data of both people. The
  daily-almanac apps in this repo work differently. So after the app computes a result for a
  pair, you can cache that result with no expiry.
- **Put the dosha card behind a toggle.** Some matrimonial platforms want Manglik first. Others
  want less emphasis on it. The KP dissent text makes a strong case for less emphasis. Either way,
  keep the KP dissent text visible, not only computed.

## The disclaimer it ships

> This reads three independent compatibility systems and where they agree or disagree. It is one
> input among many a couple might weigh, never a verdict on the relationship and never a reason it
> will fail.

The system prompt requires this disclaimer. The route checks it as a required field when the
response arrives, and the page shows it. The route also refuses a `STRONG` recommendation with
`LOW` agreement, because the point of this app is to never hide a real disagreement.

Disclaimers here are data, not decoration. If the model omits the disclaimer, the response fails
validation. The request then returns an error instead of a page without it.
