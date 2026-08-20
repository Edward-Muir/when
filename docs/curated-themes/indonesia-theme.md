# The Indonesia theme

A 36-card curated theme spanning the archipelago from Toba to the 2004 tsunami. **Authored but
not publishable yet** — 14 of its cards are new events with no Cloudinary art, and
`loadAllEvents` hides anything without it. This note is the handover: what the theme is, why
these 36 and not others, and the two commands that finish it.

## Status

|                  |                                                            |
| ---------------- | ---------------------------------------------------------- |
| Events authored  | 14, in `public/events/*.json`                              |
| Images needed    | the same 14 — nothing else blocks it                       |
| Theme published  | no                                                         |
| Projected bands  | `5 / 6 / 10 / 15` — passes `MIN_BAND_ZERO = 5` **exactly** |
| Projected spread | `8/8` bins — passes `MIN_OCCUPIED_BINS = 6`                |

Both numbers are projections: they were computed by running
`scripts/themes/catalogue.js`'s own index over the playable catalogue **plus** the 14 pending
slugs, which is what the validator will see once the art lands. They are not what
`npm run theme:gap` reports today — it filters to playable events, so the 14 are invisible to it
and the theme scores 22 cards.

## Why a theme at all

There is no other mechanism. Custom filters by difficulty, category and era only
(`src/components/FilterControls.tsx`) — events carry no region, no tags, no free text — and a
challenge code packs filter bitmasks plus a seed, not an event list
(`src/utils/challengeCode.ts`). A hand-picked set of slugs can only be played as a curated daily
theme. 36 is the size at which a theme is still clearable; see [index.md](index.md), Sizing.

## The 36

Paste as `eventNames` into the workflow's `theme` input. **New** = authored here, awaiting art.

|   Year | Slug                            |          |
| -----: | ------------------------------- | -------- |
| -74000 | `toba-supereruption`            |          |
|  -6000 | `chickens-domesticated`         | foothold |
|  -3000 | `austronesian-expansion-begins` |          |
|  -1000 | `spice-trade-incense-route`     | foothold |
|   -300 | `dong-son-drums-nusantara`      | **new**  |
|    400 | `kutai-yupa-inscriptions`       | **new**  |
|    683 | `srivijaya-empire`              |          |
|    825 | `borobudur-temple`              |          |
|    850 | `prambanan-temple`              |          |
|   1019 | `airlangga-unites-java`         | **new**  |
|   1267 | `pasai-sultanate`               |          |
|   1293 | `majapahit-empire-founded`      |          |
|   1400 | `srivijaya-decline`             |          |
|   1478 | `demak-sultanate-founded`       | **new**  |
|   1522 | `magellan-circumnavigation`     | foothold |
|   1550 | `molucca-spice-island-trade`    |          |
|   1587 | `mataram-empire`                |          |
|   1602 | `voc-dutch-east-india`          | foothold |
|   1619 | `batavia-founded`               | **new**  |
|   1667 | `treaty-breda`                  |          |
|   1755 | `treaty-of-giyanti`             | **new**  |
|   1799 | `voc-dissolved`                 | **new**  |
|   1815 | `tambora-eruption`              |          |
|   1825 | `java-war-diponegoro`           | **new**  |
|   1859 | `wallace-line-described`        |          |
|   1883 | `krakatoa-eruption`             |          |
|   1891 | `java-man-discovered`           |          |
|   1908 | `budi-utomo-founded`            | **new**  |
|   1928 | `sumpah-pemuda-youth-pledge`    | **new**  |
|   1942 | `japanese-occupation-indies`    | **new**  |
|   1949 | `indonesia-independence`        |          |
|   1955 | `bandung-conference`            |          |
|   1967 | `suharto-new-order`             | **new**  |
|   1975 | `indonesia-invades-east-timor`  | **new**  |
|   1998 | `fall-of-suharto`               | **new**  |
|   2004 | `indian-ocean-tsunami`          | foothold |

## The five footholds are the whole difficulty problem

`MIN_BAND_ZERO = 5` wants five cards in the catalogue's easiest global quartile, and Indonesian
history barely has five. Measured: **no `medium` card can reach band 0 from any year in this
theme's range** — the composite score needs `easy` (`RECOGNITION_RANK` 0) plus a sparse
neighbourhood. So the footholds could not come from grading the new events generously; every one
of the 14 is labelled on recognition and inferability as the rubric requires, and none of them is
globally easy.

They came instead from widening what counts as an Indonesian card:

- `chickens-domesticated` and `spice-trade-incense-route` are regional, not specifically
  Indonesian — junglefowl domestication in Southeast Asia, and the routes that carried Moluccan
  cloves west. They are in the theme **because they are easy and they open it**, and that is a
  fair trade for a deck whose first five cards are otherwise unplaceable.
- `magellan-circumnavigation` and `voc-dutch-east-india` are the archipelago seen from outside.
- `indian-ocean-tsunami` is the only globally-easy event that is squarely Indonesian.

The margin is exactly zero. **Dropping any one of those five fails validation**, and swapping in
another Indonesian card will not replace it — there isn't one. If you want more headroom, the
lever is a new _globally easy_ card in a sparse year, not a relabelled existing one.

## Deliberate omissions

These surface in a keyword sweep and were left out on purpose; re-adding them makes the deck
worse, not more complete.

- **Same-year collisions.** `borobudur-construction` (800) and `java-temple-sculpture` (800)
  against `borobudur-temple` (825); `javanese-court-dance` shares 1400 with `srivijaya-decline`;
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

## Finishing it

**1. Images for the 14 new slugs.** The pipeline needs `GEMINI_API_KEY` and `CLOUDINARY_*`, and
its working tree (`../when-images`) is not in this repo — confirm it still runs before starting.

```bash
python scripts/generate_images.py --dry-run     # prompts only, no API calls
python scripts/generate_images.py
node scripts/update-cloudinary-urls.js          # writes image_url/color/text_color back
npm run theme:gap -- --slugs <the 36>           # now sees all 36; confirm 5/x/x/x and 8/8
```

Until `update-cloudinary-urls.js` has run, the 14 are inert: they sit in the JSON, `loadAllEvents`
drops them, and the publish validator reports them as unresolved slugs.

**2. Publish.** GitHub → Actions → **Publish theme** → `workflow_dispatch`, `mode: validate`
first, read the report, then `mode: publish`.

```json
{ "id": "indonesia", "name": "Indonesia", "eventNames": [ ...the 36... ], "dates": ["YYYY-MM-DD"] }
```

`name` is capped at 20 characters. Pick a date at least two days out — `D` opens at `D-1 10:00Z`
and publishing refuses a date that has already opened somewhere. Never rewrite a date that is
today or past; `dailyRecency.ts` replays the last 28 days.
