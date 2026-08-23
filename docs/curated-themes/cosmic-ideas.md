# The Cosmic Ideas theme

A 36-card curated theme on one question asked over and over: **what is the universe, and
where are we in it?** From Thales' eclipse to the first gravitational wave — geocentrism and
heliocentrism, the size and age of the cosmos, what stars are made of, galaxies as island
universes, expansion, the hot beginning, dark matter, dark energy, black holes, inflation.

## The scope rule

An event is in **only if it is an idea about what the universe IS**. That rule does most of
the work, because a naive "space" sweep returns mostly hardware and journeys.

- **In**: claims and the observations that settled them — Earth floats unsupported; the
  heavens change; the Earth moves; stars are suns; nebulae are other galaxies; the redshift
  means expansion; the cosmos began hot; most of its mass is unseen; its expansion is
  accelerating.
- **Out**: **missions, launches, telescopes and instruments.** Hubble's _law_ is in, the
  Hubble _telescope_ is out; so are Apollo, Sputnik, Voyager, the astrolabe, the Antikythera
  mechanism, Ulugh Beg's sextant and the invention of the telescope itself. A discovery made
  _with_ an instrument is in when the card is about the claim, not the kit.
- **Out**: astrology and calendar-making — the Maya calendar cards, the omen literature, the
  star charts compiled for navigation and prayer times. They are about telling time and
  telling fortunes, not about what is out there.
- **Out**: births and deaths. The catalogue has nine of them across these figures
  (`birth-copernicus`, `birth-galileo`, `birth-kepler`, `birth-newton`, `birth-tycho-brahe`,
  `birth-ptolemy`, `birth-albert-einstein`, `birth-stephen-hawking`, `birth-carl-sagan`).
  A biography is not an idea.

Era target was roughly 1000 BCE to today; the deck lands 585 BCE to 2015.

## The 36

Paste as `eventNames` into the workflow's `theme` input. `foothold` marks band 0; `NEW` marks
an event authored for this theme and not previously in the catalogue.

| Year | Slug                               |               |
| ---: | ---------------------------------- | ------------- |
| -585 | `thales-eclipse`                   | foothold      |
| -560 | `anaximander-earth-in-space`       | NEW           |
| -350 | `aristotle-celestial-spheres`      | foothold, NEW |
| -270 | `aristarchus-heliocentric`         | foothold      |
| -240 | `eratosthenes-earth-circumference` | foothold      |
| -140 | `hipparcus-astronomy`              |               |
|  150 | `ptolemy-almagest`                 | foothold      |
|  499 | `aryabhata-astronomy`              |               |
|  900 | `al-battani-solar-year`            | NEW           |
| 1028 | `ibn-al-haytham-doubts-ptolemy`    | NEW           |
| 1261 | `tusi-couple-planetary-model`      | NEW           |
| 1350 | `ibn-al-shatir-lunar-model`        | NEW           |
| 1440 | `cusa-infinite-universe`           | NEW           |
| 1543 | `copernican-revolution`            | foothold      |
| 1572 | `tycho-new-star`                   | NEW           |
| 1600 | `giordano-bruno-burned`            |               |
| 1609 | `kepler-planetary-laws`            |               |
| 1633 | `galileos-trial`                   | foothold      |
| 1687 | `newton-principia`                 |               |
| 1755 | `kant-island-universes`            | NEW           |
| 1785 | `herschel-milky-way-shape`         | NEW           |
| 1823 | `olbers-dark-night-sky`            | NEW           |
| 1838 | `bessel-stellar-parallax`          | NEW           |
| 1859 | `kirchhoff-stellar-composition`    | NEW           |
| 1915 | `general-relativity`               | foothold      |
| 1924 | `hubble-galaxies`                  |               |
| 1929 | `expanding-universe`               |               |
| 1937 | `zwicky-dark-matter`               | NEW           |
| 1946 | `gamow-hot-big-bang`               | NEW           |
| 1957 | `stellar-nucleosynthesis-b2fh`     | NEW           |
| 1965 | `cosmic-microwave-background`      |               |
| 1974 | `hawking-radiation`                | NEW           |
| 1980 | `cosmic-inflation-theory`          | NEW           |
| 1992 | `first-exoplanet`                  |               |
| 1998 | `dark-energy-discovered`           | NEW           |
| 2015 | `gravitational-waves`              | foothold      |

19 of the 36 are new. Read the current band and spread figures from the catalogue rather than
from here — a card's band moves whenever the catalogue around its year does:

```bash
node scripts/theme-gap.js --slugs <the 36 above, comma-separated>
```

At authoring time, with the 19 new events supplied via `--extra` and `--include-pending`:
size 36, bins 8/8, band 0 = 9, same-year pairs 0.

## Why the footholds are the footholds

`MIN_BAND_ZERO` wants five cards in the catalogue's easiest global quartile, where "easiest"
blends the `difficulty` label with how _sparse_ the timeline is around the year. This theme is
unusual among curated themes in having margin — nine — and the reason is worth recording,
because it is not "these are the famous ones".

- **The ancient half is nearly all foothold.** Five of the nine sit before 150 CE
  (`thales-eclipse`, `aristotle-celestial-spheres`, `aristarchus-heliocentric`,
  `eratosthenes-earth-circumference`, `ptolemy-almagest`). Greek natural philosophy is
  school-syllabus material _and_ the catalogue is thin either side of it, so these score easy
  twice over. A deck of ideas gets this for free where a regional deck does not.
- **The three that carry the middle** are `copernican-revolution` (1543) and `galileos-trial`
  (1633) — the two moments in this story that everyone already knows — and
  `general-relativity` (1915). Without them the deck's whole 1440-1900 stretch is expert
  material: al-Tusi, Ibn al-Shatir, Cusa, Olbers and Bessel are all band 3.
- **`gravitational-waves` (2015) is the only modern foothold**, and it is here on sparsity as
  much as fame: the catalogue's 2010s are crowded with missions, and this is the one card in
  that decade that is squarely a cosmic idea.

The margin means a foothold can be traded if the catalogue shifts — but note that
`thales-eclipse` is the only card before 560 BCE and the only opener the deck has. Dropping it
costs the theme its first placement, not just a band-0 slot.

## Deliberate omissions

**Near-year crowding.** `galileo-jupiter-moons` (1610) sits **one year** from
`kepler-planetary-laws` (1609) — unplaceable — so Galileo is represented by `galileos-trial`
(1633), which is also the better scope fit: the trial is the collision of two cosmologies.
`quasars-discovered` (1963) is two years from `cosmic-microwave-background` (1965).
`al-biruni-geography-astronomy` (1030) is two years from the new al-Haytham card, and is
mostly geography anyway. `spectroscopy-prism` (1666) shares its year with `newton-gravity`.
`herschel-discovers-uranus` (1781) is four years from the new Milky Way card, and finding a
planet is not a claim about the cosmos.

**Redundancy.** `newton-gravity` (1666) against `newton-principia` (1687) — the Principia is
where universal gravitation is actually stated, and dropping the 1666 card also clears the
prism collision. `anaximander-world-map` (-550) is a map of the known _world_, ten years from
the new card about his cosmology, and the wrong idea entirely.
`tycho-brahe-astronomical-observations` (1576) is about the precision of Uraniborg, not about
what the sky is; the new `tycho-new-star` (1572) is the idea — the heavens are not immutable —
and the two cannot coexist four years apart.

**Rejected as out of scope**, though a keyword sweep drags them in: every mission and vehicle
(`sputnik-launched`, `moon-landing`, `apollo-11-launch`, `apollo-17-last-moon-mission`,
`luna-9-launched`, `voyager-leaves-solar-system`, `international-space-station`,
`hubble-launch`, `parker-solar-probe`, `ingenuity-mars-flight`, `india-mars-mission`,
`change-4-landing`, `china-moon-samples`, `japan-launches-ohsumi`, `laika-in-space`,
`golf-played-on-the-moon-1971`); every instrument (`telescope-invention`,
`antikythera-mechanism`, `astrolabe-invented`, `astrolabe-navigation`, `jacobs-staff`,
`armillary-sphere-korean`, `ulugh-beg-observatory`, `samarkand-ulugh-beg-madrasah`,
`gnomon-shadow-clock`, `sundial-invented`, `star-chart`, `star-chart-compilation`); and the
calendar/almanac tradition (`mayan-astronomy`, `maya-astronomical-calendar`,
`mayan-astronomical-calculations`, `varahamihira-bhatasiddhanla`). `black-hole-image` (2019)
falls to both rules at once — it is an instrument result, and it is four years from
`gravitational-waves`.

**Considered and dropped for space**, not on scope: `halley-comet-orbital` (1705), the
Newtonian cosmos verified; `macrobius-astronomy` (430), which carried a spherical Earth and a
planetary order into the Latin West; `special-relativity` (1905), which is about motion,
light and spacetime rather than about the cosmos, and whose Einstein beat
`general-relativity` already carries.

**False positives** the sweeps returned: `black-hole-of-calcutta` (a prison, 1756),
`eclipse-retires-unbeaten-1770` (a racehorse), `weimar-hyperinflation` ("inflation"),
`pax-romana` and `birth-sun-tzu` (`\bsun\b`), `dogon-settlement`, `escapement-mechanism`,
`protractor`, `first-bees`.

**Three advisory near-pairs were kept**, because every alternative was a canonical beat and
there was no spare: `hubble-galaxies` (1924) / `expanding-universe` (1929) — the two halves of
the same revolution, five years apart; `hawking-radiation` (1974) / `cosmic-inflation-theory`
(1980); `first-exoplanet` (1992) / `dark-energy-discovered` (1998). None is a same-year pair,
so none is a coin flip; they are merely hard.

## What is still missing from the catalogue

Real gaps, not filler — most were skipped because they collide with a card already in the 36,
and the collision year is given where that is the reason:

- **Antiquity**: the Pythagorean spherical Earth (~-500) and Philolaus' central fire (~-450),
  the first cosmos with the Earth in motion.
- **Medieval and Renaissance**: Nicole Oresme's argument that Earth's rotation cannot be
  disproved (1377); Thomas Digges' infinite stellar universe (1576, four years from Tycho's
  new star); Bruno's own _On the Infinite Universe and Worlds_ (1584) as distinct from his
  execution; Descartes' vortices (1644).
- **Enlightenment and 19th century**: Thomas Wright's shape of the Milky Way (1750, five years
  from Kant); John Michell's dark stars (1783, two years from Herschel), the first black hole;
  Laplace's nebular hypothesis (1796); Henrietta Leavitt's period-luminosity law (1912, three
  years from general relativity), the rung the whole distance ladder stands on.
- **20th century**: the Shapley-Curtis debate (1920, four years from Hubble's galaxies);
  Friedmann's expanding solutions (1922); Lemaître's primeval atom (1931, two years from
  Hubble's law) — the Big Bang's own founding card, which is why `gamow-hot-big-bang` (1946)
  carries that beat here; the Chandrasekhar limit (1931); Bethe on why stars shine (1939, two
  years from Zwicky); the steady-state universe (1948, two years from Gamow); the
  Penrose-Hawking singularity theorem (1965, the same year as the CMB); Vera Rubin's rotation
  curves (1970, five years from the CMB), which is where dark matter became consensus rather
  than a curiosity.
- **Modern**: the COBE anisotropy map (1992, the same year as the first exoplanet); 51 Pegasi
  b, the first planet around a Sun-like star (1995); the orbits around Sagittarius A\* (2002).

Lemaître and Rubin are the two that most deserve writing. Neither can join this deck without
displacing a card, but both would strengthen a wider version of it.
