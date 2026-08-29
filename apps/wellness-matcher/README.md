# Wellness Matcher

A Lumin example: a single-page widget that asks for a customer's birth details and returns a personalized **Ayurvedic prakriti** (Vata / Pitta / Kapha mix) plus 4 recommended products from an Ayurvedic personal-care catalog, with reasoning grounded in the customer's actual KP/Vedic chart.

Designed as a drop-in pattern for D2C wellness brands (Spa Ceylon, Forest Essentials, Kama Ayurveda, Khadi, Just Herbs, etc.). The catalog is populated with 24 Ayurvedic products. Fork it and swap your own SKUs.

## How it works

```
Browser form (name, DOB, optional birth time, birth city as free text)
  -> POST /api/match
  -> Anthropic Messages API + mcp.lumin.guru attached
  -> Claude resolves the city to lat/lng/UTC offset (Step 0 of the system prompt)
  -> Claude calls Lumin tools:
       set_birth_profile, get_full_chart, get_planets, get_house_cusps,
       get_nakshatra_details, get_aspects_and_strength,
       get_boundary_warnings (sub-lord credibility check),
       get_ayurvedic_constitution (the dedicated prakriti tool),
       get_shadbala (six-fold planetary strength)
  -> Claude derives Ayurvedic prakriti from the engine's vata/pitta/kapha
     percentage triple, cross-checks against classical correspondences,
     ranks the constitution drivers by Shadbala strength, and picks 4
     catalog products
  -> Server hydrates matches with full product data
  -> Client renders resolved location, a prakriti card with the dosha-balance
     meter and constitution drivers, and the product grid
```

The **business logic lives in the server-side prompt** (`src/lib/prompt.ts`): city resolution, planet to dosha mapping, prakriti weighting, catalog rules. The Lumin MCP tools stay generic. Same pattern works for any vertical: change the prompt, change the catalog, ship a new feature.

### What v4 of the Lumin MCP added

The Lumin MCP grew from 78 tools (the May-2026 audit) to 144 in the v4 sweep, and has since grown to **~159 tools** (the session's live server). This example wires the prakriti-relevant subset:

- `get_ayurvedic_constitution` is the PRIMARY signal. It maps planets to doshas (Saturn/Rahu/Mercury to Vata, Sun/Mars/Ketu to Pitta, Moon/Jupiter/Venus to Kapha), weights by house importance and lagna-element bonus, and returns a vata/pitta/kapha percentage triple summing to 100, primary plus secondary dosha, prakritiCombo (single / dual / TRIDOSHIC), and per-planet contributions. The percentage triple is now surfaced in the UI as a dosha-balance meter, not discarded.
- `get_shadbala` (v4 Tier-B) adds the six-fold planetary strength (Sthana, Dig, Kala, Cheshta, Naisargika, Drik). The prompt crosses it with the engine's per-planet dosha contributions to rank the **constitution drivers**: a dosha-carrying planet that is also strong by Shadbala is a firm driver; one that is weak is a softer lean. When the strongest dosha contributor is weak, the summary says so, because it means the constitution is less fixed than the triple alone suggests.
- `get_boundary_warnings` is Phase-1 mandatory. CRITICAL flags (within 6 arc-minutes of a sub-lord boundary) tell the prompt that a small ayanamsa or birth-time correction would flip the sub-lord and invert the prakriti; the model downweights confidence accordingly.
- The prompt keeps the HYBRID DISCUSSION STARTER framing: output is a supplementary lens, not a clinical Ayurvedic prakriti reading and not standalone health advice.

### Why no new tools in the post-v4 review

The catalog's growth past v4 was reviewed against this app, and the prakriti tool set is deliberately unchanged. `get_ayurvedic_constitution` remains the only engine tool that returns the Vata/Pitta/Kapha triple, and it is already the spine of the read. One name is a deliberate trap worth flagging: **`check_doshas` is NOT Ayurvedic**. It detects classical *chart* afflictions (Manglik, Kalsarpa, Sadhesati, Pitra Dosha, Kemadruma), so wiring it here would pull marriage-and-karma signals into a constitution read. The health-oriented additions (`get_health_organ_panel`, `get_chronic_disease_panel`) are also out of scope for a personal-care brand: too clinical for a discussion-starter. The sibling `health-risk-analyzer` is the right home for those.

The form asks for a free-text birth city ("Colombo, Sri Lanka", "Mumbai", "Brooklyn, NY"). Claude resolves it to coordinates and the historical UTC offset using its built-in geographic knowledge: no separate geocoding API needed for the demo. The resolved coordinates are surfaced in the response so the user can verify Claude got the right city. For production traffic where reliability matters more than simplicity, swap in a real geocoding API (OpenCage, Google, Nominatim) before the Lumin call.

## Birth-time fallback

Most e-commerce visitors don't know their exact birth time. The form lets them tick "I don't know my birth time": we default to 12:00 noon and the prompt instructs Claude to skip ascendant/cusp logic and rely on planet placements plus Moon nakshatra only. The get_ayurvedic_constitution percentage triple still returns, but its lagna-element bonus and 1H weighting become unreliable; the summary explicitly notes the reduced precision.

## Run it

```bash
cp .env.example .env.local
# Add ANTHROPIC_API_KEY=sk-ant-... to .env.local

npm install
npm run dev
# http://localhost:3100
```

## Deploy

Vercel-ready. Set `ANTHROPIC_API_KEY` in project env vars and import.

## Customize for your brand

1. Replace `src/data/catalog.json` with your own products (same schema).
2. Edit `src/lib/prompt.ts` to adjust the planet→dosha mapping or add brand voice.
3. Restyle `src/app/globals.css` and `src/components/*` with your colors and typography.
4. Optionally swap the authless MCP endpoint for `/mcp/auth` + an API key when usage exceeds 50 calls/day per IP.

## License

MIT.
