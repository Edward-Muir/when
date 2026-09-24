# The Stolen! theme

A 34-card curated theme on famous thefts, robberies and swindles carried out for gain, from
tomb robbers confessing under trial in Ramesside Thebes to a crypto exchange emptying its own
customer accounts. This note is why these 34 and not others.

## The scope rule

An event is in only if **it is a famous theft, robbery, heist, tomb robbery, or
forgery/fraud carried out for gain** — including famous art thefts and swindles.

Excluded: theft or break-ins that were not for material gain (a burglary staged for political
espionage, say), and financial collapses that were mismanagement or bad luck rather than fraud.
That line is what keeps `watergate-break-in` out even though it is literally a burglary — the
Watergate burglars were after documents and wiretaps, not money — while `enron-scandal` and
`ftx-crypto-collapse` are in: both are frauds run for the perpetrators' own enrichment, not
merely companies that failed.

One edge argued rather than assumed: **`breitwieser-art-theft-spree`** is in. Stephane
Breitwieser stole to keep, not to sell, which is a genuinely different motive from every other
card in the deck. The spine's own reasoning is followed here — a theft carried out to acquire
valuable property without paying for it is still theft for gain, whether the gain is a sale or
a private collection, and the case is too well known to a "stolen art" theme to drop on a
technicality of motive.

## The 33

```
node scripts/theme-gap.js --slugs <the 34 below, comma-separated>
```

At authoring time, with the new cards loaded via `--include-pending --extra`: size **34**,
bins **8/8**, band 0 **8**, same-year pairs **0**.

|  Year | Slug                                  |                |
| ----: | ------------------------------------- | -------------- |
| -1110 | `deir-el-medina-tomb-robberies`       | NEW            |
|   -70 | `trial-verres-plunder`                | NEW            |
|  1303 | `westminster-crown-jewels-heist`      | NEW            |
|  1671 | `blood-crown-jewels-heist`            | NEW            |
|  1720 | `south-sea-bubble`                    |                |
|  1792 | `french-crown-jewels-theft`           | NEW            |
|  1855 | `great-gold-robbery`                  | NEW            |
|  1907 | `irish-crown-jewels-theft`            | NEW            |
|  1911 | `mona-lisa-theft`                     | foothold · NEW |
|  1920 | `ponzi-scheme-exposed`                | foothold · NEW |
|  1932 | `kreuger-empire-collapse`             | NEW            |
|  1934 | `just-judges-panel-theft`             | NEW            |
|  1941 | `amber-room-looted`                   | NEW            |
|  1943 | `van-meegeren-fake-vermeer-sale`      | NEW            |
|  1963 | `great-train-robbery-buckinghamshire` | foothold · NEW |
|  1969 | `caravaggio-nativity-theft`           | NEW            |
|  1971 | `baker-street-robbery`                | NEW            |
|  1974 | `russborough-house-art-heist`         | NEW            |
|  1978 | `lufthansa-heist`                     | foothold · NEW |
|  1983 | `brinks-mat-robbery`                  | NEW            |
|  1990 | `gardner-museum-art-heist`            | foothold · NEW |
|  1994 | `theft-of-the-scream`                 | NEW            |
|  2001 | `enron-scandal`                       |                |
|  2002 | `van-gogh-museum-theft`               | NEW            |
|  2003 | `antwerp-diamond-heist`               | foothold · NEW |
|  2004 | `northern-bank-robbery`               | NEW            |
|  2008 | `madoff-ponzi-scheme-unravels`        | foothold · NEW |
|  2010 | `paris-modern-art-museum-heist`       | NEW            |
|  2012 | `kunsthal-rotterdam-art-heist`        | NEW            |
|  2015 | `hatton-garden-vault-burglary`        | foothold · NEW |
|  2016 | `bangladesh-bank-cyber-heist`         | NEW            |
|  2019 | `dresden-green-vault-heist`           | NEW            |
|  2022 | `ftx-crypto-collapse`                 |                |

30 of the 33 are new. Measured against the merged catalogue: size **33**, band 0 **8**, bins **8/8** (advisory), same-year pairs **0**.

31 of the 34 are new. Only three spine beats matched an existing card exactly on both name and
year: the South Sea Bubble, the Enron scandal and the FTX collapse were all already in the
catalogue (`south-sea-bubble` in `diplomatic.json`, `enron-scandal` in `diplomatic.json`,
`ftx-crypto-collapse` in `money.json`) and are reused rather than duplicated. No other keyword
sweep (`heist`, `robbery`, `\btheft\b`, `forger`, `counterfeit`, `\bfraud\b`, `stole|stolen`,
`loot`) turned up an in-scope card on any other beat's year; `leonardo-mona-lisa` (1503, the
painting itself) and `millennium-dome` (1999, the building) were the closest false positives —
neither is the theft beat.

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how sparse the catalogue is around a year. Eight
cards land there, comfortably over the floor of 5, and they split into two groups:

- **The ancient outliers are sparse rather than famous.** `deir-el-medina-tomb-robberies` and
  `trial-verres-plunder` sit in a stretch of the timeline the catalogue holds almost nothing in,
  so even a `very-hard`/`hard` label cannot keep them out of band 0 — nothing nearby competes
  for the ordering. (They did not land in band 0 this pass, but are the reason the opening of
  the deck is placeable at all before the mid-1700s.)
- **The 20th-century footholds are famous rather than sparse.** `mona-lisa-theft`,
  `ponzi-scheme-exposed`, `great-train-robbery-buckinghamshire`, `lufthansa-heist`,
  `gardner-museum-art-heist`, `antwerp-diamond-heist`, `madoff-ponzi-scheme-unravels` and
  `hatton-garden-vault-burglary` are graded `easy` on recognition alone — a stolen Mona Lisa, a
  Ponzi scheme, the Great Train Robbery, Lufthansa, the world's largest unsolved art theft,
  Antwerp's diamond vault, Madoff and Hatton Garden's pensioner gang are close to the entire set
  of heist stories that cross into general knowledge, which is why the deck can afford this many
  `easy` cards without inflating them.
- `south-sea-bubble`, `enron-scandal` and `ftx-crypto-collapse` are the three reused cards and
  all three are already famous financial collapses, so they double as footholds for free.

## Deliberate omissions

**Spine beats cut for crowding, after the reconciliation pass showed the deck was originally
36 cards with eight sub-8-year pairs.** Two beats were dropped specifically to break up the
tightest clusters rather than for any weakness in the story itself:

- `Carlton Hotel Jewel Heist` (2013) sat one year after `kunsthal-rotterdam-art-heist` (2012)
  and two years before `hatton-garden-vault-burglary` (2015) — cutting it turned two tight gaps
  into one three-year gap. Its beat (a masked gunman, a jewelry exhibition, tens of millions in
  diamonds) is close enough in shape to `antwerp-diamond-heist` and `graff-diamonds-robbery`
  that the deck loses nothing distinctive by dropping it.
- `Graff Diamonds Robbery` (2009) sat one year after `madoff-ponzi-scheme-unravels` (2008) and
  one year before `paris-modern-art-museum-heist` (2010) — the same fix, for the same reason.
  It is the closest thing in the spine to a repeat of `antwerp-diamond-heist`'s beat (an armed
  jewelry-store robbery), so it is the more dispensable of the two "professional jewel thieves"
  cards this era offers.

Also cut for redundancy against a beat already in the deck:

- `The Great Bookie Robbery` (1976) and `Knightsbridge Deposit Heist` (1987) are both "gang
  robs a cash or deposit-box target" beats, which the deck already carries in
  `baker-street-robbery` (1971), `lufthansa-heist` (1978), `brinks-mat-robbery` (1983),
  `northern-bank-robbery` (2004) and `hatton-garden-vault-burglary` (2015). Both are also
  regionally obscure next to those, so they were the two easiest cuts in that cluster.
- `The Securitas Depot Robbery` (2006) is the same beat again (a gang kidnaps a family to force
  a cash handover) as `northern-bank-robbery` (2004), two years earlier and better known.
- `Portuguese Bank Note Fraud` (1925) is a forgery-adjacent fraud that would have sat five years
  from `ponzi-scheme-exposed` (1920) and seven from `kreuger-empire-collapse` (1932); the deck
  already carries three distinct flavors of financial fraud in that stretch of the century
  (a pyramid scheme, a match monopoly built on forged bonds, a forged Vermeer sold to a Nazi
  official) and a fourth, more obscure one added only crowding.
- `Millennium Dome Diamond Plot` (2000) is the one spine beat that describes an attempted
  rather than completed theft. It would have sat one year from `enron-scandal` (2001) and five
  from `breitwieser-art-theft-spree` (1995); cutting it both relieves that cluster and keeps the
  deck to completed thefts, which every other card in it is.

## Known crowding kept on purpose

This theme is denser than most in the bank: after the two structural cuts above, four
one-year pairs remain (`theft-of-the-scream`/`breitwieser-art-theft-spree` at 1994/1995,
`enron-scandal`/`van-gogh-museum-theft` at 2001/2002, `van-gogh-museum-theft`/
`antwerp-diamond-heist` at 2002/2003, and `hatton-garden-vault-burglary`/
`bangladesh-bank-cyber-heist` at 2015/2016), plus a further dozen-odd pairs inside eight years
through the entire 1930-2022 span. This is not a curation failure: **the world's famous heists
genuinely cluster in the last sixty years**, the period with international news wire coverage,
televised trials and, later, the internet. A "Stolen!" theme that thinned every close pair to
the clockwork standard of one sub-8-year pair would have to cut the deck to well under the
30-card floor, discarding recognizable beats (the Gardner Museum, Antwerp, Hatton Garden,
Dresden) to protect a spread that the subject itself doesn't have. All four hard gates pass
regardless — size, band 0, and same-year pairs are unaffected by near-year crowding, which
`theme-gap` reports as advisory only.

## Still missing from the catalogue

Real gaps, not filler, left unwritten because they would only add to the existing crowding:

- **The Pierpont Morgan Library theft** (1970s forger Mark Landis-adjacent cases) and several
  other Breitwieser-scale serial thieves were considered and folded into
  `breitwieser-art-theft-spree` rather than given their own cards.
- **The 2015 Isabella Stewart Gardner FBI announcement** (a renewed investigation, not a new
  theft) is not a distinct beat from `gardner-museum-art-heist` and was not written.
- **The Pink Panthers jewel-thief network**, active across many of the deck's 2000s-2010s
  robberies (including the cut Carlton Hotel and Graff Diamonds beats), is a connective thread
  across several cards rather than a beat of its own; no single card could represent it without
  duplicating an existing one.
- **A second Antwerp-style diamond-vault heist or Pink Panther job** was the natural next
  addition if the deck needed more cards, but every candidate found sat within a few years of
  `antwerp-diamond-heist`, `graff-diamonds-robbery` (cut) or `carlton-hotel-jewel-heist` (cut)
  and would have made the 2003-2013 stretch even denser than it already is.

## Review edits

`breitwieser-art-theft-spree` was dropped at review. Theft to keep rather than to sell does not
pass "carried out for gain" without special pleading, and the cut also removes the deck's
1994/1995 one-year pair with `theft-of-the-scream`. The deck is 33, not 34; the argument for it
above is kept as the record of why it was considered.
