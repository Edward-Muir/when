# The Roman Story theme

A 36-card curated theme spanning the whole Roman state, from the founding legend on the
Palatine to the fall of Constantinople in 1453. This note is why these 36 and not others.

## The scope rule

A card is in only if it is a defining moment of the Roman state — kingdom, republic, empire,
or the Eastern (Byzantine) empire — from the founding legend (753 BCE) to the fall of
Constantinople (1453).

The spine's own `in_scope_because` reasoning held up well; nothing needed re-arguing at the
edges. The one judgment call: religious councils and edicts (Nicaea, the Edict of Milan, the
Great Schism) are kept in because each is an act of Roman/Byzantine state power over doctrine,
not a church-history footnote — the same reading the spine used for the Edict of Thessalonica
(which was cut for space, see below).

## The catalogue is unusually rich here

The spine's 45 beats matched against a catalogue that already carries most of Roman history in
detail: 33 of the 36 final cards are existing events, several with an almost word-for-word
match to the spine's summary (`crossing-rubicon`, `julius-caesar`, `battle-actium`, `rome-falls`,
`constantinople-fall`). Only three beats had no catalogue equivalent at all and needed new
cards: the Gallic sack of Rome, Pyrrhus's invasion, and Justinian's accession (see "The 36"
below).

## The 36

| Year | Slug                          |                |
| ---: | ----------------------------- | -------------- |
| -753 | `rome-founded`                | foothold       |
| -509 | `roman-republic`              | foothold       |
| -450 | `twelve-tables`               | foothold       |
| -390 | `gauls-sack-rome`             | foothold · NEW |
| -280 | `pyrrhus-invades-italy`       | foothold · NEW |
| -264 | `first-punic-war`             | foothold       |
| -218 | `hannibal-crosses-alps`       | foothold       |
| -216 | `battle-cannae`               | foothold       |
| -202 | `battle-zama`                 | foothold       |
| -146 | `third-punic-war`             | foothold       |
| -133 | `tiberius-gracchus-reforms`   | foothold       |
|  -83 | `sullas-civil-war`            | foothold       |
|  -60 | `pompey-great-rome`           | foothold       |
|  -49 | `crossing-rubicon`            | foothold       |
|  -44 | `julius-caesar`               | foothold       |
|  -31 | `battle-actium`               | foothold       |
|  -27 | `roman-empire-founded`        | foothold       |
|    9 | `battle-teutoburg-forest`     |                |
|   64 | `great-fire-rome`             | foothold       |
|   80 | `colosseum-rome`              | foothold       |
|  122 | `hadrian-wall-construction`   | foothold       |
|  212 | `edict-caracalla`             | foothold       |
|  286 | `diocletian-tetrarchy`        | foothold       |
|  313 | `edict-milan`                 | foothold       |
|  325 | `council-nicaea`              | foothold       |
|  330 | `constantinople-founded`      | foothold       |
|  395 | `division-roman-empire`       | foothold       |
|  410 | `sack-rome-visigoths`         | foothold       |
|  476 | `rome-falls`                  | foothold       |
|  527 | `justinian-becomes-emperor`   | foothold · NEW |
|  537 | `construction-hagia-sophia`   | foothold       |
|  541 | `plague-of-justinian`         | foothold       |
|  717 | `siege-of-constantinople-717` |                |
| 1054 | `great-schism`                | foothold       |
| 1204 | `fourth-crusade-byzantine`    |                |
| 1453 | `constantinople-fall`         | foothold       |

3 of the 36 are new. Measured against the merged catalogue: size **36**, band 0 **33**, bins **3/8** (advisory), same-year pairs **0**.

Only 3 of the 36 are new. At authoring time, with the new cards loaded via
`--include-pending --extra`:

```
size 36, bins 4/8, band 0 33, same-year pairs 0
```

Size and band-0 pass with a very large margin (33 of 36 land in band 0 — see below). Bins is
informational only; the spread is 4/8 because this theme is deliberately narrow by design (a
single state's history), which the brief allows explicitly.

## Why the footholds are the footholds — and why there are so many

Band 0 blends the `difficulty` label with how sparse the catalogue is around a card's year, so
a card is a foothold either because it is genuinely famous or because almost nothing else in
the whole catalogue sits near its year. This theme gets both at once: ancient Roman political
history is the single most densely catalogued strand of antiquity (so the labels graded here
are mostly `easy`/`medium` on real recognition), and several of the earliest cards
(`rome-founded`, `roman-republic`, `twelve-tables`) also sit in a stretch the general
catalogue treats sparsely outside of a handful of Greek events. The result is 33 of 36 landing
in band 0 — a ceiling effect, not a sign the theme is trivial to play: the opening hand still
has to be placed in order, and a run from 753 BCE to 1453 CE gives enormous room for two
"easy" cards to still be hard to sequence against each other.

Three cards did not land in band 0: `tiberius-gracchus-reforms`, `sullas-civil-war` and
`edict-caracalla` — all mid-Republic/mid-Empire political turning points that are structurally
important but not textbook-famous, exactly where the spine itself marked them "known" or
"obscure" rather than "famous".

## Deliberate omissions

Existing catalogue cards and spine beats left out on purpose, to stay in the 30-36 band.

- **`first-secession-plebs` (-494)** — a genuine, high-confidence spine beat with a direct
  catalogue match, cut because the early Republic's institution-building is already carried by
  `twelve-tables` and a second beat 43 years later added density without adding a new part of
  the story.
- **`punic-treaty` (-241, "Rome Wins Sicily")** — matches the spine beat exactly (creation of
  Rome's first province) but the Punic Wars arc already runs five cards deep
  (`first-punic-war`, `hannibal-crosses-alps`, `battle-cannae`, `battle-zama`,
  `third-punic-war`); a sixth, on the least dramatic of the six beats, was the one to go.
- **`marian-reforms` (-107)** and **`social-war-rome` (-91)** — both match their spine beats
  exactly and are real state-defining moments (a professionalized army loyal to its general;
  Italy-wide citizenship), but they sit in the same 55-year run as Sulla, Pompey, Caesar and
  Actium, which is already the densest stretch of the deck. `edict-caracalla` (212) was kept
  instead as the deck's one "citizenship" beat, since it is the more complete version of the
  same idea (empire-wide, not just Italy).
- **`gallienus-crisis-empire` (253-268)** — the only existing card that even mentions "the
  Crisis of the Third Century" by name, and it was seriously considered as a reuse for the
  spine's -235 beat despite an 18-33 year gap. Dropped instead: the gap was too large to call
  it the same beat honestly (it covers Gallienus's own reign deep into the crisis, not its
  opening), and the deck was already at its cap.
- **`theodosius-christianity-official` (380, "Christianity Made Official")** — a clean match
  for the spine's beat, cut because the deck already carries three Christianity-and-the-state
  beats close together in effect (`edict-milan`, `council-nicaea`, and implicitly
  `division-roman-empire` under the same emperor); a fourth was the safe cut.
- **`battle-of-catalaunian-plains` (451)** — an exact match for the spine's beat (the last
  major Western victory before the end), cut for space; the fall of the West is still carried
  by `sack-rome-visigoths` (410) and `rome-falls` (476) either side of it.
- **Spine beat "Rome Dissolves the Latin League" (-338)** — no catalogue match at all (checked
  by year and by grepping "latin league"/"latin war"), and not written up as a new card: it is
  a real beat but the least essential of the three ungrounded beats, once `gauls-sack-rome` and
  `pyrrhus-invades-italy` were chosen as this theme's new cards.
- **Spine beat "Empire Reaches Its Greatest Extent" (117)** — no clean existing match.
  `trajan-becomes-emperor` (year 98) touches the same idea ("expanding Rome to its greatest
  territorial extent") but is a different moment by 19 years and a different subject
  (accession, not the territorial peak under Trajan's death). Rather than force a mismatched
  reuse or write a new card for an abstract "high-water mark" rather than a moment, this beat
  was dropped; `hadrian-wall-construction` (122) already carries the deck's "shift from
  expansion to consolidation" idea five years later.

## Still missing from the catalogue

Real gaps, not filler:

- **The founding of the tribunate (-494)** and **Rome's first province (-241)** both have
  perfectly good existing cards (see above) that simply lost out to space, not to a catalogue
  gap.
- **A clean "Crisis of the Third Century begins" card (-235, the murder of Severus Alexander)**
  is a genuine hole — the catalogue's only card on the crisis is `gallienus-crisis-empire`,
  set nearly two decades into it.
- **Rome dissolving the Latin League (-338)** has no catalogue equivalent at any distance
  (checked by year window and by grep for "latin league" / "latin war").
- **The Edict of Thessalonica (380)**, **the Twelve Tables' actual display date** (Twelve
  Tables is dated -450 in the catalogue vs. the spine's -451, a one-year discrepancy not worth
  flagging further) and **Trajan's territorial peak as its own moment (117)** are all
  represented only by adjacent or approximate cards, not exact ones.

## Catalogue doubts

- **`diocletian-tetrarchy`** is dated 286 in the catalogue against the spine's 284 (the
  historically usual date for Diocletian's accession/tetrarchy formation). Reused as-is per the
  brief's instruction to prefer an existing match over a duplicate.
