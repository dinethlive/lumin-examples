# Kundli match

Three independent compatibility systems for two birth charts, rendered side by side with an
agreement meter across the top and a drawer that explains, in each tradition's own terms, where
they part company. Not one blended Guna score with no reasoning behind it.

**Vertical:** matrimonial platforms. The design idea is not a better number, it is showing three
systems and naming where they
disagree, which a single-score API cannot do.

<!-- screenshot: docs/kundli-match.png -->

## What it wires

| Tool | What it contributes | System |
|---|---|---|
| `get_boundary_warnings` | Birth-time confidence pill, run once per person. Flags any cusp or planet within 10 arc-minutes of a sub-lord boundary | KP |
| `get_ashta_koota_milan` | The familiar 36-point Guna Milan across all eight kootas (Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoota, Nadi) | Vedic Parashari |
| `check_compatibility` | The 7-factor KP score (Moon compatibility, Venus-Mars attraction, Jupiter harmony, sub-lord matching, dasha sync, dignity match, aspect harmony) | KP |
| `get_compatibility_advanced` | Six cuspal-sub-lord factors (LOVE, MARRIAGE, FINANCE, UNION, DENIAL_ABSENCE, DASHA_SYNC), the rigorous KP version, built explicitly to replace Vedic Porutham | KP |
| `check_doshas` | Manglik, Kalsarpa, Sadhesati, Pitra Dosha, Kemadruma, run once per person. Ships the KP corpus's own dissent from the Manglik premise alongside the traditional finding | Vedic Parashari |
| `get_kalsarpa_variants` | Names WHICH of the 12 Kala Sarpa variants applies, run once per person | Vedic Parashari |
| `get_spouse_characteristics` | A structured spouse description from the 7th cuspal sub lord's star lord, run once per chart, so each direction gets its own facets | KP |

`run_kundli_match_complete`, the one-call composite, is deliberately **not** in `ALLOWED_TOOLS`.
It cross-validates Ashta Koota, the KP 6-cuspal-factor read, a Manglik check on both partners and
the Jaimini Upapada Lagna relationship in a single call, but it does not expose the 7-factor KP
score, a named Kala Sarpa variant, spouse characteristics in either direction, or a birth-time
confidence read. The whole point of this app is showing three independently scored systems and
where they disagree, which needs all three scored on their own, so it takes the expanded path
instead. See below for what that costs.

`get_marital_separation` and `get_extramarital_signature` are advisor-only tools and do not
appear anywhere in this app, by design.

## What it costs

| Path | Calls per match | What you get |
|---|---|---|
| As shipped, the expanded path | **11** | All three systems scored independently, Manglik and Kalsarpa (with the named variant) for both people, the KP dissent on Manglik, spouse characteristics in both directions, and a birth-time confidence pill for each chart |
| The one-call composite, `run_kundli_match_complete` alone | **1** | Ashta Koota, the KP 6-cuspal-factor read, a Manglik present/absent flag for both partners, and the Jaimini Upapada Lagna relationship. No 7-factor KP score, no Kala Sarpa variant name, no spouse characteristics, no confidence pill |

The free plan is 300 tool calls a month per credential. At 11 calls a match, that is about 27
matches a month on the free tier; the composite alone would run about 300. That gap is a real
cost argument for a matrimonial platform running this at volume, and it is also the app's
architecture lesson: a composite buys call-count headroom by giving up the granularity that
the disagreement drawer depends on. A platform that only needs a pass or fail gate would use
`run_kundli_match_complete` alone; one that wants to show its users the "why" behind the number
needs the expanded path this app ships.

## Screens

1. Two birth forms side by side, one per person: name, birth date and time (with a "time not
   known" toggle), birth place, UTC offset, and gender.
2. An agreement meter (high, mixed, low) computed from whether the three systems concur, plus a
   birth-time confidence pill for each chart, then a panel per system with its own score, factors
   and headline verdict, and the dosha card right below it, doshas and the KP's own dissent on the
   same screen.
3. A disagreement drawer naming every place the systems genuinely part company, and why, in the
   traditions' own terms.
4. A partner-profile card with spouse characteristics from each chart, read independently in both
   directions.

## The detail worth copying

**The second person's field names are different on almost every tool, and none of them agree.**
This is the thing to grep before writing a matching app on this server, not to assume:

- `get_ashta_koota_milan` and (if you use it) `run_kundli_match_complete` take Person A's data at
  the normal snake_case top level (`birth_datetime`, `latitude`, `longitude`,
  `utc_offset_minutes`, `ayanamsa`) and Person B in a nested `partner` object with **camelCase**
  keys (`datetime`, `latitude`, `longitude`, `utcOffsetMinutes`, `ayanamsa`), and that `ayanamsa`
  only accepts `kp`, `lahiri`, `raman` or `true_chitra`, not `kp_new` or `khullar`.
- `check_compatibility` also takes Person A at the snake_case top level, but Person B goes in a
  nested `person2` object, camelCase, which additionally carries an optional `gender`.
- `get_compatibility_advanced` takes **no top-level birth data at all**. Both people are explicit
  nested objects, `person1` and `person2`, both camelCase, and the tool does not auto-inject
  anything.
- `check_doshas`, `get_kalsarpa_variants`, `get_spouse_characteristics` and `get_boundary_warnings`
  are single-chart tools with no second-person field of any kind. Each is called twice, once with
  Person A's data at the top level and once with Person B's.

A wrong shape here is a silent tool failure inside the model's conversation, not a schema error
you see. `src/lib/prompt.ts` spells out the exact shape for every one of the eleven calls so the
model does not have to guess, and `README` repeats it here so a developer forking this does not
have to re-derive it from `kp-mcp/src/mcp/tools.ts` by hand.

**UTC offset is asked for directly, not resolved by the model.** Every other field about a place
(latitude, longitude) is left to the model's own knowledge, the way the other apps in this repo do
it, but `get_boundary_warnings` exists precisely because a cuspal sub lord can flip on a boundary
a few arc-minutes wide, and the UTC offset feeds the Ascendant calculation directly. A model's
guess at a historical timezone is not good enough for a tool whose entire job is measuring how
close a chart sits to that exact kind of boundary.

## Run it

```bash
# from the repo root
bun install
cp apps/kundli-match/.env.example apps/kundli-match/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/developer

bun run --filter kundli-match dev   # http://localhost:3113
```

## Make it yours

- **Swap in the cheap path.** Replace the seven tools in `ALLOWED_TOOLS` with just
  `run_kundli_match_complete`, drop the `kpSevenFactor` panel, the Kala Sarpa variant name, the
  spouse-characteristics card and the confidence pills from the response shape, and you have a
  1-call-per-match version that fits comfortably inside the free plan at volume. You lose the
  drawer's best material in the process: the composite's Manglik flag has no dissent text
  attached the way `check_doshas` carries.
- **Add the Upapada Lagna relationship.** `run_kundli_match_complete` returns a Jaimini
  classification this app does not surface. Worth adding as a fourth system if you go that route,
  labelled `jaimini` rather than folded into the KP or Vedic panels.
- **Cache per pairing.** Unlike the daily-almanac apps in this repo, a match result is a pure
  function of both people's birth data, so it caches indefinitely once computed for a given pair.
- **Gate the dosha card behind a toggle.** Some matrimonial platforms want Manglik-first, some
  want it de-emphasised. The KP dissent text makes a strong case for the latter; either way, keep
  it visible rather than only computed.

## The disclaimer it ships

> This reads three independent compatibility systems and where they agree or disagree. It is one
> input among many a couple might weigh, never a verdict on the relationship and never a reason it
> will fail.

It is mandated in the system prompt, validated as a required field when the response arrives
(the route also refuses a `STRONG` recommendation paired with `LOW` agreement, since the whole
point of this app is not to paper over a genuine disagreement), and rendered on the page.
Disclaimers here are data, not decoration: if the model omits it, the response fails validation
and the request errors rather than rendering without it.
