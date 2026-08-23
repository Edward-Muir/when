# The Eureka Moments theme

A 36-card curated theme of the moments discoveries _landed_ — Archimedes in the bath,
Newton under the apple tree, Kekulé's snake, Fleming's ruined dish, the hiss Penzias and
Wilson could not get out of the antenna. It runs from Pythagoras to LIGO. This note is why
these 36 and not others.

## The scope rule

**A card is in only if there is an identifiable moment of realisation.** The story of the
insight, not the field it belongs to.

That rule is the whole theme, because "scientific discoveries" is a _category_ — the daily
already has one, `science`, and a curated day that is just a hand-picked subset of it earns
nothing. So three things are out on principle:

- **Programmes with no moment.** A decade of breeding peas, a star catalogue, a treatise. If
  the work is the discovery, there is no eureka in it.
- **Incremental inventions.** A barometer, a generator, a telescope: built, refined, patented.
  The exception is an invention whose _origin_ is an accident — gunpowder came out of a search
  for an elixir of immortality, and that is a moment.
- **Missions and expeditions.** The Beagle voyage, a dig season, a spacecraft arriving.

Applying it costs real cards: Mendel, Tycho's observatory, Hipparchus' star catalogue,
Torricelli's barometer and Darwin's _Origin_ are all in the catalogue, all obviously
"scientific", and all out. See the omissions below.

## The 36

Paste `eventNames` from `eureka.theme.json` into the workflow's `theme` input.

|    Year | Slug                               |          |     |
| ------: | ---------------------------------- | -------- | --- |
| 530 BCE | `pythagoras-theorem`               | foothold |     |
| 250 BCE | `archimedes-principle`             | foothold |     |
| 240 BCE | `eratosthenes-earth-circumference` | foothold |     |
| 129 BCE | `hipparchus-precession`            |          | NEW |
|     120 | `zhang-heng-lunar-eclipse`         |          | NEW |
|     850 | `gunpowder-invented`               | foothold |     |
|     984 | `ibn-sahl-refraction`              |          | NEW |
|    1011 | `al-haytham-optics`                |          |     |
|    1030 | `al-biruni-geography-astronomy`    |          |     |
|    1088 | `shen-kuo-explains-fossils`        |          |     |
|    1269 | `peregrinus-magnetic-poles`        |          | NEW |
|    1543 | `copernican-revolution`            | foothold |     |
|    1572 | `tycho-new-star`                   |          |     |
|    1610 | `galileo-jupiter-moons`            |          |     |
|    1628 | `harvey-blood-circulation`         |          |     |
|    1666 | `newton-gravity`                   | foothold |     |
|    1676 | `leeuwenhoek-bacteria`             |          |     |
|    1752 | `franklin-kite-experiment`         | foothold |     |
|    1788 | `hutton-deep-time`                 |          |     |
|    1796 | `jenner-vaccination-smallpox`      | foothold |     |
|    1820 | `electromagnetism-discovered`      |          |     |
|    1831 | `electric-generator`               | foothold |     |
|    1843 | `hamilton-quaternions`             |          | NEW |
|    1854 | `cholera-london`                   |          |     |
|    1865 | `kekule-benzene-ring`              |          | NEW |
|    1887 | `michelson-morley-experiment`      |          | NEW |
|    1895 | `x-rays-discovered`                | foothold |     |
|    1911 | `atomic-nucleus`                   |          |     |
|    1928 | `penicillin-discovered`            | foothold |     |
|    1938 | `nuclear-fission`                  |          |     |
|    1953 | `dna-structure`                    | foothold |     |
|    1965 | `cosmic-microwave-background`      |          |     |
|    1980 | `asteroid-killed-dinosaurs`        | foothold |     |
|    1994 | `fermat-last-theorem-proved`       |          |     |
|    2004 | `graphene-isolated`                |          | NEW |
|    2015 | `gravitational-waves`              | foothold |     |

Eight cards are new (`NEW`); `tycho-new-star` and `fermat-last-theorem-proved` already existed
but were written for earlier themes and are **still unillustrated**, so ten of the 36 need art
before this theme can be published. Read the current figures from the catalogue rather than
from here:

```bash
node scripts/theme-gap.js --slugs <the 36 above> --include-pending --extra <staging>/eureka.json
```

At authoring time that read: size 36, bins 8/8 `[3 4 4 6 6 5 4 4]`, band 0 = 14, same-year
pairs 0, and **no pair inside eight years** — the smallest gap in the deck is exactly 8
(1788→1796, 1887→1895).

## The footholds are free here, and the spread was the hard part

This theme is the mirror image of [indonesia-theme.md](indonesia-theme.md). There, band 0 was
the binding constraint and had to be manufactured. Here it is over-satisfied almost by
accident: 14 of the 36 sit in band 0 against a floor of 5, because the deck is made of the
discoveries famous enough to _have_ an anecdote, and "has a story everyone knows" is close to
what the `easy` recognition label measures. Archimedes, Copernicus, Newton, Franklin, Jenner,
Röntgen, Fleming, DNA, the dinosaur asteroid and LIGO are all globally taught, and most sit in
uncrowded stretches of the timeline as well.

The constraint that actually bit was **spread**. Eureka stories cluster brutally in
1600-1950 — that is where the catalogue is dense and where the anecdotes were recorded — and a
deck assembled from the obvious candidates lands 6/8 bins with the two oldest empty. The four
pre-1500 bins were filled deliberately, and half of that is authored:

- **Bin 0** (pre-210 BCE) is Greek and existed already: Pythagoras, Archimedes' bath,
  Eratosthenes' shadow at Syene.
- **Bin 1** (210 BCE-1000) had one usable card, the gunpowder accident. `hipparchus-precession`
  and `zhang-heng-lunar-eclipse` and `ibn-sahl-refraction` were written for it.
- **Bin 2** (1000-1440) is the Islamic golden age plus Song China — al-Haytham on light
  entering the eye, al-Biruni's radius of the Earth, Shen Kuo reading inland seashells as an
  ancient shoreline — with `peregrinus-magnetic-poles` authored to reach the late medieval end.
- **Bin 7** (post-1972) needed `graphene-isolated` to bridge Fermat's proof and LIGO; the more
  obvious modern candidates all fell inside eight years of a card already in.

## Deliberate omissions

Every one of these is in the catalogue and was left out on purpose.

**Out on the scope rule.** `mendel-genetics` (1866) and `inheritance-mendel` — eight years of
breeding peas, no moment; `tycho-brahe-astronomical-observations` / `tycho-brahe-observatory`
(1576) — Uraniborg is a facility, and Tycho's _moment_ is the new star of four years earlier,
which is the card in the deck; `hipparcus-astronomy` (140 BCE) — "cataloged over 800 stars"
is a survey, so `hipparchus-precession` was authored to carry the realisation that came out of
comparing that catalogue with older records; `torricelli-barometer` (1643) and
`telescope-invented` (1608) — instruments; `darwin-beagle` (1831) — a voyage;
`origin-of-species` (1859) — the publication of twenty years of work, where the moment is
Darwin reading Malthus, which the catalogue does not have; `kerala-school-mathematics` (1400) —
a school across generations; `cern-lhc` (2008), `hubble-launch` (1990) — machines, not
discoveries. `aristarchus-heliocentric` (270 BCE) is the closest call: a proposal rather than a
realisation, and heliocentrism's landing is already carried by Copernicus.

**Near-year crowding — a genuine eureka dropped only because a card already occupies its
stretch.** These are the painful ones:

- `radioactivity-discovered` (1896, Becquerel's fogged plates) and `radium-discovered` (1898)
  sit 1 and 3 years from Röntgen's screen; `max-plancks-quantum-theory` (1900) is 5 away.
- `hooke-discovers-cells` (1665) is one year from Newton's apple, and
  `kepler-planetary-laws` (1609) one year from Galileo's moons.
- `mendeleev-periodic-table` (1869, the other great dream-revelation) is 4 years from Kekulé's
  snake. Two dream cards were never going to survive together anyway.
- `semmelweis-childbed-fever` (1847) falls between Hamilton's bridge and Snow's pump;
  `synthetic-dye-mauveine` (1856, Perkin's accident) and `wallace-evolution-theory` (1858) are
  2 and 4 years from the pump.
- `continental-drift` / `wegener-continental-drift` (1912) is one year from Rutherford's
  nucleus; `insulin-discovered` (1921) and `hubble-galaxies` (1924, the "VAR!" plate) are 7 and
  4 years from Fleming; `expanding-universe` (1929) and `neutron-discovered` (1932) likewise;
  `teflon-discovered` (1938) collides outright with fission.
- `first-ozone-hole-discovered` (1985), `terracotta-warriors-discovered` (1974) and
  `dark-energy-discovered` (1998) each land within 5 years of Alvarez or Wiles;
  `poincare-conjecture-proved` (2003) is one year from graphene, and a second proof-of-a-famous-
  conjecture card besides; `higgs-boson` and `crispr-gene-editing` (both 2012) are 3 years from
  LIGO and share a year with each other.

**Redundancy.** The catalogue holds near-twins of several cards here — `x-ray-discovery`,
`periodic-table`, `magnetism-electromagnetism`, `kepler-laws-motion`, `archimedes-buoyancy`
(deprecated), `ozone-hole-discovered` (deprecated). One of each pair was picked on band and
art, not on merit.

**Rejected in favour of a card already chosen.** `al-biruni-geography-astronomy` reads
half-programme in its title, and an `al-biruni-earth-radius` card would have been a better fit
— but its description already names the radius measurement, and authoring a near-twin at the
same year for the sake of a title is a worse catalogue than a slightly loose card.
`electric-generator` (1831) is likewise an invention title over what is really Faraday's
induction moment; it stays because splitting it would duplicate an existing event.

## Still missing from the catalogue

Real gaps, not filler, all of them blocked by the eight-year spacing rather than by doubt:

- **Rømer's finite speed of light** (1676) — same year as Leeuwenhoek's animalcules.
- **Ørsted's compass needle** is in as `electromagnetism-discovered`, but
  **Champollion's "je tiens l'affaire!"** (1822) is not: two years from it.
- **Galvani's twitching frog** (1780) and **Herschel's "this is no star"** (1781) both fall
  inside eight years of Hutton at Siccar Point.
- **Meitner and Frisch's walk in the snow** is folded into `nuclear-fission`, which credits
  Hahn and Strassmann; the explanation, which is the actual eureka, has no card.
- **Jocelyn Bell's LGM-1 pulsar** (1967) — two years from the Penzias-Wilson hiss.
- **Shechtman's quasicrystals** (1982), **Mullis' PCR on Highway 128** (1983), **Marshall
  drinking _H. pylori_** (1984) and **Bednorz and Müller's high-Tc** (1986) are a four-year
  pile-up right behind the Alvarez iridium layer. Any of them would make a better recent deck
  than graphene if Alvarez were ever dropped.
- Nothing at all between **1000 and 500 BCE**, which is where the brief's era range starts.
  Babylonian and Egyptian astronomy has realisations but the catalogue records them as
  programmes, and inventing a "moment" for them would be fiction.
