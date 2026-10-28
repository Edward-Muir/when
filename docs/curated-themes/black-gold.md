# The Black Gold theme

A 30-card curated theme on oil and gas, from the bamboo boreholes of Sichuan to the day a barrel
of crude cost less than nothing. It covers the wells, the pipelines and tankers that moved the
oil, the companies and cartels that controlled it, and the shocks that came when supply or price
broke. This note explains why these 30 and not others.

## The scope rule

An event is in only if **it is a milestone in oil or gas**: a strike, a field, a new way of
drilling or moving it, a company or cartel that controlled it, or a price shock or political
crisis that was about the oil itself.

Three neighbouring themes own the edges:

- **Let There Be Light** takes lamp oil and gas lighting. The 1807 Pall Mall gas lamps were on
  the spine and were cut for this reason.
- **When It Went Wrong** takes industrial blasts and most disasters. Piper Alpha (1988) never
  reached the spine. The Torrey Canyon (1967) and Santa Barbara (1969) spills were cut, because
  each is a disaster first and an oil milestone second, and the 1960s and 70s are the deck's
  most crowded stretch. Exxon Valdez and Deepwater Horizon stay as the theme's two spills. Each
  changed how oil is regulated, and they are among the most recognisable oil cards there are.
- **Strike It Rich** takes gold and diamond rushes. An oil boom is in, and a gold rush is not.

Two edges were argued rather than assumed:

- **`kuwait-oil-fires`** is in, although it is an act of war. The card is about the wells,
  and the fires were the largest oil-field emergency in history. `gulf-war` and
  `iraq-invades-kuwait` stay out, because they are about the war.
- **`teapot-dome-oil-leases`** is in as a political scandal whose subject was the oil: navy
  reserves leased to private oilmen. The card is dated to the 1922 leases rather than the
  1923-24 investigation.

## The 30

| Year | Slug                                       |                |
| ---: | ------------------------------------------ | -------------- |
|  347 | `oil-wells-borehole-drilling`              | foothold       |
| 1821 | `fredonia-natural-gas-well`                | NEW            |
| 1846 | `baku-first-mechanical-oil-well`           | NEW            |
| 1859 | `drake-well-titusville`                    | foothold · NEW |
| 1865 | `first-oil-pipeline-pithole`               | NEW            |
| 1870 | `standard-oil-founded`                     | foothold       |
| 1886 | `gluckauf-first-modern-tanker`             | NEW            |
| 1901 | `spindletop-gusher`                        | NEW            |
| 1908 | `persia-oil-discovery-masjed-soleiman`     | NEW            |
| 1911 | `standard-oil-breakup`                     | foothold · NEW |
| 1922 | `teapot-dome-oil-leases`                   | NEW            |
| 1927 | `baba-gurgur-gusher-iraq`                  | NEW            |
| 1930 | `east-texas-oil-field-discovery`           | foothold · NEW |
| 1932 | `bahrain-first-gulf-oil-strike`            | NEW            |
| 1938 | `oil-discovery-saudi`                      | foothold       |
| 1947 | `first-offshore-well-out-of-sight-of-land` | NEW            |
| 1951 | `iran-nationalizes-oil-industry`           | NEW            |
| 1959 | `groningen-gas-field-discovery`            | NEW            |
| 1960 | `opec-founded`                             |                |
| 1973 | `opec-embargo`                             |                |
| 1977 | `trans-alaska-pipeline-first-oil`          | NEW            |
| 1979 | `iranian-revolution-oil-shock`             | foothold · NEW |
| 1986 | `oil-price-collapse-glut`                  | NEW            |
| 1989 | `exxon-valdez`                             |                |
| 1991 | `kuwait-oil-fires`                         | foothold · NEW |
| 1998 | `exxon-mobil-merger`                       | foothold · NEW |
| 2008 | `record-crude-oil-price-peak`              | foothold · NEW |
| 2010 | `deepwater-horizon`                        | foothold       |
| 2019 | `saudi-aramco-ipo`                         | foothold · NEW |
| 2020 | `oil-price-negative-wti`                   | foothold · NEW |

23 of the 30 were written for this theme. The catalogue held the famous anchors, Standard Oil,
OPEC, the 1973 embargo and the two big spills, but no card for the Drake well, Spindletop or any
of the Middle East strikes apart from Saudi Arabia's. For 1973 the deck uses `opec-embargo`
rather than its duplicate `oil-crisis-1973`.

Gates: size **30**, band 0 **13**, bins **5/8** (advisory), same-year pairs **0**, bunching
**3** in 1922-1930, shared **0** with any earlier theme. A card's band moves whenever the
catalogue around its year moves, so re-measure these figures rather than trusting them:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending
```

## Why the footholds are the footholds

Band 0 is high at 13 because the second half of the deck is recent and widely known. The 1979
queues, the Kuwait fires, Exxon-Mobil, the 2008 spike, the Aramco listing and the negative price
are all within living memory. In the first half, the footholds are the ancient outlier at 347,
the Drake well, Standard Oil's founding and its break-up, and the East Texas field, whose
Depression-era crash dates it. The hard end is Fredonia and the 1986 glut, both of which the
blind grader rated very hard to date from their text.

## Deliberate omissions

- **Cut from the spine to thin it out:**
  - 1890, Royal Dutch Petroleum founded.
  - 1896, the Summerland piers, the first wells drilled over water.
  - 1913, Burton thermal cracking.
  - 1943, the Big Inch pipeline.
  - 2015, the US lifts its ban on exporting crude.

  All five are lesser-known beats that crowd a stretch already holding three cards.
- **Dropped before reconciling:** Hubbert's 1956 peak-oil forecast. It was the fourth beat in
  1951-1960, and the spine checker allows at most three in any ten years.
- **Catalogue cards in scope that were left out:**
  - `trans-arabian-pipeline` (1950) would sit one year from `iran-nationalizes-oil-industry`.
  - `hydraulic-fracturing` (1947) would share a year with
    `first-offshore-well-out-of-sight-of-land`.
  - `birth-john-d-rockefeller` (1839) is a life rather than a milestone.

## Fact-check flags still open

- **`fredonia-natural-gas-well` (year):** sources disagree. General references and the Village
  of Fredonia give 1821 for William Hart's well. AAPG and a Search and Discovery abstract call
  1821 an error and date the first documented commercial use to 1825, citing the _Fredonia
  Censor_ of August 1825. The card keeps 1821.

Two descriptions were corrected during the fact check:

- `oil-price-collapse-glut` now ends "ending years of high prices", because "the boom of the
  previous decade" was a relative dating clue.
- `exxon-mobil-merger` now says "the largest oil company", because the sources don't support
  "the largest company".
