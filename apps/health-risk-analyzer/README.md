# Health Risk Analyzer

A Lumin example: a single-page widget that reads a person's KP/Vedic chart and returns a
**constitutional health risk profile** across eight body systems, with a vitality index, peak
vulnerability windows, surgery and recovery timing, and a screening calendar.

**Vertical:** integrative medicine clinics, telehealth apps, corporate wellness platforms, insurance
underwriters, and Ayurvedic chains, where a structured, prevention-oriented risk read complements
actual screening. The 8-system mapping runs on KP karaka logic. Fork it and extend the systems or
re-skin for your brand.

<!-- screenshot: docs/health-risk-analyzer.png -->

## What it wires

31 tool calls across a 7-step protocol.

| Tool | What it contributes | System |
|---|---|---|
| `set_birth_profile` | Validates inputs, returns the reading plan | KP |
| `get_full_chart` | Ascendant, planets, dasha overview | KP |
| `get_planets` | Exact positions, retrograde, combustion, dignities | KP |
| `get_house_cusps` | All 12 cusps; 1st, 6th, 8th, 11th, 12th sub lords are the health-critical set | KP |
| `get_nakshatra_details` | Moon nakshatra and pada | KP |
| `get_aspects_and_strength` | House strength scores | Vedic Parashari, cross-system reference |
| `run_pre_verdict_audit` | Chart-integrity gate: boundary, combustion, planetary war, vargottama in one pass, feeds `chart_confidence` | KP |
| `analyze_natal_promise` | Verdict for health, longevity, chronic-disease life events. **Paged.** | KP |
| `get_significators` | The 4-level house-signification matrix behind every "signifies 6/8/12" claim | KP |
| `get_multi_system_verdict` | 4-school consensus (KP CSL, KCIL, 4-Step, Bosmia) for Chronic Illness and Surgery | KP-extended |
| `get_bhadhakasthana` | The lagna-mobility-driven blockage house | KP |
| `get_csl_advanced` | Deep CSL chain for cusps 1, 6, 8, 12 | KP |
| `get_smart_current_dasha` | Current Mahadasha, Antardasha, Pratyantardasha | KP |
| `get_dasha_periods` | Full Vimshottari for the next 25 years | KP |
| `get_ruling_planets` | The KP timing-verification set (ascendant and Moon sign/star/sub lord, day lord) | KP |
| `get_fruitful_significators` | Significator matrix intersected with ruling planets, per event, meaning only these can deliver it | KP |
| `get_transit_timing_hierarchy` | Saturn-to-Moon transit cascade, opens a window only where a fruitful significator's star and sub lord align | KP |
| `get_medical_timing` | Surgery windows, recovery-versus-chronic differentiation | KP |
| `get_ashtakavarga` | Bindus on houses 1, 6, 8 for longevity strength | Vedic Parashari, cross-system reference |
| `get_chronic_disease_panel` | 8-condition watch-decade panel. **Paged.** | KP |
| `get_health_organ_panel` | Sign-to-body-region affliction map, the engine-backed Kaalpurusha panel | Vedic Parashari, cross-system reference |
| `get_accident_window` | Risk windows by class (vehicular, workplace, surgical, assault, generic) | KP |
| `get_longevity_balarishta` | Qualitative lifespan band, never a date or a number of years | KP |
| `get_sade_sati_phases` | Saturn's 7.5-year transit cycle. **Paged.** | KP |
| `get_sade_sati_intensity` | Sub-lord-resolved intensity peaks within the Sade Sati phase | KP |
| `get_ayurvedic_constitution` | Vata/Pitta/Kapha triple, feeds a one-line prakriti note | Vedic Parashari, cross-system reference |
| `get_oncology_timing` | Conditional: body-part risk and recurrence-versus-cure, only when the intake or chart points there | KP |
| `get_d6_chart` | Shashtamsa, the classical companion to the chronic-disease panel | Vedic Parashari, cross-system reference |
| `get_d8_chart` | Ashtamsa, the companion to the lifespan band | Vedic Parashari, cross-system reference |
| `get_d30_chart` | Trimsamsa, corroborates the nervous-mental score | Vedic Parashari, cross-system reference |

Nine of the 31 tools are not orthodox KP: eight Vedic Parashari, one KP-extended. The system prompt
tags every one of them inline and instructs the model to attribute any finding drawn from them
accordingly, never as a KP verdict. Health astrology draws heavily on Parashari technique in the
classical texts, so this is close to a third of the app's own tool set, not an edge case.

## `get_vedha_transit` was removed, and replaced with the orthodox KP chain

The earlier build used `get_vedha_transit` as its mandatory timing trigger and described it as a KP
transit rule. That framing did not survive a check against the tool taxonomy:
`get_vedha_transit` reads the traditional Gochara transit-obstruction rule, and the taxonomy tags it
Vedic Parashari rather than KP. KP does not accept that rule as a transit trigger.

Using it as the gating trigger for a health app's `peak_window` claims was a correctness problem
rather than a labelling nit, so it was replaced rather than relabelled. The
timing trigger is now the orthodox KP transit chain: `get_ruling_planets` (the timing-verification
set) feeds `get_fruitful_significators` (the significator matrix intersected with ruling planets,
per event), which feeds `get_transit_timing_hierarchy` (the Saturn-to-Moon cascade, which only opens
a window where a fruitful significator's star and sub lord line up). That is three tool calls in
place of one, which is why the
tool count moved from 29 to 31. Relabeling `get_vedha_transit` as a cross-system reference and
keeping it as a secondary signal was the other option on the table; it was set aside because the
app calls it the *mandatory* trigger, and a discredited rule should not gate a claim regardless of
how clearly it is labeled.

## What it costs

| Path | Calls per analysis |
|---|---|
| As shipped, all 31 tools, no oncology branch | **30** |
| As shipped, oncology branch triggered | **31** |
| Minimum useful profile (`get_full_chart`, `analyze_natal_promise`, `get_chronic_disease_panel`) | 3, plus 1 per extra page |

The free plan is 300 tool calls per month per credential, so the shipped path runs about 9 to 10
analyses a month on the free tier before the pack balance is drawn. This is the heaviest app in the
set by design: a clinical-adjacent read earns the depth a 20-plus call floor buys.

## Paging is a correctness requirement here, not an optimization

`analyze_natal_promise`, `get_chronic_disease_panel`, and `get_sade_sati_phases` are all paged. The
rows this protocol asks about by name, chronic illness, mental health, accident, and hospitalization,
can sit on page 2, 3, or 4. The prompt instructs the model to read `pagination.totalItems` and
`pageNote` after every call to these three tools and to keep paging until the row it needs is found
or the pages run out, and it forbids writing "not exposed in the matrix" from a single page. In most
apps a page you skip is a payload you saved. Here it is a promise the reading never checked, which
in a health context reads as false reassurance rather than a shorter answer.

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

Each system carries a list of aggravating chart factors the prompt looks for. Severity is banded:
0 to 29 low, 30 to 54 moderate, 55 to 74 elevated, 75 to 100 high.

## Birth-time fallback

Most people do not know their exact birth time. The form lets them tick "I don't know my birth
time": the app defaults to 12:00 noon and the prompt skips ascendant-derived analysis (1st cusp CSL,
Lagna-lord vitality), leaning on planetary placements, nakshatra, and dasha (Moon-driven, so it
works without an exact time). `get_significators`, `get_multi_system_verdict`,
`get_fruitful_significators`, and `get_transit_timing_hierarchy` all lean on the cusps, so they
become approximate; `get_sade_sati_intensity` is computed from the natal Moon and stays reliable.
The vitality index loses about 15 points of confidence and the constitutional notes say so.

## Run it

```bash
# from the repo root
npm install
cp apps/health-risk-analyzer/.env.example apps/health-risk-analyzer/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/developer

npm run dev -w apps/health-risk-analyzer   # http://localhost:3102
```

## Make it yours

1. Adjust `src/data/body-systems.json`. Add a system, change the karaka weighting, swap the hue per
   brand. Keep the schema (`primary_planets`, `primary_signs`, `primary_houses`,
   `aggravating_factors`).
2. Edit `src/lib/prompt.ts`. Tighten the severity banding, add more screening tests, adjust the
   disclaimer to match your jurisdiction's clinical disclosure rules.
3. Restyle `src/app/globals.css` and `src/components/*` with your colors and typography.
4. For clinical deployments, replace the front-end intake with your existing EHR or patient form,
   and post the JSON output into your physician dashboard.

## The disclaimer it ships

> This is a supplementary lens derived from the KP horoscope, not diagnostic and never a substitute
> for medical evaluation. Use it as a screening prompt: every elevated or high finding should be
> discussed with a qualified physician who can order appropriate tests. Longevity output is a
> qualitative band only and never a death-date prediction. Oncology, chronic-disease, accident, and
> Ayurvedic outputs are all supplementary lenses, not clinical findings.

It is mandated in the system prompt, validated as a required field when the response arrives, and
rendered by `DisclaimerBanner` on every result. The longevity band is enforced as qualitative only
at three layers: the prompt says never a date or a number of years, the system prompt names the
exact valid bands, and the disclaimer repeats the constraint so it survives even if a field is
misread downstream.

## License

MIT.
