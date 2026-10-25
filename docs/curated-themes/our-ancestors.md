# The Our Ancestors theme

A 30-card curated theme on the human family tree, from the first ape that may have walked
upright to the first people in the Americas: hominin species, each dated to the start of its
fossil range, and the milestones of human evolution (walking upright, stone tools, fire, leaving
Africa). This note is why these 30 and not others.

## The scope rule

An event is in only if **it is a human species or ancestor, or a milestone of human evolution.**

- **Species** are dated to when they lived, at the start of the fossil range, never to the year
  the fossil was found. The discovery stories (Lucy unearthed, the Taung Child, Rising Star) are
  Bone Hunters' cards.
- **Milestones** are what hominins became, not what Homo sapiens made. Stone tools before Homo,
  the Oldowan and Acheulean industries and the first controlled fire are in; art, ornaments,
  burial and the other firsts of our own species belong to Stone Age Firsts.
- **Dispersals** are in when they change where the human family lives: out of Africa, into the
  Levant, Europe, Australia and the Americas.

Edges argued rather than assumed:

- **`first-stone-tools`** (Lomekwi) is in although no species is named: it is the milestone of
  toolmaking before Homo, which is the point of the card.
- **`last-homo-erectus-java`** and **`last-neanderthals-vanish`** are in as endings of species.
  A last appearance is as much a fact of a species' life as its first.
- **`sapiens-neanderthal-interbreeding`** is in as a milestone of human evolution: it is why most
  people alive today carry Neanderthal DNA.
- **`humans-enter-europe`** stands in for the Bacho Kiro beat: the same event in the same year.

Cut from the spine, with the reconciler's reasons: Ardipithecus kadabba, Kenyanthropus and
Paranthropus aethiopicus (weak fame, in the crowded early stretch), Australopithecus sediba
(weak fame, one of four beats within 200,000 years), Homo ergaster (duplicates Homo erectus),
Apidima (identification debated; Misliya kept as the early beat outside Africa) and Gesher Benot
Ya'aqov (a second fire beat; Wonderwerk kept).

## The 30

|     Year | Slug                                 |                |
| -------: | ------------------------------------ | -------------- |
| -7000000 | `sahelanthropus-tchadensis`          | foothold · NEW |
| -6000000 | `orrorin-tugenensis`                 | foothold · NEW |
| -4400000 | `ardipithecus-ramidus-appears`       | foothold · NEW |
| -4200000 | `australopithecus-anamensis-appears` | foothold · NEW |
| -3660000 | `laetoli-footprints`                 | foothold · NEW |
| -3300000 | `first-stone-tools`                  | foothold       |
| -3200000 | `lucy-australopithecus-lived`        | foothold       |
| -3000000 | `australopithecus-africanus-appears` | foothold · NEW |
| -2600000 | `oldowan-stone-tools`                | foothold · NEW |
| -2400000 | `homo-habilis`                       | foothold       |
| -2300000 | `paranthropus-boisei-appears`        | foothold · NEW |
| -2000000 | `homo-erectus-stands-tall`           | foothold · NEW |
| -1800000 | `dmanisi-humans-leave-africa`        | foothold · NEW |
| -1760000 | `advanced-acheulean-stone-tools`     | foothold       |
| -1200000 | `homo-antecessor-atapuerca`          | foothold · NEW |
| -1000000 | `wonderwerk-cave-fire`               | foothold · NEW |
|  -700000 | `homo-heidelbergensis-emerges`       | foothold       |
|  -400000 | `neanderthals-emerge-europe`         | foothold · NEW |
|  -335000 | `homo-naledi-appears`                | foothold · NEW |
|  -300000 | `jebel-irhoud-homo-sapiens`          | foothold · NEW |
|  -180000 | `misliya-cave-sapiens`               | foothold · NEW |
|  -160000 | `denisovans-emerge`                  | foothold · NEW |
|  -117000 | `last-homo-erectus-java`             | foothold · NEW |
|  -100000 | `homo-floresiensis-hobbit`           | foothold · NEW |
|   -67000 | `homo-luzonensis-appears`            | foothold · NEW |
|   -65000 | `humans-reach-australia`             | foothold       |
|   -50000 | `sapiens-neanderthal-interbreeding`  | foothold · NEW |
|   -45000 | `humans-enter-europe`                | foothold       |
|   -40000 | `last-neanderthals-vanish`           | foothold · NEW |
|   -23000 | `humans-reach-the-americas`          | foothold       |

22 of the 30 were authored for this theme; 8 already existed as the same event in the same year.

Gates: size **30**, band 0 **30**, bins **1/8** (advisory), same-year pairs **0**, largest overlap
**3** (before-us: `lucy-australopithecus-lived`, `homo-habilis`, `homo-heidelbergensis-emerges`),
then 2 with ends-of-the-earth. A card's band moves whenever the catalogue around its year does,
so re-measure rather than trust these figures:

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

## Why every card is a foothold

Band 0 blends the `difficulty` label with how sparse the catalogue is around a year, and the
deep past is the sparsest stretch of the timeline: a few dozen cards across seven million years.
So every card here is easy to place against the rest of the catalogue, and the deck's challenge
is entirely internal, ordering hominins against each other. That is the deck's character, not a
defect, and it is why a single spread bin is expected.

## Fact-check flags still open

- **`dmanisi-humans-leave-africa`**, description: "the oldest known people outside Africa".
  Dmanisi holds the oldest human bones outside Africa, but stone tools at Shangchen, China are
  dated to about 2.1 million years ago, so the claim is contested. "Among the oldest" would be
  safe.

Caveats the fact check kept as ok: Sahelanthropus's upright walking is disputed (the description
hedges, the name does not); newer dating may push Australopithecus africanus back to about 3.7
million years; Homo antecessor's species assignment is provisional.
