# Working in lumin-examples

Nine small products built on the Lumin MCP server at [lumin.guru](https://lumin.guru). Every app has
the same shape: a server route calls `runLumin` from `@lumin-examples/client`, the model calls an
allowlisted set of Lumin tools, the route returns validated JSON, and typed React cards render it.
There is no chat UI. The model never speaks to the user.

Read `CONTRIBUTING.md` first. Its rules are checked in CI and this file does not repeat them. This
file adds what an agent needs to run, verify and extend the repo without guessing.

## Run an app

Bun is the package manager. Do not commit an npm lockfile.

```bash
bun install
cp apps/today-panel/.env.example apps/today-panel/.env.local   # then fill it in
bun run --filter today-panel dev
```

Every app reads the same variables from its own `.env.local`.

| Variable | Required | Meaning |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Yes | The model key. The model bill belongs to whoever runs the app |
| `LUMIN_API_KEY` | Yes | A key from [developer.lumin.guru](https://developer.lumin.guru), prefix `mcp_`. Every Lumin endpoint needs credentials |
| `ANTHROPIC_MODEL` | No | Defaults to `claude-opus-5`. `claude-sonnet-5` is fine for a lookup-sized app |
| `LUMIN_MCP_URL` | No | Defaults to `https://mcp.lumin.guru/mcp` |

| App | Port | Birth data |
| --- | --- | --- |
| `wellness-matcher` | 3100 | Yes |
| `products-matcher` | 3101 | Yes |
| `health-risk-analyzer` | 3102 | Yes |
| `weather-windows` | 3103 | No |
| `today-panel` | 3110 | No |
| `horary-desk` | 3111 | No |
| `muhurta-scheduler` | 3112 | Yes |
| `kundli-match` | 3113 | Two charts |
| `career-fit` | 3114 | Yes |

## Verify a change

```bash
bun run check:tools                 # every tool name in the repo exists on the server
bun run --filter <app> typecheck
bun run --filter <app> build
```

`check:tools` reads `scripts/tool-names.json`, a snapshot of the server's `tools/list`. When the
server gains a tool, regenerate the snapshot from a live `tools/list`. Never add a name by hand.

## How a call reaches Lumin

`runLumin` sends one Messages API request with the Lumin server attached through the MCP connector
(`mcp_servers`, beta `mcp-client-2025-11-20`) and an `mcp_toolset` that enables only the tools in
`allowedTools`. The loop resumes on `pause_turn`, maps refusal and truncation to distinct errors,
and fails when no Lumin tool ran or every one failed. That last check matters: a run in which every
call returned 401 still produces well-formed JSON and would render as a finished reading.

Details that cost time when they are wrong:

- API keys go to `/mcp`. The `/mcp/auth` endpoint is OAuth only and rejects a key.
- Lumin's 429 arrives as tool-result text, not as an HTTP status. The client detects it and throws
  `lumin_rate_limited` with `retryAfterSeconds`. Failed calls are not metered.
- Birth data is five fields: `birth_datetime` as `YYYY-MM-DDTHH:MM:SS` on the local clock at the
  birthplace, `latitude`, `longitude`, `utc_offset_minutes` (the offset in force at birth, not
  today's), and `ayanamsa` (`kp` unless the user chose otherwise).
- Calling the server directly, from curl or a script: POST JSON-RPC to `/mcp` with
  `Authorization: Bearer mcp_...` and `Accept: application/json, text/event-stream`. The server
  refuses a request that does not accept both.
- A long reading needs `maxTokens` headroom. Tool-use blocks are model output and count against it.

## What the output may not do

- Claim an outcome. The output describes what the chart indicates and carries the disclaimer the
  vertical requires, validated as a required field so a missing one fails rather than renders.
- Present a non-KP tool as KP. Read `system` in `get_tool_catalog`, tag the tool in the prompt, and
  render a chip in the UI.
- Stop at page one. Read `pagination.totalItems` and `pageNote`, and call again with `page`
  incremented until the list is exhausted.
- Use `get_extramarital_signature`, `get_balarishta_panel` or `get_marital_separation`. They are
  advisor-only by their own descriptions. `get_longevity_balarishta` returns a band and is never
  rendered as a date or a number of years.

## Copy

No em dashes anywhere, code comments included. No emoji in UI. No model or vendor names in
user-facing text, and nothing described as "AI-powered". Traditional terms (tithi, nakshatra, dasha,
sublord) are correct and wanted. Never type a tool count. Describe the capability instead.

## Adding an app

Copy `apps/today-panel`, the smallest app and the reference for the pattern. Pick a port the table
above does not use. Add the app to `.github/workflows/ci.yml`, to the table in the root README, and
to `USE-CASES.md`. Give it a README with the sections the others share: What it wires, What it
costs, Run it, Make it yours, and the disclaimer it ships where the vertical needs one.

## Lumin in the editor

`.mcp.json` at the root connects Claude Code to the hosted server on its OAuth endpoint. Run `/mcp`,
sign in once with an email code, and every Lumin tool is callable while you build, which is how to
learn what a tool returns before you write a prompt around it.

The Lumin plugin adds the methodology as skills that load on demand:

```
/plugin marketplace add https://www.lumin.guru/plugin/marketplace.json
/plugin install lumin@lumin
```

`kp-build` is the skill written for this repo: the input classes, auth and metering, paging,
provenance and the copy rules. `kp-reading` runs a full reading when you need to see a complete
result. `kp-paging`, `kp-electional` and `kp-horary` load when their subject comes up.

## Where things are

- `USE-CASES.md`: the product catalog, verticals A to S, each use case naming its tools.
- `packages/lumin-client`: `runLumin`, `logRun`, `parseJsonBlock`, `ensureShape`, `LuminClientError`.
- `scripts/check-tool-names.mjs` and `scripts/tool-names.json`: the tool-name check and its snapshot.
- [docs.lumin.guru/build](https://docs.lumin.guru/build): the developer track, one page per tool.
- [lumin.guru/pricing](https://lumin.guru/pricing): the free monthly allowance and the call packs.
- [lumin.guru/benchmarks](https://lumin.guru/benchmarks): what the engine is checked against.
