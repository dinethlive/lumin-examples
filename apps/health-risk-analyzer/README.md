# Health Risk Analyzer

This Lumin example is a single-page widget. It reads a person's KP/Vedic chart and returns a
**constitutional health risk profile** across eight body systems. The profile includes a vitality
index, peak vulnerability windows, surgery and recovery timing, and a screening calendar.

**Vertical:** integrative medicine clinics, telehealth apps, corporate wellness platforms, insurance
underwriters, and Ayurvedic chains. In these places, a structured, prevention-oriented risk read
complements actual screening. The 8-system mapping runs on KP karaka logic. Fork it. Then extend
the systems, or re-skin it for your brand.

<!-- screenshot: docs/health-risk-analyzer.png -->

## What it wires

The protocol has 7 steps and makes up to 31 tool calls.

| Tool | What it contributes | System |
|---|---|---|
| `set_birth_profile` | Checks the inputs, returns the reading plan | KP |
| `get_full_chart` | Ascendant, planets, dasha overview | KP |
| `get_planets` | Exact positions, retrograde, combustion, dignities | KP |
| `get_house_cusps` | All 12 cusps. The sub lords of the 1st, 6th, 8th, 11th and 12th are the health-critical set | KP |
| `get_nakshatra_details` | Moon nakshatra and pada | KP |
| `get_aspects_and_strength` | House strength scores | Vedic Parashari, cross-system reference |
| `run_pre_verdict_audit` | Chart-integrity gate. Checks boundary, combustion, planetary war and vargottama in one pass. Feeds `chart_confidence` | KP |
| `analyze_natal_promise` | Verdict for health, longevity and chronic-disease life events. **Paged.** | KP |
| `get_significators` | The 4-level house-signification matrix behind every "signifies 6/8/12" claim | KP |
| `get_multi_system_verdict` | 4-school consensus (KP CSL, KCIL, 4-Step, Bosmia) for Chronic Illness and Surgery | KP-extended |
| `get_bhadhakasthana` | The blockage house, driven by the mobility of the lagna | KP |
| `get_csl_advanced` | Deep CSL chain for cusps 1, 6, 8, 12 | KP |
| `get_smart_current_dasha` | Current Mahadasha, Antardasha, Pratyantardasha | KP |
| `get_dasha_periods` | Full Vimshottari for the next 25 years | KP |
| `get_ruling_planets` | The KP timing-verification set (ascendant and Moon sign/star/sub lord, day lord) | KP |
| `get_fruitful_significators` | Significator matrix intersected with ruling planets, per event. Only these significators can deliver the event | KP |
| `get_transit_timing_hierarchy` | Saturn-to-Moon transit cascade. Opens a window only where the star and sub lord of a fruitful significator align | KP |
| `get_medical_timing` | Surgery windows, recovery versus chronic differentiation | KP |
| `get_ashtakavarga` | Bindus on houses 1, 6, 8 for longevity strength | Vedic Parashari, cross-system reference |
| `get_chronic_disease_panel` | 8-condition watch-decade panel. **Paged.** | KP |
| `get_health_organ_panel` | Sign-to-body-region affliction map, the engine-backed Kaalpurusha panel | Vedic Parashari, cross-system reference |
| `get_accident_window` | Risk windows by class (vehicular, workplace, surgical, assault, generic) | KP |
| `get_longevity_balarishta` | Qualitative lifespan band, never a date or a number of years | KP |
| `get_sade_sati_phases` | Saturn's 7.5-year transit cycle. **Paged.** | KP |
| `get_sade_sati_intensity` | Intensity peaks within the Sade Sati phase, resolved by sub lord | KP |
| `get_ayurvedic_constitution` | Vata/Pitta/Kapha triple. Feeds a one-line prakriti note | Vedic Parashari, cross-system reference |
| `get_oncology_timing` | Conditional. Body-part risk and recurrence versus cure, called only when the intake or chart points there | KP |
| `get_d6_chart` | Shashtamsa, the classical companion to the chronic-disease panel | Vedic Parashari, cross-system reference |
| `get_d8_chart` | Ashtamsa, the companion to the lifespan band | Vedic Parashari, cross-system reference |
| `get_d30_chart` | Trimsamsa. Corroborates the nervous-mental score | Vedic Parashari, cross-system reference |

Nine of the 31 tools are not orthodox KP. Eight are Vedic Parashari, and one is KP-extended. The
system prompt tags each of them inline. It tells the model to attribute any finding from them to
its own system, never as a KP verdict. In the classical texts, health astrology draws heavily on
Parashari technique. So these tools are close to a third of the app's own tool set, not an edge
case.

## The orthodox KP chain replaced `get_vedha_transit`

The earlier build used `get_vedha_transit` as its mandatory timing trigger. It described the tool
as a KP transit rule. A check against the tool taxonomy disproved that framing.
`get_vedha_transit` reads the traditional Gochara transit-obstruction rule, and the taxonomy tags it
Vedic Parashari, not KP. KP does not accept that rule as a transit trigger.

The tool gated the `peak_window` claims of a health app. That made it a correctness problem, not a
labelling nit. So the build replaced the tool instead of relabelling it. The timing trigger is now
the orthodox KP transit chain, where each step feeds the next:

1. `get_ruling_planets` returns the timing-verification set.
2. `get_fruitful_significators` intersects the significator matrix with the ruling planets, per
   event.
3. `get_transit_timing_hierarchy` runs the Saturn-to-Moon cascade. It opens a window only where the
   star and sub lord of a fruitful significator line up.

The chain makes three tool calls in place of one, so the app's tool count moved from 29 to 31.

The other option was to relabel `get_vedha_transit` as a cross-system reference and keep it as a
secondary signal. The build set that option aside. The app called the tool its *mandatory* trigger,
and a discredited rule should not gate a claim, however clearly someone labels it.

## What it costs

| Path | Calls per analysis |
|---|---|
| As shipped, all 31 tools, no oncology branch | **30** |
| As shipped, oncology branch triggered | **31** |
| Minimum useful profile (`get_full_chart`, `analyze_natal_promise`, `get_chronic_disease_panel`) | 3, plus 1 per extra page |

The free plan is 300 tool calls a month per account. All keys on an account share it. So the
shipped path runs about 9 to 10 analyses a month on the free plan. After that, calls draw on the
pack balance. This app is the heaviest in the set by design. A clinical-adjacent read earns the
depth that a floor of 20 or more calls buys.

## Paging is a correctness requirement here, not an optimization

`analyze_natal_promise`, `get_chronic_disease_panel` and `get_sade_sati_phases` all return paged
results. The protocol asks about some rows by name: chronic illness, mental health, accident and
hospitalization. These rows can sit on page 2, 3 or 4. After every call to these three tools, the
prompt tells the model to:

- read `pagination.totalItems` and `pageNote`.
- request the next page until it finds the row it needs, or until no pages remain.
- never write "not exposed in the matrix" from a single page.

In most apps, a page you skip is a payload you save. Here it is a promise that the reading never
checked. In a health context, that reads as false reassurance, not as a shorter answer.

## The 8 body systems

| System | Primary planets | Primary houses |
|---|---|---|
| Cardiovascular | Sun, Moon | 4, 5 |
| Respiratory | Mercury, Moon | 3, 4 |
| Digestive | Moon, Mercury, Jupiter | 5, 6 |
| Nervous & Mental | Mercury, Moon, Saturn | 3, 5 |
| Musculoskeletal | Saturn, Mars | 10, 11 |
| Endocrine & Metabolic | Jupiter, Venus | 2, 9 |
| Reproductive & Urinary | Venus, Mars | 7, 8 |
| Immune & Vitality | Sun, Jupiter | 1, 8 |

Each system carries a list of aggravating chart factors that the prompt checks. Severity has four
bands: 0 to 29 is low, 30 to 54 is moderate, 55 to 74 is elevated, and 75 to 100 is high.

## Birth-time fallback

Most people do not know their exact birth time. The form lets them tick "I don't know my birth
time". When they do:

- the app uses 12:00 noon as the birth time.
- the prompt skips ascendant-derived analysis (1st cusp CSL, Lagna-lord vitality).
- the prompt relies on planetary placements, nakshatra and dasha. The dasha is Moon-driven, so it
  works without an exact time.
- `get_significators`, `get_multi_system_verdict`, `get_fruitful_significators` and
  `get_transit_timing_hierarchy` become approximate, because they depend on the cusps.
- `get_sade_sati_intensity` stays reliable, because Lumin computes it from the natal Moon.
- the vitality index loses about 15 points of confidence, and the constitutional notes say so.

## Run it

```bash
# from the repo root
bun install
cp apps/health-risk-analyzer/.env.example apps/health-risk-analyzer/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/api-keys

bun run --filter health-risk-analyzer dev   # http://localhost:3102
```

## Make it yours

1. Edit `src/data/body-systems.json`. You can add a system, change the karaka weighting, or change
   the hue for your brand. Keep the schema (`primary_planets`, `primary_signs`, `primary_houses`,
   `aggravating_factors`).
2. Edit `src/lib/prompt.ts`. You can tighten the severity bands or add more screening tests. Make
   the disclaimer match the clinical disclosure rules of your jurisdiction.
3. Restyle `src/app/globals.css` and `src/components/*` with your colors and typography.
4. For a clinical deployment, replace the front-end intake with your existing EHR or patient form.
   Send the JSON output to your physician dashboard.

## The disclaimer it ships

> This is a supplementary lens derived from the KP horoscope, not diagnostic and never a substitute
> for medical evaluation. Use it as a screening prompt: every elevated or high finding should be
> discussed with a qualified physician who can order appropriate tests. Longevity output is a
> qualitative band only and never a death-date prediction. Oncology, chronic-disease, accident, and
> Ayurvedic outputs are all supplementary lenses, not clinical findings.

The system prompt requires this disclaimer. The route checks it as a required field when the
response arrives. `DisclaimerBanner` shows it on every result.

Three layers keep the longevity band qualitative:

1. The prompt says never a date or a number of years.
2. The system prompt names the exact valid bands.
3. The disclaimer repeats the constraint. So the constraint survives even if something downstream
   misreads a field.

## License

MIT.
