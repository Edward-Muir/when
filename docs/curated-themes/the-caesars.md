# The Caesars theme

A 30-card curated theme of Roman and Byzantine emperors coming to the throne, from Augustus to
Constantine XI, the last emperor before the fall of Constantinople. This note explains why
these 30 and not others.

## The scope rule

An event is in only if **it is a Roman or Byzantine emperor coming to the throne.** Each card
is one accession, dated to the moment the emperor took power.

- **The Caesars owns the accessions; The Roman Story owns everything else.** Battles, laws,
  buildings, deaths and the sack of Rome stay with `rome`. So the deck shares only two cards
  with that theme, `roman-empire-founded` and `justinian-becomes-emperor`, and both are
  accessions.
- **One beat per emperor.** A reign is a single card, dated to its start.

Three edges were argued rather than assumed:

- **Vespasian stands for the Year of Four Emperors.** Galba, Otho and Vitellius were never
  spine beats. `vespasian-proclaimed-emperor` (69) is the accession that ended the civil war.
- **Caracalla is dated 211, not 198.** He was co-emperor from 198. The card is his sole rule,
  after his brother Geta's murder in December 211.
- **Irene is dated 797.** She had been regent and co-ruler since 780. The card is the year she
  deposed and blinded her son and ruled in her own name.

## The 30

| Year | Slug                                |                |
| ---: | ----------------------------------- | -------------- |
|  -27 | `roman-empire-founded`              | foothold       |
|   14 | `tiberius-succeeds-augustus`        | NEW            |
|   37 | `reign-of-caligula`                 | foothold       |
|   41 | `claudius-raised-by-praetorians`    | NEW            |
|   54 | `nero-becomes-emperor`              | foothold       |
|   69 | `vespasian-proclaimed-emperor`      | NEW            |
|   79 | `titus-becomes-emperor`             | NEW            |
|   96 | `five-good-emperors-era-begins`     | foothold       |
|   98 | `trajan-becomes-emperor`            | foothold       |
|  117 | `hadrian-becomes-emperor`           | foothold       |
|  161 | `marcus-aurelius-emperor`           | foothold       |
|  180 | `commodus-becomes-emperor`          | foothold · NEW |
|  193 | `septimius-severus-seizes-throne`   | NEW            |
|  211 | `caracalla-sole-emperor`            | NEW            |
|  218 | `elagabalus-becomes-emperor`        | NEW            |
|  270 | `aurelian-becomes-emperor`          | NEW            |
|  284 | `diocletian-becomes-emperor`        | NEW            |
|  306 | `constantine-hailed-emperor`        | foothold · NEW |
|  361 | `julian-apostate-sole-emperor`      | NEW            |
|  379 | `theodosius-i-becomes-emperor`      | NEW            |
|  475 | `romulus-augustulus-emperor`        | NEW            |
|  527 | `justinian-becomes-emperor`         | foothold       |
|  610 | `heraclius-becomes-emperor`         | NEW            |
|  717 | `leo-iii-becomes-emperor`           | NEW            |
|  797 | `irene-sole-ruler-byzantium`        | NEW            |
|  867 | `basil-i-founds-macedonian-dynasty` | NEW            |
|  976 | `basil-ii-becomes-emperor`          | NEW            |
| 1081 | `alexios-komnenos-seizes-power`     | NEW            |
| 1259 | `michael-viii-palaiologos-crowned`  | NEW            |
| 1449 | `constantine-xi-last-emperor`       | NEW            |

22 cards are new and 8 reuse catalogue cards. 9 of the 30 are Byzantine (from Justinian on),
and Theodosius I and Romulus Augustulus bridge the split.

Gates: size **30**, band 0 **30**, bins **2/8** (advisory), same-year pairs **0**, bunching
**2 in 37-41**, shared **2 (rome)**. A card's band moves whenever the catalogue around its year
does, so re-measure rather than trust these figures:

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

## Why every card is a foothold

The blind grader rated 21 of the 22 new cards highly inferable from their text. Each one names
an emperor, and most name a dynasty, a predecessor or a neighbouring event. So the placement
grid put all 30 in band 0. Placement is the deck's real difficulty: emperors of the same
century sit close together, and the player has to know the order of the succession. The 8-year
pairs below carry most of that weight. The bins figure is 2/8 by nature, since the whole theme
fits inside 1,500 years.

## Deliberate omissions

- **Cut from the spine for density and fame:** Domitian (81, two years after Titus), Antoninus Pius (138), Maximinus Thrax (235), Philip the Arab (244) and
  Decius (249). The 235-249 run would have put four soldier-emperors in fifteen years, so
  Aurelian (270) carries the Crisis of the Third Century alone.
- **Byzantine cuts:** Theodosius II (408), Constantine VII (913), Nikephoros II Phokas (963),
  John II Komnenos (1118), Manuel I Komnenos (1143, which also sits on the year of the existing
  `portugal-becomes-a-kingdom` card) and Manuel II Palaiologos (1391).

## Known crowding kept on purpose

Three pairs sit inside `theme-gap`'s 8-year advisory window:

- **37 / 41** (Caligula → Claudius): Caligula's murder is what made Claudius, so the pair is one
  story.
- **96 / 98** (Nerva → Trajan): Nerva's adoption of Trajan is the founding act of the adoptive
  emperors, and both cards are footholds.
- **211 / 218** (Caracalla → Elagabalus): the Severan succession, with Macrinus between them.

## Fact-check notes

All 22 new cards were checked. 18 passed as written and 4 descriptions were corrected
(Heraclius, Basil I, Basil II and Michael VIII), and none is `unsupported`. The spine writer
ran no searches, so the reconciler's years were checked one by one at this step. Two cards are
worth a glance at review:

- `constantine-xi-last-emperor`: he was crowned at Mystras in January 1449 and reached
  Constantinople in March. The card's description is about the city, so it is tagged Greece
  and Turkey.
- `michael-viii-palaiologos-crowned`: he was proclaimed at Nymphaion in the Empire of Nicaea.
  The card says "Greek exiles in Anatolia" rather than naming a city.
