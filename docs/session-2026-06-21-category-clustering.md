# Session Summary — Event Category Re-Clustering (Part A: clustering + mapping)

**Date:** 2026-06-21
**Branch:** `feature/people`

## Overview

Re-ran the data-driven category clustering experiment over **all** events (not just the 7 manifest
categories), swept K from 10→32 to find a natural number of clusters, named the result as
**20 single-word categories**, and **applied the new categories directly to every event's
`category` field** in `public/events/*.json`.

This is "Part A" of a larger category refactor. **Part B (next session) is the code work** — wiring
the 20 new categories into the app so they actually load and render.

## What was accomplished

1. **Widened the clustering input.** The notebook only loaded the 7 manifest categories (4,602
   events). Built a standalone script that loads **all 17 non-deprecated event files** → **5,292
   unique events** (2 duplicate names dropped for clustering).
2. **Year-masking.** Stripped explicit years / era-words (BCE, CE, "Nth century", "1920s", etc.)
   from the embedding text so clusters form on **theme, not time period** — the key constraint
   ("categories must span the timeline, not be historical periods").
3. **K-sweep 10→32.** Silhouette rises then **plateaus at k≈24** (0.081); k=28/32 are flat and
   start producing tiny/mixed fragments. **k=24 chosen** as the operating point — and it
   conveniently matches the 24-category product cap.
4. **k=24 surfaced orphan-file themes** that never separated at low k: **Medicine, Art,
   Agriculture, Writing**.
5. **Merged k=24's 24 clusters → 20 single-word categories** (see below).
6. **Applied the mapping** — overwrote each event's `category` field in place.

## Final taxonomy (20 categories, with event counts)

| Category     | n   | Category    | n   | Category  | n   | Category | n   |
| ------------ | --- | ----------- | --- | --------- | --- | -------- | --- |
| empires      | 609 | disasters   | 247 | science   | 185 | art      | 161 |
| revolution   | 455 | commerce    | 218 | trade     | 177 | medicine | 159 |
| architecture | 402 | law         | 217 | migration | 172 | nature   | 116 |
| writing      | 365 | agriculture | 194 |           |     |          |     |
| invention    | 330 | warfare     | 188 |           |     |          |     |
| figures      | 289 |             |     |           |     |          |     |
| media        | 285 |             |     |           |     |          |     |
| craft        | 271 |             |     |           |     |          |     |
| diplomacy    | 254 |             |     |           |     |          |     |

Total = 5,292 (+2 from duplicate-named events written in two files = 5,294 field writes).

### Merge decisions (k=24 cluster → final category)

- `1, 2 → empires` (medieval rulers/popes folded into empires/dynasties)
- `8, 13 → architecture` (**ancient monuments + modern engineering** — individually era-skewed:
  Monuments median 1025, Architecture median 1930; merged they span the whole timeline, median 1325)
- `14, 15 → revolution` (assassinations/executions + uprisings)
- `20, 23 → writing` (writing systems & printing + literature; "Letters" renamed to **writing** per
  user request)

## Key decisions & rationale

- **k=24, not k=14:** silhouette plateaus there and it cleanly separates Medicine/Art/Agriculture/
  Writing. Under the 24-cap.
- **Year-masking + year-spread reporting:** ensures categories span the timeline. The automatic
  `⚠ ERA-BOUND` flag (IQR<150yrs & span<600yrs) fired on **exactly one** cluster across every K —
  the modern **`media`** bucket (pop-tech / sport / space / video, median ~1964). Every other
  cluster spans eras. `media` is the one acknowledged time-bound catch-all.
- **`media` is a semantic grab-bag**, not just modern. It only partly redistributes by source file.
  Clustering can't split Sport/Fashion out (they never isolate) — those need **file-based**
  assignment in Part B if wanted as their own categories.
- **Category written lowercase** (`empires`, `architecture`, …) to match the existing `category`
  convention (`food`, `conflict`). Display capitalization is a UI concern.
- **Overwrote `category` in place** (no new field). An earlier attempt added a parallel
  `cluster_category` field for "safety"; user correctly rejected that as redundant — the category
  _is_ the cluster category. The old source-file value is recoverable from the filename if needed.

## Files modified

### New (in `experiments/category-clustering/`, alongside the existing notebook)

| File                  | Purpose                                                                                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cluster_sweep.py`    | Loads all non-deprecated event files, year-masks text, embeds with `all-mpnet-base-v2`, sweeps k∈{10,12,14,16,18,20,24,28,32}. Writes per-k `cluster_summary_k*.md` + `assignments_k*.csv` + `sweep_index.md` to `output/`.                                                                 |
| `apply_categories.py` | Reads `output/assignments_k24.csv`, applies the cluster→category merge map (lowercased), **overwrites `category`** in every non-deprecated event file. Writes reference `output/event_category_map_final.json` (name→Category) and `output/cluster_category_names_k24.json` (cluster→name). |

### Event data (tracked) — `public/events/*.json`

All 17 non-deprecated files updated: each event's `category` value replaced with its new
cluster-derived category. `deprecated.json` and `manifest.json` untouched.

> **Pre-existing working-tree state (NOT from this session):** conflict / cultural / diplomatic /
> exploration / infrastructure / people carry uncommitted `color` / `text_color` / `image_width` /
> `image_height` fields from the **prior** `extract_colors.py` run, which inflates their diffs.
> Verified this session's change touched **only** the `category` value — no events or color fields
> were added, removed, or reordered.

### Memory

- `~/.claude/.../memory/category-clustering-sweep-results.md` — full record of taxonomy, counts,
  merge map, and the applied mapping (added to MEMORY.md index).

## Reproduce / inspect

```bash
cd experiments/category-clustering
.venv/bin/python cluster_sweep.py        # re-run sweep (embeddings cached in output/)
.venv/bin/python apply_categories.py     # re-apply categories to public/events/*.json
# Per-cluster naming material:  output/cluster_summary_k24.md
# Full event→category mapping:  output/event_category_map_final.json
```

## Next steps — Part B (code work)

1. **`src/types/index.ts`** — replace the 7-value `Category` union with the **20 lowercase names**
   (`empires`, `revolution`, `architecture`, `writing`, `invention`, `figures`, `media`, `craft`,
   `diplomacy`, `disasters`, `commerce`, `law`, `agriculture`, `warfare`, `science`, `trade`,
   `migration`, `art`, `medicine`, `nature`). Support up to 24.
2. **`public/events/manifest.json`** — expand so all event files load (it currently lists only 7).
   `eventLoader.ts` already reads `category` per event, so events should pick up the new values —
   but verify the Cloudinary-image filter and any category-specific UI.
3. **Category color / icon / picker maps** — add entries for the new categories wherever category
   is hard-coded (mode-select / custom-game category pickers, difficulty/era logic).
4. **Decide `media`'s fate** — keep as a catch-all, or dissolve by source file (e.g. carve out a
   `sport` category from `games-sport.json`). Sport/Fashion can't come from clustering.
5. **Re-run `extract_colors.py --force --width 330 --height 440`** once files are in the manifest,
   so the ~564 previously-orphaned images get colors/dimensions (per the prior image-pipeline
   session's open issue).
6. `candidates.json` (staging) and `deprecated.json` (retired) — confirm intended handling;
   `candidates` events DID get categorized this session, `deprecated` did not.
