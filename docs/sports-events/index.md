# Sports Events & Duplicate Audit

The `sports` category, how its events were researched and deduplicated, and the game-wide
duplicate audit that feeds the `/admin/dedup` review tool.

## The `sports` category

- `sports` is one of the 21 values of `ALL_CATEGORIES` (`src/types/index.ts`), with 378 events
  (easy 34 · medium 191 · hard 139 · very-hard 14), from 2600 BCE to 2023. Its icon is
  `Trophy` in `CategoryIcon.tsx`, its badge is `cat-sports`, and everything else (filter chips,
  daily themes, display name) derives from `ALL_CATEGORIES`.
- **It sits last in `ALL_CATEGORIES`, and a new category must be appended too.** The challenge
  code packs categories as a bitmask by list index (`arrayToBitmask(…, ALL_CATEGORIES)` in
  `challengeCode.ts`), so inserting one mid-list re-points every existing code's bits.
- The Modern era (1992+) is deliberately kept to about 50 events to avoid a contemporary skew;
  the bulk is Industrial and Cold War, with Ancient, Medieval and Renaissance about 20 each.

## Researching events with sub-agents

The method: seed an exclusion list from the whole catalogue → fan out schema-forced research
agents (structured output, web-verified years, `friendly_name` ≤ 35) → dedup deterministically
(title + description Jaccard) against the catalogue and within the batch → a per-era LLM
semantic dedup pass → curate for era balance.

- **Reworded duplicates are the hard problem.** "Naismith Invents Basketball" and "Basketball
  Invented" share almost no title tokens, so similarity thresholds miss them. Jaccard catches
  obvious repeats only; the reliable pass is an LLM semantic dedup, chunked, that returns _names
  to keep_ so nothing is rewritten or invented.
- **Give the dedup stage full descriptions of what already exists.** An exclusion list of names
  alone leaves description-based dedup against the catalogue dead.
- **Partition research on one clean axis** (by sport and era, every event in exactly one
  bucket). Mixing axes (sport × milestone type × region) makes agents surface the same events.
  A by-sport partition still re-derives each sport's canonical milestones, which are mostly in
  the catalogue already, so robust dedup matters more than agent count.
- **Finish with a year-ordered window sweep.** Same-event duplicates are always close in year,
  so overlapping windows over events sorted by year find the survivors without O(n²) LLM calls.
- **Stop at the quality bar, not a target count.** Past a point the additions get too obscure
  to be fair cards.

## Deleting duplicates: the keep-rule

Prefer the image-backed copy, **never delete both**, and **never auto-delete when more than one
copy is playable** — surface those for a human. Some clusters are false positives
(`seed-drill` ≠ `agricultural-revolution`, `watt-separate-condenser` ≠ `steam-engine`), so
nothing is deduped wholesale.

[`duplicate-clusters-review.csv`](duplicate-clusters-review.csv) is the frozen game-wide audit
(columns `cluster, size, year, title, category_file, has_image, name`; `category_file` is a
storage shard, not a category). It is the primary source for `scripts/build-dedup-clusters.js`,
which feeds the `/admin/dedup` review tool — see [../dedup/](../dedup/index.md).

## Traps worth not rediscovering

- **A year-vs-text mismatch is not evidence the `year` is wrong.** Usually the description has
  wandered onto a neighbouring fact (`first-henley-regatta` is 1839; its text named 1851, when it
  became _Royal_). Check sources before editing either, and re-read a description whenever its
  card's `year` moves: "after the previous Olympics" points at a different Games once the year
  shifts. The rules for date clues in card text are in
  [../events-images/](../events-images/index.md).
- **When a pipeline step reports zero work, check what it globs.** A downsampler that globs
  only `.png` against renders that arrive as `.jpeg` prints "All images already processed" and
  exits 0. The pipeline keys on the filename stem, so the input extension is
  incidental; every step must accept `.png`, `.jpg` and `.jpeg`. The image pipeline itself is in
  [../events-images/](../events-images/index.md).
