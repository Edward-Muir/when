# The Before Us theme

A 33-card curated theme on everything that happened before there was anyone to watch it — from
the origin of life to the last hominins standing in for us before we existed. This note is why
these 33 and not others, and why two events that plainly belong in scope did not make the deck.

## The scope rule

An event is in only if **it happened before Homo sapiens existed (roughly 300,000 years ago)**:
Earth's formation, the origins of life, mass extinctions, famous prehistoric creatures, and
earlier human species.

- **The boundary is a hard cliff, not a fuzzy one.** `first-humans` (First Homo Sapiens,
  roughly 315,000-233,000 years ago) and `anatomically-modern-humans` (Anatomically Modern
  Humans Emerge, roughly 315,000-160,000 years ago) sit right on the scope line and are
  excluded on purpose: the spine's own rule is "earlier human species", and these two cards
  are the species itself, not an earlier one. `neanderthals-appear` and `homo-heidelbergensis-emerges`
  stay in because Neanderthals and Homo heidelbergensis never were us.
- **`homo-erectus-emerges`'s own description ("the first hominin species to spread beyond the
  continent") already covers the spine's separate "Homo erectus leaves Africa" beat.** Writing
  a second new card for the migration would have split one beat into two cards competing for
  the same 300,000-year stretch of the timeline; the migration beat was dropped rather than
  duplicated.
- Two spine beats named genuine deep-time events with no equivalent in scope's spirit but no
  catalogue standing either — see "Still missing" below — and were left unwritten rather than
  forced.

## The 32

Years are given in millions of years ago (Mya) except the last eleven, which are recent enough
to read as plain negative years (BCE-style, i.e. `-2400000` = 2.4 million years ago). Paste
`eventNames` from `before-us.theme.json` into the workflow's `theme` input.

|        Year | Slug                           |                |
| ----------: | ------------------------------ | -------------- |
| -4100000000 | `first-life`                   | foothold       |
| -3500000000 | `first-cyanobacteria`          | foothold       |
| -1900000000 | `eukaryotic-cell-evolution`    | foothold · NEW |
|  -720000000 | `snowball-earth-cryogenian`    |                |
|  -575000000 | `ediacaran-biota`              |                |
|  -538000000 | `cambrian-explosion`           | foothold       |
|  -518000000 | `first-vertebrates`            | foothold       |
|  -470000000 | `plants-colonize-land`         | foothold       |
|  -445000000 | `ordovician-mass-extinction`   | foothold       |
|  -400000000 | `first-insects-appear`         | foothold · NEW |
|  -375000000 | `first-amphibians-tiktaalik`   | foothold       |
|  -372000000 | `late-devonian-extinction`     | foothold       |
|  -251941000 | `end-permian-mass-extinction`  | foothold       |
|  -243000000 | `first-dinosaurs-appear`       | foothold       |
|  -225000000 | `first-mammals`                | foothold       |
|  -201400000 | `jurassic-period-begins`       | foothold       |
|  -175000000 | `pangaea-breaks-apart`         | foothold       |
|  -150000000 | `first-birds-archaeopteryx`    | foothold       |
|  -130000000 | `first-flowering-plants`       | foothold       |
|   -66000000 | `dinosaur-extinction`          | foothold       |
|   -65900000 | `first-primates`               | foothold       |
|   -56000000 | `eocene-epoch-begins`          |                |
|   -50000000 | `whales-return-to-sea`         | foothold       |
|   -33900000 | `oligocene-epoch-begins`       |                |
|   -25000000 | `first-apes`                   | foothold       |
|    -7000000 | `first-upright-walkers`        | foothold       |
|    -3200000 | `lucy-australopithecus-lived`  | foothold       |
|    -2400000 | `homo-habilis`                 | foothold       |
|    -2040000 | `homo-erectus-emerges`         | foothold       |
|    -1790000 | `fire-mastery`                 | foothold       |
|     -700000 | `homo-heidelbergensis-emerges` | foothold · NEW |
|     -430000 | `neanderthals-appear`          | foothold       |

3 of the 32 are new. Measured against the merged catalogue: size **32**, band 0 **28**, bins **1/8** (advisory), same-year pairs **0**.

Four of the 33 are new. Read the current band and spread figures from the catalogue rather than
from here — a card's band moves whenever its neighbourhood does:

```bash
node scripts/theme-gap.js --slugs <the 33 above, comma-separated>
```

At authoring time, with the new cards loaded via `--include-pending --extra`: size **33**,
bins **1/8** (advisory — see below), band 0 **29**, same-year pairs **0**.

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how sparse the timeline is around a year, and deep
time is the emptiest neighbourhood the catalogue has. **29 of the 33 cards land in band 0** —
not because 29 of these facts are easy to _recognise_, but because almost nothing else in the
5,461-event catalogue sits anywhere near a year like 445,000,000 BCE, so any card there is
trivially easy to _place_. This theme does not need to go hunting for footholds the way a
narrow modern theme does; the scope rule itself manufactures them. The handful marked above are
simply the ones with an `easy` difficulty label layered on top of that sparsity — `first-life`,
`first-cyanobacteria`, `cambrian-explosion`, `plants-colonize-land`, `first-dinosaurs-appear`,
`first-mammals`, `jurassic-period-begins`, `dinosaur-extinction`, `homo-habilis` and
`fire-mastery` are all labelled `easy` in the catalogue; `lucy-australopithecus-lived` and the
new `first-insects-appear`/`eukaryotic-cell-evolution` are `medium` but still band 0 on
sparsity alone. Because the margin is this large, no single card's removal would put the deck
at risk of failing the band-0 gate.

## Deliberate omissions

Cards the spine named or a sweep would surface, left out on purpose.

- **Structurally unplayable, not merely omitted.** The spine's opening two beats, "Earth
  forms" and "Moon forms from giant impact", both have exact catalogue matches —
  `earth-formation` (4,567-4,450 Mya) and `moon-forming-impact` (4,510-4,350 Mya) — but neither
  can ever be dealt. `ERA_DEFINITIONS` (`src/utils/eras.ts`) starts the `prehistory` era at
  -4,500,000,000 and nothing in the era table covers a year before that, exactly as one event
  beyond year 2100 sits outside the era table at the other end (see `docs/curated-themes/index.md`).
  `theme-gap.js` reported both as "Unresolved slugs" even after `--include-pending`. Retiming
  either card to fit inside the boundary would misstate the actual age of the Earth and the
  Moon, so both stayed out rather than being fudged into range. This is a real catalogue gap,
  not a theme-authoring choice — the fix, if wanted, is widening `ERA_DEFINITIONS`, not
  rewriting these two events.
- **Redundant beat, not a missing card.** "Homo erectus leaves Africa" (spine beat) is already
  the second half of `homo-erectus-emerges`'s own description. See the scope-rule section above.
- **Out of scope by the letter of the rule.** `first-humans` and `anatomically-modern-humans`
  are Homo sapiens itself, not an earlier species, and the spine's own scope rule excludes them
  — see above.
- **Spine beats cut for redundancy or thinness, not authored:**
  - "Late Heavy Bombardment" — the matching catalogue card, `late-heavy-bombardment`, shares
    its exact `year` field (-4,100,000,000) with `first-life`, which the theme needed more (a
    named origin-of-life beat beats an asteroid-storm beat under the scope rule's own framing).
    Same-year pairs are a hard gate; only one could stay.
  - "Oldest stromatolite fossils form" and "Great Oxidation Event" both point at the same
    catalogue card, `first-cyanobacteria` ("Microbes that release oxygen through photosynthesis
    emerged, slowly transforming the atmosphere"), which reads as the Great Oxidation Event
    almost verbatim. It was assigned there; the stromatolite beat, a narrower and more obscure
    framing of the same organisms, was not given a second, separate card.
  - "Columbia supercontinent assembles" and "Rodinia supercontinent forms" — two more
    supercontinent-assembly beats with no catalogue match and low spine confidence; adding two
    near-identical "a supercontinent formed" cards would have been padding, not coverage.
  - "Great Ordovician radiation" — no catalogue match, `obscure` fame and `low` confidence in
    the spine itself; `plants-colonize-land`, at almost the same year, already covers that
    stretch of the timeline.
  - "Earth's first forests appear" and "Earliest multicellular life" — both plausible NEW
    cards with no catalogue match, cut to keep the deck at 33 rather than pushing toward 38;
    neither is a famous-enough beat to outrank what stayed in.
  - "Ardipithecus walks upright" — `first-upright-walkers` ("Early Humans Walk Upright",
    -7,000,000 to -3,660,000) already spans this date and was assigned to the "Human-chimp
    lineages split" beat instead (its own `year` field is exactly -7,000,000, an exact match);
    a second upright-walking card four million years later, inside the same window, would have
    been the same beat twice.
  - "Grande Coupure reshapes Europe" — `oligocene-epoch-begins` shares its exact year
    (-33,900,000) and its description ("a time when open grasslands spread widely") is one
    reading of the same mammalian turnover; the beat was folded into that reuse rather than
    written twice.
  - "Neanderthal-Denisovan split" — no catalogue match, `obscure` fame, `low` confidence, and
    `neanderthals-appear` already carries the Neanderthal side of the story.
  - "Paleocene-Eocene warming spike" — `eocene-epoch-begins` (-56,000,000) is the same
    Paleocene/Eocene boundary the PETM defines, framed as an epoch start instead of a
    temperature spike; reused rather than duplicated.
- **Catalogue doubts, not edits.** Several reused cards carry a `year` noticeably earlier than
  the spine's guess for the same beat — `fire-mastery` (-1,790,000) against the spine's
  -790,000 for "earliest controlled use of fire", and `first-cyanobacteria` (-3,500,000,000)
  against the spine's -2,400,000,000 for the Great Oxidation Event. Both are genuinely the same
  beat under a different, defensible date (early fire evidence and the oxygenation timeline are
  both live scientific debates), so both were reused rather than duplicated or corrected —
  per the brief, existing events are not edited from this pass.

## Still missing from the catalogue

Real gaps, not filler, that were not written because nothing in scope needed them:

- **The Great Dying's cause** (Siberian Traps volcanism) and **the Chicxulub impactor** by name
  are both folded into their extinction cards (`end-permian-mass-extinction`,
  `dinosaur-extinction`) rather than split into a second "cause" card each, the same call
  `clockwork.md` made for components versus the beat they enable.
- **A named Denisovan card** — the Denisovans are a real earlier human species and squarely in
  scope, but the catalogue has no card for them at all (only the Neanderthal-Denisovan split,
  which the spine itself flagged `obscure`/`low confidence` and this note dropped above). A
  future pass could write one; it was not written here because the spine did not ask for it
  and inventing a fossil-discovery beat without spine or catalogue backing felt like scope
  creep for this reconciliation.
- **Earth's formation and the Moon-forming impact** are catalogued but structurally unplayable
  — see "Deliberate omissions" above. If `ERA_DEFINITIONS` is ever widened to cover Hadean-era
  years, both cards are already written and ready to be added back into this theme.

## Review edits

`oldest-wooden-hunting-spears` was dropped at review and re-dated from 337,000 to 200,000 years
ago. A 2025 amino-acid dating of the Schöningen deposit (Science Advances, May 2025) puts the
spears at about 200,000 years, which is after _Homo sapiens_ appears and so outside the scope
rule. The card stays in the catalogue at its corrected date; the deck is 32.
