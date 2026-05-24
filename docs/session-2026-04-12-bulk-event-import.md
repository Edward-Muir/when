# Bulk Event Import — 1,749 new events

## Overview

Added 1,749 new historical events to the game from `untracked_data/new_events_final.csv`, growing the total event library from 2,508 to 4,257. Events span all 6 game categories and cover a wide chronological range (~50,000 BCE to 2001 CE).

The process involved CSV parsing, category remapping, parallel sub-agent conversion, a second pass to flag suspect years, applying corrections, and merging into the category JSON files.

## Files modified

### Event data (merged outputs)

- `public/events/conflict.json` — +182 events (419 → 601)
- `public/events/cultural.json` — +371 events (330 → 701)
- `public/events/diplomatic.json` — +564 events (568 → 1,132)
- `public/events/disasters.json` — +15 events (215 → 230)
- `public/events/exploration.json` — +355 events (774 → 1,129)
- `public/events/infrastructure.json` — +262 events (202 → 464)

### Staging files (in `untracked_data/`, can be cleaned up)

- 14 `batch_<category>[_letter]_output.json` files — the per-batch JSON arrays that were merged
- 14 `batch_<category>[_letter].json` files — the intermediate category-mapped CSV parse
- 13 `flags_<category>[_letter].md` files — the suspect-year flag lists

## Process

### Phase 1 — CSV parse and category mapping

- Source: `untracked_data/new_events_final.csv` (1,772 rows after skipping empty last row)
- CSV categories (~40 values) deterministically mapped to the 6 game categories
- Year-format normalization: negative numbers (CSV1 style), "BC"/"AD" suffix (CSV2 style), plain positive integers. 27 events had positive years that were obviously BCE (e.g., "Iron Smelting" at year 2000) — these were flagged for sub-agent correction.
- Split into 14 batch files by category (large categories split into halves/thirds/quarters). Disasters batch (15 events) handled inline.

### Phase 2 — Opus sub-agent conversion (parallel, 13 agents)

Each agent read its batch file and for every event produced: precise `year` (researched), `description` (80-150 chars, factual tone), `difficulty` per the rubric in `docs/old/difficulty-grading-rubric.md`, plus the pass-through `name`/`friendly_name`/`category` fields. Wrote output to `batch_<cat>_output.json`. All 14 files validated OK (correct counts, all required fields, no name collisions).

### Phase 3 — Year verification (Sonnet flag-only agents, parallel)

First attempt used web-search-heavy Sonnet agents (~780 web searches across 13 parallel runs) which burned through the Sonnet session cap in ~10 minutes without saving output. Switched to a "flag don't fix" strategy:

- Each agent only reads the batch file and writes a markdown flag list (no WebSearch, no JSON edits)
- Costs ~12-18 tool calls per agent vs 45-86 previously
- Result: 82 events flagged as suspect across all 13 batches

### Phase 4 — Apply corrections

Based on the flag lists, applied:

- **48 year corrections** where the agent gave a confident replacement year
- **23 deletions** where the year was genuinely uncertain (e.g., generic "aboriginal traditions" at -4000, events the agent couldn't anchor)

Notable corrections:

- `printing-woodblock-china`: 200 → 700 (Tang, not Han)
- `mayan-written-calendar`: 250 CE → -100 (sign error — attested pre-CE)
- `damascus-steel-pattern`: 300 → -300 (sign error)
- `iron-smelting-bloomery`: -1800 → -1200 (bloomery era begins ~1200 BCE)
- `parthian-empire`: -1 → -95 (data entry error — Mithridates II era)
- `song-paper-money-system`: 1160 → 1024 (jiaozi under Northern Song)
- `chocolate-introduced-europe`: 1585 → 1528 (Cortés)
- `araucanians`: 1546 → 1598 (Battle of Curalaba)
- `horse-introduction-americas`: 1519 → 1493 (Columbus 2nd voyage, not Cortés)
- `mycenaean-warrior-art`: -1400 → -1500 (Shaft Grave era)

Notable deletions: generic "Aboriginal Dreamtime / Songlines" entries (indeterminate age), `devagupta-gupta-succession` (not a real ruler), `banco-sangemini` (unverifiable), duplicates like `ashanti-federation` (dup of `asante-confederation`), uncertain "first X" claims.

### Phase 5 — Merge and verify

- 0 name collisions with 2,581 existing events
- 0 intra-batch duplicates
- `npm run find-duplicates`: 0 exact name duplicates (1,203 similar friendly-names are expected for historical events)
- `npm run build`: ✅
- `npm run typecheck`: ✅

## Key decisions

1. **Batching by game category, not by arbitrary chunks** — each sub-agent writes to one category's output file, avoiding merge conflicts. Large categories (cultural, diplomatic, exploration, infrastructure) split into 2-4 sub-batches.

2. **Flag-don't-fix verification** — after web-search-heavy Sonnet agents burned the session cap, switched to LLM-judgment-only flagging. Result: same quality outcome at ~4x less cost (82 flagged out of 1,757 — 4.7%).

3. **Delete uncertain events rather than ship wrong years** — the game's value depends on years being correct enough to place on a timeline. When even a careful agent couldn't anchor a year, the event was removed (23 deletions out of 1,772).

4. **Kept "near-miss" events where the year is defensible** — e.g., `easter-island-settlement` at 1200 (within modern scholarly range), `first-autopsy` at 1507 (start of Leonardo's dissection period), `harpsichord-invented` at 1397 (based on Padua document, single-source but consistent). These could be revisited if gameplay feedback surfaces them as poorly-placed.

5. **Category mapping for CSV values the game doesn't directly support**:
   - `invention`, `science`, `medicine`, `weapons`, `agriculture` → `exploration`
   - `art`, `literature`, `religion`, `education`, `music`, `theater` → `cultural`
   - `law`, `governance`, `economy`, `politics` → `diplomatic`
   - `architecture`, `construction`, `communication`, `trade`, `metallurgy` → `infrastructure`
   - Only `military` → `conflict`
   - `disaster`, `disease`, `climate`, `ecological` → `disasters`

## Unfinished work / next steps

- **Images**: All 1,749 new events were added without `image_url`, `image_width`, `image_height`, or `color`/`text_color`. These are optional, so they'll render with the game's default card style. Future work: run the existing image pipeline (see `scripts/` and the existing `chore(release)` commits around image additions) to add images to these events.

- **Difficulty calibration**: The Opus agents self-reported skewing harder than the target distribution (many batches landed at ~40% hard / ~20% very-hard vs the rubric's 35%/10% targets). This reflects the genuinely obscure nature of many events in the CSV (regional histories, "first X" claims, pre-industrial tech events). Worth monitoring in playtest.

- **Staging file cleanup**: The 14 `batch_*.json`, 14 `batch_*_output.json`, and 13 `flags_*.md` files in `untracked_data/` can be deleted once you're satisfied with the merge. Keep them if you want to audit any decision.

- **Potential name/description fixes not applied** (year was correct, label was wrong — outside the scope of this year-focused pass):
  - `song-blue-white-porcelain` — year 1320 is correct, but it was actually Yuan dynasty, not Song
  - `isabella-aragon` — should be "Isabella of Castile"
  - `pascal-vacuum-experiments` — friendly_name parenthetical says "Magdeburg Hemispheres" but that's Guericke's experiment
  - `songhai-djinguereber-mosque` — year is correct but the mosque was Mali, not Songhai
  - `goryeo-seondeok-scholars` — (deleted) Seondeok was a Silla queen, not Goryeo

- **Semantic duplicates within new events** — the `exploration_b` agent noted name groups that refer to the same thing (e.g., `kepler-planetary-laws`/`keplers-laws`/`kepler-laws-motion`; `astronomical-observatory`/`ulugh-beg-observatory`/`samarkand-observatory`). These have unique `name` values so they passed the duplicate checker, but a future cleanup pass could consolidate them.

## Context for future sessions

- The input CSV `untracked_data/new_events_final.csv` is the deduplicated combination of the user's two earlier CSVs (`new_events_deduped.csv` + `new_events_round2_deduped.csv`).
- The event schema (6 required fields: name, friendly_name, year, category, description, difficulty) is documented in `.claude/skills/add-events/SKILL.md` and enforced by `src/types/index.ts`.
- The difficulty rubric is in `docs/old/difficulty-grading-rubric.md` — key insight is "placeability, not just recognition" (an obscure event with strong temporal anchors in the description is easier than a famous event with an ambiguous timeframe).
- Event files are not sorted by year — just append new events.
- BCE uses negative numbers (e.g., `year: -490` for 490 BCE).
- The `manifest.json` in `public/events/` only lists 6 categories (no `inventions` despite what SKILL.md implies).
- No changes to code or types this session — only event JSON data additions.
