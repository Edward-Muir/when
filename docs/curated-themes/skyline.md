# The Skyline theme

A 31-card curated theme on the relay race for the title of tallest human-made structure (or
tallest building) on Earth, from the first pyramid to the Burj Khalifa, plus the handful of
inventions that made building tall survivable and structurally possible. This note is why
these 31 and not others.

## The scope rule

A card is in only if it is **a structure that became the tallest human-made structure (or
tallest building) of its day or region, was built to be, or a key enabler of building tall**
(the safety elevator, the steel frame). A structure's fall or loss of the record also counts.

Two edges were argued rather than assumed:

- **`elevator-invented` and `bessemer-steel-process`** are in as enablers even though neither
  is itself a record holder. Without a way to survive a fall from height and a way to build a
  frame that could carry one, nothing after 1850 keeps climbing — the spine names both by
  design.
- **`steel-frame-skyscraper`** (the Home Insurance Building, 1885) is in on the same reading:
  it is not the tallest building of its year, it is the enabler that makes every skyscraper
  after it possible.

Excluded on the same rule: buildings that were merely tall for their city or type without ever
holding a world or "tallest building" record (a regional cathedral, a merely large office
block), and enablers one step too far removed from height itself — reinforced concrete framing
generally, the escalator, air conditioning. Only the specific enablers the spine names, plus
the steel skeleton frame they made possible, are in.

## The 31

|  Year | Slug                               |                |
| ----: | ---------------------------------- | -------------- |
| -2650 | `step-pyramid-djoser`              | foothold       |
| -2590 | `red-pyramid-sneferu`              | NEW            |
| -2560 | `pyramids`                         | foothold       |
|  1311 | `lincoln-cathedral-spire`          | NEW            |
|  1548 | `lincoln-spire-collapses`          | NEW            |
|  1549 | `st-olafs-tallinn-spire`           | NEW            |
|  1573 | `beauvais-cathedral-collapse`      | NEW            |
|  1625 | `st-olafs-spire-burns`             | NEW            |
|  1647 | `strasbourg-cathedral-tallest`     | NEW            |
|  1852 | `elevator-invented`                |                |
|  1856 | `bessemer-steel-process`           |                |
|  1874 | `st-nicholas-church-hamburg`       | NEW            |
|  1876 | `rouen-cathedral-iron-spire`       | NEW            |
|  1880 | `cologne-cathedral-completed`      | NEW            |
|  1884 | `washington-monument-completed`    | foothold · NEW |
|  1885 | `steel-frame-skyscraper`           |                |
|  1889 | `eiffel-tower`                     | foothold       |
|  1913 | `woolworth-building-opens`         | NEW            |
|  1929 | `bank-of-manhattan-trust-tops-out` | NEW            |
|  1930 | `chrysler-building`                | foothold       |
|  1931 | `empire-state-building`            | foothold       |
|  1963 | `kvly-tv-mast-erected`             | NEW            |
|  1967 | `ostankino-tower-completed`        | NEW            |
|  1972 | `world-trade-center-tops-out`      | NEW            |
|  1973 | `sears-tower`                      | foothold       |
|  1974 | `warsaw-radio-mast-erected`        | NEW            |
|  1976 | `cn-tower`                         |                |
|  1991 | `warsaw-mast-collapses`            | NEW            |
|  1998 | `petronas-towers`                  |                |
|  2004 | `taipei-101`                       |                |
|  2010 | `burj-khalifa`                     | foothold       |

18 of the 31 are new. Measured against the merged catalogue: size **31**, band 0 **8**, bins **7/8** (advisory), same-year pairs **0**.

18 of the 31 are new; 13 already sat on their exact beat in the catalogue.

At authoring time, with the new cards loaded via `--include-pending --extra`:

```
size 31   band 0 8   bins 7/8   same-year pairs 0
```

All hard gates pass: size is inside 30-36, band 0 clears the floor of 5 by a comfortable
margin, and there are no same-year collisions. Bins is advisory-only and the tool flags one
empty stretch (211 BCE to 1000 CE) as informational, which the scope rule cannot fill: nothing
took the world-tallest-structure record between the Great Pyramid and Lincoln Cathedral, so the
catalogue's silence there is historically correct, not a gap in coverage.

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how sparse the timeline is around a year. This theme
gets 8 against a floor of 5, and the reason is the same one `clockwork.md` found: **the
earliest and the most famous ends of the timeline are both easy to place**.

- `step-pyramid-djoser` and `pyramids` sit in the emptiest stretch the catalogue has — nothing
  else worth mentioning happened at -2650 or -2560 — so both are trivially ordered even though
  a player could not date either to the century.
- `elevator-invented`, `washington-monument-completed`, `steel-frame-skyscraper` and
  `eiffel-tower` cluster in the 1850s-1880s, where the catalogue is dense with invention-era
  events but these four are each graded easy or medium on recognition and land in band 0
  anyway — Eiffel and the elevator are famous outright, and Washington Monument and Home
  Insurance Building sit right at the joints of eras the difficulty scorer favors.
- `chrysler-building`, `empire-state-building` and `burj-khalifa` are the modern footholds:
  three of the handful of buildings a non-specialist could actually name.

## Deliberate omissions

Cards a keyword sweep surfaces, and spine beats cut, left out on purpose.

- **Redundant elevator beats.** The spine names both Otis's 1854 public demonstration and the
  1857 first passenger installation. The catalogue's `elevator-invented` (dated 1852, medium
  difficulty) already reads as the same "safety elevator makes tall buildings survivable" beat;
  adding a second Otis card four years later would be two cards for one idea. The 1857
  beat is dropped.
- **`equitable-life-building` (1870), the New York World Building (1890), the Manhattan Life
  Insurance Building (1894), the Park Row Building (1899), the Ingalls Building (1903), the
  Singer Building (1908) and the Metropolitan Life Tower (1909)** are all real, all in scope
  under "held the world's tallest-building record" or "key enabler," and none of them exist in
  the catalogue. They were not written because the beat they cover — a fast relay of
  short-lived, obscure American office-tower records between 1870 and 1913 — is already told by
  `steel-frame-skyscraper` (1885) and `woolworth-building-opens` (1913) at the two ends of it,
  and packing in five more obscure record-holders 1-9 years apart from each other would crowd
  the deck without adding a beat a player could reason about. Woolworth was kept over the others
  because it is the one name in that run anyone might recognize, and because its seventeen-year
  reign gives the deck a landmark to return to.
- **`bank-of-manhattan-trust-tops-out` (1929), `chrysler-building` (1930) and
  `empire-state-building` (1931)** sit one year apart from each other twice — the tightest
  crowding in the deck. All three were kept anyway: this is the one stretch where the crowding
  _is_ the story the theme is telling (a raced, secretly-built spire beating a rival by months,
  then losing the title within a year), and `chrysler-building`'s existing description already
  depends on 40 Wall Street existing as a neighboring card for that context to land.
- **Burj Khalifa passing the KVLY mast while still under construction (2008)** is in scope but
  two years from `burj-khalifa` (2010) and about the same building; the 2010 opening already
  covers "current holder of both records" and a second Burj Khalifa card would be redundant
  rather than additive. Dropped.
- **`world-trade-center-begins` (1968)**, already in the catalogue, is construction starting,
  not the tower topping out and taking the record — a different beat on the same building. Left
  out in favor of the new `world-trade-center-tops-out` (1972), which is the actual spine beat.

## Still missing from the catalogue

Real gaps, not filler:

- **The demolition or loss of most of the 19th-century American office-tower record holders**
  (World Building, Manhattan Life, Park Row, Singer, Met Life) — genuinely tallest-building
  record holders in their moment, left out for crowding as above. If a future edit wants the
  1870-1913 stretch denser, Woolworth's neighbors are the ones to add first.
- **1857's first passenger safety elevator** — the natural companion to `elevator-invented`,
  not written because it is the same beat four years later.
- **The Ingalls Building (1903)**, the first reinforced-concrete-framed skyscraper — a genuine
  enabler beat under the scope rule's "key enabler" clause, distinct from the steel frame, but
  five years from Woolworth and judged too fine-grained a distinction for this deck.

## Catalogue doubts

`elevator-invented` is dated 1852 in the catalogue; the famous public demonstration the spine
describes (the rope cut above a New York exhibition crowd) is usually dated 1853 or 1854. The
beat is the same regardless of which year the demonstration is pinned to, so the existing card
is reused rather than duplicated, per instructions not to edit existing events.
