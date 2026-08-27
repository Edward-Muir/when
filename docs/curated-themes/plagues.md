# The Plague Years theme

A 36-card curated theme running from the Plague of Athens to COVID-19 — the epidemics
themselves and the handful of moments that ended or blunted them.

## The scope rule

An event is in only if it is **a named disease outbreak, or a decisive step in defeating
one**. That is narrower than "medicine" and it is what keeps the deck coherent:

- **In:** epidemics and pandemics by name (Athens, Antonine, Justinian, Black Death, the
  sweating sickness, Marseille, the cholera pandemics, Spanish flu, AIDS, SARS, Ebola,
  COVID); and the vaccines, identifications, drugs and public-health acts that are tied to a
  specific disease — variolation, Jenner, Snow's pump, Koch's bacillus, Yersin's bacillus,
  penicillin, streptomycin, Salk, antiretrovirals.
- **Out:** general medical advances with no outbreak attached — anaesthesia, X-rays,
  antiseptic surgery, the flush toilet, the founding of the WHO. Also out: famines
  (the Irish potato famine), mass poisonings, and the metaphorical "plagues" (the Dancing
  Plague of Strasbourg).

Two admissions sit at the edge of the rule and are deliberate. `pasteur-germ-theory` was
**rejected** as too general, but `koch-tuberculosis-bacterium` is in because it names the
organism behind a specific killer. `leprosy-hospitals-spread` is in because the leprosaria
were an isolation response to a live European epidemic, not a hospital-building programme.

## The 36

Paste as `eventNames` into the workflow's `theme` input.

|    Year | Slug                             |          |
| ------: | -------------------------------- | -------- |
| 430 BCE | `plague-of-athens`               | foothold |
|     165 | `antonine-plague`                | foothold |
|     249 | `plague-of-cyprian`              |          |
|     541 | `plague-of-justinian`            | foothold |
|     627 | `justinian-plague-recurrence`    |          |
|     735 | `japan-smallpox-epidemic`        | NEW      |
|     910 | `al-razi-distinguishes-smallpox` |          |
|    1150 | `leprosy-hospitals-spread`       |          |
|    1347 | `black-death-arrives`            | foothold |
|    1377 | `ragusa-quarantine`              |          |
|    1485 | `sweating-sickness`              |          |
|    1520 | `population-collapse-americas`   | foothold |
|    1549 | `variolation-china`              | NEW      |
|    1629 | `italian-plague`                 |          |
|    1665 | `great-plague-london`            |          |
|    1720 | `marseille-plague`               | NEW      |
|    1771 | `moscow-plague-riot`             | NEW      |
|    1796 | `jenner-vaccination-smallpox`    | foothold |
|    1817 | `first-cholera-pandemic`         | NEW      |
|    1848 | `public-health`                  |          |
|    1854 | `cholera-london`                 |          |
|    1865 | `london-main-drainage`           | NEW      |
|    1882 | `koch-tuberculosis-bacterium`    |          |
|    1894 | `yersin-plague-bacillus`         | NEW      |
|    1911 | `manchurian-plague`              | NEW      |
|    1918 | `spanish-flu-begins`             | foothold |
|    1928 | `penicillin-discovered`          | foothold |
|    1943 | `streptomycin-cures-tb`          |          |
|    1955 | `polio-vaccine`                  | foothold |
|    1968 | `hong-kong-flu`                  |          |
|    1977 | `last-natural-smallpox-case`     |          |
|    1981 | `aids-epidemic-recognized`       | foothold |
|    1996 | `haart-aids-treatment`           | NEW      |
|    2003 | `sars-outbreak`                  |          |
|    2014 | `ebola-outbreak`                 |          |
|    2020 | `covid-19-pandemic`              | foothold |

Nine of these do not exist in the catalogue yet and are staged separately; the theme cannot
be published until they are illustrated, because `loadAllEvents` hides an event with no
Cloudinary art. Read the current figures from the catalogue rather than from here:

```bash
node scripts/theme-gap.js --slugs <the 36 above, comma-separated> \
  --include-pending --extra <staging>/plagues.json
```

At time of writing: size 36, bins 8/8 `[1 6 3 5 6 5 4 6]`, band 0 = 11, same-year pairs 0.

## Why the footholds are the footholds

Unusually for a curated theme, band 0 was never in danger — 11 of 36, against a
`MIN_BAND_ZERO` of 5. Epidemics are the one historical subject where the globally famous
cards and the well-spaced cards are the same cards, because a pandemic large enough to be
remembered is by definition rare, and rarity is exactly what band 0 rewards: the label is
blended with how sparse the timeline is around the year.

The footholds fall into three groups, and it is worth knowing which is which before any of
them is traded away:

- **Sparse-era anchors.** `plague-of-athens` (430 BCE), `antonine-plague` (165) and
  `plague-of-justinian` (541) are band 0 far more for their neighbourhoods than for their
  fame. They carry the whole first third of the deck; the two ancient bins hold 1 and 6
  cards, so losing one of these is the only realistic way to fail the spread gate.
- **School-curriculum cards in crowded years.** `black-death-arrives`,
  `population-collapse-americas`, `jenner-vaccination-smallpox`, `spanish-flu-begins`,
  `penicillin-discovered`, `polio-vaccine` and `covid-19-pandemic` are band 0 on recognition
  alone, against a dense timeline. These are the replaceable ones.
- **`aids-epidemic-recognized`** is the odd one out: famous _and_ in a stretch the deck
  otherwise leaves thin (1968-2003 holds four cards).

Because the margin is six cards rather than Indonesia's one or two, this theme has room to
lose a foothold. The gate to watch here is **size**, not band 0 — the deck is at the 36-card
ceiling, so every addition below must displace something.

## Deliberate omissions

The keyword sweep returned 71 playable candidates. Most were cut, and these are the cuts
worth recording.

**Same-year and one-year collisions.**

- `mrna-vaccines` (2020) shares its year with `covid-19-pandemic`. COVID's arrival is the
  card the theme is about; the vaccine is the one that had to go.
- `smallpox-eradicated` (1980) sits one year from `aids-epidemic-recognized` (1981). This is
  the hardest cut in the deck — smallpox eradication is the theme's single greatest
  triumph — so it is carried instead by `last-natural-smallpox-case` (1977), which is the
  same story four years earlier and buys a placeable gap. The 1977/1981 pair is still the
  tightest in the deck and is documented rather than fixed: both beats are unavoidable.
- `smallpox-variolation-europe` (1721, Lady Mary Montagu) sits one year from the new
  `marseille-plague` (1720). Marseille wins: the scope rule leads with named outbreaks, and
  Marseille is the last great plague epidemic of western Europe. The inoculation beat is not
  lost — it moves to the new `variolation-china` (1549), which is where the practice actually
  came from, and `jenner-vaccination-smallpox` (1796) still closes the arc.
- `first-hepatitis-b-vaccine` (1981) and `first-malaria-vaccine-rollout` (2021) each collide
  with a card the theme cannot do without.

**Near-year crowding.**

- `russian-flu` (1889) is a genuine named pandemic, cut only because it sat 7 years from
  `koch-tuberculosis-bacterium` and 5 from the new `yersin-plague-bacillus`. The 1880s-90s
  are the densest stretch of plague history and something had to give.
- `third-plague-pandemic` (1855) is one year from `cholera-london` (1854). The same pandemic
  is represented by `yersin-plague-bacillus` (1894), its decisive moment.
- `yellow-fever-philadelphia` (1793) is 3 years from Jenner. `semmelweis-childbed-fever`
  (1847) is 1 year from `public-health` (1848). `dancing-plague` (1518) is 2 years from
  `population-collapse-americas` and out of scope besides. `cinchona-bark-malaria` (1632) is
  3 years from `italian-plague`. `first-rabies-vaccine` (1885) is 3 years from Koch — and
  rabies is not an outbreak disease. `zika-outbreak` (2015) is 1 year from Ebola.
  `asian-flu` (1957) is 2 years from `polio-vaccine`; `hong-kong-flu` (1968) is the flu
  pandemic that survived the cut because it is the one with room around it.
  `swine-flu-pandemic` (2009) sits 6 years from SARS and 5 from Ebola, in the deck's most
  crowded modern stretch.
- The 1346-1353 Black Death cluster is eight cards deep — `mongol-black-death-spread`
  (Siege of Caffa, 1346), `flagellant-movement` and `black-death-demographic` (both 1348),
  `jewish-scapegoating-plague` and `black-death-peak` (both 1349), `black-death-labor-shortage`
  (1350), `statute-of-laborers` (1351), `boccaccio-decameron` (1353). Two of those years are
  same-year pairs on their own. `black-death-arrives` (1347) is the one card that is both the
  canonical beat and a band-0 foothold; everything else in the cluster is a consequence of it.

**Redundancy.**

- `germ-theory` (1880) against `pasteur-germ-theory` (1861) — near-duplicates. Both were cut
  in the end on the scope rule, but the pair is noted because a future editor will find them.
- `al-razi-physician` (900) against `al-razi-distinguishes-smallpox` (910): the second is the
  disease-specific one.
- `aids-quilt` (1987) and `azt-approved-aids` (1987) are the same year as each other and both
  weaker than `aids-epidemic-recognized` plus the new `haart-aids-treatment`.
- `penicillin-mass-produced` (1942) against `penicillin-discovered` (1928); discovery is the
  card everyone knows and 1942 is 1 year from `streptomycin-cures-tb` (1943).
- `iron-lung-developed` (1928) shares its year with `penicillin-discovered`.

**Out of scope, though the sweep found them.** `plumbing-clay-pipes`,
`dry-latrines-toilets`, `public-sewage-sanitation`, `first-sewer-system` (Cloaca Maxima) and
`flush-toilet` are sanitation history with no outbreak attached — note that
`london-main-drainage` **is** in, because it was built to stop cholera and did.
`who-founded` (1948) is an institution, not a step against a named disease.
`irish-potato-famine` is a famine. `birth-nightingale`, `birth-louis-pasteur`,
`birth-alexander-fleming`, `death-pericles`, `birth-boccaccio` and `birth-elizabeth-taylor`
are biography. `antiseptic-surgery`, `lister-spray-operating-theatre`,
`surgery-antiseptic-system`, `ehrlich-magic-bullet`, `hpv-vaccine-approved`,
`first-typhoid-vaccine`, `bcg-tuberculosis-vaccine` and `diphtheria-antitoxin-developed`
(1894, which would also have collided with Yersin) are medicine without an epidemic.
`sumptuary-laws-fashion` and `statute-of-laborers` are Black Death aftershocks in law and
dress. `rinderpest-eradicated` (2011) is a cattle disease — a real eradication, but not a
human plague, and it would have crowded Ebola.

**Existing slugs rejected in favour of a new card.** Two, both listed above:
`smallpox-variolation-europe` (1721) displaced by `marseille-plague` (1720) plus
`variolation-china` (1549), and `third-plague-pandemic` (1855) displaced by
`yersin-plague-bacillus` (1894).

## What is still missing from the catalogue

Authoring stopped at the 36-card ceiling, not at the end of the spine. These beats were on
the spine, have no event, and were not written because there is nowhere to put them:

- **Eyam's self-quarantine** (1666) — one year from `great-plague-london`.
- **The Boston inoculation trial**, Boylston and Mather (1721) — the same year as the
  European variolation card and one from Marseille.
- **Ronald Ross proves mosquitoes carry malaria** (1897) and **Walter Reed proves the same
  for yellow fever** (1900) — both land inside the 1889-1911 crush.
- **Typhoid Mary's detention** (1907) — 4 years from the new Manchurian plague card.
- **The measles vaccine** (1963) — would sit 5 years from `hong-kong-flu` and 8 from
  `polio-vaccine`.
- **A Bronze Age plague** — the Hittite plague of Mursili II, or the Philistine outbreak in
  1 Samuel, around 1300-1000 BCE. This is the one real gap that is _not_ a crowding problem:
  the deck's earliest card is 430 BCE and bin 0 holds a single event. If the theme is ever
  widened past 36, or if a card is dropped, this is the first thing to write.
- **The Plague of Cyprian's Persian sequel**, the **cocoliztli epidemics** of New Spain
  (1545, 1576), and the **Great Plague of Vienna** (1679) are all genuine named outbreaks
  with no catalogue entry; each collides with something already in the deck.
