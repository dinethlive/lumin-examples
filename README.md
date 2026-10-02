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
| [`horary-desk`](./apps/horary-desk) | A verdict on a question, from a number the asker picks (1 to 249) | No |
| [`weather-windows`](./apps/weather-windows) | Outdoor windows for a place and date range | No |
| [`muhurta-scheduler`](./apps/muhurta-scheduler) | A date picker that knows what the date is for | Yes |
| [`kundli-match`](./apps/kundli-match) | Three compatibility systems, side by side | Two charts |
| [`career-fit`](./apps/career-fit) | Vocational fit and timing, each rule reported separately | Yes |
| [`wellness-matcher`](./apps/wellness-matcher) | Ayurvedic products matched to a chart-derived constitution | Yes |
| [`products-matcher`](./apps/products-matcher) | Consumer personality, then products across categories | Yes |
| [`health-risk-analyzer`](./apps/health-risk-analyzer) | Constitutional risk across body systems | Yes |

Three apps need no birth data. Several of the server's tools take only a place and a date, or only
a number and a moment. With those tools, you can ship a real feature with no consent flow.

**[USE-CASES.md](./USE-CASES.md)** lists 98 more use cases, with the tool chain for each.

## Run one

You need [Bun](https://bun.sh) 1.2 or newer.

```bash
git clone https://github.com/dinethlive/lumin-examples
cd lumin-examples
bun install
cp apps/today-panel/.env.example apps/today-panel/.env.local   # then add your keys to it
bun run --filter today-panel dev     # http://localhost:3110
```

You need two keys:

- `ANTHROPIC_API_KEY`, your model key. You pay the model bill.
- `LUMIN_API_KEY`, from [app.lumin.guru/api-keys](https://app.lumin.guru/api-keys).

Every Lumin account gets 300 free tool calls each month. After that, you can top up any amount, from
$1 for 400 calls. A lookup uses a few calls. A full reading uses 25 to 40.

Bun is the package manager and task runner. Next itself still builds on Node, because Next 16
with Turbopack does not run under the Bun runtime yet.

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

The client handles five things that a bare `messages.create` does not:

- It resumes a turn that stops with `pause_turn`.
- It maps refusals and truncation to real statuses.
- It checks that some Lumin tool actually ran.
- It detects Lumin's rate limit, which arrives as tool-result text, not as an HTTP status.
- It turns on the server-side refusal fallback. A declined request runs again on a fallback model
  inside the same call.

## Building with an agent

`CLAUDE.md` imports `AGENTS.md`, which holds what an agent needs to run, check and extend the repo.
`.mcp.json` connects Claude Code to the hosted server. The Lumin plugin adds `kp-build`, the skill
for this kind of work.

```
/plugin marketplace add https://www.lumin.guru/plugin/marketplace.json
/plugin install lumin@lumin
```

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md). Two rules matter most:

- Check every tool name. `bun run check:tools` fails CI on a name that does not exist.
- Label every non-KP tool. Roughly a third of the tools are Parashari, Jaimini or Tajik.

The license is MIT. See [LICENSE](./LICENSE).
