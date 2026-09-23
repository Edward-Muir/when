# Duplicate events

The catalogue was assembled from many sources over many sessions, so the same event often
entered it twice under different ids — `windmill-european` and `windmill-introduction`,
`galen-medical-advances` and `galen-medical-dominance`, six separate windmills. A duplicate is
worse than a missing event: two cards for one moment sit at nearly the same year, which is a coin
flip rather than a placement, and they burn two slots in a hand of five.

**5,629 → 5,107 served events**, decided over 492 clusters. The reasoning behind every decision,
and the full re-land write-up, is in
[session-2026-07-31-duplicate-review-completed.md](session-2026-07-31-duplicate-review-completed.md).

## Nothing is hard-deleted

`scripts/apply-dedup-deletions.js` reads `dedup-delete-list.json` and, for every id it removes
from a category file, appends the whole event to `public/events/deprecated.json` with
`_originalCategory` and `_deprecatedAt` — the same convention as the event editor's
`deprecateEvent()`. `deprecated.json` is deliberately absent from `manifest.json`, so those events
stop being served but stay recoverable. Supports `--dry-run`; `DEPRECATED_AT` is a fixed constant
so a re-run produces a stable diff instead of churning timestamps.

## What is in this folder

- `dedup-delete-list.json` — 526 × `{name, file}`. The `/admin/dedup` page's own export, not
  hand-assembled. This is the input the script consumes.
- `dedup-decisions.json` — the page's full localStorage snapshot, keyed by cluster index. Paste it
  into `localStorage['when-dedup-decisions-v1']` on `/admin/dedup` to reload the whole review and
  spot-check any cluster.
- The session write-up — how keepers were chosen, the collapse-to-one bias that had to be
  corrected, the achievement badges that had to be repointed, and what is still owed.

## The review tool lives on `dev`

`/admin/dedup`, `public/dedup/clusters.json` and `scripts/build-dedup-clusters.js` were never
brought to `main` — they are on the `dev` branch. To review the events added since, work there.

## Traps

- **The clustering compares names, not meaning.** Two cards for one event under unrelated names
  (`museum-alexandria-founded` vs `first-public-library`) never land in a cluster, so they were
  never reviewed. The 492 clusters are a floor on the duplicates, not a ceiling.
- **The delete-list is data with a shelf life.** Keepers are chosen on year, title and
  description; if someone rewrites a doomed event's text afterwards, the decision may no longer
  hold. Two keepers had to be reversed on re-land for exactly this reason. Re-check any doomed
  event whose `year`, `friendly_name`, `description` or `category` changed since the review —
  a `difficulty` change is just the regrade and means nothing here.
- **Deleting an event can break things that name it.** Two places hold event ids outside the
  event files: `src/data/achievements.ts` (badge card art — 8 badges broke) and the curated-theme
  calendar in Redis (`borobudur-temple` was pinned in the `indonesia` theme). Neither fails loudly:
  `curatedPool()` drops an unresolvable slug silently, so a theme just quietly runs short. Check
  both before applying. Read the live calendar (`GET /api/themes`) rather than the docs — the docs
  are a draft of what was published, not the published thing. Re-publish an affected theme only if
  its dates have not yet opened; a past date must never be rewritten.
- **This changes every future daily.** Removing 9% of the pool re-rolls deck composition for every
  seeded date, and past dailies replayed by `dailyRecency` change too. Intended, but not invisible.
