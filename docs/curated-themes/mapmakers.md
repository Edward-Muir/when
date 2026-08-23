# The Mapmakers theme

A 36-card curated theme about the picture of the world itself — the maps, charts,
projections and surveys that changed what people thought they were standing on, and the
instruments that made them possible. It runs from an Egyptian quarry map to Google Earth.

This note is why these 36 and not others: the scope rule, the footholds, and what was
deliberately left out.

## The scope rule

A card is in only if **it is a map, chart, projection or survey that changed what people
thought the world looked like** — plus the instruments and methods of position-finding, but
only where those exist in order to make maps (the compass at sea, the chronometer used for
longitude, triangulation, aerial and satellite survey, GPS).

Two exclusions do most of the work:

- **A voyage is not a map.** Columbus sailing, Magellan's fleet returning and Drake's
  circumnavigation are all in the catalogue and all rejected. The Waldseemüller sheet that
  put the name _America_ on the New World is in, because the map is the artefact that
  changed the picture. `cook-australia` is the one voyage-shaped card kept, and it is kept
  as a charting job — Cook surveyed and drew a coast that was blank before.
- **A border is not a map.** Treaties and wars that redrew who owned what — the partitions
  of Poland, the Congress of Vienna — are out, however much a keyword sweep insists.

Celestial mapping is out too, which is the sharpest edge of the rule: the theme is about the
earth's surface. That is why Ptolemy is here for the _Geographia_ and not the _Almagest_.

## The 36

Paste `eventNames` from the theme file into the workflow's `theme` input.

|  Year | Slug                               |          |     |
| ----: | ---------------------------------- | -------- | --- |
| -1150 | `turin-papyrus-map`                | foothold | NEW |
|  -600 | `babylonian-world-map`             | foothold | NEW |
|  -550 | `anaximander-world-map`            |          |     |
|  -240 | `eratosthenes-earth-circumference` | foothold |     |
|  -168 | `mawangdui-silk-maps`              |          | NEW |
|   150 | `ptolemy-geographia`               | foothold | NEW |
|   267 | `pei-xiu-map-principles`           |          | NEW |
|   350 | `peutinger-road-map`               |          | NEW |
|   560 | `madaba-mosaic-map`                |          | NEW |
|  1136 | `yu-ji-tu-grid-map`                |          | NEW |
|  1154 | `al-idrisi-geography-map`          |          |     |
|  1190 | `compass-adoption-navigation`      |          |     |
|  1275 | `portolan-chart-development`       |          |     |
|  1300 | `hereford-mappa-mundi`             |          | NEW |
|  1375 | `catalan-atlas`                    |          | NEW |
|  1402 | `kangnido-world-map`               |          | NEW |
|  1477 | `printed-ptolemy-maps`             |          | NEW |
|  1492 | `first-globe`                      |          |     |
|  1507 | `first-map-printing`               |          |     |
|  1569 | `mercator-projection-map`          |          |     |
|  1602 | `ricci-chinese-world-map`          |          | NEW |
|  1662 | `blaeu-atlas-maior`                |          | NEW |
|  1744 | `cassini-map-of-france`            |          | NEW |
|  1761 | `marine-chronometer`               |          |     |
|  1770 | `cook-australia`                   | foothold |     |
|  1791 | `ordnance-survey-founded`          |          | NEW |
|  1802 | `great-trigonometrical-survey`     |          | NEW |
|  1815 | `smith-geological-map`             |          |     |
|  1854 | `snow-cholera-map`                 |          | NEW |
|  1884 | `time-zone-development`            |          |     |
|  1915 | `aerial-survey-photography`        |          | NEW |
|  1933 | `transportation-map`               |          |     |
|  1957 | `tharp-ocean-floor-map`            |          | NEW |
|  1972 | `landsat-earth-imaging`            |          | NEW |
|  1995 | `gps-full-coverage`                | foothold | NEW |
|  2005 | `google-earth-launch`              | foothold | NEW |

23 of the 36 are new, which is the honest measure of how little of this subject the
catalogue held: a sweep for `map|cartograph|chart|atlas|globe|projection|survey|longitude|
compass|triangulat|geograph|GPS` returned 53 candidates, of which 13 survived hand-picking.
Everything between Ptolemy and the portolan charts, the whole of national survey, and the
entire satellite era had to be written.

Read the current band and spread figures from the catalogue rather than from here — a card's
band moves whenever the catalogue around its year does:

```bash
node scripts/theme-gap.js --slugs <the 36 above, comma-separated>
```

At authoring time, measured over playable + pending: size 36, bins 8/8, band 0 = 7,
same-year pairs 0, and no pair within 8 years.

## Why the footholds are the footholds

`MIN_BAND_ZERO` wants five cards in the catalogue's easiest global quartile, and band 0 is a
blend of the `difficulty` label with how sparse the catalogue is around that year. For this
theme that produces two quite different kinds of foothold, and both are needed.

- **Sparsity footholds.** `turin-papyrus-map`, `babylonian-world-map`,
  `eratosthenes-earth-circumference` and `ptolemy-geographia` are not cards a player would
  call easy — the Turin papyrus is frankly obscure. They are easy _to place_, because the
  catalogue is thin enough before 500 CE that a card labelled `hard` at 1150 BCE still scores
  into the easiest quartile. The theme's ancient end is therefore load-bearing, not decorative:
  strip the four ancient maps to "tighten" the deck and validation fails.
- **Recognition footholds.** `cook-australia`, `gps-full-coverage` and `google-earth-launch`
  are the three cards genuinely everyone knows, and they sit at the crowded modern end where
  only the label can earn band 0. They are the reason the deck does not open with five
  unplaceable medieval world maps.

The margin over `MIN_BAND_ZERO` is two cards, and the fragile ones are the two `medium`
ancient labels (`babylonian-world-map`, `ptolemy-geographia`) — those slip to band 1 if the
catalogue ever densifies around their years. If more headroom is needed the lever is another
globally-famous mapping card in an uncrowded stretch, not a relabelling: relabelling
`pei-xiu-map-principles` as `easy` would be a lie about recognition and the rubric grades
recognition only.

`gps-full-coverage` was written specifically as a foothold. The catalogue already has
`gps-system` (the first satellite launch), but it is graded `hard`, lands in band 3, and sits
six years from `landsat-earth-imaging` — a crowded pair with no compensating benefit.
Swapping it for the moment the constellation was completed keeps the GPS beat, kills the only
sub-8-year pair in the deck, and adds a seventh foothold.

## Deliberate omissions

Everything here surfaced in a sweep and was rejected on purpose.

- **Same-year and near-year collisions.** `first-atlas` (Ortelius, 1570) and
  `copperplate-engraved-printing` (1570) both sit one year from `mercator-projection-map`;
  the projection is the bigger change to the world picture, so the atlas beat is carried by
  `blaeu-atlas-maior` instead. `mariners-astrolabe` (1480) is three years from
  `printed-ptolemy-maps`; `nautical-table-creation` (1496) is four from `first-globe`.
  `cholera-london` (1854) collides with the Snow card written to replace it. The Cantino
  planisphere (1502) and the Piri Reis map (1513) were both wanted and both dropped: they
  are five and six years from `first-map-printing`. Humboldt's isotherm map (1817) is two
  years from `smith-geological-map`; the Longitude Act (1714) and Greenwich Observatory
  (1675) were cut for space rather than crowding, since `marine-chronometer` already carries
  the longitude problem to its solution.
- **Redundancy.** The catalogue holds four magnetic-compass cards —`compass-invented` (206),
  `compass-invention-china` (1040), `compass-navigation` (1088) and
  `compass-adoption-navigation` (1190). They are the same invention told four times. Only the
  last is kept, because European adoption is the one that produced the portolan chart, which
  is the next card. Likewise `sextant-invented`/`sextant-refinement` and
  `harrison-chronometer-series` (1735) against `marine-chronometer` (1761).
- **Out of scope by the celestial rule.** `star-chart`, `star-chart-compilation`,
  `hipparcus-astronomy`, `astrolabe-invented`, `astrolabe-navigation`,
  `polynesian-star-compass`, `ulugh-beg-observatory`. Hipparchus is the real loss here — the
  latitude/longitude grid is his idea, but the existing card is about his star catalogue and
  a near-twin at the same year would only crowd it. The grid enters the theme through
  `ptolemy-geographia`, which is where a player meets it anyway.
- **Existing cards rejected for a better-fitting new one.** `ptolemy-almagest` (150) is
  Ptolemy's astronomy, not his geography, so `ptolemy-geographia` was written alongside it.
  `cholera-london` (1854) describes the outbreak and the pump but never the map, which is
  the only reason the event belongs in this theme; `snow-cholera-map` was written to put the
  emphasis on the dot map. `gps-system` (1978), see above. Note that all three leave a
  near-duplicate pair in the catalogue at the same or near year — worth knowing before these
  events are merged, though the catalogue already carries many such pairs.
- **False positives the sweep dragged in.** `globe-theatre-built`, `drake-circumnavigation`,
  `harlem-globetrotters-founded`, `first-vendee-globe-1989`, `mapungubwe-gold-trade` and the
  Mapuche cluster (`mapuche-arauco-war`, `araucanians`, `mapuche-confederation-1610`),
  `first-jigsaw-puzzle` (dissected maps, genuinely), `human-genome-project`, `geodesic-dome`,
  `germanic-migration-period`, `domesday-book` — a survey of holdings for taxation, not of
  terrain, so it is out by the scope rule despite being the most famous "survey" in the
  catalogue.

## What is still missing from the catalogue

Real gaps, not filler, left unwritten because each collides with a card already in the 36 or
would push the deck past its clearable ceiling: the Cantino planisphere (1502) and the Piri
Reis map (1513); Ortelius' _Theatrum_ (1570) as the first true atlas; the founding of
Greenwich (1675) and the Longitude Act (1714); the Mason–Dixon line (1767); Humboldt's
isotherm map (1817); Maury's wind and current charts (1847); the Wallace line as a mapping
card rather than a biogeography one; the Challenger expedition's deep soundings (1872-76);
the International Map of the World proposal (1891); the Peters projection row (1973); SRTM's
radar sweep of the land surface (2000); and OpenStreetMap (2004). The last three are the
biggest hole: the theme's modern tail is imagery and positioning, and it has nothing on the
argument about _how_ a projection lies.
