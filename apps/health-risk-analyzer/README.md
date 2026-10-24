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

The protocol has 7 steps. The table is the allowlist, `ALLOWED_TOOLS` in `src/lib/prompt.ts`.

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
| `get_paradigm_panel` | Chronic illness read by KP, KCIL, Four Step, Bosmia, Parashari, Jaimini and Tajik side by side, with how they relate (`disagreement.type`). No score, no vote. Rendered as the "Across schools" card | Cross-system |
| `get_bhadhakasthana` | The blockage house, driven by the mobility of the lagna | KP |
| `get_csl_condition` | Condition of the twelve cuspal sub lords (extent, combust star, retrograde delay), read for cusps 1, 6, 8, 11, 12. Reported, gates nothing | KP |
| `get_smart_current_dasha` | Current Mahadasha, Antardasha, Pratyantardasha | KP |
| `get_dasha_periods` | Full Vimshottari for the next 25 years | KP |
| `get_fruitful_significators` | Significator matrix intersected with the Ruling Planets of the moment of judgement, per event. Only these significators can deliver the event | KP |
| `get_transit_timing_hierarchy` | Saturn-to-Moon transit cascade. Opens a window only where the star and sub lord of a fruitful significator align | KP |
| `get_surgery_dasha_periods` | Whether the 1st, 6th and 8th CSLs promise surgery, and the dasha periods it falls due in. **Paged.** Feeds the surgery promise line and the surgery windows | KP |
| `get_chronic_recovery` | Recovery or persistence, from the 6th CSL's star lord (11th against 8th). Rendered as the "Recovery or persistence" block | KP |
| `get_ashtakavarga` | Bindus on houses 1, 6, 8 for longevity strength | Vedic Parashari, cross-system reference |
| `get_chronic_disease_panel` | 8-condition watch-decade panel. **Paged.** | KP |
| `get_health_organ_panel` | Sign-to-body-region affliction map, the engine-backed Kaalpurusha panel | Vedic Parashari, cross-system reference |
| `get_accident_window` | Risk windows by class (vehicular, workplace, surgical, assault, generic) | KP |
| `get_longevity_balarishta` | Qualitative lifespan band, never a date or a number of years | KP |
| `get_sade_sati_phases` | Saturn's 7.5-year transit cycle. **Paged.** | KP |
| `get_sade_sati_intensity` | Intensity peaks within the Sade Sati phase, resolved by sub lord | KP |
| `get_ayurvedic_constitution` | Vata/Pitta/Kapha triple. Feeds a one-line prakriti note | Vedic Parashari, cross-system reference |
| `get_malignancy_signatures` | Conditional. Six named planet-pair signatures, called only when the chart shows a Saturn-Rahu or Jupiter-Rahu cluster on 6/8/12. Supplementary indicator only | KP |
| `get_d6_chart` | Shashtamsa, the classical companion to the chronic-disease panel | Vedic Parashari, cross-system reference |
| `get_d8_chart` | Ashtamsa, the companion to the lifespan band | Vedic Parashari, cross-system reference |
| `get_d30_chart` | Trimsamsa. Corroborates the nervous-mental score | Vedic Parashari, cross-system reference |

Nine of the tools are not orthodox KP. Eight are Vedic Parashari, and one, `get_paradigm_panel`,
is cross-system. The
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

1. `get_fruitful_significators` intersects the significator matrix with the Ruling Planets of the
   moment of judgement (default now), per event, and reports that set in `judgement`.
2. `get_transit_timing_hierarchy` runs the Saturn-to-Moon cascade. It opens a window only where the
   star and sub lord of a fruitful significator line up.

An earlier version also called `get_ruling_planets`. Through this server that tool gives the
birth-moment set, which KP uses to rectify a birth time, not to time an event, and the fruitful
step already reads the judgement-moment set itself. So it was dropped.

## Step tools in place of bundles (2026-10-24)

Lumin split its bundled tools into step tools that each return one whole calculation. The app
now calls the step it reads, so the call count did not grow:

- `get_medical_timing` became `get_surgery_dasha_periods` and `get_chronic_recovery`. Each now has
  its own place on screen: the surgery promise line and the recovery block.
- `get_oncology_timing` became `get_malignancy_signatures`, the one block the profile used. Its
  window lists overlap the surgery and dasha tools, and its body-part map overlaps the organ panel.
- `get_csl_advanced` (renamed `get_csl_panel`, a KP-extended bundle of four blocks) became
  `get_csl_condition`, the KP condition of each cuspal sub lord.
- `get_multi_system_verdict` became `get_paradigm_panel`. The old tool averaged four KP-lineage
  schools into a consensus band, one call per event. The panel reads seven systems in one call,
  keeps each system's own verdict, names how they relate, and returns no score. When the schools
  split, the card shows the split.

The other option was to relabel `get_vedha_transit` as a cross-system reference and keep it as a
secondary signal. The build set that option aside. The app called the tool its *mandatory* trigger,
and a discredited rule should not gate a claim, however clearly someone labels it.

## What it costs

Each analysis makes one call per allowlisted tool, plus one per extra page and one per repeated
event (`get_fruitful_significators` and `get_transit_timing_hierarchy` run for Chronic Illness and
Surgery). The conditional `get_malignancy_signatures` runs only on the chart pattern it needs. The
route's `logRun` line prints the real count for each run. The free plan's monthly allowance is
shared by every key on an account, and after it calls draw on the pack balance. This app is the
heaviest in the set by design. A clinical-adjacent read earns the
depth that a floor of 20 or more calls buys.

## Paging is a correctness requirement here, not an optimization

`analyze_natal_promise`, `get_chronic_disease_panel`, `get_sade_sati_phases` and
`get_surgery_dasha_periods` all return paged results. The protocol asks about some rows by name: chronic illness, mental health, accident and
hospitalization. These rows can sit on page 2, 3 or 4. After every call to these tools, the
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
- `get_significators`, `get_paradigm_panel`, `get_csl_condition`, `get_chronic_recovery`,
  `get_surgery_dasha_periods`, `get_fruitful_significators` and `get_transit_timing_hierarchy`
  become approximate, because they depend on the cusps.
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
