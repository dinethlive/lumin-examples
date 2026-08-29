# Lumin Examples

Open-source example apps showing how to integrate **Lumin MCP** (`mcp.lumin.guru`) into product experiences.

Each app is a self-contained project that demonstrates one B2B integration pattern: a customer's UI calls their backend, the backend calls Anthropic's Messages API with Lumin MCP attached, and the structured response is rendered as a feature, not a chatbot.

```
Customer UI button
  -> Customer backend
  -> Anthropic Messages API + mcp.lumin.guru attached
  -> Claude picks Lumin tools, returns structured JSON
  -> Customer UI renders the result (cards, panels, widgets)
```

## Apps

| App | What it does | Vertical |
|-----|--------------|----------|
| [`wellness-matcher`](./wellness-matcher) | Quiz that matches Ayurvedic skincare and wellness products to a person's KP-derived prakriti, driven by `get_ayurvedic_constitution` with a `get_shadbala` strength cross-check and a visible dosha-balance meter | D2C wellness, Ayurvedic e-commerce |
| [`products-matcher`](./products-matcher) | Generalist e-commerce matcher: derives the visitor's consumer personality plus public-image and soul-drive chart signals (Arudha Lagna, Jaimini Atmakaraka, Shadbala), then picks 5 products across categories (flowers, cakes, jewelry, electronics, home, fashion) | Generalist e-commerce marketplaces (Kapruka, Daraz, FernsNPetals) |
| [`health-risk-analyzer`](./health-risk-analyzer) | Constitutional health risk profile across 8 body systems, plus a body-region panel, a chart-confidence audit, the Saturn cycle, a vitality index, peak windows, surgery/recovery timing, and a screening calendar | Integrative & Ayurvedic clinics, telehealth, corporate wellness, insurance underwriting |
| [`weather-windows`](./weather-windows) | Outdoor-window planner: fortnightly KP astrometeorology weather windows for a place and date range, scored for temperature, rain, and wind. The first non-natal, location-based example | Outdoor event venues, agritech, tour operators, outdoor logistics |

## Aligned with the v4 Lumin MCP (144 tools)

These examples track the **v4 Lumin MCP**, which grew from 78 tools (the May-2026 directory audit) to **144**. The v4 sweep added 62 KP tools, 8 composite `run_*` workflows, and a 4-tool **astrometeorology** family, the first non-natal tools. What the examples now wire:

- **`run_pre_verdict_audit`** is the v4 chart-integrity gate. It bundles the sub-lord boundary check, combustion, planetary war, and vargottama strength into one pass and returns a confidence band and modifier. `health-risk-analyzer` surfaces it as a chart-confidence pill.
- **Jaimini and planetary-strength tools** sharpen the personality and constitution reads: `get_arudha_lagna` (public image) and `get_chara_karakas` (Atmakaraka soul drive) in `products-matcher`, and `get_shadbala` (six-fold planetary strength) in `products-matcher`, `wellness-matcher`, and `health-risk-analyzer`.
- **Health-specific v4 tools** deepen `health-risk-analyzer`: `get_health_organ_panel` (the sign-to-body-region affliction map), `get_sade_sati_phases` (the Saturn 7.5-year cycle), and the `get_d6_chart` / `get_d8_chart` / `get_d30_chart` divisional charts for disease, longevity, and the mind.
- **The astrometeorology family** (`get_weather_windows`, `get_seasonal_outlook`, `get_astro_weather`, `get_monsoon_forecast`) is place-based, not person-based: it takes a location and date, never birth data. `weather-windows` is the first example built on it.
- **`get_bhadhakasthana`** is threaded through every promise and health-blockage analysis (lagna-mobility-driven blockage house: movable to 11, fixed to 9, dual to 7).
- **Disclaimer language stays normalized** per the directory audit gates: health = "supplementary lens, not diagnostic"; longevity = qualitative band only, NEVER death dates; astrometeorology = "an astrological weather lens, not a meteorological forecast"; sensitive personal lenses are B2B-only.
- **Brand voice rule (no em dashes)** is enforced in prompts and copy.

## Why these exist

These are sales artifacts. When a product manager at a wellness brand or matrimonial app asks "what would this look like in our app?", point them at the repo and the Loom walkthrough. Each example takes a single weekend to fork into a branded prototype.

## Adding a new example

1. Copy an existing example as the starting point.
2. Keep the integration pattern: server-side route, Anthropic SDK with `mcp_servers` attached, structured JSON response, no chatbot UI.
3. For a natal app, include a chart-integrity check (`run_pre_verdict_audit`, or `get_boundary_warnings` for the lighter check) and the appropriate disclaimer phrasing for the vertical. For a place-based app, use the astrometeorology family and skip `set_birth_profile`.
4. Add it to the table above.

## License

MIT.
