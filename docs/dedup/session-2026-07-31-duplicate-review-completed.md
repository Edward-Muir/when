# Duplicate review completed (`/admin/dedup`)

Finished the duplicate-cluster review started earlier on this branch. All **492 clusters**
in `public/dedup/clusters.json` now have a decision: **458 resolved** (a keeper chosen,
the rest of the cluster marked for deletion) and **34 passed** ("not a duplicate", nothing
deleted). The page reports `0 pending`.

Result: **530 event ids marked for deletion**, 533 kept across the clusters.

## What was already done vs. what this session added

| Range                                | Decisions                | Source                                                                            |
| ------------------------------------ | ------------------------ | --------------------------------------------------------------------------------- |
| Clusters 1–138 (0-indexed 0–137)     | 104 resolved + 34 passed | Reviewed manually earlier; reconstructed from the exported delete-list of 115 ids |
| Clusters 139–492 (0-indexed 138–491) | 354 resolved             | This session                                                                      |

The earlier 115 ids are carried through unchanged — they all still appear in the final
export. Reconstruction is exact: for each of those clusters the keeper set is "every member
not in the exported delete-list", and no cluster had all its members deleted.

## Files

- `dedup-delete-list.json` — the page's own export (530 × `{name, file}`), downloaded from
  the Download .json button, not hand-assembled.
- `dedup-decisions.json` — the full localStorage snapshot (`{clusterIndex: decision}`).
  To restore the review in a browser:

  ```js
  // devtools console on /admin/dedup, with the file contents pasted in
  localStorage.setItem('when-dedup-decisions-v1', JSON.stringify(<contents>));
  location.reload();
  ```

## How keepers were chosen

Applied in this order, first one that separates the candidates wins:

1. **Year accuracy** for the event as titled — e.g. cluster 206 keeps `divine-comedy` (1320,
   "completed") over `dante-divine-comedy` (1308, which also says "completed"); cluster 342
   keeps `first-fleet-australia` (1788 arrival) over the 1787 departure framing.
2. **Title clarity for a general player**, ≤35 chars, no date give-away — dropped clunkers
   like "Lannathai Kingdom Unified Territory", "Mongol Invasion Japan First",
   "Battle of Manzikert Consequences".
3. **Description specificity** — kept the card that names the person, place, or work
   (`avicenna-medical-education` names the Canon; `machu-picchu-construction` names Pachacuti).
4. **Correct category file** — e.g. `al-razi-distinguishes-smallpox` (medicine) over the
   copy filed under exploration; `tulip-mania-crashes` (disasters) over the one under
   diplomatic/media; `jesse-owens-four-golds` (games-sport) over the cultural copy.
5. **Id matching the title**, as a tiebreak only.

Two consistency preferences applied across clusters: the Norse trio keeps the matched
`vikings-iceland` / `vikings-greenland` / `viking-america` naming, and events staged in
`candidates.json` always lost to an equivalent in a real category file.

## Follow-ups this review could not fix

The tool decides one cluster at a time, so it cannot merge near-duplicates that the
clustering split across two entries. These survive and want a manual look:

- **Compass** — cluster 162 keeps `compass-invention-china` (1040) and cluster 169 keeps
  `compass-navigation` (1088). Both are "Chinese magnetic compass for navigation".
- **Benin art** — cluster 238 keeps `benin-bronze-casting-peak` (1450), cluster 248 keeps
  `benin-art-renaissance` (1500). Very close in subject.
- **Paper money** — cluster 141 keeps `paper-money-china` (810, "Paper Money Introduced in
  China") and cluster 158 keeps `song-paper-money-system` (1024). The 1024 card was chosen
  partly _because_ the alternative claimed "World's First Paper Money", which contradicts
  the 810 card.
- **Leeuwenhoek** — cluster 307 keeps `first-microscope` (1674 observations) and cluster 309
  keeps `leeuwenhoek-bacteria` (1676). Note `first-microscope`'s id is misleading: he did not
  invent the microscope (cluster 271's `microscope-invented` covers that).
- **Anaesthesia** — cluster 385 keeps `first-anesthesia-surgery` (1842, Crawford Long) and
  cluster 390 keeps `anesthesia-invented` (1846, Morton). Defensible as two milestones, but
  tight.

Also cosmetic, not acted on: a few kept ids still embed their year
(`cuban-missile-crisis-1962`, `first-world-cup-1930`, `vietnam-war-escalates-1964` was dropped
for this reason where an alternative existed).

## Nothing has been deleted

Per the tool's own contract, this is a **record of decisions only** — no event JSON was
touched. Applying the list is a separate, deliberate step. Three ids in the export no longer
exist in `public/events/` at all (already removed at some point):
`nika-riots-constantinople-532-ce`, `first-modern-olympics-athens-1896`, `nascar-founded-1948`.

If the list is applied as-is, `public/events/` goes from **5,622 → 5,095** events
(527 of the 530 ids are present to delete).
