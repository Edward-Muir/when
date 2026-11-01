# The Before Columbus theme

A 30-card curated theme on the civilisations of Mexico, Central America and the Andes before
European contact, from the first farmed squash to the crowning of Moctezuma II. This note
explains why these 30 and not others.

## The scope rule

An event is in only if **it is from the pre-Columbian Americas**: the Olmec, Zapotec, Maya,
Teotihuacan, Toltec and Aztec worlds of Mesoamerica, and the Chavín, Moche, Tiwanaku, Chimú and
Inca worlds of the Andes, with the earliest farming that fed them.

Three neighbours own the edges:

- **Conquistadors** owns the Spanish conquest, so the deck ends at 1502. Moctezuma II is in for
  his crowning; his capture belongs to the conquest.
- **Native Nations** owns the peoples of the United States and Canada. Poverty Point and L'Anse
  aux Meadows were dropped from the spine on this rule (the second is a Norse camp besides).
- **Capitals Founded** owns Tenochtitlan's founding. Cusco's founding is in because it is a
  legend of Inca origins rather than a dated founding, and the card says so.

## The 30

|  Year | Slug                                |                |
| ----: | ----------------------------------- | -------------- |
| -8000 | `squash-domesticated-guila-naquitz` | NEW            |
| -3300 | `cacao-use-santa-ana-la-florida`    | NEW            |
| -1650 | `paso-de-la-amada-ballcourt`        | foothold       |
| -1200 | `san-lorenzo-olmec`                 |                |
|  -900 | `chavin-culture`                    |                |
|  -500 | `zapotecs-found-monte-alban`        | NEW            |
|  -300 | `el-mirador-maya-city-rises`        | NEW            |
|  -100 | `teotihuacan-city-founded`          | foothold · NEW |
|   -36 | `chiapa-de-corzo-long-count-stela`  | NEW            |
|   100 | `teotihuacan-pyramid-founded`       |                |
|   250 | `lord-of-sipan-burial`              | foothold · NEW |
|   378 | `teotihuacan-conquers-tikal`        | foothold · NEW |
|   426 | `copan-dynasty-founded`             | NEW            |
|   500 | `tiwanaku-monumental-center`        |                |
|   550 | `teotihuacan-burned-collapse`       | foothold · NEW |
|   562 | `calakmul-defeats-tikal`            | NEW            |
|   615 | `palenque-pacal-accession`          |                |
|   683 | `pakal-tomb-sealed-palenque`        | NEW            |
|   695 | `tikal-calakmul-war`                |                |
|   732 | `tikal-temple-i-built`              | foothold · NEW |
|   850 | `chan-chan-rises`                   | foothold · NEW |
|   987 | `chichen-itza-rises`                | NEW            |
|  1200 | `cusco-founded-legend`              | foothold · NEW |
|  1428 | `aztec-empire`                      | foothold       |
|  1438 | `pachacuti-becomes-inca`            | foothold · NEW |
|  1450 | `machu-picchu-construction`         | foothold       |
|  1470 | `inca-conquer-chimu`                | foothold · NEW |
|  1473 | `tenochtitlan-conquers-tlatelolco`  | foothold · NEW |
|  1487 | `templo-mayor-dedicated`            | foothold · NEW |
|  1502 | `moctezuma-ii-crowned`              | foothold · NEW |

21 of the 30 are new. The catalogue held the broad strokes (the Olmec, Chavín, Tiwanaku, the
Aztec Empire, Machu Picchu) but few named moments: a conquest, a burial, a coronation.

Gates: size **30**, band 0 **15**, same-year pairs **0**, bunching **2** in 1470-1473, largest
overlap **1** (rise-of-empires, via `aztec-empire`). Spread is 4 of 8 bins, advisory and
expected for a theme that ends in 1502. Bands move as the catalogue changes, so re-measure
rather than trust these figures:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending
```

## The edges argued

- **One card per event.** A spine beat whose event already had a card at another year was cut
  rather than written twice: Caral (`caral-civilization`), the Nazca Lines (`nazca-lines`) and
  the Wari expansion. The Paso de la Amada ballcourt was reused although the spine said -1600
  and the card says -1650: both are the approximate date of the same court.
- **Cut for fame.** The Bonampak murals, the last Classic Maya Long Count date, the Toltec
  founding of Tollan, Tula's burning, Acamapichtli, Moctezuma I, the fall of Mayapán and Topa
  Inca's accession. Copán's dynasty and Calakmul's defeat of Tikal were kept from the spares to
  fill the Classic Maya stretch.
- **Tikal against Calakmul twice.** `calakmul-defeats-tikal` (562) and `tikal-calakmul-war`
  (695) are the two halves of one rivalry, 133 years apart, and each is a distinct turn.
- **Kept close on purpose.** `inca-conquer-chimu` (1470) and `tenochtitlan-conquers-tlatelolco`
  (1473) sit 3 years apart, which theme-gap flags as luck-prone. They are on different
  continents, and both are footholds, so the pair costs little.

## Open fact-check points

- **`lord-of-sipan-burial`** (250): the year is unsupported. Sources give about 290 (a
  radiocarbon date), about 300 and about 350.
- **`chichen-itza-rises`** (987): the year is unsupported. 987 is a traditional date that
  sources attach to different events (Itza control, a Toltec takeover, the Mayapán league); the
  city's rise is usually placed from about 600 through the 900s.
- `teotihuacan-city-founded` (-100) and `el-mirador-maya-city-rises` (-300) were passed without
  a direct source in the search results; both rest on Wikipedia's commonly cited dates.
