# Region tags

Every event carries `regions`, `REQUIRE_REGIONS` is on, and Custom filters by Regions and
Countries. Rules for choosing tags: [tagging-spec.md](tagging-spec.md). What tagging the whole
catalogue settled: [lessons](#lessons-the-tagging-settled).

## Why this exists

Players want to play only European, German or Chinese history, which needs geography on every
event rather than in its prose. Two things make that harder than adding a field:

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
nothing where compactness matters, because the challenge code stores a bit index, not the
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
only where no place is honest (geology, the atmosphere). The risk runs the other way: Global
read as "important". The spec bans that, the apply script prints every Global-only entry
with its mandatory note, and a reviewer reads every one. There is deliberately no share
threshold: a 3% warning trips at two entries in a chunk of 60, and a geology-heavy chunk
legitimately exceeds it. The note is judged, not counted.

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

**Countries are tagged, not just regions**, so the country picker ("German history") needs
nothing beyond the tags; see [The country picker](#the-country-picker).

**Inline, not a sidecar.** Deck building needs every event's tags at load. That is unlike the
detail prose, which is needed one card at a time. The cost is small: worst-case random tags
measured about 45 KB gzipped, and real tags repeat more.

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
   is on, so an untagged event fails the build.

Re-tagging is allowed: an entry for an already-tagged slug replaces its tags, and the run lists
the change.

## The filter

- **State.** `selectedRegions` on `GameConfig` and `CustomSettings` (`src/utils/playerStorage.ts`).
  Stored settings without it mean all regions.
- **Filtering.** `filterByRegion` in `src/utils/eventLoader.ts`, applied last by `filterPool`,
  which is the one filter chain shared by `composeDeck`, the Custom tab's Play count and
  validity check (`useCustomGameSettings`) and the Timeline tab, so they cannot drift. All
  regions selected means no filtering. Otherwise keep events whose `eventRegionSet` intersects
  the selection, where Global matches Global-tagged events.
- **UI.** A "Regions" chip group in `FilterControls.tsx`, with the same Select all / Clear header,
  double-tap and empty-group behaviour as Categories and Eras. Its Select all also clears every
  country exclusion, and its count is of whole (ticked) regions, so a partial region keeps it
  off `All`. **No explanatory copy**: no "by today's borders"-style text
  (the maintainer's call). `FilterPopup` reuses `FilterControls`, so the Timeline panel gets it too.
  `isPlayValid`/`deckCount` block a pool that is too small.
- **Challenge codes.** The 6 base words have no spare bits, so an optional 7th 12-bit word holds
  the regions in `ALL_REGIONS` order, written only when they are narrowed. A 6-word code decodes
  as all regions. See [../sharing-challenges/](../sharing-challenges/index.md).
- **The daily's** seeded menu draws regions, countries and category + place pairings as themes,
  each gated on 30+ cards and 8+ in the easiest difficulty band. See
  [the dated menu](../curated-themes/index.md#seeded-themes-the-dated-menu). It matches
  its place with `eventInPlace`, not this filter, so picker changes can never move a daily's
  pool. Curated themes are unaffected, though region tags make a "Chinese history week" theme
  trivial to assemble.

## The country picker

189 tagged countries are too many for one chip group. The Regions group ends in a single
**Countries** row (`CountryRefine.tsx`) summarising what is on, which opens a popup
(`CountryPickerModal.tsx`) with a search box and every region's countries grouped by region.
The card never grows; the popup's Done button carries the live event count, since it hides the
Play button.

**Exclusion, not inclusion.** In every other group a selected chip means in the deck, so the
picker works the same way. An inclusion-only picker reads wrong: picking United Kingdom with every
region on deals the UK plus every other region whole.

- **Every country starts on, and a tick means in the deck** (a red cross means out). The state is the selected regions plus
  the **(region, country) pairs switched off** within them (`src/utils/countrySelection.ts`,
  keys like `Europe|United Kingdom`). Nothing off is the default, so the stored and shared form
  of "everything" is empty.
- **A region chip has three states**: off (white, red cross), whole (ticked, `.bg-pill-on`), and partial
  (a dash on the lighter `.bg-pill-partial`, `aria-pressed="mixed"`) when some of its countries
  are off: the tri-state checkbox's tick and dash, on the shared `FilterPill`. Tapping works like a tri-state checkbox: off → whole, whole → off, partial → whole.
  Deselecting a region switches all its countries off; selecting it switches them all back on.
- **Country chips tap like every other filter pill** (`usePillTap`, shared with
  `FilterControls`), with each region its own group. A tap toggles; a double-tap leaves only that
  country on in its region, and a double-tap on a region's only country restores the whole
  region. Other regions are never touched. Double-tap keys carry the region, so Turkey's two
  sides never pair up.
- **Regions never vanish.** Switching off a region's last listed country turns the region off,
  but the region stays listed in the popup, in its place, with its chips white: the maintainer
  found a region vanishing mid-tap annoying, so **the popup lists every region, selected or not,
  in a fixed order**. Tapping a chip in a region that is off selects that region with only that
  country on, which is the quick way to "only the UK". Each region header is the other groups'
  `FilterGroupHeader`, so the picker matches the Custom page: an `All` or `n/N` count, then
  **Select all** and **Clear** for that region. They act on the countries the group lists: the
  whole region, "+N more" included, or only the matches while searching, so Clear never switches
  off a country out of sight. Both go through `setRegionCountries`, so clearing a region turns
  it off and it stays listed, white. The footer's **Select all** turns every chip it shows back
  on: every listed region selected, nothing off. Double-tapping a region chip in the Regions
  group still isolates or restores, and restoring every region also clears every exclusion, so
  "all" means all.
- **The filter** (`filterByRegion`): an event stays when some region it resolves to is selected
  and either that region is whole, or the event carries a country of that region whose pair is on.
  An event tagged only with the region ("Europe") is dealt while the region is whole and drops out
  once any of its countries is off: it belongs to none of them.
- **Pairs, not names, because of the transcontinental five.** Russia, Turkey, Georgia, Armenia and
  Azerbaijan are listed under both sides, and each side is its own chip and switch. Keyed by name,
  switching Russia off to narrow Europe would also cut Russia, and every event tagged only "North &
  Central Asia", out of a whole North & Central Asia, and would break converting pick-format
  share codes.
- **Picks convert to exclusions** (`legacyPicksToExclusions`), for stored settings in the pick
  shape and for share codes in the pick format. A picked country's regions exclude their other
  countries; unpicked regions stay whole. Only selected regions deal anything, so a
  transcontinental pick reaches only its selected sides (Russia under Europe deals no Siberian
  Russia).
- **Summary row.** `All`; the countries still on when every region with countries is partial
  (named up to three: "United Kingdom"); otherwise the countries off ("All but France", or
  "N countries off").
- **Search narrows every region's list**, matching the start of any word (`matchCountries`). Regions
  alphabetical with Global last (display only; `ALL_REGIONS` is the share code's bit order);
  countries most-tagged first (not alphabetical: big countries first is the maintainer's
  preference), 8 per region before "+N more". The cut is fixed and a tap never changes which
  chips are shown: keeping every on country visible in a partial region would blow a whole
  Europe open to all 52 the moment one country goes off.
- **Offered countries come from the pool.** `countryOptionsByRegion` lists only countries present.
  The Custom tab offers the whole catalogue; the Timeline popup offers only countries in the
  player's collection, and its picker stacks above the filter popup (`layer="reveal"`). Global
  and Antarctica have no group.
- **State.** `excludedCountries` on `GameConfig` and `CustomSettings`, missing meaning none; a
  stored `selectedCountries` (the pick shape) is converted on read. The Timeline tab keeps
  its own, unpersisted, like its regions.
- **Share codes** carry pairs in words 8 onward, each narrowed region in whichever of include or
  exclude form is shorter. See
  [../sharing-challenges/](../sharing-challenges/index.md#words-8-onward-countries).

## Lessons the tagging settled

Every live event is tagged, and `REQUIRE_REGIONS` is on. These rules came out of tagging the
whole catalogue and review of it; the tagging rules themselves are in
[tagging-spec.md](tagging-spec.md).

- **Global alone is rare and always judged**: geology, eon and period boundaries, climate,
  evolutionary milestones, and prehistoric practices with no traceable origin, plus a few modern
  footprints such as Y2K, Bitcoin and the leap second. Every Global-only note is read, and an
  invention with a traceable patent or origin takes that place, not Global.
- **Evolutionary milestones are Global, not their fossil site.** A milestone happened to life on
  Earth; the oldest fossil is only where the evidence surfaced. Taggers and reviewers both drift
  toward the find site ("First Fish" in China, "First Mammals" in the United Kingdom), so watch
  for it. Period boundaries are Global alone too, not their type-section site. Named species and
  human evolution keep their places.
- **The catalogue is Europe-heavy**, and so are the tags; smaller regions have pools in the low
  hundreds.
- **`canonicalRegions` keeps a region a transcontinental tag needs.** It drops a region any
  country implies, except a transcontinental country's required side, so
  `[Syria, Turkey, Middle East & North Africa]` keeps its region and Turkey keeps its side. The
  apply script's input validation does not catch a sideless transcontinental tag; the corpus test
  on the stored form does.
- **The audit's residue is mostly demonyms**: "British", "Greek", "Mongol", "Spanish" in text about
  consequences, colonisers acted against, or cultures. Read it at the end anyway: the real misses
  it surfaces are sport winners and diffusion origins.
- **Taxonomy gaps are reported, not added**: Cook Islands, Niue, Wallis and Futuna, South Georgia,
  the Isle of Man. Each card is covered by its sovereign or its region, which is the rule.
- **Catalogue errors** a tagger spots go to
  [the backlog](../events-images/catalogue-error-backlog.md); a card whose text changes there has
  its tags re-checked.

## Known, not chased

- Taxonomy gaps show up as rejections ("not in src/data/regions.json"). Add a territory only when
  a real event needs it, and add it with its rollup.
- The audit's alias table (`scripts/events/region-aliases.js`) is deliberately short. Extend it
  when a real miss slips past, not speculatively.
