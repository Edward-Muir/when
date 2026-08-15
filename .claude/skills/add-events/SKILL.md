---
name: add-events
description: Add new historical events to the timeline game. Use when adding events, understanding event data structure, or checking for duplicates.
---

# Adding Historical Events

## Event JSON Structure

Each event is a JSON object with these fields:

```json
{
  "name": "battle-of-marathon",
  "friendly_name": "Battle of Marathon",
  "year": -490,
  "category": "warfare",
  "description": "Athenian forces defeated the Persian invasion, inspiring the marathon race legend.",
  "difficulty": "medium",
  "image_url": "https://upload.wikimedia.org/...",
  "image_width": 330,
  "image_height": 216
}
```

### Required Fields

| Field           | Type   | Description                                                                               |
| --------------- | ------ | ----------------------------------------------------------------------------------------- |
| `name`          | string | Unique kebab-case ID (e.g., `battle-of-marathon`). Must be unique across ALL event files. |
| `friendly_name` | string | Display name in Title Case (e.g., "Battle of Marathon")                                   |
| `year`          | number | Year of event. **Negative = BCE** (e.g., -490 = 490 BCE), positive = CE                   |
| `category`      | string | One of the 20 category values below                                                       |
| `description`   | string | 1-2 sentences, 80-150 characters. Factual, objective tone.                                |
| `difficulty`    | string | `easy`, `medium`, `hard`, or `very-hard` — all four are in play                           |

### Optional Fields

| Field          | Type   | Description                                |
| -------------- | ------ | ------------------------------------------ |
| `image_url`    | string | Wikimedia Commons URL (prefer 330px width) |
| `image_width`  | number | Image width in pixels (typically 330)      |
| `image_height` | number | Image height in pixels                     |

## Categories

> **Filenames are not categories.** They were, once — the taxonomy was re-clustered into
> 20 categories in June 2026 and the files were never re-split to match. Today every file
> holds a mix of categories and every category is spread across many files. So the
> `category` **value** is what matters; the file an event lives in is essentially
> historical. Do not infer a category from a filename, and do not assume a category has a
> matching file — `inventions.json`, for instance, does not exist.

The source of truth is `ALL_CATEGORIES` in `src/types/index.ts`. A value not in that list
will not render an icon and will not match any filter. Current values:

| Category       | Use For                                                           |
| -------------- | ----------------------------------------------------------------- |
| `empires`      | Empires and states rising, falling, uniting, or being conquered   |
| `revolution`   | Revolutions, uprisings, independence, regime change               |
| `architecture` | Buildings, monuments, engineering, construction                   |
| `writing`      | Literature, texts, records, publishing, scripts                   |
| `invention`    | Inventions, patents, technological firsts, tools (note: singular) |
| `figures`      | Births, deaths, and the lives of notable individuals              |
| `media`        | Broadcast, film, recording, press, mass communication             |
| `craft`        | Materials, manufacture, techniques, industrial processes          |
| `diplomacy`    | Treaties, alliances, political agreements, negotiated settlements |
| `disasters`    | Natural disasters, plagues, extinctions, catastrophes             |
| `commerce`     | Business, industry, finance, economic institutions                |
| `law`          | Legal codes, courts, rights, constitutional change                |
| `agriculture`  | Farming, domestication, food production, land use                 |
| `warfare`      | Wars, battles, sieges, military technology                        |
| `science`      | Scientific discoveries, theories, observations                    |
| `trade`        | Trade routes, ports, shipping, exchange between regions           |
| `migration`    | Population movement, settlement, colonisation, diaspora           |
| `art`          | Visual art, music, performance, design                            |
| `medicine`     | Medical discoveries, public health, disease treatment             |
| `nature`       | Earth, climate, geology, and the non-human living world           |

### Which file to append to

Since files no longer map to categories, put a new event in the file whose existing
contents it most resembles, and check what is already there first:

```bash
# What categories does this file actually hold?
python3 -c "import json;print({e['category'] for e in json.load(open('public/events/conflict.json'))})"
```

Two files are not ordinary category files: `candidates.json` holds events staged for
review, and `deprecated.json` is **deliberately absent from `manifest.json`** — anything
in it is excluded from the game. Do not add to either by hand.

## Difficulty Guidelines

Four labels are in play, `very-hard` included. Since v1.7.0 the label is **not** the final
word on how hard a card is: `src/utils/difficultyScore.ts` blends it with how crowded the
timeline is around that year. Grade recognition and inferability only — never crowding.

| Level       | Description                                | Examples                             |
| ----------- | ------------------------------------------ | ------------------------------------ |
| `easy`      | Taught in most schools worldwide           | Pyramids, Moon landing, World War II |
| `medium`    | Known to enthusiasts or regional audiences | Battle of Marathon, Magna Carta      |
| `hard`      | Specialized knowledge required             | Treaty of Tordesillas, Lex Hortensia |
| `very-hard` | Only experts would recognize               | Social War (Rome), Diet of Roncaglia |

Full criteria, including how inferability shifts a label: [difficulty-grading-rubric.md](../../../docs/events-images/difficulty-grading-rubric.md).

## Era Reference

Events are automatically assigned to eras based on `year`:

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

Before adding, search existing events:

```bash
# Search by name pattern
grep -r "battle-of" public/events/

# Search by year
grep -r '"year": -490' public/events/

# Run duplicate checker
npm run find-duplicates
```

### 2. Determine Category

Pick the **primary** nature of the event from the 20 values above. Some pairs that are
easy to confuse:

- A battle or campaign → `warfare`; the empire it won or lost → `empires`
- A treaty → `diplomacy`; a statute or legal code → `law`
- An uprising or independence → `revolution`, not `warfare`
- A device or technique → `invention`; the material or process behind it → `craft`
- A discovery or theory → `science`; a medical one → `medicine`
- A building → `architecture`; the route or port it served → `trade`

### 3. Add Event to a File

Append to a `public/events/*.json` file — see "Which file to append to" above — keeping
valid JSON array format. The file does not determine the category; the `category` field does.

### 4. Verify After Adding

```bash
npm run find-duplicates  # Check for duplicate names
npm run typecheck        # Category/difficulty values are typed
npm test -- --watchAll=false eventNameLength   # 35-char friendly_name limit
npm run build            # Verify JSON is valid
```

## Naming Conventions

### `name` field (kebab-case ID)

- Use lowercase with hyphens: `battle-of-thermopylae`
- Be descriptive and unique: `death-alexander-great` not just `alexander`
- Common prefixes: `battle-`, `treaty-of-`, `invention-of-`, `birth-`, `death-`

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

## Examples by Category

### Warfare

```json
{
  "name": "battle-of-marathon",
  "friendly_name": "Battle of Marathon",
  "year": -490,
  "category": "warfare",
  "description": "Athenian forces defeated the Persian invasion, inspiring the marathon race legend.",
  "difficulty": "medium"
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
  "difficulty": "medium"
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
  "difficulty": "easy"
}
```

### Disasters

```json
{
  "name": "vesuvius-eruption",
  "friendly_name": "Mount Vesuvius Erupts",
  "year": 79,
  "category": "disasters",
  "description": "The volcanic eruption buried Pompeii and Herculaneum, preserving them for millennia.",
  "difficulty": "easy"
}
```

### Science

```json
{
  "name": "first-moon-landing",
  "friendly_name": "First Moon Landing",
  "year": 1969,
  "category": "science",
  "description": "Apollo 11 astronauts became the first humans to walk on the Moon.",
  "difficulty": "easy"
}
```

### Architecture

```json
{
  "name": "great-wall-begins",
  "friendly_name": "Great Wall Construction Begins",
  "year": -221,
  "category": "architecture",
  "description": "Qin Shi Huang began connecting existing walls into the Great Wall of China.",
  "difficulty": "medium"
}
```

## Common Mistakes to Avoid

1. **Duplicate names** - Always search before adding
2. **Wrong year sign** - BCE years must be negative
3. **A retired category value** - `conflict`, `cultural`, `diplomatic`, `exploration`,
   `infrastructure` and `inventions` are all filenames, not categories. Check
   `ALL_CATEGORIES` in `src/types/index.ts`.
4. **Category mismatch** - A battle is `warfare`, not `diplomacy`
5. **Too long descriptions** - Keep under 150 characters
6. **`friendly_name` over 35 characters** - fails `eventNameLength.test.ts`
7. **Invalid JSON** - Missing commas, unclosed brackets
8. **Non-unique names** - `name` field must be globally unique
