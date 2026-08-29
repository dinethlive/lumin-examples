# Products Matcher

A Lumin example: a single-page widget that asks for a visitor's birth details and returns a personalized **consumer personality** read plus 5 product recommendations from a generalist e-commerce catalog (flowers, cakes, electronics, jewelry, fashion, hampers, home), with reasoning grounded in their actual KP/Vedic chart.

Designed as a drop-in pattern for generalist e-commerce sites with broad catalogs (Kapruka, Daraz, FernsNPetals, Amazon-style marketplaces). The catalog is populated with 30 Kapruka-style products across nine categories. Fork it and swap your own SKUs.

## How it works

```
Browser form (name, DOB, optional birth time, birth city as free text)
  -> POST /api/match
  -> Anthropic Messages API + mcp.lumin.guru attached
  -> Claude resolves the city to lat/lng/UTC offset
  -> Claude calls Lumin tools:
       set_birth_profile, get_full_chart, get_planets, get_house_cusps,
       get_nakshatra_details, get_aspects_and_strength,
       get_boundary_warnings (sub-lord credibility check),
       get_shadbala (six-fold planetary strength),
       get_arudha_lagna (public image), get_chara_karakas (soul drive),
       get_d2_chart (Hora / wealth-acquisition capacity)
  -> Claude derives the visitor's consumer personality (warm / intellectual / luxurious / traditional / homebody / elegant / practical / celebratory / nurturing / playful)
  -> Claude builds the chart signals: public image, core drive, strongest planet, spending capacity
  -> Claude picks 5 catalog products that fit the personality
  -> Server hydrates matches with full product data
  -> Client renders a personality card with the chart signals + product grid
```

The **business logic lives in the server-side prompt** (`src/lib/prompt.ts`): city resolution, planet to personality-trait mapping, catalog rules. The Lumin MCP tools stay generic. Same pattern as the sibling `wellness-matcher`, just a different mapping layer and a broader catalog.

### What the Lumin MCP catalog added

The Lumin MCP grew from 78 tools (the May-2026 audit) to 144 in the v4 sweep, and has since grown to **~159 tools** (the session's live server). The v4 sweep added Jaimini and planetary-strength tools that DO fit consumer-personality work, and the prompt now wires four beyond the credibility check:

- `get_arudha_lagna` reads the Arudha Lagna, the projected public image, how the world perceives the visitor. This is the closest KP/Jaimini reading to a consumer-facing persona, and it drives the **Public image** chart signal.
- `get_chara_karakas` returns the Jaimini chara karakas. The Atmakaraka, the planet at the highest degree within its sign, marks the soul's deepest craving, and it drives the **Core drive** signal.
- `get_shadbala` gives the six-fold planetary strength. It backs the **Strongest planet** signal and lets the prompt test whether a "strong planet" claim in the trait mapping is actually carried by strength rather than mere placement.
- `get_d2_chart` (the D2 / Hora divisional chart) reads wealth-acquisition capacity, each sign halved into a Sun hora (active earning, status spending) and a Moon hora (accumulation, value-mindedness). It drives the **Spending capacity** signal, grounding the premium-versus-practical lean in an actual chart factor rather than a guess. The hora split is longitude-based, so this signal survives the birth-time fallback.
- `get_boundary_warnings` stays the Phase-1 credibility check: if the lagna is CRITICAL (within 6 arc-minutes of a sub-lord boundary), the model downweights ascendant-driven traits and leans more on Moon-sign and nakshatra signals.

The trait mapping (planet to personality) still lives in the prompt; the new tools sharpen and audit it rather than replace it. The chart signals are surfaced in the personality card so a buyer can see the reading, not just the verdict. The brand-voice rule (no em dashes anywhere in model output or copy) is enforced in the prompt.

## Birth-time fallback

Most e-commerce visitors don't know their exact birth time. The form lets them tick "I don't know my birth time": we default to 12:00 noon and the prompt instructs Claude to skip ascendant/cusp logic and rely on planet placements plus Moon nakshatra only. The summary explicitly notes the reduced precision.

## Run it

```bash
cp .env.example .env.local
# Add ANTHROPIC_API_KEY=sk-ant-... to .env.local

npm install
npm run dev
# http://localhost:3101
```

## Deploy

Vercel-ready. Set `ANTHROPIC_API_KEY` in project env vars and import.

## Customize for your brand

1. Replace `src/data/catalog.json` with your own products (same schema).
2. Edit `src/lib/prompt.ts` to adjust the planet→trait mapping or add brand voice.
3. Restyle `src/app/globals.css` and `src/components/*` with your colors and typography.
4. Optionally swap the authless MCP endpoint for `/mcp/auth` + an API key when usage exceeds 50 calls/day per IP.

## License

MIT.
