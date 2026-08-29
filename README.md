# Lumin examples

Open-source example apps built on the [Lumin MCP server](https://mcp.lumin.guru). Each one is a
working Next.js app that puts KP astrology inside a product feature, not a chatbot.

```
Your UI
  -> your backend route
  -> Anthropic Messages API with mcp.lumin.guru attached
  -> the model picks Lumin tools and returns structured JSON
  -> your UI renders cards, panels, widgets
```

**[USE-CASES.md](./USE-CASES.md) is the catalog of what you can build**: 98 product use cases
across 19 verticals, each with the exact tool chain, the input class, and the compliance
constraint that applies to it.

## The apps

| App | What it does | Vertical | Needs birth data |
|---|---|---|---|
| [`today-panel`](./apps/today-panel) | Panchang, choghadiya and hora for any city, live, with the current band highlighted | Regional consumer, publishing, productivity | **No** |
| [`horary-desk`](./apps/horary-desk) | Ask a question, pick a number 1 to 249, get a reasoned verdict that can honestly refuse to answer | Consumer, support desks, research | **No** |
| [`weather-windows`](./apps/weather-windows) | Fortnightly outdoor windows for a place and date range, scored for temperature, rain and wind | Agritech, events, outdoor logistics | **No** |
| [`muhurta-scheduler`](./apps/muhurta-scheduler) | A date picker that knows what the date is for, across a catalog of electable events | Events, scheduling, property, travel | Yes |
| [`kundli-match`](./apps/kundli-match) | Three independent compatibility systems side by side, with the disagreements shown | Matrimonial | Yes, two charts |
| [`career-fit`](./apps/career-fit) | Vocational fit and career timing, with each rule reported separately | Career coaching, EdTech | Yes |
| [`wellness-matcher`](./apps/wellness-matcher) | Matches Ayurvedic products to a chart-derived constitution, replacing a 30-question quiz | D2C wellness, beauty | Yes |
| [`products-matcher`](./apps/products-matcher) | Derives a consumer personality and picks products across categories | E-commerce marketplaces | Yes |
| [`health-risk-analyzer`](./apps/health-risk-analyzer) | Constitutional risk across body systems, with a chart-confidence gate | Integrative clinics, corporate wellness | Yes |

Three of the nine need no personal data at all. That is deliberate: **21 of the server's tools take
only a place and a date, or only a number and a moment**, which means you can ship a real feature
with no consent flow, no birth-time collection, and no signup.

## Run one

```bash
git clone <this repo> && cd lumin-examples
npm install                       # one install covers every app

cp apps/today-panel/.env.example apps/today-panel/.env.local
# ANTHROPIC_API_KEY  your model key, the model bill is yours
# LUMIN_API_KEY      from https://app.lumin.guru/developer

npm run dev -w apps/today-panel   # http://localhost:3110
```

Every Lumin endpoint requires credentials. API keys go to `https://mcp.lumin.guru/mcp`; `/mcp/auth`
is the OAuth-only endpoint and rejects API keys. The free plan is 300 tool calls per month per
credential, so a 25-call reading is roughly a dozen free runs. Each app README states its call
count for both the composite path and the expanded path.

## The pattern every app follows

The integration is deliberately identical across all nine, and it lives in one place:
[`packages/lumin-client`](./packages/lumin-client).

```ts
const result = await runLumin({
  allowedTools: ALLOWED_TOOLS,   // deny-by-default: the model can call these and nothing else
  system: buildSystemPrompt(),
  user: buildUserPrompt(input),
  maxTokens: 16000,
  effort: "xhigh",
  signal: req.signal,
});
const parsed = ensureShape(parseJsonBlock<MatchResponse>(result.text), validate);
```

Four things it handles that a bare `messages.create` does not, each of which was a real bug in the
first generation of these examples:

- **`pause_turn`.** A long server-side tool loop reports "not finished" this way. Treating it as a
  failure is what made deep readings look broken. The client appends the content and continues.
- **`refusal`, `max_tokens`, `model_context_window_exceeded`.** Each maps to its own status instead
  of a blanket 502, so the browser can say something true.
- **"Did any tool actually run?"** Without this check, a run in which every Lumin call returned 401
  still produces well-formed JSON and renders as a finished reading.
- **Lumin's own 429.** It arrives as tool-result text inside the conversation, not as an HTTP
  status, so nothing upstream would otherwise notice a spent allowance.

Two more conventions worth copying:

**Deny-by-default tool allowlisting.** `default_config: { enabled: false }` plus an explicit
`ALLOWED_TOOLS` array bounds the cost, bounds the blast radius, and doubles as documentation of
what the feature reads.

**Server-side catalog hydration.** The model returns IDs and reasons; the server joins against the
real catalog and rejects unknown IDs. This is what stops hallucinated SKUs and prices.

## Adding an example

1. Copy the closest app under `apps/`.
2. Keep the pattern: a server route, `runLumin`, structured JSON, typed cards, no chatbot UI.
3. Verify every tool name against the live server. `npm run check:tools` fails if one does not
   exist, and it runs in CI.
4. Label every non-KP tool where you use it. Roughly a third of the surface is Parashari, Jaimini,
   Tajik or KP-extended, and presenting one as a KP finding is a methodology error that reads as
   thoroughness. The `system` field in the tool catalog is how you tell.
5. Add the disclaimer your vertical requires, as a validated response field rather than as UI
   decoration. [USE-CASES.md](./USE-CASES.md) lists the constraint for each vertical.
6. Add the app to the table above and to the CI matrix.

## License

MIT. See [LICENSE](./LICENSE).
