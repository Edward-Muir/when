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
| -111400000 | `giganotosaurus-giant-of-the-south` | NEW            |
| -106200000 | `argentinosaurus-colossal-titan`    | NEW            |
|  -99000000 | `spinosaurus-sailback-swimmer`      | NEW            |
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
  `tyrannosaurus-rex`. Diplodocus sits 2 million years inside its true range, so no two cards share
  a year.
- **Cut for fame.** The spine's least-known beats were cut to reach 30: Liliensternus,
  Scelidosaurus, Amargasaurus, Carcharodontosaurus, Dreadnoughtus and Edmontosaurus.
  Compsognathus was cut to thin the crowded late-Jurassic stretch.
- **Difficulty capped by the word "dinosaur".** The blind grader rated most of the new cards
  hard to place from their text alone. Nine of them name "dinosaur" in the description or
  title, and the placement-first grid caps such a card at medium.

## Fact-check points settled at review

- **Giganotosaurus and Argentinosaurus were re-dated.** Maniel and colleagues (2026, Gondwana
  Research) moved the Candeleros and Huincul Formations from the Cenomanian to the Albian, and
  Wikipedia follows them. Giganotosaurus is now -111.4M with a window to -106.2M, the Candeleros
  Formation from its maximum depositional age to the Huincul tuff above it. Argentinosaurus is
  -106.2M, a single radiometric date, so it has no window. Both now come after Deinonychus and
  before Spinosaurus, where the spine had them after Spinosaurus.
- **Mamenchisaurus**: the description's "nineteen vertebrae" held for one species only, so it
  now says the neck was nearly half the body's length. Its window ends at -145M, the genus's
  Late Jurassic range. The full -114.4M range rested on M. anyuensis, which Wikipedia calls
  unlikely to belong to the genus, and made the card close enough from Brontosaurus to Iguanodon.

## Open fact-check points

- **Cryolophosaurus** is tagged Antarctica and United States. The validator needs an actor
  country beside Antarctica, so the tag names the country of the expedition that found it.

## Intro

The popup this theme opens with (rules in [index.md](index.md#theme-intros)).

- **Blurb:** Thirty dinosaurs, each dated to the start of its known fossil record.
- **Fact:** Stegosaurus weighed over three tonnes, but its brain weighed only about 70 grams.

Sources: [Guinness World Records, smallest-brained dinosaurs](https://www.guinnessworldrecords.com/world-records/70337-smallest-brained-dinosaurs) (about 70 g, 3.3 tonnes); [AMNH, Stegosaurus](https://www.amnh.org/explore/ology/ology-cards/017-stegosaurus-stenops).

A Brontosaurus fact (sunk into Apatosaurus, restored in 2015) was dropped: its card already says "once thought a mistaken name".
