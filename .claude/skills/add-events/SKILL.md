---
name: add-events
description: Add new historical events to the timeline game. Use when adding events, understanding event data structure, or checking for duplicates.
---

# Adding Historical Events

## Event JSON Structure

A live event, as it sits in `public/events/conflict.json`:

```json
{
  "name": "battle-marathon",
  "friendly_name": "Battle of Marathon",
  "year": -490,
  "category": "warfare",
  "description": "Athenian forces defeated the Persian invasion, inspiring the marathon race legend.",
  "difficulty": "easy",
  "regions": ["Greece", "Iran"],
  "image_url": "https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/battle-marathon_aenode?_a=BAMAMikS0",
  "color": "#3a2d27",
  "text_color": "light",
  "has_detail": true
}
```

You write the first seven fields. The rest are written by scripts (see the workflow below), never
by hand.

### Written by you

| Field           | Type   | Description                                                                              |
| --------------- | ------ | ---------------------------------------------------------------------------------------- |
| `name`          | string | Unique kebab-case ID (e.g., `battle-marathon`). Must be unique across ALL event files.   |
| `friendly_name` | string | Display name in Title Case (e.g., "Battle of Marathon"). At most 35 characters.          |
| `year`          | number | Year of event. **Negative = BCE** (e.g., -490 = 490 BCE), positive = CE                  |
| `category`      | string | One of the 21 values in `ALL_CATEGORIES` (table below)                                   |
| `description`   | string | 1-2 sentences, 80-150 characters. Factual, objective tone. Never states a date.          |
| `difficulty`    | string | `easy`, `medium`, `hard`, or `very-hard`: all four are in play                           |
| `regions`       | array  | Where it happened on today's map: exact names from `src/data/regions.json`. Required.    |
| `year_end`      | number | Optional. End of the evidence window, where the record gives a window rather than a year |

### Written by scripts

| Field                  | Written by                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `image_url`            | `scripts/update-cloudinary-urls.js`, once the card's art is uploaded to Cloudinary |
| `color`, `text_color`  | `scripts/extract_event_colors.py`, from the card art                               |
| `has_detail`           | `scripts/events/detail-apply.js`, in the same pass as the prose sidecar            |
| `regions` (via a map)  | `scripts/events/region-apply.js`, which validates and orders the tags              |
| `year_end` (via a map) | `scripts/events/year-range-apply.js`                                               |

Many records also carry `image_width`, `image_height`, `wikipedia_url` and `wikipedia_views`. No
card layout reads the dimensions, and `wikipedia_url` is a byproduct of difficulty grading that is
wrong often enough to matter (never hand it to a writer). A new event needs none of them.

### `image_url`: no Cloudinary art, no card

`loadAllEvents` in `src/utils/eventLoader.ts` keeps only events whose `image_url` is a Cloudinary
URL (`isCloudinaryImage` in `src/utils/cloudinaryImage.ts`). An event without art stays in the JSON
but is never dealt, never matches a filter and never resolves in a curated theme. So a new event is
not playable until its art lands.

The art pipeline:

1. Write a scene for each new slug in a file under `docs/curated-themes/art/scenes/` (one per
   theme or batch, `{slug: {research_focus, scene}}`).
2. `python3 scripts/events/theme-art-prompts.py` builds the five-column prompt CSV for every
   event without Cloudinary art. Every un-illustrated event needs a scene, or the run fails.
3. The images are generated from that CSV and uploaded to Cloudinary outside this repo, with the
   slug as the public ID's prefix (`battle-marathon_aenode`). See
   [docs/events-images/index.md](../../../docs/events-images/index.md).
4. `node scripts/update-cloudinary-urls.js` (needs Cloudinary API credentials) matches public IDs
   to slugs and writes `image_url`. The transform baked into the URL does not matter: the app
   replaces it at runtime (`getImageUrl`, and
   [docs/cloudinary-cost-controls.md](../../../docs/cloudinary-cost-controls.md)).
5. `python3 scripts/extract_event_colors.py --file <file>.json` writes `color` and `text_color`
   for every event in that file that lacks them.

### `regions`: where it happened

Every event carries `regions`: present-day countries by their plain names (`["Greece", "Iran"]`),
plus a region name only where no country says it (`["Turkey", "Europe"]`, `["China", "Global"]`).
Never an abbreviation. The rules (place plus at most two acting states, extinct states by their seat
at the time, Global is a footprint not importance) are in the `tag-event-regions` skill and
[docs/regions/tagging-spec.md](../../../docs/regions/tagging-spec.md). Tags are written by
`event-region-tagger` sub-agents into a map and applied with
`node scripts/events/region-apply.js`, which validates them and puts them in canonical order.
`REQUIRE_REGIONS` is on in `src/utils/eventRegions.test.ts`, so an untagged event fails the suite.

### `year` + `year_end`: the evidence window

Most events are a point in time. Some are a process, a floruit or a reign the record does not
pin to a year, and placing those against a single date grades a guess. Those carry an optional
`year_end`, and a placement anywhere inside the window counts as a success with "close enough"
feedback.

- **The pair is the window, and `year` is its start**, not an anchor to hang a forward-only
  range off. Where the record puts the window somewhere else, `year` moves with it. A stored
  year is frequently just a round number somebody picked; it is not a constant to preserve.
- `year_end` must be a **strictly greater integer** and not in the future. **There is no cap on
  how wide a window may be.** A prehistoric window of millions of years is correct if that is
  what the evidence says; a per-era ceiling would force windows to lie about genuine uncertainty.
- **`year_end` alone cannot move a daily deck** (`year` is the sole anchor for difficulty
  scoring, deck composition, era filtering and recency). **Moving `year` can**, so it needs a
  `reason` and a re-measured `deckBuilder.test.ts` bound.
- **Decide it with the `set-evidence-window` skill**, never by hand. The worklist comes from
  `year-range-report.js --chunks`, `event-range-writer` sub-agents make the decisions, and
  `year-range-apply.js` writes them (all in `scripts/events/`). The corpus test
  `src/utils/eventYearRange.test.ts` shares the same validator.
- A precise, well-attested event must **not** get a window. Omitting is usually the right call:
  a ratified chronostratigraphic boundary has a published age with an error bar, not a window.

## Categories

> **Filenames are not categories.** Event files are storage shards: every file holds a mix of
> categories and every category is spread across many files. The `category` **value** is what
> matters. Never infer a category from a filename, and do not assume a category has a matching
> file (`inventions.json`, for instance, does not exist).

The source of truth is `ALL_CATEGORIES` in `src/types/index.ts`. A value not in that list will not
render an icon and will not match any filter; `src/utils/eventCategories.test.ts` fails on it.
Current values:

| Category       | Use For                                                                |
| -------------- | ---------------------------------------------------------------------- |
| `empires`      | Empires and states rising, falling, uniting, or being conquered        |
| `revolution`   | Revolutions, uprisings, independence, regime change                    |
| `architecture` | Buildings, monuments, engineering, construction                        |
| `writing`      | Literature, texts, records, publishing, scripts                        |
| `invention`    | Inventions, patents, technological firsts, tools (note: singular)      |
| `figures`      | Births, deaths, and the lives of notable individuals                   |
| `media`        | Broadcast, film, recording, press, mass communication                  |
| `craft`        | Materials, manufacture, techniques, industrial processes               |
| `diplomacy`    | Treaties, alliances, political agreements, negotiated settlements      |
| `disasters`    | Natural disasters, plagues, extinctions, catastrophes                  |
| `commerce`     | Business, industry, finance, economic institutions                     |
| `law`          | Legal codes, courts, rights, constitutional change                     |
| `agriculture`  | Farming, domestication, food production, land use                      |
| `warfare`      | Wars, battles, sieges, military technology                             |
| `science`      | Scientific discoveries, theories, observations                         |
| `trade`        | Trade routes, ports, shipping, exchange between regions                |
| `migration`    | Population movement, settlement, colonisation, diaspora                |
| `art`          | Visual art, music, performance, design                                 |
| `medicine`     | Medical discoveries, public health, disease treatment                  |
| `nature`       | Earth, climate, geology, and the non-human living world                |
| `sports`       | Competitions, championships, records, a sport's rules, athletes' feats |

### Which file to append to

Files do not map to categories, so put a new event in the file whose existing contents it most
resembles, and check what is already there first:

```bash
# What categories does this file actually hold?
python3 -c "import json;print({e['category'] for e in json.load(open('public/events/conflict.json'))})"
```

Every file listed in `public/events/manifest.json` (`{ "files": [...] }`) is live: its events are
dealt, validated and part of the slug namespace. That includes `candidates.json`. `themes.json`
holds the events written for curated themes. `deprecated.json` holds retired events and is
**deliberately absent from the manifest**, so nothing in it reaches the game; retire an event with
`scripts/events/backlog-apply.js`, never by moving it by hand.

## Difficulty Guidelines

Four labels are in play, `very-hard` included. The label is **not** the final word on how hard a
card is: `src/utils/difficultyScore.ts` blends it with how crowded the timeline is around that
year. Grade recognition and inferability only, never crowding.

| Level       | Description                                | Examples                                  |
| ----------- | ------------------------------------------ | ----------------------------------------- |
| `easy`      | Taught in most schools worldwide           | Pyramids, First Moon Landing, Magna Carta |
| `medium`    | Known to enthusiasts or regional audiences | Peace of Westphalia                       |
| `hard`      | Specialized knowledge required             | Treaty of Tordesillas, Lex Hortensia      |
| `very-hard` | Only experts would recognize               | Battle of Lechfeld, Algeciras Conference  |

Full criteria, including how inferability shifts a label: [difficulty-grading-rubric.md](../../../docs/events-images/difficulty-grading-rubric.md).

## Era Reference

The Custom page's era filter assigns events by `year` (`src/utils/eras.ts`):

| Era         | Year Range               |
| ----------- | ------------------------ |
| Prehistory  | -4,500,000,000 to -3,001 |
| Ancient     | -3,000 to 499            |
| Medieval    | 500 to 1,499             |
| Renaissance | 1,500 to 1,759           |
| Industrial  | 1,760 to 1,913           |
| World Wars  | 1,914 to 1,945           |
| Cold War    | 1,946 to 1,991           |
| Modern      | 1,992 to 2,100           |

## Workflow for Adding Events

### 1. Check for Duplicates First

Before adding, search existing events. A slug can name the cause while its title names the event
(`english-civil-war-aftermath` is the Restoration of Charles II), so check what already sits on
the year, not just what matches the name:

```bash
# Search by name pattern
grep -rn "marathon" public/events/*.json

# Search by year
grep -rn '"year": -490' public/events/*.json

# Run the duplicate checker over the manifest events (takes a few minutes)
npm run find-duplicates
```

### 2. Determine Category

Pick the **primary** nature of the event from the 21 values above. Some pairs that are easy to
confuse:

- A battle or campaign → `warfare`; the empire it won or lost → `empires`
- A treaty → `diplomacy`; a statute or legal code → `law`
- An uprising or independence → `revolution`, not `warfare`
- A device or technique → `invention`; the material or process behind it → `craft`
- A discovery or theory → `science`; a medical one → `medicine`
- A building → `architecture`; the route or port it served → `trade`
- A championship, record or match → `sports`; the athlete's birth or death → `figures`

### 3. Add Event to a File

Append the hand-written fields to a `public/events/*.json` file from the manifest (see "Which file
to append to" above), keeping valid JSON array format. The file does not determine the category;
the `category` field does.

### 4. Tag regions

Run `node scripts/events/region-report.js --chunks`, give each chunk to an `event-region-tagger`
sub-agent, then apply its map with `node scripts/events/region-apply.js`. The `tag-event-regions`
skill has the full workflow.

### 5. Set an evidence window, if the event names a period

A reign, a process or a floruit gets a window through the `set-evidence-window` skill and
`scripts/events/year-range-apply.js`. A moment gets nothing.

### 6. Write the detail prose

Every event gets two paragraphs of detail prose in a sidecar under `public/events/detail/`. Run
`node scripts/events/detail-report.js --chunks`, give each chunk to an `event-detail-writer`
sub-agent (the `write-event-detail` skill), then apply the maps with
`node scripts/events/detail-apply.js`. That script writes the prose and `has_detail` together;
**never set `has_detail` by hand**. `detail-report.js` exits non-zero while any manifest event
lacks prose.

### 7. Art and colours

Follow the art pipeline above, then run `python3 scripts/extract_event_colors.py --file <file>.json`.

### 8. Verify

```bash
CI=true npm test -- --watchAll=false eventCategories eventRegions eventSlugUniqueness eventYearRange eventDetailCorpus eventDateClues eventNameLength
node scripts/events/detail-report.js   # exits non-zero while any event lacks prose
```

Always run tests through npm: the `test` script pins the time zone the date suites depend on.
`npm run typecheck` does not check event data, because the JSON is fetched at runtime.

## Naming Conventions

### `name` field (kebab-case ID)

- Use lowercase with hyphens: `battle-thermopylae`
- Be descriptive and unique: `death-alexander-great` not just `alexander`
- Common prefixes: `battle-`, `treaty-of-`, `invention-of-`, `birth-`, `death-`
- **Never rename a slug** once it exists: it keys the detail sidecar, the player's collection,
  curated themes and card reports.

### `friendly_name` (display name)

- Title Case: "Battle of Thermopylae"
- Can include verbs: "Completed", "Begins", "Founded", "Signed"
- Keep concise: 2-6 words typical
- **Hard limit: 35 characters.** Longer titles get truncated with an ellipsis on the
  portrait event card (`src/components/Card.tsx`, `line-clamp-2`). Enforced by
  `src/utils/eventNameLength.test.ts` (`MAX_FRIENDLY_NAME_LENGTH`).

### `description` conventions

- Factual, objective tone
- 1-2 sentences
- Include key figures, locations, or significance
- No speculation or editorializing
- **Never state the date.** No year, decade, century or `NNN CE/BCE` reference, not in
  `description` and not in `friendly_name`. Placing the card _is_ the game, and both fields
  are shown to a player who has not placed it yet (`friendly_name` sits on the card face at
  all times). Write "Lottery won the first official Grand National at Aintree", not "…at
  Aintree in 1839". Relative durations are fine: "a 27-year war" describes the event, it
  doesn't answer the question. Enforced by `src/utils/eventDateClues.test.ts`.

## Examples by Category

The hand-written fields of live events.

### Warfare

```json
{
  "name": "battle-marathon",
  "friendly_name": "Battle of Marathon",
  "year": -490,
  "category": "warfare",
  "description": "Athenian forces defeated the Persian invasion, inspiring the marathon race legend.",
  "difficulty": "easy",
  "regions": ["Greece", "Iran"]
}
```

### Figures

```json
{
  "name": "birth-buddha",
  "friendly_name": "Birth of Siddhartha Gautama",
  "year": -563,
  "category": "figures",
  "description": "The future Buddha was born a prince in Nepal, destined to found a world religion.",
  "difficulty": "easy",
  "regions": ["Nepal"]
}
```

### Law

```json
{
  "name": "magna-carta",
  "friendly_name": "Magna Carta Signed",
  "year": 1215,
  "category": "law",
  "description": "English barons forced King John to sign a charter limiting royal power.",
  "difficulty": "easy",
  "regions": ["United Kingdom"]
}
```

### Disasters

```json
{
  "name": "vesuvius-eruption",
  "friendly_name": "Mount Vesuvius Erupts",
  "year": 79,
  "category": "disasters",
  "description": "The volcano buried the Roman cities of Pompeii and Herculaneum in ash.",
  "difficulty": "easy",
  "regions": ["Italy"]
}
```

### Sports

```json
{
  "name": "kipchoge-sub-two-hour-marathon-2019",
  "friendly_name": "Kipchoge Breaks Two Hours",
  "year": 2019,
  "category": "sports",
  "description": "Eliud Kipchoge ran 1:59:40 in Vienna, the first sub-two-hour marathon, though not an official world record.",
  "difficulty": "easy",
  "regions": ["Austria", "Kenya"]
}
```

### Empires

```json
{
  "name": "great-wall-china",
  "friendly_name": "Great Wall of China",
  "year": -221,
  "category": "empires",
  "description": "Qin Shi Huang began connecting existing walls into a unified defensive barrier across northern China.",
  "difficulty": "easy",
  "regions": ["China"]
}
```

## Common Mistakes to Avoid

1. **Duplicate names**: always search before adding
2. **Wrong year sign**: BCE years must be negative
3. **A filename as a category**: `conflict`, `cultural`, `diplomatic`, `exploration`,
   `infrastructure`, `food`, `money` and `earth-life` are file names, not categories. Check
   `ALL_CATEGORIES` in `src/types/index.ts`.
4. **Category mismatch**: a battle is `warfare`, not `diplomacy`
5. **Missing `regions`**: fails `eventRegions.test.ts`
6. **Too long descriptions**: keep under 150 characters
7. **`friendly_name` over 35 characters**: fails `eventNameLength.test.ts`
8. **A date in the description or title**: "in 1839", "the 1960s", "18th-century",
   "410 CE" all give away the answer. Fails `eventDateClues.test.ts`
9. **Setting `has_detail`, `image_url` or `color` by hand**: each is written by its script
10. **Invalid JSON**: missing commas, unclosed brackets
11. **Non-unique names**: the `name` field must be globally unique, `deprecated.json` included
    (`eventSlugUniqueness.test.ts`)
