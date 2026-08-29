# Muhurta scheduler

A date picker that knows what the date is for. Say what you are planning, give the window you can
work within and the hours you can actually use, and get one elected moment with the reason stated,
not a ranked list of guesses.

**Vertical:** scheduling and booking products (venues, clinics, registrars, launch and travel
planning tools) that want a real astrological election behind a "pick a date" step, not a horoscope
widget bolted onto the side of one.

<!-- screenshot: docs/muhurta-scheduler.png -->

## What it wires

| Tool | What it contributes | System |
|---|---|---|
| `get_election_catalog` | Every electable event with its house group, exclusions, default granularity and provenance. Free, takes no birth data, called once to build the event picker | KP |
| `find_wedding_muhurta`, `find_exam_time`, `find_interview_time`, `find_meeting_time`, `find_contract_signing_time`, `find_business_launch_time`, `find_travel_departure_time`, `find_property_muhurta`, `find_surgery_time` | The nine named electional tools. Each bakes its own event key, so the model cannot be talked out of it | KP |
| `find_election_window` | The generic fallback for any catalog event without a named tool, roughly 29 of the 38 | KP |
| `rank_candidate_dates` | Ranks 2 to 10 dates the user already has in mind, by the same test | KP |
| `get_muhurta_advanced` | The older three-condition triangulation (T40), run as an independent second opinion beside the four-layer election | KP |
| `get_panchang` | The five limbs and sunrise/sunset for the day the elected moment falls on | KP |
| `get_choghadiya_today` | The 1.5-hour period running at the elected moment | Vedic muhurta adjunct, **not** orthodox KP |
| `get_boundary_warnings` | Flags sub-lord boundaries within 10 arc-minutes in the native's own chart, the birth-time confidence pill | KP |

Fourteen tools are on the allowlist across the two main routes, but only one electional tool is
ever actually called per request. Which one is decided in code before the model runs, not guessed
by it. See "The detail worth copying" below.

## What it costs

| Path | Calls per request |
|---|---|
| Elect a moment (`/api/elect`): one electional tool + `get_muhurta_advanced` + `get_panchang` + `get_choghadiya_today` + `get_boundary_warnings` | **5** |
| Rank dates already in hand (`/api/rank`): `rank_candidate_dates` + `get_boundary_warnings` | **2** |
| Event picker (`/api/catalog`): `get_election_catalog`, free discovery call | **1** |

The free plan is 300 tool calls a month per credential, so this app runs roughly 60 full elections
a month on the free tier, or far more if visitors mostly rank dates they already have in mind. The
catalog call is cheap and can be cached hard: it takes no input at all, so the same response serves
every visitor until the event list itself changes.

## The three things this domain has to get right

**1. This family needs birth data.** Fourteen of the fifteen electional tools take the native's
birth details, because a KP election consults the running dasha lord of that person's chart, not
just the place and date of the event. Only `get_election_catalog` is person-free. This is not a
place-only app: the constraints screen asks for a birth date, time (or "I don't know it") and
place before it asks anything else.

**2. There is no score and there is no ranked top ten, by design.** The corpus has no numeric
ranking of moments anywhere. A tool in this family returns one moment, or up to three when the
selection tests genuinely cannot separate them, each with a stated reason. `ResultView.tsx` and
`RankResultView.tsx` render exactly that: a card labelled "Elected moment" plus, on a real tie,
cards labelled "Tied moment 2" and "Tied moment 3", never a numbered list past three and never a
percentage, a star rating or a bar chart standing in for a score. If you feel the UI wants a
ranking here, that instinct is exactly what this design rejects.

**3. Prefer a named tool over the generic one.** A named tool bakes its event key and cannot be
talked out of it; a model guessing an `event` string for the generic tool was measured resolving
"what date should I launch" to the wrong event entirely. This app goes one step further than "ask
the model to prefer it": `src/lib/event-routing.ts` maps each catalog key to its tool
deterministically, in code, and the route handler tells the model exactly one tool name to call.
There is nothing left to guess.

## Provenance, surfaced everywhere the event appears

Every catalog event carries a `provenance` value: `BOOK_SOURCED` or `WEB_SOURCED` means the corpus
states this house group for this matter, quote attached. `DERIVED_TABLE_D` or `DERIVED_CUSP_RULE`
means the group was generated, from the matter's own houses plus 6 and 11, or read off a cusp
sub-lord rule that names different numbers than the group it produces. `ProvenanceChip.tsx` renders
these as two visually distinct chips, warm for quoted, neutral for derived, on the event picker,
the constraints screen and the result screen. A house group the corpus states and one derived from
a formula are different claims and must never be presented as the same thing.

## The detail worth copying

**Tool routing is resolved in code, not left as a prompt instruction.** `event-routing.ts` exports
`NAMED_TOOL_ROUTES`, a plain object mapping a catalog key like `"marriage"` to
`{ tool: "find_wedding_muhurta" }`, or `"property_purchase"` to
`{ tool: "find_property_muhurta", extraParams: { mode: "purchase" } }`. `resolveElectionTool()`
looks up the event key the user picked on screen 1 and returns exactly one tool name and its extra
arguments; anything with no entry falls back to `find_election_window` with `event: <key>`. The
route handler puts that decision directly into the user message: "Call this tool: X, with these
fixed arguments: Y." The model's allowlist still spans all ten electional tools, which bounds cost
and blast radius, but which ONE of them runs on a given request is never a choice the model makes.

**The event's metadata travels with the request, not through the model.** `ElectInput` and
`RankInput` carry the elected houses, excluded houses, provenance and citation the picker screen
already fetched from `get_election_catalog`. The API route builds the response's `event` object
from that validated input, not from anything the model says, so the provenance chip on the result
screen can never disagree with the one the user clicked on. The model only produces the fields it
uniquely computes: the moments, the cross-check, the day context and the confidence pill.

**The hours field comes before the date range in both the prompt and the form.**
`preferred_time_of_day` is applied before anything else is compared, so hours outside it are never
counted, ranked or returned. `ConstraintsForm.tsx` puts "Hours you can actually use" ahead of "The
window to search" for the same reason the tool descriptions give it top billing: it is usually the
single biggest improvement to the answer, and asking for it after the date range buries the
highest-impact field beneath a lower one.

**Day context depends on the election result, so it is a second step inside the same tool run.**
`get_panchang` and `get_choghadiya_today` need a date to run against, and that date does not exist
until the electional tool has already answered. The system prompt in `prompt.ts` spells out the
sequence explicitly (call the electional tool, read `moments[0].startLocal`, then call the two
context tools for that date), rather than letting the model discover the dependency on its own.

**Confidence is about the native's own chart, not the elected moment.** `get_boundary_warnings` is
always called with the birth data alone, never the event location or the elected time. A cusp
sitting near a sub-lord boundary in the birth chart is what makes the dasha-lord and Ascendant
layers fragile to a small correction; it has nothing to do with which moment eventually gets
elected, so it is rendered as one pill beside the result rather than folded into a moment card.

## Run it

```bash
# from the repo root
bun install
cp apps/muhurta-scheduler/.env.example apps/muhurta-scheduler/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/developer

bun run --filter muhurta-scheduler dev   # http://localhost:3112
```

## Make it yours

- **Add the joint form.** `find_wedding_muhurta` and `find_contract_signing_time` both accept a
  `person2` block and switch to the two-chart shape. That is a genuine Lumin extension, not KP
  canon (the corpus holds exactly one worked two-chart election in 6,465 pages), and any UI that
  adds it needs to say so as plainly as the tool description does.
- **Cache the catalog.** `/api/catalog` takes no input and its answer barely changes; put it behind
  a long-lived cache and the event-picker screen costs nothing per visitor.
- **Add `find_auspicious_time` for a multi-ceremony plan.** It elects several events at once inside
  one scan, which is the right shape for "wedding day plus the reception plus the departure",
  rather than three separate calls to this app.
- **Swap the palette.** The "elected" gold and the neutral "derived" grey in `ProvenanceChip.tsx`
  and `globals.css` are a placeholder; keep the rule that a quoted claim and a derived one read as
  visually different, whatever colours you pick.

## The disclaimer it ships

Elect screen:

> Election in KP is read-only. It locates a moment the chart already points at and does not cause
> the outcome. This tool returns one moment, or up to three on a genuine tie, never a ranked list.

Rank screen:

> Election in KP is read-only. Of the dates you gave, this ranks the one your chart points at
> first, it does not cause the outcome. There is no score behind this order, only the same layered
> test used to elect a moment from scratch.

Both are mandated in their system prompts, validated as a required field when the response arrives,
and rendered by `DisclaimerNote`. If a model omits either one, the response fails validation and
the request errors rather than rendering a moment with no disclaimer attached.
