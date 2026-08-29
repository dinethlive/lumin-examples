# Health Risk Analyzer

A Lumin example: a single-page widget that reads a person's KP/Vedic chart and returns a **constitutional health risk profile** across eight body systems, with a vitality index, peak vulnerability windows, surgery and recovery timing, and a screening calendar.

Designed as a drop-in pattern for **integrative medicine clinics, telehealth apps, corporate wellness platforms, insurance underwriters, and Ayurvedic chains** where a structured, prevention-oriented risk read complements actual screening. The 8-system mapping is populated with KP karaka logic. Fork it and extend the systems or re-skin for your brand.

## How it works

```
Browser form (name, DOB, optional birth time, birth city as free text, biological sex)
  -> POST /api/analyze
  -> Anthropic Messages API + mcp.lumin.guru attached
  -> Claude resolves the city to lat/lng/UTC offset
  -> Claude calls around 29 Lumin tools across a 7-step KP protocol:
     Phase 1 chart foundation:
       set_birth_profile, get_full_chart, get_planets, get_house_cusps,
       get_nakshatra_details, get_aspects_and_strength,
       run_pre_verdict_audit (chart-integrity gate: boundary, combustion,
         planetary war, and vargottama in one pass)
     Phase 2 + specialty tools:
       analyze_natal_promise,
       get_significators (4-level house-signification matrix that grounds
         every "planet that signifies 6/8/12" claim),
       get_multi_system_verdict (4-school consensus for chronic-illness and
         surgery verdicts), get_bhadhakasthana, get_csl_advanced,
       get_smart_current_dasha, get_dasha_periods,
       get_vedha_transit (Saturn/Jupiter transit favourability from natal
         Moon, the engine-backed peak-window trigger),
       get_medical_timing, get_ashtakavarga,
       get_shadbala (six-fold planetary strength),
       get_chronic_disease_panel (8-condition watch-decade scoring),
       get_health_organ_panel (sign-to-body-region affliction map),
       get_accident_window (vehicular/workplace/surgical/assault/generic),
       get_longevity_balarishta (qualitative lifespan band, no death dates),
       get_sade_sati_phases (Saturn 7.5-year cycle),
       get_sade_sati_intensity (sub-lord intensity peaks within the phase),
       get_ayurvedic_constitution (Vata/Pitta/Kapha hybrid lens),
       get_oncology_timing (conditional, when oncology is relevant),
       get_d6_chart / get_d8_chart / get_d30_chart (disease, longevity,
         and mind divisional charts that corroborate the main read)
  -> Claude derives:
       • vitality index (0-100, robust/balanced/fragile), downweighted by
         lifespan band and bhadhaka-maraka overlap
       • chart confidence (high/moderate/low + modifier) from the audit
       • constitutional basis (ascendant, lagna lord, Moon, dasha) with a
         Vata/Pitta/Kapha prakriti note
       • chronicity profile (acute / chronic / mixed)
       • 8 body-system risk cards informed by the chronic-disease panel
       • a body-region panel (top afflicted regions) from the organ panel
       • the Saturn cycle (Sade Sati phase and window)
       • surgery windows enriched with SURGICAL accident-class peaks,
         recovery periods
       • screening calendar (3-6 lab/imaging entries)
  -> Server hydrates risks with system metadata
  -> Client renders vitality dashboard + 8-card risk grid + body-region
     panel + timeline + screening calendar
```

The **business logic lives in the server-side prompt** (`src/lib/prompt.ts`): KP house framework, planet to disease karaka mapping, sign to body-part Kaalpurusha mapping, severity banding, screening rationale. The Lumin MCP tools stay generic. Same pattern as `wellness-matcher` and `products-matcher`, scaled to a multi-card clinical dashboard.

### What the v4 sweep added

The Lumin MCP grew from 78 tools (the May-2026 audit) to 144 in the v4 sweep, and has since grown to **~159 tools** (the session's live server). The May-2026 health tools are still the spine of this example:

- `get_chronic_disease_panel`: 8 chronic conditions (cardiac, diabetes, kidney, liver, neurological, mental-health, respiratory, skeletal) each with a 0-100 signature score, severity band, and watch-decade dasha periods. The model feeds these scores DIRECTLY into the matching system_risks entries.
- `get_accident_window`: risk windows by class with severity bands. SURGICAL windows enrich `surgery_windows`; VEHICULAR/WORKPLACE/ASSAULT inform musculoskeletal and immune-vitality peaks.
- `get_longevity_balarishta`: qualitative lifespan band (SHORT / MIDDLE / LONG / INDETERMINATE) plus ranked critical windows. NEVER predicts death dates or moments by design; the band downweights the vitality index when applicable.
- `get_ayurvedic_constitution`: Vata/Pitta/Kapha percentage triple plus primary-secondary dosha; written into `constitutional_basis.notes` as a one-line prakriti hint.
- `get_oncology_timing`: conditional, only when the user mentions cancer or the chart shows a Saturn-Rahu/Jupiter-Rahu cluster on 6/8/12. Returns body-part risk and recurrence-vs-cure verdict.

The v4 sweep adds five more tools and three divisional charts, each surfaced in the UI:

- `run_pre_verdict_audit` replaces the standalone boundary check. It bundles the sub-lord boundary warnings, combustion, planetary war, and vargottama strength into one pass and returns a confidence band and modifier, rendered as the chart-confidence pill on the vitality card.
- `get_health_organ_panel` scores each zodiac sign to a body region (the Kaalpurusha map) 0 to 100. It drives the new body-region panel card, the engine-backed version of the sign-to-body-part logic that used to live only in the prompt.
- `get_shadbala` adds six-fold planetary strength so an "afflicted" planet is judged genuinely weak, not merely placed in a difficult house. It tempers the vitality index.
- `get_sade_sati_phases` reads Saturn's 7.5-year transit cycle, a major health-stress window, surfaced as the Saturn-cycle block in the timeline.
- `get_d6_chart`, `get_d8_chart`, and `get_d30_chart` are the divisional charts for disease, longevity, and the mind; the model reads them to corroborate the chronic-disease, lifespan, and nervous-mental findings.

`get_bhadhakasthana` (the lagna-mobility-driven blockage house) remains threaded through every health-blockage discussion.

### What the post-v4 catalog added

Four tools from the growth past v4 close gaps the prompt used to reason about unaided:

- `get_significators` is the KP 4-level house-signification matrix (L1 planet in the star of a house occupant, through L4 planet as cusp lord). It is the engine-backed source for every "planet that signifies 6/8/12" statement the timing rules lean on, so the model pulls the disease-house significators once and reuses them.
- `get_vedha_transit` reads Saturn and Jupiter transit favourability from the natal Moon (KP Reader 5: Saturn favourable in 3/6/11, Jupiter in 2/5/7/9/11, each with its Vedha obstruction house). It is the transit trigger that turns a latent dasha vulnerability into a peak window. The prompt now grounds every `peak_window` trigger in this verdict instead of asserting a transit from memory.
- `get_sade_sati_intensity` resolves the Sade Sati phase down to a sub-lord intensity timeline (Saturn-in-sub-of-Saturn = peak, sub-of-Jupiter = relief). It fills the new `intensity`, `peak_window`, and `peak_theme` fields on the Saturn-cycle block, rendered as a peak-intensity meter on the timeline.
- `get_multi_system_verdict` returns a 4-school consensus (orthodox KP CSL, KCIL, 4-Step, Bosmia) for events such as Chronic Illness and Surgery. A SPLIT or MIXED consensus tells the model to state a finding softly; a STRONG or UNANIMOUS verdict lets it state it more firmly, and it folds into the chart-confidence summary.

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

Each system carries a list of aggravating chart factors that the prompt instructs Claude to look for. The output severity is banded: 0 to 29 low, 30 to 54 moderate, 55 to 74 elevated, 75 to 100 high.

## Why this is interesting for B2B

- Western medicine often catches diseases late. Constitutional astrology offers a complementary screening prompt, "where is the chart structurally weak, and when is exposure highest?", that clinicians can pair with actual labs.
- The output is **structured JSON** (not a chat blob), so it slots into existing EHR overlays, intake widgets, or wellness dashboards.
- The screening calendar pre-formats lab requests with rationale, so a physician can review and order without rebuilding the case from scratch.
- Vertical white space: corporate wellness platforms in 2026 use AI but no astrology layer. Ayurvedic chains have constitution mapping but no time-axis (peak windows). KP delivers both.

## Birth-time fallback

Most users don't know their exact birth time. The form lets them tick "I don't know my birth time", then we default to 12:00 noon and the prompt instructs Claude to skip ascendant-derived analysis (1st cusp CSL, Lagna lord-based vitality) and lean on planetary placements plus Moon nakshatra plus dasha (which is Moon-driven and works without exact time). The vitality index loses about 15 points of confidence in this mode and the constitutional notes flag the limitation.

## Run it

```bash
cp .env.example .env.local
# Add ANTHROPIC_API_KEY=sk-ant-... to .env.local

npm install
npm run dev
# http://localhost:3102
```

## Deploy

Vercel-ready. Set `ANTHROPIC_API_KEY` in project env vars and import. `maxDuration` is set to 180s on the API route to accommodate the tool set, around 29 calls (typical run: 60 to 150s).

## Customize for your vertical

1. Adjust `src/data/body-systems.json`. Add a system, change the karaka weighting, swap the hue per brand. Keep the schema (`primary_planets`, `primary_signs`, `primary_houses`, `aggravating_factors`).
2. Edit `src/lib/prompt.ts`. Tighten the severity banding, add more screening tests, adjust the disclaimer to match your jurisdiction's clinical disclosure rules.
3. Restyle `src/app/globals.css` and `src/components/*` with your colors and typography.
4. Swap the authless MCP endpoint for `/mcp/auth` plus an API key when usage exceeds 50 calls/day per IP.
5. For clinical deployments, replace the front-end intake with your existing EHR or patient form, and post the JSON output into your physician dashboard.

## Important: clinical disclaimer

This is a **supplementary lens, not diagnostic** and never a substitute for medical evaluation. Every elevated or high finding should be discussed with a qualified physician who can order appropriate tests. The longevity output is a qualitative band only; this app NEVER predicts death dates or moments by design (per the May-2026 Anthropic-directory audit gates). The disclaimer text is enforced server-side and surfaced in the UI on every result.

## License

MIT.
