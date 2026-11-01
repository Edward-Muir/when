# The Age of Mammals theme

A 30-card curated theme on the mammals that filled the world after the dinosaurs, from a
shrew-sized primate relative at the very start to the dire wolf near the end of the Ice Age.
Each card is one animal, dated to the start of its fossil range. This note explains why these
30 and not others.

## The scope rule

An event is in only if **it is a mammal of the last 66 million years, dated to when it lived.**

- **One animal per card**, dated to its first appearance in the fossil record, never to its
  extinction. Extinctions in the human era belong to Gone Forever (`woolly-mammoth-extinction`
  is that theme's card, not this one's).
- **No epochs and no "million years" on a card.** The name and description say what the animal
  was, and the player has to place it.
- **Spread by length, not by fame.** The Ice Age has the famous animals, but it is the last
  sliver of the 66 million years, so the deck reaches back through every stretch.

Edges argued rather than assumed:

- **Dinosaurs are out** (Dinosaurs owns them), and so are **human species** (Our Ancestors).
  `aegyptopithecus` and `proconsul` are in because they are early apes and primate relatives,
  not members of the human line.
- **Whale origins are in, four times over** (`pakicetus`, `ambulocetus`, `basilosaurus`,
  `livyatan`), because the walk back to the sea is the best-documented story the period has,
  and each card is a different animal at a different stage.
- **`purgatorius`** sits at the asteroid boundary. It is the first beat of the period rather
  than a Mesozoic card, and its description no longer mentions the asteroid, which would have
  given the date away.

## The 30

All 30 were authored for this theme. The catalogue held group cards (`saber-toothed-cats`,
`giant-ground-sloths-roam`, `woolly-mammoths-appear`, `whales-return-to-sea`) but nothing
that named a single animal, so nothing was reused.

|      Year | Slug                      |                |
| --------: | ------------------------- | -------------- |
| -66000000 | `purgatorius`             | NEW            |
| -58000000 | `plesiadapis`             | foothold · NEW |
| -55000000 | `eohippus-dawn-horse`     | foothold · NEW |
| -52000000 | `icaronycteris-early-bat` | foothold · NEW |
| -50000000 | `pakicetus`               | foothold · NEW |
| -49000000 | `ambulocetus`             | foothold · NEW |
| -45000000 | `andrewsarchus`           | NEW            |
| -41000000 | `basilosaurus`            | foothold · NEW |
| -37000000 | `moeritherium`            | foothold · NEW |
| -34000000 | `paraceratherium`         | NEW            |
| -30000000 | `aegyptopithecus`         | foothold · NEW |
| -28400000 | `desmostylus`             | NEW            |
| -23500000 | `proconsul`               | foothold · NEW |
| -19500000 | `gomphotherium`           | NEW            |
| -16000000 | `merychippus`             | foothold · NEW |
| -15000000 | `platybelodon`            | NEW            |
| -13000000 | `deinotherium`            | NEW            |
|  -9900000 | `livyatan`                | NEW            |
|  -9000000 | `thylacosmilus`           | NEW            |
|  -7000000 | `sivatherium`             | NEW            |
|  -5000000 | `megatherium`             | foothold · NEW |
|  -4000000 | `josephoartigasia`        | NEW            |
|  -2500000 | `smilodon-sabre-tooth`    | foothold · NEW |
|  -2000000 | `glyptodon`               | foothold · NEW |
|  -1800000 | `arctodus`                | foothold · NEW |
|  -1600000 | `diprotodon`              | foothold · NEW |
|   -700000 | `cave-lion-big-cat`       | foothold · NEW |
|   -400000 | `woolly-mammoth-steppe`   | foothold · NEW |
|   -300000 | `cave-bear`               | foothold · NEW |
|   -250000 | `dire-wolf-predator`      | foothold · NEW |

Gates: size **30**, band 0 **19**, same-year pairs **0**, bunching passes, shared **0** with
any earlier theme. Bins are **1/8**, which is advisory, and every card sits in the deep-time
bin by nature. A card's band moves whenever the catalogue around its year changes, so
re-measure rather than trust these figures:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending
```

## Why the footholds are the footholds

Band 0 is high because the catalogue is nearly empty between the asteroid and the Ice Age, so
a card there is easy to order against its neighbours even when the animal is obscure. The
famous Ice Age beasts (`smilodon-sabre-tooth`, `woolly-mammoth-steppe`, `cave-bear`,
`dire-wolf-predator`) are footholds for the usual reason: players know roughly when they
lived. The blind grader marked the Miocene giants (`gomphotherium`, `platybelodon`,
`deinotherium`, `sivatherium`, `josephoartigasia`) very hard, because nothing in their text
points to an era, and those make up the deck's hard middle.

## Deliberate omissions

- **Cut from the spine for crowding and fame.** Eight of the 38 spine beats were cut:
  Coryphodon, Uintatherium, Hyaenodon, Arsinoitherium, Dinictis, Daeodon (the "hell pig"),
  Amphicyon and Chalicotherium. All fall in the dense Eocene-to-Miocene stretch, and each is
  less known than the neighbour it would crowd.
- **Irish elk** was an example beat but shared the woolly mammoth's year, and the mammoth is
  the stronger card.
- **Elasmotherium and Macrauchenia** came up in research, but their fossil-range starts were
  unclear or clashed with years already taken.

## Fact-check flags still open

- **`proconsul`** (-23500000) rests on the Meswa Bridge specimen, which the fact check could
  not confirm. Wikipedia's main range for Proconsul is about 21 to 17 million years ago, so
  -21000000 is the fallback if the earlier date doesn't hold up.
- **`dire-wolf-predator`** (-250000) follows the NPS figure for the oldest record. Wikipedia's
  range starts at 125,000 years ago, so the sources disagree.
