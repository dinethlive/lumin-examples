# Career fit

This is a console for vocational fit and career timing, for a coaching platform. It uses thirteen
separate tools, not one blended score. Each screen reports what its own tool returned, side by
side. So a coach and their client can see the mechanism, not only a verdict.

**Vertical:** career-coaching platforms, executive coaching, vocational guidance services.

<!-- screenshot: docs/career-fit.png -->

## What it wires

| Tool | What it contributes | System |
|---|---|---|
| `run_pre_verdict_audit` | Audits chart integrity: sub-lord boundary, combustion, planetary war and vargottama strength. Folds them into one confidence band and modifier. Runs first | KP |
| `get_boundary_warnings` | Flags every cusp and planet within 10 arc minutes of a sub-lord boundary | KP |
| `analyze_natal_promise` | The promise gate across every defined life event. This app reads the "Career / Job Start" row. **Paged**. Nothing states a verdict before it returns | KP |
| `get_career_cusp_panel` | The five career cusps (2, 6, 7, 10, 11) against the four negation cusps (1, 5, 9, 12), summed into a career balance band | KP |
| `get_career_signature` | Scores the chart against eight named career categories, plus sector, employment mode and leadership/technical/creative axes | KP |
| `get_profession_description` | Industry, sector, employment mode and a qualitative salary band, from the star lord of the 10th CSL | KP |
| `get_occupation_matches` | Modern occupation leanings from the 10th cusp triad. Each match carries a provenance tag and a source quote. **Paged**. By its own description, the weakest-confidence tool in the suite | KP |
| `get_job_vs_business_verdict` | Salaried service against a business of one's own. Five independently sourced rules decide it, and the tool reports each one separately | KP |
| `get_promotion_verdict` | The 11th-cusp three-condition promotion gate, with dated windows | KP |
| `get_job_change_timing` | Dated job-change windows from the sourced promise test. Reports both published leaving-house derivations side by side | KP |
| `get_earned_income_panel` | A qualitative income grade and increment windows across houses 2, 6, 10, 11. Never a figure or a rate | KP |
| `get_career_blockage_diagnosis` | The missing houses of the 10th CSL, turned into up to four named, period-bound diagnoses | KP |
| `get_d10_chart` | The Dasamsa divisional chart, the classical tradition's own career chart | **Vedic Parashari, cross-system reference, not part of the KP verdict** |

The `get_job_vs_business_verdict` panel is the point of this app. It shows its five rules as five
separate rows, each with its own citation and result. It does not average them into one number.
When the rules disagree, the disagreement is the finding, and the app shows it as a finding.

The D10 chart is the career chart of a different tradition. It is not a KP tool. It shows in its
own card with an amber chip. The app never folds it into the promise verdict or the fit scores
above it. If a Parashari divisional chart enters a KP career verdict without notice, that is a
methodology error. It reads as thoroughness.

This example excludes `get_termination_risk` on purpose. It is a legitimate tool in a coached
setting. But it is the one output in this family that someone could misuse against a person. A
public example should not model that.

## What it costs

| Path | Calls per reading |
|---|---|
| As shipped, thirteen tools, two of them paged | typically **14 to 18** |
| The composite alternative, `run_career_complete_reading` (not used here) | typically **9 to 10** |

The composite puts four things into one call: the promise verdict, the career signature, the
profession description, and the timing for promotion and job change. The cost is a shallower
summary. The composite does not carry:

- the five job-vs-business rules, each one named
- the source quotes of the occupation matches
- the disclaimer of the career cusp panel

That is exactly the sourced detail that every panel in this app shows. So this app calls the
standalone tools instead, on purpose. It exists to demonstrate that architecture.

If your product wants the cheaper, shallower read, `run_career_complete_reading` is a real tool on
the server. Put it in `ALLOWED_TOOLS`. Then remove the five tools that it replaces.

The free plan is 300 tool calls a month per account. All keys on an account share that allowance.
So this app runs roughly 17 to 21 full readings a month on the free plan, or about 30 on the
composite path.

## Run it

```bash
# from the repo root
bun install
cp apps/career-fit/.env.example apps/career-fit/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/api-keys

bun run --filter career-fit dev   # http://localhost:3114
```

## Make it yours

- **Add the composite path as a fast mode.**
  1. Put `run_career_complete_reading` into `ALLOWED_TOOLS` behind a toggle.
  2. Remove `analyze_natal_promise`, `get_career_signature`, `get_profession_description`,
     `get_job_change_timing` and `run_pre_verdict_audit`.
  3. Read the bundled fields instead.

  The fast mode is faster and cheaper. It loses the sourced detail that the granular path carries.
- **Change the horizon.** The route passes the look-ahead years field directly to
  `get_promotion_verdict`, `get_job_change_timing`, `get_earned_income_panel` and
  `get_career_blockage_diagnosis`. If you raise the client-side maximum above 20, the server
  reduces the value to 20 again. Two of those four tools have a cap of 20.
- **Add a second chart for comparison.** The response shape has no concept of a second person. A
  coach who compares two candidates for the same role would need two changes. The route would
  accept two birth profiles. The page would show two consoles side by side.
- **Change the look of the ribbon.** `TimingPanel.tsx` draws a plain CSS ribbon with no chart
  library. Replace it with any timeline component that your design system already has. The data
  shape, windows of `{ start, end, reason }`, does not need to change.

## The disclaimer it ships

> A coaching aid built from a Krishnamurti Paddhati chart, meant for self-reflection and
> conversation with a coach. It is not a hiring, screening, selection or evaluation input,
> and must never be used to decide about someone else's employment or candidacy.
> Occupation matches are inclinations, not a shortlist. Income and promotion panels are
> qualitative only: no salary figure, currency amount or rate of increase is ever derived
> from a chart.

The system prompt requires this disclaimer. The route checks it as a required field when the
response arrives. The page shows it every time.

This app is for a coaching conversation between two people who both agreed to have it. Never
connect it to any of these:

- a hiring pipeline
- an applicant tracking system
- any flow that decides about a person without their knowledge and consent

Nothing here is a screening or evaluation input. The occupation-match panel in particular states
explicitly that it is the weakest-confidence layer in the whole KP career suite. The tool says so
about itself, by design.
