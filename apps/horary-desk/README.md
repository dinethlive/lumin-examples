# Horary desk

Ask one question. Pick a number between 1 and 249. You get a reasoned KP horary verdict, computed
live from the moment and place you asked. No birth date appears anywhere.

**Vertical:** consumer decision tools and advisory intake widgets. It suits any place where a
visitor has one specific question and does not want a birth form.

**This is the strongest "rule engine, not a text generator" demo in this repo**, because the tool
can honestly refuse to answer. KP horary starts with a Moon-connectivity check. If the Moon does
not signify the houses that the question is about, the question came before it was ripe. The
correct response is to say so, not to guess. This app has a real UI state for that refusal.

<!-- screenshot: docs/horary-desk.png -->

## What it wires

| Tool | What it contributes | System |
|---|---|---|
| `get_horary_chart_v2` | The chart cast from the number, plus the Moon-connectivity gate | KP |
| `get_horary_advanced` | Number intuition (does the chosen number's own sub lord confirm the question) | KP |
| `get_medical_horary` | Disease horary, 5 named query types, its own withhold gate | KP |
| `get_career_horary` | 14 named work questions, its own withhold gate | KP |
| `get_lost_or_missing` | Direction, distance, in-place location, recovery verdict | KP |
| `get_arrival_timing` | Will the awaited person, letter or conveyance arrive, and when | KP |
| `get_horary_serial` | Optional follow-up: compares two real sessions of the same question | KP |

Horary is the one family of Lumin tools with no cross-system tools to label. All seven tools above
are orthodox Krishnamurti Paddhati. So nothing here needs the "attribute it as such" treatment that
the other example apps give their Parashari or Jaimini tools.

## What it costs

| Path | Calls |
|---|---|
| A general question (no dedicated tool for the topic) | `get_horary_chart_v2` + `get_horary_advanced` = **2** |
| A medical, career, lost, or arrival question | + one type-specific tool = **3** |
| The optional "track this over time" follow-up | `get_horary_serial` = **+1**, once |

The free plan is 300 tool calls a month per account. All keys on an account share that allowance.
So this app runs 100 to 150 questions a month on the free plan. The number depends on how many
questions are general and how many are type-specific.

The composite `run_*` tools do not apply here. A horary question is cast for one moment. It is not
a life-area reading, so there is nothing to split across many tools.

## The gate is the product

`get_horary_chart_v2` runs a Moon-connectivity check against the catalog event that matches the
question. When the Moon does not signify the required houses, the app shows an amber "the chart is
not ready" card. That card is not an error and not a guessed answer. It gives the tool's own reason
in plain language. Its button returns the visitor to the form, to ask again later with a fresh
number, which is the orthodox remedy.

Other tools can also withhold an answer:

- `get_medical_horary` and `get_career_horary` have a second, independent withhold. They rotate
  the lagna to the relevant relation. They can fail their own connectivity test even when the base
  gate passed.
- `get_lost_or_missing` can return an inconclusive `WITHHELD` recovery verdict. This happens when
  its 11th cuspal sub lord has no overlap with the recovery houses or the loss houses.

The app treats each of these as a complete, honest answer everywhere:

- in the validation checklist of the prompt
- in the response shape, where a withheld chart carries a null `verdict` and an empty
  `timing.windows`, not a partial one
- in the UI

Nowhere does this codebase treat a withheld verdict as a failure.

## Run it

```bash
# from the repo root
bun install
cp apps/horary-desk/.env.example apps/horary-desk/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/api-keys

bun run --filter horary-desk dev   # http://localhost:3111
```

## The detail worth copying

**These seven tools spell the horary number field in three different ways. They spell the moment
and offset fields in two different ways.** This is the sharpest trap in the set. So read each field
name from the tool's own Zod schema. Never assume it from a neighbouring tool.

- `get_horary_chart_v2` and `get_horary_advanced` use `target_number`. They also use the full set
  of snake_case birth-data fields: `birth_datetime`, `latitude`, `longitude`,
  `utc_offset_minutes`, `ayanamsa`. The fields have birth-data names, the same as `get_panchang` in
  the today-panel example. But the values carry the QUERY moment and place, never a birth. This
  app has no birth chart anywhere.
- `get_lost_or_missing` and `get_arrival_timing` also use the snake_case birth-data fields, but the
  number field is `question_number`, not `target_number`.
- `get_medical_horary` and `get_career_horary` do not use the birth-data shape at all. They declare
  their own schema: `target_number` again, but `datetime` (not `birth_datetime`) and
  `utcOffsetMinutes` (camelCase, not `utc_offset_minutes`).
- The `sessions[]` entries of `get_horary_serial` use `questionNumber` (camelCase, a third
  spelling), with `datetime` and `utcOffsetMinutes`.

On the horary endpoints that need it, the MCP server maps `target_number` to the engine's internal
`questionNumber`. The model cannot see that mapping. The model must send the field name that the
schema of that specific tool declares. So the prompt gives the field names tool by tool. It never
trusts a pattern from the last tool that the model called.

**Two of the five question types have no matching event in the event catalog of the engine.**
`get_horary_chart_v2` and `get_horary_advanced` both check `query_event` against one fuzzy-matched
event list. The rest of the engine uses the same list: Marriage, Career / Job Start, Financial
Loss, and about 73 more. The list has no "Lost Article" or "Awaited Arrival" entry.

The prompt does not force a bad fuzzy match, and it does not skip the gate for those two types.
Instead, it names a labelled proxy:

- `Financial Loss` for lost, theft and missing-person questions
- `Return Home` for arrival questions

The response must say plainly that the event is a proxy. `get_lost_or_missing` and
`get_arrival_timing` compute their own verdicts from their own house logic. That logic is
completely independent of the proxy event. To present the two as the same claim would be a
provenance error. The `event` field of the response always names exactly the event that the base
gate checked.

**The "pick one for me" button never calls a tool.** In KP horary, the number must come from the
querent, from their own mind, at the moment they ask. A random-number helper is still legitimate
practice. It is the digital equivalent of "close your eyes and think of a number". But it must run
in the browser.

The button calls `crypto.getRandomValues` and fills the input at once. It needs no server round
trip and no model. The querent can still edit the number before they ask. The system prompt never
invents a number, under any condition.

**The place of judgment comes directly from the browser, not from a free-text city.** In KP
horary, the number sets the Ascendant. The engine solves the other eleven cusps from that
Ascendant for the LATITUDE of judgment, not the longitude. What matters is the place of judgment,
not the place where the querent asked the question.

So this app does not use the free-text city step of the today-panel example, where a model
resolves the city. It reads latitude and longitude directly from `navigator.geolocation`. The
person can override them by hand. If the browser denies permission, the default is Colombo, Sri
Lanka. A model has nothing to get wrong here.

## Make it yours

- **Add `get_horary_serial` history.** The app is stateless, so this demo starts a new
  two-session comparison every time. A real deployment would store earlier sessions (question,
  number, moment) for each visitor. It would extend the trend across more than two points.
- **Add `get_rp_consensus`.** A visitor may say "I have asked this before and want confirmation".
  For that case, the ruling planets that agree across sessions carry the highest predictive weight
  in KP. This tool is a natural addition beside `get_horary_serial`.
- **Narrow the question types.** Your product may handle only one kind of question. For example,
  a recruiting widget needs only career, and a clinic intake page needs only medical. Then remove
  the other type-specific tools from `ALLOWED_TOOLS`. Also remove the classification step from the
  prompt.
- **Persist the chart.** This app caches nothing. The same question and number one minute later
  read a slightly different sky, and can return a different verdict. That is correct KP behaviour,
  not a bug. It is worth saying to a visitor who asks twice.

## The disclaimer it ships

> A reflective lens on a question asked at a moment, not advice.

For a medical question, the response also carries this sentence:

> For a health question, this is a supplementary lens, not diagnostic, and it should never be
> read as a reason to delay or avoid seeking medical care.

The system prompt requires both strings. The route checks them as required fields when the
response arrives. It checks the medical sentence specifically when `questionType` is `"medical"`.
The page shows both. If the model omits either one, the response fails validation. The request
then returns an error instead of a page without the disclaimer.
