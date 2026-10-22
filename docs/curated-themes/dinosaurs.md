# The Dinosaurs theme

A 30-card curated theme on the dinosaurs themselves, from the first possible dinosaur to the
asteroid that ended their reign. Each animal is dated to the start of its fossil range. This
note explains why these 30 and not others.

## The scope rule

An event is in only if **it is a dinosaur, dated to when it lived, or a turning point in the
dinosaurs' own story.**

- **The animals**: one card per genus, dated to the start of its fossil range. The card's
  evidence window runs to the end of that range, so any placement inside the span the animal
  is known from counts as correct.
- **The bookends**: the first dinosaurs and the asteroid. Archaeopteryx counts as the first
  bird, a dinosaur's own turning point.

Two neighbours own the edges:

- **Bone Hunters** owns the discovery of dinosaurs, so no card here is a dig, a naming or a
  museum. Megalosaurus is in as an animal. Its 1824 naming belongs to Bone Hunters.
- **Before Us** owns the life around the dinosaurs: early mammals, pterosaurs, sea reptiles and
  flowering plants. The deck shares three cards with it: `first-dinosaurs-appear`,
  `first-birds-archaeopteryx` and `dinosaur-extinction`. Those are the bookends both themes need.

## The 30

|       Year | Slug                                |                |
| ---------: | ----------------------------------- | -------------- |
| -243000000 | `first-dinosaurs-appear`            |                |
| -231000000 | `eoraptor-dawn-dinosaur`            | NEW            |
| -215000000 | `coelophysis-pack-hunter`           | NEW            |
| -214000000 | `plateosaurus`                      |                |
| -200000000 | `massospondylus-southern-grazer`    | NEW            |
| -195000000 | `cryolophosaurus-frozen-crest`      | NEW            |
| -193000000 | `dilophosaurus-twin-crest`          | NEW            |
| -168000000 | `megalosaurus-great-lizard`         | NEW            |
| -160000000 | `mamenchisaurus-long-necked-giant`  | NEW            |
| -156000000 | `brontosaurus-thunder-lizard`       | foothold · NEW |
| -155000000 | `stegosaurus`                       | foothold       |
| -154000000 | `brachiosaurus`                     | foothold       |
| -152000000 | `diplodocus-whip-tailed-giant`      | NEW            |
| -150000000 | `first-birds-archaeopteryx`         |                |
| -139000000 | `utahraptor-giant-raptor`           | NEW            |
| -130000000 | `baryonyx-fish-eating-claw`         | NEW            |
| -126000000 | `iguanodon-thumb-spiked-grazer`     | NEW            |
| -125000000 | `sinosauropteryx-feathered-find`    | NEW            |
| -120000000 | `microraptor-four-winged-glider`    | NEW            |
| -115000000 | `deinonychus-terrible-claw`         | NEW            |
|  -99000000 | `spinosaurus-sailback-swimmer`      | NEW            |
|  -98000000 | `giganotosaurus-giant-of-the-south` | NEW            |
|  -97000000 | `argentinosaurus-colossal-titan`    | NEW            |
|  -80000000 | `hadrosaurus-duck-bill`             | NEW            |
|  -76000000 | `parasaurolophus-trumpet-crest`     | NEW            |
|  -75000000 | `velociraptor`                      | foothold       |
|  -71000000 | `carnotaurus-flesh-eating-bull`     | NEW            |
|  -70000000 | `therizinosaurus-scythe-lizard`     | NEW            |
|  -68000000 | `tyrannosaurus-rex`                 | foothold       |
|  -66000000 | `dinosaur-extinction`               | foothold       |

22 of the 30 are new. The catalogue held the famous few (T. rex, Stegosaurus, Brachiosaurus,
Velociraptor, Plateosaurus) and the bookends, but not the animals between them.

Gates: size **30**, band 0 **25**, same-year pairs **0**, bunching within the limit, largest
overlap **3** (before-us). Every card falls in one prehistory bin, which is expected for this
theme and only advisory. Bands move as the catalogue changes, so re-measure rather than trust
these figures:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending
```

## The edges argued

- **One year per card.** A spine year that matched a reused card's year cost the beat. Allosaurus
  (-155M) lost to the existing `stegosaurus`, and Triceratops (-68M on its existing card) lost to
  `tyrannosaurus-rex`. Diplodocus and Giganotosaurus sit 1 to 2 million years inside their true
  ranges, so no two cards share a year.
- **Cut for fame.** The spine's least-known beats were cut to reach 30: Liliensternus,
  Scelidosaurus, Amargasaurus, Carcharodontosaurus, Dreadnoughtus and Edmontosaurus.
  Compsognathus was cut to thin the crowded late-Jurassic stretch.
- **Difficulty capped by the word "dinosaur".** The blind grader rated most of the new cards
  hard to place from their text alone. Nine of them name "dinosaur" in the description or
  title, and the placement-first grid caps such a card at medium.

## Open fact-check points

- **Giganotosaurus and Argentinosaurus have been re-dated.** Wikipedia now follows a 2026
  restudy of the Candeleros and Huincul Formations that moves both from the Cenomanian to the
  Albian: about 111-106 Ma for Giganotosaurus and about 106.2 Ma for Argentinosaurus. The cards
  keep the older Cenomanian-based years (-98M and -97M), and both evidence windows were rejected
  for that reason. Their order relative to each other holds. Under the new dating, both would
  come before Spinosaurus (-99M) and after Deinonychus (-115M). Moving them is a `year` move,
  which needs a decision.
- **Mamenchisaurus**: the description's "nineteen vertebrae" was not confirmed, and the count
  varies by species.
- **Cryolophosaurus** is tagged Antarctica and United States. The validator needs an actor
  country beside Antarctica, so the tag names the country of the expedition that found it.
- **Mamenchisaurus's window** runs from -160M to -114.4M, the genus's full range. Any placement
  from Brontosaurus to Iguanodon counts as close enough.
