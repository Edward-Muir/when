# The Sell, Sell, Sell theme

A 30-card curated theme on the pitch itself: famous advertisements, slogans and brand mascots,
from Caxton's printed handbill to a QR code bouncing across a Super Bowl screen. This note
explains why these 30 and not others.

## The scope rule

An event is in only if **it is a famous advertisement, slogan or brand mascot.**

- **The pitch**: an ad, a campaign, a jingle, a slogan or a mascot, dated to its first
  appearance. The card is the selling, not the thing sold.
- **Not the shop, the company or the broadcast.** Three neighbours own the edges: **Retail
  Therapy** owns shops and the ways people buy, **Still Trading** owns the founding of
  companies, and **Tune In** owns broadcast milestones. So `coca-cola-invented` stays out while
  Coca-Cola's Santa is in, and the first TV commercial (Bulova, 1941) was cut partly because it
  reads as a broadcasting first.

## The 30

| Year | Slug                                      |                |
| ---: | ----------------------------------------- | -------------- |
| 1477 | `caxton-printed-handbill-ad`              | foothold · NEW |
| 1704 | `boston-news-letter-first-ad`             | foothold · NEW |
| 1877 | `quaker-oats-man-trademark`               | NEW            |
| 1886 | `pears-soap-bubbles-ad`                   | NEW            |
| 1888 | `kodak-you-press-the-button`              | foothold · NEW |
| 1898 | `michelin-man-bibendum`                   | foothold · NEW |
| 1914 | `morton-salt-when-it-rains`               | NEW            |
| 1916 | `mr-peanut-created`                       | NEW            |
| 1921 | `betty-crocker-created`                   | foothold · NEW |
| 1925 | `burma-shave-roadside-signs`              | NEW            |
| 1926 | `wheaties-first-singing-jingle`           | foothold · NEW |
| 1931 | `coca-cola-santa-claus-ads`               | foothold · NEW |
| 1936 | `elsie-the-cow-mascot`                    | NEW            |
| 1944 | `smokey-bear-debuts`                      | foothold · NEW |
| 1947 | `a-diamond-is-forever-slogan`             | foothold · NEW |
| 1952 | `tony-the-tiger-mascot`                   | foothold · NEW |
| 1954 | `marlboro-man-campaign`                   | foothold · NEW |
| 1959 | `vw-think-small-ad`                       | NEW            |
| 1963 | `ronald-mcdonald-debuts`                  | foothold · NEW |
| 1965 | `pillsbury-doughboy-debuts`               | foothold · NEW |
| 1971 | `coke-hilltop-teach-the-world`            | foothold · NEW |
| 1977 | `i-love-new-york-campaign`                | foothold · NEW |
| 1984 | `apple-1984-super-bowl-ad`                | foothold · NEW |
| 1988 | `nike-just-do-it-slogan`                  | NEW            |
| 1993 | `got-milk-campaign`                       | NEW            |
| 1997 | `apple-think-different-campaign`          | foothold · NEW |
| 1999 | `budweiser-whassup-ad`                    | NEW            |
| 2006 | `dove-evolution-film`                     | foothold · NEW |
| 2010 | `old-spice-man-your-man-could-smell-like` | foothold · NEW |
| 2022 | `coinbase-bouncing-qr-code-ad`            | foothold · NEW |

All 30 are new. The catalogue held the products and companies (`coca-cola-invented`,
`kodak-roll-film-camera`, `apple-macintosh-1984`) but not one card about the pitch.

Gates: size **30**, band 0 **20**, same-year pairs **0**, bunching **3 in 1914-1921** (the
limit), largest overlap **0**. The cards fall in 4 of 8 bins, which is advisory and expected:
advertising as a trade is a 19th- and 20th-century story. Bands move as the catalogue changes,
so re-measure rather than trust these figures:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending
```

## The edges argued

- **Cut for an uncertain year.** The coffee handbill (c.1652) is dated only approximately and
  is obscure. Nipper and His Master's Voice was painted in 1898-99 and trademarked in 1900, so
  any single year is a convention, and it sat a year from the Michelin Man.
- **Cut for fame in a crowded stretch.** The Campbell Kids (1904), Bulova's first TV commercial
  (1941), the Pepsi Challenge (1975) and Oreo's "Dunk in the Dark" tweet (2013) were each the
  weakest beat in their decade.
- **The long gap from 1704 to 1877 is real.** The spine found no single famous ad moment in
  that stretch: advertising was classified notices, not campaigns.
- **Easy by design.** The blind grader found most of these placeable from their text: a TV
  spot, a radio jingle or a viral film dates itself by its medium. That is why band 0 is 20.

## Open fact-check points

The fact check found nothing to fix and nothing unsupported. Caveats it raised, for review:

- **Pears Bubbles**: the V&A gives 1886 for the purchase of Millais's painting; Smarthistory
  gives 1887.
- **Marlboro Man**: 1954 is when Leo Burnett conceived the campaign. The Smithsonian and the
  Boston Globe date the first ads to 1955.
- **Morton Salt**: most sources give 1914 for the slogan and umbrella girl; one says 1911.
- **Caxton**: the handbill is catalogued c.1476-77. It is the earliest surviving printed English
  advertisement, which the description words as "among the earliest".
- **Got Milk?**: the slogan is 1993, but the celebrity milk moustaches the description mentions
  came in 1994-95.
- **Dove Evolution** (2006) was not searched by the fact checker.

The region tags were written without searches. `vw-think-small-ad` carries Germany beside the
United States for the car's maker, a weak tag; `coke-hilltop-teach-the-world` carries Italy for
the filming location.
