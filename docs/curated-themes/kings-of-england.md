# The Kings of England theme

A 36-card curated theme that walks the English — later British — crown from Kent's first
Christian king to Charles III. This note is why these 36 and not others: the scope rule, the
band-0 argument, and the reigns that were deliberately left on the floor.

## The scope rule

A card is in only if it is **an English or British monarch's accession, death, or single
defining act**, and there is **one card per monarch wherever possible**. Queens regnant are in
— the theme name is the conventional one, not a filter — so Matilda, Mary I, Elizabeth I,
Anne, Victoria and Elizabeth II all belong.

Three things are deliberately out:

- **Battles the monarch merely fought in.** Bannockburn, Crécy, Flodden, Marston Moor and
  Trafalgar are wars, not reigns. The two exceptions are the battles that _are_ the reign's
  defining moment: Hastings ends one dynasty and starts another, Bosworth does it again.
- **Ministers and their doings.** No Becket, no Wolsey, no Cromwell, no Walpole, no Pitt. The
  Acts of Union and the English Bill of Rights are Parliament's work and are out for the same
  reason, even though both are excellent cards.
- **Consorts.** Eleanor of Aquitaine, Anne Boleyn, Albert and Wallis Simpson appear only
  inside a reigning monarch's card, never as one.

## The era range is not a defect

This theme **cannot span 1000 BCE and should not try**. It runs 600 to 2022. The gate that
matters is spread in CDF-rank space, not raw years, and the catalogue is heavily weighted
toward 500-2000 CE — so 36 monarch cards still occupy **7 of 8 bins**. Only bin 0
(4.5 Gya to ~206 BCE) is empty, and the only way to fill it would be padding with ancient
cards that have nothing to do with the English crown. Don't.

## The 36

Paste as `eventNames` into the workflow's `theme` input.

| Year | Slug                              |          |     |
| ---: | --------------------------------- | -------- | --- |
|  600 | `law-of-aethelberht`              |          |     |
|  785 | `offas-dyke-built`                |          | NEW |
|  871 | `alfred-great-king`               | foothold |     |
|  927 | `athelstan-first-king-of-england` | foothold | NEW |
|  978 | `aethelred-unready-becomes-king`  |          | NEW |
| 1016 | `canute-king-england`             |          |     |
| 1042 | `edward-confessor-becomes-king`   | foothold | NEW |
| 1066 | `battle-of-hastings`              | foothold |     |
| 1100 | `henry-i-charter-of-liberties`    |          | NEW |
| 1141 | `matilda-england`                 |          |     |
| 1154 | `henry-ii-becomes-king`           |          | NEW |
| 1189 | `richard-lionheart-crowned`       |          | NEW |
| 1215 | `magna-carta`                     | foothold |     |
| 1284 | `edward-i-annexes-wales`          |          | NEW |
| 1327 | `edward-ii-deposed`               |          | NEW |
| 1340 | `edward-iii-claims-french-crown`  |          | NEW |
| 1399 | `henry-iv-deposes-richard-ii`     |          |     |
| 1415 | `battle-agincourt`                | foothold |     |
| 1431 | `henry-vi-crowned-in-paris`       |          | NEW |
| 1461 | `edward-iv-crowned`               |          |     |
| 1485 | `battle-of-bosworth-field`        | foothold |     |
| 1509 | `henry-viii-becomes-king`         | foothold |     |
| 1553 | `mary-i-becomes-queen`            |          | NEW |
| 1603 | `death-elizabeth-i`               | foothold |     |
| 1611 | `king-james-bible`                | foothold |     |
| 1649 | `charles-i-execution`             |          |     |
| 1660 | `restoration-of-charles-ii`       |          | NEW |
| 1688 | `glorious-revolution`             |          |     |
| 1702 | `queen-anne-accession`            |          | NEW |
| 1714 | `george-i-hanoverian-succession`  |          | NEW |
| 1760 | `george-iii-becomes-king`         |          | NEW |
| 1837 | `victoria-becomes-queen`          | foothold | NEW |
| 1917 | `house-of-windsor-founded`        |          | NEW |
| 1936 | `edward-viii-abdicates`           | foothold | NEW |
| 1952 | `elizabeth-ii-becomes-queen`      | foothold |     |
| 2022 | `queen-elizabeth-ii-dies`         | foothold |     |

19 of the 36 are new and **need art before the theme can be published** — the daily hides any
event without Cloudinary imagery, so until the image pipeline has run this deck measures 17
cards, not 36. Read the current figures from the catalogue rather than from here:

```bash
node scripts/theme-gap.js --slugs <the 36 above, comma-separated>
```

At authoring time, over `playable + pending`: **size 36, bins 7/8 `[0 5 14 9 4 1 2 1]`,
band 0 = 14, same-year pairs 0, no pair inside 8 years.**

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how _sparse_ the catalogue is around the year, and
this theme gets an unusually generous deal on both halves — which is worth understanding
before anyone "simplifies" the list.

The English monarchy is one of the few subjects where the globally-famous cards are spread
evenly across a thousand years rather than bunched in one century. Hastings, Magna Carta,
Agincourt, Bosworth, Henry VIII and Elizabeth I are all `easy` in the existing catalogue, and
they sit 50 to 150 years apart. A probe of the density term shows that anywhere between 600
and 2022, an `easy` card lands in band 0 — so every honestly-`easy` monarch card is a
foothold, and the opening hand has real anchors in the eleventh, thirteenth, fifteenth,
sixteenth, nineteenth and twentieth centuries.

That gives 14 band-0 cards against a `MIN_BAND_ZERO` of 5, so unlike the Indonesia theme this
one is not living one card from failing validation. The margin was **not** bought by grading
generously: only two of the nineteen new cards are labelled `easy` — Victoria's accession and
Edward VIII's abdication, both of which a general audience genuinely recognises. Everything
else new is `medium` or `hard`, and `athelstan-first-king-of-england` and
`edward-confessor-becomes-king` reach band 0 on catalogue sparsity alone: almost nothing else
in the game sits within 25 years of 927 or 1042.

The consequence for future edits: the footholds here are not fragile, but they are all
_monarch_ cards. If the deck ever needs trimming, trim from band 1-3 (the crowded
Plantagenet and Hanoverian stretch), not from the six `easy` Tudor-and-earlier anchors.

## Deliberate omissions

A monarch list crowds badly — reigns are routinely under eight years apart, and two cards on
one year is a coin flip rather than a placement. Most of what follows was dropped for that,
not for lack of merit.

**Same-year collisions resolved.**

- 1066: `battle-of-hastings` was chosen over a Harold II card. Harold's accession, Stamford
  Bridge and his death are all the same year as Hastings, so **Harold II has no card** — the
  Hastings description names him instead.
- 1327: Edward II's deposition and Edward III's accession share a year. Edward II keeps the
  deposition, which is his defining moment; Edward III moves to the year he formally styled
  himself King of France, which is his.
- 1485: `battle-of-bosworth-field` carries both Richard III's death and Henry VII's
  accession, so **Henry VII has no card of his own** — his other candidate years (1486, 1509)
  collide with the marriage-to-Elizabeth-of-York crowding and with Henry VIII's accession.
- 1547: `death-henry-viii` was rejected in favour of nothing — Edward VI's accession is the
  same year, and Henry VIII already holds 1509 (see below).
- 1603: `death-elizabeth-i` is Elizabeth's card, which pushes James VI and I off his
  Union-of-the-Crowns year and onto `king-james-bible`, the act that actually carries his
  name. This is the one place the scope rule is stretched, and it is stretched knowingly.
- 1936: `edward-viii-abdicates` doubles as George VI's accession, so **George VI has no card**
  — every candidate year for him (1937 coronation, 1939 broadcast, 1940 Blitz) sits within
  eight years of either the abdication or Elizabeth II's accession.
- 2022: `queen-elizabeth-ii-dies` doubles as Charles III's accession. His coronation is one
  year later and would have been a coin flip.

**Reigns dropped for near-year crowding.** Edward the Elder (899), Edmund I (939), Eadred
(946), Eadwig (955), Edgar (959), Edward the Martyr (975), William II Rufus (1087), Stephen
(1135, covered by `matilda-england`, whose description names him), Henry III (1216 or 1245),
Richard II's accession (1377, covered by `henry-iv-deposes-richard-ii`), Edward V and the
Princes in the Tower (1483, two years from Bosworth), Edward VI (1547), George II (1727),
George IV (1820), William IV (1830), Edward VII (1901). Any five of these would fit the
scope rule; all of them together would put three cards inside a decade repeatedly.

**Redundant cards rejected.**

- `english-reformation-henry` (1534), `dissolution-of-monasteries` (1536) and
  `death-henry-viii` (1547) all against `henry-viii-becomes-king` (1509). One card per
  monarch, and the accession is the band-0 one.
- `alfred-the-great-recaptures-london` (886) and `treaty-wedmore` (878) against
  `alfred-great-king` (871).
- `domesday-book` (1086) against `battle-of-hastings` — a second William I card.
- `magna-carta-consequences` (1265) and `english-parliament` (1265) against `magna-carta` —
  and both are Simon de Montfort's doing, i.e. a subject's, not a king's.
- `trial-of-charles-i` against `charles-i-execution` (same year, and the trial slug is in
  `deprecated.json`).
- `queen-victoria-dies` (1901) and `queen-victorias-diamond-jubilee` (1897) against
  `victoria-becomes-queen` (1837). The accession was written new because it is the canonical
  beat and because 1901 is Edward VII's accession year.
- `wars-of-roses` (1455) — a dynastic war, not a monarch's act, and it sits between Henry VI
  and Edward IV who are both already carried.

**Existing slugs rejected in favour of a new card.**

- `birth-richard-lionheart` (1157) — a birth is not an accession, a death or an act, and 1157
  is three years from Henry II's accession. Replaced by `richard-lionheart-crowned` (1189).
- `edward-ii-bans-football-london-1314` and `edward-iii-archery-law-1363` — real royal decrees,
  but sports trivia rather than either reign's defining act, and 1314 is Bannockburn's year.
  Replaced by `edward-ii-deposed` and `edward-iii-claims-french-crown`.
- `act-of-union-britain` (1707) — Parliament's act, not Anne's, and it sits seven years from
  the Hanoverian succession. Replaced by `queen-anne-accession` (1702), which is also better
  spaced.
- `anglo-saxon-migration` (449) / `anglo-saxons-settle-britain` (450) — a migration, with no
  monarch in it. The theme starts at Æthelberht instead.

**Keyword false positives** the sweep dragged in and that have nothing to do with the English
crown: `king-david-rules`, `darius-i-persian-king`, `charlemagne-king-franks`,
`cleopatra-vii-queen`, `restoration-bourbon-monarchy` (France), `henry-ii-france-jousting-death-1559`
(the French Henri II), `king-philips-war` (New England), `statute-of-anne` (copyright),
`crossrail-elizabeth-line`, `billie-jean-king-battle-sexes`, and the entire family of
`*-kingdom-*` slugs from Aksum to Sukhothai.

## Still missing from the catalogue

Real gaps that were **not** written, and why. Every one of them collides with a card already
in the 36, which is the only reason they were left:

- **Harold II** (1066), **Henry VII** (1485), **George VI** (1936) and **Charles III** (2022) —
  each is carried inside another monarch's card, as set out above. If the same-year rule is
  ever relaxed, these four are the first to write.
- **Sweyn Forkbeard** (1013), the Danish king who briefly held England before Cnut.
- **Empress Matilda's rival Stephen** as his own card — the Treaty of Wallingford (1153) is
  the natural one and sits a single year from Henry II's accession.
- **King John's loss of Normandy** (1204) and **Henry III's Westminster Abbey** (1245) — both
  good cards, both squeezed by Magna Carta.
- **Elizabeth I's accession** (1558) — five years from Mary I, so the deck carries her death
  instead.
- **The Union of the Crowns** (1603) and **James I's proclamation of Great Britain** (1604).
- **The Regency** (1811), which would have been George IV's card had the Hanoverian stretch
  not already been the most crowded part of the deck.
- **Elizabeth II's coronation** (1953) and **Charles III's coronation** (2023) — both one year
  from a card in the deck.
