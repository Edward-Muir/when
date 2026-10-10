# Events & Images

The event data pipeline: imports, naming, difficulty grading, image generation, colours and
preloading.

- **Adding events by hand:** use the `add-events` skill — it carries the current taxonomy.
- **Grading difficulty:** [difficulty-grading-rubric.md](difficulty-grading-rubric.md) is a
  live reference, kept as its own file.
- **Known bad records:** [catalogue-error-backlog.md](catalogue-error-backlog.md) — every year,
  name and description found not to match its sources, and how each was resolved, plus the
  flags checked and dismissed. Check it before "fixing" an event, and add a new dated section
  for a new finding rather than a commit message.
- **Delivering images:** [../cloudinary-cost-controls.md](../cloudinary-cost-controls.md)
  owns the rung ladder, its hard rules, and the service-worker cache.

## Every live event has art, because an event without it cannot be dealt

`loadAllEvents` (`src/utils/eventLoader.ts`) drops any event whose `image_url` is not a
Cloudinary URL (`isCloudinaryImage`). An unillustrated event is not a card with a missing
picture; it is a card the game never deals, and a curated theme that names it reads as
unresolved. So a new event ships with its art, and the "events in the files" count and the
"events the game can use" count are the same number.

**A dedup can un-illustrate an event.** Image coverage is a property of the slug, not the
content, so keeping the twin without an `image_url` silently drops the card. After any dedup or
retirement, re-run the "which manifest events lack a Cloudinary `image_url`" check rather than
trusting a list built before it.

## The generation tree lives outside this repo

Image generation runs out of a `when-images/` tree **beside** this repo (`../when-images`), kept
out of the project root because of a `vercel dev` bug — see
[../dev-tooling/index.md](../dev-tooling/index.md). It holds generated images, a downsampler
(`downsample.py`), a colour and dimension extractor (`extract_colors.py`), a dedup sorter
(`sort_new_images.py` / `apply_decisions.py`), an old-vs-new picker webapp (`compare-app`),
`find_images_to_upload.js`, and a queued Cloudinary deletion list.

**None of it is under version control**, so it exists only on the machine that made it. What is
tracked _here_ is the prompt builder, the scene files, the URL writer and the baked results in
`public/events/*.json`. Anything that shapes a prompt belongs in git.

The pipeline:

1. `scripts/events/theme-art-prompts.py` writes the prompts CSV for every manifest event without
   Cloudinary art, from hand-authored scenes. With `--remake` it writes rows for exactly the
   slugs in `--scenes` instead, art or not: that is how bad live art is re-queued
   (`docs/curated-themes/art/card-report-remakes_prompts.csv`, from the player reports).
2. A scheduled browser task drives gemini.google.com through the CSV. It **saves to
   `~/Downloads`, as `.jpeg`**, not into `when-images/`; move the files by matching stems against
   the pending set, and make sure the downsampler accepts `.jpeg`.
3. `downsample.py` → `extract_colors.py` → `find_images_to_upload.js` → manual Cloudinary upload.
4. `scripts/update-cloudinary-urls.js` in this repo writes each event's `image_url`, matching a
   Cloudinary `public_id` to a slug by stripping its suffix.

`cloudinary_delete_list.json` in that tree holds replaced `public_id`s, queued and not yet
executed; the orphaned derived assets are covered in the Cloudinary doc's console-lockdown
section.

## The prompt CSV contract

**Five columns**, and this is the part that silently breaks a run:

```
event_name,research_prompt,image_prompt,image_generated,saved_filename
```

The browser task sends **two messages in the same chat** — the research prompt, then the image
prompt. The image prompt is written to rely on that priming step, so a four-column CSV with no
`research_prompt` produces worse art without any error. Re-running the builder carries
`image_generated` / `saved_filename` across by slug.

The skeleton (`SKELETON` and `RESEARCH` in `theme-art-prompts.py`):

```
A dramatic chiaroscuro oil painting. 1:1 square composition optimized for small screen
viewing. One dominant focal subject filling most of the frame. Strong silhouettes, high
contrast. {friendly_name} — {description} {scene} No text, no dates, no numbers, no labels,
no borders, no watermarks.

Search the web for reference artworks and historical records of "{friendly_name}"
({year_string}). Study the {research_focus} of this period.
```

**No era palette.** Shorter, less prescriptive prompts render better once the model has
researched the period, and a palette clause fights the scene; colour comes from the research
step. The only per-event text is the hand-authored scene.

`scene` and `research_focus` live in `docs/curated-themes/art/scenes/<theme>.json`, as
`{slug: {research_focus, scene}}`. The join is by slug and every mismatch is a hard error: a
scene for an unknown event, a scene for an already-illustrated event, or an unillustrated event
with no scene all fail the run. The committed scene files name events that already have art, so
point `--scenes` at a directory holding only the new batch.

Scene rules: never describe text (the renderer garbles it and the suffix bans it, so paint the
cause or the object instead — a shot-clock rule becomes a fast break); no colour adjectives,
though material nouns like "bronze" or "silver" are fine and often necessary; figurative rather
than establishing; likenesses by posture, not face; deaths and epidemics non-graphic. A "Birth of
X" card pictures X in their active years, not the birth: the card stands for the era they shaped,
and the scene should say "not a birth scene" because the title and description pull the other way.

## Writing image URLs

`update-cloudinary-urls.js` matches by name, so its failure mode is an event silently acquiring
another event's picture. Two checks after a run:

- **No existing `image_url` was removed.** The script rewrites any URL that differs from what
  `buildCloudinaryUrl` produces, so a non-zero count here means the builder has drifted and it
  is rewriting the whole catalogue:

  ```bash
  git diff -- public/events/ | grep -c '^-.*"image_url"'    # 0 = purely additive
  ```

- **Each new URL's stem is its slug.** Strip Cloudinary's 6-character suffix from the
  `public_id` and compare it to `event.name`.

**A large line count is not the red flag.** The script re-serialises each touched file with
`JSON.stringify`, so any escaped sequence (`á`) flips to the literal character. Same
strings, different bytes; parsers cannot tell them apart, and a `name` caught in the churn is
the same slug after decoding.

The stored `image_url` carries `dpr_auto`, which contradicts the Cloudinary rules but never
reaches the CDN: `getImageUrl` strips the stored transforms and substitutes the rung.

## Card colours

Each event carries a `color` / `text_color` pair baked into its JSON, extracted **at build
time from the image, never computed in the browser**. Extraction works in **Oklab**, which is
perceptually uniform — averaging in sRGB produces muddy browns. In this repo the extractor is
`scripts/extract_event_colors.py`: it reads the files listed in `manifest.json` (`--file` for
one), downloads each image at the `thumbnail` rung, and skips events that already have a colour
unless `--force` is passed.

Canonical image dimensions are **330×440** — the _card_ aspect, not the source size (renders are
square). `image_width` / `image_height` are written alongside the colours by the `when-images`
extractor, or by `scripts/fetch-image-dimensions.js`. The only events with other dimensions live
in `deprecated.json`, which is absent from `manifest.json` and therefore never iterated — which
is what makes an unfiltered extraction run safe: everything the manifest reaches already has a
colour and dimensions, so only genuinely new events are processed.

## `friendly_name` is capped at 35 characters

`MAX_FRIENDLY_NAME_LENGTH`, enforced by `src/utils/eventNameLength.test.ts`, so a verbose title
cannot overflow the card and get ellipsised.

**35 comes from the portrait card**, which is the tightest surface: a `line-clamp-2` overlay
~128–144px wide at 14px fits about 35 characters across two lines. The landscape/timeline card
uses `line-clamp-3` (~60 chars) and is _not_ the binding constraint — don't re-derive the limit
from it.

## `year` + `year_end`: the evidence window

Some cards describe a process, a floruit or a reign the record does not pin to a year, and
grading those against a single date grades a guess. Those carry an optional `year_end`, and a
placement anywhere inside the window counts as a success. About 700 events carry one.

**The pair is the window. `year` is simply its start** — not an anchor to hang a forward-only
range off. Where the record puts the window somewhere else, `year` moves with it; keeping `year`
fixed and only extending forwards gives an event whose evidence begins a century earlier a
window that starts in the wrong place.

- Written by `scripts/events/year-range-report.js` / `-apply.js`, never by hand in bulk: the
  same "agents write maps, one pass writes the catalogue" arrangement as the detail prose.
- `scripts/events/year-range.js` holds both the candidate heuristics and the validator, and
  `src/utils/eventYearRange.test.ts` requires it, so the corpus and the tool that writes it
  cannot disagree about what is valid.
- **`year_end` alone cannot move a daily deck** — `year` is the sole anchor for difficulty
  scoring, deck composition, era filtering and recency. **Moving `year` very much can**, which
  is why it needs a `reason` and the apply script prints every move. The working discipline:
  apply range-only entries first and confirm the deck tests are untouched, then land year moves
  in their own commit and re-measure `deckBuilder.test.ts`'s bound rather than widening it. The
  measurement is date-dependent, so compare before and after on the same day.
- **Candidate detection reuses an existing exemption.** The duration phrases `date-clues.js`
  deliberately does _not_ flag as spoilers ("a 27-year war", "800 years of Muslim rule") are
  exactly the cards that name a period, so that carve-out doubles as a pre-built worklist.
- **There is no cap on how wide a window may be.** A prehistoric window really is millions of
  years wide, and a flat cap binds hardest on the agriculture and domestication cards, which
  are the clearest processes in the catalogue. Honesty about uncertainty beats game balance.
  What exists instead is visibility: the apply script prints the widest ranges and any fully
  nested pairs after every run, and with nothing rejecting a mis-keyed digit that printout is
  the only thing between a typo and a card placeable anywhere.
- **Omitting is usually right.** A precise, well-attested event must not get a window — a
  ratified chronostratigraphic boundary (`jurassic-period-begins`, and anything else whose
  stored value is unrounded like -201400000) carries a published age with an error bar, not a
  window, and is among the most defensible single years in the catalogue.

### Every event carries a verdict

**Every event in the manifest has been reviewed**, so never re-run this from scratch: a future
pass reviews only what `year-range-report.js` lists.

- **The decided ledger is `scripts/events/year-range-decided.json`**, `slug -> why this card is
a moment`, written by `year-range-apply.js` from `year_end: null` entries and committed.
  "Reviewed and left alone" is the commonest outcome of a sweep, and without the ledger the
  report script cannot tell an event nobody has looked at from one four readers have each
  dismissed. `eventYearRange.test.ts` pins it to the catalogue — every ledger slug resolves,
  carries a reason, and does not also carry a `year_end`. Re-opening a decided card means
  deleting its ledger line first; writing a window to one retracts its rejection automatically.
- **`eventRangeSignals` is a per-record hint, not the worklist.** `--all` sweeps everything and
  an empty `signals` array is itself the hint that nothing flagged this card. A weaker
  `process-noun` tier reports under its own names so a writer can tell a `siege` hit from a
  `dynasty` hit.
- **The rule that decides the most cards is the title one.** A card whose title says Begins,
  Founded, Established, Starts or Outbreak names that act, not the span that followed. It is
  what separates `Jewish Revolt Against Rome` (66-73) from `Peloponnesian War Begins`, and it
  is why `Pax Romana Begins`, `Delhi Sultanate Established` and `Kangxi Begins Reign` are all
  single years.
- **A span inside one calendar year cannot be expressed at all**, since `year_end` is an integer
  year that must exceed `year`. The 1974 Bengal famine and the 1518 dancing plague are points
  for that reason, not by oversight.
- **A session's WebSearch budget is one pool shared by every sub-agent**, and a catalogue-wide
  sweep drains it, which rejects period-shaped cards for want of a source rather than on the
  merits. WebFetch against Wikipedia draws on no such pool and is the documented fallback in
  the `set-evidence-window` skill; reach for the fetch first and the budget stops being a
  constraint.
- **The list of what to re-run belongs in the ledger, not in prose.** Grep
  `year-range-decided.json` for the wording a rejection used rather than maintaining a list of
  slugs by hand.
- **Where two sourced reviews of one card disagree about the window's start by more than fifty
  years, `year` does not move.** Disagreement that wide is evidence the record is not settled,
  and the anchor is the field that moves daily decks.

The rule that consumes this field, and why the obvious version of it is unsound, is in
[../gameplay-feel/index.md](../gameplay-feel/index.md).

## Player-visible text must not state the date

`description` and `friendly_name` may not contain a year, decade, century or `NNN CE/BCE`
reference. Enforced by `src/utils/eventDateClues.test.ts` over every file in the manifest.

**This is not redundant with the UI.** `shouldShowYearInPopup` (`src/components/Game.tsx`)
hides `event.year` while a card is still in the player's hand — _"that's the puzzle"_. But
`GamePopup.tsx` renders `description` directly underneath it and `handleActiveCardTap` opens
that same popup for the hand card, so prose defeats the guard completely. `friendly_name` is
worse again: `Card.tsx` shows it on the card face at all times, so a title like _"1955 Le Mans
Disaster"_ never even needs a tap.

There is no CI on pull requests. The test runs when someone runs `npm test`, and as the release
workflow's gate (`.github/workflows/release.yml`), which runs after a merge to `main` has
already deployed. The `add-events` skill's verify block is the other half of the enforcement.

- **Relative durations are fine and deliberately not flagged** — _"a 27-year war"_, _"27 years
  in prison"_, _"800 years of Muslim rule"_. They are historical content, not a statement of the
  answer. Don't "fix" them.
- **When the text and the `year` field disagree, the text loses.** `year` is the graded answer
  and feeds the difficulty percentile in `difficultyScore.ts`, so editing it perturbs
  deterministic daily decks catalogue-wide; editing prose is inert. Change `year` only if the
  text's year is the date of the card's _headline_ event, the slug doesn't contradict it, and a
  source confirms — then in its own commit.
- **Slugs keep their years.** `le-mans-disaster-1955` is fine; slugs are never rendered, and
  curated themes pin them.
- The detection rule lives in `scripts/events/date-clues.js` (plain CommonJS, so `node` runs
  the report/apply scripts with no build step and the Jest test can `require` it — the same
  arrangement as `scripts/themes/catalogue.js`). `node scripts/events/date-clues-report.js`
  lists offenders and exits non-zero.

### Bulk edits go through a map, never by hand

The event files are large single arrays; parallel hand-edits corrupt them and a dropped comma
only surfaces at build. `scripts/events/date-clues-apply.js` is the house pattern: rewrites are
authored as `slug -> {description?, friendly_name?}` maps in `untracked_data/date-clues/`, and
one deterministic pass validates _everything_ before writing _anything_ — slug resolves, the
rewrite re-passes the date-clue guard, names fit 35 chars and collide with nothing. Every file
round-trips byte-identically under `JSON.stringify(arr, null, 2) + '\n'`, and `.prettierignore`
covers `public/events/`, so diffs are exactly the edited lines.

Never rewrite the `name` slug: it is the identity used for dedup, collection tracking and
recency.

Traps:

- **Parallel renames collide.** Two siblings shortened by different agents can land on the same
  title, so dedupe names after merging the maps, not per batch.
- **`npm run find-duplicates` shifts when you edit descriptions.** It scores same-year +
  similar-description, so deleting `"in 1966"` from two sibling cards _raises_ their
  similarity and manufactures new near-duplicate pairs. Capture a baseline before editing and
  diff against it; don't read the after-state cold.
- **Slug uniqueness is pinned** by `src/utils/eventSlugUniqueness.test.ts`, across
  `deprecated.json` as well as the manifest. It has to be: `buildEventsByName`
  (`statsStorage.ts`) is a last-write-wins `Map`, so a duplicate slug doesn't error — it
  silently makes one of the two events unreachable, and the collection then renders the
  _other_ card for it. Where two different events share a slug, the one existing lookups
  already resolve to keeps it, so collections are unaffected.
- **Don't infer a slug from a `public_id`.** `image_url` is explicit per event, and an asset's
  `public_id` can name a different card: `dioscorides-de-materia-medica` and
  `first-pharmacopoeia` both point at `first-pharmacopoeia_egs3i1`, art made for the Dioscorides
  card, so the 1546 pharmacopoeia card needs its own.

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

**The orchestrator owns look-ahead warming only.** Never warm the `detail` rung per render in
`Card.tsx` / `TimelineEvent.tsx`: that fetches a full-size popup image for every card on screen
whether or not the popup is opened. `GamePopup` paints the already-cached thumbnail as a
`backgroundImage` behind the detail `<img>`; the thumbnail is always warm because the player
just tapped that card, so it still feels instant.

Two panels gate their image warming behind an `active` / `hasBeenActive` prop
(`StatsPanel`, whose Achievements section warms only the unlocked badges' art until expanded, and
`TimelinePanel`) because `ModeSelect` idle-pre-mounts all five pager panels — that pre-mount
is a real fix for an iOS scroll-snap stall and should stay; only the warming is gated.

## Difficulty grading

The label grades **recognition and inferability only**. Crowding is computed, never graded —
see the rubric, and [../gameplay-feel/index.md](../gameplay-feel/index.md) for why the label
alone anti-correlates with real placement difficulty.

Grading runs in bulk by parallel subagents against the rubric, batched **by `category`** so each
agent owns one output file and merges can't conflict. The tooling is `scripts/difficulty/grade/`:
`extract_batches.py`, `apply.py`, and `band_report.py`, whose band-0 pool floor is the acceptance
gate. Wikipedia pageviews (`scripts/difficulty/wikipedia_pageviews.py`) are not a grading input.
