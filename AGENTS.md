# Working in lumin-examples

This repo holds nine small products built on the Lumin MCP server at [lumin.guru](https://lumin.guru).
Every app has the same shape:

1. A server route calls `runLumin` from `@lumin-examples/client`.
2. The model calls an allowlisted set of Lumin tools.
3. The route returns validated JSON.
4. Typed React cards render it.

There is no chat UI. The model never speaks to the user.

Read `CONTRIBUTING.md` first. This file does not repeat its rules. CI checks the tool names, the
types and the build. This file adds what an agent needs to run, check and extend the repo without
guessing.

## Run an app

Bun is the package manager. Do not commit an npm lockfile.

```bash
bun install
cp apps/today-panel/.env.example apps/today-panel/.env.local   # then add your keys to it
bun run --filter today-panel dev
```

Every app reads the same variables from its own `.env.local`.

| Variable | Required | Meaning |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Yes | The model key. Whoever runs the app pays the model bill |
| `LUMIN_API_KEY` | Yes | A key from [app.lumin.guru/api-keys](https://app.lumin.guru/api-keys), prefix `mcp_`. Every Lumin endpoint needs credentials |
| `ANTHROPIC_MODEL` | No | The default is `claude-opus-5-5`. `claude-sonnet-5-5` is fine for a lookup-sized app |
| `LUMIN_MCP_URL` | No | The default is `https://mcp.lumin.guru/mcp` |

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

## Check a change

```bash
bun run check:tools                 # every tool name in the repo exists on the server
bun run --filter <app> typecheck
bun run --filter <app> build
```

`check:tools` reads `scripts/tool-names.json`. That file holds a snapshot of the server's
`tools/list` and the date of that snapshot. When the server gets a new tool, generate the snapshot
again from a live `tools/list`. Never add a name by hand.

## How a call reaches Lumin

`runLumin` sends a Messages API request. The request connects the Lumin server through the MCP
connector (`mcp_servers`, beta `mcp-client-2025-11-20`). Its `mcp_toolset` enables only the tools in
`allowedTools`. It also sets `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`). So a
declined request runs again on a fallback model inside the same call.

The loop:

- resumes on `pause_turn`.
- maps refusal and truncation to distinct errors.
- fails when no Lumin tool ran, or when every one failed.

That last check matters. A run in which every call returned 401 still produces well-formed JSON.
Without the check, that run would render as a finished reading.

Details that cost time when they are wrong:

- API keys go to `/mcp`. The `/mcp/auth` endpoint is OAuth only and rejects a key.
- Lumin's 429 arrives as tool-result text, not as an HTTP status. The client detects it and throws
  `lumin_rate_limited` with `retryAfterSeconds`. Lumin does not meter failed calls.
- The apps send birth data as five fields:
  - `birth_datetime`, as `YYYY-MM-DDTHH:MM:SS` on the local clock at the birthplace.
  - `latitude` and `longitude`.
  - `utc_offset_minutes`, the offset in force at birth, not today's.
  - `ayanamsa`, `kp` unless the user chose another.

  The server also takes `time_zone`, an IANA name such as `Asia/Colombo`, in place of
  `utc_offset_minutes`. With `time_zone`, the server finds the offset in force on the birth date
  itself.
- To call the server directly from curl or a script, POST JSON-RPC to `/mcp`. Send
  `Authorization: Bearer mcp_...` and `Accept: application/json, text/event-stream`. The server
  refuses a request that does not accept both types.
- A long reading needs `maxTokens` headroom. Tool-use blocks are model output and count against it.

## What the output may not do

- Claim an outcome. The output describes what the chart indicates. It carries the disclaimer that
  the vertical requires. The route validates the disclaimer as a required field, so a response
  without it fails and does not render.
- Present a non-KP tool as KP. Read `system` in `get_tool_catalog`. Tag the tool in the prompt.
  Render a chip for it in the UI.
- Stop at page one. Read `pagination.totalItems` and `pageNote`. Call again with the next `page`
  until no pages remain.
- Use `get_extramarital_signature`, `get_balarishta_panel` or `get_marital_separation`. Their own
  descriptions mark them advisor-only.
- Render `get_longevity_balarishta` as a date or a number of years. It returns a band.

## Copy

- Use no em dashes anywhere, including code comments.
- Use no emoji in the UI.
- Use no model or vendor names in user-facing text. Never describe anything as "AI-powered".
- Use traditional terms (tithi, nakshatra, dasha, sublord). They are correct and wanted.
- Never write how many tools Lumin has. Describe the capability instead.

## Adding an app

1. Copy `apps/today-panel`. It is the smallest app and the reference for the pattern.
2. Pick a port that the table above does not use.
3. Add the app to `.github/workflows/ci.yml`, to the table in the root README, and to
   `USE-CASES.md`.
4. Give the app a README with the sections that the others share:
   - What it wires
   - What it costs
   - Run it
   - Make it yours
   - the disclaimer it ships, where the vertical needs one

## Lumin in the editor

`.mcp.json` at the root connects Claude Code to the hosted server on its OAuth endpoint. Run `/mcp`.
Sign in once with an email code. Then you can call every Lumin tool while you build. Use this to
learn what a tool returns before you write a prompt for it.

The Lumin plugin adds the methodology as skills that load on demand:

```
/plugin marketplace add https://www.lumin.guru/plugin/marketplace.json
/plugin install lumin@lumin
```

`kp-build` is the skill for this repo. It covers the input classes, auth and metering, paging,
provenance and the copy rules. `kp-reading` runs a full reading when you need to see a complete
result. `kp-paging`, `kp-electional` and `kp-horary` load when the work touches their subject.

## Where things are

- `USE-CASES.md`: the product catalog, verticals A to S, each use case naming its tools.
- `packages/lumin-client`: `runLumin`, `logRun`, `parseJsonBlock`, `ensureShape`, `LuminClientError`.
- `scripts/check-tool-names.mjs` and `scripts/tool-names.json`: the tool-name check and its snapshot.
- [docs.lumin.guru/build](https://docs.lumin.guru/build): the developer track, one page per tool.
- [lumin.guru/pricing](https://lumin.guru/pricing): the free monthly allowance and the call packs.
- [lumin.guru/benchmarks](https://lumin.guru/benchmarks): what Lumin checks the engine against.
