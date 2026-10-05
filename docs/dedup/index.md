# Duplicate events

The catalogue was assembled from many sources, so the same event can sit in it twice under
different ids — `windmill-european` and `windmill-introduction`, `galen-medical-advances` and
`galen-medical-dominance`, six separate windmills. A duplicate is worse than a missing event: two
cards for one moment sit at nearly the same year, which is a coin flip rather than a placement, and
they burn two slots in a hand of five.

One full review over 492 name-based clusters is applied. Its record is in this folder.

## Nothing is hard-deleted

A retired event moves to `public/events/deprecated.json` with `_originalCategory` and
`_deprecatedAt`. `deprecated.json` is deliberately absent from `manifest.json`, so those events
stop being served but stay recoverable.

- **Retire through `scripts/events/backlog-apply.js`** (`slug -> { retire: { keep, reason } }`).
  It takes the card's satellites with it — the detail-prose entry (an orphan fails
  `eventDetailCorpus.test.ts`) and its line in `year-range-decided.json` (a ledger slug outside the
  manifest fails `eventYearRange.test.ts`) — requires `keep` to be live so a cluster can never lose
  every copy, and refuses a slug a badge draws its art from.
- `scripts/apply-dedup-deletions.js` is the bulk applier for the `/admin/dedup` export
  (`dedup-delete-list.json`, `--dry-run` supported, a fixed `DEPRECATED_AT` so a re-run produces a
  stable diff). It moves the event records only: no prose, no ledger line, no badge check. Use it
  for a fresh review export only after handling those three by hand, or translate the export into
  `backlog-apply.js` maps.
- **In the entries the bulk review retired, `_originalCategory` holds the source file's stem**
  (`exploration`, `diplomatic`), not a category. The entry's own `category` field is its category.

## What is in this folder

- `dedup-delete-list.json` — `{name, file}` per retired id. The `/admin/dedup` page's own export
  (its Download .json button), not hand-assembled.
- `dedup-decisions.json` — the page's full localStorage snapshot, keyed by cluster index. To reload
  the whole review and spot-check any cluster, in the devtools console on `/admin/dedup`:

  ```js
  localStorage.setItem('when-dedup-decisions-v1', JSON.stringify(<contents>));
  location.reload();
  ```

  Cluster numbers in the page's UI are 1-based.

## The review tool

`/admin/dedup` (`src/pages/AdminDedup.tsx`, routed in `src/index.tsx`, with its `vercel.json`
rewrite) reads `public/dedup/clusters.json`, which `scripts/build-dedup-clusters.js` builds. The
builder's primary source is the frozen review CSV, `docs/sports-events/duplicate-clusters-review.csv`;
only when that file is absent does it cluster the live manifest heuristically (very similar
friendly names). So re-running it reproduces the reviewed clusters, and events added to the
catalogue after them have never been clustered.

## How keepers are chosen

Applied in this order; the first one that separates the candidates wins:

1. **Year accuracy** for the event as titled — `divine-comedy` (1320, "completed") over
   `dante-divine-comedy` (1308, which also says "completed"); `first-fleet-australia` (1788
   arrival) over the 1787 departure framing.
2. **Title clarity for a general player**, ≤35 chars, no date give-away — drop clunkers like
   "Lannathai Kingdom Unified Territory" or "Battle of Manzikert Consequences". A title that is a
   slug (`Pliny-Natural-History`) loses, or the keeper takes a real title.
3. **Description specificity** — keep the card that names the person, place or work
   (`avicenna-medical-education` names the Canon; `machu-picchu-construction` names Pachacuti).
4. **The right `category`** — `al-razi-distinguishes-smallpox` as `medicine`, `tulip-mania-crashes`
   as `disasters`.
5. **Id matching the title**, as a tiebreak only.

Consistency preferences across clusters: matched naming wins (the Norse trio keeps
`vikings-iceland` / `vikings-greenland` / `viking-america`), and an event staged in
`candidates.json` loses to an equivalent elsewhere.

- **Ask "are these the same event?" before "which is best?".** A uniform collapse-to-one policy
  always over-deletes where the clustering is loose. A conquest and the trade driving it
  (`russian-expansion-siberia` / `fur-trade-russian`), or a sacred object and the polity's founding
  (`asante-golden-stool` / `asante-confederation`), are cause and event, not duplicates: keep both.
  Collapse only where the loser is a paraphrase, such as a "decline begins" card whose description
  is entirely the siege the other card names.
- **A keeper's title and its own description must agree.** A card titled "Cambrian Period Begins"
  that describes the Cambrian Explosion loses to the card titled for what it describes.
- **Watch for obscurity inversion**: the keeper must not be the obscure framing when the dropped
  card carries the name a player recognises (`council-chalcedon` over `monophysite-controversy`).
- **Bare one-word titles are house style**, not a defect (`Arquebus`, `Banknote`, `Blueprint`), and
  ranking title clarity above description length is deliberate: "Vikings Reach Greenland" beats
  "Norse Atlantic Colonization Begins".
- **Check badge art and image coverage on the keeper.** If the keeper is already some other badge's
  art, pick an on-theme survivor instead so every badge's art stays unique; and keeping the twin
  without an `image_url` makes the card undealable (see
  [../events-images/index.md](../events-images/index.md)).

## Open near-duplicate pairs

The tool decides one cluster at a time, so it cannot merge near-duplicates the clustering split
across two clusters, or catch two names for one event. These are live and want a decision:

- **Compass** — `compass-invention-china` and `compass-navigation`, both the Chinese magnetic
  compass for navigation.
- **Benin art** — `benin-bronze-casting-peak` and `benin-art-renaissance`.
- **Paper money** — `paper-money-china` (810) and `song-paper-money-system` (1024).
- **Leeuwenhoek** — `first-microscope` (1674 observations; the id is misleading, he did not invent
  the microscope) and `leeuwenhoek-bacteria` (1676).
- **Anaesthesia** — `first-anesthesia-surgery` (1842, Long) and `anesthesia-invented` (1846,
  Morton). Defensible as two milestones, but tight.
- **Library of Alexandria** — `museum-alexandria-founded` and `first-public-library` are the same
  institution (the Library was part of the Mouseion) under unrelated names.

## Traps

- **The clustering compares names, not meaning.** Two cards for one event under unrelated names
  never land in a cluster, so they are never reviewed. The clusters are a floor on the duplicates,
  not a ceiling.
- **A delete-list is data with a shelf life.** Keepers are chosen on year, title and description;
  if someone rewrites a doomed event's text afterwards, the decision may not hold. Before
  applying, re-check any doomed event whose `year`, `friendly_name`, `description` or `category`
  changed since the review — a `difficulty` change alone means nothing here.
- **Two places outside the event files name an event id**: `src/data/achievements.ts` (badge card
  art, resolved by `eventName`) and the curated-theme calendar in Redis. Neither fails loudly at
  play time: `buildCuratedPool()` in `dailyPool.ts` drops an unresolvable slug silently, so a theme
  just quietly runs short. Check both before retiring anything. Read the live calendar
  (`GET /api/themes`) rather than the docs — the docs are a draft of what was published, not the
  published thing. Re-publish an affected theme only for dates that have not yet opened; a past
  date must never be rewritten.
- **Retiring events changes every future daily.** Removing cards from the pool re-rolls deck
  composition for every seeded date, and the recency replay in `dailyRecency.ts` rebuilds recent
  past dailies from the current catalogue too. Intended, but not invisible.
