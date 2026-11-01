# The Dress Code theme

A 30-card curated theme on clothes and the cloth they are cut from, from dyed flax fibres in a
Caucasus cave to a dress made of raw beef: garments, fabrics, fibres, the machines that spin
and weave them, and the fashion houses that design them. This note is why these 30 and not
others.

## The scope rule

An event is in only if **it is a garment, a fabric or a fashion house.** Spinning and weaving
machines and new fibres count, because they are how cloth is made. Engines and general factory
methods go to Made by Machine, the advertising behind a brand to Sell, Sell, Sell, and other new
materials to Material World.

Edges argued rather than assumed:

- **Footwear is out.** Converse's canvas sneaker (1917), Air Jordan (1985) and Crocs (2002) were
  on the spine and cut as borderline: shoes are worn, but they are not cut from cloth, and the
  scope line reads "garment, fabric or fashion house".
- **Leather-goods houses are out.** Hermès (1837) and Gucci (1921) began as a harness workshop
  and a luggage shop. Worth is in because his house founded haute couture outright.
- **The cotton gin is out.** It processes raw fibre rather than spinning or weaving it, so it
  belongs to Made by Machine (and the catalogue dates it 1794, a year off the spine's 1793).
- **`stiletto-three-piece-suit`** (1666) is reused for the spine's "Charles II introduces the
  waistcoat" beat: the same royal declaration in the same year.
- **`miniskirt-popularized`** (1965) is reused for the spine's "Mary Quant's miniskirt" (1964).
  The reconciler first wrote a new 1964 card; it was the same event, so the existing card was
  kept rather than duplicating it over a one-year disagreement about a gradual popularisation.

## The 30

|   Year | Slug                           |                |
| -----: | ------------------------------ | -------------- |
| -34000 | `dyed-flax-fibres-georgia`     | foothold · NEW |
|  -2700 | `silk-weaving-china-legend`    | foothold · NEW |
|   -130 | `silk-road-established`        | foothold       |
|    552 | `byzantine-silk-monopoly`      | foothold       |
|   1589 | `knitting-machine`             |                |
|   1666 | `stiletto-three-piece-suit`    |                |
|   1733 | `flying-shuttle-refinement`    |                |
|   1764 | `spinning-jenny-invented`      | foothold       |
|   1804 | `jacquard-loom`                |                |
|   1840 | `victoria-white-wedding-gown`  | foothold · NEW |
|   1846 | `sewing-machine`               | foothold       |
|   1856 | `synthetic-dye-mauveine`       |                |
|   1858 | `worth-paris-couture-house`    | NEW            |
|   1873 | `levis-blue-jeans-patent`      | foothold       |
|   1879 | `burberry-gabardine`           | NEW            |
|   1892 | `viscose-rayon-patented`       | NEW            |
|   1893 | `zipper-invented`              |                |
|   1914 | `modern-bra-patented`          |                |
|   1926 | `chanel-little-black-dress`    | foothold       |
|   1933 | `lacoste-polo-shirt`           | NEW            |
|   1935 | `nylon-invented`               |                |
|   1946 | `bikini-introduced`            | foothold       |
|   1947 | `diors-new-look`               | foothold       |
|   1961 | `hepburn-givenchy-black-dress` | foothold · NEW |
|   1962 | `monroe-sheer-birthday-dress`  | foothold · NEW |
|   1965 | `miniskirt-popularized`        | foothold       |
|   1974 | `von-furstenberg-wrap-dress`   | NEW            |
|   1994 | `diana-revenge-dress`          | foothold · NEW |
|   2000 | `jlo-green-versace-dress`      | foothold · NEW |
|   2010 | `lady-gaga-meat-dress`         | foothold · NEW |

17 reused, 13 new.

Gates: size **30**, band 0 **17**, bins **7/8** (advisory), same-year pairs **0**, bunching
**3 in 1926-1935** (limit 3), largest overlap **1** (automata: `jacquard-loom`; also
chinese-dynasties: `silk-road-established`). A card's band moves whenever the catalogue around
its year does, so re-measure rather than trust these figures:

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

## Why the footholds are the footholds

- **Deep-time sparsity**: the flax fibres, the silk legend, the Silk Road and the Byzantine
  silkworm theft sit where the catalogue is thin, so each orders easily.
- **Genuine fame**: Levi's jeans, the little black dress, the bikini, the New Look and the
  miniskirt, plus the six red-carpet dresses from 1961 to 2010, which the blind grader read as
  instantly placeable from their text alone.

17 against a floor of 5 makes this an easy-opening deck; the hard end is thin (one band-3
card, mauveine).

## Deliberate omissions

Cut from the 40-beat spine: the three footwear beats and two leather houses above; the cotton
gin; Elizabeth I's silk stockings (1561, thin fame); Arkwright's water frame (1769, keeps the
1760s to one machine); Amelia Bloomer's bloomers (1851, crowds the 1840s-50s); and Kate
Middleton's wedding dress (2011, one year from the meat dress and the least needed of the modern
dresses).

## Known crowding kept on purpose

Ten pairs sit inside the 8-year advisory window. The tightest, viscose (1892) and the zipper
(1893), the bikini (1946) and the New Look (1947), and Hepburn (1961) and Monroe (1962), are each
a fibre against a fastener or two very different garments, which players tell apart by story
rather than by year.

## Fact-check flags

The fact checker returned 13 ok, 0 fix, 0 unsupported. Softer points worth knowing:

- `dyed-flax-fibres-georgia` is approximate; sources give 31,000 to 36,000 years ago.
- `silk-weaving-china-legend` dates a legend (Leizu), not archaeology.
- `viscose-rayon-patented`: some pages say 1894; the Cross, Bevan and Beadle patent is 1892.
- `jlo-green-versace-dress`: the "inspired image search" claim is Eric Schmidt's own account,
  widely repeated but not independently documented.
