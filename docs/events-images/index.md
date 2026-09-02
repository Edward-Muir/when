# Events & Images

The event data pipeline: imports, naming, difficulty grading, image generation, colours and
preloading.

- **Adding events by hand:** use the `add-events` skill — it carries the current taxonomy.
- **Grading difficulty:** [difficulty-grading-rubric.md](difficulty-grading-rubric.md) is a
  live reference, kept as its own file.
- **Delivering images:** [../cloudinary-cost-controls.md](../cloudinary-cost-controls.md)
  owns the rung ladder, its hard rules, and the service-worker cache.
- **Full coverage reached 2026-08-23:** every playable event has art —
  [session-2026-08-23-catalogue-image-completion.md](session-2026-08-23-catalogue-image-completion.md)
  covers the last 16, the Unicode-churn diff trap, and how to verify the right image landed.

## The image-generation pipeline is not in this repo

Image work runs out of a `when-images/` tree **beside** this repo (`../when-images`), moved out
of the project root to fix a `vercel dev` bug — see [../dev-tooling/index.md](../dev-tooling/index.md).
It holds generated images, a downsampler, a colour extractor, a dedup sorter, an old-vs-new
picker webapp, and a queued Cloudinary deletion list.

**None of it is under version control**, so it exists only on the machine that made it. As of
2026-08 the tree is intact and in active use: `sort_new_images.py`, `apply_decisions.py`,
`delete_old_cloudinary.js`, `build_missing_prompts.py`, `downsample.py`, `extract_colors.py`,
`find_images_to_upload.js` and the `compare-app` are all present, alongside a
`build_sports_prompts.py` / `assemble_sports_prompts.py` pair added for the sports batch. What
is tracked _here_ is `scripts/` at the repo root and the baked results in `public/events/*.json`.

The pipeline is: prompts CSV → browser-driven Gemini job (**saves to `~/Downloads`, as `.jpeg`**)
→ `downsample.py` → `extract_colors.py` → `find_images_to_upload.js` → manual Cloudinary upload
→ `scripts/update-cloudinary-urls.js` in this repo.

One deferred item: `cloudinary_delete_list.json` holds ~295 superseded `public_id`s, **queued and
never executed**. The `dpr_auto`-era derived assets from the August rung change are similarly
still orphaned (noted in the Cloudinary doc's §4).

## The prompt CSV contract, and the skeleton itself

Recorded here because the last version of it was lost. The Indonesia batch was built by
`when-images/scripts/build_prompt_batch.py` with its scenes in `when-images/scenes/`; both were
untracked, so when the prompts were next needed the skeleton had to be reconstructed from a
prose description of it in [../sports-events/](../sports-events/session-2026-08-20-sports-image-pipeline.md).
Anything that shapes a prompt belongs in git.

**Five columns**, and this is the part that silently breaks a run:

```
event_name,research_prompt,image_prompt,image_generated,saved_filename
```

The consumer is a scheduled browser task driving gemini.google.com, and it sends **two messages
in the same chat** — the research prompt, then the image prompt. Both in-repo generators
(`regenerate_mobile_prompts.py`, and `scripts/events/theme-art-prompts.py` before it was
rewritten) emitted four columns with no `research_prompt`, which drops the priming step the
image prompt is written to rely on.

The skeleton, as used for the 353 theme events:

```
A dramatic chiaroscuro oil painting. 1:1 square composition optimized for small screen
viewing. One dominant focal subject filling most of the frame. Strong silhouettes, high
contrast. {friendly_name} — {description} {scene} No text, no dates, no numbers, no labels,
no borders, no watermarks.

Search the web for reference artworks and historical records of "{friendly_name}"
({year_string}). Study the {research_focus} of this period.
```

**No era palette.** Three generations of prompt each dropped weight — the four-colour palette
became three, then went entirely — because shorter, less prescriptive prompts render better
once the model has already researched the period, and the palette clause was fighting the
scene. `get_era_palette` survives in `regenerate_mobile_prompts.py`, which is otherwise dead:
it writes to `images/claude_prompts/`, which does not exist.

`scene` and `research_focus` are hand-authored per event and live in
`docs/curated-themes/art/scenes/<theme>.json`. Scene rules, learned on the sports batch and
still binding: never describe text (the renderer garbles it and the suffix bans it, so paint
the cause or the object instead — a shot-clock rule became a fast break); no colour adjectives,
though material nouns like "bronze" or "silver" are fine and often necessary; figurative rather
than establishing; likenesses by posture, not face; deaths and epidemics non-graphic.

One measured effect of the rewrite: median prompt length fell from 732 characters to 496, and
the share that is byte-identical boilerplate fell with it.

## Card colours

Each event carries a `color` / `text_color` pair baked into its JSON, extracted **at build
time from the image, never computed in the browser**. Extraction works in **Oklab**, which is
perceptually uniform — averaging in sRGB produces muddy browns.

Canonical image dimensions are **330×440** — the _card_ aspect, not the source size (renders are
square). The colour extractor writes `image_width` / `image_height` alongside the colours. The
only events with other dimensions live in `deprecated.json`, which is absent from `manifest.json`
and therefore never iterated — which is what makes an unfiltered `extract_colors.py` run safe.

## `friendly_name` is capped at 35 characters

A 2026-04 bulk import added ~1,749 events, many with verbose titles that overflowed the card
and got ellipsised. 639 were renamed and the cap became permanent
(`MAX_FRIENDLY_NAME_LENGTH`, enforced by `src/utils/eventNameLength.test.ts`).

**35 comes from the portrait card**, which is the tightest surface: a `line-clamp-2` overlay
~128–144px wide at 14px fits about 35 characters across two lines. The landscape/timeline card
uses `line-clamp-3` (~60 chars) and is _not_ the binding constraint — don't re-derive the limit
from it. 40 and 30 were the alternatives considered.

## Player-visible text must not state the date

`description` and `friendly_name` may not contain a year, decade, century or `NNN CE/BCE`
reference. Enforced by `src/utils/eventDateClues.test.ts` over every file in the manifest.

**This is not redundant with the UI.** `shouldShowYearInPopup` (`src/components/Game.tsx`)
already hides `event.year` while a card is still in the player's hand — _"that's the puzzle"_.
But `GamePopup.tsx` renders `description` directly underneath it and `handleActiveCardTap`
opens that same popup for the hand card, so prose defeats the guard completely.
`friendly_name` is worse again: `Card.tsx` shows it on the card face at all times, so a title
like _"1955 Le Mans Disaster"_ never even needs a tap.

The 2026-08 sports import shipped 100 such events (84 descriptions, 9 titles, plus 11 older
non-sport strays) because nothing checked. That is what the test is for — there is no CI on
tests here, so it only fires when someone runs `npm test`; the `add-events` skill's verify
block is the other half of the enforcement.

- **Relative durations are fine and deliberately not flagged** — _"a 27-year war"_, _"27 years
  in prison"_, _"800 years of Muslim rule"_. About 86 events carry them. They are historical
  content, not a statement of the answer. Don't "fix" them.
- **When the text and the `year` field disagree, the text loses.** Seven sports cards named a
  year that contradicted their own `year` (rowing said 1896 against a `year` of 1900). `year`
  is the graded answer and feeds the difficulty percentile in `difficultyScore.ts`, so editing
  it perturbs deterministic daily decks catalogue-wide; editing prose is inert. Change `year`
  only if the text's year is the date of the card's _headline_ event, the slug doesn't
  contradict it, and a source confirms — then in its own commit.
- **Slugs keep their years.** `le-mans-disaster-1955` is fine; slugs are never rendered, and
  curated themes pin them.
- The detection rule lives in `scripts/events/date-clues.js` (plain CommonJS, so `node` runs
  the report/apply scripts with no build step and the Jest test can `require` it — the same
  arrangement as `scripts/themes/catalogue.js`). `node scripts/events/date-clues-report.js`
  lists offenders and exits non-zero.

### Bulk edits go through a map, never by hand

`public/events/sports.json` is a single 186KB array; parallel hand-edits corrupt it and a
dropped comma only surfaces at build. `scripts/events/date-clues-apply.js` follows the
`shorten-names-apply.js` pattern: rewrites are authored as `slug -> {description?,
friendly_name?}` maps in `untracked_data/`, and one deterministic pass validates _everything_
before writing _anything_ — slug resolves, the rewrite re-passes the date-clue guard, names
fit 35 chars and collide with nothing. Every file round-trips byte-identically under
`JSON.stringify(arr, null, 2) + '\n'`, and `.prettierignore` covers `public/events/`, so
diffs are exactly the edited lines.

Two traps found doing this:

- **`npm run find-duplicates` shifts when you edit descriptions.** It scores same-year +
  similar-description, so deleting `"in 1966"` from two sibling cards _raises_ their
  similarity and manufactures new near-duplicate pairs. Capture a baseline before editing and
  diff against it; don't read the after-state cold.
- **Slug uniqueness is now pinned** by `src/utils/eventSlugUniqueness.test.ts`, across
  `deprecated.json` as well as the manifest. It has to be: `buildEventsByName`
  (`statsStorage.ts`) is a last-write-wins `Map`, so a duplicate slug doesn't error — it
  silently makes one of the two events unreachable, and the collection then renders the
  _other_ card for it. Two pairs had drifted that way and are fixed:
  `human-genome-completed` was one event filed twice (merged; the twin is retired), and
  `first-pharmacopoeia` was two unrelated events 1,481 years apart — the year-65 Dioscorides
  card is now `dioscorides-de-materia-medica`, and 1546 Nuremberg keeps the original slug
  because that is where lookups already resolved, so existing collections are unaffected.
  Its borrowed artwork was dropped: both cards pointed at the one asset, which depicts a
  Roman herbalist, so the 1546 card now renders the category-icon fallback and needs art.
  Note the surviving asset's `public_id` still reads `first-pharmacopoeia_egs3i1` while
  belonging to the Dioscorides card — `image_url` is explicit per event, so the mismatch is
  cosmetic, but don't infer a slug from a `public_id`.

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
(`StatsPanel`, whose Badges section warms only the unlocked badges' art until expanded, and
`TimelinePanel`) because `ModeSelect` idle-pre-mounts all five pager panels — that pre-mount
is a real fix for an iOS scroll-snap stall and should stay; only the warming is gated.

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
