# Muhurta scheduler

This app is a date picker that knows what the date is for. You say what you plan. You give the
window you can work within and the hours you can actually use. You get one elected moment with its
reason, not a ranked list of guesses.

**Vertical:** scheduling and booking products, such as venues, clinics, registrars, and launch and
travel planning tools. These products want a real astrological election behind a "pick a date"
step. They do not want a horoscope widget attached to the side of one.

<!-- screenshot: docs/muhurta-scheduler.png -->

## What it wires

| Tool | What it contributes | System |
|---|---|---|
| `get_election_catalog` | Every electable event, with its house group, exclusions, default granularity and provenance. Free and needs no birth data. The app calls it once to build the event picker | KP |
| `find_wedding_muhurta`, `find_exam_time`, `find_interview_time`, `find_meeting_time`, `find_contract_signing_time`, `find_business_launch_time`, `find_travel_departure_time`, `find_property_muhurta`, `find_surgery_time` | The nine named electional tools. Each has its own event key built in, so the model cannot switch it to another event | KP |
| `find_election_window` | The generic fallback for any catalog event without a named tool, roughly 29 of the 38 | KP |
| `rank_candidate_dates` | Ranks 2 to 10 dates the user already has in mind, by the same test | KP |
| `get_muhurta_advanced` | The older three-condition triangulation (T40). The app runs it as an independent second opinion beside the four-layer election | KP |
| `get_panchang` | The five limbs and sunrise/sunset for the day of the elected moment | KP |
| `get_choghadiya_today` | The 1.5-hour period running at the elected moment | Vedic muhurta adjunct, **not** orthodox KP |
| `get_boundary_warnings` | Flags sub-lord boundaries within 10 arc-minutes in the native's own chart. Feeds the birth-time confidence pill | KP |

The allowlists of the two main routes hold fourteen tools. But each request calls only one
electional tool. Code picks that tool before the model runs. The model does not guess it. See "The
detail worth copying" below.

## What it costs

| Path | Calls per request |
|---|---|
| Elect a moment (`/api/elect`): one electional tool + `get_muhurta_advanced` + `get_panchang` + `get_choghadiya_today` + `get_boundary_warnings` | **5** |
| Rank dates already in hand (`/api/rank`): `rank_candidate_dates` + `get_boundary_warnings` | **2** |
| Event picker (`/api/catalog`): `get_election_catalog`, free discovery call | **1** |

The free plan is 300 tool calls a month per account. All keys on an account share it. So this app
runs roughly 60 full elections a month on the free plan. It runs far more if visitors mostly rank
dates they already have in mind. The catalog call is cheap, and you can cache it for a long time. It
takes no input, so one response serves every visitor until the event list changes.

## The three things this domain has to get right

**1. This family needs birth data.** Fourteen of the fifteen electional tools take the native's
birth details. A KP election consults the running dasha lord of that person's chart, not only the
place and date of the event. Only `get_election_catalog` needs no person.

So this is not a place-only app. The constraints screen first asks for a birth date, a birth time
and a birthplace. A person who does not know the time ticks "I do not know the exact birth time".

**2. There is no score and there is no ranked top ten, by design.** The corpus has no numeric
ranking of moments anywhere. A tool in this family returns one moment with a stated reason. When
the selection tests genuinely cannot separate moments, it returns up to three, each with its
reason. `ResultView.tsx` and `RankResultView.tsx` render exactly that:

- a card labelled "Elected moment"
- on a real tie, cards labelled "Tied moment 2" and "Tied moment 3"

They never render a numbered list past three. They never use a percentage, a star rating or a bar
chart as a score. If you feel that the UI wants a ranking here, this design rejects exactly that
instinct.

**3. Prefer a named tool over the generic one.** A named tool has its event key built in, and the
model cannot switch it to another event. With the generic tool, the model must guess an `event`
string. A measurement showed that it resolved "what date should I launch" to the wrong event
entirely.

This app goes one step further than a request to prefer a named tool.
`src/lib/event-routing.ts` maps each catalog key to its tool deterministically, in code. The route
handler tells the model exactly one tool name to call. The model has nothing left to guess.

## Provenance, shown everywhere the event appears

Every catalog event carries a `provenance` value:

- `BOOK_SOURCED` or `WEB_SOURCED` means that the corpus states this house group for this matter. A
  quote comes with it.
- `DERIVED_TABLE_D` or `DERIVED_CUSP_RULE` means that a formula derived the group. The group
  comes from the matter's own houses plus 6 and 11, or from a cusp sub-lord rule. That rule
  names different numbers than the group it produces.

`ProvenanceChip.tsx` renders these as two visually distinct chips: warm for quoted, neutral for
derived. The chips show on the event picker, the constraints screen and the result screen. A house
group that the corpus states and a group that a formula derives are different claims. Never present
them as the same thing.

## The detail worth copying

**Code resolves the tool routing, not a prompt instruction.** `event-routing.ts` exports
`NAMED_TOOL_ROUTES`. This plain object maps a catalog key to a tool. For example, `"marriage"` maps
to `{ tool: "find_wedding_muhurta" }`, and `"property_purchase"` maps to
`{ tool: "find_property_muhurta", extraParams: { mode: "purchase" } }`.

`resolveElectionTool()` takes the event key that the user picked on screen 1. It returns exactly one
tool name and its extra arguments. A key with no entry goes to `find_election_window` with
`event: <key>`. The route handler puts that decision directly into the user message: "Call this
tool: X, with these fixed arguments: Y." The model's allowlist still spans all ten electional tools,
which bounds cost and blast radius. But the model never chooses which ONE of them runs on a request.

**The event's metadata travels with the request, not through the model.** `ElectInput` and
`RankInput` carry the elected houses, the excluded houses, the provenance and the citation. The
picker screen already got these from `get_election_catalog`. The API route checks that input. Then
it builds the `event` object of the response from the input, not from anything the model says.

So the provenance chip on the result screen can never disagree with the chip the user clicked. The
model produces only the fields that it alone computes: the moments, the cross-check, the day context
and the confidence pill.

**The hours field comes before the date range in both the prompt and the form.** The election
applies `preferred_time_of_day` before it compares anything else. So it never counts, ranks or
returns hours outside that field.

`ConstraintsForm.tsx` puts "Hours you can actually use" ahead of
"The window to search". The tool descriptions give this field top billing for the same reason. It is
usually the single biggest improvement to the answer. A form that asks for it after the date range
buries the highest-impact field beneath a lower one.

**Day context depends on the election result, so it is a second step inside the same tool run.**
`get_panchang` and `get_choghadiya_today` need a date to run against. That date does not exist until
the electional tool answers. The system prompt in `prompt.ts` states the sequence explicitly:

1. Call the electional tool.
2. Read `moments[0].startLocal`.
3. Call the two context tools for that date.

The prompt does not leave the model to discover the dependency on its own.

**Confidence is about the native's own chart, not the elected moment.** The app always calls
`get_boundary_warnings` with the birth data alone, never with the event location or the elected
time. A cusp near a sub-lord boundary in the birth chart makes the dasha-lord and Ascendant layers
fragile to a small correction. That fragility has nothing to do with which moment the tool elects.
So the app shows it as one pill beside the result, not inside a moment card.

## Run it

```bash
# from the repo root
bun install
cp apps/muhurta-scheduler/.env.example apps/muhurta-scheduler/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/api-keys

bun run --filter muhurta-scheduler dev   # http://localhost:3112
```

## Make it yours

- **Add the joint form.** `find_wedding_muhurta` and `find_contract_signing_time` both accept a
  `person2` block. With it, they switch to the two-chart shape. That shape is a genuine Lumin
  extension, not KP canon. The corpus holds exactly one worked two-chart election in 6,465 pages.
  Any UI that adds the joint form must say so as plainly as the tool description does.
- **Cache the catalog.** `/api/catalog` takes no input, and its answer barely changes. Put it behind
  a long-lived cache. Then the event-picker screen costs nothing per visitor.
- **Add `find_auspicious_time` for a multi-ceremony plan.** It elects several events at once, inside
  one scan. That is the right shape for "wedding day plus the reception plus the departure". It is
  better than three separate calls to this app.
- **Swap the palette.** The "elected" gold and the neutral "derived" grey in `ProvenanceChip.tsx`
  and `globals.css` are placeholders. Whatever colours you pick, keep one rule: a quoted claim and a
  derived claim must look different.

## The disclaimer it ships

Elect screen:

> Election in KP is read-only. It locates a moment the chart already points at and does not cause
> the outcome. This tool returns one moment, or up to three on a genuine tie, never a ranked list.

Rank screen:

> Election in KP is read-only. Of the dates you gave, this ranks the one your chart points at
> first, it does not cause the outcome. There is no score behind this order, only the same layered
> test used to elect a moment from scratch.

Each system prompt requires its disclaimer. The route checks it as a required field when the
response arrives, and `DisclaimerNote` shows it. If the model omits a disclaimer, the response fails
that check. The request then returns an error. It never renders a moment without a disclaimer.
