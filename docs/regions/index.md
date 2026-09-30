# Region tags

**Status (2026-09-30):** done. Every one of the 5,874 events is tagged, `REQUIRE_REGIONS` is on,
and the Custom-page filter is built. Rules for choosing tags: [tagging-spec.md](tagging-spec.md).
How the sweep ran, and what it turned up: [the sweep](#the-sweep-2026-09-30).

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

## The sweep (2026-09-30)

5,813 events in 106 chunks of up to 60, run as one workflow: a Sonnet `event-region-tagger` per
chunk, then a Sonnet checker that ran completeness, `region-apply.js --dry-run` and the audit,
cold-read five entries against the spec, and judged every Global-only note. A batch the checker
failed went back to a tagger with the findings, at most twice. A two-chunk pilot came first.

- **Outcome.** All 104 fan-out batches passed: 85 first time, 17 after one fix round, 2 after two.
  About 250 agents, about 70 minutes, almost no web searches: the detail prose names the places.
- **Distribution.** Europe 3,078, North America 1,319, Middle East & North Africa 698, East Asia
  535, South Asia 268, Sub-Saharan Africa 264, Southeast Asia 154, South America 134, Oceania 118,
  Global 118, North & Central Asia 105. Europe-heavy, as the catalogue is; an East Asia game has a
  535-card pool.
- **Global alone is on 72 cards (1.2%)**: geology, eon and period boundaries, climate,
  evolutionary milestones, and prehistoric practices with no traceable origin, plus Y2K, Bitcoin
  and the first leap second. Every note was read. One was overturned on a source (the compound
  air compressor is William Mann's 1829 London patent, so United Kingdom).
- **Evolutionary milestones are Global, not their fossil site.** The spec used to say "tag where
  the defining evidence was found", and taggers applied it to "First Fish" (China), "First
  Mammals" (United Kingdom) and "Cambrian Explosion" (Canada, China). Review made it worse by
  moving First Jawed Fish and First Land Animals off Global onto their find sites. The maintainer
  overruled that: a milestone happened to life on Earth, and the oldest fossil is only where the
  evidence surfaced. 27 milestones and 5 period boundaries that still carried a type-section site
  were re-tagged Global alone. Named species and human evolution keep their places.
- **The 3% Global-only warning was dropped** before the fan-out. See the Global decision above.
- **The pilot settled rules the spec had left open**, now in [tagging-spec.md](tagging-spec.md):
  stateless peoples and culture adjectives are not actors, "war begins" cards, colonial powers in
  protest events, written works, card-versus-prose origin disagreements, sport winners, and more
  extinct-state seats.
- **The gate caught a canonicalisation bug.** `canonicalRegions` dropped any region a country
  implied, including one that was a transcontinental country's required side
  (`[Syria, Turkey, Middle East & North Africa]` lost its region, leaving Turkey sideless). It
  passed the apply script's input validation and failed the corpus test on the stored form, on
  106 cards. Fixed at the source; the region is now kept whenever a transcontinental tag needs it.
- **The audit's residue is mostly demonyms**: "British", "Greek", "Mongol", "Spanish" in text about
  consequences, colonisers acted against, or cultures. Read at the end, it surfaced five real
  misses, all sport winners or a diffusion origin, fixed before applying.
- **Taxonomy gaps reported, not added**: Cook Islands, Niue, Wallis and Futuna, South Georgia, the
  Isle of Man. Each card was covered by its sovereign or its region, which is the rule.
- **Catalogue errors** the taggers reported went through triage into
  [the backlog](../events-images/catalogue-error-backlog.md#raised-by-the-region-sweep-2026-09-30).

## Known, not chased

- Taxonomy gaps show up as rejections ("not in src/data/regions.json"). Add a territory only when
  a real event needs it, and add it with its rollup.
- The audit's alias table (`scripts/events/region-aliases.js`) is deliberately short. Extend it
  when a real miss slips past, not speculatively.
