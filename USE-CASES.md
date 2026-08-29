# What you can build on Lumin

A catalog of product use cases, each grounded in the tools that actually exist. Every tool name
here was verified against the server's tool list; `npm run check:tools` fails CI if one drifts.

The server exposes **204 tools**: 201 catalogued plus three meta-tools (`set_birth_profile`,
`get_reading_protocol`, `get_tool_catalog`). They are grouped into 29 families along four axes
(family, phase, system, prerequisites). Roughly a third of the surface is **not** orthodox KP
(Parashari, Jaimini, Tajik, KP-extended), and the `system` axis is how you tell. Presenting a
Parashari tool as a KP finding is a methodology error that reads as thoroughness, so label it.

---

## Start here: what you can ask the user for decides what you can build

This is the most useful fact on this page. Tools divide by **input class**, and the class decides
the product shape, the consent burden, and how much you have to ask a user for.

| Input class | Tools | What it needs | Consent friction |
|---|---|---|---|
| **Natal** | 172 | Birth date, time and place | High. Birth data is among the most identifying tuples a product can hold, and a large share of users do not know their birth time |
| **Place and/or date only** | 11 | A location and a date. No person at all | **None.** Cacheable per city per day, embeddable on a public page |
| **Horary** | 7 | A number 1 to 249 and the moment of asking | **None.** Answers real life questions with no birth data |
| **Two-person** | 9 | Two charts | High, doubled |
| **Mundane** | 2 | A country, company or location chart | None, no private individual |
| **Reference** | 3 | Nothing | None. Free discovery calls |

**21 tools need nothing personal at all.** These are the ones you can put on a public page with no
signup and no consent flow:

```
get_ephemeris            get_sublord_changes      get_transit_crossings    get_rp_interval
get_astro_weather        get_seasonal_outlook     get_weather_windows      get_monsoon_forecast
get_panchang             get_choghadiya_today     get_hora_today
get_horary_chart_v2      get_horary_advanced      get_medical_horary       get_career_horary
get_lost_or_missing      get_arrival_timing       get_horary_serial
get_election_catalog     get_reading_protocol     get_tool_catalog
```

Two corrections to assumptions people make from the family names, both verified against the engine:

- **The electional family is not place-only.** 14 of its 15 tools take the native's birth data,
  because KP election consults the running dasha lord of *that person's* chart. Only
  `get_election_catalog` is person-free.
- **The horary family takes birth-data-shaped field names but no birth.** `birth_datetime`,
  `latitude` and `longitude` carry the moment and place of **judgment**, not a birth.

---

## A. Matrimonial and dating

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 1 | Match score on every profile card | `run_kundli_match_complete`, or expanded: `get_ashta_koota_milan`, `check_compatibility`, `get_compatibility_advanced` | Never present a low score as a reason a relationship will fail |
| 2 | The dosha filter users actually search on | `check_doshas`, `get_kalsarpa_variants`, `run_pre_verdict_audit` | Names which of 12 variants applies, and carries the KP dissent. Never a disqualifier |
| 3 | Partner-description prefill for search facets | `analyze_natal_promise`, `get_spouse_characteristics`, `get_upapada_lagna` | Suggestions, always editable |
| 4 | When is marriage likely | `set_birth_profile`, `analyze_natal_promise`, `get_significators`, `get_ruling_planets`, `get_fruitful_significators`, `find_event_timing_v2`, `get_transit_timing_hierarchy`, `get_marriage_delay` | Windows, never single dates as certainties |
| 5 | Second-marriage counselling lane | `analyze_natal_promise`, `get_marriage_advanced`, `get_event_dasha` | Advisor-facing only |
| 6 | Separation-risk screening | `get_marital_separation`, `get_extramarital_signature` | **B2B advisor-only.** Never consumer-facing, never about a third party |
| 7 | Chemistry card with no birth time | `get_nakshatra_details`, `get_chara_karakas`, `get_arudha_lagna`, `get_ayurvedic_constitution` | Entertainment framing |
| 8 | Wedding date both families accept | `get_election_catalog`, `find_wedding_muhurta`, `find_joint_election_window`, `rank_candidate_dates` | The two-chart mode is a Lumin extension, label it |

**What this gives you:** three independent compatibility systems computed on the same two charts,
with disagreements surfaced rather than blended into one number.

## B. E-commerce and D2C personalization

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 9 | Onboarding profile that drives the catalog | `get_full_chart`, `get_nakshatra_details`, `get_arudha_lagna`, `get_chara_karakas`, `get_shadbala`, `get_d2_chart` | Entertainment framing |
| 10 | Gift finder keyed to the recipient | `get_nakshatra_details`, `get_yoga_karaka`, `get_ishta_devata`, `get_gemstone_recommendation` | Decorative, no fortune claims |
| 11 | Festival and auspicious-day merchandising | `get_panchang`, `get_choghadiya_today`, `get_hora_today`, `get_tara_bala` | None |
| 12 | Launch and drop timing | `get_election_catalog`, `find_business_launch_time`, `rank_candidate_dates`, `find_meeting_time` | Internal planning, not a sales promise |
| 13 | Loyalty tier keyed to a personal cycle | `get_smart_current_dasha`, `get_annual_forecast`, `get_saturn_return`, `get_jupiter_return` | None |
| 14 | Colour, metal and material palette | `get_yoga_karaka`, `get_gemstone_recommendation`, `get_ayurvedic_constitution` | Aesthetic personalization |
| 15 | Send-time optimisation per user | `get_moon_transit`, `get_sublord_changes`, `get_tara_bala` | None |

**What this gives you:** public image (`get_arudha_lagna`) and soul drive (`get_chara_karakas`) are
two different axes from two different traditions, and 27 birth-star buckets to segment on.

## C. Wellness, Ayurveda and beauty

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 16 | Prakriti quiz replacement | `get_full_chart`, `get_ayurvedic_constitution`, `get_shadbala`, `get_boundary_warnings` | Wellness framing, not medical |
| 17 | Seasonal regimen switching | `get_ayurvedic_constitution`, `get_seasonal_outlook`, `get_panchang` | The weather layer is an astrological lens, not a forecast |
| 18 | Skin and hair concern mapping | `get_ayurvedic_constitution`, `get_health_organ_panel`, `get_shadbala` | Cosmetic claims only. `get_health_organ_panel` is Parashari, label it |
| 19 | Fasting, cleanse and rest calendar | `get_panchang`, `get_tara_bala`, `get_chidra_dasha`, `get_moon_transit` | Wellness guidance |
| 20 | Practice recommender | `get_chara_karakas`, `get_ishta_devata`, `get_mantra_recommendation`, `get_past_life_karmic_panel` | Spiritual framing |
| 21 | Corporate wellness cohort dashboard | `get_vitality_index`, `get_chronic_disease_panel`, `get_health_transit_alerts` | **Aggregate only.** Individual output never reaches a manager |

**What this gives you:** a constitution derived from birth data rather than a questionnaire, so it
is deterministic and reproducible for the same user, with a data-quality signal from
`get_boundary_warnings`.

## D. Health and telehealth

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 22 | Constitutional risk profile at intake | `run_pre_verdict_audit`, `analyze_natal_promise`, `get_health_cusp_panel`, `get_vitality_index`, `get_chronic_disease_panel`, `get_health_organ_panel`, `get_d6_chart` | Supplementary lens, not diagnostic. No condition is ever asserted |
| 23 | Screening-reminder scheduler | `get_chronic_disease_panel`, `get_health_transit_alerts` (paged), `get_medical_timing` | "Consider a check", never "you will develop X" |
| 24 | Second-opinion prompt | `get_misdiagnosis_risk`, `get_disease_nature`, `get_treatment_modality` | Argues for more medical contact, never less |
| 25 | Recovery-window companion | `get_cure_window`, `get_medical_timing`, `get_current_health_status` | A promise gate runs first, so it can honestly say "not indicated" |
| 26 | Elective-procedure scheduling | `get_surgery_success`, `find_surgery_time`, `get_hospitalization_window` | Clinician-facing. Elected on the cure houses, not the disease houses |
| 27 | Mental-wellbeing reflection journal | `get_mental_health_panel`, `get_addiction_indicators`, `get_moon_transit`, `get_tara_bala` | **Never a diagnosis.** Crisis resources present |
| 28 | Ask-now triage, no birth data | `get_medical_horary`, `get_horary_serial` | Supplementary, never a substitute for triage |

**Longevity rule, absolute:** `get_longevity_balarishta` returns a qualitative band. Never a date,
never a number of years, in any surface, ever.

## E. HR, recruitment and career coaching

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 29 | Vocational-fit report | `run_career_complete_reading`, `get_career_signature`, `get_occupation_matches`, `get_profession_description`, `get_d10_chart` | **Never a hiring or screening input** |
| 30 | "Should I quit" console | `get_job_vs_business_verdict`, `get_career_blockage_diagnosis`, `get_job_change_timing`, `get_termination_risk` | Coaching only |
| 31 | Promotion and pay-review prep | `get_promotion_verdict`, `get_earned_income_panel`, `find_interview_time` | Individual coaching |
| 32 | Founder readiness check | `get_business_viability`, `get_job_vs_business_verdict`, `find_business_launch_time` | Not investment advice |
| 33 | Relocation and overseas assignment | `get_relocation_chart`, `get_foreign_job_verdict`, `get_foreign_settlement`, `get_visa_documentation` | Not immigration advice |
| 34 | Team-formation lens | `get_chara_karakas`, `get_yoga_karaka`, `get_shadbala`, `get_arudha_lagna` | **Voluntary, never for selection or evaluation** |
| 35 | Interview scheduling | `get_election_catalog`, `find_interview_time`, `rank_candidate_dates` | Candidate-driven only |

**Why it is defensible:** `get_job_vs_business_verdict` reports five sourced rules independently
rather than blending them, so a coach can see which rule carries the call.

## F. Education and EdTech

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 36 | Stream and track recommendation | `get_education_signature`, `get_d24_chart`, `get_occupation_matches` | Guidance aid, not a placement decision |
| 37 | Exam-window planner | `get_education_signature`, `get_event_dasha`, `find_event_timing_v2`, `find_exam_time` | Study effort is the determinant |
| 38 | Study-abroad counselling funnel | `get_education_signature`, `get_foreign_settlement`, `get_visa_documentation`, `get_relocation_chart` | Not immigration advice |
| 39 | Parent-facing child-strengths report | `get_nakshatra_details`, `get_d27_chart`, `get_yoga_karaka`, `get_relatives_karaka_panel` | **Strengths only.** `get_balarishta_panel` never appears in a parent-facing product |
| 40 | Cohort scheduling for an institute | `get_panchang`, `get_choghadiya_today`, `get_hora_today`, `rank_candidate_dates` | None |

One call to `get_education_signature` returns seven track scores, scholarship likelihood,
study-abroad promise and ranked exam windows for 15 years.

## G. Fintech, insurance and lending

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 41 | Personal financial-planning nudges | `analyze_natal_promise`, `get_financial_analysis`, `get_smart_current_dasha`, `get_annual_forecast` | **Not financial advice.** No returns, no instruments |
| 42 | Engagement layer for a wealth app | `get_sahams`, `get_varshaphala_chart`, `run_year_outlook_complete` | Entertainment, separated from any advice surface |
| 43 | Insurance underwriting research | `get_vitality_index`, `get_chronic_disease_panel`, `get_longevity_balarishta`, `get_accident_window` | **Research only.** Must not affect pricing or eligibility. Ship as a study, not a feature |
| 44 | Hardship-outreach timing | `get_smart_current_dasha`, `get_chidra_dasha`, `get_tara_bala` | Timing only, never terms or eligibility |
| 45 | Speculative-behaviour self-awareness | `get_speculative_intraday`, `get_financial_analysis` | **Never a buy or sell signal.** Ship with trading actions disabled |

## H. Real estate and property

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 46 | Buy, rent or wait card on a listing | `analyze_natal_promise`, `get_property_decision`, `get_d4_chart`, `get_event_dasha` | Not financial or legal advice |
| 47 | Registration and possession date picker | `find_property_muhurta` (purchase), `rank_candidate_dates` | Surface each mode's provenance |
| 48 | Housewarming scheduling for a builder | `find_property_muhurta` (griha pravesha), `get_panchang`, `get_choghadiya_today` | None |
| 49 | Groundbreaking and construction start | `find_property_muhurta` (foundation), `get_weather_windows`, `get_seasonal_outlook` | Weather is a lens, never a safety input |

`find_property_muhurta` is three genuinely different elections behind one tool, because purchase,
first entry and laying a foundation use different house groups.

## I. Travel and tourism

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 50 | Departure-time picker in a booking flow | `find_travel_departure_time`, `rank_candidate_dates`, `get_panchang` | Elects the departure, not the booking |
| 51 | Pilgrimage and retreat planner | `get_ishta_devata`, `find_travel_departure_time`, `get_panchang`, `get_tara_bala` | Devotional framing |
| 52 | Destination planner, **no signup** | `get_weather_windows`, `get_seasonal_outlook`, `get_monsoon_forecast`, `get_astro_weather` | Astrological weather lens, not a forecast |
| 53 | Lost-property desk | `get_lost_or_missing`, `get_arrival_timing`, `get_horary_serial` | Investigative lens, never a substitute for a police report |

## J. Events, weddings and venues

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 54 | Venue dates re-ranked by auspiciousness | `get_election_catalog`, `rank_candidate_dates`, `find_wedding_muhurta` | Label the joint mode as a Lumin extension |
| 55 | Multi-day ceremony run sheet | `find_auspicious_time`, `get_choghadiya_today`, `get_hora_today` | None |
| 56 | Corporate event and launch scheduling | `find_business_launch_time`, `find_meeting_time`, `get_mundane_ingress` | The mundane layer is a content lens |
| 57 | Contract-signing slot in a deal room | `find_contract_signing_time`, `get_muhurta_advanced` | Not legal advice |
| 58 | Naming ceremony and family rites | `get_election_catalog`, `find_election_window`, `get_panchang` | None |

`rank_candidate_dates` is the right call for a real scheduling conversation: the user names the 2
to 10 dates they can actually do, which is far cheaper than an open search.

## K. Agritech and outdoor logistics

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 59 | Sowing and harvest window planner | `get_monsoon_forecast`, `get_seasonal_outlook`, `get_weather_windows`, `get_astro_weather` | Not a meteorological forecast, not a crop-insurance input |
| 60 | Outdoor-shoot risk board | `get_weather_windows` (paged), `get_astro_weather`, `find_election_window` | Never a safety call |
| 61 | Fleet and dispatch daily overlay | `get_astro_weather`, `get_choghadiya_today`, `get_hora_today`, `get_panchang` | Advisory, never overrides a real forecast |
| 62 | Construction site scheduling | `get_seasonal_outlook`, `get_weather_windows`, `find_property_muhurta` | Show the elected moment and the weather window separately |
| 63 | Fishing and coastal operations | `get_weather_windows`, `get_moon_transit`, `get_panchang` | Never a safety-at-sea input |

**Zero PII, per-plot coordinates**, and a monsoon-onset read specific to South Asia that Western
astrology APIs do not have at all.

## L. Sports and gaming

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 64 | Fantasy-league flavour layer | `get_sport_outcome`, `get_ruling_planets`, `get_moon_transit` | **Never a betting signal.** Do not ship in a real-money product |
| 65 | Athlete peak calendar | `get_vitality_index`, `get_smart_current_dasha`, `get_accident_window`, `get_health_transit_alerts` | **B2B, voluntary.** Never a selection or fitness-clearance input |
| 66 | Amateur league fixture picker | `rank_candidate_dates`, `get_choghadiya_today`, `get_tara_bala` | Entertainment framing |

## M. Legal services

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 67 | Matter-intake triage | `analyze_natal_promise`, `get_legal_analysis`, `get_litigation_timeline` | **Not legal advice.** Internal lens, never shown to a client as an outcome |
| 68 | Filing-date selection | `find_election_window`, `get_muhurta_advanced`, `rank_candidate_dates` | Procedural deadlines always win. Never delay a limitation date |
| 69 | Detention and bail window tracking | `get_legal_analysis`, `get_litigation_timeline`, `get_event_dasha` | Advocate-facing only |
| 70 | Matter trend tracking, no client data | `get_horary_serial`, `get_rp_consensus` | Not advice, not evidence |

## N. Media, entertainment and content

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 71 | Daily editorial for 27 segments | `get_nakshatra_details`, `run_today_complete`, `get_tara_bala`, `get_moon_transit` | Entertainment framing |
| 72 | Celebrity chart explainers | `get_full_chart`, `analyze_natal_promise`, `get_career_signature`, `get_multi_system_verdict` | Public figures only, no health or private claims |
| 73 | "This week in the sky" newsletter | `get_ephemeris`, `get_transit_crossings` (paged), `get_sublord_changes`, `get_eclipse_impact` | None |
| 74 | Film and content release desk | `find_election_window`, `get_mundane_ingress`, `rank_candidate_dates` | None |
| 75 | Interactive "ask the sky" web toy | `get_horary_chart_v2`, `get_horary_advanced`, `get_lost_or_missing` | Entertainment framing |

Showing four schools disagreeing (`get_multi_system_verdict`) is a more interesting and more honest
format than one confident verdict.

## O. B2B SaaS personalization

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 76 | A personalization API for any consumer app | `set_birth_profile`, `get_tool_catalog`, then the routed plan | The consuming product owns its disclaimers |
| 77 | Segment builder for a CRM or CDP | `get_ayurvedic_constitution`, `get_chara_karakas`, `get_yoga_karaka`, `get_shadbala`, `get_arudha_lagna` | Birth data is personal data. Disclose it |
| 78 | Send-time optimisation as a service | `get_moon_transit`, `get_sublord_changes`, `get_rp_interval`, `get_tara_bala` | None |
| 79 | Data-quality service for an existing astrology product | `get_boundary_warnings`, `get_subsub_boundary`, `check_rule_of_origin`, `run_pre_verdict_audit` | None |
| 80 | Cross-system consensus as a confidence API | `get_multi_system_verdict`, `get_kcil_verdict`, `get_four_step_verdict`, `run_triple_dasha_consensus` | Label each school, never blend into one authority |

**#79 is worth calling out:** a service that scores how reliable an existing chart database is,
grounded in the fact that a small shift in birth time can change a verdict.

## P. Calendars, productivity and scheduling

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 81 | Calendar plugin that suggests when to do things | `get_election_catalog`, `find_meeting_time`, `find_contract_signing_time`, `rank_candidate_dates` | None |
| 82 | Focus and deep-work hour planner | `get_hora_today`, `get_choghadiya_today`, `get_moon_transit`, `get_sublord_changes` | None, and zero PII |
| 83 | Do-not-start band for a project tool | `get_chidra_dasha`, `get_retrograde_advanced`, `get_transit_crossings` | Advisory |
| 84 | Team meeting scheduler across charts | `find_meeting_time`, `find_joint_election_window` | Voluntary. Label the joint mode |

## Q. Local and regional services

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 85 | Panchang widget for a news site or temple portal | `get_panchang`, `get_choghadiya_today`, `get_hora_today` | None. Zero PII, three calls |
| 86 | Priest and ritual-services marketplace | `get_election_catalog`, `find_election_window`, `get_panchang`, `get_mantra_recommendation` | None |
| 87 | Regional almanac and festival app | `get_ephemeris`, `get_panchang`, `get_seasonal_outlook`, `get_mundane_ingress` | Content lens |

The day runs sunrise to sunrise, so the UTC offset is mandatory on the panchang family. Getting
that wrong makes every call a day early east of Greenwich, and it is the detail most
implementations miss.

## R. Research and data science

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 88 | Reproducibility study on horary practice | `get_horary_serial`, `get_rp_consensus`, `get_horary_advanced` | Publish the disagreement honestly |
| 89 | Cross-school divergence dataset | `analyze_natal_promise`, `get_kcil_verdict`, `get_four_step_verdict`, `get_bosmia_significators`, `get_multi_system_verdict`, `get_event_probability` | Consented or synthetic charts only |
| 90 | Birth-time sensitivity analysis | `get_twin_differentiation`, `get_twin_divergence_score`, `get_boundary_warnings`, `get_subsub_boundary`, `get_csl_advanced` | None |
| 91 | Historical mundane backtesting | `get_mundane_analysis`, `get_mundane_ingress`, `get_ephemeris`, `get_eclipse_impact` | **Historical lens only.** Never a confirmed prediction of disasters or epidemics |

## S. Consumer apps

| # | Product | Tool chain | Constraint |
|---|---|---|---|
| 92 | A daily horoscope that is actually per-person | `run_today_complete`, `get_smart_current_dasha`, `get_transit_analysis` | Entertainment framing |
| 93 | Birthday and solar-return experience | `get_varshaphala_chart`, `get_tithi_pravesha`, `run_year_outlook_complete`, `get_sahams` | Entertainment framing |
| 94 | Life-stage milestone app | `get_saturn_return`, `get_jupiter_return`, `get_ashtama_sani`, `get_sade_sati_phases`, `get_sade_sati_intensity` | Avoid fatalistic copy. The intensity view is the antidote |
| 95 | Reflective journaling companion | `get_past_life_karmic_panel`, `get_chara_karakas`, `get_bhrigu_bindu`, `get_moon_transit` | Reflection, never therapy |
| 96 | "Where should I live" comparison | `get_relocation_chart`, `get_bhadhakasthana`, `get_foreign_settlement` | Reflection framing |
| 97 | Family panel from one chart | `get_relatives_karaka_panel`, `get_d12_chart`, `get_d3_chart`, `get_d7_chart` | No health or lifespan claims about a relative who has not consented |
| 98 | Onboarding rescue when the birth time is unknown | `find_birth_time`, `get_twin_divergence_score`, `rectify_birth_time`, `check_rule_of_origin`, `get_boundary_warnings` | Always show the confidence. Never present a rectified time as certain |

**#98 matters more than it looks:** a large share of users do not know their birth time, and there
are four independent tools for recovering it.

---

## Three things every integration should do

**1. Read paged tools to exhaustion.** `get_weather_windows`, `get_health_transit_alerts`,
`get_transit_crossings`, `analyze_natal_promise`, `get_ephemeris`, `get_rp_interval`,
`find_birth_time` and `get_election_catalog` all page. A three-month crossing scan returns over a
thousand rows. Read `pagination.totalItems` and `pageNote`, and increment `page` until you have
what you need. A page is a unit of thinking, not a payload optimisation: the point is that each
slice gets a real reasoning pass.

**2. Respect the cross-system boundary.** 70 of 201 tools are not orthodox KP. Read the `system`
field from `get_tool_catalog` and render a chip beside any non-KP panel. This is a differentiator,
not an apology: no competitor can even tell you which tradition an answer came from.

**3. Size your usage.** Top up any amount from 1 USD, which is 400 tool calls, and any larger
amount works the same way. More calls means more readings, and deeper ones: a quick lookup is a
handful of calls, a full reading is 25 to 40. The eight `run_*` composites chain several engine
calls into one, which is the cheaper way to cover the same ground. Every example README states what
a single run costs.

---

## Where the examples sit against this catalog

The apps in this repo are chosen to exercise as much of the surface as possible, and to lead with
the two input classes that need no personal data.

| App | Use cases | Input class |
|---|---|---|
| `today-panel` | 11, 82, 85 | Place and date. Zero PII |
| `horary-desk` | 28, 53, 70, 75 | Horary. Zero PII |
| `muhurta-scheduler` | 12, 35, 47, 54, 58, 81, 86 | Natal plus a range |
| `kundli-match` | 1, 2, 3 | Two-person |
| `career-fit` | 29, 30, 31, 36 | Natal |
| `wellness-matcher` | 16 | Natal |
| `products-matcher` | 9, 14 | Natal |
| `health-risk-analyzer` | 22, 23 | Natal |
| `weather-windows` | 52, 59 | Place and date. Zero PII |
