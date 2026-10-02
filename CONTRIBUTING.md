# Contributing

## Adding an example

1. Copy the closest app under `apps/`. `today-panel` is the smallest and the cleanest starting
   point. It is the reference implementation for everything below.
2. Keep the pattern: a server route, `runLumin` from `@lumin-examples/client`, structured JSON out,
   and typed React cards. Add no chatbot UI. The model never speaks to the user.
3. Give the app a port that no other app uses. Then add the app to these places:
   - the CI matrix in `.github/workflows/ci.yml`
   - the table in the root README
   - `USE-CASES.md`

## The rules that are not style preferences

**Check every tool name.** Never write one from memory. `bun run check:tools` parses every file in
the repo. It fails on a name that the server does not expose, and CI runs it. A wrong name becomes
a silent tool-not-found error inside a model conversation, where nobody sees it.

**Never write a tool count by hand.** The set of server tools changes. A typed figure is wrong by
the next release. A model also trusts a typed figure over the tool list that it actually sees.
Describe the capability, or read `pagination.totalItems` at runtime.

**Label every non-KP tool where you use it.** Roughly a third of the tools are Vedic Parashari,
Jaimini, Tajik or KP-extended. The `system` field in the tool catalog tells you which. If you
present one of those findings as KP, you make a methodology error that looks like thoroughness. Tag
the tool inline in the prompt. Render a chip for it in the UI.

**Read paged tools to the last page.** Several tools return their results in pages. To learn
whether a tool that you allow pages, search for `paginate(` in the server's `tools.ts`. Read
`pagination.totalItems` and `pageNote`. Then call again with the next `page`. A paging miss silently
turns "I did not look" into "not found", which is worse than an error.

A page is a unit of thinking, not a payload optimisation. Each slice gets a real reasoning pass. So
more calls and more elapsed time are the intent.

**Disclaimers are data, not decoration.**

1. Require the exact string in the system prompt.
2. Validate it as a required field when the response arrives.
3. Render it from a component.

If the model omits the disclaimer, the response should fail validation, not render without it.
`USE-CASES.md` lists the constraint that applies to each vertical.

**Some tools must never appear in a public example.** These three are advisor-only by their own
descriptions: `get_extramarital_signature`, `get_balarishta_panel` and `get_marital_separation`.
`get_longevity_balarishta` returns a qualitative band. Never render that band as a date or a number
of years.

## Voice

- Use no em dashes in copy, comments or READMEs. Use commas or parentheses.
- Use no emoji in the UI.
- Use no model or vendor names in user-facing text.
- Use traditional terms (tithi, nakshatra, dasha, sublord). They are correct and wanted. Let the
  interpretation field carry the plain-language meaning.

## Before you open a pull request

```bash
bun run check:tools
bun run --filter <your-app> typecheck
bun run --filter <your-app> build
```

All three must pass. CI runs them on every app.
