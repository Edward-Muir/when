# Session: Event Card Color Extraction (2026-03-31)

## Overview

Added a system to extract dominant colors from event images and apply them to card backgrounds, so the text area of each card matches the image's palette. This involves:

1. A Python script that downloads Wikipedia thumbnails and extracts dominant colors using the "Okmain" algorithm (Oklab color space + K-means clustering)
2. New `color` and `text_color` fields on the `HistoricalEvent` type
3. A utility (`eventColor.ts`) and component updates to apply colors at render time

## Research

Read and summarized the [Okmain article](https://dgroshev.com/blog/okmain/) and [HN discussion](https://news.ycombinator.com/item?id=47309397) on perceptual color extraction. Key takeaway: work in Oklab color space (not sRGB) to avoid muddy averages, use K-means clustering, and score clusters by pixel count × chroma.

## Files Created

- **`scripts/extract_event_colors.py`** — Offline script to extract colors from all events
  - Downloads Wikipedia thumbnails, resizes to 64×64
  - Converts to Oklab, runs K-means (K=4), picks cluster with highest (count × saturation) score
  - Clamps lightness to [0.25, 0.75], determines light/dark text, writes hex color back to JSON
  - Flags: `--force`, `--category NAME`, `--dry-run`, `--sample N`
  - Rate limited at 10s between requests (Wikipedia is aggressive), with exponential backoff on 429s
  - Idempotent — skips events that already have a `color` field

- **`src/utils/eventColor.ts`** — Utility functions for components
  - `getEventColorStyle(event)` → `{ backgroundColor: color }` or `undefined`
  - `getEventTextClass(event)` → Tailwind class for light/dark text

## Files Modified

- **`src/types/index.ts`** — Added `color?: string` and `text_color?: 'light' | 'dark'` to `HistoricalEvent`
- **`src/components/Card.tsx`** — Portrait cards still use gradient overlay; landscape cards apply `getEventColorStyle` to the title section
- **`src/components/Timeline/TimelineEvent.tsx`** — Timeline cards apply color style to the 60% title section, with appropriate text color
- **`public/events/*.json`** — 229/2508 events now have `color` and `text_color` fields (first batch before Wikipedia rate limiting kicked in)

## Current State

- **229 of 2508 events** have colors extracted (mostly `conflict.json` — 164 events)
- The script needs to be run to completion: `python3 scripts/extract_event_colors.py`
- At 10s between requests, the remaining ~2,279 events will take ~6-7 hours
- The script is idempotent — safe to interrupt and re-run

## Key Decisions

- **Build-time extraction, not runtime** — Colors are baked into the JSON data files, not computed in the browser
- **Oklab color space** — Perceptually uniform, avoids muddy browns from sRGB averaging
- **Lightness clamping [0.25, 0.75]** — Prevents pure black/white backgrounds that would look bad
- **Text color threshold at L=0.6** — Above this lightness, use dark text; below, use light text
- **10s rate limit + 30s base backoff** — Wikipedia aggressively rate-limits; earlier attempts at 50ms and 200ms were immediately 429'd

## Next Steps

1. Run the full extraction to completion: `python3 scripts/extract_event_colors.py`
2. Visually review the results — some colors may need manual adjustment
3. Consider whether portrait cards (deck view) should also use the extracted color instead of the gradient overlay
4. The color extraction uses the Wikipedia thumbnail URL from `image_url` — events without images get no color and fall back to the default `bg-surface` style
