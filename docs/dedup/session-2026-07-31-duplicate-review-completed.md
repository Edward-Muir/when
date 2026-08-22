# Duplicate review completed (`/admin/dedup`)

Finished the duplicate-cluster review started earlier on this branch. All **492 clusters**
in `public/dedup/clusters.json` now have a decision: **456 resolved** (one or more keepers
chosen, the rest of the cluster marked for deletion) and **36 passed** ("not a duplicate",
nothing deleted). The page reports `0 pending`.

Result: **526 event ids marked for deletion**, 537 kept across the clusters. The list has
since been applied — see "Applying the list" below.

## What was already done vs. what this session added

| Range                                | Decisions                | Source                                                                            |
| ------------------------------------ | ------------------------ | --------------------------------------------------------------------------------- |
| Clusters 1–138 (0-indexed 0–137)     | 104 resolved + 34 passed | Reviewed manually earlier; reconstructed from the exported delete-list of 115 ids |
| Clusters 139–492 (0-indexed 138–491) | 352 resolved + 2 passed  | This session                                                                      |

The earlier 115 ids are carried through unchanged — they all still appear in the final
export. Reconstruction is exact: for each of those clusters the keeper set is "every member
not in the exported delete-list", and no cluster had all its members deleted.

## Files

- `dedup-delete-list.json` — the page's own export (526 × `{name, file}`), downloaded from
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

### Correcting a collapse-to-one bias

The first pass over clusters 139–492 answered only "which of these is best?" and never
"are these actually the same event?" — every one of those 354 clusters was collapsed to a
single keeper, including all 46 with three or more members, and "keep all / not a dup" was
never used once. That is a systematic bias, not random error: a uniform collapse-to-one
policy always over-deletes where the clustering was loose.

Eight clusters were reopened on that basis. Four were genuinely too aggressive and were
changed:

| Cluster | now                                                                                                              | why                                                                                                                               |
| ------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 264     | **pass** — keeps `potosi-silver-floods-spain` + `spanish-price-revolution`, drops `silver-wealth-redistribution` | Potosí's output (1545) and the century-long price revolution (1550) are separate economic facts; the third entry paraphrases both |
| 268     | **pass** — keeps `russian-expansion-siberia` + `fur-trade-russian`                                               | A military conquest and the fur demand driving it are cause and event, in different category files (conflict / trade)             |
| 318     | **pass** — keeps `asante-golden-stool` + `asante-confederation`                                                  | A sacred object in Asante tradition (art) and the founding of the polity (empires) are different cards                            |
| 444     | keeps `indian-independence` + `partition-of-india-migration`, drops `partition-india`                            | Independence and the mass migration are distinct placeable events; `partition-india` paraphrases `indian-independence`            |

The other four were re-examined and the single-keeper decision stands, because the losing
entry is a paraphrase rather than a distinct event:

- **140 Wari** — both are dated 800 and both describe the road network; "Wari Empire Peak"
  already says "first Andean state to build an extensive road and administrative system".
- **310 Vienna** — `ottoman-decline-begins` is dated to 1683 and its description is entirely
  about the failed siege, so it restates `battle-vienna` as a trend.
- **319 Seed drill** — `agricultural-revolution` describes Tull's seed drill, same year and
  same person, and dating the Agricultural Revolution to 1701 is shaky on its own terms.
- **413 Berlin Conference** — `scramble-africa-begins`' description opens "The Berlin
  Conference formalized…", i.e. the same event retitled.

(Cluster numbers here are the 1-based ones shown in the page's UI.)

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

## Applying the list

The review itself only records decisions. The list was then applied with
`node scripts/apply-dedup-deletions.js` (`--dry-run` supported), which follows the same
convention as the event-editor's `deprecateEvent()`: each removed event is appended to
`public/events/deprecated.json` with `_originalCategory` and `_deprecatedAt`, so nothing is
hard-deleted and the removal is reversible.

- Events served via `manifest.json`: **5,618 → 5,095** (523 removed).
- `deprecated.json`: 6 → 529 entries.
- Three ids in the export were not in any category file (already removed at some point):
  `nika-riots-constantinople-532-ce`, `first-modern-olympics-athens-1896`,
  `nascar-founded-1948`. That is why 526 decisions produce 523 removals.

No id turned out to live in more than one category file (523 records for 523 ids).

### Achievement links that had to be repointed

`src/data/achievements.ts` resolves each badge's card art from a stable event `name`, and
eight badges pointed at events on the delete-list — five of them from the earlier review
pass, so this breakage predates the clusters reviewed in this session. Each was repointed to
the keeper from its own cluster:

| Badge                    | was                           | now                             |
| ------------------------ | ----------------------------- | ------------------------------- |
| `04` Centurion           | `colosseum-completed`         | `colosseum-rome`                |
| `cat-science` Empiricist | `periodic-table`              | `mendeleev-periodic-table`      |
| `19` On a Roll           | `blitzkrieg-tactics-deployed` | `wwii-start`                    |
| `22` Juggernaut          | `napoleon-emperor`            | `napoleon-coronation`           |
| `coll-500` Archivist     | `library-alexandria`          | `first-public-library`          |
| `era-bce` Antiquarian    | `code-hammurabi`              | `code-hammurabi-interest-rules` |
| `05` Bricklayer          | `great-wall-begins`           | `fired-bricks`                  |
| `cat-sports` Champion    | `first-ancient-olympics`      | `first-world-cup-1930`          |

The last two needed a judgement call rather than the cluster keeper. `great-wall-begins`'
keeper is `great-wall-china`, which badge 17 "Across the Ages" already used, so Bricklayer
took `fired-bricks` instead (on-theme, and keeps every badge's art unique).
`first-ancient-olympics`' keeper `first-olympics` sits in `cultural.json` with category
`media` and was already used by badge 02, so the Sports collection badge took
`first-world-cup-1930` — a real `sports`-category event, which is what that badge's art
should be.

All 60 `eventName` references now resolve to a surviving event, with no duplicates.

### Verification

`npm run typecheck` clean, `npm run lint` clean (one pre-existing `max-lines` warning in
`statsStorage.test.ts`), `npm test` 132/132 passing. Smoke-tested in the browser: home,
`/achievements` (60 badges render), and `/daily` all boot against the reduced dataset.

---

## Re-landed on `main`, 2026-08-22

The work above merged as PR #26 — **into `dev`, not `main`** — and sat there. `main` moved 49
commits past the common ancestor without ever losing a duplicate, so this was re-applied on top
of current `main` rather than rebased.

**Why not a rebase.** `dev` is a 2026-07-31 snapshot of the entire event corpus (and of
`package.json`, at version 1.5.0 against `main`'s 1.15.1). `git merge-tree` conflicts in 22 files
including every event JSON, and dev's side would revert the difficulty regrade (#33), the sports
re-land (#40), the Indonesian events (#49) and the date-clue removal (#50). The deletion is data,
not code — the delete-list was re-applied to current `main` with the same script.

**The list survived the drift intact.** Re-verified against `main` before applying: 522 of the 526
ids still present, **0 had moved to a different category file**, 0 appeared in more than one file.
197 of the doomed events had been edited since the review, but 192 of those changed only
`difficulty` (the #33 regrade, which hit keepers equally).

Counts this time: served events **5,629 → 5,107** (522 removed), `deprecated.json` 9 → 531.
Four ids were absent from every category file rather than three — the extra is
`windmills-grind-grain`, deprecated on `main` by other work since.

### Two keeper decisions reversed

Six doomed events had `year`, `description`, `friendly_name` or `category` rewritten on `main`
after the review, so their keeper was chosen on text that no longer exists. Re-judged against the
current copy, by the same criteria as above:

| cluster   | was kept                   | now kept                           | why                                                                                                                                                               |
| --------- | -------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| windmills | `windmill-european` (1180) | **`windmill-introduction`** (1185) | Year accuracy. `main` rewrote the loser to cite the earliest _certain_ European windmill, the Weedley post mill of 1185; 1180 was the vaguer claim.               |
| Galen     | `galen-medical-advances`   | **`galen-medical-dominance`**      | Title clarity. "Galen Systematizes Anatomy" beats "Galen Medical Advances Compiled"; the description also gained the specifics (emperors' physician, dissection). |

The other four stand. `noh-theater-emergence` keeps it on title clarity — "Noh Theater Emerges"
reads faster for a general player than "Noh Wins the Shogun's Favor", and the descriptions carry
the same facts. `ulugh-beg-observatory` keeps the more specific description (40-metre sextant,
1,000+ stars). `hypatia-alexandria` and `first-ancient-olympics` were unaffected — the edits there
were date-clue strips that did not change which card is better, and `first-ancient-olympics` is one
of the ids already absent from every file.

### The Indonesia curated theme pinned a deleted slug

`borobudur-temple` (825) is in the published `indonesia` theme's 36, and its cluster keeps
`borobudur-construction` (800). `curatedPool()` in `dailyPool.ts` filters `allEvents` by name, so
an unresolvable slug is **dropped silently** — the theme would have run as 35 cards with no error
anywhere. `docs/curated-themes/indonesia-theme.md` now lists `borobudur-construction`.

The calendar itself lives in Redis, not the repo, so **the theme must be re-published** with the
corrected list for any of its dates that have not yet opened. As of this change `indonesia` is not
yet in the published calendar at all, so the doc edit is the whole fix — it is what gets pasted
into the publish Action.

The one theme that _is_ published, `english-history`, pins `church-of-england`, which this change
also removes in favour of `english-reformation-henry` (same year 1534, same event, fuller
description). Its only date is 2026-08-20, already past, and **a past date must never be
rewritten** — `dailyRecency.ts` replays the last 28 days. Nothing is republished; the consequence
is that the 28-day replay builds that day from 31 slugs instead of 32, which is inert. If
`english-history` is ever scheduled again, its list wants `english-reformation-henry`. That slug
list lives only in Redis and on `claude/english-history-curated-theme-pdp1b7` — there is no
`english-history` doc to correct.

### Not carried over

The `/admin/dedup` review UI, `public/dedup/clusters.json` and `scripts/build-dedup-clusters.js`
stay on `dev`. Only the applier, the decision record and the deletion came to `main`.

### Owed

**339 events have been added to `main` since the review and have never been clustered** — the
Indonesian set, the sports re-land, and assorted additions. A fresh `/admin/dedup` pass on `dev`
against the current corpus is the next thing this needs. The five near-duplicate pairs listed above
(compass, Benin art, paper money, Leeuwenhoek, anaesthesia) are still unmerged.
