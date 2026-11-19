# The Strike It Rich theme

A 30-card curated theme on gold, silver and diamond strikes, from the vein at Laurion that paid
for the Athenian fleet to a diamond the size of a tennis ball picked out by a scanner in
Botswana. It covers the finds themselves, the rushes that followed them, and a few single
stones famous enough to be events. This note explains why these 30 and not others.

## The scope rule

An event is in only if **it is a gold, silver or diamond strike or rush**: a find of the metal
or the gem, the stampede of people it set off, or the opening of a mine on a find that was
already known.

Three neighbouring themes own the edges:

- **Black Gold** takes oil and gas. No oil boom was on the spine.
- **Conquistadors** takes the conquest that found Potosí. The silver strike itself,
  `silver-discovered-at-potosi`, is in, and so is `zacatecas-silver-strike` a year later,
  which is prospectors striking veins rather than an army taking a city.
- **Colonies Founded** takes the settlements. Johannesburg and Kimberley appear here only as
  what grew up around a find.

Four edges were argued rather than assumed:

- **Trajan's Dacian gold** (106) was cut. It is a conquest haul, not a strike, the same
  boundary that sends the fall of the Inca to Conquistadors.
- **The Turin papyrus map** (about 1150 BCE) was cut. It is a map of a gold mine, and no find
  or rush is attached to it.
- **Platinum in the Merensky Reef** (1924) was cut. The scope names gold, silver and diamonds.
- **Bre-X** (1996) was cut. The gold was never there, so it is a fraud rather than a find.

`las-medulas-roman-gold-mine` and `argyle-diamond-mine-opens` are the two cards that are a
mine rather than a discovery. Each is the moment a known deposit began to be worked at scale,
and Argyle is one of the theme's own example beats.

## The 30

| Year | Slug                              |                |
| ---: | --------------------------------- | -------------- |
| -483 | `athenian-laurion-silver-mines`   |                |
|  -25 | `las-medulas-roman-gold-mine`     | foothold · NEW |
| 1298 | `kutna-hora-silver-strike`        | NEW            |
| 1516 | `joachimsthal-silver-rush`        | NEW            |
| 1545 | `silver-discovered-at-potosi`     |                |
| 1546 | `zacatecas-silver-strike`         | foothold · NEW |
| 1693 | `minas-gerais-gold-rush`          | NEW            |
| 1725 | `brazil-diamonds-discovered`      | NEW            |
| 1745 | `berezovsk-first-russian-gold`    | NEW            |
| 1799 | `reed-gold-nugget-north-carolina` | NEW            |
| 1829 | `georgia-gold-rush`               | foothold · NEW |
| 1848 | `california-gold-rush`            | foothold       |
| 1851 | `gold-rush-to-australia`          |                |
| 1859 | `gold-rush-currency-clipper`      |                |
| 1867 | `eureka-diamond-found`            | NEW            |
| 1871 | `kimberley-diamond-rush`          | NEW            |
| 1877 | `tombstone-silver-strike`         | NEW            |
| 1886 | `witwatersrand-gold-discovery`    | NEW            |
| 1892 | `coolgardie-gold-rush`            | NEW            |
| 1896 | `klondike-gold-rush`              |                |
| 1899 | `nome-beach-gold-rush`            | NEW            |
| 1905 | `cullinan-diamond-found`          | NEW            |
| 1908 | `namib-diamond-rush`              | NEW            |
| 1955 | `mir-siberian-diamond-pipe`       | foothold · NEW |
| 1961 | `carlin-trend-gold-discovery`     | NEW            |
| 1967 | `orapa-diamond-pipe-found`        | NEW            |
| 1980 | `serra-pelada-gold-rush`          | NEW            |
| 1983 | `argyle-diamond-mine-opens`       | NEW            |
| 1991 | `lac-de-gras-diamonds-found`      | NEW            |
| 2015 | `lesedi-la-rona-diamond-found`    | foothold · NEW |

24 of the 30 were written for this theme. The catalogue held the famous rushes, California,
Australia, the Comstock and the Klondike, with Laurion and Potosí, but nothing on diamonds at
all and none of the South African, Brazilian or Russian finds. `gold-rush-currency-clipper` is
the Comstock Lode card under an older slug.

Gates: size **30**, band 0 **6**, bins **8/8** (advisory), same-year pairs **0**, bunching
**3** in 1892-1899, shared **0** with any earlier theme. A card's band moves whenever the
catalogue around its year moves, so re-measure these figures rather than trusting them:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending
```

## Why the footholds are the footholds

Band 0 is 6, one above the floor, and five of the six are footholds because their text gives
the era away rather than because the event is famous. Las Médulas says Roman, Zacatecas says
the Spanish empire, Georgia says "before California", Mir says Soviet, and Lesedi La Rona
mentions a mine's scanners. Only `california-gold-rush` is there on fame. The blind grader
moved Kimberley, the Witwatersrand and Tombstone from easy to medium and the Cullinan to hard:
all four are well known, but nothing on the card says which decade.

The hard end is the Reed nugget and Serra Pelada, both rated very hard, with Berezovsk, the
Cullinan and the Carlin Trend behind them.

The deck is tightly packed from 1848 to 1908: twelve of the 30 fall in those 60 years, and
theme-gap lists eight adjacent pairs there within 8 years of each other. That is the history
rather than a fault in the picking, since it was the age of the rushes, but it makes the middle
of a game harder than the bands suggest. Potosí and Zacatecas are one year apart.

## Deliberate omissions

- **Cut from the spine to thin it out:**
  - 1861, Gabriel's Gully in Otago.
  - 1869, the Welcome Stranger nugget.
  - 1880, gold at Juneau.
  - 1946, the Free State goldfield.
  - 1973, the Jwaneng diamond pipe.

  All five are lesser-known beats in stretches that already hold three cards, and Jwaneng is
  the same kind of find, in the same country, as Orapa six years earlier.

- **Cut on scope:** the Turin papyrus map, Trajan's Dacian gold, Merensky Reef platinum and
  Bre-X, as argued above.

## Fact-check flags still open

All three are questions about the year, and each card keeps the year it was written with.

- **`las-medulas-roman-gold-mine` (year):** UNESCO dates the mining to the 1st century AD.
  About 25 BCE is the Augustan conquest of the region, which is what the card's "after
  conquering" refers to. The card keeps -25.
- **`kutna-hora-silver-strike` (year):** only a coin dealer's listing gives 1298 outright.
  Mining near Sedlec began around 1260 and the mint opened about 1300. The card keeps 1298.
- **`brazil-diamonds-discovered` (year):** the discovery was officially reported in 1729, and
  the GIA puts it somewhere between 1710 and 1730. 1725 appears only in older sources. The
  card keeps 1725.

The fact checker searched for these three, Joachimsthal and Lac de Gras, and checked the other
19 new cards against the spine's source links without a search of their own.
