# The Material World theme

A 30-card curated theme on materials people learned to make, from fired clay and smelted copper
to plastics, float glass and graphene. This note is why these 30 and not others.

## The scope rule

An event is in only if **it is a material people learned to make** (a new stuff to make things
from), including the process that first produced it.

Edges, from the theme's boundary:

- Fibres such as nylon belong to Dress Code, tall-building steel to Tallest in the World, and
  writing surfaces to Letters & Type. Bessemer steel is in because it is the material itself, not
  a skyscraper; it overlaps one card with Skyline.
- `graphene-isolated` overlaps one card with Eureka. The overlap gate allows up to four.
- Ten spine beats were cut in reconciling: wootz steel, lead crystal, Huntsman steel, puddled iron,
  celluloid, Pyrex, PVC, aerogel, PET and nanotubes. Several were already near a kept card, and
  the catalogue's existing cards were used where they named the same event in the same year.

## The 30

|   Year | Slug                           |        |
| -----: | ------------------------------ | ------ |
| -27000 | `fired-clay-figurines-venus` | NEW |
| -10000 | `lime-plaster-burning` | NEW |
| -5000 | `first-copper-smelting-balkans` | NEW |
| -4600 | `varna-gold-grave-treasure` | NEW |
| -3500 | `mesopotamian-kiln-fired-bricks` | NEW |
| -3300 | `bronze-alloyed-sumer` | NEW |
| -2500 | `glass-made-mesopotamia` | NEW |
| -1600 | `mesoamerican-rubber-curing` | NEW |
| -1400 | `hittite-iron-mastery` | NEW |
| -500 | `cast-iron` | reused |
| -200 | `roman-concrete-perfected` | NEW |
| -50 | `glassblowing-invented-syria` | NEW |
| 618 | `tang-true-porcelain` | NEW |
| 1450 | `murano-cristallo-glass` | NEW |
| 1708 | `bottger-european-porcelain` | NEW |
| 1709 | `darby-coke-smelting` | NEW |
| 1824 | `portland-cement` | reused |
| 1839 | `vulcanized-rubber` | reused |
| 1856 | `bessemer-steel-process` | reused |
| 1862 | `parkesine-first-plastic` | NEW |
| 1867 | `reinforced-concrete` | reused |
| 1886 | `hall-heroult-aluminum-process` | reused |
| 1907 | `bakelite-plastic` | reused |
| 1913 | `stainless-steel` | reused |
| 1933 | `polyethylene-discovered-icl` | NEW |
| 1938 | `teflon-discovered` | reused |
| 1954 | `synthetic-diamonds-ge` | NEW |
| 1959 | `pilkington-float-glass` | NEW |
| 1965 | `kevlar-invented` | reused |
| 2004 | `graphene-isolated` | reused |

19 of the 30 were authored for this theme and 11 reused from the catalogue.

Gates: size **30**, band 0 **18**, bins **8/8** (advisory), same-year pairs **0**, bunching 2 in
1708-1709, one shared card each with `eureka` and `skyline`. Band 0 moves whenever the catalogue
around a year does, so re-measure rather than trust these figures:

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

Seven pairs sit within 8 years (placement is mostly luck, kept on purpose): 1708/1709, 1856/1862,
1862/1867, 1907/1913, 1933/1938, 1954/1959 and 1959/1965. The blind grader rated most new cards
easy, so the deck leans easy at the open.

## Fact-check flags still unsupported

- `glass-made-mesopotamia`: the date and place of the first glass are contested.
- `hittite-iron-mastery`: iron in quantity around 1400 BCE is disputed; the Hittites had no secret
  monopoly on it.

Approximate dates: `fired-clay-figurines-venus` (-27000) is the midpoint of 29,000 to 25,000
years ago; `lime-plaster-burning` (-10000) is a rounded start for the earliest quicklime.
`varna-gold-grave-treasure` has an evidence window to -4340.
