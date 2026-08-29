# Contributing

## Adding an example

1. Copy the closest existing app under `apps/`. `today-panel` is the smallest and the cleanest
   starting point; it is the reference implementation for everything below.
2. Keep the pattern: a server route, `runLumin` from `@lumin-examples/client`, structured JSON out,
   typed React cards. No chatbot UI. The model never speaks to the user.
3. Give it a port nobody else uses, and add it to the CI matrix in `.github/workflows/ci.yml`,
   the table in the root README, and `USE-CASES.md`.

## The rules that are not style preferences

**Verify every tool name.** Never write one from memory. `npm run check:tools` parses every file in
the repo and fails on a name the server does not expose, and it runs in CI. A wrong name is a
silent tool-not-found inside a model conversation, where nobody sees it.

**Never hand-write a tool count.** The server's surface changes. A typed figure is wrong by the
next release and a model reads it as authoritative over the tool list actually in front of it.
Describe the capability, or read `pagination.totalItems` at runtime.

**Label every non-KP tool where you use it.** Roughly a third of the surface is Vedic Parashari,
Jaimini, Tajik or KP-extended. The `system` field in the tool catalog is how you tell. Presenting
one of those as a KP finding is a methodology error that reads as thoroughness. Tag it inline in
the prompt and render a chip in the UI.

**Read paged tools to exhaustion.** Several tools page. Grep `paginate(` in the server's `tools.ts`
to find out whether one you allow does. Read `pagination.totalItems` and `pageNote` and call again
with `page` incremented. A paging miss silently turns "I did not look" into "not found", which is
worse than an error. A page is a unit of thinking, not a payload optimisation: the point is that
each slice gets a real reasoning pass, so more calls and more elapsed time are the intent.

**Disclaimers are data, not decoration.** Mandate the exact string in the system prompt, validate it
as a required field when the response arrives, and render it from a component. If the model omits
it, the response should fail validation rather than render without it. `USE-CASES.md` lists the
constraint that applies to each vertical.

**Some tools must never appear in a public example.** `get_extramarital_signature`,
`get_balarishta_panel` and `get_marital_separation` are advisor-only by their own descriptions.
`get_longevity_balarishta` returns a qualitative band and must never be rendered as a date or a
number of years.

## Voice

No em dashes, in copy, comments or READMEs. Use commas or parentheses. No emoji in UI. No model or
vendor names in user-facing text. Traditional terms (tithi, nakshatra, dasha, sublord) are correct
and wanted; let the interpretation field carry the plain-language meaning.

## Before you open a pull request

```bash
npm run check:tools
npm run typecheck -w apps/<your-app>
npm run build -w apps/<your-app>
```

All three must pass. CI runs them on every app.
