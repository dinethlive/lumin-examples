<p align="center">
  <img src=".github/assets/lumin-logo.svg" alt="Lumin" width="132">
</p>

<p align="center">
  Example apps built on the <a href="https://mcp.lumin.guru">Lumin MCP server</a>.<br>
  KP astrology inside a product feature, not a chatbot.
</p>

---

## Apps

| App | What it does | Birth data |
|---|---|---|
| [`today-panel`](./apps/today-panel) | Panchang, choghadiya and hora for any city | No |
| [`horary-desk`](./apps/horary-desk) | Ask a question, pick a number 1 to 249, get a verdict | No |
| [`weather-windows`](./apps/weather-windows) | Outdoor windows for a place and date range | No |
| [`muhurta-scheduler`](./apps/muhurta-scheduler) | A date picker that knows what the date is for | Yes |
| [`kundli-match`](./apps/kundli-match) | Three compatibility systems, side by side | Two charts |
| [`career-fit`](./apps/career-fit) | Vocational fit and timing, each rule reported separately | Yes |
| [`wellness-matcher`](./apps/wellness-matcher) | Ayurvedic products matched to a chart-derived constitution | Yes |
| [`products-matcher`](./apps/products-matcher) | Consumer personality, then products across categories | Yes |
| [`health-risk-analyzer`](./apps/health-risk-analyzer) | Constitutional risk across body systems | Yes |

Three need no personal data at all. 21 of the server's tools take only a place and a date, or
only a number and a moment, so you can ship a real feature with no consent flow.

**[USE-CASES.md](./USE-CASES.md)** lists 98 more, with the tool chain for each.

## Run one

```bash
npm install
cp apps/today-panel/.env.example apps/today-panel/.env.local
npm run dev -w apps/today-panel     # http://localhost:3110
```

Two keys. `ANTHROPIC_API_KEY` is yours, the model bill is yours.
`LUMIN_API_KEY` comes from [app.lumin.guru/developer](https://app.lumin.guru/developer).

Top up any amount from $1 for 400 calls. A lookup is a few calls, a full reading is 25 to 40.

## The pattern

Every app calls [`packages/lumin-client`](./packages/lumin-client).

```ts
const result = await runLumin({
  allowedTools: ALLOWED_TOOLS,   // the model can call these and nothing else
  system: buildSystemPrompt(),
  user: buildUserPrompt(input),
  maxTokens: 16000,
  effort: "xhigh",
  signal: req.signal,
});
const parsed = ensureShape(parseJsonBlock<MatchResponse>(result.text), validate);
```

It handles what a bare `messages.create` does not: `pause_turn` resumption, refusals and
truncation mapped to real statuses, a check that some Lumin tool actually ran, and the rate
limit that arrives as tool-result text rather than an HTTP status.

## Contributing

[CONTRIBUTING.md](./CONTRIBUTING.md). Two rules matter most. Verify every tool name, because
`npm run check:tools` fails CI on one that does not exist. Label every non-KP tool, because a
third of the surface is Parashari, Jaimini or Tajik.

MIT. See [LICENSE](./LICENSE).
