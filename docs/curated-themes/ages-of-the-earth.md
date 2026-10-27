# The Ages of the Earth theme

A 30-card curated theme on the geological time scale itself, from the Archean to the Holocene.
Each card is the start of an eon, era, period or epoch, dated to its base on the ICS
International Chronostratigraphic Chart (2024/12). This note explains why these 30 and not
others.

## The scope rule

An event is in only if **it is the start of an eon, era, period or epoch of Earth's history.**

- **One card per boundary.** Several units share a base: the Cambrian also opens the Paleozoic
  and the Phanerozoic, the Triassic opens the Mesozoic, the Paleocene opens the Paleogene and
  the Cenozoic, the Miocene opens the Neogene, the Pleistocene opens the Quaternary. Each shared
  boundary gets one card, named for its best-known unit.
- **The card names the unit; the description shows the world then.** No description gives a
  number of years.

Three neighbours own the edges:

- **Before Us** owns the life within the time scale (first animals, first plants on land, the
  mass extinctions). The deck shares four cards with it: `snowball-earth-cryogenian`,
  `jurassic-period-begins`, `eocene-epoch-begins` and `oligocene-epoch-begins`, unit starts both
  themes need.
- **Dinosaurs** and **Age of Mammals** own the animals of the Mesozoic and Cenozoic; their
  epochs appear here only as boundaries.

## The 30

|        Year | Slug                               |                |
| ----------: | ---------------------------------- | -------------- |
| -4031000000 | `archean-eon-begins`               |                |
| -3600000000 | `paleoarchean-era-begins`          | NEW            |
| -3200000000 | `mesoarchean-era-begins`           | NEW            |
| -2500000000 | `proterozoic-eon-begins`           |                |
| -2300000000 | `rhyacian-period-begins`           | NEW            |
| -1600000000 | `mesoproterozoic-era-begins`       | NEW            |
| -1000000000 | `neoproterozoic-era-begins`        | NEW            |
|  -720000000 | `snowball-earth-cryogenian`        |                |
|  -635000000 | `ediacaran-period-begins`          |                |
|  -538800000 | `cambrian-period-opens`            | foothold · NEW |
|  -486850000 | `ordovician-period-begins`         |                |
|  -443800000 | `silurian-period-begins`           |                |
|  -419200000 | `devonian-period-begins`           |                |
|  -382300000 | `late-devonian-epoch-begins`       | NEW            |
|  -358900000 | `carboniferous-period-begins`      | foothold       |
|  -323400000 | `pennsylvanian-epoch-begins`       | NEW            |
|  -298900000 | `permian-period-begins`            | foothold       |
|  -251902000 | `triassic-period-begins`           | foothold       |
|  -237000000 | `late-triassic-epoch-begins`       | NEW            |
|  -201400000 | `jurassic-period-begins`           | foothold       |
|  -161500000 | `late-jurassic-epoch-begins`       | NEW            |
|  -143100000 | `cretaceous-period-begins`         | foothold       |
|  -100500000 | `late-cretaceous-epoch-begins`     | NEW            |
|   -66000000 | `paleocene-epoch-begins`           |                |
|   -56000000 | `eocene-epoch-begins`              |                |
|   -33900000 | `oligocene-epoch-begins`           |                |
|   -23030000 | `miocene-epoch-begins`             |                |
|    -5333000 | `pliocene-epoch-begins`            |                |
|    -2580000 | `pleistocene-epoch-ice-age-begins` | foothold       |
|      -11700 | `holocene-epoch-begins`            | foothold       |

11 of the 30 are new. The catalogue already held most of the period and Cenozoic epoch starts;
it lacked the Precambrian eras and the "Late" epochs inside the Phanerozoic periods.

Gates: size **30**, band 0 **19**, same-year pairs **0**, bunching within the limit, largest
overlap **4** (before-us). Every card falls in one prehistory bin, which is expected for this
theme and only advisory. Bands move as the catalogue changes, so re-measure rather than trust
these figures:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending
```

## The edges argued

- **No Hadean.** The spine's first beat, the Hadean at -4.6 billion years, falls below the
  catalogue's -4.5 billion floor (`loadEligibleEvents` in `scripts/themes/catalogue.js`), so
  it cannot resolve. The deck opens with the Archean.
- **The time scale has only about 31 distinct boundaries at eon to Cenozoic-epoch rank**, so
  the spine added eight epoch starts inside the Phanerozoic periods (Furongian, Late Devonian,
  Pennsylvanian, Lopingian, Late Triassic, Middle Jurassic, Late Jurassic, Late Cretaceous).
- **Cut for fame.** The least-known fame-1 units were cut to reach 30: the Neoarchean,
  Orosirian, Statherian, Ectasian and Stenian, the Furongian, the Lopingian and the Middle
  Jurassic.
- **A new Cambrian card.** `cambrian-period-begins` is retired in `deprecated.json`, so the
  Cambrian card is a new slug, `cambrian-period-opens`.
- **Reused cards keep their years.** Six reused cards (Archean, Silurian, Devonian,
  Carboniferous, Triassic, Holocene) carry a year that differs from the spine's by rounding or
  chart edition; each existing card and year stand.

## Fact-check points settled at authoring

- **Late Devonian** moved from -382.7M to -382.3M, and the **Pennsylvanian** from -323.2M to
  -323.4M, to the ICS 2024/12 chart. The other nine new boundaries match the chart.
- Every new card is a point, not a window: the chart's ± is an error bar on one boundary, the
  same call as `jurassic-period-begins`.

## Open fact-check points

- None unsupported. Worth a look at review: `holocene-epoch-begins` is stored at -11700, the
  "years before 2000" figure used straight as a year; the spine wrote it as -9700 (BCE). The
  deck keeps the existing card's year.
