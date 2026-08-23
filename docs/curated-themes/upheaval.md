# The upheaval theme — "When the Earth Moved"

A 36-card curated theme of the ground failing: eruptions, earthquakes and tsunamis, from Toba
to the Turkey-Syria quake. This note is why these 36 and not others.

## Scope rule

A card is in only if **it is an eruption, an earthquake or a tsunami**. Geological only.

Excluded on principle, however dramatic: storms, floods, droughts, famines, wildfires, wars,
and anything merely _named_ after a disaster. A landslide or a caldera collapse is in when it
is seismic or volcanic in origin (Huascarán, Unzen), and out when it is not (Storegga's
submarine slide sits at the edge of the rule and was dropped for era reasons anyway — see
omissions).

The spine is historical — roughly Thera to today. `toba-supereruption` is the single
deep-prehistory anchor, earning its place exactly as it does in the Indonesia theme: nothing
else in the catalogue is anywhere near it, so it is free spread and a free foothold.

## The 36

Paste as `eventNames` into the workflow's `theme` input. `NEW` = authored for this theme and
not yet illustrated; `foothold` = band 0, the cards the opening hand depends on.

|   Year | Slug                          |                |
| -----: | ----------------------------- | -------------- |
| -74000 | `toba-supereruption`          | foothold       |
|  -1600 | `thera-eruption`              | foothold       |
|   -464 | `sparta-earthquake`           | NEW            |
|   -373 | `helike-earthquake`           | NEW            |
|   -226 | `rhodes-earthquake-colossus`  | NEW · foothold |
|     79 | `vesuvius-eruption`           | foothold       |
|    180 | `hatepe-eruption`             |                |
|    365 | `365-crete-earthquake`        |                |
|    536 | `volcanic-winter-536`         |                |
|    856 | `damghan-earthquake`          |                |
|   1138 | `aleppo-earthquake`           |                |
|   1257 | `samalas-eruption`            |                |
|   1356 | `basel-earthquake`            | NEW            |
|   1498 | `meio-nankai-earthquake`      | NEW            |
|   1556 | `shaanxi-earthquake`          |                |
|   1600 | `huaynaputina-eruption`       |                |
|   1669 | `etna-catania-eruption`       | NEW            |
|   1700 | `cascadia-earthquake-1700`    |                |
|   1755 | `lisbon-earthquake`           |                |
|   1783 | `laki-eruption`               |                |
|   1792 | `unzen-eruption`              |                |
|   1815 | `tambora-eruption`            |                |
|   1855 | `ansei-earthquake`            |                |
|   1883 | `krakatoa-eruption`           |                |
|   1902 | `mount-pelee-eruption`        | NEW            |
|   1906 | `san-francisco-earthquake`    | foothold       |
|   1923 | `great-kanto-earthquake`      |                |
|   1934 | `nepal-bihar-earthquake-1934` |                |
|   1943 | `paricutin-volcano-born`      | NEW            |
|   1960 | `valdivia-earthquake`         |                |
|   1976 | `tangshan-earthquake`         |                |
|   1980 | `mount-st-helens`             | foothold       |
|   1991 | `pinatubo-eruption`           |                |
|   2004 | `indian-ocean-tsunami`        | foothold       |
|   2011 | `tohoku-earthquake`           |                |
|   2023 | `turkey-syria-earthquake`     |                |

Bands and spread move whenever the catalogue does, so read them rather than trusting this
note. While the eight new cards are unillustrated they are invisible to a bare run:

```bash
node scripts/theme-gap.js --slugs <the 36 above, comma-separated> \
  --include-pending --extra <staging>/upheaval.json
```

At the time of writing: size 36, bins 8/8 `[5 5 3 5 5 4 3 6]`, band 0 = 7, same-year pairs 0.

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how _sparse_ the timeline is around the year, so the
seven footholds are the cards that are easy **to place**, not the ones a reader would call easy.

- `toba-supereruption` and `thera-eruption` are pure sparsity. Nothing competes with them for
  their stretch of the timeline, so a player who knows only "very old" places them correctly.
- `vesuvius-eruption`, `san-francisco-earthquake`, `mount-st-helens` and
  `indian-ocean-tsunami` are the four disasters in this theme that are globally famous _and_
  sit in a year most players can name. They are the theme's real opening hand.
- `rhodes-earthquake-colossus` is the interesting one, and the reason the margin over
  `MIN_BAND_ZERO` is two rather than zero. It was authored for the spine (the quake that felled
  the Colossus is a canonical beat and the catalogue only had `colossus-rhodes`, the
  _completion_), and it landed in band 0 because the Hellenistic stretch is thinly populated
  and the Colossus is one of very few objects from it that everybody has heard of. It is a
  worked example of the index's advice: the lever for band 0 is a genuinely famous card in an
  uncrowded stretch of years, not a relabelled existing one.

Everything from 180 to 1600 is band 2-3 without exception — the theme's whole middle is
regional disasters that only enthusiasts date. That is unavoidable and is why the six
non-Rhodes footholds cannot be traded away.

## Deliberate omissions

The keyword sweep (`\berupt|\bearthquake|\btsunami|\bvolcan|pyroclast|\bseismic|\bquake|caldera`)
returns 78 playable events. Most were rejected. These are the ones worth recording.

**Out of scope.** `zhang-heng-seismoscope` (132) is an instrument, not an earthquake — a lovely
card that the scope rule excludes, and the closest call here. `richter-scale-developed` (1935)
is the same case. `year-without-summer` (1816) and `russian-famine-troubles` (1601) are the
_climatic_ consequences of Tambora and Huaynaputina, i.e. famines; both parent eruptions are in
the deck instead. `lake-nyos` (1986) is a limnic CO2 release from a volcanic lake, not an
eruption. `fukushima-disaster` (2011) is a nuclear accident downstream of a tsunami.

**Same-year collisions.** `pompeii` shares 79 with `vesuvius-eruption` (the eruption is the
card this theme wants). `calabria-earthquake` shares 1783 with `laki-eruption`.
`valparaiso-earthquake` shares 1906 with San Francisco. `tonghai-earthquake` shares 1970 with
`peru-earthquake`. `nevado-del-ruiz` shares 1985 with `mexico-city-earthquake`.
`fukushima-disaster` and `christchurch-earthquake` both share 2011 with `tohoku-earthquake`.
`iceland-eyjafjallajokull-eruption` — a band-0 card, and a real loss — shares 2010 with
`haiti-earthquake`, and both sit one year from Tōhoku, which no theme can survive.

**Near-year crowding, dropped.** `messina-earthquake` (1908) and `mount-tarawera-eruption`
(1886) sit 2 and 3 years from San Francisco and Krakatoa. `antioch-earthquake-526` is 10 years
from `volcanic-winter-536` and is also the second Antioch quake in a sweep that offers three.
`kashmir-earthquake` (2005) is one year from the Indian Ocean tsunami; `northridge-earthquake`
(1994) one year from Kobe. `alaska-earthquake` (1964) is 4 years from Valdivia — the two
largest quakes ever instrumented, and keeping both would have been a coin flip between them.
`new-madrid-earthquakes` (1811) is 4 years from Tambora and lost that argument.
`ashgabat-earthquake` (1948) is 5 years from Parícutin. `chile-earthquake-1730` sits between
Cascadia and Lisbon with nothing of its own to say.

**Crowded pairs kept anyway.** Three survive, because in each case both cards are canonical and
there is no spare beat to swap in:

- `mount-pelee-eruption` (1902) / `san-francisco-earthquake` (1906) — 4 years. San Francisco is
  a required foothold; Pelée is the deadliest volcanic disaster of its century and the theme
  cannot omit it.
- `tangshan-earthquake` (1976) / `mount-st-helens` (1980) — 4 years. St. Helens is a foothold;
  Tangshan is the deadliest earthquake of its century. Dropping Tangshan for
  `peru-earthquake` (1970) would have spaced the decade perfectly and was rejected as trading a
  canonical beat for tidiness.
- `indian-ocean-tsunami` (2004) / `tohoku-earthquake` (2011) — 7 years, and the two defining
  tsunamis of living memory.

**Redundancy.** `syria-earthquake-medieval` (1202) against `aleppo-earthquake` (1138) — same
region, same century-and-a-bit, and Aleppo is the better-known card. `quetta-earthquake` (1935)
against `nepal-bihar-earthquake-1934`, one year apart, the latter the larger event.
`nepal-earthquake` (2015) against `nepal-bihar-earthquake-1934` plus a crowded 2011-2023 tail.
`sichuan-earthquake` (2008), `haiti-earthquake` (2010), `armenian-earthquake` (1988),
`iran-earthquake-manjil` (1990), `guatemala-earthquake` (1976), `mexico-city-earthquake` (1985)
and `kobe-earthquake` (1995) are all real events that lost their slot to spacing — the late
20th century is where this theme is catalogue-rich and calendar-poor.

**False positives** the sweep dragged in: `roman-concrete` (volcanic ash as an ingredient),
`donatist-controversy`, `nika-riots`, `thirty-years-war-begins`, `english-civil-war-start`,
`quaker-founding`, `pennsylvania-founded`, `seven-years-war-start`, `mexican-american-war`,
`la-riots`, `second-intifada`, `iran-green-movement`, `angolan-civil-war`,
`sudan-civil-war-2023` — all matched on figurative "erupted" or "shook".

**Existing slugs rejected in favour of a new card.** `colossus-rhodes` (280 BCE) is the
_completion_ of the statue, not the quake that felled it; `rhodes-earthquake-colossus` (226 BCE)
was written instead and sits 54 years later, so both could in principle coexist — only the new
one belongs to this theme.

## What is still missing from the catalogue

Authoring stopped at 36. These are real gaps, written down rather than filled because each one
collides with a card already in the deck:

- **Hunga Tonga-Hunga Haʻapai** (2022) — the most spectacular eruption of the century and the
  most painful absence. One year from `turkey-syria-earthquake`, which already exists and is
  illustrated. If the tail is ever re-cut, this is the first card to write.
- **Jōgan / Sanriku tsunami** (869) — the Tōhoku precursor, and a beautiful narrative pairing
  with the 2011 card. Thirteen years from `damghan-earthquake`, which holds the 9th-century slot.
- **İzmit** (1999) — 4 years from Kobe and 5 from the Indian Ocean tsunami; there is no room in
  that decade for a third card.
- **Mexico City** (1985) and **Nevado del Ruiz / Armero** (1985) exist and collide with each
  other; the year is unusable either way.
- **Cascadia's Japanese "orphan tsunami"** is folded into `cascadia-earthquake-1700` rather than
  given its own card.
- Also unwritten and unplaced: the Antioch earthquake of 115 as distinct from 526, the Hongdong
  earthquake (1303), the Shimabara-Amakusa sequence beyond Unzen, Krafla and Surtsey (1963,
  islands being born), Mount Katmai/Novarupta (1912), Santa María (1902, same year as Pelée),
  and the Chilean quake of 1730 as a Valparaíso card rather than a filler.
