# Session Summary — Image Pipeline: Duplicate Resolution, New-Image Sorting & Missing-Prompt Backfill

**Date:** 2026-06-19 → 2026-06-21
**Branch:** `feature/people`

## Overview

A botched image-generation run (it ran against a reverted `images/all_prompts.csv`) dumped **1,129 PNGs** into `images/new_images/` — a mix of brand-new event images and regenerated images for events that _already_ had Cloudinary images. This session built tooling to:

1. **Sort** the new images into "genuinely new" vs "duplicate of an existing Cloudinary image."
2. **Pick** old-vs-new for each duplicate via a throwaway local webapp.
3. **Stage** the chosen images into the normal pipeline and **queue** (not execute) deletion of the superseded Cloudinary images.
4. **Backfill** image-generation prompts for events that still have no image, completing `images/events_missing_images.csv` to 554/554.
5. Begin running the standard pipeline (downsample → extract colors).

> **Note on git:** the entire `images/` tree is gitignored (`.gitignore:47`), so all the new scripts under `images/scripts/` and `images/compare-app/` are **local-only** (consistent with the existing `downsample.py`/`extract_colors.py`). The only tracked change this session is `scripts/requirements.txt`.

## Classification results (from `sort_new_images.py`)

Of the 1,129 files in `images/new_images/`:

- **626 duplicates** — event already had a Cloudinary image → sent to the picker webapp.
- **503 genuinely new** — event exists, no image yet → copied straight into `images/generated_images/`.
- **0 no-match** (the lone oddity `birth-thomas-hobbes-2.png` auto-resolved via a trailing `-N` strip).
- **554 still missing** — events that will _still_ have no image afterward → written to `images/events_missing_images.csv`.

## Picker decisions (626 duplicates)

- **295 → use NEW** (old Cloudinary image to be replaced)
- **331 → keep OLD** (new render discarded)
- 0 skipped / 0 undecided

## Current pipeline state (end of session)

- `images/generated_images/` holds **798** PNGs to process = 503 new + 295 accepted replacements.
- `downsample.py` was run → JPEGs generated in `images/downsampled_generated_images/`.
- `extract_colors.py --force --width 330 --height 440` was run: **4,584 colors + dimensions set** across the 7 manifest JSON files (330×440 is the canonical size — all 4,236 prior imaged events use it).
- `images/compare-app/cloudinary_delete_list.json` holds **295 old public_ids — QUEUED, NOT DELETED** (deletion deliberately deferred to publish time).

## Files created (all local-only under gitignored `images/`)

| File                                          | Purpose                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `images/scripts/sort_new_images.py`           | Classify `new_images/` vs `public/events/*.json`; copy new ones into `generated_images/`; emit `pairs.json`, `classification.json`, `events_missing_images.csv`.      |
| `images/compare-app/server.js` + `index.html` | Throwaway zero-dep (Node built-in `http`) old-vs-new picker on `localhost:5178`; writes `decisions.json` (`old`/`new`/`skip`), resumable.                             |
| `images/scripts/apply_decisions.py`           | For "new" picks: overwrite `generated_images/<event>.png`, clear stale downsampled JPEG, queue old public_id into `cloudinary_delete_list.json`.                      |
| `images/scripts/delete_old_cloudinary.js`     | **Dry-run by default**; `--execute` deletes queued old Cloudinary images (creds from repo-root `.env`). NOT yet run.                                                  |
| `images/scripts/build_missing_prompts.py`     | Emit `missing_prompts_work.json` (metadata + `era_palette` + `year_string`) for events lacking prompts.                                                               |
| `images/scripts/assemble_missing_prompts.py`  | Combine subagent outputs into full prompts in exact `all_prompts.csv` format; fill `events_missing_images.csv`.                                                       |
| `images/compare-app/*.json`                   | Working artifacts: `pairs.json`, `classification.json`, `decisions.json`, `cloudinary_delete_list.json`, `missing_prompts_work.json`, `missing_prompts_results.json`. |
| `images/events_missing_images.csv`            | 554 image-less events, now **554/554 prompt-filled**.                                                                                                                 |

## Files modified (tracked)

- **`scripts/requirements.txt`** (new, tracked) — `Pillow==10.1.0`, `numpy==1.26.2`, `requests==2.31.0` for the Python image pipeline. _(generate_images.py additionally needs the Google GenAI SDK — intentionally omitted.)_
- **`public/events/*.json`** (7 manifest files) — `color`, `text_color`, `image_width=330`, `image_height=440` set by `extract_colors.py` for newly-staged images. _(Note: `public/events/` is tracked; these are real content changes.)_

## Missing-prompt backfill (events_missing_images.csv → 554/554)

- **487** recovered by merging existing prompt CSVs across repo + `~/Downloads` (mostly repo-root `all_prompts.csv`).
- **67** (all in `candidates.json`, a diverse grab-bag with no category template) written by **5 parallel subagents** following `images/claude_prompts/IMAGE_PROMPT_RUBRIC.md`. Subagents produced only the creative `research_focus` + `scene_description`; fixed skeleton, era palette (by year), and research template were assembled deterministically for guaranteed rubric conformance.
- Year format convention: `<0 → "N BCE"`, `1–999 → "N CE"`, `≥1000 → "N"`.
- These prompts are written but the **images have not been generated yet** (that's the `generate_images.py` path).

## Key decisions

- **Copy, not move**, out of `new_images/` — original folder stays intact as a backup.
- Processed images go **straight into `generated_images/`** (incremental pipeline picks up new-only).
- **Cloudinary deletion deferred to publish** — must run `delete_old_cloudinary.js --execute` _before_ `update-cloudinary-urls.js` so each event resolves to exactly one image.
- Missing-CSV scope: all category files **except `deprecated.json`**, **including `candidates.json`** (project is moving away from the strict 6-category design).

---

## ⚠️ KEY OPEN ISSUE FOR NEXT SESSION — Manifest / category refactor

When `extract_colors.py --force` ran, it reported:

> `⚠ 564 images did not match any event` — e.g. `acupuncture-systematized`, `age-of-dinosaurs`, `air-jordan-sneakers`, `airbnb-founded`, `al-razi-distinguishes-smallpox`, …

**Root cause:** both `extract_colors.py` _and_ the app's `src/utils/eventLoader.ts` only process the **7 categories listed in `public/events/manifest.json`** (conflict, cultural, diplomatic, disasters, exploration, infrastructure, people). The ~564 unmatched images belong to events in **non-manifest category files** — `food`, `law`, `medicine`, `clothing`, `communication`, `games-sport`, `earth-life`, and the `candidates` grab-bag. Those events:

- exist in `public/events/*.json` but are **not loaded by the game**,
- got **no `color`/`text_color`/dimensions** written (so even once uploaded they'd render wrong), and
- are exactly the categories the project wants to introduce.

**Next session's goal:** refactor the manifest to **expand the number of categories beyond the strict 6/7-category design**, bringing the currently-orphaned category files (food, law, medicine, clothing, communication, games-sport, earth-life, + however `candidates` is resolved) into the game. Once they're in the manifest, re-run `extract_colors.py --force --width 330 --height 440` so those ~564 images get their colors/dimensions.

### Things to check during that refactor

- `public/events/manifest.json` — add the new category entries/files.
- `src/types/index.ts` — the `Category` union type (currently the 7); add new categories.
- `src/utils/eventLoader.ts` — flattens manifest files; should "just work" once manifest is updated, but verify the Cloudinary-image filter and any category-specific UI (colors, icons, filters).
- Anywhere category is hard-coded: category color/icon maps, mode-select/custom-game category pickers, difficulty/era logic.
- Decide what to do with `candidates.json` (staging pool) and `deprecated.json` (retired — keep excluded).

## Remaining pipeline steps (after the manifest refactor, at publish time)

1. _(done)_ `downsample.py`
2. _(done for manifest cats)_ `extract_colors.py --force --width 330 --height 440` — **re-run after manifest expansion** to cover the ~564 orphaned images.
3. Upload the new JPEGs to Cloudinary (manual dashboard step).
4. `node images/scripts/delete_old_cloudinary.js` → review → `--execute` (delete the 295 superseded images). **Must precede step 5.**
5. `node scripts/update-cloudinary-urls.js` (point event JSON at new Cloudinary URLs).
6. Separately: generate images for the 554 prompt-filled events in `events_missing_images.csv` via `generate_images.py`.
