# The Pharaohs theme

A 34-card curated theme on the rulers of ancient Egypt, from Narmer's unification of the Two
Lands to Cleopatra VII's death at the hands of Octavian's army — three thousand years of
accessions, conquests, monuments and one long dynastic line's slow eclipse by Nubia, Persia,
Macedon and finally Rome.

## The scope rule

A card is in only if it is **an act, accession, death or monument of an Egyptian ruler**, from
Narmer's unification to Cleopatra's death. Modern discoveries of their tombs are explicitly out
(another theme covers finds).

- **Births are out.** The catalogue holds `birth-hatshepsut`, `birth-akhenaten` and
  `birth-ramesses-ii`, all of which a keyword sweep on the pharaoh's name returns immediately.
  None is an act, accession, death or monument, so none qualifies — a birth is a fact about a
  future ruler, not yet a ruler's deed. Ruled out on a plain reading of the rule.
- **A tomb built in life is a monument; a tomb opened millennia later is a discovery, and the
  scope rule keeps them apart on purpose.** `pyramids`, `step-pyramid-djoser` and `sphinx-built`
  are in; `tutankhamun-tomb` (Howard Carter, 1922) is out, on the rule's own explicit carve-out.
- **Nefertiti is out.** She is Akhenaten's queen consort, not herself a pharaoh (the later
  co-regency some Egyptologists attribute to her as Neferneferuaten is disputed and has no
  playable event), so `birth-nefertiti` fails on both counts — birth, and not a ruler.
- **Conquerors who took the crown are in.** Cambyses, Alexander and Ptolemy I each end an era of
  native rule, but each is also crowned pharaoh in Egyptian tradition, so their accessions read
  as pharaonic acts rather than merely foreign conquest. The same logic admits Piye and Taharqa,
  Nubian kings who ruled Egypt as its 25th Dynasty.
- **Julius Caesar's calendar reform is out.** `julian-calendar-reform` (-46) sits inside the
  Cleopatra cluster and was tempting for spread, but Caesar was never pharaoh — it is a Roman
  act that happens to fall inside Cleopatra's reign, not an act of an Egyptian ruler.

## The 34

|  Year | Slug                             |                |
| ----: | -------------------------------- | -------------- |
| -3218 | `unification-egypt`              | foothold       |
| -2650 | `step-pyramid-djoser`            | foothold       |
| -2600 | `sneferu-red-pyramid`            | NEW            |
| -2560 | `pyramids`                       | foothold       |
| -2510 | `menkaure-pyramid-giza`          | foothold · NEW |
| -2500 | `sphinx-built`                   | foothold       |
| -2050 | `mentuhotep-ii-reunification`    | NEW            |
| -1991 | `amenemhat-i-founds-dynasty`     | NEW            |
| -1550 | `new-kingdom-egypt-begins`       | foothold       |
| -1473 | `hatshepsut-becomes-pharaoh`     | foothold · NEW |
| -1457 | `battle-megiddo`                 |                |
| -1353 | `akhenaten-religious-revolution` | foothold       |
| -1323 | `death-tutankhamun`              | foothold       |
| -1290 | `seti-i-recovers-levant`         | NEW            |
| -1274 | `battle-kadesh`                  | foothold       |
| -1259 | `first-peace-treaty`             | foothold       |
| -1244 | `abu-simbel-temples-dedicated`   | foothold · NEW |
| -1208 | `merneptah-victory-stele`        | NEW            |
| -1175 | `ramesses-iii-sea-peoples`       | foothold · NEW |
| -1155 | `ramesses-iii-assassinated`      | NEW            |
|  -728 | `piye-conquers-egypt`            | foothold · NEW |
|  -690 | `taharqa-crowned-pharaoh`        | NEW            |
|  -664 | `psamtik-i-reunifies-egypt`      | NEW            |
|  -609 | `necho-ii-defeats-josiah`        | foothold · NEW |
|  -525 | `cambyses-conquers-egypt`        | NEW            |
|  -380 | `nectanebo-i-founds-dynasty`     | NEW            |
|  -343 | `last-native-pharaoh-flees`      | NEW            |
|  -332 | `alexander-crowned-pharaoh`      | foothold · NEW |
|  -305 | `ptolemaic-kingdom-established`  |                |
|  -280 | `lighthouse-alexandria`          | foothold       |
|   -51 | `cleopatra-vii-reign`            | foothold       |
|   -48 | `cleopatra-caesar-alliance`      | foothold       |
|   -31 | `battle-actium`                  | foothold       |
|   -30 | `death-cleopatra`                | foothold       |

18 of the 34 are new. Measured against the merged catalogue: size **34**, band 0 **21**, bins **2/8** (advisory), same-year pairs **0**.

18 of the 34 are new. At authoring time, with the new cards loaded via `--include-pending
--extra`:

```
size 34, bins 2/8, band 0 21, same-year pairs 0
```

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how sparse the catalogue is around a year, and this
theme clears the 5-card floor by a wide margin — **21 of 34** land in band 0. The reason is
structural: pharaonic Egypt runs almost the entire length of the catalogue's emptiest stretch.
Ancient Egypt has always had a handful of very famous cards in the catalogue (`pyramids`,
`sphinx-built`, `unification-egypt`, `step-pyramid-djoser`, `new-kingdom-egypt-begins`), each
`easy` and each sitting in a multi-century gap where almost nothing else in the whole catalogue
is dated — so they were already footholds before this theme ever picked them up, and reusing
them costs nothing.

The three Cleopatra-cluster footholds, `cleopatra-vii-reign`, `battle-actium` and `death-cleopatra`
(plus `cleopatra-caesar-alliance`), earn band 0 differently: they are `easy` and simply famous,
not sparse — the Roman era around them is comparatively dense, but recognisability alone still
clears the bar.

Several of the NEW cards land in band 0 for the sparse-era reason rather than an easy label:
`menkaure-pyramid-giza`, `abu-simbel-temples-dedicated`, `ramesses-iii-sea-peoples`,
`piye-conquers-egypt`, `necho-ii-defeats-josiah` and `alexander-crowned-pharaoh` are all graded
`medium`, and each still lands band 0 because almost nothing else in the whole catalogue is dated
to their particular centuries. `cambyses-conquers-egypt`, also `medium`, does not quite clear it
(band 1) — the mid-6th-century-BCE stretch is thin but not thin enough on its own.

## Deliberate omissions

Spine beats cut, and why:

- **Births, out on the scope rule.** `birth-hatshepsut` (-1507), `birth-akhenaten` (-1380) and
  `birth-ramesses-ii` (-1303) all surfaced on a name search and are all excluded — see "The
  scope rule" above. None was ever a candidate to reuse for an accession beat; a birth is not
  an accession.
- **Hatshepsut's voyage to Punt** (spine year -1470) is cut for crowding: it sits 3 years from
  `hatshepsut-becomes-pharaoh` (-1473), and between the two the accession is both the more
  legible beat and the stronger foothold (an `easy` card versus a `medium`/`hard` trading
  expedition). Keeping both would have bought nothing but a coin-flip pair.
- **Colossi of Memnon** (spine year -1350) is cut for crowding against
  `akhenaten-religious-revolution` (catalogue year -1353, an existing card reused for "Akhenaten
  founds Amarna") — 3 years apart and both would have opened the New Kingdom stretch on a
  near-tie.
- **Tutankhamun restores the old gods** (spine year -1332) and **Horemheb takes the throne**
  (spine year -1319) are both cut. Between them and the two cards already carrying the Amarna
  story (`akhenaten-religious-revolution` at -1353, `death-tutankhamun` at -1323), a third and
  fourth card in a 30-year span add crowding without adding a beat a player could tell apart
  from its neighbours — the religious reversal and the purge of Akhenaten's memory are both real
  and distinct history, but neither is legible as a separate placement this close to two cards
  already on the board.
- **Ramesses XI's rule collapses** (spine year -1077) and **Shoshenq I founds Dynasty 22** (spine
  year -943) are cut for being the theme's least legible beats (`very-hard`, no forensic hook, no
  famous name) once the deck was already comfortably over 30 — they added size, not quality.
- **Amasis II seizes the throne** (spine year -570) is cut on the same test: obscure usurpation,
  no distinguishing hook, and the "general seizes the throne" beat is already told twice
  (`piye-conquers-egypt`, `psamtik-i-reunifies-egypt`) without it.
- **Necho II routed at Carchemish** (spine year -605) is cut for crowding against **Necho II
  defeats Josiah** (spine year -609, kept) — 4 years apart and the same ruler's campaign. Josiah's
  defeat is kept for the wider (if grim) name recognition of a Biblical king; Carchemish, the
  more consequential battle to a historian, is the one this budget could not also afford.
- **Amenemhat III's labyrinth** (spine year -1800) and **Senusret III strikes Nubia** (spine year
  -1870) and **Pepi II takes the throne** (spine year -2278) are cut as the thinnest Old/Middle
  Kingdom beats once `sneferu-red-pyramid`, `menkaure-pyramid-giza`, `mentuhotep-ii-reunification`
  and `amenemhat-i-founds-dynasty` already carry that stretch; none of the three has a hook a
  player could infer (no famous monument, no famous name), and the stretch's timeline spread is
  advisory, not a gate.

Existing catalogue cards left out on purpose:

- `julian-calendar-reform` (-46) — see "The scope rule": Caesar, not a pharaoh.
- `egyptian-sculpture-tradition` (-1300) is a general New Kingdom art-history card that mentions
  Abu Simbel in passing; it is not the dedication of the temples, so `abu-simbel-temples-dedicated`
  was written instead rather than reusing a card about a different, broader beat.
- `sphinx-cleared-from-sand` (-1400, Thutmose IV's dream stele) is genuinely in scope — an act of
  a pharaoh — but is not on the spine and was left out rather than added purely to pad size; the
  deck was already at 34 without it.

## Known crowding kept on purpose

Two pairs sit under 8 years apart, both inside Cleopatra's own story and both structurally
unavoidable given the scope rule's own endpoint:

- `cleopatra-vii-reign` (-51) and `cleopatra-caesar-alliance` (-48) — 3 years.
- `battle-actium` (-31) and `death-cleopatra` (-30) — 1 year.

Cleopatra's accession, her alliance with Caesar, her defeat at Actium and her death are four of
the theme's most legible beats and also the scope rule's own explicit endpoint; dropping any of
them to fix the spacing would cut the theme's most recognisable material for a spacing rule that
`theme-gap` itself treats as advisory. `clockwork.md` keeps an analogous pair (`si-second-caesium`
and `utc-leap-second`, 5 years apart) for the same reason: the two ends of a single story cannot
be moved apart without breaking the story.

## Still missing from the catalogue

Real gaps that were not written because they collide with a card already in the 34, or because
the beat is already told by a card kept above:

- **Thutmose IV's Dream Stele** (`sphinx-cleared-from-sand`, -1400) — a genuine in-scope act, left
  in the catalogue rather than added to the deck; see "Existing catalogue cards left out" above.
- **The Amarna letters / Akhenaten's foreign correspondence** — folds into
  `akhenaten-religious-revolution`, which already carries the reign.
- **Ramesses XI and the collapse into the Third Intermediate Period**, and **Shoshenq I founding
  Dynasty 22** — real beats, cut above for thinness once the deck passed 30; a future edit could
  restore either without touching anything else, since neither collides with a kept card.
- **Amasis II's prosperous reign** and **the fall of Nectanebo II's predecessors** — likewise real
  and likewise cut for thinness rather than collision.
- **Necho II at Carchemish** — the more consequential of the two Necho II beats; cut for crowding
  against Josiah, see above. The best single card this theme does not have room for.
