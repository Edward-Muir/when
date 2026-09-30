# The Famine Years theme

A 36-card curated theme running from the Akkadian collapse to the Yemen crisis: named famines
alongside the crops, relief systems, fertilisers and warning networks that pushed back against
them.

## The scope rule

A card is in only if it is **a named famine, or a decisive step in ending or preventing famine**
(a crop introduction, a relief system, a fertiliser, an early-warning system).

- **In:** every named famine the catalogue or a new card can supply (Cairo, the Great European
  Famine, Chalisa, Doji Bara, the Irish and Highland blights, the Holodomor, both world-war
  Bengal and Dutch famines, the Great Leap famine, Biafra, Ethiopia, Somalia, North Korea, South
  Sudan, Yemen); the crops that changed a region's famine exposure (the potato reaching Europe,
  the sweet potato reaching China, the Green Revolution's high-yield varieties); the relief and
  policy machinery built specifically against famine (Rome's grain dole, England's Poor Law, the
  Corn Laws repeal, the Indian Famine Codes, Food for Peace successor the World Food Programme,
  China's decollectivization); the fertilisers that raised food output (guano, Haber-Bosch); and
  the one early-warning system in scope, FEWS NET.
- **Out:** famine-adjacent but not famine-specific medicine or sanitation, general agricultural
  yield techniques with no famine-relief throughline, and anything whose only tie to famine is a
  fundraising concert rather than a food-system change.

Two edges were argued rather than assumed:

- **`grain-storage-silos`** (Ancient Egyptian granaries) is in, though it is not on the spine.
  It reads exactly as "a relief system" — surplus grain stored specifically against a bad year —
  and it is also the deck's earliest and easiest card, so it was added at Step 2 to reach band 0.
- **The Norfolk four-course rotation** and **Ethiopia's Productive Safety Net Programme** were
  both **cut** rather than written. Crop rotation raises yield in general; it is not a crop
  _introduction_ or a famine-specific relief system, so it reads as agricultural history rather
  than famine history. Ethiopia's safety net is a genuine famine-prevention relief system and was
  drafted, but it was the weakest, most obscure link in the deck and was the card dropped to bring
  the theme back to 36 once `grain-storage-silos` was added for band 0.
- **Borlaug's Nobel Peace Prize** (1970) was drafted and then cut as redundant: the catalogue's
  existing `green-revolution-begins` (1965, "High-yield crop varieties and fertilizers vastly
  raised harvests, easing famine across the developing world") already covers the beat — the
  Green Revolution crop breakthrough — and a Nobel-recognition card five years later would only
  crowd it.

## The 36

Paste `eventNames` from `famine.theme.json` into the workflow's `theme` input.

|  Year | Slug                              |          |
| ----: | --------------------------------- | -------- |
| -2200 | `akkadian-empire-famine-collapse` | NEW      |
| -2000 | `grain-storage-silos`             | foothold |
|  -123 | `grain-price-controls`            |          |
|  1200 | `great-famine-cairo`              | NEW      |
|  1315 | `great-european-famine`           |          |
|  1570 | `potato-introduction-europe`      | foothold |
|  1593 | `sweet-potato-reaches-china`      | NEW      |
|  1601 | `english-poor-law-relief`         | NEW      |
|  1630 | `deccan-famine-mughal-india`      | NEW      |
|  1693 | `great-famine-france-louis-xiv`   | NEW      |
|  1695 | `great-baltic-famine`             | NEW      |
|  1770 | `bengal-famine-company-rule`      | NEW      |
|  1783 | `chalisa-famine`                  |          |
|  1791 | `doji-bara-famine`                |          |
|  1840 | `guano-boom-fertilizer-trade`     | NEW      |
|  1845 | `irish-potato-famine`             | foothold |
|  1846 | `corn-laws-repealed-britain`      | NEW      |
|  1866 | `finnish-famine`                  |          |
|  1876 | `great-famine-british-india`      | NEW      |
|  1880 | `indian-famine-codes-adopted`     | NEW      |
|  1909 | `haber-process`                   |          |
|  1921 | `russian-famine-civil-war`        |          |
|  1932 | `holodomor`                       | foothold |
|  1943 | `bengal-famine-wwii`              |          |
|  1944 | `dutch-hunger-winter`             |          |
|  1959 | `great-leap-forward-famine`       |          |
|  1961 | `world-food-programme-founded`    | NEW      |
|  1965 | `green-revolution-begins`         | foothold |
|  1967 | `biafra-famine`                   |          |
|  1978 | `china-ends-collective-farming`   | NEW      |
|  1983 | `ethiopian-famine`                |          |
|  1985 | `famine-early-warning-launched`   | NEW      |
|  1995 | `north-korea-famine`              |          |
|  2011 | `horn-of-africa-famine`           | NEW      |
|  2017 | `south-sudan-famine-declared`     | NEW      |
|  2018 | `yemen-famine-crisis`             | NEW      |

18 of the 36 are new. Measured against the merged catalogue: size **36**, band 0 **5**, bins **8/8** (advisory), same-year pairs **0**.

18 of the 36 are new. Read the current band and spread figures from the catalogue rather than
from here:

```bash
node scripts/theme-gap.js --include-pending --extra <staging>/famine.json --slugs <the 36 above>
```

At authoring time: size **36**, bins **8/8** `[2 1 2 6 6 5 7 7]`, band 0 **5**, same-year pairs
**0**.

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how sparse the timeline is around a year, and this
theme's five footholds split cleanly into two kinds:

- **Sparse-era anchors.** `akkadian-empire-famine-collapse` (2200 BCE) and `grain-storage-silos`
  (2000 BCE) are band 0 mostly because almost nothing else sits near them, not because either
  label is generous. They are also the only reason the opening hand is placeable at all — the
  deck's next card, `grain-price-controls`, is 2,000+ years later and still only band 2.
- **School-curriculum cards in crowded years.** `irish-potato-famine`, `holodomor` and
  `green-revolution-begins` are `easy`-labelled and land in band 0 on recognition alone, each
  against a comparatively dense stretch of 19th/20th-century history.

The margin here is thin — 5 against a floor of 5 — so none of these five should be swapped out
without adding a replacement foothold first.

## Deliberate omissions

**Same-year and near-year collisions.** None of the 36 share a year, but the deck carries several
tight, historically-linked clusters that were kept rather than resolved, because in each case
the two cards are causally connected and neither can move:

- `great-famine-cairo` (1200) sits alone; nothing else in the catalogue names a medieval Egyptian
  famine to collide with it.
- `great-famine-france-louis-xiv` (1693) → `great-baltic-famine` (1695): two independent
  weather-driven famines two years apart on opposite sides of Europe. Both are named beats the
  scope rule calls for and neither date can move.
- `irish-potato-famine` (1845) → `corn-laws-repealed-britain` (1846): the famine is the reason
  the Corn Laws fell one year later. Splitting them further apart would misstate the causality.
- `bengal-famine-wwii` (1943) → `dutch-hunger-winter` (1944): two distinct WWII famines, one
  year apart, on opposite sides of the war. Both are named, famous beats the scope rule cannot
  drop.
- `great-famine-british-india` (1876) → `indian-famine-codes-adopted` (1880): the codes exist
  because of this famine.
- `great-leap-forward-famine` (1959) → `world-food-programme-founded` (1961) →
  `green-revolution-begins` (1965) → `biafra-famine` (1967): the densest stretch in the deck,
  four cards across eight years. All four are load-bearing beats (the deadliest famine in
  recorded history, the founding of the largest food-aid agency, the Green Revolution, and the
  famine that built the modern humanitarian movement) and none was cut.
- `ethiopian-famine` (1983) → `famine-early-warning-launched` (1985): FEWS NET was founded
  because of this famine.
- `south-sudan-famine-declared` (2017) → `yemen-famine-crisis` (2018): two near-famine
  emergencies a year apart in the same global food crisis.

**Redundancy.** `great-leap-forward` (1958-1962, the broader Great Leap campaign card) was left
out in favor of `great-leap-forward-famine` (1959), which names the famine itself rather than
the political campaign — the same substitution pattern as Clockwork's `mechanical-clock` for
`verge-escapement`. `world-food-programme-founded` was kept over a drafted **US Food for Peace
Act** (1954) card: both are relief-system beats seven years apart, but the WFP is the
longer-lived, more globally recognized institution, and keeping both would have pushed the deck
past 36.

**Out of scope, though a sweep found them.** `year-without-summer` (1816, Tambora's ash causing
worldwide crop failure) is a climate disaster with famine as a consequence, not itself a named
famine. `famine-cycles-establish` (900) and `famine-cycles-break` (1700-1817) describe a
recurring pattern rather than a single named famine or a single decisive step, and both would
have been effectively unplaceable window cards regardless. `live-aid` (1985) is a fundraising
concert, not a food-system change — the famine it responded to is already the deck's
`ethiopian-famine` card. `indian-rebellion-famine` ("Orissa Famine," 1866-1868) is a second
genuine named Indian famine but collides on year with `finnish-famine` (also 1866-1868); Finland's
famine was kept as the more geographically distinct beat in a deck that already runs three India
famines (Chalisa, Doji Bara, the 1876-78 famine). `russian-famine-troubles` (1601-1603) and
`russian-famine-imperial` (1891-1892) are two more genuine named famines the catalogue already
holds; both were left out only to keep the deck at 36, not for any scope reason — either is a
clean substitute if a future edit needs a Russian-famine card instead of `russian-famine-civil-war`.
`persian-famine` (1917-1919), `bangladesh-famine` (1974), `somali-famine` (1991-1993) and
`irish-famine-forgotten` (1740-1741) are all genuine named famines cut purely on space; see below.

**Rejected in favour of a new card.** None — every existing famine-shaped card the catalogue
held that matched a spine beat was reused as-is.

**Highland Potato Famine cut.** The spine's 1847-1856 Highland Potato Famine is the same blight
as `irish-potato-famine`, striking Scotland a year after Ireland. It was dropped rather than
written: a third card on the same blight within a decade (Ireland 1845, Corn Laws 1846, Highlands 1847) would have been the tightest cluster in the deck for a beat the Irish card already carries.

**Iceland's Mist Hardships cut.** The spine's 1784-1785 Móðuharðindin famine is caused by the
same Laki eruption the catalogue already has as `laki-eruption` (year 1783, "An Icelandic eruption
caused widespread famine and climate effects across Europe"). That slug is a strong match for the
beat, but its year is **1783** — the same starting year as `chalisa-famine` (1783-1784), which
the spine also calls for. Since a card cannot be re-dated and the deck cannot carry a same-year
pair, one had to go: `chalisa-famine` is the more direct fit for a _named famine_ card and was
kept; `laki-eruption` was dropped from this theme.

**Turnip Rotation Spreads cut.** The Norfolk four-course rotation raised yields generally; it is
not a crop introduction, a relief system, a fertiliser or an early-warning system, and it never
reads as a famine-specific beat the way `potato-introduction-europe` or `guano-boom-fertilizer-trade`
do. Cut on scope, not on catalogue availability (the catalogue has no match either).

**Ethiopia's Safety Net Programme cut.** Drafted, validated, then cut purely to hold the deck at
36 once `grain-storage-silos` was added to fix band 0 — see "The scope rule" above.

**Borlaug's Nobel Peace Prize cut.** Redundant with `green-revolution-begins` — see "The scope
rule" above.

## Still missing from the catalogue

Real gaps, not filler, left unwritten because they collide with a card already in the 36:

- **The Bengal famine of 1770** and the **1876-78 Madras famine** are each represented by a
  single new card; contemporary sub-regional famines (the 1783-84 Chalisa famine's Rajasthani
  counterpart, the 1837-38 Agra famine) all fold into the cards already present.
- **The Boston/US Great Famine relief ships** and other 19th-century one-off relief convoys are
  folded into `corn-laws-repealed-britain` and `indian-famine-codes-adopted`, the two policy
  beats that best represent organized relief in that century.
- **Amartya Sen's entitlement theory of famine** (1981) is a genuine "decisive idea" but is
  scholarship about famine, not a step that itself ended or prevented one, and it sits four
  years from `ethiopian-famine` and two from `famine-early-warning-launched` regardless.
- **The 2007-08 world food price crisis** is a real famine-adjacent shock but produced no single
  named famine or relief system distinct enough to write, and it would sit six years from
  `china-ends-collective-farming`'s neighbourhood and five from `horn-of-africa-famine`.
