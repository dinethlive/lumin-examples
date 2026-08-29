# Horary desk

Ask one question, pick a number between 1 and 249, get a reasoned KP horary verdict, computed
live from the moment and place you asked, with no birth date anywhere.

**Vertical:** consumer decision tools, advisory intake widgets, anywhere a visitor has one
specific question and no interest in filling out a birth form to get an answer.

**This is the strongest "rule engine, not a text generator" demo in this repo**, because the
tool can honestly refuse to answer. KP horary starts with a Moon-connectivity check: if the
Moon does not signify the houses the question is about, the question was asked before it had
ripened, and the correct response is to say so, not to guess. This app builds a real UI state
for that refusal.

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

Horary is the one family in the Lumin tool surface with no cross-system tools to label: all
seven of the above are orthodox Krishnamurti Paddhati, so nothing here needs the "attribute it
as such" treatment the other example apps carry for their Parashari or Jaimini tools.

## What it costs

| Path | Calls |
|---|---|
| A general question (no dedicated tool for the topic) | `get_horary_chart_v2` + `get_horary_advanced` = **2** |
| A medical, career, lost, or arrival question | + one type-specific tool = **3** |
| The optional "track this over time" follow-up | `get_horary_serial` = **+1**, once |

The free plan is 300 tool calls per month per credential, so this app runs 100 to 150 questions
a month on the free tier depending on how many are general versus type-specific. The composite
`run_*` tools do not apply here: horary is a moment-cast question, not a life-area reading, so
there is nothing to fan out.

## The gate is the product

`get_horary_chart_v2` runs a Moon-connectivity check against the catalog event the question was
matched to. When the Moon does not signify the required houses, the app renders an amber "the
chart is not ready" card, not an error and not a guessed answer, with the tool's own reason in
plain language and a button that sends the visitor back to ask again later with a fresh number,
which is the orthodox remedy. `get_medical_horary` and `get_career_horary` carry a second,
independent withhold: they rotate the lagna to the relevant relation and can fail their own
connectivity test even when the base gate passed, and `get_lost_or_missing` can return an
inconclusive `WITHHELD` recovery verdict when its 11th cuspal sub lord has no overlap with
either the recovery or the loss houses. Any of these firing is treated as a complete, honest
answer everywhere in this app: in the prompt's validation checklist, in the response shape (a
withheld chart carries a null `verdict` and an empty `timing.windows`, not a partial one), and
in the UI. Nowhere does this codebase treat a withheld verdict as a failure.

## Run it

```bash
# from the repo root
npm install
cp apps/horary-desk/.env.example apps/horary-desk/.env.local
# ANTHROPIC_API_KEY  your model key
# LUMIN_API_KEY      from https://app.lumin.guru/developer

npm run dev -w apps/horary-desk   # http://localhost:3111
```

## The detail worth copying

**The horary number field is spelled three different ways across these seven tools, and the
moment and offset fields are spelled two different ways.** This is the sharpest trap in the set,
and it is why the field name has to be read off each tool's own Zod schema rather than assumed
from a neighbour:

- `get_horary_chart_v2` and `get_horary_advanced` use `target_number`, plus the full snake_case
  birth-data field set (`birth_datetime`, `latitude`, `longitude`, `utc_offset_minutes`,
  `ayanamsa`). Declared with birth-data field names, same as `get_panchang` in the today-panel
  example, but the values carry the QUERY moment and place, never a birth: this app has no birth
  chart anywhere.
- `get_lost_or_missing` and `get_arrival_timing` also use the snake_case birth-data fields, but
  the number field is `question_number`, not `target_number`.
- `get_medical_horary` and `get_career_horary` drop the birth-data shape entirely and declare
  their own schema: `target_number` again, but `datetime` (not `birth_datetime`) and
  `utcOffsetMinutes` (camelCase, not `utc_offset_minutes`).
- `get_horary_serial`'s `sessions[]` entries use `questionNumber` (camelCase, a third spelling)
  alongside `datetime` and `utcOffsetMinutes`.

The MCP server remaps `target_number` to the engine's internal `questionNumber` on the horary
endpoints that need it, but that remap is invisible from the model's side: the model must send
whatever field name that specific tool's own schema declares, and the prompt spells this out
tool by tool rather than trusting a pattern from the last tool called.

**Two of the five question types have no matching event in the engine's event catalog.**
`get_horary_chart_v2` and `get_horary_advanced` both validate `query_event` against the same
fuzzy-matched event list the rest of the engine uses (Marriage, Career / Job Start, Financial
Loss, and about 73 more), and there is no "Lost Article" or "Awaited Arrival" entry anywhere in
it. Rather than force a bad fuzzy match or skip the gate for those two question types, the
prompt names a labelled proxy (`Financial Loss` for lost/theft/missing-person, `Return Home` for
arrival) and requires the response to say plainly that it is a proxy: `get_lost_or_missing` and
`get_arrival_timing` compute their own verdicts from their own house logic, completely
independent of that proxy event, and presenting the two as the same claim would be a provenance
error. The response's `event` field always names exactly what the base gate was checked against.

**The "pick one for me" button never touches a tool.** In KP horary the number has to come from
the querent, in their own head, at the moment they ask. A random-number helper is still
legitimate practice (the digital equivalent of "close your eyes and think of a number"), but it
has to happen client-side: the button calls `crypto.getRandomValues` in the browser and fills
the input instantly, with no server round trip and no model in the loop, and the querent can
still edit the result before asking. The system prompt never invents a number under any
circumstance.

**The place of judgment comes straight from the browser, not from a free-text city.** In KP horary
the other eleven cusps are solved from the number-fixed Ascendant for the LATITUDE of judgment
rather than the longitude, and what matters is the place where the question is judged, not the
place it was asked from. So this app skips the free-text
city-plus-LLM-resolution step the today-panel example uses and reads latitude and longitude
straight from `navigator.geolocation`, with a manual override and a Colombo, Sri Lanka default
if permission is denied. There is nothing for a model to get wrong here.

## Make it yours

- **Add `get_horary_serial` history.** This demo starts a fresh two-session comparison from
  scratch every time, since the app is stateless. A real deployment would persist prior sessions
  (question, number, moment) per visitor and grow the trend across more than two points.
- **Add `get_rp_consensus`.** For "I have asked this before and want confirmation", the ruling
  planets that agree across sessions carry the highest predictive weight in KP; this is a
  natural sixth tool alongside `get_horary_serial`.
- **Narrow the question types.** If your product only ever fields one kind of question (a
  recruiting widget only needs career, a clinic intake page only needs medical), drop the other
  type-specific tools from `ALLOWED_TOOLS` and the classification step in the prompt.
- **Persist the chart.** Nothing here is cached: the same question and number one minute apart
  will read a slightly different sky and can return a different verdict. That is correct KP
  behaviour, not a bug, and worth saying to a visitor who asks twice.

## The disclaimer it ships

> A reflective lens on a question asked at a moment, not advice.

For a medical question, this sentence is appended:

> For a health question, this is a supplementary lens, not diagnostic, and it should never be
> read as a reason to delay or avoid seeking medical care.

Both strings are mandated in the system prompt, validated as required fields when the response
arrives (the medical sentence is checked for specifically when `questionType` is `"medical"`),
and rendered on the page. If the model omits either one, the response fails validation and the
request errors rather than rendering without it.
