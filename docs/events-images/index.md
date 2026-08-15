# Events & Images

The event data pipeline: imports, naming, difficulty grading, image generation, colours and
preloading.

- **Adding events by hand:** use the `add-events` skill — it carries the current taxonomy.
- **Grading difficulty:** [difficulty-grading-rubric.md](difficulty-grading-rubric.md) is a
  live reference, kept as its own file.
- **Delivering images:** [../cloudinary-cost-controls.md](../cloudinary-cost-controls.md)
  owns the rung ladder, its hard rules, and the service-worker cache.

## The image-generation pipeline is not in this repo

Image work ran out of an `images/` tree at the project root: generated PNGs, a downsampler, a
colour extractor, a dedup sorter, a throwaway old-vs-new picker webapp, and a queued Cloudinary
deletion list. **All of it was gitignored, and the directory was later moved out of the repo
entirely** (to `../when-images`) to fix a `vercel dev` bug — see
[../dev-tooling/index.md](../dev-tooling/index.md).

So the scripts described in older write-ups (`sort_new_images.py`, `apply_decisions.py`,
`delete_old_cloudinary.js`, `build_missing_prompts.py`, the `compare-app`) **cannot be assumed
to exist**. What remains tracked is `scripts/` at the repo root and the baked results in
`public/events/*.json`. Check before promising to re-run anything.

One deferred item, if that tree is ever recovered: a `cloudinary_delete_list.json` held ~295
superseded `public_id`s, **queued and never executed**. The `dpr_auto`-era derived assets from
the August rung change are similarly still orphaned (noted in the Cloudinary doc's §4).

## Card colours

Each event carries a `color` / `text_color` pair baked into its JSON, extracted **at build
time from the image, never computed in the browser**. Extraction works in **Oklab**, which is
perceptually uniform — averaging in sRGB produces muddy browns.

Canonical image dimensions are **330×440**; the colour extractor writes `image_width` /
`image_height` alongside the colours. Some events (notably the `figures` set added with the
20-category re-clustering) may still be missing `image_url` entirely — they simply render the
category-icon fallback.

## `friendly_name` is capped at 35 characters

A 2026-04 bulk import added ~1,749 events, many with verbose titles that overflowed the card
and got ellipsised. 639 were renamed and the cap became permanent
(`MAX_FRIENDLY_NAME_LENGTH`, enforced by `src/utils/eventNameLength.test.ts`).

**35 comes from the portrait card**, which is the tightest surface: a `line-clamp-2` overlay
~128–144px wide at 14px fits about 35 characters across two lines. The landscape/timeline card
uses `line-clamp-3` (~60 chars) and is _not_ the binding constraint — don't re-derive the limit
from it. 40 and 30 were the alternatives considered.

Only `friendly_name` was ever touched. Never rewrite the `name` slug: it is the identity used
for dedup, collection tracking and recency.

**Lesson from doing it in parallel:** subagents wrote `slug → new_name` mapping files and a
single deterministic script applied them, rather than letting agents edit shared JSON directly.
That avoided corruption, but the parallel renames still produced **10 collisions** where two
siblings shortened to the same title — dedupe after merging, not per-batch.

## Image preloading

Three layers, in order of increasing scope:

1. **`preloadImage(url, priority?)`** — fire-and-forget primitive, deduped through a
   module-level `Set`. Pass `'low'` for background warming so it never competes on the wire
   with visible `<img>` tags; HTTP/2 multiplexing will otherwise starve on-screen thumbnails.
2. **`preloadEventImages(events, variants, priority?)`** — fan-out over `getImageUrl`.
   Thumbnail and detail are distinct URLs and dedupe independently.
3. **`useImagePrefetch(state, introEvents)`** — the single App-level orchestrator, phase-driven.
   It is **mounted once at App level on purpose**: App survives `AnimatePresence mode="wait"`
   phase swaps, which would cancel a phase component's pending idle callbacks.

| Phase                     | Warms                                 | Why                                                                                 |
| ------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| `modeSelect` / `gameOver` | the intro-animation cards             | home dwell warms the next intro                                                     |
| `transitioning`           | seed timeline + dealt hands only      | no pop-in entering play — deliberately not the whole deck, which won't finish in 3s |
| `playing`                 | next 5 deck cards, re-warmed per draw | drawn cards appear instantly                                                        |

**The orchestrator owns look-ahead warming only.** An earlier write-up described per-render
`detail` warming in `Card.tsx` / `TimelineEvent.tsx` as "correct colocation" — that was
**removed** in the August audit, because it fetched a full-size popup image for every card on
screen whether or not the popup was opened. `GamePopup` now paints the already-cached thumbnail
as a `backgroundImage` behind the detail `<img>`; the thumbnail is always warm because the
player just tapped that card, so it still feels instant. Don't reintroduce the eager warm.

Two panels gate their image warming behind an `active` / `hasBeenActive` prop
(`AchievementsPanel`, `TimelinePanel`) because `ModeSelect` idle-pre-mounts all five pager
panels — that pre-mount is a real fix for an iOS scroll-snap stall and should stay; only the
warming is gated.

## Difficulty grading

The label grades **recognition and inferability only**. Crowding is computed, never graded —
see the rubric, and [../gameplay-feel/index.md](../gameplay-feel/index.md) for why the label
alone anti-correlates with real placement difficulty.

Grading was done in bulk by parallel subagents against the rubric, batched **by category** so
each agent owned one output file and merges couldn't conflict. `scripts/difficulty/` and the
Wikipedia pageviews scripts (`wikipedia_pageviews.py`, used as a recognition signal) are the
tracked remnants.

## Event editor tool

`tools/event-editor/` is a standalone local web tool for browsing, editing, adding and deleting
events, moving them between files, and fetching image dimensions and Wikipedia pageviews. It has
its own `package.json`:

```bash
cd tools/event-editor && npm install && npm run dev
```

Full guide: [event-editor-tool.md](event-editor-tool.md).
