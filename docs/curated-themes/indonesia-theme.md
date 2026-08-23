# The Indonesia theme

A 36-card curated theme spanning the archipelago from Toba to the 2004 tsunami. This note is
why these 36 and not others — the constraint that shaped the list, and the cards that were
deliberately left out.

## Why a theme at all

There is no other mechanism. Custom filters by difficulty, category and era only
(`src/components/FilterControls.tsx`) — events carry no region, no tags, no free text — and a
challenge code packs filter bitmasks plus a seed, not an event list
(`src/utils/challengeCode.ts`). A hand-picked set of slugs can only be played as a curated daily
theme. 36 is the size at which a theme is still clearable; see [index.md](index.md), Sizing.

## The 36

Paste as `eventNames` into the workflow's `theme` input.

|   Year | Slug                            |          |
| -----: | ------------------------------- | -------- |
| -74000 | `toba-supereruption`            | foothold |
|  -6000 | `chickens-domesticated`         | foothold |
|  -3000 | `austronesian-expansion-begins` |          |
|  -1000 | `spice-trade-incense-route`     | foothold |
|   -300 | `dong-son-drums-nusantara`      |          |
|    400 | `kutai-yupa-inscriptions`       |          |
|    683 | `srivijaya-empire`              |          |
|    800 | `borobudur-construction`        |          |
|    850 | `prambanan-temple`              |          |
|   1019 | `airlangga-unites-java`         |          |
|   1267 | `pasai-sultanate`               |          |
|   1293 | `majapahit-empire-founded`      |          |
|   1400 | `srivijaya-decline`             |          |
|   1478 | `demak-sultanate-founded`       |          |
|   1522 | `magellan-circumnavigation`     | foothold |
|   1550 | `molucca-spice-island-trade`    |          |
|   1587 | `mataram-empire`                |          |
|   1602 | `voc-dutch-east-india`          | foothold |
|   1619 | `batavia-founded`               |          |
|   1667 | `treaty-breda`                  |          |
|   1755 | `treaty-of-giyanti`             |          |
|   1799 | `voc-dissolved`                 |          |
|   1815 | `tambora-eruption`              |          |
|   1825 | `java-war-diponegoro`           |          |
|   1859 | `wallace-line-described`        |          |
|   1883 | `krakatoa-eruption`             |          |
|   1891 | `java-man-discovered`           |          |
|   1908 | `budi-utomo-founded`            |          |
|   1928 | `sumpah-pemuda-youth-pledge`    |          |
|   1942 | `japanese-occupation-indies`    |          |
|   1949 | `indonesia-independence`        |          |
|   1955 | `bandung-conference`            |          |
|   1967 | `suharto-new-order`             |          |
|   1975 | `indonesia-invades-east-timor`  |          |
|   1998 | `fall-of-suharto`               |          |
|   2004 | `indian-ocean-tsunami`          |          |

Read the current band and spread figures from the catalogue rather than from here — they move
whenever the catalogue does, because a card's band depends on how crowded its neighbourhood is:

```bash
npm run theme:gap -- --slugs <the 36 above, comma-separated>
```

## The footholds are the whole difficulty problem

`MIN_BAND_ZERO` wants a handful of cards in the catalogue's easiest global quartile, and a
regional theme barely has them. Band 0 is a composite of the `difficulty` label and how sparse
the timeline is around the event, so the marked footholds are not the cards a reader would call
easy — they are the cards that are easy _to place_, which is a different property and the only
one the opening hand cares about.

They came from widening what counts as an Indonesian card:

- `chickens-domesticated` and `spice-trade-incense-route` are regional, not specifically
  Indonesian — junglefowl domestication in Southeast Asia, and the routes that carried Moluccan
  cloves west. They are in the theme **because they open it**, and that is a fair trade for a
  deck whose first five cards are otherwise unplaceable.
- `toba-supereruption` earns its place on sparsity: nothing else in the catalogue is anywhere
  near 74,000 BCE.
- `magellan-circumnavigation` and `voc-dutch-east-india` are the archipelago seen from outside.
- `indian-ocean-tsunami` is the only globally-easy event that is squarely Indonesian.

The margin over `MIN_BAND_ZERO` is one or two cards, so **dropping a foothold is what fails
validation**, and swapping in another Indonesian card will not replace it — there isn't one. If
more headroom is ever needed, the lever is a new globally-easy card in a sparse year, not a
relabelled existing one.

## Deliberate omissions

These surface in a keyword sweep and were left out on purpose; re-adding them makes the deck
worse, not more complete.

- **Same-year collisions.** `java-temple-sculpture` (800) against `borobudur-construction` (800);
  `javanese-court-dance` shares 1400 with `srivijaya-decline`;
  `majapahit-expansion`, `majapahit-administrative-system` and `majapahit-maritime-trade` are all
  dated 1350. A player cannot order cards that share a year — it is a coin flip, not a placement.
- **Near-year crowding.** `aceh-sultanate` (1607) is 5 years from the VOC card;
  `banjarmasin-sultanate` (1526) 4 years from Magellan; `bali-bombings` (2002) and
  `east-timor-independence-vote` (1999) crowd the 2004 tsunami; `samalas-eruption` (1257) sits
  10 years from Pasai and would have been a fourth volcano.
- **Redundancy.** `majapahit-empire` (1365, the peak) against `majapahit-empire-founded` (1293);
  `spice-monopoly-nutmeg` (1621) against `batavia-founded` (1619), where Batavia is the more
  foundational card and Banda is still covered by the Molucca and Breda entries;
  `wallace-evolution-theory` (1858) against `wallace-line-described` (1859), which is the
  Indonesia-specific one.
- **False positives** the sweep drags in: Aryabhata's decimal system, a Baltimore dental school,
  Morse's telegraph, the Amsterdam stock exchange, Madagascar's settlement, the Malacca
  sultanate (Malaysian), Sepik River art (Papua New Guinea).

## What is still missing from the catalogue

Authoring stopped at 36. If the theme is ever widened, these are real gaps, not filler:
the Banda massacre (1621), Raffles' British interregnum and the rediscovery of Borobudur
(1811-14), the Cultivation System (1830), _Max Havelaar_ (1860), the Aceh War (1873), Sarekat
Islam (1912), the Battle of Surabaya (1945), Konfrontasi (1963), the 1965 killings, and the
Helsinki accord that ended the Aceh insurgency (2005). Most collide with a card already in the
36, which is why they were not written.
