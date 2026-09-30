# Region tags

**Status (2026-09-30):** the tagging system is built. The taxonomy, validator, report, apply and
audit scripts, the tagger agent and skill, and the corpus test are all in place. 61 gold-set
events are tagged. The sweep of the other ~5,800 and the player-facing filter are next. Rules
for choosing tags: [tagging-spec.md](tagging-spec.md).

## Why this exists

Players asked to play only European, German or Chinese history. Events carried no geography at
all, only prose. Two things made that harder than adding a field:

- Many events span several places or the whole world.
- Countries come and go, so "Germany" means nothing for a Bronze Age artefact.

## The decisions, and why

**Tag by today's map, never by historical states.** A tag names a present-day country, so no tag
ever depends on when a state existed, and taggers agree. Historical states come in through one
mechanical rule, their seat at the time (Byzantium is Turkey, Macedon is Greece), which is
deterministic where "which successor state owns this?" is not. A historical-sphere layer
("Roman", "Islamic world") was considered and left out. It would duplicate what curated themes
already do, and nobody could tag it consistently.

**Tags are readable names, not codes.** "United States", never "US". The maintainer asked for this
directly: the tags should be understandable in the JSON, in the maps and in review. It costs
nothing where compactness matters, because the challenge code will store a bit index, not the
string.

**One array holds both countries and regions.** `regions: ["Italy", "Middle East & North
Africa"]`. The taxonomy tells them apart; no naming convention does. A country rolls up to its
region, so a region is written only when no country says it. The apply script drops a redundant
region automatically, so the stored form is canonical and two batches that agree produce the same
bytes.

**Place, plus at most two principal actors.** Place alone missed what players mean by "Spanish
history", such as Columbus's landfall in the Bahamas. Listing every participant turns every war
into every country. Two actors is the compromise; past that, the actors' region is tagged.

**Global does not exclude other tags.** Making it exclusive fails on the obvious cases. World War
II would vanish from a Europe game. COVID, the Great Depression and the Chicxulub impact each
have a real place where they began. So Global is combined with focal places, and appears alone
only where no place is honest (geology, the atmosphere). The risk runs the other way: Global used
to mean "important". The spec bans that, the apply script prints every Global-only entry with its
mandatory note, and a reviewer reads every one. There is deliberately no share threshold: an
early 3% warning was dropped (2026-09-30) because a chunk of 60 trips it at two entries and a
geology-heavy chunk legitimately exceeds it. The note is judged, not counted.

**Eleven macro-regions, from UN M49 but adjusted to read the way a player expects:**

- Egypt, Sudan and Iran are in Middle East & North Africa. M49 splits Egypt from the Levant and
  puts Iran in South Asia.
- The Caribbean and Central America are in North America, the continental definition. That puts
  Columbus in "American" history.
- North & Central Asia gives Siberia and the Central Asian states somewhere to go. The name is
  after UN ESCAP.

Russia, Turkey and the three Caucasus states span two regions and do not roll up on their own:
the tagger must name the side, so a Siberian event never lands in Europe. Antarctica rolls up to
nothing and always needs an actor. Eleven regions including Global fit the 12-bit challenge-code
word.

**Countries are tagged now, though the first filter shows only regions.** The maintainer chose
region chips for the first release. Tagging at country level anyway means a later country picker
("German history") needs no second sweep of 5,800 cards.

**Inline, not a sidecar.** Deck building needs every event's tags at load. That is unlike the
detail prose, which is needed one card at a time. Measured with worst-case random tags, it adds
about 45 KB gzipped to the 562 KB catalogue. Real tags repeat more and should cost less.

**One taxonomy file.** `src/data/regions.json` is imported by the app (`src/utils/regions.ts`) and
required by the scripts (`scripts/events/region-spec.js`). CRA cannot import from outside `src/`,
so it lives there. The corpus test checks that the app's `eventRegionSet` and the scripts'
`regionSetOf` agree on every tagged event.

## The pipeline

Same map-then-apply pattern as the year-range and detail sweeps: agents write maps, and one
deterministic pass writes the catalogue.

1. `node scripts/events/region-report.js --chunks` shows progress per shard and events per region,
   and writes chunks of 60 to `untracked_data/event-regions/worklist/`. Each chunk carries the
   card text **and its detail paragraphs**, which name the places; it never carries
   `wikipedia_url`.
2. `event-region-tagger` agents (Sonnet, medium effort, `tag-event-regions` skill preloaded) write
   `untracked_data/event-regions/batch-NNN.json` as `slug -> { regions, note? }`.
3. `node scripts/events/region-audit.js batch-NNN.json` lists cards whose own name or description
   names a place the tags miss. It is advisory; `--detail` also scans the prose (noisier).
4. `node scripts/events/region-apply.js --dry-run`, then without the flag. It validates everything
   before writing anything and refuses the whole run on one bad entry. It drift-checks every other
   field, lists re-tags, prints Global-only notes and a per-batch summary, and runs the audit.
5. `src/utils/eventRegions.test.ts` holds the corpus to the same validator. `REQUIRE_REGIONS`
   flips to `true` when the sweep is done, so an untagged event then fails the build.

Re-tagging is allowed: an entry for an already-tagged slug replaces its tags, and the run lists
the change.

## The filter

Built 2026-09-30 as designed here:

- **State.** `selectedRegions` on `GameConfig` and `CustomSettings` (`src/utils/playerStorage.ts`).
  Stored settings without it mean all regions.
- **Filtering.** `filterByRegion` in `src/utils/eventLoader.ts`, applied last by `filterPool`,
  which is the one filter chain shared by `composeDeck`, the Custom tab's Play count and
  validity check (`useCustomGameSettings`) and the Timeline tab, so they cannot drift. All
  regions selected means no filtering. Otherwise keep events whose `eventRegionSet` intersects
  the selection, where Global matches Global-tagged events.
- **UI.** A "Regions" chip group in `FilterControls.tsx`, with the same double-tap and empty-group
  behaviour as Categories and Eras. **No explanatory copy**: the maintainer ruled out "by today's
  borders"-style text. `FilterPopup` reuses `FilterControls`, so the Timeline panel gets it too.
  The existing `isPlayValid`/`deckCount` already block a pool that is too small.
- **Challenge codes.** All 72 bits were taken, so an optional 7th 12-bit word holds the regions
  in `ALL_REGIONS` order, written only when they are narrowed. A 6-word code (every link already
  shared) decodes as all regions. See [../sharing-challenges/](../sharing-challenges/index.md).
- **Unaffected.** The daily and curated themes. Region tags do make a "Chinese history week" theme
  trivial to assemble later.

## Known, not chased

- Taxonomy gaps show up as rejections ("not in src/data/regions.json"). Add a territory only when
  a real event needs it, and add it with its rollup.
- The audit's alias table (`scripts/events/region-aliases.js`) is deliberately short. Extend it
  when a real miss slips past, not speculatively.
