# Career fit

A vocational fit and career timing console for a coaching platform, built from thirteen
separate KP tools rather than one blended score. Each screen reports what its own tool
actually returned, side by side, so a coach and their client can see the mechanism, not
just a verdict.

**Vertical:** career-coaching platforms, executive coaching, vocational guidance services.

<!-- screenshot: docs/career-fit.png -->

## What it wires

| Tool | What it contributes | System |
|---|---|---|
| `run_pre_verdict_audit` | Chart-integrity audit: sub-lord boundary, combustion, planetary war and vargottama strength, folded into one confidence band and modifier. Run first | KP |
| `get_boundary_warnings` | Flags every cusp and planet within 10 arc minutes of a sub-lord boundary | KP |
| `analyze_natal_promise` | The promise gate across every defined life event; this app reads the "Career / Job Start" row. **Paged**, and nothing states a verdict before it returns | KP |
| `get_career_cusp_panel` | The five career cusps (2, 6, 7, 10, 11) against the four negation cusps (1, 5, 9, 12), summed into a career balance band | KP |
| `get_career_signature` | Scores the chart against eight named career categories, plus sector, employment mode and leadership/technical/creative axes | KP |
| `get_profession_description` | Industry, sector, employment mode and a qualitative salary band, from the 10th CSL's star lord | KP |
| `get_occupation_matches` | Modern occupation leanings from the 10th cusp triad, each match carrying a provenance tag and a source quote. **Paged**, and the weakest-confidence tool in the suite by its own description | KP |
| `get_job_vs_business_verdict` | Salaried service against running one's own concern, decided by five independently sourced rules, reported separately | KP |
| `get_promotion_verdict` | The 11th-cusp three-condition promotion gate, with dated windows | KP |
| `get_job_change_timing` | Dated job-change windows from the sourced promise test, both published leaving-house derivations reported side by side | KP |
| `get_earned_income_panel` | A qualitative income grade and increment windows across houses 2, 6, 10, 11. Never a figure or a rate | KP |
| `get_career_blockage_diagnosis` | The 10th CSL's missing houses turned into up to four named, period-bound diagnoses | KP |
| `get_d10_chart` | The Dasamsa divisional chart, the classical tradition's own career chart | **Vedic Parashari, cross-system reference, not part of the KP verdict** |

The `get_job_vs_business_verdict` panel is the point of this app: it renders its five
rules as five separate rows, each with its own citation and its own result, rather than
averaging them into one number. When the rules disagree, the disagreement is the finding,
and the app shows it as one.

The D10 chart is a different astrological tradition's own career chart, not a KP tool. It
renders in its own card with an amber chip, never folded into the promise verdict or the
fit scores above it. A Parashari divisional chart quietly entering a KP career verdict is
a methodology error that reads as thoroughness.

`get_termination_risk` is deliberately excluded from this example. It is a legitimate tool
in a coached setting, but it is the one output in this family that could be misused against
someone, and a public example should not model that.

## What it costs

| Path | Calls per reading |
|---|---|
| As shipped, thirteen tools, two of them paged | typically **14 to 18** |
| The composite alternative, `run_career_complete_reading` (not used here) | typically **9 to 10** |

The composite folds the promise verdict, the career signature, the profession
description, and the promotion-and-job-change timing into one call, at the cost of a
shallower summary: it does not carry the five job-vs-business rules named individually,
the occupation-match source quotes, or the career-cusp-panel's own disclaimer, which is
exactly the sourced detail every panel in this app renders. This app calls the standalone
tools instead, on purpose, because it exists to demonstrate that architecture. If your
product wants the cheaper, shallower read, `run_career_complete_reading` is a real tool on
the server; swap it in and drop the five tools it replaces from `ALLOWED_TOOLS`.

The free plan is 300 tool calls a month per credential, so this app runs roughly 17 to 21
full readings a month on the free tier, or about 30 on the composite path.

## Run it

```bash
# from the repo root
bun install
cp apps/career-fit/.env.example apps/career-fit/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/developer

bun run --filter career-fit dev   # http://localhost:3114
```

## Make it yours

- **Add the composite path as a fast mode.** Swap `run_career_complete_reading` into
  `ALLOWED_TOOLS` behind a toggle, drop `analyze_natal_promise`, `get_career_signature`,
  `get_profession_description`, `get_job_change_timing` and `run_pre_verdict_audit`, and
  read the bundled fields instead. Faster and cheaper, at the cost of the sourced detail
  the granular path carries.
- **Change the horizon.** The look-ahead years field is passed straight to
  `get_promotion_verdict`, `get_job_change_timing`, `get_earned_income_panel` and
  `get_career_blockage_diagnosis`. Widen the client-side max past 20 and the server
  clamps it back down, since two of those four tools cap at 20.
- **Add a second chart for comparison.** The response shape has no notion of a second
  person; a coach comparing two candidates for the same role would need the route to
  accept two birth profiles and render two consoles side by side.
- **Re-skin the ribbon.** `TimingPanel.tsx` draws a plain CSS ribbon with no chart
  library. Swap it for whatever timeline component your design system already has; the
  data shape (`{ start, end, reason }` windows) does not need to change.

## The disclaimer it ships

> A coaching aid built from a Krishnamurti Paddhati chart, meant for self-reflection and
> conversation with a coach. It is not a hiring, screening, selection or evaluation input,
> and must never be used to decide about someone else's employment or candidacy.
> Occupation matches are inclinations, not a shortlist. Income and promotion panels are
> qualitative only: no salary figure, currency amount or rate of increase is ever derived
> from a chart.

It is mandated in the system prompt, validated as a required field when the response
arrives, and rendered on the page every time. This app is built for a coaching
conversation between two people who have both agreed to have it. It must never be wired
into a hiring pipeline, an applicant tracking system, or any flow that decides about
someone without their knowledge and consent: nothing here is a screening or evaluation
input, and the occupation-match panel in particular is explicitly the weakest-confidence
layer in the whole KP career suite, built to say so about itself.
